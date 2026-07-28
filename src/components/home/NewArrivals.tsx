import { motion } from "framer-motion";
import { products } from "@/lib/products";
import { Link } from "@tanstack/react-router";

const featured = products.slice(0, 4);

export function NewArrivals() {
  return (
    <section className="bg-noir py-20 text-foreground md:py-28">
      <div className="mx-auto max-w-[1600px] px-6 md:px-10">
        <div className="mb-12 md:mb-16">
          <h2 className="font-display text-3xl font-medium uppercase tracking-[-0.02em] md:text-4xl">
            New Arrivals <span className="text-foreground/40">.</span>
          </h2>
          <p className="mt-3 max-w-xl font-sans text-sm leading-relaxed text-foreground/50">
            Available worldwide at select chapter stores and brandvision.com
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {featured.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ delay: i * 0.08, duration: 0.8, ease: [0.7, 0, 0.2, 1] }}
            >
              <Link
                to="/product/$id"
                params={{ id: p.id }}
                className="group block"
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-card ring-1 ring-light-grey/10 shadow-[0_0_40px_-12px_rgba(0,0,0,0.6)]">
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/40 via-transparent to-white/[0.03] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="absolute inset-0 z-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />
                  <img
                    src={p.image}
                    alt={p.name}
                    className="relative z-0 h-full w-full object-cover transition-all duration-700 ease-[cubic-bezier(0.7,0,0.2,1)] group-hover:scale-105 group-hover:brightness-110 group-hover:contrast-[1.05]"
                    loading="lazy"
                    width={600}
                    height={800}
                  />
                </div>
                <div className="mt-5 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-sm font-medium uppercase tracking-wide text-foreground">
                      {p.name}
                    </p>
                    <p className="mt-1 font-sans text-xs text-foreground/50">
                      {p.category}
                    </p>
                  </div>
                  <p className="font-sans text-sm font-medium text-foreground/70">
                    ${p.price}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
