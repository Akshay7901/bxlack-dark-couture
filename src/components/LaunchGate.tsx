import { useEffect, useRef, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { fetchSiteSettings, joinWaitlist, verifyLaunchPassword } from "@/lib/launch";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import editorial from "@/assets/gate-model-back.png";

const UNLOCK_KEY = "bxlack:launch-unlocked";

export function LaunchGate({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { data: settings } = useQuery({ queryKey: ["site-settings"], queryFn: fetchSiteSettings });
  const { user } = useAuth();
  const isAdmin = useIsAdmin(user?.id);
  const [unlocked, setUnlocked] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUnlocked(localStorage.getItem(UNLOCK_KEY) === "1");
  }, []);

  const bypass = location.pathname.startsWith("/admin") || location.pathname.startsWith("/auth");
  const showGate = mounted && settings?.coming_soon_enabled && !bypass && !isAdmin && !unlocked;

  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  }, []);

  useEffect(() => {
    // Focusing the access-code input makes the mobile browser scroll the page so
    // the field clears the on-screen keyboard. Since unlocking swaps in the real
    // page in place (no navigation), that scroll offset would otherwise carry
    // straight over. Rather than reset it after the fact — which loses the race
    // against the keyboard's own dismiss animation — lock the page from scrolling
    // at all for as long as the gate is showing, so there's nothing to undo.
    if (!showGate) {
      window.scrollTo(0, 0);
      return;
    }
    const body = document.body;
    const prevPosition = body.style.position;
    const prevTop = body.style.top;
    const prevWidth = body.style.width;
    body.style.position = "fixed";
    body.style.top = "0";
    body.style.width = "100%";
    return () => {
      body.style.position = prevPosition;
      body.style.top = prevTop;
      body.style.width = prevWidth;
      window.scrollTo(0, 0);
    };
  }, [showGate]);

  if (!showGate) {
    return <>{children}</>;
  }

  return (
    <GatePage
      headline={settings.headline}
      subheading={settings.subheading}
      launchAt={settings.launch_at}
      onUnlocked={() => {
        (document.activeElement as HTMLElement | null)?.blur();
        localStorage.setItem(UNLOCK_KEY, "1");
        setUnlocked(true);
      }}
    />
  );
}

