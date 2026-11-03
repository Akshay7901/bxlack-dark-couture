import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";
import fallbackImage from "@/assets/hero-front-v2.webp";
import { EASE_OUT } from "@/lib/motion";
import type { HeroData } from "@/lib/hero";

const SESSION_KEY = "bxlack:lights-on";

/**
 * "Lights Out" hero. The section opens almost black; a torch follows the
 * cursor (or finger) and lights up the campaign image and headline beneath.
 * Before anyone moves it drifts on its own as a hint. A click, the "Lights
 * on" button, scrolling on, or the auto timer floods the whole frame with
 * light and brings in the call to action. Once lit it stays lit for the
 * session; reduced-motion visitors get the lit version straight away.
 *
 * The torch runs in one requestAnimationFrame loop that writes CSS variables
 * (--x, --y, --r) on the section, so moving it never re-renders React.
 */
export function LightsOutHero({ hero, preview = false }: { hero: HeroData; /** Admin preview: fills its box, forgets the lights, ignores page scroll. */ preview?: boolean }) {
  const section = useRef<HTMLElement>(null);
  const [lit, setLit] = useState(false);
  const litRef = useRef(false);
  const [explored, setExplored] = useState(false);
  const [touch, setTouch] = useState(false);
  const image = hero.imageUrl ?? fallbackImage;

  const turnOn = () => {
    if (litRef.current) return;
    litRef.current = true;
    setLit(true);
    if (preview) return;
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // storage blocked — the lights just won't be remembered
    }
  };

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    setTouch(window.matchMedia("(hover: none)").matches);

    let alreadyLit = false;
    try {
      alreadyLit = !preview && sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      // ignore
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (alreadyLit || reduced) {
      litRef.current = true;
      setLit(true);
    }

    // Torch state, in px relative to the section.
    const size = () => el.getBoundingClientRect();
    let { width: w, height: h } = size();
    const pos = { x: w / 2, y: h * 0.45 };
    const target = { ...pos };
    const baseRadius = () => Math.max(130, Math.min(260, Math.min(w, h) * 0.24));
    let radius = litRef.current ? Math.hypot(w, h) : 0; // grows in from nothing on load
    let userActive = false;
    let idleSince = performance.now();
    const start = performance.now();

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      target.x = e.clientX - rect.left;
      target.y = e.clientY - rect.top;
      if (!userActive) {
        userActive = true;
        setExplored(true);
      }
    };
    const onLeave = (e: PointerEvent) => {
      // A lifted finger leaves the torch where it was; only a mouse leaving resumes the drift.
      if (e.pointerType !== "mouse") return;
      userActive = false;
      idleSince = performance.now();
    };
    const onClick = (e: PointerEvent) => {
      // Mouse click lights everything; touch taps just move the torch.
      if (e.pointerType === "mouse" && !(e.target as HTMLElement).closest("a,button")) turnOn();
    };
    const onResize = () => ({ width: w, height: h } = size());
    const onScroll = () => {
      if (!preview && window.scrollY > h * 0.3) turnOn();
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerdown", onMove);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointerup", onClick);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });

    let frame = 0;
    const tick = (now: number) => {
      // No visitor input (yet, or they left): drift on a slow figure-eight.
      if (!userActive && !litRef.current && now - idleSince > 400) {
        const t = (now - start) / 1000;
        target.x = w * (0.5 + 0.3 * Math.sin(t * 0.55));
        target.y = h * (0.46 + 0.16 * Math.sin(t * 1.1 + 0.6));
      }
      pos.x += (target.x - pos.x) * 0.14;
      pos.y += (target.y - pos.y) * 0.14;
      const goal = litRef.current ? Math.hypot(w, h) * 1.15 : baseRadius();
      radius += (goal - radius) * (litRef.current ? 0.045 : 0.08);
      el.style.setProperty("--x", `${pos.x.toFixed(1)}px`);
      el.style.setProperty("--y", `${pos.y.toFixed(1)}px`);
      el.style.setProperty("--r", `${radius.toFixed(1)}px`);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerdown", onMove);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointerup", onClick);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Lights come on by themselves after a while (0 = only when asked).
  useEffect(() => {
    if (lit || !hero.autoRevealSeconds) return;
    const t = setTimeout(turnOn, (hero.autoRevealSeconds + 2) * 1000);
    return () => clearTimeout(t);
  }, [lit, hero.autoRevealSeconds]); // eslint-disable-line react-hooks/exhaustive-deps

  const mask =
    "radial-gradient(circle var(--r) at var(--x) var(--y), #000 0%, #000 38%, rgba(0,0,0,0.55) 62%, transparent 100%)";
  const isExternal = /^https?:/.test(hero.ctaLink);

  const headline = (bright: boolean) => (
    <div className="absolute inset-0 flex items-center justify-center px-6">
      <div className="text-center">
        {hero.eyebrow ? (
          <p
            className={`mb-5 font-mono text-[10px] uppercase tracking-[0.4em] sm:text-[11px] ${
              bright ? "text-white/85" : "text-white/[0.07]"
            }`}
          >
            {hero.eyebrow}
          </p>
        ) : null}
        {bright ? (
          <p
            aria-hidden
            className="font-display text-[clamp(2.6rem,9vw,8rem)] font-medium uppercase leading-[0.88] tracking-[-0.01em] text-white"
          >
            {hero.title}
          </p>
        ) : (
          <h1 className="font-display text-[clamp(2.6rem,9vw,8rem)] font-medium uppercase leading-[0.88] tracking-[-0.01em] text-white/[0.06]">
            {hero.title}
          </h1>
        )}
      </div>
    </div>
  );

  return (
    <section
      ref={section}
      className={`${preview ? "h-full" : "hero-vh"} relative w-full touch-pan-y select-none overflow-hidden bg-black ${lit ? "" : "cursor-none"}`}
      style={{ "--x": "50%", "--y": "45%", "--r": "0px" } as React.CSSProperties}
    >
      {/* In the dark: the image is only just there. */}
      <div className="absolute inset-0">
        <img
          src={image}
          alt="BXLACK campaign"
          className="h-full w-full object-cover object-[50%_25%] opacity-[0.07] grayscale"
          fetchPriority="high"
        />
        {headline(false)}
      </div>

      {/* Under the torch: full image and bright headline. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ WebkitMaskImage: mask, maskImage: mask, willChange: "mask-image, -webkit-mask-image" }}
      >
        <img src={image} alt="" className="h-full w-full object-cover object-[50%_25%]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/10 to-black/55" />
        {headline(true)}
      </div>

      {/* Warm spill of light around the beam. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 mix-blend-screen transition-opacity duration-1000 ${lit ? "opacity-0" : "opacity-100"}`}
        style={{
          background:
            "radial-gradient(circle calc(var(--r) * 1.6) at var(--x) var(--y), rgba(255,236,214,0.10), rgba(255,236,214,0.03) 45%, transparent 70%)",
        }}
      />
      <div aria-hidden className="grain pointer-events-none absolute inset-0 opacity-60" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-noir to-transparent" />

      {/* Hint + lights switch while dark. */}
      <motion.div
        initial={false}
        animate={{ opacity: lit ? 0 : 1, y: lit ? 12 : 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
        className={`absolute inset-x-0 bottom-10 z-10 flex flex-col items-center gap-4 md:bottom-14 ${lit ? "pointer-events-none" : ""}`}
      >
        <p
          className={`flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.35em] text-white/55 transition-opacity duration-700 ${
            explored ? "opacity-0" : "opacity-100"
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white/80" />
          </span>
          {touch ? hero.hint.replace(/^move/i, "Drag") : hero.hint}
        </p>
        <button
          type="button"
          onClick={turnOn}
          tabIndex={lit ? -1 : 0}
          className="flex cursor-pointer items-center gap-2 border border-white/25 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.3em] text-white/80 transition-colors hover:border-white hover:bg-white hover:text-black"
        >
          <Lightbulb className="h-3.5 w-3.5" />
          Lights on
        </button>
      </motion.div>

      {/* Call to action once lit. */}
      <motion.div
        initial={false}
        animate={{ opacity: lit ? 1 : 0, y: lit ? 0 : 16 }}
        transition={{ delay: lit ? 0.7 : 0, duration: 1.1, ease: EASE_OUT }}
        className={`absolute inset-x-0 bottom-10 z-10 flex justify-center md:bottom-14 ${lit ? "" : "pointer-events-none"}`}
      >
        {isExternal ? (
          <a
            href={hero.ctaLink}
            tabIndex={lit ? 0 : -1}
            className="inline-flex items-center gap-3 border-b border-white/80 pb-1 font-mono text-[11px] uppercase tracking-[0.35em] text-white transition-all hover:gap-5"
          >
            {hero.ctaLabel} <span>→</span>
          </a>
        ) : (
          <Link
            to={hero.ctaLink}
            disabled={preview}
            tabIndex={lit ? 0 : -1}
            className="inline-flex items-center gap-3 border-b border-white/80 pb-1 font-mono text-[11px] uppercase tracking-[0.35em] text-white transition-all hover:gap-5"
          >
            {hero.ctaLabel} <span>→</span>
          </Link>
        )}
      </motion.div>
    </section>
  );
}
