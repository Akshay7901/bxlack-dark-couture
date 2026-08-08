import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import wreckAsset from "@/assets/wreck-tee-back.png.asset.json";

export function GraphicFeature() {
  return (
    <section className="relative overflow-hidden bg-noir text-foreground">
      <div className="relative h-[70vh] min-h-[420px] w-full sm:h-[80vh] md:h-screen">
        <motion.img
          src={wreckAsset.url}
          alt="BXLACK graphic tee shot from behind in a concrete corridor"
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ scale: 1.08, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 1.4, ease: [0.7, 0, 0.2, 1] }}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/40" />

        <div className="absolute inset-0 flex flex-col justify-between px-5 py-8 sm:px-6 sm:py-10 md:px-10 md:py-14">
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-foreground/60">
            Graphic Series — 001
          </p>

          <div className="max-w-2xl">
            <h2 className="font-display text-[13vw] font-medium uppercase leading-[0.88] tracking-[-0.04em] sm:text-6xl md:text-8xl">
              Wreckage <span className="text-foreground/40">.</span>
            </h2>
            <p className="mt-4 max-w-md font-sans text-xs leading-relaxed text-foreground/60 sm:text-sm">
              Hand-etched backpiece on heavyweight oversized cotton. Printed in fifty units,
              never restocked.
            </p>
            <Link
              to="/shop"
              className="mt-6 inline-block border-b border-foreground/40 pb-1 font-mono text-[10px] uppercase tracking-[0.3em] text-foreground transition-colors hover:border-foreground sm:text-[11px]"
            >
              Shop the series
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}