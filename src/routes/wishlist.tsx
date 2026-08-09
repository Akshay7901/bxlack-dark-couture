import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SilkBackdrop } from "@/components/SilkBackdrop";
import { fetchProducts, toCardProduct } from "@/lib/catalog";
import { useWishlist } from "@/lib/wishlist";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist — BXLACK" },
      { name: "description", content: "Your saved BXLACK pieces — kept in one place until you're ready." },
      { property: "og:title", content: "Wishlist — BXLACK" },
      { property: "og:description", content: "Your saved BXLACK pieces from the SS26 collection." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { ids, remove, clear } = useWishlist();
  const { data, isLoading } = useQuery({ queryKey: ["products"], queryFn: () => fetchProducts() });

  const all = (data ?? []).map(toCardProduct);
  const items = ids.map((id) => all.find((p) => p.id === id)).filter(Boolean) as ReturnType<typeof toCardProduct>[];

  return (
    <AppShell hideNewsletter>
      <SilkBackdrop />
      <section className="relative mx-auto max-w-[1500px] px-5 pt-24 sm:px-6 md:px-8 md:pt-28 lg:px-12">
        <div className="flex items-baseline justify-between border-b border-white/10 pb-4">
          <h1 className="font-display text-[28px] uppercase leading-none tracking-[-0.01em] text-white md:text-[38px]">
            Wishlist
          </h1>
          <div className="flex items-center gap-5">
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
              {items.length} {items.length === 1 ? "piece" : "pieces"}
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

        {isLoading && ids.length > 0 ? (
          <p className="py-24 text-center font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">Loading…</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-6 py-28 text-center">
            <p className="font-editorial text-[16px] text-white/55">Nothing saved yet.</p>
            <Link
              to="/shop"
              search={{ type: "All" }}
              className="border border-white/25 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.28em] text-white/70 hover:border-white hover:text-white"
            >
              Browse the collection
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 py-10 md:grid-cols-3 md:gap-x-8">
            {items.map((product) => (
              <div key={product.id} className="group relative">
                <button
                  aria-label={`Remove ${product.name} from wishlist`}
                  onClick={() => remove(product.id)}
                  className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/50 text-white/70 opacity-0 backdrop-blur-md transition-all duration-300 hover:text-white group-hover:opacity-100"
                >
                  <X size={14} />
                </button>
                <Link to="/product/$id" params={{ id: product.id }} className="block">
                  <div className="relative h-[clamp(260px,52vh,560px)] overflow-hidden bg-[#0A0A0A]">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  <div className="mt-4">
                    <h2 className="font-sans text-sm leading-snug text-white/90">{product.name}</h2>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="font-mono text-[13px] text-white">₹{product.price}</span>
                      {product.compareAt ? (
                        <span className="font-mono text-[11px] text-white/35 line-through">₹{product.compareAt}</span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
        <div className="h-20" />
      </section>
    </AppShell>
  );
}
