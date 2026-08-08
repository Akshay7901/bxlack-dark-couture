import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { fetchProducts, toCardProduct } from "@/lib/catalog";
import { Plus, Minus, Heart } from "lucide-react";

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


function ScrollGallery({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const lock = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || images.length < 2) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = Date.now();
      if (now - lock.current < 420) return;
      if (Math.abs(e.deltaY) < 8) return;
      lock.current = now;
      setIndex((i) => {
        const next = e.deltaY > 0 ? i + 1 : i - 1;
        return (next + images.length) % images.length;
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [images.length]);

  return (
    <div ref={ref} className="relative aspect-[4/5] w-full overflow-hidden bg-[oklch(0.08_0_0)]">
      <motion.img
        key={index}
        initial={{ opacity: 0, scale: 1.02 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.7, 0, 0.2, 1] }}
        src={images[index]}
        alt={alt}
        className="h-full w-full object-contain"
        loading="lazy"
      />
      {images.length > 1 && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {images.map((_, i) => (
            <span key={i} className={`h-[3px] w-5 transition-colors ${i === index ? "bg-white" : "bg-white/25"}`} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductPage() {
  const { id } = Route.useParams();
  const [size, setSize] = useState("M");
  const [activeImg, setActiveImg] = useState(0);
  const [openAcc, setOpenAcc] = useState<string | null>("details");
  const [openSizeChart, setOpenSizeChart] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

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

  const gallery = (
    product.gallery && product.gallery.length > 0
      ? product.gallery
      : [product.image, ...(product.backImage ? [product.backImage] : [])]
  ).filter(Boolean);

  const accordions = [
    {
      id: "details",
      title: "Product Details",
      body: "Cut and sewn in Antwerp from 260gsm heavyweight organic cotton. Screen-printed graphic finished by hand in Tokyo. Boxy fit, dropped shoulder, ribbed collar. Numbered piece of fifty.",
    },
    {
      id: "ship",
      title: "Shipping & Returns",
      body: "Complimentary express shipping worldwide · 48h dispatch from Antwerp. Free returns within 30 days on unworn pieces with original packaging and numbered tag intact.",
    },
  ];

  return (
    <AppShell>
      <section className="pt-24 sm:pt-28 md:pt-16">
        <div className="mx-auto grid max-w-[1500px] grid-cols-1 items-center gap-10 px-5 sm:px-6 md:grid-cols-12 md:gap-8 md:px-12">
          {/* Left — name, price, accordions */}
          <aside className="order-2 md:order-1 md:col-span-4">
            <div>
              <h1 className="font-display text-[22px] uppercase leading-[1.1] tracking-[-0.01em] text-white md:text-[28px]">
                {product.name}
              </h1>
              <p className="mt-2 font-mono text-[12px] tracking-[0.05em] text-white/60">₹{product.price}</p>

              <div className="mt-8 border-t border-white/10">
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
          <div className="order-1 md:order-2 md:col-span-4">
            <div className="mx-auto w-full max-w-[520px]">
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-[oklch(0.08_0_0)]">
              <motion.img
                key={activeImg}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.7, 0, 0.2, 1] }}
                src={gallery[activeImg]}
                alt={product.name}
                className="h-full w-full object-contain"
                loading="lazy"
              />
            </div>

            </div>
          </div>

          {/* Right — sizes + add to cart */}
          <aside className="order-3 md:col-span-4">
            <div className="md:sticky md:top-20">
              <div className="flex items-baseline justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/40">Select Size</p>
                <button
                  onClick={() => setOpenSizeChart((v) => !v)}
                  className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/50 underline underline-offset-4 transition-colors hover:text-white"
                >
                  Size Chart
                </button>
              </div>
              <motion.div
                initial={false}
                animate={{ height: openSizeChart ? "auto" : 0, opacity: openSizeChart ? 1 : 0 }}
                transition={{ duration: 0.4, ease: [0.7, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <p className="pt-3 font-editorial text-[12px] leading-[1.7] text-white/55">
                  XS · 48 / S · 50 / M · 52 / L · 54 / XL · 56 (chest, cm). Model wears M and is 186cm. Runs true to size — size down for a closer silhouette.
                </p>
              </motion.div>
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

              <button
                onClick={() => setWishlisted((v) => !v)}
                data-cursor="Save"
                className={`mt-3 flex w-full items-center justify-center gap-2 border py-[13px] font-mono text-[11px] uppercase tracking-[0.32em] transition-colors ${wishlisted ? "border-white text-white" : "border-white/25 text-white/60 hover:border-white hover:text-white"}`}
              >
                <Heart size={13} className={wishlisted ? "fill-white" : ""} />
                {wishlisted ? "Wishlisted" : "Add to Wishlist"}
              </button>

            </div>
          </aside>
        </div>

        <div className="h-20 md:h-32" />
      </section>
    </AppShell>
  );
}
