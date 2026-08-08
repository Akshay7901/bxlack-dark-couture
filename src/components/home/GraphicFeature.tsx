import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import wreckAsset from "@/assets/wreck-tee-back.png.asset.json";

export function GraphicFeature() {
  return (
    <section className="relative overflow-hidden bg-noir text-foreground">
      <div className="relative w-full">
        <motion.img
          src={wreckAsset.url}
          alt="BXLACK graphic tee shot from behind in a concrete corridor"
          className="block h-auto w-full object-contain"
          initial={{ scale: 1.08, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 1.4, ease: [0.7, 0, 0.2, 1] }}
          loading="lazy"
        />

        <div className="pointer-events-none absolute inset-0 flex items-center justify-start pl-6 sm:pl-10 md:pl-16">
          <Link
            to="/shop"
            search={{ type: "Tshirt" }}
            className="pointer-events-auto font-mono text-[10px] uppercase tracking-[0.35em] text-foreground transition-opacity hover:opacity-60 sm:text-[11px]"
          >
            Shop This
          </Link>
        </div>
      </div>
    </section>
  );
}