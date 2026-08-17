import { useEffect, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { fetchSiteSettings, joinWaitlist, verifyLaunchPassword } from "@/lib/launch";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import editorial from "@/assets/venus-tee-model-back.png";

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

  if (!mounted || !settings?.coming_soon_enabled || bypass || isAdmin || unlocked) {
    return <>{children}</>;
  }

  return (
    <GatePage
      headline={settings.headline}
      subheading={settings.subheading}
      launchAt={settings.launch_at}
      onUnlocked={() => {
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

  return (
    <div className="grain relative min-h-screen overflow-hidden bg-noir text-white">
      <motion.img
        src={editorial}
        alt=""
        initial={{ scale: 1.08, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 3, ease: [0.7, 0, 0.2, 1] }}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/70" />
      <div className="absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_45%,rgba(0,0,0,0.65),transparent_70%)]" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5 py-20 text-center sm:px-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-white/50">BXLACK</p>

        <h1 className="mt-6 max-w-2xl font-display text-[13vw] uppercase leading-[0.95] tracking-[-0.03em] sm:text-6xl md:text-7xl">
          {headline}
        </h1>
        <p className="mt-5 max-w-md font-editorial text-[15px] leading-relaxed text-white/60">
          {subheading}
        </p>

        {remaining !== null ? (
          <div className="mt-10 flex items-center gap-3 sm:gap-5">
            {[
              { value: days, label: "Days" },
              { value: hours, label: "Hrs" },
              { value: minutes, label: "Min" },
              { value: seconds, label: "Sec" },
            ].map((unit) => (
              <div
                key={unit.label}
                className="w-16 border border-white/15 bg-black/30 py-3 backdrop-blur-sm sm:w-20"
              >
                <div className="font-display text-2xl tabular-nums sm:text-3xl">
                  {String(unit.value ?? 0).padStart(2, "0")}
                </div>
                <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.24em] text-white/40">
                  {unit.label}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-10 w-full max-w-sm">
          {joined ? (
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/70">
              You're on the list. See you at the drop.
            </p>
          ) : (
            <form onSubmit={submitEmail} className="flex items-stretch gap-2">
              <input
                type="email"
                required
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-w-0 flex-1 border border-white/20 bg-black/30 px-4 py-3 font-mono text-base text-white outline-none backdrop-blur-sm transition-colors placeholder:text-white/35 focus:border-white/60 sm:text-[12px]"
              />
              <button
                type="submit"
                disabled={joining}
                className="flex items-center justify-center gap-2 border border-white bg-white px-5 py-3 font-mono text-[10px] uppercase tracking-[0.28em] text-black transition-colors hover:bg-transparent hover:text-white disabled:opacity-50"
              >
                {joining ? <Loader2 size={13} className="animate-spin" /> : null}
                Join
              </button>
            </form>
          )}
        </div>

        <div className="mt-10">
          {showPassword ? (
            <form onSubmit={submitPassword} className="flex items-stretch gap-2">
              <input
                type="password"
                required
                autoFocus
                placeholder="Access code"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-40 border border-white/20 bg-black/30 px-3 py-2.5 font-mono text-base text-white outline-none backdrop-blur-sm transition-colors placeholder:text-white/35 focus:border-white/60 sm:text-[12px]"
              />
              <button
                type="submit"
                disabled={checking}
                className="border border-white/25 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.24em] text-white/80 transition-colors hover:border-white hover:text-white disabled:opacity-50"
              >
                {checking ? "…" : "Enter"}
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowPassword(true)}
              className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.24em] text-white/35 transition-colors hover:text-white"
            >
              <Lock size={11} />
              Have an access code?
            </button>
          )}
          {passwordError ? (
            <p className="mt-2 font-mono text-[10px] text-red-300/80">{passwordError}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
