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

        {/* Light scrims only at the edges, so the shirt itself is never darkened:
            far-left on desktop (behind the text), a thin bottom fade on mobile. */}
        <div className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(to_right,rgba(0,0,0,0.5)_0%,transparent_35%)] md:block" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[18%] bg-gradient-to-t from-noir to-transparent md:hidden" />
      </div>

      {/* Mobile: below the shirt graphic, overlapping only the floor strip at the
          bottom of the photo. Desktop: narrow block in the empty lower-left area;
          the 26vw cap keeps it clear of the sleeve on tablet widths. */}
      <motion.div
        variants={textBlock}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        className="relative -mt-6 flex flex-col items-center px-6 pb-12 text-center md:absolute md:bottom-[8%] md:left-8 md:mt-0 md:w-[min(380px,26vw)] md:items-start md:p-0 md:text-left lg:left-14"
      >
        <motion.p
          variants={line}
          className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/60 sm:text-[11px]"
        >
          New Collection
        </motion.p>

        <motion.h2
          variants={line}
          className="mt-3 font-display text-[clamp(1.75rem,3.5vw,3rem)] font-semibold uppercase leading-[1] tracking-[0.12em] text-white"
        >
          <span className="block">T-Shirt</span>
          <span className="block">Drops</span>
        </motion.h2>

        <motion.p
          variants={line}
          className="mt-2.5 font-editorial text-[16px] italic text-white/75 md:text-[17px]"
        >
          Born to stand apart.
        </motion.p>

        <motion.div variants={line} className="mt-5 w-full md:w-auto">
          <Link
            to="/shop"
            search={{ type: "Tshirt" }}
            className="group inline-flex min-h-[48px] w-full items-center justify-center gap-3 border border-white px-7 font-mono text-[11px] uppercase tracking-[0.3em] text-white transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-noir md:w-auto"
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
