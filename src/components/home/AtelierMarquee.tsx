import { motion, useScroll, useSpring, useTransform, useVelocity } from "framer-motion";
import { useRef } from "react";

const LINE = ["Cut in Antwerp", "Finished in Tokyo", "Numbered 1/50", "No restock", "Born to stand apart"];

export function AtelierMarquee() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smooth = useSpring(velocity, { stiffness: 120, damping: 40, mass: 0.6 });
  const skew = useTransform(smooth, [-2500, 0, 2500], [-6, 0, 6], { clamp: true });
  const x = useTransform(useScroll({ target: ref, offset: ["start end", "end start"] }).scrollYProgress, [0, 1], ["4%", "-24%"]);

  return (
    <section ref={ref} className="overflow-hidden bg-noir py-14 md:py-20">
      <motion.div style={{ skewY: skew }}>
        <motion.div style={{ x }} className="flex w-max items-center gap-8 whitespace-nowrap md:gap-14">
          {[...LINE, ...LINE, ...LINE].map((t, i) => (
            <span key={i} className="flex items-center gap-8 md:gap-14">
              <span
                className={
                  i % 2 === 0
                    ? "font-display text-[9vw] uppercase leading-none tracking-[-0.03em] text-foreground md:text-[72px]"
                    : "font-editorial text-[9vw] italic leading-none tracking-[-0.02em] text-foreground/35 md:text-[72px]"
                }
              >
                {t}
              </span>
              <span className="h-2 w-2 shrink-0 rotate-45 bg-silver/60" />
            </span>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
