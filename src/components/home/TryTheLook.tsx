import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, type PanInfo } from "framer-motion";
import { ArrowLeft, ArrowRight, Pause, Play, Plus } from "lucide-react";
import type { HomeLook, HomeLooks } from "@/lib/looks";
import { useCart } from "@/lib/cart";
import { findCategory, useCategories } from "@/lib/categories";
import { sizesFor } from "@/lib/sizing";
import { EASE_OUT } from "@/lib/motion";

const num = (i: number) => String(i + 1).padStart(2, "0");
/** How long each look stays before the lineup moves on by itself. */
const AUTOPLAY_MS = 6000;
/** Looks visible on each side of the centre one (the outermost only peeks in at the edge). */
const SIDE = 3;
/**
 * How each figure looks by distance from the centre: nearly the same size so
 * they read as one lineup, with blur building up towards the edges.
 */
const FIGURE = [
  { scale: 1, blur: 0, opacity: 1 },
  { scale: 0.94, blur: 1.5, opacity: 0.9 },
  { scale: 0.88, blur: 3.5, opacity: 0.7 },
  { scale: 0.84, blur: 6, opacity: 0.4 },
];

/**
 * "Try the Look": a carousel of full-body looks. The current look stands large
 * and sharp in the middle; the previous and next ones wait smaller and blurred
 * on either side. Swipe, drag, the arrows, the numbered steps or the arrow keys
 * move through them, and it advances on its own until someone interacts. The
 * "In this look" panel beside it lists the pieces of the current look, each
 * with a size, plus one button to put the whole look in the bag.
 */
