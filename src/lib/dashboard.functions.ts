import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertCallerIsAdmin } from "@/lib/admin-guard";
import { isTestName } from "@/lib/test-data";

/** Units at or below this count show up as low stock on the dashboard. */
export const LOW_STOCK_THRESHOLD = 3;

export type DashboardStats = {
  revenue: { today: number; week: number; month: number };
  orders: { today: number; week: number; month: number };
  averageOrderValue: number;
  toFulfil: number;
  returnsToReview: number;
  exchangesToReview: number;
  unreadMessages: number;
  /** Dummy "TEST" orders in the last 30 days left out of these figures. */
  testOrdersHidden: number;
  lowStock: { productName: string; size: string; quantity: number }[];
  topProducts: { productName: string; units: number; revenue: number }[];
  recentOrders: { id: string; orderNumber: number; name: string; total: number; status: string; createdAt: string }[];
};

const DAY = 86_400_000;

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DashboardStats> => {
    await assertCallerIsAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const monthAgo = new Date(now - 30 * DAY).toISOString();

    const [ordersRes, openRes, returnsRes, messagesRes, inventoryRes] = await Promise.all([
      supabaseAdmin
        .from("orders")
        .select("id, order_number, status, total, created_at, full_name, order_items(product_name, quantity, price)")
        .gte("created_at", monthAgo)
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("orders").select("full_name").in("status", ["pending", "processing"]),
      supabaseAdmin.from("return_requests").select("type, orders(full_name)").eq("status", "requested"),
      supabaseAdmin.from("contact_messages").select("name").neq("status", "read"),
      supabaseAdmin
        .from("product_inventory")
        .select("size, quantity, products(name)")
        .lte("quantity", LOW_STOCK_THRESHOLD)
        .order("quantity", { ascending: true }),
    ]);
    if (ordersRes.error) throw new Error("Could not load dashboard");

    // Real figures only: dummy rows from "Add test data" are left out everywhere.
    const allRecent = ordersRes.data ?? [];
    const realRecent = allRecent.filter((o) => !isTestName(o.full_name));
    const openReturns = (returnsRes.data ?? []).filter((r) => !isTestName(r.orders?.full_name));

    // Cancelled orders aren't sales.
    const sales = realRecent.filter((o) => o.status !== "cancelled");
    const since = (ms: number) => sales.filter((o) => new Date(o.created_at).getTime() >= ms);
    const sum = (list: typeof sales) => list.reduce((s, o) => s + Number(o.total), 0);
    const today = since(startOfToday.getTime());
    const week = since(now - 7 * DAY);

    const products = new Map<string, { units: number; revenue: number }>();
    for (const o of sales) {
      for (const i of o.order_items ?? []) {
        const p = products.get(i.product_name) ?? { units: 0, revenue: 0 };
        p.units += i.quantity;
        p.revenue += Number(i.price) * i.quantity;
        products.set(i.product_name, p);
      }
    }

    return {
      revenue: { today: sum(today), week: sum(week), month: sum(sales) },
      orders: { today: today.length, week: week.length, month: sales.length },
      averageOrderValue: sales.length ? Math.round(sum(sales) / sales.length) : 0,
      toFulfil: (openRes.data ?? []).filter((o) => !isTestName(o.full_name)).length,
      returnsToReview: openReturns.filter((r) => r.type !== "exchange").length,
      exchangesToReview: openReturns.filter((r) => r.type === "exchange").length,
      unreadMessages: (messagesRes.data ?? []).filter((m) => !isTestName(m.name)).length,
      testOrdersHidden: allRecent.length - realRecent.length,
      lowStock: (inventoryRes.data ?? []).slice(0, 12).map((r) => ({
        productName: r.products?.name ?? "Unknown product",
        size: r.size,
        quantity: r.quantity,
      })),
      topProducts: [...products.entries()]
        .map(([productName, p]) => ({ productName, ...p }))
        .sort((a, b) => b.units - a.units)
        .slice(0, 5),
      recentOrders: realRecent.slice(0, 6).map((o) => ({
        id: o.id,
        orderNumber: o.order_number,
        name: o.full_name ?? "Customer",
        total: Number(o.total),
        status: o.status,
        createdAt: o.created_at,
      })),
    };
  });
