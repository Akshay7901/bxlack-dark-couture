import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { fetchOrders } from "@/lib/account";

export function OrdersSection() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => fetchOrders(),
  });

  return (
    <div>
      <h2 className="font-display text-xl uppercase tracking-[-0.01em]">Orders</h2>

      {isLoading ? (
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
          Loading…
        </p>
      ) : orders.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-4 border border-white/10 py-16 text-center">
          <Package size={22} className="text-white/25" />
          <p className="max-w-xs font-mono text-[11px] uppercase leading-relaxed tracking-[0.24em] text-white/40">
            No orders yet — once you place an order it'll show up here
          </p>
          <Link
            to="/shop"
            search={{ type: "All" }}
            className="mt-2 font-mono text-[10px] uppercase tracking-[0.28em] text-white/70 underline underline-offset-4 hover:text-white"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="border border-white/10 bg-white/[0.02] p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/70">
                  Order #{o.id.slice(0, 8)}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                  {new Date(o.created_at).toLocaleDateString()} · {o.status}
                </p>
              </div>
              <div className="mt-3 space-y-1.5">
                {o.items.map((item) => (
                  <p key={item.id} className="font-editorial text-[14px] text-white/60">
                    {item.quantity}× {item.product_name}
                    {item.size ? ` (${item.size})` : ""} — ₹{item.price}
                  </p>
                ))}
              </div>
              <p className="mt-3 font-mono text-[12px] text-white/80">Total: ₹{o.total}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
