import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/lib/products";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * "The Drop": every published product in a swipeable row, in the order set in
 * Studio → Products. Native horizontal scrolling with snap points (swipe on
 * phones, trackpad, or the arrow buttons), a numbered counter and a thin
 * progress line. The next card always peeks in so it reads as scrollable.
 */
export function ProductSlider({ products }: { products: Product[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(1);
  const [progress, setProgress] = useState(0);
  const [canScroll, setCanScroll] = useState(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const first = el.firstElementChild as HTMLElement | null;
    const step = first ? first.offsetWidth + parseFloat(getComputedStyle(el).columnGap || "0") : el.clientWidth;
    setCanScroll(max > 4);
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft >= max - 4);
    setProgress(max > 0 ? el.scrollLeft / max : 1);
    // At the far end, count the last card as current so the counter reaches 05 / 05.
    setIndex(el.scrollLeft >= max - 4 ? products.length : Math.min(products.length, Math.round(el.scrollLeft / step) + 1));
  }, [products.length]);

  useEffect(() => {
    measure();
    const el = track.current;
    if (!el) return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  const scrollByCard = (direction: -1 | 1) => {
    const el = track.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return;
    const gap = parseFloat(getComputedStyle(el).columnGap || "0");
    el.scrollBy({ left: direction * (first.offsetWidth + gap), behavior: "smooth" });
  };

  if (products.length === 0) return null;

  return (
    <section aria-labelledby="the-drop" className="bg-noir py-14 text-foreground sm:py-20 md:py-24">
      <div className="mx-auto max-w-[1600px] px-5 sm:px-6 md:px-10">
        <div className="mb-8 flex items-end justify-between gap-6 sm:mb-10">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-mid-grey/70">SS26 · Numbered pieces</p>
            <h2
              id="the-drop"
              className="mt-3 font-display text-2xl font-medium uppercase tracking-[0.12em] sm:text-3xl md:text-4xl"
            >
              The Drop
            </h2>
          </div>
          <div className="flex items-center gap-5">
            <span className="font-mono text-[11px] tabular-nums tracking-[0.2em] text-light-grey/60" aria-live="polite">
              {pad(index)} / {pad(products.length)}
            </span>
            {canScroll ? (
              <div className="hidden gap-2 sm:flex">
                {([-1, 1] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => scrollByCard(d)}
                    disabled={d < 0 ? atStart : atEnd}
                    aria-label={d < 0 ? "Previous products" : "Next products"}
                    className="flex h-11 w-11 items-center justify-center border border-light-grey/20 text-foreground transition-colors hover:border-white hover:bg-white hover:text-black disabled:pointer-events-none disabled:opacity-30"
                  >
                    {d < 0 ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* The row reveals as a whole (cards staggered), so a card that only
            peeks in from the edge is still shown. */}
        <motion.div
          ref={track}
          onScroll={measure}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-10%" }}
          variants={{ show: { transition: { staggerChildren: 0.07 } } }}
          tabIndex={0}
          role="region"
          aria-label="The Drop: products, scroll sideways for more"
          className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-5 pb-1 outline-none [scrollbar-width:none] focus-visible:ring-1 focus-visible:ring-white/40 sm:-mx-6 sm:gap-5 sm:px-6 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden"
          style={{ scrollPaddingInline: "1.25rem" }}
        >
          {products.map((p) => (
            <motion.div
              key={p.id}
              variants={{
                hidden: { opacity: 0, y: 24 },
                show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.7, 0, 0.2, 1] } },
              }}
              className="w-[78%] shrink-0 snap-start sm:w-[44%] lg:w-[30%] xl:w-[22%]"
            >
              <ProductCard product={p} />
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-8 flex items-center justify-between gap-6">
          {canScroll ? (
            <div className="relative h-px flex-1 bg-light-grey/15" aria-hidden>
              <div
                className="absolute inset-y-0 left-0 bg-white transition-[width] duration-300 ease-out"
                style={{ width: `${Math.max(progress, 1 / products.length) * 100}%` }}
              />
            </div>
          ) : (
            <span className="flex-1" />
          )}
          <Link
            to="/shop"
            search={{ type: "All" }}
            className="inline-flex shrink-0 items-center gap-3 border-b border-white/60 pb-1 font-mono text-[10px] uppercase tracking-[0.3em] text-white transition-all hover:gap-5"
          >
            View all pieces <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
