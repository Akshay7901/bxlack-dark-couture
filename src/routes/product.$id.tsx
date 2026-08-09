import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { fetchProducts, toCardProduct } from "@/lib/catalog";
import { SilkBackdrop } from "@/components/SilkBackdrop";
import { Plus, Minus, Heart } from "lucide-react";
import { useWishlist } from "@/lib/wishlist";

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
  const { has, toggle } = useWishlist();
  const wishlisted = has(id);

  const { data, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => fetchProducts(),
  });

  const all = (data ?? []).map(toCardProduct);
  const product = all.find((p) => p.id === id);

  if (isLoading) {
    return (
      <AppShell hideNewsletter>
        <div className="flex min-h-[70vh] items-center justify-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">Loading piece…</p>
        </div>
      </AppShell>
    );
  }

  if (!product) {
    return (
      <AppShell hideNewsletter>
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
    <AppShell hideNewsletter>
      <SilkBackdrop />
      <section className="relative pt-24 sm:pt-28 md:pt-20 lg:pt-16">
        <div className="mx-auto grid max-w-[1500px] grid-cols-1 items-center gap-10 px-5 sm:px-6 md:grid-cols-12 md:gap-x-10 md:gap-y-12 md:px-8 lg:gap-8 lg:px-12">
          {/* Left — name, price, accordions */}
          <aside className="order-2 md:order-2 md:col-span-5 md:self-center lg:order-1 lg:col-span-4 lg:self-center">
            <div>
              <h1 className="font-display text-[28px] uppercase leading-[1.1] tracking-[-0.01em] text-white md:text-[36px] lg:text-[42px]">
                {product.name}
              </h1>
              <p className="mt-3 font-mono text-[15px] tracking-[0.05em] text-white/70 md:text-[16px]">₹{product.price}</p>

              <div className="mt-8 border-t border-white/10">
                {accordions.map((a) => {
                  const open = openAcc === a.id;
                  return (
                    <div key={a.id} className="border-b border-white/10">
                      <button
                        onClick={() => setOpenAcc(open ? null : a.id)}
                        className="flex w-full items-center justify-between py-3 text-left"
                      >
                        <span className="font-mono text-[13px] uppercase tracking-[0.24em] text-white/85">{a.title}</span>
                        {open ? <Minus size={14} className="text-white/50" /> : <Plus size={14} className="text-white/50" />}
                      </button>
                      <motion.div
                        initial={false}
                        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
                        transition={{ duration: 0.4, ease: [0.7, 0, 0.2, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="pb-4 pr-4 font-editorial text-[15px] leading-[1.7] tracking-[0.01em] text-white/60">{a.body}</p>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Middle — product image */}
          <div className="order-1 md:order-1 md:col-span-7 lg:order-2 lg:col-span-4">
            <div className="mx-auto w-full max-w-[520px] md:max-w-[440px] lg:max-w-[520px]">
            <ScrollGallery images={gallery as string[]} alt={product.name} />
            </div>
          </div>

          {/* Right — sizes + add to cart */}
          <aside className="order-3 md:col-span-5 md:col-start-8 md:self-start lg:col-span-4 lg:col-start-auto lg:self-center">
            <div>
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
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {["S", "M", "L", "XL", "XXL"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`flex h-10 min-w-[44px] items-center justify-center border px-3 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors ${size === s ? "border-white bg-white text-black" : "border-white/25 text-white/55 hover:border-white/70 hover:text-white"}`}
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
                onClick={() => toggle(id)}
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
