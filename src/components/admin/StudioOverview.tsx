import { useQuery } from "@tanstack/react-query";
import { getDashboardStats, LOW_STOCK_THRESHOLD } from "@/lib/dashboard.functions";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const labelClass = "font-mono text-[10px] uppercase tracking-[0.28em] text-neutral-500";

type Target = "orders" | "returns" | "exchanges" | "messages" | "products";

export function StudioOverview({ onNavigate }: { onNavigate: (key: Target) => void }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => getDashboardStats(),
  });

  if (isLoading) {
    return <p className="py-10 font-mono text-[12px] uppercase tracking-[0.3em] text-neutral-500">Loading…</p>;
  }
  if (error || !data) {
    return (
      <p className="py-10 font-mono text-[12px] uppercase tracking-[0.3em] text-red-600">
        {(error as Error)?.message ?? "Could not load dashboard"}
      </p>
    );
  }

  const todos = [
    { count: data.toFulfil, label: "orders to fulfil", target: "orders" as const },
    { count: data.returnsToReview, label: "returns to review", target: "returns" as const },
    { count: data.exchangesToReview, label: "exchanges to review", target: "exchanges" as const },
    { count: data.unreadMessages, label: "unread messages", target: "messages" as const },
    { count: data.lowStock.length, label: "sizes low on stock", target: "products" as const },
  ].filter((t) => t.count > 0);

  return (
    <section className="space-y-10">
      <div>
        <h2 className="font-display text-xl uppercase tracking-[-0.01em] text-neutral-900">Overview</h2>
        <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-500">
          Real orders only · sales exclude cancelled orders
          {data.testOrdersHidden > 0
            ? ` · ${data.testOrdersHidden} test ${data.testOrdersHidden === 1 ? "order" : "orders"} hidden`
            : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Revenue today" value={inr(data.revenue.today)} sub={`${data.orders.today} orders`} />
        <Stat label="Last 7 days" value={inr(data.revenue.week)} sub={`${data.orders.week} orders`} />
        <Stat label="Last 30 days" value={inr(data.revenue.month)} sub={`${data.orders.month} orders`} />
        <Stat label="Avg. order value" value={inr(data.averageOrderValue)} sub="Last 30 days" />
      </div>

      <div>
        <p className={labelClass}>To do</p>
        {todos.length === 0 ? (
          <p className="mt-3 font-mono text-[12px] text-neutral-500">All caught up.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {todos.map((t) => (
              <button
                key={t.label}
                onClick={() => onNavigate(t.target)}
                className="border border-black/15 px-4 py-2.5 text-left font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-700 transition-colors hover:border-black hover:text-black"
              >
                <span className="text-black">{t.count}</span> {t.label} →
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <p className={labelClass}>Best sellers · 30 days</p>
          <div className="mt-3 divide-y divide-black/10 border-y border-black/10">
            {data.topProducts.length === 0 ? (
              <p className="py-4 font-mono text-[12px] text-neutral-500">No sales yet.</p>
            ) : (
              data.topProducts.map((p) => (
                <div key={p.productName} className="flex items-baseline justify-between gap-4 py-3">
                  <span className="truncate font-sans text-[13px] text-neutral-900">{p.productName}</span>
                  <span className="shrink-0 font-mono text-[11px] text-neutral-500">
                    {p.units} sold · {inr(p.revenue)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <p className={labelClass}>Low stock · {LOW_STOCK_THRESHOLD} or fewer</p>
          <div className="mt-3 divide-y divide-black/10 border-y border-black/10">
            {data.lowStock.length === 0 ? (
              <p className="py-4 font-mono text-[12px] text-neutral-500">Stock levels look healthy.</p>
            ) : (
              data.lowStock.map((s) => (
                <div key={`${s.productName}-${s.size}`} className="flex items-baseline justify-between gap-4 py-3">
                  <span className="truncate font-sans text-[13px] text-neutral-900">
                    {s.productName} · {s.size}
                  </span>
                  <span
                    className={`shrink-0 font-mono text-[11px] ${s.quantity === 0 ? "text-red-600" : "text-amber-600"}`}
                  >
                    {s.quantity === 0 ? "Sold out" : `${s.quantity} left`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div>
        <p className={labelClass}>Recent orders</p>
        <div className="mt-3 divide-y divide-black/10 border-y border-black/10">
          {data.recentOrders.length === 0 ? (
            <p className="py-4 font-mono text-[12px] text-neutral-500">No orders in the last 30 days.</p>
          ) : (
            data.recentOrders.map((o) => (
              <button
                key={o.id}
                onClick={() => onNavigate("orders")}
                className="flex w-full items-baseline justify-between gap-4 py-3 text-left hover:bg-black/[0.02]"
              >
                <span className="truncate font-sans text-[13px] text-neutral-900">
                  #{o.orderNumber} · {o.name}
                </span>
                <span className="shrink-0 font-mono text-[11px] text-neutral-500">
                  {inr(o.total)} · {o.status}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="border border-black/10 bg-black/[0.02] p-4">
      <p className={labelClass}>{label}</p>
      <p className="mt-3 font-display text-2xl tracking-[-0.01em] text-neutral-900">{value}</p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400">{sub}</p>
    </div>
  );
}
