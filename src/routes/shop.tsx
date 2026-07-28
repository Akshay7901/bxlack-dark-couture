import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
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

function ShopPage() {
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
          <div className="mt-6 flex flex-wrap gap-4 font-mono text-[11px] uppercase tracking-[0.3em] text-white/60">
            {["All", "Outerwear", "Knitwear", "Bottoms", "Accessories"].map((c, i) => (
              <button key={c} className={`border px-4 py-2 hover:border-white hover:text-white ${i === 0 ? "border-white text-white" : "border-white/20"}`}>{c}</button>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-[1600px] px-6 md:px-10">
          <div className="grid auto-rows-[40vh] grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {products.map((p, i) => (
              <motion.article
                key={p.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.9, ease: [0.7, 0, 0.2, 1] }}
                className={`group relative overflow-hidden bg-[oklch(0.08_0_0)] ${spans[i] || ""}`}
                data-cursor="View"
              >
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
              </motion.article>
            ))}
          </div>
        </div>
      </section>
      <div className="h-32" />
    </AppShell>
  );
}