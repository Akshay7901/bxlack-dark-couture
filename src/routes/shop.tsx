import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AppShell } from "@/components/AppShell";
import { products } from "@/lib/products";

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>) => ({
    type: typeof search.type === "string" ? search.type : "All",
  }),
  head: () => ({
    meta: [
      { title: "Shop — BXLACK" },
      { name: "description", content: "The BXLACK SS26 collection. Numbered, small-batch luxury streetwear." },
      { property: "og:title", content: "Shop — BXLACK" },
      { property: "og:description", content: "The SS26 collection. Numbered, small-batch." },
    ],
  }),
  component: ShopPage,
});

const types = ["All", "Tshirt", "Shirt", "Jeans"] as const;
const pageTitles: Record<string, string> = {
  All: "All Products",
  Tshirt: "T-Shirts",
  Shirt: "Shirts",
  Jeans: "Jeans",
};
const sizes = ["S", "M", "L", "XL", "XXL"] as const;

function ShopPage() {
  const { type } = Route.useSearch();

  const selectedType: (typeof types)[number] =
    types.includes(type as (typeof types)[number]) ? (type as (typeof types)[number]) : "All";

  const filtered = useMemo(() => {
    return selectedType === "All" ? products : products.filter((p) => p.category === selectedType);
  }, [selectedType]);

  return (
    <AppShell hideNewsletter>
      {/* Ambient background field */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        {/* fine grid */}
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.055) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
            maskImage: "radial-gradient(120% 90% at 50% 0%, #000 20%, transparent 85%)",
          }}
        />
        {/* soft top glow */}
        <div className="absolute inset-x-0 top-0 h-[70vh] bg-[radial-gradient(60%_100%_at_50%_-10%,rgba(255,255,255,0.09),transparent_70%)]" />
        {/* slow drifting halo */}
        <motion.div
          className="absolute left-1/2 top-1/3 h-[70vh] w-[70vh] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.05),transparent_65%)] blur-3xl"
          animate={{ x: ["-55%", "-45%", "-55%"], y: ["-6%", "6%", "-6%"] }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* grain */}
        <div
          className="absolute inset-0 opacity-[0.16] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
          }}
        />
        {/* vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(100%_80%_at_50%_50%,transparent_45%,rgba(0,0,0,0.75)_100%)]" />
      </div>

      <section className="relative pt-28 md:pt-40">
        <div className="mx-auto max-w-[1600px] px-5 sm:px-6 md:px-10">
          <span
            aria-hidden
            className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 select-none font-sans text-[22vw] font-bold leading-none tracking-tighter text-white/[0.025] md:text-[16vw]"
          >
            BXLACK
          </span>
          <div className="mb-6 flex items-baseline justify-between gap-4 md:mb-8">
            <h1 className="font-sans text-base text-white/90 sm:text-lg">{pageTitles[selectedType]}</h1>
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
              {filtered.length} {filtered.length === 1 ? "item" : "items"}
            </span>
          </div>
          {filtered.length === 0 ? (
            <div className="flex h-[40vh] items-center justify-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/50">No pieces in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 md:gap-x-8 md:gap-y-14">
              {filtered.map((p, i) => (
                <motion.article
                  key={p.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.8, ease: [0.7, 0, 0.2, 1] }}
                  className="group"
                >
                  <Link to="/product/$id" params={{ id: p.id }} className="block">
                    <div className="relative aspect-[4/5] overflow-hidden bg-[#141414]">
                      <img
                        src={p.image}
                        alt={p.name}
                        className={`absolute inset-0 h-full w-full object-cover transition-all duration-[1.2s] ease-[cubic-bezier(0.7,0,0.2,1)] ${
                          p.backImage ? "group-hover:opacity-0" : "group-hover:scale-105"
                        }`}
                        loading="lazy"
                      />
                      {p.backImage ? (
                        <img
                          src={p.backImage}
                          alt=""
                          aria-hidden
                          className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-[1.2s] ease-[cubic-bezier(0.7,0,0.2,1)] group-hover:opacity-100"
                          loading="lazy"
                        />
                      ) : null}
                    </div>

                    <div className="mt-4">
                      <h2 className="font-sans text-sm leading-snug text-white/90 sm:text-[15px]">{p.name}</h2>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="font-mono text-[13px] text-white sm:text-sm">₹{p.price}</span>
                        {p.compareAt ? (
                          <span className="font-mono text-[11px] text-white/35 line-through sm:text-xs">₹{p.compareAt}</span>
                        ) : null}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {sizes.map((s) => (
                          <span
                            key={s}
                            className="border border-white/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-white/55"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>
      <div className="h-32" />
    </AppShell>
  );
}