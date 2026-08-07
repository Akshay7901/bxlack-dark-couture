import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import look1 from "@/assets/look1.jpg";

const SLIDES = [
  { label: "T-Shirts", type: "Tshirt", img: p3 },
  { label: "Shirts", type: "Shirt", img: p1 },
  { label: "Denim", type: "Jeans", img: p2 },
  { label: "Outerwear", type: "Shirt", img: look1 },
] as const;

export function CategorySlides() {
  return (
    <section className="bg-noir">
      <div className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SLIDES.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.8, delay: i * 0.05 }}
            className="relative h-[70vh] w-full shrink-0 snap-center overflow-hidden md:h-[86vh]"
          >
            <img
              src={s.img}
              alt={s.label}
              loading="lazy"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-noir/90 via-noir/20 to-noir/30" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 p-8 text-center md:p-14">
              <h2 className="font-display text-[11vw] font-medium uppercase leading-[0.9] tracking-[-0.04em] text-foreground sm:text-5xl md:text-7xl">
                {s.label}
              </h2>
              <Link
                to="/shop"
                search={{ type: s.type }}
                data-cursor="Shop"
                className="font-mono text-[11px] uppercase tracking-[0.35em] text-foreground/70 transition-colors hover:text-foreground"
              >
                Shop now →
              </Link>
            </div>
            <span className="absolute right-5 top-5 font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/40 md:right-10 md:top-10">
              0{i + 1} / 0{SLIDES.length}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}