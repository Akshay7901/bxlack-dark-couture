import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  useVelocity,
  type MotionValue,
  type PanInfo,
} from "framer-motion";
import { ArrowLeft, ArrowRight, Pause, Play, Plus } from "lucide-react";
import type { HomeLook, HomeLooks, LooksTheme } from "@/lib/looks";
import { useCart } from "@/lib/cart";
import { findCategory, useCategories } from "@/lib/categories";
import { sizesFor } from "@/lib/sizing";
import { useTrimmedImage } from "@/lib/trimImage";
import { EASE_OUT } from "@/lib/motion";

const num = (i: number) => String(i + 1).padStart(2, "0");
const mod = (a: number, n: number) => ((a % n) + n) % n;
/** How long each look stays before the ring turns on by itself. */
const AUTOPLAY_MS = 5000;
/** Share of the stage height the front figure stands. */
const FIGURE_HEIGHT = 0.93;
/** How long one step of the ring takes. */
const TURN = { duration: 1.05, ease: EASE_OUT };

type Theme = {
  section: string;
  title: string;
  sub: string;
  stageGlow: string;
  floorShadow: string;
  cursor: string;
  control: string;
  track: string;
  fill: string;
  stepActive: string;
  stepIdle: string;
  panel: string;
  rule: string;
  text: string;
  muted: string;
  thumb: string;
  select: string;
  plus: string;
  cta: string;
};

const THEMES: Record<LooksTheme, Theme> = {
  light: {
    section: "bg-[#ecebe8] text-neutral-900",
    title: "text-neutral-900",
    sub: "text-neutral-500",
    stageGlow: "radial-gradient(ellipse 60% 70% at 50% 45%, rgba(255,255,255,0.85), rgba(255,255,255,0) 70%)",
    floorShadow: "bg-black/35",
    cursor: "border-black/25 bg-white/40 text-neutral-700",
    control: "text-neutral-500 hover:text-neutral-900",
    track: "bg-black/15",
    fill: "bg-neutral-900",
    stepActive: "text-neutral-900",
    stepIdle: "text-neutral-400 group-hover:text-neutral-700",
    panel: "bg-[#f6f5f3] lg:border-l lg:border-black/10",
    rule: "border-black/10",
    text: "text-neutral-900",
    muted: "text-neutral-500",
    thumb: "bg-[#ebeae6]",
    select: "border-black/15 bg-white text-neutral-900 focus:border-black/50",
    plus: "text-neutral-400 hover:text-neutral-900",
    cta: "bg-neutral-950 text-white hover:bg-neutral-800",
  },
  dark: {
    section: "bg-noir text-foreground",
    title: "text-white",
    sub: "text-mid-grey/80",
    // A soft spotlight behind the figures and a lit patch of floor, so black clothes still read on black.
    stageGlow:
      "radial-gradient(ellipse 34% 62% at 50% 48%, rgba(255,255,255,0.13), transparent 72%), radial-gradient(ellipse 45% 9% at 50% 90%, rgba(255,255,255,0.08), transparent 80%)",
    floorShadow: "bg-black",
    cursor: "border-white/50 text-white",
    control: "text-white/60 hover:text-white",
    track: "bg-white/15",
    fill: "bg-white",
    stepActive: "text-white",
    stepIdle: "text-mid-grey/60 group-hover:text-white/80",
    panel: "border border-light-grey/10 lg:border-y-0 lg:border-r-0",
    rule: "border-light-grey/10",
    text: "text-white",
    muted: "text-mid-grey/70",
    thumb: "bg-white/[0.04]",
    select: "border-light-grey/20 bg-noir text-white focus:border-white/60",
    plus: "text-white/50 hover:text-white",
    cta: "bg-white text-black hover:bg-white/85",
  },
};

/**
 * "Try the Look": the looks stand on a ring that turns a full 360°. The look
 * at the front is large and sharp; the ones turning away get smaller, softer
 * and paler, and the back of the ring shows through between them as blurred
 * figures moving the other way. Next turns the ring right to left. Drag or
 * swipe to spin it by hand (it snaps to the nearest look), or use the arrows,
 * numbered steps or arrow keys; it turns on its own until someone interacts.
 * The "In this look" panel lists the front look's pieces and adds them to the bag.
 */
