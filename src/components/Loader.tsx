import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export function Loader() {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGone(true), 2200);
    return () => clearTimeout(t);
  }, []);
  const letters = "BXLACK".split("");
  return (
    <AnimatePresence>
      {!gone && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(20px)" }}
          transition={{ duration: 0.8, ease: [0.7, 0, 0.3, 1] }}
          className="grain fixed inset-0 z-[10000] flex items-center justify-center bg-[oklch(0.03_0_0)]"
        >
          <div className="flex overflow-hidden">
            {letters.map((l, i) => (
              <motion.span
                key={i}
                initial={{ y: "110%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.9, ease: [0.7, 0, 0.2, 1] }}
                className="font-display text-6xl font-medium tracking-[-0.04em] text-white md:text-9xl"
              >
                {l}
              </motion.span>
            ))}
          </div>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="absolute bottom-10 left-10 right-10 h-px origin-left bg-white/40"
          />
          <div className="absolute bottom-14 left-10 font-mono text-[10px] uppercase tracking-[0.3em] text-white/50">
            Loading Universe
          </div>
          <div className="absolute bottom-14 right-10 font-mono text-[10px] uppercase tracking-[0.3em] text-white/50">
            SS26 · BXLACK
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}