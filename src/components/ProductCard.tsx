import { Link } from "@tanstack/react-router";
import type { Product } from "@/lib/products";

/**
 * Product tile. Hovering (or keyboard-focusing) the card slowly zooms the
 * photo and, when the product has a back view, crossfades to it — a quiet
 * cue that the card is interactive. Transform/opacity only, no layout shift.
 */
export function ProductCard({ product }: { product: Product }) {
  const imageMotion =
    "absolute inset-0 h-full w-full object-cover transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]";
  return (
    <div className="group">
      <Link
        to="/product/$id"
        params={{ id: product.id }}
        className="block outline-none focus-visible:ring-1 focus-visible:ring-white/60 focus-visible:ring-offset-4 focus-visible:ring-offset-noir"
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#0A0A0A]">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className={`${imageMotion} group-hover:scale-[1.04] group-focus-within:scale-[1.04] ${
                product.backImage ? "group-hover:opacity-0 group-focus-within:opacity-0" : ""
              }`}
              loading="lazy"
              decoding="async"
            />
          ) : null}
          {product.backImage ? (
            <img
              src={product.backImage}
              alt=""
              aria-hidden
              className={`${imageMotion} scale-[1.04] opacity-0 group-hover:scale-100 group-hover:opacity-100 group-focus-within:scale-100 group-focus-within:opacity-100`}
              loading="lazy"
              decoding="async"
            />
          ) : null}
        </div>

        <div className="mt-4">
          <h2 className="relative inline-block font-sans text-sm leading-snug text-white/90 transition-colors duration-300 group-hover:text-white sm:text-[15px]">
            {product.name}
            {/* Underline that draws in from the left on hover */}
            <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-white/70 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100" />
          </h2>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-[13px] text-white sm:text-sm">₹{product.price}</span>
            {product.compareAt ? (
              <span className="font-mono text-[11px] text-white/35 line-through sm:text-xs">₹{product.compareAt}</span>
            ) : null}
          </div>
        </div>
      </Link>
    </div>
  );
}
