import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

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
  status: string;
  total: number;
  createdAt: string;
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

async function assertCallerIsAdmin(supabase: SupabaseClient<Database>, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}

/** Every order across every customer, with items and the placing customer's
 * email resolved — plain RLS can't join to auth.users, so this goes through
 * the service-role client instead. */
export const listOrdersForAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminOrder[]> => {
    await assertCallerIsAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: orders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select(
        "id, user_id, status, total, created_at, full_name, phone, address_line1, address_line2, city, state, postal_code, country",
      )
      .order("created_at", { ascending: false });
    if (ordersError) throw new Error("Could not load orders");
    if (!orders || orders.length === 0) return [];

    const { data: items, error: itemsError } = await supabaseAdmin
      .from("order_items")
      .select("id, order_id, product_name, image_path, size, quantity, price")
      .in(
        "order_id",
        orders.map((o) => o.id),
      );
    if (itemsError) throw new Error("Could not load order items");

    const { data: users } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const emails = new Map((users?.users ?? []).map((u) => [u.id, u.email ?? "unknown"]));

    return orders.map((o) => ({
      id: o.id,
      status: o.status,
      total: o.total,
      createdAt: o.created_at,
      email: emails.get(o.user_id) ?? "unknown",
      fullName: o.full_name,
      phone: o.phone,
      addressLine1: o.address_line1,
      addressLine2: o.address_line2,
      city: o.city,
      state: o.state,
      postalCode: o.postal_code,
      country: o.country,
      items: (items ?? [])
        .filter((i) => i.order_id === o.id)
        .map((i) => ({
          id: i.id,
          productName: i.product_name,
          imagePath: i.image_path,
          size: i.size,
          quantity: i.quantity,
          price: i.price,
        })),
    }));
  });
