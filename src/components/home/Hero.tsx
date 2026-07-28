import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import hero from "@/assets/bxlack-campaign-hero.png.asset.json";

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative h-screen w-full overflow-hidden bg-black">
      <motion.div style={{ scale, y }} className="absolute inset-0">
        <img
          src={hero.url}
          alt="BXLACK SS2026 campaign"
          className="h-full w-full object-cover object-top"
          width={1920}
          height={1200}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80" />
      </motion.div>

      {/* Bottom-left CTA */}
      <motion.div
        style={{ opacity }}
        className="absolute bottom-10 left-6 z-10 md:bottom-14 md:left-10"
      >
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.4, duration: 1 }}
          className="font-mono text-[11px] uppercase tracking-[0.35em] text-white/90"
        >
          SS2026 OUT NOW
        </motion.p>
        <motion.a
          href="/new-drop"
          data-cursor="Shop"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.6, duration: 1 }}
          className="mt-4 inline-flex items-center gap-3 border-b border-white/80 pb-1 font-mono text-[11px] uppercase tracking-[0.35em] text-white transition-all hover:gap-5"
        >
          Shop Now
          <span>→</span>
        </motion.a>
      </motion.div>

      {/* Centered small logo mark */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.6, duration: 1 }}
        className="pointer-events-none absolute left-1/2 top-6 z-10 -translate-x-1/2 md:top-8"
      >
        <div className="font-display text-2xl font-medium tracking-[-0.05em] text-white">
          ▼
        </div>
      </motion.div>
    </section>
  );
}