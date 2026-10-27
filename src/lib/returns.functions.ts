import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertCan } from "@/lib/admin-guard";
import {
  RETURN_REASONS,
  RETURN_STATUSES,
  RETURN_TYPES,
  isCancellable,
  returnEligibility,
  type ReturnRequestItem,
} from "@/lib/returns";

const createSchema = z.object({
  orderId: z.string().uuid(),
  type: z.enum(RETURN_TYPES),
  items: z
    .array(
      z.object({
        orderItemId: z.string().uuid(),
        exchangeSize: z.string().trim().min(1).max(10).nullable().optional(),
      }),
    )
    .min(1)
    .max(50),
  reason: z.enum(RETURN_REASONS),
  details: z.string().trim().max(1000).nullable().optional(),
  // Customer must agree to send back the original packing tube (or accept the
  // tube charge); requests without this agreement are refused.
  tubeAcknowledged: z.literal(true, {
    errorMap: () => ({ message: "Please confirm the packing tube terms to continue." }),
  }),
});

/** Customer requests a return or exchange for a delivered order. Every policy
 * rule is re-checked here so the request can't be forced from the browser. */
export const createReturnRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id, user_id, status, delivered_at, country, order_items(id, product_name, size, quantity)")
      .eq("id", data.orderId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error("Could not load order");
    if (!order) throw new Error("Order not found");

    const eligibility = returnEligibility(order);
    if (!eligibility.eligible) throw new Error(eligibility.reason);

    const orderItems = new Map((order.order_items ?? []).map((i) => [i.id, i]));
    const items: ReturnRequestItem[] = data.items.map((i) => {
      const item = orderItems.get(i.orderItemId);
      if (!item) throw new Error("Item is not part of this order");
      if (data.type === "exchange" && !i.exchangeSize) {
        throw new Error(`Choose the size you want for ${item.product_name}`);
      }
      return {
        orderItemId: item.id,
        productName: item.product_name,
        size: item.size,
        quantity: item.quantity,
        exchangeSize: data.type === "exchange" ? (i.exchangeSize ?? null) : null,
      };
    });

    const { data: created, error: insertError } = await supabaseAdmin
      .from("return_requests")
      .insert({
        order_id: order.id,
        user_id: context.userId,
        type: data.type,
        items,
        reason: data.reason,
        details: data.details || null,
      })
      .select("id")
      .single();
    if (insertError || !created) {
      // 23505 = unique violation on order_id: the policy allows one request per order.
      if (insertError?.code === "23505") {
        throw new Error("A return or exchange has already been requested for this order.");
      }
      throw new Error("Could not submit your request");
    }

    const { notifyReturnCreated } = await import("@/lib/email/notify.server");
    await notifyReturnCreated(created.id);
    return { ok: true };
  });

/** Customer cancels their own order before it ships. */
export const cancelMyOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, status")
      .eq("id", data.orderId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!order) throw new Error("Order not found");
    if (!isCancellable(order.status)) {
      throw new Error("This order has already shipped and can no longer be cancelled.");
    }

    // Conditional on status so an order that ships at the same moment isn't cancelled.
    const { data: updated, error } = await supabaseAdmin
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", order.id)
      .in("status", ["pending", "processing"])
      .select("id");
    if (error) throw new Error("Could not cancel order");
    if (!updated?.length) throw new Error("This order can no longer be cancelled.");

    const { notifyOrderStatus } = await import("@/lib/email/notify.server");
    await notifyOrderStatus(order.id, "cancelled");
    return { ok: true };
  });

export type AdminReturnRequest = {
  id: string;
  orderId: string;
  orderNumber: number | null;
  type: string;
  status: string;
  reason: string;
  details: string | null;
  adminNote: string | null;
  items: ReturnRequestItem[];
  createdAt: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  address: string;
  orderTotal: number;
};

export const listReturnRequestsForAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminReturnRequest[]> => {
    await assertCan(context.supabase, context.userId, "returns");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: requests, error } = await supabaseAdmin
      .from("return_requests")
      .select(
        "id, order_id, user_id, type, status, reason, details, admin_note, items, created_at, orders(order_number, full_name, phone, address_line1, address_line2, city, state, postal_code, total)",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error("Could not load return requests");
    if (!requests?.length) return [];

    const { data: users } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const emails = new Map((users?.users ?? []).map((u) => [u.id, u.email ?? "unknown"]));

    return requests.map((r) => {
      const o = r.orders;
      return {
        id: r.id,
        orderId: r.order_id,
        orderNumber: o?.order_number ?? null,
        type: r.type,
        status: r.status,
        reason: r.reason,
        details: r.details,
        adminNote: r.admin_note,
        items: (r.items ?? []) as unknown as ReturnRequestItem[],
        createdAt: r.created_at,
        email: emails.get(r.user_id) ?? "unknown",
        fullName: o?.full_name ?? null,
        phone: o?.phone ?? null,
        address: o
          ? [o.address_line1, o.address_line2, o.city, o.state, o.postal_code].filter(Boolean).join(", ")
          : "",
        orderTotal: o?.total ?? 0,
      };
    });
  });

export const updateReturnRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(RETURN_STATUSES),
        adminNote: z.string().trim().max(1000).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertCan(context.supabase, context.userId, "returns");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: before } = await supabaseAdmin
      .from("return_requests")
      .select("status")
      .eq("id", data.id)
      .maybeSingle();
    if (!before) throw new Error("Request not found");

    const { error } = await supabaseAdmin
      .from("return_requests")
      .update({ status: data.status, admin_note: data.adminNote || null })
      .eq("id", data.id);
    if (error) throw new Error("Could not update request");

    // Email only on a status change, not when just the note is edited.
    if (before.status !== data.status) {
      const { notifyReturnUpdated } = await import("@/lib/email/notify.server");
      await notifyReturnUpdated(data.id);
    }
    return { ok: true };
  });
