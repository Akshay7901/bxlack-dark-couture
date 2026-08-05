import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const WORDS = "BORN TO STAND APART. NOT MADE FOR EVERYONE — CUT FOR THE FEW WHO REFUSE THE UNIFORM.".split(" ");

export function ManifestoScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.35"] });

  return (
    <section ref={ref} className="relative overflow-hidden border-y border-light-grey/10 bg-noir py-24 md:py-40">
      {/* drifting ghost ticker */}
      <motion.div
        aria-hidden
        style={{ x: useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]) }}
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none whitespace-nowrap text-center font-display text-[26vw] leading-none tracking-[-0.06em] text-foreground/[0.035]"
      >
        BXLACK BXLACK
      </motion.div>

      <div className="relative mx-auto max-w-[1400px] px-5 sm:px-6 md:px-10">
        <p className="mb-8 font-mono text-[10px] uppercase tracking-[0.35em] text-mid-grey md:mb-12">Manifesto — 001</p>
        <p className="flex flex-wrap gap-x-[0.28em] gap-y-1 font-display text-[8vw] font-medium uppercase leading-[0.95] tracking-[-0.03em] sm:text-5xl md:text-[64px] lg:text-[76px]">
          {WORDS.map((w, i) => {
            const start = i / WORDS.length;
            const end = start + 1 / WORDS.length;
            return (
              <motion.span
                key={`${w}-${i}`}
                style={{ opacity: useTransform(scrollYProgress, [start, end], [0.14, 1]) }}
                className="text-foreground"
              >
                {w}
              </motion.span>
            );
          })}
        </p>
      </div>
    </section>
  );
}
