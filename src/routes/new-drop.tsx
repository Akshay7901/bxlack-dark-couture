import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AppShell } from "@/components/AppShell";
import { products } from "@/lib/products";

export const Route = createFileRoute("/new-drop")({
  head: () => ({
    meta: [
      { title: "New Drop — BXLACK SS26" },
      { name: "description", content: "SS26 · Chapter 001. A numbered, small-batch drop from BXLACK." },
      { property: "og:title", content: "New Drop — BXLACK SS26" },
      { property: "og:description", content: "Fifty pieces cut. None will be re-made." },
    ],
  }),
  component: NewDropPage,
});

function NewDropPage() {
  const [hero, ...rest] = products;
  return (
    <AppShell>
      <section className="relative pt-28 md:pt-40">
        <div className="mx-auto max-w-[1600px] px-5 sm:px-6 md:px-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/50">Drop 003 · Fifty pieces</p>
          <h1 className="mt-6 font-display text-6xl font-medium leading-[0.85] tracking-[-0.05em] md:text-[11vw]">
            The <em className="font-editorial italic text-white/70">new drop.</em>
          </h1>
          <p className="mt-6 max-w-lg font-editorial text-xl italic text-white/60">
            Chapter 001 of SS26. Each piece numbered and released once — then archived.
          </p>
        </div>

        {/* Editorial hero product */}
        <div className="mx-auto mt-20 grid max-w-[1600px] grid-cols-1 gap-6 px-6 md:grid-cols-12 md:px-10">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, ease: [0.7, 0, 0.2, 1] }}
            className="group relative md:col-span-8"
          >
            <Link to="/product/$id" params={{ id: hero.id }} data-cursor="Open" className="block">
              <div className="relative aspect-[16/10] overflow-hidden bg-[oklch(0.08_0_0)]">
                <img src={hero.image} alt={hero.name} className="h-full w-full object-cover transition-transform duration-[1.5s] group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute inset-0 flex items-end justify-between p-8 md:p-12">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/70">{hero.tag}</p>
                    <p className="mt-4 font-display text-4xl leading-none text-white md:text-6xl">{hero.name}</p>
                  </div>
                  <p className="font-mono text-sm text-white">₹{hero.price}</p>
                </div>
              </div>
            </Link>
          </motion.div>

          <div className="flex flex-col justify-end md:col-span-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/50">Piece · 01 / 05</p>
            <p className="mt-4 font-editorial text-3xl italic text-white/80">
              "The wardrobe as armour — cut for one, worn against everything."
            </p>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">— Studio note, 02.26</p>
          </div>
        </div>

        {/* Alternating grid for the rest */}
        <div className="mx-auto mt-24 grid max-w-[1600px] grid-cols-1 gap-6 px-6 md:grid-cols-12 md:px-10">
          {rest.map((p, i) => {
            const layouts = [
              "md:col-span-4",
              "md:col-span-4 md:mt-24",
              "md:col-span-4",
              "md:col-span-8",
            ];
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ delay: i * 0.08, duration: 1, ease: [0.7, 0, 0.2, 1] }}
                className={`group ${layouts[i] || "md:col-span-4"}`}
              >
                <Link to="/product/$id" params={{ id: p.id }} data-cursor="Open" className="block">
                  <div className="relative aspect-[3/4] overflow-hidden bg-[oklch(0.08_0_0)]">
                    <img src={p.image} alt={p.name} className="h-full w-full object-cover transition-transform duration-[1.5s] group-hover:scale-110" loading="lazy" />
                    <div className="absolute left-4 top-4 font-mono text-[9px] uppercase tracking-[0.3em] text-white/80">{p.tag}</div>
                  </div>
                  <div className="mt-4 flex items-baseline justify-between">
                    <p className="font-display text-2xl text-white">{p.name}</p>
                    <p className="font-mono text-sm text-white/80">₹{p.price}</p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="h-40" />
      </section>
    </AppShell>
  );
}