import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { products } from "@/lib/products";
import { fetchCategoryImages } from "@/lib/catalog";
import wreckTee from "@/assets/wreck-tee-back.png";

const categories = [
  { label: "Shirt", type: "Shirt" },
  { label: "T-Shirt", type: "Tshirt" },
  { label: "Jeans", type: "Jeans" },
] as const;

function fallbackImageFor(type: string) {
  if (type === "Tshirt") return wreckTee;
  return products.find((p) => p.category === type)?.image ?? products[0].image;
}

export function ShopByCategory() {
  const { data: categoryImages = [], isPending } = useQuery({
    queryKey: ["category-images"],
    queryFn: () => fetchCategoryImages(),
  });
  const imageByCategory = new Map(categoryImages.map((c) => [c.category, c.imageUrl]));
  // While the query is in flight we don't yet know whether a category has an
  // admin-uploaded image, so render nothing rather than flashing the wrong
  // (static fallback) photo and then swapping it out once data arrives.
  const imageFor = (type: string) => {
    const uploaded = imageByCategory.get(type);
    if (uploaded) return uploaded;
    return isPending ? null : fallbackImageFor(type);
  };

  return (
    <section className="bg-noir py-14 text-foreground sm:py-20 md:py-28">
      <div className="mx-auto max-w-[1600px] px-5 sm:px-6 md:px-10">
        <h2 className="mb-8 text-center font-display text-xl font-medium uppercase tracking-[0.2em] sm:mb-12 sm:text-2xl md:mb-16">
          Shop by Category
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5 md:gap-6">
          {categories.map((c, i) => (
            <motion.div
              key={c.type}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ delay: i * 0.1, duration: 0.8, ease: [0.7, 0, 0.2, 1] }}
            >
              <Link to="/shop" search={{ type: c.type }} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden bg-card">
                  {imageFor(c.type) ? (
                    <img
                      src={imageFor(c.type) ?? undefined}
                      alt={c.label}
                      className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.7,0,0.2,1)] group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full animate-pulse bg-white/5" />
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 to-transparent" />
                  <p className="absolute inset-x-0 bottom-5 text-center font-display text-sm font-medium uppercase tracking-[0.18em] text-foreground sm:bottom-6 sm:text-base">
                    {c.label}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
