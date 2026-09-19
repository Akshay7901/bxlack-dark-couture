import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

const checkoutSchema = z.object({
  address: addressSchema,
  lines: z.array(lineSchema).min(1).max(50),
});

/**
 * Creates an order from the cart. Prices/names/images are looked up
 * server-side from the products table (keyed by slug) rather than trusted
 * from the client, so a shopper can't tamper with what they're charged.
 */
export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => checkoutSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ orderId: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const slugs = Array.from(new Set(data.lines.map((l) => l.productId)));
    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select("id, slug, name, price, image_path, card_image_path")
      .in("slug", slugs);
    if (productsError) throw new Error("Could not load products");

    const bySlug = new Map((products ?? []).map((p) => [p.slug, p]));
    const items = data.lines.map((l) => {
      const p = bySlug.get(l.productId);
      if (!p) throw new Error(`Product not found: ${l.productId}`);
      return {
        product_id: p.id,
        product_name: p.name,
        image_path: p.card_image_path ?? p.image_path,
        size: l.size,
        quantity: l.qty,
        price: p.price,
      };
    });

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: context.userId,
        total,
        full_name: data.address.full_name,
        phone: data.address.phone ?? null,
        address_line1: data.address.line1,
        address_line2: data.address.line2 ?? null,
        city: data.address.city,
        state: data.address.state ?? null,
        postal_code: data.address.postal_code,
        country: data.address.country,
      })
      .select("id")
      .single();
    if (orderError || !order) throw new Error("Could not create order");

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(items.map((i) => ({ ...i, order_id: order.id })));
    if (itemsError) throw new Error("Order created but items failed to save");

    return { orderId: order.id };
  });
