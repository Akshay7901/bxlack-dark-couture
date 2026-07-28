import { motion } from "framer-motion";
import { products } from "@/lib/products";
import { Link } from "@tanstack/react-router";

const featured = products.slice(0, 4);

export function NewArrivals() {
  return (
    <section className="bg-card py-20 text-card-foreground md:py-28">
      <div className="mx-auto max-w-[1600px] px-6 md:px-10">
        <div className="mb-12 md:mb-16">
          <h2 className="font-display text-3xl font-medium uppercase tracking-[-0.02em] md:text-4xl">
            New Arrivals <span className="text-card-foreground/40">.</span>
          </h2>
          <p className="mt-3 max-w-xl font-sans text-sm leading-relaxed text-card-foreground/50">
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
                <div className="relative aspect-[3/4] overflow-hidden bg-[oklch(0.96_0_0)]">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.7,0,0.2,1)] group-hover:scale-105"
                    loading="lazy"
                    width={600}
                    height={800}
                  />
                </div>
                <div className="mt-4">
                  <p className="font-display text-sm font-medium uppercase tracking-wide text-card-foreground">
                    {p.name}
                  </p>
                  <p className="mt-1 font-sans text-xs text-card-foreground/50">
                    {p.category}
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
