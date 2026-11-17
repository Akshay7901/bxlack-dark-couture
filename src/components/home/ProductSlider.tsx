import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/lib/products";

/** Cards in one loop: enough that a single copy is wider than any screen. */
const MIN_LOOP = 8;
/** Seconds each card takes to travel past, so speed stays the same at any product count. */
const SECONDS_PER_CARD = 6;

/**
 * "The Drop": every published product, in the order set in Studio → Products,
 * gliding right to left in an endless loop. The row is the product list
 * repeated to fill the screen and rendered twice, so sliding it by exactly
 * half (the existing `animate-marquee` keyframes) loops
 * seamlessly. Hovering, touching or tabbing into it pauses the motion; with
 * "reduce motion" on, it is a plain row to scroll by hand.
 */
export function ProductSlider({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  const loop: Product[] = [];
  while (loop.length < MIN_LOOP) loop.push(...products);
  const cards = [...loop, ...loop];

  return (
    <section aria-labelledby="the-drop" className="bg-noir pb-8 pt-0 text-foreground sm:pb-10 md:pb-12">
      <div className="mx-auto mb-6 flex max-w-[1600px] items-end justify-between gap-6 px-5 sm:mb-8 md:mb-10 sm:px-6 md:px-10">
        <div>
          <h2 id="the-drop" className="font-display text-2xl font-medium uppercase tracking-[0.12em] sm:text-3xl md:text-4xl">
            The Drop
          </h2>
        </div>
        <Link
          to="/shop"
          search={{ type: "All" }}
          className="inline-flex shrink-0 items-center gap-3 border-b border-white/60 pb-1 font-mono text-[10px] uppercase tracking-[0.3em] text-white transition-all hover:gap-5"
        >
          View all pieces <span>→</span>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.8, ease: [0.7, 0, 0.2, 1] }}
        role="region"
        aria-label="The Drop: products"
        className="group/drop overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)] motion-reduce:overflow-x-auto motion-reduce:[mask-image:none]"
      >
        <div
          className="flex w-max animate-marquee group-hover/drop:[animation-play-state:paused] group-focus-within/drop:[animation-play-state:paused] group-active/drop:[animation-play-state:paused] motion-reduce:animate-none"
          style={{ animationDuration: `${loop.length * SECONDS_PER_CARD}s` }}
        >
          {cards.map((p, i) => {
            const copy = i >= products.length;
            return (
              <div
                key={`${p.id}-${i}`}
                // Repeats exist only to make the loop seamless: still clickable,
                // but hidden from screen readers and skipped by the keyboard.
                aria-hidden={copy || undefined}
                className={`mr-4 w-[70vw] shrink-0 sm:mr-5 sm:w-[42vw] md:w-[30vw] lg:w-[300px] xl:w-[330px] ${
                  copy ? "motion-reduce:hidden" : ""
                }`}
              >
                <ProductCard product={p} tabIndex={copy ? -1 : undefined} />
              </div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
