import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AppShell } from "@/components/AppShell";
import { products } from "@/lib/products";
import { SilkBackdrop } from "@/components/SilkBackdrop";
import { ProductCard } from "@/components/ProductCard";

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
function ShopPage() {
  const { type } = Route.useSearch();

  const selectedType: (typeof types)[number] =
    types.includes(type as (typeof types)[number]) ? (type as (typeof types)[number]) : "All";

  const filtered = useMemo(() => {
    return selectedType === "All" ? products : products.filter((p) => p.category === selectedType);
  }, [selectedType]);

  return (
    <AppShell hideNewsletter>
      <SilkBackdrop />

      <section className="relative pt-20 md:pt-24">
        <div className="mx-auto max-w-[1600px] px-5 sm:px-6 md:px-10">
          <div className="mb-3 flex items-baseline justify-between gap-4 md:mb-4">
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
                  <ProductCard product={p} />
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