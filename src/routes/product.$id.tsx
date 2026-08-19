import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { fetchProducts, toCardProduct } from "@/lib/catalog";
import { SilkBackdrop } from "@/components/SilkBackdrop";
import { Plus, Minus, Heart } from "lucide-react";
import { useWishlist } from "@/lib/wishlist";
import { SignInPrompt } from "@/components/SignInPrompt";
import { useCart } from "@/lib/cart";
import { SizeChartModal } from "@/components/SizeChartModal";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "Product — BXLACK SS26" },
      {
        name: "description",
        content: "A numbered, small-batch BXLACK piece. Cut in Antwerp, finished in Tokyo.",
      },
      { property: "og:title", content: "Product — BXLACK SS26" },
      {
        property: "og:description",
        content: "A numbered, small-batch BXLACK piece from the SS26 collection.",
      },
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
  const touchStartY = useRef<number | null>(null);

  const go = (d: number) => {
    const now = Date.now();
    if (now - lock.current < 420) return;
    lock.current = now;
    setState(([i]) => [(i + d + images.length) % images.length, d]);
  };

  useEffect(() => {
    const el = ref.current;
    if (!el || images.length < 2) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (Math.abs(e.deltaY) < 8) return;
      go(e.deltaY > 0 ? 1 : -1);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [images.length]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0]?.clientY ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null || images.length < 2) return;
    const endY = e.changedTouches[0]?.clientY ?? touchStartY.current;
    const delta = touchStartY.current - endY;
    touchStartY.current = null;
    if (Math.abs(delta) < 32) return;
    go(delta > 0 ? 1 : -1);
  };

  return (
    <div>
      <div className="relative">
        <div
          ref={ref}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="relative aspect-[4/5] w-full touch-pan-x overflow-hidden bg-transparent"
        >
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
        {images.length > 1 ? (
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 flex-col items-center gap-2 sm:right-3">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Show image ${i + 1} of ${images.length}`}
                onClick={() => {
                  if (i === index) return;
                  setState([i, i > index ? 1 : -1]);
                }}
                className={`w-1.5 rounded-full transition-all ${
                  i === index ? "h-5 bg-white" : "h-1.5 bg-white/30 hover:bg-white/55"
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
      {images.length > 1 ? (
        <p className="mt-4 hidden text-center font-mono text-[10px] uppercase tracking-[0.24em] text-white/35 md:block">
          Scroll to view more images
        </p>
      ) : null}
    </div>
  );
}

function ProductPage() {
  const { id } = Route.useParams();
  const [size, setSize] = useState("M");
  const [openAcc, setOpenAcc] = useState<string | null>("details");
  const [openSizeChart, setOpenSizeChart] = useState(false);
  const { has, toggle } = useWishlist();
  const { add } = useCart();
  const [signInOpen, setSignInOpen] = useState(false);
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
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
            Loading piece…
          </p>
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
              <p className="mt-3 font-mono text-[15px] tracking-[0.05em] text-white/70 md:text-[16px]">
                ₹{product.price}
              </p>

              <div className="mt-8 border-t border-white/10">
                {accordions.map((a) => {
                  const open = openAcc === a.id;
                  return (
                    <div key={a.id} className="border-b border-white/10">
                      <button
                        onClick={() => setOpenAcc(open ? null : a.id)}
                        className="flex w-full items-center justify-between py-3 text-left"
                      >
                        <span className="font-mono text-[13px] uppercase tracking-[0.24em] text-white/85">
                          {a.title}
                        </span>
                        {open ? (
                          <Minus size={14} className="text-white/50" />
                        ) : (
                          <Plus size={14} className="text-white/50" />
                        )}
                      </button>
                      <motion.div
                        initial={false}
                        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
                        transition={{ duration: 0.4, ease: [0.7, 0, 0.2, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="pb-4 pr-4 font-editorial text-[15px] leading-[1.7] tracking-[0.01em] text-white/60">
                          {a.body}
                        </p>
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
                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/40">
                  Select Size
                </p>
                <button
                  onClick={() => setOpenSizeChart(true)}
                  className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/50 underline underline-offset-4 transition-colors hover:text-white"
                >
                  Size Chart
                </button>
              </div>
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
                onClick={() => {
                  add(id, size);
                  window.dispatchEvent(new CustomEvent("bxlack:open-cart"));
                }}
                className="mt-6 w-full border border-white bg-white py-[14px] font-mono text-[11px] uppercase tracking-[0.32em] text-black transition-colors hover:bg-transparent hover:text-white"
              >
                Add to Cart — ₹{product.price}
              </button>

              <button
                onClick={() => {
                  if (!toggle(id)) setSignInOpen(true);
                }}
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
      <SignInPrompt open={signInOpen} onClose={() => setSignInOpen(false)} />
      <SizeChartModal
        open={openSizeChart}
        onClose={() => setOpenSizeChart(false)}
        category={product.category}
        selectedSize={size}
        onSelectSize={setSize}
      />
    </AppShell>
  );
}
