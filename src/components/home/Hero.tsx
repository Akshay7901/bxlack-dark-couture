import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { useRef } from "react";
import heroImage from "@/assets/hero-front-v2.webp";
import heroBackImage from "@/assets/hero-back-v2.webp";
import { useAnimateIn } from "@/components/AppShell";
import { HeroReveal } from "@/components/home/HeroReveal";
import { EASE_OUT } from "@/lib/motion";

const MotionLink = motion.create(Link);

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const animateIn = useAnimateIn();
  // First load waits for the intro loader; in-app arrivals follow the image reveal.
  const ctaDelay = animateIn ? 1.1 : 2.4;

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="hero-vh relative w-full overflow-hidden bg-noir">
      {/* The page's one H1: the hero is all image, so it's for search engines and screen readers. */}
      <h1 id="bxlack" className="sr-only">BXLACK: luxury all-black streetwear. Numbered, small-batch T-shirts, shirts and jeans.</h1>
      <p className="sr-only">
        BXLACK is an Indian luxury streetwear label. Shop numbered, small-batch all-black T-shirts, shirts and jeans,
        made in limited runs and never restocked.
      </p>
      <motion.div style={{ scale, y }} className="absolute inset-0 flex items-center justify-center">
        {/* Arriving from another page (e.g. the logo): the campaign image settles
            in with a slow fade and zoom-out. Skipped on first load, where the
            intro loader already covers the reveal. */}
        <motion.div
          initial={animateIn ? { opacity: 0, scale: 1.08 } : false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2.2, ease: EASE_OUT }}
          className="absolute inset-0"
        >
        <img
          src={heroImage}
          alt="BXLACK SS2026 campaign"
          className="absolute left-0 top-0 h-full w-full object-cover object-top"
          width={1672}
          height={778}
          fetchPriority="high"
        />
        {/* Hover (or drag a finger) to melt through to the back of the tee. */}
        <HeroReveal src={heroBackImage} className="absolute left-0 top-0 h-full w-full" />
        </motion.div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
      </motion.div>

      {/* Bottom-left CTA */}
      <motion.div
        style={{ opacity }}
        className="absolute bottom-10 left-6 z-10 md:bottom-14 md:left-10"
      >
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: ctaDelay, duration: 1.3, ease: EASE_OUT }}
          className="block font-mono text-[11px] uppercase tracking-[0.35em] text-white/90"
        >
          SS2026 OUT NOW
        </motion.span>
        <MotionLink
          to="/new-drop"
          data-cursor="Shop"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: ctaDelay + 0.25, duration: 1.3, ease: EASE_OUT }}
          className="mt-4 inline-flex items-center gap-3 border-b border-white/80 pb-1 font-mono text-[11px] uppercase tracking-[0.35em] text-white transition-all hover:gap-5"
        >
          Shop Now
          <span>→</span>
        </MotionLink>
      </motion.div>
    </section>
  );
}
