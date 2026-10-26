import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertCallerIsAdmin } from "@/lib/admin-guard";

/** Units at or below this count show up as low stock on the dashboard. */
export const LOW_STOCK_THRESHOLD = 3;

export type DashboardStats = {
  revenue: { today: number; week: number; month: number };
  orders: { today: number; week: number; month: number };
  averageOrderValue: number;
  toFulfil: number;
  returnsToReview: number;
  unreadMessages: number;
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
      supabaseAdmin
        .from("orders")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending", "processing"]),
      supabaseAdmin
        .from("return_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "requested"),
      supabaseAdmin
        .from("contact_messages")
        .select("id", { count: "exact", head: true })
        .neq("status", "read"),
      supabaseAdmin
        .from("product_inventory")
        .select("size, quantity, products(name)")
        .lte("quantity", LOW_STOCK_THRESHOLD)
        .order("quantity", { ascending: true }),
    ]);
    if (ordersRes.error) throw new Error("Could not load dashboard");

    // Cancelled orders aren't sales.
    const sales = (ordersRes.data ?? []).filter((o) => o.status !== "cancelled");
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
      toFulfil: openRes.count ?? 0,
      returnsToReview: returnsRes.count ?? 0,
      unreadMessages: messagesRes.count ?? 0,
      lowStock: (inventoryRes.data ?? []).slice(0, 12).map((r) => ({
        productName: r.products?.name ?? "Unknown product",
        size: r.size,
        quantity: r.quantity,
      })),
      topProducts: [...products.entries()]
        .map(([productName, p]) => ({ productName, ...p }))
        .sort((a, b) => b.units - a.units)
        .slice(0, 5),
      recentOrders: (ordersRes.data ?? []).slice(0, 6).map((o) => ({
        id: o.id,
        orderNumber: o.order_number,
        name: o.full_name ?? "Customer",
        total: Number(o.total),
        status: o.status,
        createdAt: o.created_at,
      })),
    };
  });
