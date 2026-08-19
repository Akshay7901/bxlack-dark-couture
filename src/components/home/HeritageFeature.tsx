import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import heritageImage from "@/assets/heritage-shirt-fuji.png";

export function HeritageFeature() {
  return (
    <section className="relative overflow-hidden bg-noir text-foreground">
      <div className="relative w-full">
        <motion.img
          src={heritageImage}
          alt="BXLACK embroidered camp-collar shirt worn at sunrise before a snow-capped mountain"
          className="block h-auto w-full object-contain"
          initial={{ scale: 1.04 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true, amount: 0.01 }}
          transition={{ duration: 1.4, ease: [0.7, 0, 0.2, 1] }}
        />

        <div className="pointer-events-none absolute inset-0 flex flex-col items-start justify-center gap-4 pl-6 sm:pl-10 md:pl-16">
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-foreground/90 sm:text-[11px]">
            Shirt Drops
          </p>
          <Link
            to="/shop"
            search={{ type: "Shirt" }}
            className="pointer-events-auto font-mono text-[10px] uppercase tracking-[0.35em] text-foreground relative inline-block after:absolute after:-bottom-2 after:left-0 after:h-px after:w-full after:origin-bottom-right after:scale-x-0 after:bg-current after:transition-transform after:duration-500 after:ease-[cubic-bezier(0.7,0,0.2,1)] after:content-[''] hover:after:origin-bottom-left hover:after:scale-x-100 sm:text-[11px]"
          >
            Shop Now
          </Link>
        </div>
      </div>
    </section>
  );
}
