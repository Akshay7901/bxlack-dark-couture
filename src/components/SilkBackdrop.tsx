import { useEffect } from "react";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import shopBg from "@/assets/shop-bg.jpg";

export function SilkBackdrop() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const { scrollY } = useScroll();

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mx.set(e.clientX / window.innerWidth - 0.5);
      my.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [mx, my]);

  const spring = { stiffness: 60, damping: 22, mass: 0.6 };
  const sx = useSpring(mx, spring);
  const sy = useSpring(my, spring);

  // layer 1 — silk image (deepest, moves least)
  const x1 = useTransform(sx, (v) => v * -28);
  const y1 = useTransform(sy, (v) => v * -20);
  const scrollY1 = useSpring(useTransform(scrollY, [0, 1400], [0, -90]), { stiffness: 80, damping: 26 });

  // layer 2 — highlight haze (moves more)
  const x2 = useTransform(sx, (v) => v * 60);
  const y2 = useTransform(sy, (v) => v * 44);
  const scrollY2 = useSpring(useTransform(scrollY, [0, 1400], [0, 140]), { stiffness: 80, damping: 26 });

  // layer 3 — grain drift (moves most)
  const x3 = useTransform(sx, (v) => v * -90);
  const y3 = useTransform(sy, (v) => v * -70);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.img
        src={shopBg}
        alt=""
        width={1920}
        height={1280}
        style={{ x: x1, y: scrollY1, translateY: y1 }}
        className="absolute -inset-[8%] h-[116%] w-[116%] object-cover opacity-100"
        initial={{ scale: 1.16, opacity: 0 }}
        animate={{ scale: 1.06, opacity: 1 }}
        transition={{ duration: 2.4, ease: [0.7, 0, 0.2, 1] }}
      />

      <motion.div
        style={{ x: x2, y: scrollY2, translateY: y2 }}
        className="absolute left-1/2 top-1/4 h-[80vh] w-[80vh] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.12),transparent_65%)] blur-3xl"
      />
      <motion.div
        animate={{ opacity: [0.35, 0.6, 0.35] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-1/4 top-1/2 h-[60vh] w-[120vw] -rotate-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)] blur-2xl"
      />

      <motion.div
        style={{ x: x3, y: y3 }}
        className="absolute -inset-[10%] opacity-[0.18] mix-blend-overlay"
      >
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
          }}
        />
      </motion.div>

      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(5,5,5,0.15),rgba(5,5,5,0.35)_50%,rgba(5,5,5,0.6))]" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_35%,transparent_45%,rgba(0,0,0,0.55)_100%)]" />
    </div>
  );
}
