import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { products } from "@/lib/products";

const panels = [
  { type: "Tshirt", label: "Jersey", index: "01" },
  { type: "Shirt", label: "Tailoring", index: "02" },
  { type: "Jeans", label: "Denim", index: "03" },
] as const;

export function SplitCategories() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <section className="bg-noir">
      <div className="mx-auto max-w-[1600px] px-5 pb-8 pt-16 sm:px-6 md:px-10 md:pb-12 md:pt-28">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-[11vw] font-medium uppercase leading-[0.9] tracking-[-0.04em] text-foreground sm:text-5xl md:text-7xl">
            Three <em className="font-editorial italic text-foreground/60">registers.</em>
          </h2>
          <p className="max-w-xs font-sans text-xs leading-relaxed text-foreground/45 md:text-sm">
            Hover to open a chapter. Each register is cut, numbered and released in fifties.
          </p>
        </div>
      </div>

      <div
        className="flex h-[70vh] min-h-[440px] flex-col gap-1 px-5 pb-16 sm:px-6 md:h-[78vh] md:flex-row md:px-10 md:pb-28"
        onMouseLeave={() => setActive(null)}
      >
        {panels.map((p, i) => {
          const item = products.find((x) => x.category === p.type) ?? products[0];
          const isActive = active === i;
          const isDimmed = active !== null && !isActive;
          return (
            <Link
              key={p.type}
              to="/shop"
              search={{ type: p.type }}
              data-cursor="Enter"
              onMouseEnter={() => setActive(i)}
              className="group relative block flex-1 overflow-hidden bg-charcoal transition-[flex-grow,opacity] duration-[900ms] ease-[cubic-bezier(0.7,0,0.2,1)] md:min-w-0"
              style={{ flexGrow: isActive ? 2.4 : 1, opacity: isDimmed ? 0.45 : 1 }}
            >
              <img
                src={item.image}
                alt={p.label}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover grayscale transition-all duration-[1200ms] ease-[cubic-bezier(0.7,0,0.2,1)] group-hover:scale-105 group-hover:grayscale-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-noir/85 via-noir/10 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-between p-5 md:p-7">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/60">{p.index}</span>
                <div className="min-w-0">
                  <p className="truncate font-display text-2xl uppercase leading-none tracking-[-0.02em] text-foreground md:text-4xl">
                    {p.label}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-2 overflow-hidden font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/0 transition-colors duration-500 group-hover:text-foreground/80">
                    Enter <span>→</span>
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
