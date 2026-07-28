import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import hero from "@/assets/bxlack-hero.png.asset.json";
import heroBack from "@/assets/bxlack-hero-back.png.asset.json";

const LENS_SIZE = 160;

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const onMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!ref.current || !lensRef.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const lens = lensRef.current;
    lens.style.transform = `translate3d(${x - LENS_SIZE / 2}px, ${y - LENS_SIZE / 2}px, 0)`;
    // Match the underlying full-cover back image so the lens is a true window
    lens.style.backgroundSize = `${rect.width}px ${rect.height}px`;
    lens.style.backgroundPosition = `${-(x - LENS_SIZE / 2)}px ${-(y - LENS_SIZE / 2)}px`;
  };

  const onMouseEnter = () => {
    if (lensRef.current) lensRef.current.style.opacity = "1";
  };

  const onMouseLeave = () => {
    if (lensRef.current) lensRef.current.style.opacity = "0";
  };

  return (
    <section
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="relative h-screen w-full cursor-none overflow-hidden bg-noir"
    >
      <motion.div style={{ scale, y }} className="absolute inset-0">
        {/* Back image (base layer) */}
        <img
          src={heroBack.url}
          alt="BXLACK SS2026 campaign back"
          className="absolute inset-0 h-full w-full object-cover object-center"
          width={1672}
          height={941}
          loading="eager"
        />

        {/* Front image (full cover) */}
        <img
          src={hero.url}
          alt="BXLACK SS2026 campaign"
          className="absolute inset-0 h-full w-full object-cover object-center"
          width={1672}
          height={941}
          loading="eager"
        />

        {/* Cursor lens: reveals the back image at the hover point */}
        <div
          ref={lensRef}
          className="pointer-events-none absolute top-0 left-0 rounded-full border border-white/20"
          style={{
            width: LENS_SIZE,
            height: LENS_SIZE,
            backgroundImage: `url(${heroBack.url})`,
            backgroundRepeat: "no-repeat",
            opacity: 0,
            transform: `translate3d(-${LENS_SIZE / 2}px, -${LENS_SIZE / 2}px, 0)`,
            willChange: "transform, opacity",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 24px 60px rgba(0,0,0,0.45)",
            transition: "opacity 0.25s ease-out",
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
