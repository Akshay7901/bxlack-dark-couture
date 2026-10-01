import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

// Every dummy row is tagged with this prefix so it can be found and removed.
const TAG = "TEST ";

async function assertCallerIsAdmin(supabase: SupabaseClient<Database>, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

const ORDERS = [
  {
    status: "pending",
    created_at: hoursAgo(2),
    full_name: `${TAG}Riya Sharma`,
    phone: "+91 98765 43210",
    address_line1: "14 Linking Road",
    address_line2: "Flat 3B",
    city: "Mumbai",
    state: "Maharashtra",
    postal_code: "400050",
    country: "India",
    items: [{ product_name: `${TAG}Venus Tee`, size: "M", quantity: 1, price: 4999 }],
  },
  {
    status: "shipped",
    created_at: hoursAgo(48),
    full_name: `${TAG}Arjun Mehta`,
    phone: "+91 91234 56789",
    address_line1: "22 MG Road",
    address_line2: null,
    city: "Bengaluru",
    state: "Karnataka",
    postal_code: "560001",
    country: "India",
    items: [
      { product_name: `${TAG}Shipwreck Tee`, size: "L", quantity: 1, price: 4999 },
      { product_name: `${TAG}Stone Tee`, size: "XL", quantity: 1, price: 5999 },
    ],
  },
  {
    status: "delivered",
    created_at: hoursAgo(144),
    full_name: `${TAG}Kabir Singh`,
    phone: "+91 99887 76655",
    address_line1: "7 Hauz Khas Village",
    address_line2: "Near Deer Park",
    city: "New Delhi",
    state: "Delhi",
    postal_code: "110016",
    country: "India",
    items: [{ product_name: `${TAG}Heritage Shirt Fuji`, size: "M", quantity: 1, price: 6499 }],
  },
];

/** Inserts 3 dummy orders and 3 dummy contact messages for testing the studio. */
export const seedTestData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertCallerIsAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Orders must belong to a real account; prefer a non-admin one.
    const { data: users } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const { data: admins } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    const adminIds = new Set((admins ?? []).map((a) => a.user_id));
    const owner =
      (users?.users ?? []).find((u) => !adminIds.has(u.id))?.id ?? context.userId;

    const orderIds: string[] = [];
    for (const { items, ...order } of ORDERS) {
      const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const { data: created, error } = await supabaseAdmin
        .from("orders")
        .insert({ ...order, user_id: owner, total })
        .select("id")
        .single();
      if (error || !created) throw new Error("Could not create test orders");
      orderIds.push(created.id);

      const { error: itemsError } = await supabaseAdmin
        .from("order_items")
        .insert(items.map((i) => ({ ...i, order_id: created.id })));
      if (itemsError) throw new Error("Could not create test order items");
    }

    const { error: messagesError } = await supabaseAdmin.from("contact_messages").insert([
      {
        name: `${TAG}Riya Sharma`,
        email: "riya.test@example.com",
        order_number: orderIds[0].slice(0, 8),
        message:
          "Hi, I placed an order a couple of hours ago. Can I change the size from M to L before it ships?",
        status: "new",
        created_at: hoursAgo(1),
      },
      {
        name: `${TAG}Arjun Mehta`,
        email: "arjun.test@example.com",
        order_number: null,
        message:
          "Do you ship internationally? I'm based in Dubai and would love to order the Shipwreck Tee.",
        status: "new",
        created_at: hoursAgo(24),
      },
      {
        name: `${TAG}Kabir Singh`,
        email: "kabir.test@example.com",
        order_number: orderIds[2].slice(0, 8),
        message:
          "Received my Heritage Shirt — the quality is amazing. Will there be more colours in the next drop?",
        status: "read",
        created_at: hoursAgo(72),
      },
    ]);
    if (messagesError) throw new Error("Could not create test messages");

    return { ok: true };
  });

/** Deletes every dummy order (items cascade) and contact message. */
export const clearTestData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertCallerIsAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error: ordersError } = await supabaseAdmin
      .from("orders")
      .delete()
      .like("full_name", `${TAG}%`);
    const { error: messagesError } = await supabaseAdmin
      .from("contact_messages")
      .delete()
      .like("name", `${TAG}%`);
    if (ordersError || messagesError) throw new Error("Could not remove test data");
    return { ok: true };
  });
