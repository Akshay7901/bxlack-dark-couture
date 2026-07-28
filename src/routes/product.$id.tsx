import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { products } from "@/lib/products";
import { Plus, Minus } from "lucide-react";

export const Route = createFileRoute("/product/$id")({
  loader: ({ params }) => {
    const product = products.find((p) => p.id === params.id);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.product.name} — BXLACK` },
          { name: "description", content: `${loaderData.product.name} · ${loaderData.product.tag}. Numbered, small-batch.` },
          { property: "og:title", content: `${loaderData.product.name} — BXLACK` },
          { property: "og:description", content: `${loaderData.product.tag} · €${loaderData.product.price}. Cut in Antwerp, finished in Tokyo.` },
        ]
      : [{ title: "BXLACK" }, { name: "robots", content: "noindex" }],
  }),
  component: ProductPage,
});


function ProductPage() {
  const { product } = Route.useLoaderData();
  const [size, setSize] = useState("M");
  const [activeImg, setActiveImg] = useState(0);
  const [openAcc, setOpenAcc] = useState<string | null>("details");

  const others = products.filter((p) => p.id !== product.id).slice(0, 4);
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
      <section className="pt-28">
        <div className="mx-auto mt-8 grid max-w-[1600px] grid-cols-1 gap-12 px-6 md:grid-cols-12 md:gap-10 md:px-10">
          {/* Left — name, price, accordions */}
          <aside className="order-2 md:order-1 md:col-span-3">
            <div className="md:sticky md:top-28">
              <h1 className="text-center font-display text-2xl uppercase leading-[1.1] tracking-[0.02em] text-white md:text-3xl">
                {product.name}
              </h1>
              <p className="mt-4 text-center font-mono text-sm text-white/70">€{product.price}.00</p>

              <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
                {accordions.map((a) => {
                  const open = openAcc === a.id;
                  return (
                    <div key={a.id}>
                      <button
                        onClick={() => setOpenAcc(open ? null : a.id)}
                        className="flex w-full items-center justify-between py-4 text-left"
                      >
                        <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/80">{a.title}</span>
                        {open ? <Minus size={14} className="text-white/60" /> : <Plus size={14} className="text-white/60" />}
                      </button>
                      <motion.div
                        initial={false}
                        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
                        transition={{ duration: 0.4, ease: [0.7, 0, 0.2, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="pb-5 font-editorial text-sm leading-relaxed text-white/60">{a.body}</p>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Middle — product image */}
          <div className="order-1 md:order-2 md:col-span-6">
            <div className="relative aspect-[3/4] overflow-hidden bg-[oklch(0.08_0_0)]">
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
                <div className="absolute right-4 top-4">
                  <span className="flex items-center gap-2 border border-white/40 bg-black/30 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.3em] text-white backdrop-blur">
                    Back view
                  </span>
                </div>
              )}
              {!isBack && gallery.length > 1 && (
                <div className="absolute left-4 top-4">
                  <span className="flex items-center gap-2 border border-white/40 bg-black/30 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.3em] text-white backdrop-blur">
                    Front view
                  </span>
                </div>
              )}

              {/* Gallery thumbnails */}
              {gallery.length > 1 && (
                <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3">
                  {gallery.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`group relative h-14 w-11 overflow-hidden border transition-all ${activeImg === i ? "border-white" : "border-white/20 hover:border-white/60"}`}
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
          <aside className="order-3 md:col-span-3">
            <div className="flex flex-col items-end md:sticky md:top-28">
              <div className="flex flex-wrap items-center justify-end gap-x-5 gap-y-3">
                {["S", "M", "L", "XL", "XXL"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`font-mono text-[12px] uppercase tracking-[0.2em] transition-colors ${size === s ? "text-white underline underline-offset-[6px]" : "text-white/50 hover:text-white"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <button
                data-cursor="Add"
                className="mt-10 w-full max-w-[260px] border border-white bg-white py-4 font-mono text-[11px] uppercase tracking-[0.3em] text-black transition-colors hover:bg-transparent hover:text-white"
              >
                Add to Cart — €{product.price}.00
              </button>
            </div>
          </aside>
        </div>

        {/* Recommended */}
        <div className="mx-auto mt-40 max-w-[1600px] border-t border-white/10 px-6 pt-16 md:px-10">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-5xl leading-[0.9] tracking-[-0.03em] text-white md:text-7xl">
              You may also <em className="font-editorial italic text-white/60">consider.</em>
            </h2>
            <Link to="/shop" className="hidden font-mono text-[11px] uppercase tracking-[0.3em] text-white/60 hover:text-white md:block" data-cursor="View">View all →</Link>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
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
                  <div className="mt-3 flex items-baseline justify-between">
                    <p className="font-display text-lg text-white">{o.name}</p>
                    <p className="font-mono text-xs text-white/70">€{o.price}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="h-32" />
      </section>
    </AppShell>
  );
}
