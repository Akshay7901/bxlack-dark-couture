import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchCategories, fetchProducts, toCardProduct } from "@/lib/catalog";
import wreckTee from "@/assets/wreck-tee-back.png.asset.json";

export function ShopByCategory() {
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => fetchCategories(),
  });
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => fetchProducts(),
  });
  const cardProducts = products.map(toCardProduct);

  const fallbackFor = (slug: string) => {
    if (slug === "Tshirt") return wreckTee.url;
    return cardProducts.find((p) => p.category === slug)?.image ?? cardProducts[0]?.image ?? wreckTee.url;
  };

  if (categories.length === 0) return null;

  return (
    <section className="bg-noir py-14 text-foreground sm:py-20 md:py-28">
      <div className="mx-auto max-w-[1600px] px-5 sm:px-6 md:px-10">
        <h2 className="mb-8 text-center font-display text-xl font-medium uppercase tracking-[0.2em] sm:mb-12 sm:text-2xl md:mb-16">
          Shop by Category
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5 md:gap-6">
          {categories.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ delay: i * 0.1, duration: 0.8, ease: [0.7, 0, 0.2, 1] }}
            >
              <Link
                to="/shop"
                search={{ type: c.slug }}
                className="group block"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-card">
                  <img
                    src={c.imageUrl ?? fallbackFor(c.slug)}
                    alt={c.name}
                    className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.7,0,0.2,1)] group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 to-transparent" />
                  <p className="absolute inset-x-0 bottom-5 text-center font-display text-sm font-medium uppercase tracking-[0.18em] text-foreground sm:bottom-6 sm:text-base">
                    {c.name}
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
