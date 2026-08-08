import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
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
  const [[index, dir], setState] = useState<[number, number]>([0, 1]);
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
      const d = e.deltaY > 0 ? 1 : -1;
      setState(([i]) => [(i + d + images.length) % images.length, d]);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [images.length]);

  return (
    <div ref={ref} className="relative aspect-[4/5] w-full overflow-hidden bg-transparent">
      <AnimatePresence initial={false} mode="popLayout" custom={dir}>
        <motion.img
          key={index}
          custom={dir}
          initial={{ y: dir > 0 ? "100%" : "-100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: dir > 0 ? "-100%" : "100%", opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.7, 0, 0.2, 1] }}
          src={images[index]}
          alt={alt}
          className="absolute inset-0 h-full w-full object-contain"
          loading="lazy"
        />
      </AnimatePresence>
    </div>
  );
}

function ProductPage() {
  const { id } = Route.useParams();
  const [size, setSize] = useState("M");
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
    {
      id: "care",
      title: "Care Instructions",
      body: "Cold machine wash inside out with like colours. Do not tumble dry, do not bleach. Warm iron on reverse, avoiding the print. Dry flat in shade to preserve the hand-finished graphic.",
    },
  ];

  return (
    <AppShell>
      <section className="pt-24 sm:pt-28 md:pt-14">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-stretch gap-10 px-5 sm:px-6 md:grid-cols-12 md:gap-0 md:px-10">
          {/* Left — name, price, accordions */}
          <aside className="order-2 md:order-1 md:col-span-3 md:border-r md:border-white/[0.07] md:pr-10">
            <div>
              <h1 className="font-display text-[26px] font-light uppercase leading-[1.1] tracking-[0.18em] text-white md:text-[32px]">
                {product.name}
              </h1>
              <p className="mt-4 font-mono text-[15px] font-light tracking-[0.2em] text-white/60">₹{product.price}</p>

              <div className="mt-12">
                {accordions.map((a) => {
                  const open = openAcc === a.id;
                  return (
                    <div key={a.id} className="border-t border-white/10 last:border-b">
                      <button
                        onClick={() => setOpenAcc(open ? null : a.id)}
                        className={`flex w-full items-center justify-between py-5 text-left transition-opacity ${open ? "opacity-100" : "opacity-60 hover:opacity-100"}`}
                      >
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-white">{a.title}</span>
                        {open ? <Minus size={11} className="text-white/40" /> : <Plus size={11} className="text-white/40" />}
                      </button>
                      <motion.div
                        initial={false}
                        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
                        transition={{ duration: 0.4, ease: [0.7, 0, 0.2, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="pb-6 pr-3 text-[13px] font-light leading-[1.8] tracking-[0.04em] text-white/50">{a.body}</p>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Middle — product image */}
          <div className="order-1 flex items-center justify-center md:order-2 md:col-span-6 md:px-10 md:py-6">
            <div className="mx-auto w-full max-w-[500px]">
            <ScrollGallery images={gallery as string[]} alt={product.name} />
            </div>
          </div>

          {/* Right — sizes + add to cart */}
          <aside className="order-3 md:col-span-3 md:border-l md:border-white/[0.07] md:pl-10">
            <div className="flex h-full flex-col md:sticky md:top-20">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.4em] text-white/40">Select Size</p>
                <button
                  onClick={() => setOpenSizeChart((v) => !v)}
                  className="border-b border-white/30 pb-0.5 font-mono text-[9px] uppercase tracking-[0.4em] text-white transition-colors hover:border-white"
                >
                  Size Guide
                </button>
              </div>
              <motion.div
                initial={false}
                animate={{ height: openSizeChart ? "auto" : 0, opacity: openSizeChart ? 1 : 0 }}
                transition={{ duration: 0.4, ease: [0.7, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <p className="pt-4 text-[12px] font-light leading-[1.8] tracking-[0.04em] text-white/50">
                  XS · 48 / S · 50 / M · 52 / L · 54 / XL · 56 (chest, cm). Model wears M and is 186cm. Runs true to size — size down for a closer silhouette.
                </p>
              </motion.div>
              <div className="mt-6 grid grid-cols-5 gap-2">
                {["S", "M", "L", "XL", "XXL"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`flex aspect-square items-center justify-center border font-mono text-[11px] uppercase transition-all ${size === s ? "border-white text-white" : "border-white/10 text-white/30 hover:border-white hover:text-white"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <button
                data-cursor="Add"
                className="mt-12 w-full border border-transparent bg-white py-5 font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-black transition-all duration-500 hover:border-white hover:bg-transparent hover:text-white"
              >
                Add to Cart
              </button>

              <button
                onClick={() => setWishlisted((v) => !v)}
                data-cursor="Save"
                className={`mt-3 flex w-full items-center justify-center gap-3 border py-5 font-mono text-[10px] uppercase tracking-[0.4em] transition-all ${wishlisted ? "border-white text-white" : "border-white/20 text-white hover:border-white"}`}
              >
                <Heart size={12} strokeWidth={1.5} className={wishlisted ? "fill-white" : ""} />
                {wishlisted ? "Wishlisted" : "Add to Wishlist"}
              </button>

              <div className="mt-auto pt-16">
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-500" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/40">Edition 07/50 — Ships Immediately</span>
                </div>
                <p className="font-mono text-[9px] uppercase leading-relaxed tracking-[0.3em] text-white/20">
                  Secure checkout with localized taxes and global express logistics.
                </p>
              </div>
            </div>
          </aside>
        </div>

        <div className="h-20 md:h-32" />
      </section>
    </AppShell>
  );
}
