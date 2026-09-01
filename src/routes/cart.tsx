import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { X, Minus, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SilkBackdrop } from "@/components/SilkBackdrop";
import { fetchProducts, toCardProduct } from "@/lib/catalog";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Bag — BXLACK" },
      { name: "description", content: "Review the BXLACK pieces in your bag before checkout." },
      { property: "og:title", content: "Your Bag — BXLACK" },
      { property: "og:description", content: "Review the BXLACK pieces in your bag before checkout." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { lines, count, setQty, remove, clear } = useCart();
  const { data, isLoading } = useQuery({ queryKey: ["products"], queryFn: () => fetchProducts() });
  const all = (data ?? []).map(toCardProduct);

  const items = lines
    .map((l) => {
      const product = all.find((p) => p.id === l.id);
      return product ? { ...l, product } : null;
    })
    .filter(Boolean) as Array<(typeof lines)[number] & { product: ReturnType<typeof toCardProduct> }>;

  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.qty, 0);

  return (
    <AppShell hideNewsletter>
      <SilkBackdrop />
      <section className="relative mx-auto max-w-[1500px] px-5 pt-24 sm:px-6 md:px-8 md:pt-28 lg:px-12">
        <div className="flex items-baseline justify-between border-b border-white/10 pb-4">
          <h1 className="font-display text-[28px] uppercase leading-none tracking-[-0.01em] text-white md:text-[38px]">
            Your Bag
          </h1>
          <div className="flex items-center gap-5">
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
              {count} {count === 1 ? "piece" : "pieces"}
            </span>
            {items.length > 0 ? (
              <button
                onClick={clear}
                className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40 underline underline-offset-4 hover:text-white"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>

        {isLoading && lines.length > 0 ? (
          <p className="py-24 text-center font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">Loading…</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-6 py-28 text-center">
            <p className="font-editorial text-[16px] text-white/55">The bag is empty.</p>
            <Link
              to="/shop"
              search={{ type: "All" }}
              className="border border-white/25 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.28em] text-white/70 hover:border-white hover:text-white"
            >
              Browse the collection
            </Link>
          </div>
        ) : (
          <div className="grid gap-12 py-10 lg:grid-cols-[1fr_360px] lg:gap-16">
            <ul className="divide-y divide-white/10">
              {items.map((item) => (
                <li key={`${item.id}-${item.size}`} className="flex gap-5 py-6 first:pt-0">
                  <Link
                    to="/product/$id"
                    params={{ id: item.id }}
                    className="h-40 w-28 shrink-0 overflow-hidden bg-[#0A0A0A] sm:h-52 sm:w-36"
                  >
                    <img src={item.product.image} alt={item.product.name} className="h-full w-full object-cover" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <Link to="/product/$id" params={{ id: item.id }}>
                          <h2 className="font-sans text-[15px] text-white/90 hover:text-white">{item.product.name}</h2>
                        </Link>
                        <button
                          aria-label={`Remove ${item.product.name}`}
                          onClick={() => remove(item.id, item.size)}
                          className="text-white/40 hover:text-white"
                        >
                          <X size={15} />
                        </button>
                      </div>
                      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.26em] text-white/40">
                        Size {item.size} · {item.product.category}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-white/20">
                        <button
                          aria-label="Decrease quantity"
                          onClick={() => setQty(item.id, item.size, item.qty - 1)}
                          className="px-2.5 py-2 text-white/60 hover:text-white"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="min-w-[30px] text-center font-mono text-[12px] text-white">{item.qty}</span>
                        <button
                          aria-label="Increase quantity"
                          onClick={() => setQty(item.id, item.size, item.qty + 1)}
                          className="px-2.5 py-2 text-white/60 hover:text-white"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <span className="font-mono text-[14px] text-white">
                        ₹{(item.product.price * item.qty).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <aside className="h-fit border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm lg:sticky lg:top-28">
              <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45">Order Summary</p>
              <div className="mt-6 space-y-3 border-b border-white/10 pb-6">
                <div className="flex justify-between font-mono text-[12px] text-white/70">
                  <span>Subtotal</span>
                  <span className="text-white">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between font-mono text-[12px] text-white/70">
                  <span>Shipping</span>
                  <span className="text-white/50">Calculated at checkout</span>
                </div>
              </div>
              <div className="mt-6 flex items-baseline justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/60">Total</span>
                <span className="font-mono text-[16px] text-white">₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <button
                disabled
                className="mt-6 w-full cursor-not-allowed border border-white bg-white py-[14px] font-mono text-[11px] uppercase tracking-[0.32em] text-black opacity-90"
              >
                Checkout
              </button>
              <p className="mt-3 text-center font-mono text-[9px] uppercase tracking-[0.22em] text-white/35">
                Checkout opens with the SS26 drop
              </p>
              <Link
                to="/shop"
                search={{ type: "All" }}
                className="mt-4 block text-center font-mono text-[10px] uppercase tracking-[0.28em] text-white/50 underline underline-offset-4 hover:text-white"
              >
                Continue shopping
              </Link>
            </aside>
          </div>
        )}
        <div className="h-20" />
      </section>
    </AppShell>
  );
}
