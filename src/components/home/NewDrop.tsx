import { motion } from "framer-motion";
import { products } from "@/lib/products";
import { Link } from "@tanstack/react-router";

export function NewDrop() {
  return (
    <section id="drop" className="relative overflow-hidden bg-[oklch(0.05_0_0)] py-32">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-6 md:flex-row md:items-end md:justify-between md:px-10">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/50">The Drop — 003</p>
          <h2 className="mt-6 font-display text-[13vw] font-medium leading-[0.9] tracking-[-0.04em] text-white sm:text-6xl md:text-8xl">
            New <em className="font-editorial italic text-white/70">arrivals.</em>
          </h2>
        </div>
        <Link to="/shop" search={{ type: "All" }} data-cursor="View" className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/70 hover:text-white">
          View all 05 pieces →
        </Link>
      </div>

      <div className="mt-16 overflow-x-auto overflow-y-hidden pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-6 px-5 sm:px-6 md:px-10" style={{ width: "max-content" }}>
          {products.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ delay: i * 0.08, duration: 0.9, ease: [0.7, 0, 0.2, 1] }}
              className="group relative w-[75vw] shrink-0 md:w-[420px]"
            >
              <Link to="/product/$id" params={{ id: p.id }} data-cursor="Open" className="relative block aspect-[3/4] overflow-hidden bg-[oklch(0.08_0_0)]">
                <img
                  src={p.image}
                  alt={p.name}
                  className="h-full w-full object-cover transition-all duration-[1.2s] ease-[cubic-bezier(0.7,0,0.2,1)] group-hover:scale-110 group-hover:rotate-1"
                  loading="lazy"
                  width={900}
                  height={1200}
                />
                <div className="pointer-events-none absolute inset-0 opacity-0 shadow-[inset_0_0_60px_rgba(255,255,255,0.15)] transition-opacity duration-700 group-hover:opacity-100" />
                <div className="absolute left-4 top-4 font-mono text-[9px] uppercase tracking-[0.3em] text-white/70">{p.tag}</div>
                <div className="absolute inset-x-0 bottom-0 translate-y-full bg-white/90 p-4 text-black transition-transform duration-500 group-hover:translate-y-0">
                  <span className="block w-full text-left font-mono text-[11px] uppercase tracking-[0.3em]">Quick View →</span>
                </div>
              </Link>
              <div className="mt-4 flex items-baseline justify-between">
                <div>
                  <p className="font-display text-xl text-white">{p.name}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">{p.category}</p>
                </div>
                <p className="font-mono text-sm text-white/80">€{p.price}</p>
              </div>
            </motion.div>
          ))}
          <div className="flex w-[40vw] shrink-0 items-center pl-6 md:w-[400px]">
            <div>
              <p className="font-editorial text-3xl italic text-white/60">More<br/>coming.</p>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">Chapter 002 — Autumn</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}