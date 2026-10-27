import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertCan, listAllUsers } from "@/lib/admin-guard";
import { ORDER_STATUSES } from "@/lib/orders";

export type AdminOrderItem = {
  id: string;
  productName: string;
  imagePath: string | null;
  size: string | null;
  quantity: number;
  price: number;
};

export type AdminOrder = {
  id: string;
  orderNumber: number;
  userId: string;
  status: string;
  total: number;
  subtotal: number;
  discountCode: string | null;
  discountAmount: number;
  paymentMethod: string;
  createdAt: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  courier: string | null;
  trackingNumber: string | null;
  note: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  items: AdminOrderItem[];
};

/** Every order across every customer, with items, the placing customer's
 * email and the internal note resolved — plain RLS can't join to auth.users,
 * so this goes through the service-role client instead. */
export const listOrdersForAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminOrder[]> => {
    await assertCan(context.supabase, context.userId, "orders");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: orders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select(
        "id, order_number, user_id, status, total, subtotal, discount_code, discount_amount, payment_method, created_at, shipped_at, delivered_at, courier, tracking_number, full_name, phone, address_line1, address_line2, city, state, postal_code, country, order_items(id, product_name, image_path, size, quantity, price), order_notes(note)",
      )
      .order("created_at", { ascending: false });
    if (ordersError) throw new Error("Could not load orders");
    if (!orders || orders.length === 0) return [];

    const users = await listAllUsers(supabaseAdmin);
    const emails = new Map(users.map((u) => [u.id, u.email ?? "unknown"]));

    return orders.map((o) => ({
      id: o.id,
      orderNumber: o.order_number,
      userId: o.user_id,
      status: o.status,
      total: Number(o.total),
      subtotal: Number(o.subtotal ?? o.total),
      discountCode: o.discount_code,
      discountAmount: Number(o.discount_amount ?? 0),
      paymentMethod: o.payment_method,
      createdAt: o.created_at,
      shippedAt: o.shipped_at,
      deliveredAt: o.delivered_at,
      courier: o.courier,
      trackingNumber: o.tracking_number,
      note: o.order_notes?.note ?? "",
      email: emails.get(o.user_id) ?? "unknown",
      fullName: o.full_name,
      phone: o.phone,
      addressLine1: o.address_line1,
      addressLine2: o.address_line2,
      city: o.city,
      state: o.state,
      postalCode: o.postal_code,
      country: o.country,
      items: (o.order_items ?? []).map((i) => ({
        id: i.id,
        productName: i.product_name,
        imagePath: i.image_path,
        size: i.size,
        quantity: i.quantity,
        price: Number(i.price),
      })),
    }));
  });

/** Changes an order's status and emails the customer about shipped,
 * delivered and cancelled orders. Stock is restored by a database trigger
 * when an order is cancelled. */
export const setOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ orderId: z.string().uuid(), status: z.enum(ORDER_STATUSES) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertCan(context.supabase, context.userId, "orders");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: before } = await supabaseAdmin
      .from("orders")
      .select("status")
      .eq("id", data.orderId)
      .maybeSingle();
    if (!before) throw new Error("Order not found");
    if (before.status === data.status) return { ok: true };

    const { error } = await supabaseAdmin
      .from("orders")
      .update({ status: data.status })
      .eq("id", data.orderId);
    if (error) throw new Error("Could not update order");

    const { notifyOrderStatus } = await import("@/lib/email/notify.server");
    await notifyOrderStatus(data.orderId, data.status);
    return { ok: true };
  });

/** Saves shipping details (shown to the customer) and the internal note (admins only). */
export const updateOrderFulfillment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        orderId: z.string().uuid(),
        courier: z.string().trim().max(100).nullable(),
        trackingNumber: z.string().trim().max(100).nullable(),
        note: z.string().trim().max(5000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertCan(context.supabase, context.userId, "orders");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("orders")
      .update({ courier: data.courier || null, tracking_number: data.trackingNumber || null })
      .eq("id", data.orderId);
    if (error) throw new Error("Could not save shipping details");

    const { error: noteError } = await supabaseAdmin
      .from("order_notes")
      .upsert({ order_id: data.orderId, note: data.note }, { onConflict: "order_id" });
    if (noteError) throw new Error("Could not save note");
    return { ok: true };
  });
