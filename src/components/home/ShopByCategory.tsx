import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { products } from "@/lib/products";
import { useCategories } from "@/lib/categories";
import wreckTee from "@/assets/wreck-tee-back.webp";

/** Built-in photo for the launch categories; newer categories need an uploaded image. */
function fallbackImageFor(type: string) {
  if (type === "Tshirt") return wreckTee;
  return products.find((p) => p.category === type)?.image ?? null;
}

const GRID_COLS: Record<number, string> = {
  1: "sm:grid-cols-1 sm:max-w-md sm:mx-auto",
  2: "sm:grid-cols-2",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

export function ShopByCategory() {
  const { categories, isPlaceholderData } = useCategories();
  // While the query is in flight we don't yet know whether a category has an
  // admin-uploaded image, so render nothing rather than flashing the wrong
  // (static fallback) photo and then swapping it out once data arrives.
  const imageFor = (key: string, uploaded: string | null) => {
    if (uploaded) return uploaded;
    return isPlaceholderData ? undefined : fallbackImageFor(key);
  };

  if (categories.length === 0) return null;

  return (
    <section className="bg-noir py-14 text-foreground sm:py-20 md:py-28">
      <div className="mx-auto max-w-[1600px] px-5 sm:px-6 md:px-10">
        <h2 className="mb-8 text-center font-display text-xl font-medium uppercase tracking-[0.2em] sm:mb-12 sm:text-2xl md:mb-16">
          Shop by Category
        </h2>

        <div
          className={`grid grid-cols-1 gap-4 sm:gap-5 md:gap-6 ${GRID_COLS[categories.length] ?? "sm:grid-cols-3"}`}
        >
          {categories.map((c, i) => {
            const image = imageFor(c.key, c.imageUrl);
            return (
              <motion.div
                key={c.key}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ delay: (i % 3) * 0.1, duration: 0.8, ease: [0.7, 0, 0.2, 1] }}
              >
                <Link to="/shop" search={{ type: c.key }} className="group block">
                  <div className="relative aspect-[4/5] overflow-hidden bg-card">
                    {image ? (
                      <img
                        src={image}
                        alt={c.label}
                        className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.7,0,0.2,1)] group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : image === undefined ? (
                      <div className="h-full w-full animate-pulse bg-white/5" />
                    ) : (
                      <div className="h-full w-full bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.08),transparent_70%)] transition-transform duration-700 group-hover:scale-105" />
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 to-transparent" />
                    <p className="absolute inset-x-0 bottom-5 text-center font-display text-sm font-medium uppercase tracking-[0.18em] text-foreground sm:bottom-6 sm:text-base">
                      {c.label}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
