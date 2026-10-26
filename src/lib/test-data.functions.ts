import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertCallerIsAdmin, listAllUsers } from "@/lib/admin-guard";

// Every dummy row is tagged with this prefix so it can be found and removed.
const TAG = "TEST ";

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

type TestItem = { product_name: string; size: string; quantity: number; price: number };
type TestRequest = {
  type: "return" | "exchange";
  status: "requested" | "approved" | "rejected" | "picked_up" | "completed";
  reason: string;
  details: string | null;
  admin_note: string | null;
  /** New size per item for exchanges, in item order. */
  exchangeSizes?: string[];
  created_at: string;
};
type TestOrder = {
  status: string;
  created_at: string;
  delivered_at?: string;
  shipped_at?: string;
  courier?: string;
  tracking_number?: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  items: TestItem[];
  request?: TestRequest;
};

const ORDERS: TestOrder[] = [
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
    items: [{ product_name: `${TAG}Venus Tee`, size: "M", quantity: 1, price: 4999 }],
  },
  {
    status: "processing",
    created_at: hoursAgo(20),
    full_name: `${TAG}Ishaan Verma`,
    phone: "+91 90000 11223",
    address_line1: "3 Park Street",
    address_line2: null,
    city: "Kolkata",
    state: "West Bengal",
    postal_code: "700016",
    items: [{ product_name: `${TAG}Stone Tee`, size: "L", quantity: 2, price: 5999 }],
  },
  {
    status: "shipped",
    created_at: hoursAgo(48),
    shipped_at: hoursAgo(30),
    courier: "Delhivery",
    tracking_number: "DL4829301746IN",
    full_name: `${TAG}Arjun Mehta`,
    phone: "+91 91234 56789",
    address_line1: "22 MG Road",
    address_line2: null,
    city: "Bengaluru",
    state: "Karnataka",
    postal_code: "560001",
    items: [
      { product_name: `${TAG}Shipwreck Tee`, size: "L", quantity: 1, price: 4999 },
      { product_name: `${TAG}Stone Tee`, size: "XL", quantity: 1, price: 5999 },
    ],
  },
  {
    status: "cancelled",
    created_at: hoursAgo(96),
    full_name: `${TAG}Sana Khan`,
    phone: "+91 98111 22334",
    address_line1: "18 Banjara Hills",
    address_line2: "Road No. 12",
    city: "Hyderabad",
    state: "Telangana",
    postal_code: "500034",
    items: [{ product_name: `${TAG}Heritage Shirt Fuji`, size: "S", quantity: 1, price: 6499 }],
  },
  {
    // Delivered with no request yet — use it to try the customer's return/exchange form.
    status: "delivered",
    created_at: hoursAgo(144),
    shipped_at: hoursAgo(120),
    delivered_at: hoursAgo(48),
    courier: "Blue Dart",
    tracking_number: "BD7713025591",
    full_name: `${TAG}Kabir Singh`,
    phone: "+91 99887 76655",
    address_line1: "7 Hauz Khas Village",
    address_line2: "Near Deer Park",
    city: "New Delhi",
    state: "Delhi",
    postal_code: "110016",
    items: [{ product_name: `${TAG}Heritage Shirt Fuji`, size: "M", quantity: 1, price: 6499 }],
  },
  {
    status: "delivered",
    created_at: hoursAgo(130),
    shipped_at: hoursAgo(110),
    delivered_at: hoursAgo(60),
    courier: "Delhivery",
    tracking_number: "DL5510298834IN",
    full_name: `${TAG}Meera Iyer`,
    phone: "+91 98400 55667",
    address_line1: "41 Besant Nagar",
    address_line2: "2nd Avenue",
    city: "Chennai",
    state: "Tamil Nadu",
    postal_code: "600090",
    items: [{ product_name: `${TAG}Venus Tee`, size: "S", quantity: 1, price: 4999 }],
    request: {
      type: "return",
      status: "requested",
      reason: "Not as expected",
      details: "The fabric feels heavier than I expected for summer.",
      admin_note: null,
      created_at: hoursAgo(10),
    },
  },
  {
    status: "delivered",
    created_at: hoursAgo(160),
    shipped_at: hoursAgo(140),
    delivered_at: hoursAgo(80),
    courier: "Delhivery",
    tracking_number: "DL6602184477IN",
    full_name: `${TAG}Dev Patel`,
    phone: "+91 99090 33445",
    address_line1: "9 CG Road",
    address_line2: "Near Swastik Cross",
    city: "Ahmedabad",
    state: "Gujarat",
    postal_code: "380009",
    items: [{ product_name: `${TAG}Shipwreck Tee`, size: "L", quantity: 1, price: 4999 }],
    request: {
      type: "exchange",
      status: "requested",
      reason: "Size doesn't fit",
      details: "Tight across the shoulders — XL should be right.",
      admin_note: null,
      exchangeSizes: ["XL"],
      created_at: hoursAgo(6),
    },
  },
  {
    status: "delivered",
    created_at: hoursAgo(170),
    shipped_at: hoursAgo(150),
    delivered_at: hoursAgo(100),
    courier: "Blue Dart",
    tracking_number: "BD7713099120",
    full_name: `${TAG}Ananya Rao`,
    phone: "+91 97400 88990",
    address_line1: "27 Indiranagar",
    address_line2: "100 Feet Road",
    city: "Bengaluru",
    state: "Karnataka",
    postal_code: "560038",
    items: [
      { product_name: `${TAG}Stone Tee`, size: "M", quantity: 1, price: 5999 },
      { product_name: `${TAG}Venus Tee`, size: "M", quantity: 1, price: 4999 },
    ],
    request: {
      type: "exchange",
      status: "approved",
      reason: "Size doesn't fit",
      details: "Both run a little large on me.",
      admin_note: "Pickup scheduled for Monday, 10am–6pm. Keep both pieces packed in their tubes.",
      exchangeSizes: ["S", "S"],
      created_at: hoursAgo(40),
    },
  },
  {
    status: "delivered",
    created_at: hoursAgo(200),
    shipped_at: hoursAgo(180),
    delivered_at: hoursAgo(150),
    courier: "Delhivery",
    tracking_number: "DL7790011223IN",
    full_name: `${TAG}Rohan Kapoor`,
    phone: "+91 98200 44556",
    address_line1: "5 Sector 17",
    address_line2: null,
    city: "Chandigarh",
    state: "Chandigarh",
    postal_code: "160017",
    items: [{ product_name: `${TAG}Shipwreck Tee`, size: "M", quantity: 1, price: 4999 }],
    request: {
      type: "return",
      status: "completed",
      reason: "Changed my mind",
      details: null,
      admin_note: "Refund of ₹4,899 processed (₹100 logistics charge deducted).",
      created_at: hoursAgo(120),
    },
  },
];

