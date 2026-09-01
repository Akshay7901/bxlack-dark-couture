import { useRef, useState } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";

const TICKER = ["NEW DROPS", "EXCLUSIVE OFFERS", "RESTOCK ALERTS", "SEASONAL UPDATES", "EARLY ACCESS"];

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const sx = useSpring(mx, { stiffness: 120, damping: 22, mass: 0.4 });
  const sy = useSpring(my, { stiffness: 120, damping: 22, mass: 0.4 });
  const glow = useMotionTemplate`radial-gradient(420px circle at ${sx}% ${sy}%, rgba(255,255,255,0.10), transparent 65%)`;

  function onMove(e: React.MouseEvent) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set(((e.clientX - r.left) / r.width) * 100);
    my.set(((e.clientY - r.top) / r.height) * 100);
  }

  return (
    <section
      ref={ref}
      onMouseMove={onMove}
      className="relative isolate overflow-hidden border border-light-grey/10 bg-charcoal/40 px-5 py-14 backdrop-blur-sm sm:px-8 md:px-14 md:py-20"
    >
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ background: glow }} />

      {/* ghost wordmark drifting behind */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 -translate-y-1/2 select-none overflow-hidden">
        <motion.p
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          className="whitespace-nowrap font-display text-[22vw] leading-none tracking-[-0.05em] text-white/[0.035]"
        >
          BXLACK — BXLACK — BXLACK — BXLACK —&nbsp;
        </motion.p>
      </div>

      <div className="grid gap-12 md:grid-cols-[1fr_auto] md:items-end md:gap-16">
        <div>
          <div className="flex items-center gap-4">
            <span className="h-px w-10 bg-light-grey/40" />
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-mid-grey">Newsletter</p>
          </div>

          <h3 className="mt-6 font-display text-[15vw] leading-[0.88] tracking-[-0.03em] text-white sm:text-6xl md:text-7xl">
            Enter the <em className="font-editorial italic text-light-grey">void.</em>
          </h3>

          <p className="mt-5 max-w-md text-sm leading-relaxed text-light-grey/70">
            Subscribe with your email to get updates on new offers and new drops.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (email.trim()) setSent(true);
            }}
            className="relative mt-10 max-w-xl"
          >
            <label className="sr-only" htmlFor="nl-email">Email address</label>
            <div className="flex items-center gap-4 border-b border-light-grey/20 pb-3 transition-colors focus-within:border-white/70">
              <span className="font-mono text-[10px] tracking-[0.3em] text-mid-grey/60">01</span>
              <input
                id="nl-email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSent(false);
                }}
                placeholder="your@email"
                className="min-w-0 flex-1 bg-transparent py-2 font-sans text-base text-white placeholder:text-light-grey/40 focus:outline-none md:text-lg"
              />
              <button
                type="submit"
                className="relative shrink-0 font-mono text-[11px] uppercase tracking-[0.3em] text-white transition-opacity hover:opacity-70 after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-white after:transition-transform after:duration-500 hover:after:scale-x-100"
              >
                Subscribe →
              </button>
            </div>
            <motion.p
              aria-live="polite"
              initial={false}
              animate={{ opacity: sent ? 1 : 0, y: sent ? 0 : -4 }}
              transition={{ duration: 0.4 }}
              className="mt-4 font-mono text-[10px] uppercase tracking-[0.3em] text-light-grey"
            >
              Transmission confirmed. Welcome to the void.
            </motion.p>
          </form>
        </div>

        {/* rotating seal */}
        <div className="relative hidden h-40 w-40 shrink-0 items-center justify-center md:flex">
          <motion.svg
            viewBox="0 0 200 200"
            className="absolute inset-0 h-full w-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
          >
            <defs>
              <path id="nl-circle" d="M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0" />
            </defs>
            <text className="fill-light-grey/70 font-mono" fontSize="13" letterSpacing="6.5">
              <textPath href="#nl-circle">BORN TO STAND APART · BXLACK MAISON ·</textPath>
            </text>
          </motion.svg>
          <span className="font-display text-3xl text-white">B</span>
        </div>
      </div>

      {/* ticker strip */}
      <div className="mt-12 overflow-hidden border-t border-light-grey/10 pt-5">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="flex w-max gap-8 font-mono text-[10px] uppercase tracking-[0.35em] text-mid-grey/70"
        >
          {[...TICKER, ...TICKER, ...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="flex items-center gap-8">
              {t}
              <span className="h-1 w-1 rounded-full bg-light-grey/40" />
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}