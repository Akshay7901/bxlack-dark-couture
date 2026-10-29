import { motion, type Variants } from "framer-motion";
import { Link } from "@tanstack/react-router";
import stoneTeeImage from "@/assets/stone-tee-back.webp";
import { EASE_OUT } from "@/lib/motion";

/** Label → headline → tagline → button, each fading up 0.15s after the last. */
const textBlock: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};
const line: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE_OUT } },
};

export function GraphicFeature() {
  return (
    <section className="relative overflow-hidden bg-noir text-foreground">
      <div className="relative w-full">
        <motion.img
          src={stoneTeeImage}
          alt="BXLACK Stone Logo Tee shot from behind, model standing in a concrete corridor"
          width={1448}
          height={1086}
          loading="lazy"
          decoding="async"
          className="block h-auto w-full object-contain"
          initial={{ scale: 1.04 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true, amount: 0.01 }}
          transition={{ duration: 1.4, ease: [0.7, 0, 0.2, 1] }}
        />

        {/* Readability scrims: from the left on desktop, from the bottom on mobile
            where the text sits over the lower edge of the image. */}
        <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-black/80 via-black/35 to-transparent md:block" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-noir via-noir/60 to-transparent md:hidden" />
      </div>

      {/* Mobile: centred, pulled up over the bottom of the image (the 4:3 photo is
          too short on phones to hold the whole block). Desktop: lower-left overlay. */}
      <motion.div
        variants={textBlock}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        className="relative -mt-20 flex flex-col items-center px-6 pb-14 text-center sm:-mt-28 md:absolute md:bottom-[12%] md:left-16 md:mt-0 md:max-w-[60%] md:items-start md:p-0 md:text-left lg:left-20"
      >
        <motion.p
          variants={line}
          className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/55 sm:text-[11px]"
        >
          New Collection
        </motion.p>

        <motion.h2
          variants={line}
          className="mt-4 font-display text-[clamp(2.5rem,6vw,5rem)] font-semibold uppercase leading-[0.95] tracking-[0.12em] text-white [text-wrap:balance]"
        >
          T-Shirt Drops
        </motion.h2>

        <motion.p
          variants={line}
          className="mt-4 font-editorial text-[17px] italic text-white/70 md:text-[20px]"
        >
          Born to stand apart.
        </motion.p>

        <motion.div variants={line} className="mt-8 w-full md:w-auto">
          <Link
            to="/shop"
            search={{ type: "Tshirt" }}
            className="group inline-flex min-h-[48px] w-full items-center justify-center gap-3 border border-white px-9 font-mono text-[11px] uppercase tracking-[0.3em] text-white transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-noir md:w-auto"
          >
            Shop Now
            <span
              aria-hidden
              className="transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1.5"
            >
              →
            </span>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
