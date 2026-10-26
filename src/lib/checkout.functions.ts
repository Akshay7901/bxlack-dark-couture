import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { friendlyDbError } from "@/lib/admin-guard";

const addressSchema = z.object({
  full_name: z.string().trim().min(1).max(200),
  phone: z.string().trim().max(30).nullable().optional(),
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).nullable().optional(),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().max(100).nullable().optional(),
  postal_code: z.string().trim().min(1).max(20),
  country: z.string().trim().min(1).max(100),
});

const lineSchema = z.object({
  productId: z.string().min(1),
  size: z.string().min(1),
  qty: z.number().int().min(1).max(10),
});

const codeSchema = z.string().trim().min(2).max(40).nullable().optional();

const checkoutSchema = z.object({
  address: addressSchema,
  lines: z.array(lineSchema).min(1).max(50),
  discountCode: codeSchema,
});

type Line = z.infer<typeof lineSchema>;

/**
 * Prices the cart from the products table (keyed by slug) rather than
 * trusting the client, so a shopper can't tamper with what they're charged.
 */
async function priceLines(admin: SupabaseClient<Database>, lines: Line[]) {
  const slugs = Array.from(new Set(lines.map((l) => l.productId)));
  const { data: products, error } = await admin
    .from("products")
    .select("id, slug, name, price, image_path, card_image_path, published")
    .in("slug", slugs);
  if (error) throw new Error("Could not load products");

  const bySlug = new Map((products ?? []).map((p) => [p.slug, p]));
  const items = lines.map((l) => {
    const p = bySlug.get(l.productId);
    if (!p || !p.published) throw new Error("An item in your bag is no longer available");
    return {
      product_id: p.id,
      product_name: p.name,
      image_path: p.card_image_path ?? p.image_path,
      size: l.size,
      quantity: l.qty,
      price: p.price,
    };
  });
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  return { items, subtotal };
}

const stockPayload = (items: Awaited<ReturnType<typeof priceLines>>["items"]) =>
  items.map((i) => ({
    product_id: i.product_id,
    size: i.size,
    quantity: i.quantity,
    name: i.product_name,
  }));

/** Checks a discount code against the current bag without using it up. */
export const previewDiscount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ code: z.string().trim().min(2).max(40), lines: z.array(lineSchema).min(1).max(50) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { subtotal } = await priceLines(supabaseAdmin, data.lines);
    const { data: amount, error } = await supabaseAdmin.rpc("apply_discount_code", {
      p_code: data.code,
      p_subtotal: subtotal,
      p_redeem: false,
    });
    if (error) throw new Error(friendlyDbError(error.message, "Could not check this code"));
    return { code: data.code.toUpperCase(), amount: Number(amount ?? 0), subtotal };
  });

/**
 * Creates an order from the bag: redeems the discount code, reserves stock,
 * then writes the order. Any step failing undoes the steps before it, so a
 * failed checkout never leaves stock held or a code use consumed.
 */
export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => checkoutSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ orderId: string; orderNumber: number }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { items, subtotal } = await priceLines(supabaseAdmin, data.lines);
    const code = data.discountCode?.trim().toUpperCase() || null;

    let discount = 0;
    if (code) {
      const { data: amount, error } = await supabaseAdmin.rpc("apply_discount_code", {
        p_code: code,
        p_subtotal: subtotal,
        p_redeem: true,
      });
      if (error) throw new Error(friendlyDbError(error.message, "Could not apply discount code"));
      discount = Number(amount ?? 0);
    }
    const releaseCode = async () => {
      if (code) await supabaseAdmin.rpc("release_discount_code", { p_code: code });
    };

    const { error: stockError } = await supabaseAdmin.rpc("adjust_stock", {
      p_items: stockPayload(items),
      p_direction: -1,
    });
    if (stockError) {
      await releaseCode();
      throw new Error(friendlyDbError(stockError.message, "Could not reserve stock"));
    }
    const restock = () =>
      supabaseAdmin.rpc("adjust_stock", { p_items: stockPayload(items), p_direction: 1 });

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: context.userId,
        subtotal,
        discount_code: code,
        discount_amount: discount,
        total: subtotal - discount,
        payment_method: "cod",
        stock_deducted: true,
        full_name: data.address.full_name,
        phone: data.address.phone ?? null,
        address_line1: data.address.line1,
        address_line2: data.address.line2 ?? null,
        city: data.address.city,
        state: data.address.state ?? null,
        postal_code: data.address.postal_code,
        country: data.address.country,
      })
      .select("id, order_number")
      .single();
    if (orderError || !order) {
      await restock();
      await releaseCode();
      throw new Error("Could not create order");
    }

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(items.map((i) => ({ ...i, order_id: order.id })));
    if (itemsError) {
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      await restock();
      await releaseCode();
      throw new Error("Could not create order");
    }

    // Confirmation to the customer + alert to the store; never blocks the order.
    const { notifyOrderPlaced } = await import("@/lib/email/notify.server");
    await notifyOrderPlaced(order.id);

    return { orderId: order.id, orderNumber: order.order_number };
  });