/** Inserts dummy orders (every status), return and exchange requests, and
 * contact messages for testing the studio. */
export const seedTestData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertCallerIsAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Orders must belong to a real account; prefer a non-admin one.
    const users = await listAllUsers(supabaseAdmin);
    const { data: admins } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "admin");
    const adminIds = new Set((admins ?? []).map((a) => a.user_id));
    const owner = users.find((u) => !adminIds.has(u.id))?.id ?? context.userId;

    const created: { id: string; orderNumber: number }[] = [];
    let returns = 0;
    let exchanges = 0;

    for (const { items, request, ...order } of ORDERS) {
      const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const { data: row, error } = await supabaseAdmin
        .from("orders")
        .insert({ ...order, country: "India", user_id: owner, subtotal: total, total })
        .select("id, order_number")
        .single();
      if (error || !row) {
        throw new Error(`Could not create test orders: ${error?.message ?? "unknown error"}. Check the database migrations have been applied.`);
      }
      created.push({ id: row.id, orderNumber: row.order_number });

      const { data: itemRows, error: itemsError } = await supabaseAdmin
        .from("order_items")
        .insert(items.map((i) => ({ ...i, order_id: row.id })))
        .select("id, product_name, size, quantity");
      if (itemsError || !itemRows) throw new Error(`Could not create test order items: ${itemsError?.message ?? "unknown error"}`);

      if (request) {
        const { exchangeSizes, ...rest } = request;
        const { error: requestError } = await supabaseAdmin.from("return_requests").insert({
          ...rest,
          order_id: row.id,
          user_id: owner,
          items: itemRows.map((i, idx) => ({
            orderItemId: i.id,
            productName: i.product_name,
            size: i.size,
            quantity: i.quantity,
            exchangeSize: request.type === "exchange" ? (exchangeSizes?.[idx] ?? null) : null,
          })),
        });
        if (requestError) throw new Error(`Could not create test return/exchange requests: ${requestError.message}`);
        if (request.type === "exchange") exchanges++;
        else returns++;
      }
    }

    const { error: messagesError } = await supabaseAdmin.from("contact_messages").insert([
      {
        name: `${TAG}Riya Sharma`,
        email: "riya.test@example.com",
        order_number: String(created[0].orderNumber),
        message: "Hi, I placed an order a couple of hours ago. Can I change the size from M to L before it ships?",
        status: "new",
        created_at: hoursAgo(1),
      },
      {
        name: `${TAG}Arjun Mehta`,
        email: "arjun.test@example.com",
        order_number: null,
        message: "Do you ship internationally? I'm based in Dubai and would love to order the Shipwreck Tee.",
        status: "new",
        created_at: hoursAgo(24),
      },
      {
        name: `${TAG}Kabir Singh`,
        email: "kabir.test@example.com",
        order_number: String(created[4].orderNumber),
        message: "Received my Heritage Shirt — the quality is amazing. Will there be more colours in the next drop?",
        status: "read",
        created_at: hoursAgo(72),
      },
    ]);
    if (messagesError) throw new Error(`Could not create test messages: ${messagesError.message}`);

    return { orders: created.length, returns, exchanges, messages: 3 };
  });

/** Deletes every dummy order (items, notes and return/exchange requests
 * cascade with it) and contact message. */
export const clearTestData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertCallerIsAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error: ordersError } = await supabaseAdmin.from("orders").delete().like("full_name", `${TAG}%`);
    const { error: messagesError } = await supabaseAdmin.from("contact_messages").delete().like("name", `${TAG}%`);
    if (ordersError || messagesError) throw new Error("Could not remove test data");
    return { ok: true };
  });
