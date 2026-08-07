import { Link } from "@tanstack/react-router";
import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";
import p5 from "@/assets/p5.jpg";
import look2 from "@/assets/look2.jpg";

const TILES = [
  { label: "Relaxed Fit", type: "Tshirt", img: p3 },
  { label: "Oversized", type: "Tshirt", img: p5 },
  { label: "Shirts", type: "Shirt", img: p1 },
  { label: "Denim", type: "Jeans", img: p2 },
  { label: "Outerwear", type: "Shirt", img: p4 },
  { label: "All Pieces", type: "All", img: look2 },
] as const;

export function ShopByCollection() {
  return (
    <section className="bg-noir py-16 md:py-28">
      <div className="mx-auto max-w-[1600px] px-5 sm:px-6 md:px-10">
        <h2 className="mb-8 text-center font-display text-2xl font-medium uppercase tracking-[0.05em] text-foreground sm:text-3xl md:mb-14 md:text-4xl">
          Shop by collection
        </h2>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6 md:gap-6">
          {TILES.map((t) => (
            <Link
              key={t.label}
              to="/shop"
              search={{ type: t.type }}
              data-cursor="Enter"
              className="group block text-center"
            >
              <div className="relative aspect-square overflow-hidden rounded-full bg-card">
                <img
                  src={t.img}
                  alt={t.label}
                  loading="lazy"
                  className="h-full w-full object-cover grayscale transition-all duration-700 ease-[cubic-bezier(0.7,0,0.2,1)] group-hover:scale-110 group-hover:grayscale-0"
                />
              </div>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/60 transition-colors group-hover:text-foreground">
                {t.label}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}