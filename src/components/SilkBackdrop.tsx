import { useEffect, useState } from "react";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import shopBg from "@/assets/shop-bg.jpg";

export function SilkBackdrop() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const { scrollY } = useScroll();
  const [fine, setFine] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!mq.matches || reduce) return;
    setFine(true);
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        mx.set(e.clientX / window.innerWidth - 0.5);
        my.set(e.clientY / window.innerHeight - 0.5);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [mx, my]);

  const spring = { stiffness: 60, damping: 22, mass: 0.6 };
  const sx = useSpring(mx, spring);
  const sy = useSpring(my, spring);

  // layer 1 — silk image (deepest, moves least)
  const x1 = useTransform(sx, (v) => v * -28);
  const y1 = useTransform(sy, (v) => v * -20);
  const scrollY1 = useSpring(useTransform(scrollY, [0, 1400], [0, -90]), { stiffness: 80, damping: 26 });

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <motion.img
        src={shopBg}
        alt=""
        width={1920}
        height={1280}
        style={{ x: x1, y: scrollY1, translateY: y1 }}
        className="absolute left-1/2 top-1/2 h-[130%] w-[130%] -translate-x-1/2 -translate-y-1/2 object-cover"
        initial={{ scale: 1.08, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.4, ease: [0.7, 0, 0.2, 1] }}
        loading="eager"
        decoding="async"
      />

      {fine ? (
        <div className="absolute left-1/2 top-1/4 h-[70vh] w-[70vh] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.10),transparent_65%)]" />
      ) : null}

      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(5,5,5,0.15),rgba(5,5,5,0.35)_50%,rgba(5,5,5,0.6))]" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_35%,transparent_45%,rgba(0,0,0,0.55)_100%)]" />
    </div>
  );
}
