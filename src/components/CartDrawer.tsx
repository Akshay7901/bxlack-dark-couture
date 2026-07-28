import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.6, ease: [0.7, 0, 0.2, 1] }}
            className="fixed right-0 top-0 z-[81] flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[oklch(0.07_0_0)] p-8"
          >
            <div className="flex items-center justify-between">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/60">Your Bag — 00</p>
              <button onClick={onClose} aria-label="Close"><X size={18} /></button>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <p className="font-editorial text-3xl italic text-white/80">The bag is empty.</p>
              <p className="mt-3 max-w-xs text-sm text-white/50">Curated pieces you save will appear here — waiting for their moment.</p>
              <button onClick={onClose} className="mt-8 border border-white/40 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.3em] text-white hover:bg-white hover:text-black">
                Discover the Drop
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}