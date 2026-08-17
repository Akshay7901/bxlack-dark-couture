import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useMotionTemplate,
  animate,
} from "framer-motion";
import { useRef, useState, useEffect } from "react";
import hero from "@/assets/hero-front-v2.png.asset.json";
import heroBack from "@/assets/hero-back-v2.png.asset.json";

/**
 * `100svh`/`h-svh` isn't understood by older mobile browsers (pre ~2022), which then
 * ignore the height declaration entirely rather than falling back to `100vh` — leaving
 * the hero with no defined height at all. This measures the real visible viewport via
 * `window.innerHeight` (universally supported) and exposes it as a CSS variable so the
 * hero's height stays correct and stable everywhere, no CSS feature support required.
 */
function useStableViewportHeight() {
  useEffect(() => {
    const root = document.documentElement;
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      const current = parseFloat(root.style.getPropertyValue("--app-vh"));
      // Only shrink, never grow — keeps the value pinned to the smallest state the
      // mobile browser's address bar produces, instead of jumping around as it
      // shows/hides while scrolling.
      if (!current || vh <= current) root.style.setProperty("--app-vh", `${vh}px`);
    };
    setVh();
    const onOrientationChange = () => {
      root.style.removeProperty("--app-vh");
      setVh();
    };
    window.addEventListener("resize", setVh);
    window.addEventListener("orientationchange", onOrientationChange);
    return () => {
      window.removeEventListener("resize", setVh);
      window.removeEventListener("orientationchange", onOrientationChange);
    };
  }, []);
}

export function Hero() {
  useStableViewportHeight();
  const ref = useRef<HTMLDivElement>(null);
  const imgWrap = useRef<HTMLDivElement>(null);

  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const [isHovering, setIsHovering] = useState(false);
  const hoverValue = useMotionValue(0);

  const springConfig = { stiffness: 600, damping: 38, mass: 0.32 };
  const smoothX = useSpring(cursorX, springConfig);
  const smoothY = useSpring(cursorY, springConfig);

  useEffect(() => {
    const controls = animate(
      hoverValue,
      isHovering ? 1 : 0,
      isHovering
        ? { type: "spring", stiffness: 500, damping: 35, mass: 0.3 }
        : { type: "spring", stiffness: 340, damping: 32, mass: 0.4 },
    );
    return controls.stop;
  }, [isHovering, hoverValue]);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const RADIUS = "clamp(120px, 16vw, 240px)";

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = imgWrap.current?.getBoundingClientRect();
    if (!rect) return;
    cursorX.set(e.clientX - rect.left);
    cursorY.set(e.clientY - rect.top);
    setIsHovering(true);
  };

  const handleLeave = () => {
    setIsHovering(false);
  };

  const handleTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    const rect = imgWrap.current?.getBoundingClientRect();
    const touch = e.touches[0];
    if (!rect || !touch) return;
    cursorX.set(touch.clientX - rect.left);
    cursorY.set(touch.clientY - rect.top);
    setIsHovering(true);
  };

  const maskImage = useMotionTemplate`
    radial-gradient(circle ${RADIUS} at ${smoothX}px ${smoothY}px, #000 0%, #000 42%, rgba(0,0,0,0.72) 55%, rgba(0,0,0,0.28) 70%, transparent 100%)
  `;

  return (
    <section
      ref={ref}
      className="relative w-full overflow-hidden bg-noir"
      style={{ height: "calc(var(--app-vh, 1vh) * 100)" }}
    >
      <motion.div
        ref={imgWrap}
        style={{ scale, y }}
        className="absolute inset-0 flex items-center justify-center"
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        onTouchStart={handleTouch}
        onTouchMove={handleTouch}
        onTouchEnd={handleLeave}
        onTouchCancel={handleLeave}
      >
        <img
          src={hero.url}
          alt="BXLACK SS2026 campaign"
          className="absolute left-0 top-0 h-full w-full object-cover object-top"
          width={1672}
          height={941}
        />
        <motion.img
          src={heroBack.url}
          alt=""
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 h-full w-full object-cover object-top"
          style={{
            opacity: hoverValue,
            WebkitMaskImage: maskImage,
            maskImage: maskImage,
            WebkitMaskSize: "cover",
            maskSize: "cover",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            willChange: "mask-image, -webkit-mask-image, opacity, transform",
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
      </motion.div>

      {/* Bottom-left CTA */}
      <motion.div
        style={{ opacity }}
        className="absolute bottom-10 left-6 z-10 md:bottom-14 md:left-10"
      >
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.4, duration: 1 }}
          className="font-mono text-[11px] uppercase tracking-[0.35em] text-white/90"
        >
          SS2026 OUT NOW
        </motion.p>
        <motion.a
          href="/new-drop"
          data-cursor="Shop"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.6, duration: 1 }}
          className="mt-4 inline-flex items-center gap-3 border-b border-white/80 pb-1 font-mono text-[11px] uppercase tracking-[0.35em] text-white transition-all hover:gap-5"
        >
          Shop Now
          <span>→</span>
        </motion.a>
      </motion.div>
    </section>
  );
}
