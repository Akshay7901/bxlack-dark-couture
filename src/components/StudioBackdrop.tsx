import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/**
 * Editorial studio backdrop — a soft overhead light cone, a warm floor pool,
 * fine vertical pinstripes and film grain. Pure CSS, no image weight.
 */
export function StudioBackdrop() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mx.set(e.clientX / window.innerWidth - 0.5);
      my.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [mx, my]);

  const spring = { stiffness: 55, damping: 20, mass: 0.6 };
  const sx = useSpring(mx, spring);
  const sy = useSpring(my, spring);

  const coneX = useTransform(sx, (v) => v * 40);
  const glowX = useTransform(sx, (v) => v * 90);
  const glowY = useTransform(sy, (v) => v * 60);
  const grainX = useTransform(sx, (v) => v * -70);
  const grainY = useTransform(sy, (v) => v * -50);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#0A0A0A]">
      {/* deep vignette base */}
      <div className="absolute inset-0 bg-[radial-gradient(130%_100%_at_50%_0%,rgba(26,26,26,0.95),rgba(10,10,10,1)_62%)]" />

      {/* fine vertical pinstripes */}
      <div className="absolute inset-0 opacity-[0.04] [background-image:repeating-linear-gradient(90deg,rgba(255,255,255,0.6)_0px,rgba(255,255,255,0.6)_1px,transparent_1px,transparent_120px)]" />

      {/* overhead light cone */}
      <motion.div
        style={{ x: coneX }}
        initial={{ opacity: 0, scaleY: 0.85 }}
        animate={{ opacity: 1, scaleY: 1 }}
        transition={{ duration: 2, ease: [0.7, 0, 0.2, 1] }}
        className="absolute -top-[22vh] left-1/2 h-[135vh] w-[95vw] max-w-[1500px] origin-top -translate-x-1/2 blur-2xl
                   [clip-path:polygon(38%_0%,62%_0%,100%_100%,0%_100%)]
                   bg-[linear-gradient(to_bottom,rgba(255,255,255,0.10),rgba(255,255,255,0.035)_45%,transparent_85%)]"
      />

      {/* breathing floor pool */}
      <motion.div
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-28vh] left-1/2 h-[62vh] w-[120vw] -translate-x-1/2 rounded-[50%] blur-3xl
                   bg-[radial-gradient(ellipse_at_center,rgba(196,199,204,0.12),transparent_65%)]"
      />

      {/* cursor-following soft light */}
      <motion.div
        style={{ x: glowX, y: glowY }}
        className="absolute left-1/2 top-[38%] h-[70vh] w-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]
                   bg-[radial-gradient(circle,rgba(230,232,236,0.07),transparent_65%)]"
      />

      {/* grain */}
      <motion.div style={{ x: grainX, y: grainY }} className="absolute -inset-[10%] opacity-[0.10] mix-blend-overlay">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
          }}
        />
      </motion.div>

      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_40%,transparent_45%,rgba(0,0,0,0.6)_100%)]" />
    </div>
  );
}
