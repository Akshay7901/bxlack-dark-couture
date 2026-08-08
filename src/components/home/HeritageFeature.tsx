import { motion } from "framer-motion";
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
      </div>
    </section>
  );
}