import { motion, useScroll, useSpring, useTransform, useMotionValue } from "framer-motion";
import { useEffect, useRef } from "react";
import hero from "@/assets/bxlack-hero.png.asset.json";
import heroBack from "@/assets/bxlack-hero-back.png.asset.json";

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const springX = useSpring(cursorX, { stiffness: 80, damping: 20, mass: 0.8 });
  const springY = useSpring(cursorY, { stiffness: 80, damping: 20, mass: 0.8 });

  useEffect(() => {
    const update = () => {
      if (!ref.current) return;
      ref.current.style.setProperty("--mask-x", `${springX.get()}px`);
      ref.current.style.setProperty("--mask-y", `${springY.get()}px`);
    };
    const unsubscribeX = springX.on("change", update);
    const unsubscribeY = springY.on("change", update);
    return () => {
      unsubscribeX();
      unsubscribeY();
    };
  }, [springX, springY]);

  const onMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    cursorX.set(e.clientX - rect.left);
    cursorY.set(e.clientY - rect.top);
  };

  return (
    <section
      ref={ref}
      onMouseMove={onMouseMove}
      className="relative h-screen w-full overflow-hidden bg-noir"
      style={{ "--mask-x": "50%", "--mask-y": "50%" } as React.CSSProperties}
    >
      <motion.div style={{ scale, y }} className="absolute inset-0">
        {/* Back image (revealed on hover) */}
        <img
          src={heroBack.url}
          alt="BXLACK SS2026 campaign back"
          className="absolute inset-0 h-full w-full object-cover object-center"
          width={1672}
          height={941}
        />
        {/* Front image with cursor-following mask */}
        <img
          src={hero.url}
          alt="BXLACK SS2026 campaign"
          className="absolute inset-0 h-full w-full object-cover object-center transition-[mask-image] duration-75 ease-out"
          width={1672}
          height={941}
          style={{
            maskImage: "radial-gradient(circle at var(--mask-x) var(--mask-y), transparent 0%, transparent 120px, black 180px)",
            WebkitMaskImage: "radial-gradient(circle at var(--mask-x) var(--mask-y), transparent 0%, transparent 120px, black 180px)",
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