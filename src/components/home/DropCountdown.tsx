import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";

function useCountdown(target: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target - now);
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function DropCountdown() {
  // next drop: rolling 14-day cadence anchored to a fixed epoch
  const target = useMemo(() => {
    const anchor = Date.UTC(2026, 0, 1);
    const cycle = 14 * 86400000;
    const n = Math.ceil((Date.now() - anchor) / cycle);
    return anchor + n * cycle;
  }, []);
  const t = useCountdown(target);

  const units = [
    { v: t.days, l: "Days" },
    { v: t.hours, l: "Hrs" },
    { v: t.minutes, l: "Min" },
    { v: t.seconds, l: "Sec" },
  ];

  return (
    <section className="relative overflow-hidden border-y border-light-grey/10 bg-charcoal/40">
      {/* scanning line */}
      <motion.div
        aria-hidden
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-foreground/[0.045] to-transparent"
      />
      <div className="relative mx-auto grid max-w-[1600px] gap-10 px-5 py-16 sm:px-6 md:grid-cols-[1fr_auto] md:items-end md:px-10 md:py-24">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-mid-grey">Next release — Vault 007</p>
          <h2 className="mt-5 font-display text-[12vw] font-medium uppercase leading-[0.88] tracking-[-0.04em] text-foreground sm:text-5xl md:text-7xl">
            The vault <em className="font-editorial italic text-foreground/55">opens in</em>
          </h2>
          <div className="mt-8 flex items-end gap-5 sm:gap-8">
            {units.map((u) => (
              <div key={u.l} className="min-w-0">
                <p className="font-display text-4xl leading-none tracking-[-0.03em] text-foreground tabular-nums sm:text-6xl md:text-7xl">
                  {String(u.v).padStart(2, "0")}
                </p>
                <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.3em] text-foreground/40 sm:text-[10px]">{u.l}</p>
              </div>
            ))}
          </div>
        </div>

        <Link
          to="/new-drop"
          data-cursor="Access"
          className="group relative inline-flex h-14 items-center justify-center overflow-hidden border border-foreground px-8 font-mono text-[11px] uppercase tracking-[0.3em] text-foreground md:h-16"
        >
          <span className="absolute inset-0 -translate-y-full bg-foreground transition-transform duration-500 ease-[cubic-bezier(0.7,0,0.2,1)] group-hover:translate-y-0" />
          <span className="relative transition-colors duration-500 group-hover:text-noir">Request access</span>
        </Link>
      </div>
    </section>
  );
}
