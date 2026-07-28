import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { products } from "@/lib/products";

export const Route = createFileRoute("/shop")({
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

function ShopPage() {
  const [selectedType, setSelectedType] = useState<(typeof types)[number]>("All");
  const filtered = selectedType === "All" ? products : products.filter((p) => p.category === selectedType);

  // masonry-ish: alternate spans
  const spans = ["md:col-span-2 md:row-span-2", "", "", "md:col-span-2", "", ""];
  return (
    <AppShell>
      <section className="pt-40">
        <div className="mx-auto max-w-[1600px] px-6 md:px-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/50">Collection — SS26</p>
          <h1 className="mt-6 font-display text-6xl font-medium leading-[0.85] tracking-[-0.04em] md:text-[10vw]">
            The <em className="font-editorial italic text-white/70">index.</em>
          </h1>
          <div className="mt-8 flex items-center gap-4">
            <label htmlFor="type-filter" className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/50">
              Type
            </label>
            <div className="relative">
              <select
                id="type-filter"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as (typeof types)[number])}
                className="appearance-none bg-transparent border border-light-grey/20 px-5 py-2.5 pr-10 font-mono text-[11px] uppercase tracking-[0.3em] text-white focus:outline-none focus:border-light-grey/50 transition-colors"
              >
                {types.map((t) => (
                  <option key={t} value={t} className="bg-noir text-white">
                    {t}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-white/60">▼</span>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-[1600px] px-6 md:px-10">
          {filtered.length === 0 ? (
            <div className="flex h-[40vh] items-center justify-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/50">No pieces in this category.</p>
            </div>
          ) : (
            <div className="grid auto-rows-[40vh] grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
              {filtered.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.9, ease: [0.7, 0, 0.2, 1] }}
                  className={`group relative overflow-hidden bg-[oklch(0.08_0_0)] ${spans[i] || ""}`}
                >
                  <Link to="/product/$id" params={{ id: p.id }} data-cursor="View" className="absolute inset-0 z-10" aria-label={p.name} />
                  <img src={p.image} alt={p.name} className="h-full w-full object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.7,0,0.2,1)] group-hover:scale-110" loading="lazy" />
                  <div className="absolute inset-0 bg-black/0 backdrop-blur-0 transition-all duration-500 group-hover:bg-black/30 group-hover:backdrop-blur-sm" />
                  <div className="absolute left-4 top-4 font-mono text-[9px] uppercase tracking-[0.3em] text-white/80">{p.tag}</div>
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
                    <div>
                      <p className="font-display text-xl text-white md:text-2xl">{p.name}</p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-white/60">{p.category}</p>
                    </div>
                    <p className="font-mono text-sm text-white">€{p.price}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
      <div className="h-32" />
    </AppShell>
  );
}