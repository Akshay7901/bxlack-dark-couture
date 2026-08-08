import { motion } from "framer-motion";
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
      </div>
    </section>
  );
}