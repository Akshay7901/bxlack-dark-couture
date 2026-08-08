import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import hero from "@/assets/hero.jpg";

export function FirstDrop() {
  return (
    <section className="relative overflow-hidden bg-noir py-20 sm:py-28 md:py-36">
      <img
        src={hero}
        alt=""
        aria-hidden
        loading="lazy"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.18]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-noir via-noir/60 to-noir" />

      <div className="relative mx-auto grid max-w-[1600px] gap-10 px-5 sm:px-6 md:grid-cols-[1.2fr_1fr] md:items-end md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.9, ease: [0.7, 0, 0.2, 1] }}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/50">
            Chapter 001 — The First Drop
          </p>
          <h2 className="mt-6 font-display text-[13vw] font-medium leading-[0.88] tracking-[-0.04em] text-white sm:text-6xl md:text-[6.5rem]">
            One colour.
            <br />
            <em className="font-editorial italic text-white/70">Zero compromise.</em>
          </h2>
          <p className="mt-8 max-w-md font-sans text-sm leading-relaxed text-white/55">
            Five pieces. Cut once, numbered by hand, released in a single run.
            When the first drop is gone, it does not return.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ delay: 0.15, duration: 0.9, ease: [0.7, 0, 0.2, 1] }}
          className="flex flex-col items-start gap-5 md:items-end"
        >
          <div className="flex flex-wrap gap-3">
            <Link
              to="/shop"
              search={{ type: "All" }}
              data-cursor="Shop"
              className="rounded-full bg-white px-8 py-4 font-mono text-[11px] uppercase tracking-[0.3em] text-noir transition-transform duration-300 hover:scale-[1.03]"
            >
              Shop the drop
            </Link>
            <Link
              to="/lookbook"
              data-cursor="View"
              className="rounded-full border border-white/25 px-8 py-4 font-mono text-[11px] uppercase tracking-[0.3em] text-white/80 transition-colors duration-300 hover:border-white hover:text-white"
            >
              View campaign
            </Link>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/40">
            Born to stand apart
          </p>
        </motion.div>
      </div>
    </section>
  );
}
