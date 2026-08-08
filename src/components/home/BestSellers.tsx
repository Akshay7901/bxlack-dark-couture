import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { products } from "@/lib/products";

const best = products.filter((p) => p.badge?.toLowerCase().includes("sell")).concat(products).slice(0, 3);

export function BestSellers() {
  return (
    <section className="bg-noir py-16 sm:py-24 md:py-32">
      <div className="mx-auto max-w-[1600px] px-5 sm:px-6 md:px-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/50">Most wanted</p>
            <h2 className="mt-5 font-display text-[12vw] font-medium leading-[0.9] tracking-[-0.04em] text-white sm:text-5xl md:text-7xl">
              Best <em className="font-editorial italic text-white/70">sellers.</em>
            </h2>
          </div>
          <Link
            to="/shop"
            search={{ type: "All" }}
            data-cursor="View"
            className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/60 hover:text-white"
          >
            Shop all →
          </Link>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3 sm:gap-6 md:mt-16">
          {best.map((p, i) => (
            <motion.div
              key={p.id + i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ delay: i * 0.08, duration: 0.8, ease: [0.7, 0, 0.2, 1] }}
            >
              <Link to="/product/$id" params={{ id: p.id }} data-cursor="Open" className="group block">
                <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-card">
                  <span className="absolute left-4 top-4 z-20 font-mono text-[10px] uppercase tracking-[0.3em] text-white/70">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <img
                    src={p.image}
                    alt={p.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.7,0,0.2,1)] group-hover:scale-105"
                  />
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <h3 className="font-sans text-sm text-white">{p.name}</h3>
                  <span className="font-mono text-xs text-white/60">${p.price}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
