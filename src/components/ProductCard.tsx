import { Link } from "@tanstack/react-router";
import type { Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group">
      <Link to="/product/$id" params={{ id: product.id }} className="block">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#0A0A0A]">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
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
        </div>
      </Link>
    </div>
  );
}