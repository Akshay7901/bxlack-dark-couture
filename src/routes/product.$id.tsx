import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { products } from "@/lib/products";
import { ChevronDown, Heart, RotateCw, ZoomIn } from "lucide-react";

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

const ACCORDIONS = [
  { t: "Composition & Craft", b: "100% Japanese wool, 320g. Hand-cut in Antwerp, finished under a single light in Tokyo. Every seam is a decision." },
  { t: "Sizing & Fit", b: "Cut with a generous shoulder and cinched line. Model is 187cm wearing size M. If in between, size down." },
  { t: "Shipping", b: "Complimentary express worldwide. Dispatched within 48h in numbered black packaging." },
  { t: "Returns", b: "Fourteen days from arrival. Piece must be untouched, tags intact, boxed as delivered." },
];

function Accordion({ t, b, i }: { t: string; b: string; i: number }) {
  const [open, setOpen] = useState(i === 0);
  return (
    <div className="border-t border-white/10">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-5 text-left font-mono text-[11px] uppercase tracking-[0.3em] text-white/80 hover:text-white"
        data-cursor="Open"
      >
        {t}
        <ChevronDown size={14} className={`transition-transform duration-500 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`grid overflow-hidden transition-[grid-template-rows] duration-500 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="min-h-0">
          <p className="pb-6 text-sm leading-relaxed text-white/60">{b}</p>
        </div>
      </div>
    </div>
  );
}

function ProductPage() {
  const { product } = Route.useLoaderData();
  const [size, setSize] = useState("M");
  const [qty, setQty] = useState(1);
  const galleryRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: galleryRef, offset: ["start start", "end start"] });
  const captionOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  const others = products.filter((p) => p.id !== product.id).slice(0, 4);
  const gallery = [product.image, ...products.filter((p) => p.id !== product.id).slice(0, 2).map((p) => p.image), product.image];

  return (
    <AppShell>
      <section className="pt-32">
        <div className="mx-auto max-w-[1600px] px-6 md:px-10">
          <nav className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.4em] text-white/40">
            <Link to="/shop" className="hover:text-white">Collection</Link>
            <span>/</span>
            <span className="text-white/70">{product.category}</span>
            <span>/</span>
            <span className="text-white">{product.tag}</span>
          </nav>
        </div>

        <div className="mx-auto mt-10 grid max-w-[1600px] grid-cols-1 gap-10 px-6 md:grid-cols-12 md:gap-16 md:px-10">
          {/* Left — vertical gallery */}
          <div ref={galleryRef} className="md:col-span-8">
            <motion.p style={{ opacity: captionOpacity }} className="mb-4 font-mono text-[10px] uppercase tracking-[0.4em] text-white/40">
              Scroll · Vertical gallery
            </motion.p>
            <div className="flex flex-col gap-4">
              {gallery.map((img, i) => (
                <motion.figure
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-15%" }}
                  transition={{ duration: 1, ease: [0.7, 0, 0.2, 1] }}
                  className="group relative aspect-[4/5] overflow-hidden bg-[oklch(0.08_0_0)]"
                >
                  <img src={img} alt={`${product.name} view ${i + 1}`} className="h-full w-full object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.7,0,0.2,1)] group-hover:scale-105" loading="lazy" />
                  <div className="absolute left-4 top-4 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.3em] text-white/70">
                    <span className="h-1 w-1 rounded-full bg-white/80" />
                    Frame 0{i + 1}
                  </div>
                  {i === 1 && (
                    <div className="absolute inset-0 flex items-end justify-end p-6">
                      <span className="flex items-center gap-2 border border-white/40 bg-black/30 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.3em] text-white backdrop-blur">
                        <RotateCw size={12} /> 360° · Coming soon
                      </span>
                    </div>
                  )}
                  {i === 2 && (
                    <div className="absolute inset-0 flex items-end p-6">
                      <span className="flex items-center gap-2 font-editorial text-2xl italic text-white/90">
                        <ZoomIn size={16} /> Fabric close-up · 320g wool
                      </span>
                    </div>
                  )}
                </motion.figure>
              ))}
            </div>
          </div>

          {/* Right — sticky info */}
          <aside className="md:col-span-4">
            <div className="md:sticky md:top-32">
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/50">{product.tag}</p>
              <h1 className="mt-4 font-display text-5xl leading-[0.9] tracking-[-0.03em] text-white md:text-6xl">
                {product.name}
              </h1>
              <p className="mt-4 font-editorial text-xl italic text-white/60">A piece for the ones who refuse to blend.</p>

              <div className="mt-8 flex items-baseline gap-4">
                <p className="font-mono text-2xl text-white">€{product.price}</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">Incl. VAT</p>
              </div>

              <div className="mt-10">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/60">Size</p>
                  <button className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/60 underline underline-offset-4">Size guide</button>
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
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/60">Colour · Matte Black</p>
                <div className="mt-3 flex gap-2">
                  <button className="h-8 w-8 border border-white bg-[oklch(0.05_0_0)]" />
                  <button className="h-8 w-8 border border-white/20 bg-[oklch(0.28_0_0)]" />
                  <button className="h-8 w-8 border border-white/20 bg-[oklch(0.86_0.02_80)]" />
                </div>
              </div>

              <div className="mt-10 flex items-stretch gap-3">
                <div className="flex items-center border border-white/20">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-4 text-white/70 hover:text-white">−</button>
                  <span className="min-w-8 text-center font-mono text-sm text-white">{qty}</span>
                  <button onClick={() => setQty((q) => q + 1)} className="px-4 text-white/70 hover:text-white">+</button>
                </div>
                <button data-cursor="Add" className="group relative flex-1 overflow-hidden border border-white bg-white py-4 font-mono text-[11px] uppercase tracking-[0.3em] text-black transition-colors hover:bg-transparent hover:text-white">
                  Add to Cart · €{product.price * qty}
                </button>
                <button aria-label="Wishlist" className="flex items-center justify-center border border-white/20 px-4 text-white/70 hover:border-white hover:text-white">
                  <Heart size={16} />
                </button>
              </div>

              <div className="mt-12">
                {ACCORDIONS.map((a, i) => (
                  <Accordion key={a.t} {...a} i={i} />
                ))}
                <div className="border-t border-white/10" />
              </div>

              <p className="mt-10 font-editorial text-lg italic text-white/50">
                One of fifty · numbered by hand.
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