import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import heritageAsset from "@/assets/heritage-shirt.png.asset.json";

export function HeritageFeature() {
  return (
    <section className="relative overflow-hidden bg-noir text-foreground">
      <div className="relative w-full">
        <motion.img
          src={heritageAsset.url}
          alt="BXLACK embroidered camp-collar shirt worn against a concrete warehouse wall"
          className="block h-auto w-full object-contain"
          initial={{ scale: 1.08, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 1.4, ease: [0.7, 0, 0.2, 1] }}
          loading="lazy"
        />

        <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-10 sm:pb-14 md:pb-20">
          <Link
            to="/shop"
            search={{ type: "Shirt" }}
            className="pointer-events-auto rounded-full border border-white/40 bg-black/40 px-7 py-3 font-mono text-[10px] uppercase tracking-[0.35em] text-foreground backdrop-blur-md transition-colors hover:border-white hover:bg-foreground hover:text-background sm:text-[11px]"
          >
            Shop This
          </Link>
        </div>
      </div>
    </section>
  );
}