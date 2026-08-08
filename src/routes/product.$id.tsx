import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { fetchProducts, toCardProduct } from "@/lib/catalog";
import { Plus, Minus } from "lucide-react";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "Product — BXLACK SS26" },
      { name: "description", content: "A numbered, small-batch BXLACK piece. Cut in Antwerp, finished in Tokyo." },
      { property: "og:title", content: "Product — BXLACK SS26" },
      { property: "og:description", content: "A numbered, small-batch BXLACK piece from the SS26 collection." },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductPage,
});


function ProductPage() {
  const { id } = Route.useParams();
  const [size, setSize] = useState("M");
  const [activeImg, setActiveImg] = useState(0);
  const [openAcc, setOpenAcc] = useState<string | null>("details");

  const { data, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => fetchProducts(),
  });

  const all = (data ?? []).map(toCardProduct);
  const product = all.find((p) => p.id === id);

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex min-h-[70vh] items-center justify-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">Loading piece…</p>
        </div>
      </AppShell>
    );
  }

  if (!product) {
    return (
      <AppShell>
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-6 text-center">
          <h1 className="font-display text-3xl uppercase tracking-[-0.02em]">Piece not found</h1>
          <Link
            to="/shop"
            search={{ type: "All" }}
            className="border border-white/25 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.28em] text-white/70 hover:border-white hover:text-white"
          >
            Back to shop
          </Link>
        </div>
      </AppShell>
    );
  }

  const others = all.filter((p) => p.id !== product.id).slice(0, 4);
  const gallery = [product.image, ...(product.backImage ? [product.backImage] : [])];
  const isBack = product.backImage && activeImg === 1;

  const accordions = [
    {
      id: "details",
      title: "Product Details",
      body: "Cut and sewn in Antwerp from 260gsm heavyweight organic cotton. Screen-printed graphic finished by hand in Tokyo. Boxy fit, dropped shoulder, ribbed collar. Numbered piece of fifty.",
    },
    {
      id: "size",
      title: "Size Chart",
      body: "XS · 48 / S · 50 / M · 52 / L · 54 / XL · 56 (chest, cm). Model wears M and is 186cm. Runs true to size — size down for a closer silhouette.",
    },
    {
      id: "ship",
      title: "Shipping & Returns",
      body: "Complimentary express shipping worldwide · 48h dispatch from Antwerp. Free returns within 30 days on unworn pieces with original packaging and numbered tag intact.",
    },
  ];

  return (
    <AppShell>
      <section className="pt-24 sm:pt-28 md:pt-14">
        <div className="mx-auto mb-6 max-w-[1600px] px-5 sm:px-6 md:mb-8 md:px-12">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
            <Link to="/shop" search={{ type: "All" }} className="transition-colors hover:text-white">All Categories</Link>
            <span className="text-white/25">/</span>
            <Link to="/shop" search={{ type: product.category }} className="transition-colors hover:text-white">
              {product.category === "Tshirt" ? "T-Shirt" : product.category}
            </Link>
            <span className="text-white/25">/</span>
            <span className="text-white/70">{product.name}</span>
          </nav>
        </div>
        <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-8 px-5 sm:px-6 md:grid-cols-12 md:gap-6 md:px-12">
          {/* Left — name, price, accordions */}
          <aside className="order-2 md:order-1 md:col-span-4">
            <div className="md:sticky md:top-20">
              <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/40">BXLACK · SS26</p>
              <h1 className="mt-2 font-display text-[20px] uppercase leading-[1.05] tracking-[-0.01em] text-white sm:text-[22px] md:text-[26px]">
                {product.name}
              </h1>
              <p className="mt-2 font-mono text-[12px] tracking-[0.05em] text-white/60">₹{product.price} INR</p>

              <div className="mt-6 border-t border-white/10">
                {accordions.map((a) => {
                  const open = openAcc === a.id;
                  return (
                    <div key={a.id} className="border-b border-white/10">
                      <button
                        onClick={() => setOpenAcc(open ? null : a.id)}
                        className="flex w-full items-center justify-between py-3 text-left"
                      >
                        <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/85">{a.title}</span>
                        {open ? <Minus size={12} className="text-white/50" /> : <Plus size={12} className="text-white/50" />}
                      </button>
                      <motion.div
                        initial={false}
                        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
                        transition={{ duration: 0.4, ease: [0.7, 0, 0.2, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="pb-4 pr-4 font-editorial text-[12px] leading-[1.7] tracking-[0.01em] text-white/55">{a.body}</p>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Middle — product image */}
          <div className="order-1 flex items-start justify-center md:order-2 md:col-span-4">
            <div className="relative aspect-[3/4] w-full max-w-[320px] overflow-hidden bg-[oklch(0.08_0_0)] sm:max-w-[280px] md:max-w-[260px]">
              <motion.img
                key={activeImg}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.7, 0, 0.2, 1] }}
                src={gallery[activeImg]}
                alt={`${product.name} — ${isBack ? "back" : "front"}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              {isBack && (
                <div className="absolute right-3 top-3">
                  <span className="flex items-center gap-2 border border-white/40 bg-black/30 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.3em] text-white backdrop-blur">
                    Back view
                  </span>
                </div>
              )}
              {!isBack && gallery.length > 1 && (
                <div className="absolute left-3 top-3">
                  <span className="flex items-center gap-2 border border-white/40 bg-black/30 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.3em] text-white backdrop-blur">
                    Front view
                  </span>
                </div>
              )}

              {/* Gallery thumbnails */}
              {gallery.length > 1 && (
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3">
                  {gallery.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`group relative h-12 w-9 overflow-hidden border transition-all ${activeImg === i ? "border-white" : "border-white/20 hover:border-white/60"}`}
                      aria-label={`View ${i === 0 ? "front" : "back"}`}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right — sizes + add to cart */}
          <aside className="order-3 md:col-span-4">
            <div className="md:sticky md:top-20">
              <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/40">Select Size</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                {["S", "M", "L", "XL", "XXL"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`font-mono text-[11px] uppercase tracking-[0.22em] transition-colors ${size === s ? "text-white underline underline-offset-[6px] decoration-[1.5px]" : "text-white/45 hover:text-white/80"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <button
                data-cursor="Add"
                className="mt-6 w-full border border-white bg-white py-[14px] font-mono text-[11px] uppercase tracking-[0.32em] text-black transition-colors hover:bg-transparent hover:text-white"
              >
                Add to Cart — ₹{product.price}
              </button>

              <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.28em] text-white/35">
                Complimentary express · Numbered 1/50
              </p>
            </div>
          </aside>
        </div>

        {/* Recommended */}
        <div className="mx-auto mt-20 max-w-[1600px] border-t border-white/10 px-5 pt-12 sm:px-6 md:mt-40 md:px-10 md:pt-16">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-3xl leading-[0.9] tracking-[-0.03em] text-white sm:text-5xl md:text-7xl">
              You may also <em className="font-editorial italic text-white/60">consider.</em>
            </h2>
            <Link to="/shop" search={{ type: "All" }} className="hidden font-mono text-[11px] uppercase tracking-[0.3em] text-white/60 hover:text-white md:block" data-cursor="View">View all →</Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:mt-12 md:grid-cols-4 md:gap-6">
            {others.map((o, i) => (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.9 }}
                className="group"
              >
                <Link to="/product/$id" params={{ id: o.id }} data-cursor="View" className="block">
                  <div className="relative aspect-[3/4] overflow-hidden bg-[oklch(0.08_0_0)]">
                    <img src={o.image} alt={o.name} className="h-full w-full object-cover transition-transform duration-[1.4s] group-hover:scale-110" loading="lazy" />
                  </div>
                  <div className="mt-3 flex items-baseline justify-between gap-2">
                    <p className="min-w-0 truncate font-display text-sm text-white sm:text-lg">{o.name}</p>
                    <p className="shrink-0 font-mono text-[11px] text-white/70 sm:text-xs">₹{o.price}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="h-20 md:h-32" />
      </section>
    </AppShell>
  );
}
