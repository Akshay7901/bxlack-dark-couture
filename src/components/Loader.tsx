import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import signatureMark from "@/assets/signature-mark.png";

export function Loader() {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGone(true), 2200);
    return () => clearTimeout(t);
  }, []);
  return (
    <AnimatePresence>
      {!gone && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(20px)" }}
          transition={{ duration: 0.8, ease: [0.7, 0, 0.3, 1] }}
          className="grain fixed inset-0 z-[10000] flex items-center justify-center bg-[oklch(0.03_0_0)]"
        >
          <motion.img
            src={signatureMark}
            alt="BXLACK"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 1.1, ease: [0.7, 0, 0.2, 1] }}
            className="w-[78vw] max-w-[560px] md:w-[46vw]"
          />
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