function useCountdown(target: string | null) {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    if (!target) return;
    const tick = () => setRemaining(Math.max(0, new Date(target).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return remaining;
}

/** Word-by-word staggered reveal, matching the login page's headline motion. */
function RevealHeading({ text, className }: { text: string; className: string }) {
  const words = text.split(" ");
  return (
    <h1 className={className}>
      {words.map((word, i) => (
        <span key={i} className="mr-[0.22em] inline-block overflow-hidden align-bottom last:mr-0">
          <motion.span
            initial={{ y: "110%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.09, duration: 0.9, ease: [0.7, 0, 0.2, 1] }}
            className="inline-block"
          >
            {word}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}

/** A single countdown unit that flips like a mechanical split-flap display when its value ticks over. */
function FlipUnit({ value, label }: { value: number | null; label: string }) {
  const display = String(value ?? 0).padStart(2, "0");
  return (
    <div className="w-16 border border-white/15 bg-black/30 py-3 backdrop-blur-sm transition-colors hover:border-white/35 sm:w-20">
      <div className="relative h-8 overflow-hidden sm:h-9">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={display}
            initial={{ y: "-100%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            exit={{ y: "60%", opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.7, 0, 0.2, 1] }}
            className="absolute inset-0 flex items-center justify-center font-display text-2xl tabular-nums sm:text-3xl"
          >
            {display}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.24em] text-white/40">{label}</div>
    </div>
  );
}

function GatePage({
  headline,
  subheading,
  launchAt,
  onUnlocked,
}: {
  headline: string;
  subheading: string;
  launchAt: string | null;
  onUnlocked: () => void;
}) {
  const remaining = useCountdown(launchAt);
  const [email, setEmail] = useState("");
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [checking, setChecking] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const days = remaining !== null ? Math.floor(remaining / 86400000) : null;
  const hours = remaining !== null ? Math.floor((remaining % 86400000) / 3600000) : null;
  const minutes = remaining !== null ? Math.floor((remaining % 3600000) / 60000) : null;
  const seconds = remaining !== null ? Math.floor((remaining % 60000) / 1000) : null;

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoining(true);
    try {
      await joinWaitlist(email.trim());
      setJoined(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setJoining(false);
    }
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    setPasswordError(null);
    try {
      const ok = await verifyLaunchPassword(password);
      if (ok) onUnlocked();
      else setPasswordError("Incorrect password.");
    } catch {
      setPasswordError("Something went wrong. Try again.");
    } finally {
      setChecking(false);
    }
  };

  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const springConfig = { stiffness: 120, damping: 22, mass: 0.6 };
  const smoothX = useSpring(cursorX, springConfig);
  const smoothY = useSpring(cursorY, springConfig);
  const imgX = useTransform(smoothX, [-0.5, 0.5], ["-2.5%", "2.5%"]);
  const imgY = useTransform(smoothY, [-0.5, 0.5], ["-2.5%", "2.5%"]);
  const rootRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    cursorX.set((e.clientX - rect.left) / rect.width - 0.5);
    cursorY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <div
      ref={rootRef}
      onMouseMove={handlePointerMove}
      className="grain relative min-h-screen overflow-hidden bg-noir text-white"
    >
      <motion.img
        src={editorial}
        alt=""
        initial={{ scale: 1.08, opacity: 0 }}
        animate={{ scale: 1.06, opacity: 1 }}
        style={{ x: imgX, y: imgY }}
        transition={{ duration: 3, ease: [0.7, 0, 0.2, 1] }}
        className="absolute inset-0 h-full w-full object-cover object-[30%_45%]"
      />
      <div className="absolute inset-0 bg-black/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-black/55" />
      <div className="absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_45%,rgba(0,0,0,0.4),transparent_70%)]" />

      <div className="absolute inset-x-0 top-0 z-10 hidden items-baseline justify-between px-8 pt-8 font-mono text-[10px] uppercase tracking-[0.32em] text-white/40 sm:flex sm:px-12">
        <span>BXLACK — SS2026</span>
        <span>Access Restricted</span>
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5 py-20 text-center sm:px-8">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.8 }}
          className="font-mono text-[10px] uppercase tracking-[0.5em] text-white/50"
        >
          BXLACK
        </motion.p>

        <RevealHeading
          text={headline}
          className="mt-6 max-w-2xl font-display text-[13vw] uppercase leading-[0.95] tracking-[-0.03em] sm:text-6xl md:text-7xl"
        />
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.8 }}
          className="mt-5 max-w-md font-editorial text-[15px] leading-relaxed text-white/60"
        >
          {subheading}
        </motion.p>

        {remaining !== null ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="mt-10 flex items-center gap-3 sm:gap-5"
          >
            <FlipUnit value={days} label="Days" />
            <FlipUnit value={hours} label="Hrs" />
            <FlipUnit value={minutes} label="Min" />
            <FlipUnit value={seconds} label="Sec" />
          </motion.div>
        ) : null}

        <div className="mt-10 w-full max-w-sm">
          {joined ? (
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/70">
              You're on the list. See you at the drop.
            </p>
          ) : (
            <form onSubmit={submitEmail} className="glass flex items-stretch gap-2 p-1.5">
              <input
                type="email"
                required
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-w-0 flex-1 bg-transparent px-3 py-2.5 font-mono text-base text-white outline-none transition-colors placeholder:text-white/35 sm:text-[12px]"
              />
              <button
                type="submit"
                disabled={joining}
                className="flex items-center justify-center gap-2 border border-white bg-white px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.28em] text-black transition-colors hover:bg-transparent hover:text-white disabled:opacity-50"
              >
                {joining ? <Loader2 size={13} className="animate-spin" /> : null}
                Join
              </button>
            </form>
          )}
        </div>

        <div className="mt-10">
          <AnimatePresence mode="wait" initial={false}>
            {showPassword ? (
              <motion.form
                key="password-form"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                onSubmit={submitPassword}
                className="glass flex items-stretch gap-2 p-1.5"
              >
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="Access code"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-40 bg-transparent px-3 py-2 font-mono text-base text-white outline-none transition-colors placeholder:text-white/35 sm:text-[12px]"
                />
                <button
                  type="submit"
                  disabled={checking}
                  className="border border-white/25 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-white/80 transition-colors hover:border-white hover:text-white disabled:opacity-50"
                >
                  {checking ? "…" : "Enter"}
                </button>
              </motion.form>
            ) : (
              <motion.button
                key="password-toggle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => setShowPassword(true)}
                className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.24em] text-white/35 transition-colors hover:text-white"
              >
                <Lock size={11} />
                Have an access code?
              </motion.button>
            )}
          </AnimatePresence>
          {passwordError ? (
            <p className="mt-2 font-mono text-[10px] text-red-300/80">{passwordError}</p>
          ) : null}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 hidden justify-center px-8 pb-8 font-mono text-[9px] uppercase tracking-[0.4em] text-white/30 sm:flex">
        <span>Born to stand apart — Designed in Antwerp</span>
      </div>
    </div>
  );
}