export function TryTheLook({ data }: { data: HomeLooks }) {
  const { looks } = data;
  const t = THEMES[data.theme] ?? THEMES.light;
  const n = looks.length;
  const reduceMotion = !!useReducedMotion();

  // `pos` counts steps without wrapping, so the ring always turns the short way
  // and keeps its direction; `rot` is the animated (fractional) ring position.
  const [pos, setPos] = useState(0);
  const active = mod(pos, n);
  const rot = useMotionValue(0);
  const vel = useVelocity(rot);

  const [playing, setPlaying] = useState(true);
  const [hovering, setHovering] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const panStart = useRef(0);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setStage({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const narrow = stage.w < 640;
  const figH = stage.h * FIGURE_HEIGHT;
  // Ring radius: the side looks reach towards the stage edges.
  const radius = stage.w * (narrow ? 0.62 : 0.42);

  // Turn the ring to the current position.
  useEffect(() => {
    if (dragging) return;
    const c = animate(rot, pos, reduceMotion ? { duration: 0 } : TURN);
    return () => c.stop();
  }, [pos, dragging, reduceMotion, rot]);

  const goTo = (i: number) => {
    let d = mod(i, n) - active;
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    setPos((p) => p + d);
  };
  /** Any deliberate move stops autoplay, so the ring doesn't turn away from what someone is looking at. */
  const userStep = (d: number) => {
    setPlaying(false);
    setPos((p) => p + d);
  };
  const userGo = (i: number) => {
    setPlaying(false);
    goTo(i);
  };

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const autoplay = playing && !hovering && !dragging && inView && !reduceMotion && n > 1;
  useEffect(() => {
    if (!autoplay) return;
    const timer = setTimeout(() => setPos((p) => p + 1), AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [autoplay, pos]);

  // Dragging spins the ring with the pointer: a drag the width of the radius
  // turns it by about one radian.
  const stepsPerPx = n / (2 * Math.PI * Math.max(radius, 1));
  const onPanStart = () => {
    if (n < 2) return;
    rot.stop();
    panStart.current = rot.get();
    setPlaying(false);
    setDragging(true);
  };
  const onPan = (_: unknown, info: PanInfo) => {
    if (n < 2) return;
    rot.set(panStart.current - info.offset.x * stepsPerPx);
  };
  const onPanEnd = (_: unknown, info: PanInfo) => {
    if (n < 2) return;
    // Let a flick carry on a little, then settle on the nearest look.
    const target = Math.round(rot.get() - info.velocity.x * stepsPerPx * 0.25);
    setPos(target);
    setDragging(false);
  };

  const look = looks[active];

  return (
    <section ref={sectionRef} aria-labelledby="try-the-look" aria-roledescription="carousel" className={t.section}>
      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Left: heading, stage, controls */}
        <div className="min-w-0 px-5 pb-6 pt-10 sm:px-6 md:px-10 md:pt-12">
          <h2 id="try-the-look" className={`font-sans text-3xl font-semibold tracking-[-0.02em] sm:text-4xl ${t.title}`}>
            {data.heading}
          </h2>
          {data.subheading ? <p className={`mt-2 text-[13px] ${t.sub}`}>{data.subheading}</p> : null}

          <motion.div
            ref={stageRef}
            className={`relative -mx-5 mt-2 h-[min(135vw,600px)] touch-pan-y select-none overflow-hidden sm:-mx-6 sm:h-[min(95vw,640px)] md:mx-0 md:h-[clamp(480px,68vh,820px)] ${
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
            onPanStart={onPanStart}
            onPan={onPan}
            onPanEnd={onPanEnd}
            tabIndex={0}
            role="group"
            aria-label={`Look ${active + 1} of ${n}. Use the arrow keys to change look.`}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") {
                e.preventDefault();
                userStep(1);
              } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                userStep(-1);
              }
            }}
            style={{ outline: "none" }}
          >
            <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: t.stageGlow }} />

            {stage.w > 0
              ? looks.map((l, i) => (
                  <Figure
                    key={l.id}
                    look={l}
                    index={i}
                    n={n}
                    rot={rot}
                    vel={vel}
                    radius={radius}
                    height={figH}
                    isFront={i === active}
                    reduceMotion={reduceMotion}
                    shadowClass={t.floorShadow}
                    onSelect={() => userGo(i)}
                  />
                ))
              : null}

            {/* "Drag" cursor that follows the mouse over the ring. */}
            <motion.span
              aria-hidden
              className={`pointer-events-none absolute left-0 top-0 z-[300] hidden h-16 w-16 items-center justify-center rounded-full border font-mono text-[9px] uppercase tracking-[0.25em] backdrop-blur-[2px] [@media(pointer:fine)]:flex ${t.cursor}`}
              style={{ x: cursorX, y: cursorY, translateX: "-50%", translateY: "-50%" }}
              animate={{ opacity: hovering && n > 1 ? 1 : 0, scale: dragging ? 0.85 : hovering && n > 1 ? 1 : 0.6 }}
              transition={{ duration: 0.25 }}
            >
              Drag
            </motion.span>
          </motion.div>

          {/* Controls: prev, numbered steps with progress, pause, next */}
          <div className={`mt-3 items-center gap-3 sm:gap-5 ${n > 1 ? "flex" : "hidden"}`}>
            <button
              type="button"
              onClick={() => userStep(-1)}
              aria-label="Previous look"
              className={`flex h-10 w-10 shrink-0 items-center justify-center transition-colors ${t.control}`}
            >
              <ArrowLeft size={18} />
            </button>

            <ol className="flex min-w-0 max-w-[560px] flex-1 gap-2 sm:gap-3">
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
                      <span className={`relative block h-px w-full overflow-hidden ${t.track}`}>
                        {isActive ? (
                          <motion.span
                            key={`${pos}-${autoplay}`}
                            className={`absolute inset-y-0 left-0 ${t.fill}`}
                            initial={{ width: autoplay ? "0%" : "100%" }}
                            animate={{ width: "100%" }}
                            transition={autoplay ? { duration: AUTOPLAY_MS / 1000, ease: "linear" } : { duration: 0 }}
                          />
                        ) : null}
                      </span>
                      <span
                        className={`mt-2 block truncate font-mono text-[10px] tracking-[0.12em] transition-colors ${
                          isActive ? t.stepActive : t.stepIdle
                        }`}
                      >
                        {num(i)}
                        {isActive && l.name ? <span className="max-sm:hidden">&nbsp;&nbsp;{l.name}</span> : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>

            <span className="flex-1 max-lg:hidden" />
            {!reduceMotion ? (
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                aria-label={playing ? "Pause slideshow" : "Play slideshow"}
                className={`flex h-10 w-10 shrink-0 items-center justify-center transition-colors ${t.control}`}
              >
                {playing ? <Pause size={13} /> : <Play size={13} />}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => userStep(1)}
              aria-label="Next look"
              className={`flex h-10 w-10 shrink-0 items-center justify-center transition-colors ${t.control}`}
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* Right: the pieces in the front look */}
        <InThisLook look={look} index={active} t={t} />
      </div>
    </section>
  );
}

/**
 * One look on the ring. Its place follows the ring's rotation: sideways by
 * sin(angle), depth by cos(angle). Depth drives size, height on the floor,
 * blur, paleness and stacking; the ring's speed adds motion blur while it turns.
 */
function Figure({
  look,
  index,
  n,
  rot,
  vel,
  radius,
  height,
  isFront,
  reduceMotion,
  shadowClass,
  onSelect,
}: {
  look: HomeLook;
  index: number;
  n: number;
  rot: MotionValue<number>;
  vel: MotionValue<number>;
  radius: number;
  height: number;
  isFront: boolean;
  reduceMotion: boolean;
  shadowClass: string;
  onSelect: () => void;
}) {
  const { src, ready } = useTrimmedImage(look.image);
  // Stage size as motion values, so a resize reaches the transforms below.
  const radiusMV = useMotionValue(radius);
  const heightMV = useMotionValue(height);
  useEffect(() => {
    radiusMV.set(radius);
    heightMV.set(height);
  }, [radius, height, radiusMV, heightMV]);

  const angle = useTransform(rot, (r) => ((index - r) / n) * Math.PI * 2);
  /** 1 at the front of the ring, 0 at the back. */
  const near = useTransform(angle, (a) => (Math.cos(a) + 1) / 2);
  const x = useTransform([angle, radiusMV], ([a, r]: number[]) => Math.sin(a) * r);
  const y = useTransform([near, heightMV], ([d, h]: number[]) => -(1 - d) * h * 0.07);
  const scale = useTransform(near, (d) => 0.6 + 0.4 * d);
  // Front and side looks stay solid; only the back of the ring turns pale.
  const opacity = useTransform(near, (d) => 0.18 + 0.82 * d ** 0.8);
  const zIndex = useTransform(near, (d) => Math.round(d * 200));
  const filter = useTransform([near, vel], ([d, v]: number[]) => {
    const depthBlur = (1 - d) ** 1.5 * 8;
    const motionBlur = reduceMotion ? 0 : Math.min(Math.abs(v) * 1.6, 5);
    return `blur(${(depthBlur + motionBlur).toFixed(2)}px)`;
  });

  return (
    <motion.div
      className={`pointer-events-none absolute inset-x-0 bottom-[3%] flex items-end justify-center transition-opacity duration-500 ${
        ready ? "opacity-100" : "opacity-0"
      }`}
      style={{ zIndex }}
    >
      <motion.button
        type="button"
        tabIndex={-1}
        aria-hidden={!isFront}
        onClick={() => (isFront ? undefined : onSelect())}
        className="pointer-events-auto relative origin-bottom"
        style={{ x, y, scale, opacity, filter, height }}
      >
        <img
          src={src}
          alt={isFront ? look.name || `Look ${num(index)}` : ""}
          draggable={false}
          decoding="async"
          className="pointer-events-none h-full w-auto max-w-none"
        />
        {/* Soft contact shadow on the floor. */}
        <span aria-hidden className={`absolute -bottom-2 left-1/2 -z-10 h-4 w-[90%] -translate-x-1/2 rounded-[50%] blur-[7px] ${shadowClass}`} />
      </motion.button>
    </motion.div>
  );
}

function InThisLook({ look, index, t }: { look: HomeLook; index: number; t: Theme }) {
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
    <aside aria-label="In this look" className={`flex min-w-0 flex-col ${t.panel}`}>
      <div className="flex items-baseline justify-between gap-3 px-6 pb-4 pt-10 md:pt-12">
        <p className={`text-[15px] font-semibold ${t.text}`}>In this look</p>
        <p className={`font-mono text-[10px] uppercase tracking-[0.25em] ${t.muted}`}>
          {look.products.length} {look.products.length === 1 ? "piece" : "pieces"}
        </p>
      </div>

      <div aria-live="polite" className="min-h-0 flex-1 px-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.ul
            key={look.id}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, transition: { duration: 0.18 } }}
            variants={{ show: { transition: { staggerChildren: 0.07 } } }}
          >
            <li className="sr-only">{label}</li>
            {look.products.map((p, i) => {
              const opts = sizeOptions(p);
              return (
                <motion.li
                  key={p.id}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT } },
                  }}
                  className={`flex items-center gap-4 border-t py-4 ${t.rule}`}
                >
                  <Link
                    to="/product/$id"
                    params={{ id: p.id }}
                    className={`relative flex h-[76px] w-[76px] shrink-0 items-center justify-center overflow-hidden ${t.thumb}`}
                  >
                    {p.image ? <img src={p.image} alt="" className="h-full w-full object-cover" /> : null}
                    <span className={`absolute left-1.5 top-1 font-mono text-[9px] ${t.muted}`}>{i + 1}</span>
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className={`font-mono text-[9px] uppercase tracking-[0.22em] ${t.muted}`}>{p.category}</p>
                    <Link
                      to="/product/$id"
                      params={{ id: p.id }}
                      className={`mt-0.5 block truncate text-[14px] underline-offset-4 hover:underline ${t.text}`}
                    >
                      {p.name}
                    </Link>
                    <div className="mt-1 flex items-center gap-3">
                      <span className={`text-[13px] ${t.text}`}>₹{p.price}</span>
                      {opts.length > 1 ? (
                        <select
                          aria-label={`Size for ${p.name}`}
                          value={sizeOf(p)}
                          onChange={(e) => setSizes((s) => ({ ...s, [p.id]: e.target.value }))}
                          className={`border px-1.5 py-0.5 font-mono text-[11px] uppercase outline-none ${t.select}`}
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
                    className={`flex h-10 w-10 shrink-0 items-center justify-center transition-colors ${t.plus}`}
                  >
                    <Plus size={16} />
                  </button>
                </motion.li>
              );
            })}
          </motion.ul>
        </AnimatePresence>
      </div>

      <div className={`mx-6 border-t pb-10 pt-4 md:pb-12 ${t.rule}`}>
        {look.products.length > 1 ? (
          <div className="mb-4 flex items-center justify-between">
            <span className={`text-[12px] ${t.text}`}>Complete the look</span>
            <span className={`text-[14px] font-semibold ${t.text}`}>₹{total}</span>
          </div>
        ) : null}
        <button
          type="button"
          onClick={addAll}
          className={`flex w-full items-center justify-center gap-3 py-3.5 text-[13px] font-medium transition-colors ${t.cta}`}
        >
          {look.products.length > 1 ? "Add full look to bag" : "Add to bag"} <ArrowRight size={15} />
        </button>
      </div>
    </aside>
  );
}
