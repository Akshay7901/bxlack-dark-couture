/**
 * Shared motion tokens so every animation on the storefront has the same
 * rhythm. Arrivals decelerate (ease-out), exits are quicker than entrances,
 * and only transform/opacity are animated so nothing shifts layout.
 * Reduced-motion users are handled globally by <MotionConfig reducedMotion="user">.
 */
import type { Transition, Variants } from "framer-motion";

/** Smooth deceleration for things arriving on screen. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
/** Gentle acceleration for things leaving. */
export const EASE_IN = [0.4, 0, 1, 1] as const;

export const DURATION = {
  /** Hover / press feedback. */
  fast: 0.2,
  /** Page and section entrances. */
  base: 0.5,
  /** Large editorial reveals. */
  slow: 0.8,
} as const;

/** Per-item delay for staggered lists and grids (30–50ms). */
export const STAGGER = 0.045;

export const enter: Transition = { duration: DURATION.base, ease: EASE_OUT };

/** Fade up from slightly below — the default entrance for content blocks. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: enter },
};

/** Parent that staggers its children's `fadeUp` entrance. */
export const stagger = (delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: STAGGER, delayChildren } },
});

/**
 * Delay for the i-th item of a long grid revealed on scroll: staggers within
 * a row-sized group so items further down don't wait for the whole list.
 */
export const gridDelay = (i: number, perGroup = 6, step = STAGGER) => (i % perGroup) * step;
