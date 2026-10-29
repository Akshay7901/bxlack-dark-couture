import { motion, type Variants } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { EASE_OUT } from "@/lib/motion";

/** Headline then button, each fading up 0.15s after the last. */
const textBlock: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};
const line: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE_OUT } },
};

/**
 * Full-width campaign image with a two-line headline and an outlined
 * "Shop Now" button linking to one collection category.
 */
export function FeatureSection({
  image,
  alt,
  width,
  height,
  title,
  type,
}: {
  image: string;
  alt: string;
  width: number;
  height: number;
  /** Headline, one entry per line (e.g. ["T-Shirt", "Drops"]). */
  title: [string, string];
  /** Collection category the button opens (`/shop?type=…`). */
  type: string;
}) {
  return (
    <section className="relative overflow-hidden bg-noir text-foreground">
      <div className="relative w-full">
        <motion.img
          src={image}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          className="block h-auto w-full object-contain"
          initial={{ scale: 1.04 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true, amount: 0.01 }}
          transition={{ duration: 1.4, ease: [0.7, 0, 0.2, 1] }}
        />

        {/* Light scrims only at the edges, so the product is never darkened:
            far-left on desktop (behind the text), a thin bottom fade on mobile. */}
        <div className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(to_right,rgba(0,0,0,0.5)_0%,transparent_35%)] md:block" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[10%] bg-gradient-to-t from-noir to-transparent md:hidden" />
      </div>

      {/* Mobile: centred below the image. Desktop: narrow block, vertically centred
          on the left; the 26vw cap keeps it clear of the product on tablet widths. */}
      <motion.div
        variants={textBlock}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        className="relative flex flex-col items-center px-6 pb-12 pt-6 text-center md:absolute md:inset-y-0 md:left-8 md:w-[min(380px,26vw)] md:justify-center md:items-start md:p-0 md:text-left lg:left-14"
      >
        <motion.h2
          variants={line}
          className="font-display text-[clamp(1.75rem,3.5vw,3rem)] font-semibold uppercase leading-[1] tracking-[0.12em] text-white"
        >
          <span className="block">{title[0]}</span>
          <span className="block">{title[1]}</span>
        </motion.h2>

        <motion.div variants={line} className="mt-5 w-full md:w-auto">
          <Link
            to="/shop"
            search={{ type }}
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
