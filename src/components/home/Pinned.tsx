import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const WORDS = [
  "We", "do", "not", "make", "clothes.",
  "We", "make", "armour",
  "for", "the", "unrepeatable.",
];

export function Pinned() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  return (
    <section ref={ref} className="relative h-[260vh] bg-[oklch(0.04_0_0)]">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,oklch(0.14_0_0)_0%,transparent_60%)]" />
        <div className="absolute left-6 top-6 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.4em] text-white/40 md:left-10 md:top-10">
          <span className="h-px w-8 bg-white/40" />
          Manifesto · Reel 002
        </div>
        <div className="absolute right-6 top-6 font-mono text-[10px] uppercase tracking-[0.4em] text-white/40 md:right-10 md:top-10">
          Hold · Scroll · Read
        </div>

        <div className="mx-auto flex max-w-[1500px] flex-wrap items-baseline justify-center gap-x-6 gap-y-2 px-6 text-center md:px-10">
          {WORDS.map((w, i) => {
            const start = i / WORDS.length;
            const end = start + 1 / WORDS.length;
            const opacity = useTransform(scrollYProgress, [start, end], [0.12, 1]);
            const y = useTransform(scrollYProgress, [start, end], [30, 0]);
            const italic = w === "armour" || w === "unrepeatable.";
            return (
              <motion.span
                key={i}
                style={{ opacity, y }}
                className={`inline-block font-display text-[9vw] font-medium leading-[0.9] tracking-[-0.04em] text-white md:text-[7vw] ${italic ? "font-editorial italic text-white/80" : ""}`}
              >
                {w}
              </motion.span>
            );
          })}
        </div>

        <div className="absolute inset-x-0 bottom-6 flex justify-between px-6 font-mono text-[10px] uppercase tracking-[0.3em] text-white/30 md:px-10">
          <span>BXLACK · Statement 001</span>
          <span>Not for the algorithm</span>
        </div>
      </div>
    </section>
  );
}