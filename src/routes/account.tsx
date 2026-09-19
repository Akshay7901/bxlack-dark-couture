import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertCircle, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { AccountDashboard } from "@/components/account/AccountDashboard";
import editorial from "@/assets/venus-tee-model.webp";

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
  const qc = useQueryClient();
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
    await qc.cancelQueries();
    qc.clear();
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

                <form onSubmit={submit} className="mt-7 space-y-4">
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
