import { motion } from "framer-motion";

/**
 * Account page background: deep black with a few large, heavily blurred grey
 * light pools drifting very slowly. Transform-only loops; reduced-motion users
 * get a still image via <MotionConfig reducedMotion="user">.
 */
const glows = [
  {
    className: "left-[-10%] top-[-15%] h-[70vh] w-[70vh] bg-[radial-gradient(circle,rgba(255,255,255,0.2),transparent_65%)]",
    drift: { x: [0, 60, -20, 0], y: [0, 40, 80, 0] },
    duration: 26,
  },
  {
    className: "right-[-15%] top-[20%] h-[80vh] w-[80vh] bg-[radial-gradient(circle,rgba(200,200,215,0.16),transparent_65%)]",
    drift: { x: [0, -70, -30, 0], y: [0, -50, 30, 0] },
    duration: 32,
  },
  {
    className: "bottom-[-25%] left-[25%] h-[75vh] w-[75vh] bg-[radial-gradient(circle,rgba(255,255,255,0.12),transparent_65%)]",
    drift: { x: [0, 50, 90, 0], y: [0, -40, -10, 0] },
    duration: 38,
  },
];

export function AccountBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-noir">
      {glows.map((g, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-3xl ${g.className}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, ...g.drift }}
          transition={{
            opacity: { duration: 2, ease: "easeOut" },
            x: { duration: g.duration, repeat: Infinity, ease: "easeInOut" },
            y: { duration: g.duration, repeat: Infinity, ease: "easeInOut" },
          }}
        />
      ))}
      {/* Vignette keeps the edges deep black and the content area calm. */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_40%,transparent_55%,rgba(0,0,0,0.45)_100%)]" />
    </div>
  );
}
