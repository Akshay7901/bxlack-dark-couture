import { motion } from "framer-motion";

const ROWS: [string, string][] = [
  ["Creative Direction", "BXLACK Studio"],
  ["Photography", "Ines M. — Antwerp"],
  ["Film", "Kōji Arata — Tokyo"],
  ["Sound", "Untitled Static"],
  ["Casting", "The Uncast"],
  ["Set", "Warehouse 14, Docklands"],
  ["Wardrobe", "SS26 · One-of-one"],
  ["Post", "No colour grade"],
];

export function Credits() {
  return (
    <section className="relative overflow-hidden border-t border-white/10 bg-black py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-6 md:px-10">
        <div className="flex items-baseline justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/40">End Credits — Reel A</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/40">© BXLACK · MMXXVI</p>
        </div>

        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-20%" }}
          transition={{ duration: 1.2, ease: [0.7, 0, 0.2, 1] }}
          className="mt-10 font-display text-[14vw] font-medium leading-[0.85] tracking-[-0.05em] text-white md:text-[9vw]"
        >
          A film by <em className="font-editorial italic text-white/60">no one</em>
          <br />in particular.
        </motion.h2>

        <ul className="mt-20 divide-y divide-white/10 border-y border-white/10">
          {ROWS.map(([k, v], i) => (
            <motion.li
              key={k}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ delay: i * 0.05, duration: 0.6 }}
              className="group grid grid-cols-12 items-center gap-4 py-5"
            >
              <span className="col-span-2 font-mono text-[10px] uppercase tracking-[0.4em] text-white/40">{String(i + 1).padStart(2, "0")}</span>
              <span className="col-span-4 font-mono text-[11px] uppercase tracking-[0.3em] text-white/60">{k}</span>
              <span className="col-span-6 text-right font-editorial text-2xl italic text-white transition-transform duration-500 group-hover:-translate-x-2 md:text-3xl">
                {v}
              </span>
            </motion.li>
          ))}
        </ul>

        <div className="mt-24 flex flex-col items-center gap-6 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/40">Fade to black</p>
          <p className="font-display text-[12vw] leading-[0.9] tracking-[-0.04em] text-white sm:text-6xl md:text-8xl">
            See you <em className="font-editorial italic text-white/60">in chapter 002.</em>
          </p>
        </div>
      </div>
    </section>
  );
}