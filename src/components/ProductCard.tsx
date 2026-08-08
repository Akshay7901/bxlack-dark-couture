import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/lib/products";

const sizes = ["S", "M", "L", "XL", "XXL"] as const;

export function ProductCard({ product }: { product: Product }) {
  const gallery = (
    product.gallery && product.gallery.length > 0
      ? product.gallery
      : [product.image, product.backImage]
  ).filter(Boolean) as string[];
  const [index, setIndex] = useState(0);
  const multi = gallery.length > 1;

  const step = (dir: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i + dir + gallery.length) % gallery.length);
  };

  return (
    <div className="group">
      <Link to="/product/$id" params={{ id: product.id }} className="block">
        <div className="relative h-[clamp(300px,62vh,640px)] overflow-hidden bg-[#141414]">
          {gallery.map((src, i) => (
            <img
              key={`${src}-${i}`}
              src={src}
              alt={i === 0 ? product.name : ""}
              aria-hidden={i !== 0 ? true : undefined}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-[cubic-bezier(0.7,0,0.2,1)] ${
                i === index ? "opacity-100" : "opacity-0"
              }`}
              loading="lazy"
            />
          ))}

          {multi ? (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={step(-1)}
                className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/40 text-foreground opacity-0 backdrop-blur-md transition-all duration-300 hover:bg-background/70 group-hover:opacity-100 md:left-3"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={step(1)}
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/40 text-foreground opacity-0 backdrop-blur-md transition-all duration-300 hover:bg-background/70 group-hover:opacity-100 md:right-3"
              >
                <ChevronRight size={16} />
              </button>

              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
                {gallery.map((src, i) => (
                  <span
                    key={`${src}-${i}`}
                    className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                      i === index ? "bg-foreground" : "bg-foreground/35"
                    }`}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>

        <div className="mt-4">
          <h2 className="font-sans text-sm leading-snug text-white/90 sm:text-[15px]">{product.name}</h2>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-[13px] text-white sm:text-sm">₹{product.price}</span>
            {product.compareAt ? (
              <span className="font-mono text-[11px] text-white/35 line-through sm:text-xs">₹{product.compareAt}</span>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {sizes.map((s) => (
              <span
                key={s}
                className="border border-white/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-white/55"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </div>
  );
}