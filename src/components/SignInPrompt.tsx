import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export function SignInPrompt({
  open,
  onClose,
  message = "Sign in to save pieces to your wishlist.",
}: {
  open: boolean;
  onClose: () => void;
  message?: string;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Sign in required"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.7, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[420px] border border-white/12 bg-[#0A0A0A]/95 px-7 py-9 text-center"
          >
            <button
              aria-label="Close"
              onClick={onClose}
              className="absolute right-3 top-3 text-white/40 transition-colors hover:text-white"
            >
              <X size={16} />
            </button>
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/40">Members only</p>
            <h2 className="mt-4 font-display text-[24px] uppercase leading-[1.1] tracking-[-0.01em] text-white">
              Sign in to continue
            </h2>
            <p className="mt-3 font-editorial text-[14px] leading-[1.7] text-white/55">{message}</p>
            <Link
              to="/auth"
              onClick={onClose}
              className="mt-7 block w-full border border-white bg-white py-[13px] font-mono text-[11px] uppercase tracking-[0.32em] text-black transition-colors hover:bg-transparent hover:text-white"
            >
              Sign in
            </Link>
            <button
              onClick={onClose}
              className="mt-3 w-full border border-white/20 py-[12px] font-mono text-[10px] uppercase tracking-[0.28em] text-white/55 transition-colors hover:border-white hover:text-white"
            >
              Keep browsing
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
