import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import heritageAsset from "@/assets/heritage-shirt.png.asset.json";

export function HeritageFeature() {
  return (
    <section className="relative overflow-hidden bg-noir text-foreground">
      <div className="relative h-[70vh] min-h-[420px] w-full sm:h-[80vh] md:h-screen">
        <motion.img
          src={heritageAsset.url}
          alt="BXLACK embroidered camp-collar shirt worn against a concrete warehouse wall"
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ scale: 1.08, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 1.4, ease: [0.7, 0, 0.2, 1] }}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/10 to-black/85" />

        <div className="absolute inset-0 flex flex-col justify-between px-5 py-8 text-right sm:px-6 sm:py-10 md:px-10 md:py-14">
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-foreground/60">
            Heritage Series — 002
          </p>

          <div className="ml-auto max-w-2xl">
            <h2 className="font-display text-[13vw] font-medium uppercase leading-[0.88] tracking-[-0.04em] sm:text-6xl md:text-8xl">
              Ornament <span className="text-foreground/40">.</span>
            </h2>
            <p className="ml-auto mt-4 max-w-md font-sans text-xs leading-relaxed text-foreground/60 sm:text-sm">
              Silver-threaded panels on a boxy camp-collar shirt. Old-world motif, cut for
              the street.
            </p>
            <Link
              to="/shop" search={{ type: "All" }}
              className="mt-6 inline-block border-b border-foreground/40 pb-1 font-mono text-[10px] uppercase tracking-[0.3em] text-foreground transition-colors hover:border-foreground sm:text-[11px]"
            >
              Discover the piece
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}