export function TryTheLook({ data }: { data: HomeLooks }) {
  const { looks } = data;
  const n = looks.length;
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovering, setHovering] = useState(false);
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageW, setStageW] = useState(0);
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);

  // Figures are spaced by a share of the stage width, so the lineup fills it at any size.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setStageW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const step = stageW * (stageW < 640 ? 0.36 : stageW < 1000 ? 0.26 : 0.21);

  const go = useCallback((i: number) => setActive(((i % n) + n) % n), [n]);
  const next = useCallback(() => go(active + 1), [go, active]);
  const prev = useCallback(() => go(active - 1), [go, active]);
  /** Any deliberate move stops autoplay, so the lineup doesn't jump away from what someone is looking at. */
  const userGo = (i: number) => {
    setPlaying(false);
    go(i);
  };

  // Only run the timer while the section is on screen.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const autoplay = playing && !hovering && inView && !reduceMotion && n > 1;
  useEffect(() => {
    if (!autoplay) return;
    const t = setTimeout(next, AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [autoplay, next, active]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const swipe = Math.abs(info.offset.x) > 50 || Math.abs(info.velocity.x) > 400;
    if (!swipe) return;
    userGo(info.offset.x < 0 ? active + 1 : active - 1);
  };

  const look = looks[active];

  return (
    <section
      ref={sectionRef}
      aria-labelledby="try-the-look"
      aria-roledescription="carousel"
      className="bg-noir pb-8 pt-0 text-foreground sm:pb-10 md:pb-12"
    >
      <div className="mx-auto grid max-w-[1600px] gap-8 px-5 sm:px-6 md:px-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
        {/* Left: heading, stage, controls */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
            <h2 id="try-the-look" className="font-display text-2xl font-medium uppercase tracking-[0.12em] sm:text-3xl md:text-4xl">
              {data.heading}
            </h2>
            {data.subheading ? (
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-mid-grey/80">{data.subheading}</p>
            ) : null}
          </div>

          <motion.div
            ref={stageRef}
            className={`relative mt-4 h-[min(118vw,62vh)] touch-pan-y select-none overflow-hidden sm:mt-6 md:h-[clamp(380px,62vh,620px)] ${
              n > 1 ? "[@media(pointer:fine)]:cursor-none" : ""
            }`}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            onPointerMove={(e) => {
              if (e.pointerType !== "mouse") return;
              const r = e.currentTarget.getBoundingClientRect();
              cursorX.set(e.clientX - r.left);
              cursorY.set(e.clientY - r.top);
            }}
            drag={n > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            dragMomentum={false}
            onDragEnd={onDragEnd}
            tabIndex={0}
            role="group"
            aria-label={`Look ${active + 1} of ${n}. Use the arrow keys to change look.`}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") {
                e.preventDefault();
                userGo(active + 1);
              } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                userGo(active - 1);
              }
            }}
            style={{ outline: "none" }}
          >
            {/* Spotlight and floor */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(ellipse 45% 40% at 50% 96%, rgba(255,255,255,0.10), transparent 70%)" }}
            />
            <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[3%] h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />

            {stageW > 0
              ? looks.map((l, i) => {
                  const d = offsetOf(i, active, n);
                  const abs = Math.abs(d);
                  const visible = abs <= SIDE;
                  const fig = FIGURE[Math.min(abs, FIGURE.length - 1)];
                  const blurTo = `blur(${fig.blur}px)`;
                  return (
                    // Every figure is centred by flex, then slid sideways by its distance from the active look.
                    <div key={l.id} className="pointer-events-none absolute inset-x-0 bottom-[3%] top-[3%] flex items-end justify-center">
                      <motion.button
                        type="button"
                        tabIndex={-1}
                        aria-hidden={d !== 0}
                        onClick={() => (d === 0 ? undefined : userGo(i))}
                        initial={false}
                        animate={{
                          x: d * step,
                          scale: fig.scale,
                          opacity: visible ? fig.opacity : 0,
                          // Smear mid-slide, then settle at this position's blur.
                          filter: reduceMotion ? blurTo : [null, `blur(${Math.max(fig.blur, 6)}px)`, blurTo],
                        }}
                        transition={
                          reduceMotion
                            ? { duration: 0 }
                            : {
                                duration: 0.75,
                                ease: EASE_OUT,
                                filter: { duration: 0.75, times: [0, 0.35, 1], ease: "easeOut" },
                              }
                        }
                        style={{ zIndex: 10 - abs, pointerEvents: visible && d !== 0 ? "auto" : "none" }}
                        className="relative aspect-[5/12] h-full max-w-[44%] origin-bottom sm:max-w-[30%] md:max-w-[19%]"
                      >
                        <img
                          src={l.image}
                          alt={d === 0 ? l.name || `Look ${num(i)}` : ""}
                          draggable={false}
                          loading={abs <= 1 ? "eager" : "lazy"}
                          decoding="async"
                          className="pointer-events-none h-full w-full object-contain object-bottom"
                        />
                        <span aria-hidden className="absolute -bottom-1 left-1/2 h-3 w-3/4 -translate-x-1/2 rounded-[50%] bg-black/80 blur-md" />
                      </motion.button>
                    </div>
                  );
                })
              : null}

            {/* "Drag" cursor that follows the mouse over the lineup. */}
            <motion.span
              aria-hidden
              className="pointer-events-none absolute left-0 top-0 z-20 hidden h-16 w-16 items-center justify-center rounded-full border border-white/50 font-mono text-[9px] uppercase tracking-[0.25em] text-white backdrop-blur-[2px] [@media(pointer:fine)]:flex"
              style={{ x: cursorX, y: cursorY, translateX: "-50%", translateY: "-50%" }}
              animate={{ opacity: hovering && n > 1 ? 1 : 0, scale: hovering && n > 1 ? 1 : 0.6 }}
              transition={{ duration: 0.25 }}
            >
              Drag
            </motion.span>
          </motion.div>

          {/* Controls: prev, numbered steps with progress, pause, next (only when there's somewhere to go) */}
          <div className={`mt-5 items-center gap-3 sm:gap-5 ${n > 1 ? "flex" : "hidden"}`}>
            <button
              type="button"
              onClick={() => userGo(active - 1)}
              aria-label="Previous look"
              className="flex h-10 w-10 shrink-0 items-center justify-center text-white/60 transition-colors hover:text-white"
            >
              <ArrowLeft size={18} />
            </button>

            <ol className="flex min-w-0 flex-1 gap-2 sm:gap-3">
              {looks.map((l, i) => {
                const isActive = i === active;
                return (
                  <li key={l.id} className={isActive ? "min-w-0 flex-[3]" : "min-w-0 flex-1"}>
                    <button
                      type="button"
                      onClick={() => userGo(i)}
                      aria-label={`Look ${i + 1}${l.name ? `: ${l.name}` : ""}`}
                      aria-current={isActive ? "true" : undefined}
                      className="group block w-full py-2 text-left"
                    >
                      <span className="relative block h-px w-full overflow-hidden bg-white/15">
                        {isActive ? (
                          <motion.span
                            key={`${active}-${autoplay}`}
                            className="absolute inset-y-0 left-0 bg-white"
                            initial={{ width: autoplay ? "0%" : "100%" }}
                            animate={{ width: "100%" }}
                            transition={autoplay ? { duration: AUTOPLAY_MS / 1000, ease: "linear" } : { duration: 0 }}
                          />
                        ) : null}
                      </span>
                      <span
                        className={`mt-2 block truncate font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
                          isActive ? "text-white" : "text-mid-grey/60 group-hover:text-white/80"
                        }`}
                      >
                        {num(i)}
                        {isActive && l.name ? <span className="max-sm:hidden"> {l.name}</span> : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>

            {n > 1 && !reduceMotion ? (
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                aria-label={playing ? "Pause slideshow" : "Play slideshow"}
                className="flex h-10 w-10 shrink-0 items-center justify-center text-white/60 transition-colors hover:text-white"
              >
                {playing ? <Pause size={14} /> : <Play size={14} />}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => userGo(active + 1)}
              aria-label="Next look"
              className="flex h-10 w-10 shrink-0 items-center justify-center text-white/60 transition-colors hover:text-white"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* Right: the pieces in the current look */}
        <InThisLook look={look} index={active} />
      </div>
    </section>
  );
}

/** Shortest signed distance from the active look, so the lineup wraps around. */
function offsetOf(i: number, active: number, n: number) {
  let d = i - active;
  if (d > n / 2) d -= n;
  if (d < -n / 2) d += n;
  return d;
}

function InThisLook({ look, index }: { look: HomeLook; index: number }) {
  const { add } = useCart();
  const { categories } = useCategories();
  const sizeOptions = (p: HomeLook["products"][number]) =>
    sizesFor(p.id, findCategory(categories, p.category)?.size_type);
  const defaultSize = (opts: string[]) => (opts.includes("M") ? "M" : opts[0]);

  const [sizes, setSizes] = useState<Record<string, string>>({});
  const sizeOf = (p: HomeLook["products"][number]) => {
    const opts = sizeOptions(p);
    const chosen = sizes[p.id];
    return chosen && opts.includes(chosen) ? chosen : defaultSize(opts);
  };
  const total = look.products.reduce((s, p) => s + p.price, 0);
  const label = look.name || `Look ${num(index)}`;

  const addOne = (p: HomeLook["products"][number]) => {
    add(p.id, sizeOf(p));
    window.dispatchEvent(new CustomEvent("bxlack:open-cart"));
  };
  const addAll = () => {
    for (const p of look.products) add(p.id, sizeOf(p));
    window.dispatchEvent(new CustomEvent("bxlack:open-cart"));
  };

  return (
    <aside aria-label="In this look" className="flex min-w-0 flex-col border border-light-grey/10 lg:mt-14">
      <div className="flex items-baseline justify-between gap-3 border-b border-light-grey/10 px-5 py-4">
        <p className="font-display text-[15px] uppercase tracking-[0.12em]">In this look</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-mid-grey/70">
          {look.products.length} {look.products.length === 1 ? "piece" : "pieces"}
        </p>
      </div>

      <div aria-live="polite" className="min-h-0 flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.ul
            key={look.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT } }}
            exit={{ opacity: 0, y: -6, transition: { duration: 0.18 } }}
            className="divide-y divide-light-grey/10"
          >
            <li className="sr-only">{label}</li>
            {look.products.map((p, i) => {
              const opts = sizeOptions(p);
              return (
                <li key={p.id} className="flex items-center gap-4 px-5 py-4">
                  <Link to="/product/$id" params={{ id: p.id }} className="relative block h-[84px] w-[68px] shrink-0 overflow-hidden bg-white/[0.03]">
                    {p.image ? <img src={p.image} alt="" className="h-full w-full object-cover" /> : null}
                    <span className="absolute left-1 top-1 font-mono text-[9px] text-white/70">{i + 1}</span>
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/product/$id"
                      params={{ id: p.id }}
                      className="block truncate text-[14px] text-white underline-offset-4 hover:underline"
                    >
                      {p.name}
                    </Link>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-mid-grey/70">{p.category}</p>
                    <div className="mt-1.5 flex items-center gap-3">
                      <span className="font-mono text-[13px] text-white">₹{p.price}</span>
                      {opts.length > 1 ? (
                        <select
                          aria-label={`Size for ${p.name}`}
                          value={sizeOf(p)}
                          onChange={(e) => setSizes((s) => ({ ...s, [p.id]: e.target.value }))}
                          className="border border-light-grey/20 bg-noir px-1.5 py-0.5 font-mono text-[11px] uppercase text-white outline-none focus:border-white/60"
                        >
                          {opts.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      ) : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => addOne(p)}
                    aria-label={`Add ${p.name} (${sizeOf(p)}) to bag`}
                    className="flex h-10 w-10 shrink-0 items-center justify-center text-white/50 transition-colors hover:text-white"
                  >
                    <Plus size={16} />
                  </button>
                </li>
              );
            })}
          </motion.ul>
        </AnimatePresence>
      </div>

      <div className="border-t border-light-grey/10 px-5 py-4">
        {look.products.length > 1 ? (
          <div className="mb-4 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.22em]">
            <span className="text-mid-grey/80">Complete the look</span>
            <span className="text-white">₹{total}</span>
          </div>
        ) : null}
        <button
          type="button"
          onClick={addAll}
          className="flex w-full items-center justify-center gap-3 border border-white bg-white py-3.5 font-mono text-[11px] uppercase tracking-[0.28em] text-black transition-colors hover:bg-transparent hover:text-white"
        >
          {look.products.length > 1 ? "Add full look to bag" : "Add to bag"} <ArrowRight size={14} />
        </button>
      </div>
    </aside>
  );
}
