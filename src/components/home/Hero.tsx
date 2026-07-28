import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import hero from "@/assets/hero.jpg";

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.25]);
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "-40%"]);
  const textScale = useTransform(scrollYProgress, [0, 1], [1, 1.4]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} className="relative h-[110vh] w-full overflow-hidden bg-black">
      <motion.div style={{ scale, y }} className="absolute inset-0">
        <img src={hero} alt="BXLACK campaign" className="h-full w-full object-cover object-[center_20%]" width={1600} height={1800} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,black_100%)]" />
      </motion.div>

      <motion.div style={{ y: textY, scale: textScale, opacity }} className="relative z-10 flex h-screen flex-col items-center justify-center px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.4, duration: 1 }}
          className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/60"
        >
          Chapter 001 · SS26
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5, duration: 1.2, ease: [0.7, 0, 0.2, 1] }}
          className="mt-6 font-display text-[14vw] font-medium leading-[0.85] tracking-[-0.05em] text-white md:text-[10vw]"
        >
          BORN TO<br />STAND <em className="font-editorial italic text-white/80">APART.</em>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3, duration: 1 }}
          className="mt-8 max-w-md font-editorial text-lg italic text-white/70 md:text-xl"
        >
          Not fashion. A statement.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.2, duration: 1 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <a href="#drop" data-cursor="Shop" className="group relative inline-flex items-center gap-3 overflow-hidden border border-white bg-white px-8 py-4 font-mono text-[11px] uppercase tracking-[0.3em] text-black transition-colors hover:bg-transparent hover:text-white">
            Explore Collection
            <span>→</span>
          </a>
          <a href="#story" data-cursor="Play" className="inline-flex items-center gap-3 border border-white/30 px-8 py-4 font-mono text-[11px] uppercase tracking-[0.3em] text-white hover:border-white">
            Watch Campaign
            <span className="flex h-2 w-2 rounded-full bg-white" />
          </a>
        </motion.div>
      </motion.div>

      <div className="absolute bottom-10 left-1/2 z-10 -translate-x-1/2 text-center">
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2"
        >
          <div className="h-10 w-px bg-gradient-to-b from-transparent to-white/60" />
          <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-white/50">Scroll</span>
        </motion.div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between px-6 pb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-white/40 md:px-10">
        <span>N 51° 13′ · Antwerp</span>
        <span>Est. 2019</span>
      </div>
    </section>
  );
}