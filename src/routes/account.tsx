import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AlertCircle, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { AccountDashboard } from "@/components/account/AccountDashboard";
import editorial from "@/assets/venus-tee-model.png";

/** Word-by-word staggered reveal, matching the intro loader's letter-reveal motion. */
function RevealHeading({
  words,
  className,
  delayStart = 0.1,
}: {
  words: { text: string; italic?: boolean }[];
  className: string;
  delayStart?: number;
}) {
  return (
    <h1 className={className}>
      {words.map((w, i) => (
        <span key={i} className="mr-[0.25em] inline-block overflow-hidden align-bottom last:mr-0">
          <motion.span
            initial={{ y: "110%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            transition={{ delay: delayStart + i * 0.08, duration: 0.9, ease: [0.7, 0, 0.2, 1] }}
            className={`inline-block ${w.italic ? "font-editorial italic text-white/60" : ""}`}
          >
            {w.text}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}

function GoogleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account — BXLACK" },
      {
        name: "description",
        content: "Sign in or create a BXLACK account to save pieces, track your bag and shop SS26.",
      },
      { property: "og:title", content: "Account — BXLACK" },
      {
        property: "og:description",
        content: "Sign in or create a BXLACK account to save pieces and shop SS26.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  ssr: false,
  component: AccountPage,
});

type Mode = "signin" | "signup";

function AccountPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMessage(null);
    setNotice(null);
  }, [mode]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setNotice(null);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (signInError) throw signInError;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setMessage(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setMessage("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
  };

  const resetPassword = async () => {
    if (!email) {
      setMessage("Enter your email first, then request a reset link.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setMessage(error ? error.message : null);
    if (!error) setNotice("Password reset link sent. Check your inbox.");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  if (loading) {
    return (
      <AppShell hideNewsletter hideFooter>
        <div className="flex min-h-screen items-center justify-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
            Loading…
          </p>
        </div>
      </AppShell>
    );
  }

  if (user) {
    return (
      <AppShell hideNewsletter>
        <AccountDashboard userId={user.id} email={user.email ?? ""} onSignOut={signOut} />
      </AppShell>
    );
  }

  return (
    <AppShell hideNewsletter hideFooter>
      <section className="relative min-h-screen overflow-hidden">
        <motion.img
          src={editorial}
          alt=""
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 3.2, ease: [0.7, 0, 0.2, 1] }}
          className="absolute inset-0 h-full w-full object-cover object-[50%_22%]"
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-black/65" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_58%,rgba(0,0,0,0.7),transparent_70%)]" />

        <div className="absolute inset-x-0 top-0 z-10 hidden items-baseline justify-between px-8 pt-28 font-mono text-[10px] uppercase tracking-[0.32em] text-white/40 sm:flex sm:px-12">
          <span>SS26 · Numbered Pieces</span>
          <span>001 / 002</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 z-10 hidden justify-center px-8 pb-8 font-mono text-[9px] uppercase tracking-[0.4em] text-white/30 sm:flex">
          <span>Born to stand apart · Designed in Antwerp</span>
        </div>

        <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-28 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.7, 0, 0.2, 1] }}
            className="glass w-full max-w-[420px] border border-white/10 px-7 py-10 sm:px-9"
          >
            <>
                <div className="text-center">
                  <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/40">
                    Members Access
                  </p>
                  <RevealHeading
                    key={mode}
                    words={
                      mode === "signin"
                        ? [{ text: "Welcome" }, { text: "back.", italic: true }]
                        : [{ text: "Join" }, { text: "the" }, { text: "list.", italic: true }]
                    }
                    className="mt-4 font-display text-[34px] uppercase leading-[1.05] tracking-[-0.01em] text-white sm:text-[40px]"
                  />
                </div>

                <div className="mt-6 flex border border-white/15">
                  <button
                    type="button"
                    onClick={() => setMode("signin")}
                    className={`flex-1 py-2.5 font-mono text-[10px] uppercase tracking-[0.24em] transition-colors ${
                      mode === "signin" ? "bg-white text-black" : "text-white/50 hover:text-white"
                    }`}
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className={`flex-1 py-2.5 font-mono text-[10px] uppercase tracking-[0.24em] transition-colors ${
                      mode === "signup" ? "bg-white text-black" : "text-white/50 hover:text-white"
                    }`}
                  >
                    Create account
                  </button>
                </div>

                <p className="mt-5 text-center font-editorial text-[14px] leading-[1.7] text-white/50">
                  {mode === "signin"
                    ? "Access your wishlist, bag and drop invitations."
                    : "Join the list to save pieces and get first access to SS26."}
                </p>

                <button
                  onClick={google}
                  className="mt-7 flex w-full items-center justify-center gap-3 border border-white/20 py-[12px] font-mono text-[10px] uppercase tracking-[0.28em] text-white/80 transition-colors hover:border-white hover:text-white"
                >
                  <GoogleIcon />
                  Continue with Google
                </button>

                <div className="my-6 flex items-center gap-4">
                  <span className="h-px flex-1 bg-white/10" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/30">
                    or
                  </span>
                  <span className="h-px flex-1 bg-white/10" />
                </div>

                <form onSubmit={submit} className="space-y-4">
                  <label className="block">
                    <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
                      Email
                    </span>
                    <input
                      type="email"
                      required
                      maxLength={255}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-2 w-full border border-white/15 bg-transparent px-3 py-3 font-mono text-base text-white outline-none transition-colors focus:border-white/60 sm:text-[12px]"
                    />
                  </label>
                  <label className="block">
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
                        Password
                      </span>
                      {mode === "signin" ? (
                        <button
                          type="button"
                          onClick={resetPassword}
                          className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/35 underline underline-offset-4 hover:text-white"
                        >
                          Forgot?
                        </button>
                      ) : null}
                    </div>
                    <div className="relative mt-2">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        maxLength={72}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border border-white/15 bg-transparent px-3 py-3 pr-11 font-mono text-base text-white outline-none transition-colors focus:border-white/60 sm:text-[12px]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-0 top-0 flex h-full w-11 items-center justify-center text-white/40 hover:text-white"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {mode === "signup" ? (
                      <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">
                        Minimum 6 characters
                      </p>
                    ) : null}
                  </label>

                  <button
                    type="submit"
                    disabled={busy}
                    className="flex w-full items-center justify-center gap-2 border border-white bg-white py-[13px] font-mono text-[11px] uppercase tracking-[0.32em] text-black transition-colors hover:bg-transparent hover:text-white disabled:opacity-50"
                  >
                    {busy ? <Loader2 size={14} className="animate-spin" /> : null}
                    {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
                  </button>
                </form>

                {notice ? (
                  <p className="mt-4 flex items-start gap-2 font-mono text-[10px] uppercase leading-relaxed tracking-[0.2em] text-white/70">
                    <Check size={13} className="mt-0.5 shrink-0" />
                    {notice}
                  </p>
                ) : null}
                {message ? (
                  <p className="mt-4 flex items-start gap-2 border-l border-red-400/50 pl-3 font-mono text-[11px] leading-relaxed text-red-300/90">
                    <AlertCircle size={13} className="mt-0.5 shrink-0" />
                    {message}
                  </p>
                ) : null}

                {mode === "signup" ? (
                  <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
                    Already have an account?{" "}
                    <button
                      onClick={() => setMode("signin")}
                      className="text-white/60 underline underline-offset-4 hover:text-white"
                    >
                      Sign in
                    </button>
                  </p>
                ) : null}
              </>
          </motion.div>
        </div>
      </section>
    </AppShell>
  );
}
