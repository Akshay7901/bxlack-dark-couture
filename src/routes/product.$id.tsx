import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { products } from "@/lib/products";
import { ChevronDown, Heart, ShoppingBag } from "lucide-react";

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
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);

  const others = products.filter((p) => p.id !== product.id).slice(0, 4);
  const gallery = [product.image, ...(product.backImage ? [product.backImage] : [])];
  const isBack = product.backImage && activeImg === 1;

  return (
    <AppShell>
      <section className="pt-28">
        <div className="mx-auto mt-8 grid max-w-[1600px] grid-cols-1 gap-8 px-6 md:grid-cols-12 md:gap-6 md:px-10">
          {/* Left — product details */}
          <aside className="order-3 md:order-1 md:col-span-3">
            <div className="md:sticky md:top-28">
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/50">{product.tag}</p>
              <h1 className="mt-3 font-display text-3xl leading-[0.95] tracking-[-0.03em] text-white md:text-4xl">
                {product.name}
              </h1>
              <p className="mt-3 font-editorial text-lg italic text-white/60">A piece for the ones who refuse to blend.</p>

              <div className="mt-8">
                {ACCORDIONS.map((a, i) => (
                  <Accordion key={a.t} {...a} i={i} />
                ))}
                <div className="border-t border-white/10" />
              </div>

              <p className="mt-8 font-editorial text-lg italic text-white/50">
                One of fifty · numbered by hand.
              </p>
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

          {/* Right — price, cart, wishlist */}
          <aside className="order-2 md:order-3 md:col-span-3">
            <div className="md:sticky md:top-28">
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/50">Price</p>
              <div className="mt-2 flex items-baseline gap-3">
                <p className="font-mono text-3xl text-white md:text-4xl">€{product.price}</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">Incl. VAT</p>
              </div>

              <div className="mt-8">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/60">Colour · Matte Black</p>
                <div className="mt-3 flex gap-2">
                  <button className="h-8 w-8 border border-white bg-[oklch(0.05_0_0)]" aria-label="Matte black" />
                  <button className="h-8 w-8 border border-white/20 bg-[oklch(0.28_0_0)] transition-colors hover:border-white/60" aria-label="Charcoal" />
                  <button className="h-8 w-8 border border-white/20 bg-[oklch(0.86_0.02_80)] transition-colors hover:border-white/60" aria-label="Off white" />
                </div>
              </div>

              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/60">Size</p>
                  <button className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/60 underline underline-offset-4 transition-colors hover:text-white">
                    Size guide
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {["XS", "S", "M", "L", "XL"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`border py-3 font-mono text-[11px] uppercase tracking-[0.2em] transition-colors ${size === s ? "border-white bg-white text-black" : "border-white/20 text-white/70 hover:border-white"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/60">Quantity</p>
                <div className="mt-3 inline-flex items-center border border-white/20">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-5 py-3 text-white/70 hover:text-white">−</button>
                  <span className="min-w-10 text-center font-mono text-sm text-white">{qty}</span>
                  <button onClick={() => setQty((q) => q + 1)} className="px-5 py-3 text-white/70 hover:text-white">+</button>
                </div>
              </div>

              <div className="mt-8 flex items-stretch gap-3">
                <button
                  data-cursor="Add"
                  className="group relative flex-1 overflow-hidden border border-white bg-white py-4 font-mono text-[11px] uppercase tracking-[0.3em] text-black transition-colors hover:bg-transparent hover:text-white"
                >
                  <span className="flex items-center justify-center gap-2">
                    <ShoppingBag size={16} />
                    Add to Cart
                  </span>
                </button>
                <button
                  aria-label="Wishlist"
                  onClick={() => setWishlisted((w) => !w)}
                  className={`flex items-center justify-center border px-5 transition-colors ${wishlisted ? "border-white bg-white text-black" : "border-white/20 text-white/70 hover:border-white hover:text-white"}`}
                >
                  <Heart size={18} fill={wishlisted ? "currentColor" : "none"} />
                </button>
              </div>

              <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
                Complimentary express shipping · 48h dispatch
              </p>
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
