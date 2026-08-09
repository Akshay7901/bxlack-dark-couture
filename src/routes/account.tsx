import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { SilkBackdrop } from "@/components/SilkBackdrop";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account — BXLACK" },
      { name: "description", content: "Sign in or create a BXLACK account to save pieces, track your bag and shop SS26." },
      { property: "og:title", content: "Account — BXLACK" },
      { property: "og:description", content: "Sign in or create a BXLACK account to save pieces and shop SS26." },
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
          const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
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
    if (!error) setNotice("Password reset link sent — check your inbox.");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <AppShell hideNewsletter>
      <SilkBackdrop />
      <section className="relative mx-auto flex min-h-[80vh] max-w-[1500px] items-center justify-center px-5 pt-28 sm:px-6 md:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.7, 0, 0.2, 1] }}
          className="w-full max-w-[420px] border border-white/10 bg-white/[0.02] px-7 py-10 backdrop-blur-sm sm:px-9"
        >
          {loading ? (
            <p className="py-10 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">Loading…</p>
          ) : user ? (
            <div className="text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/40">BXLACK Member</p>
              <h1 className="mt-4 font-display text-[26px] uppercase leading-[1.1] tracking-[-0.01em] text-white">
                Your account
              </h1>
              <p className="mt-3 break-all font-editorial text-[14px] text-white/55">{user.email}</p>
              <div className="mt-8 space-y-3">
                <Link
                  to="/wishlist"
                  className="block w-full border border-white/20 py-[12px] font-mono text-[10px] uppercase tracking-[0.28em] text-white/70 transition-colors hover:border-white hover:text-white"
                >
                  Wishlist
                </Link>
                <Link
                  to="/cart"
                  className="block w-full border border-white/20 py-[12px] font-mono text-[10px] uppercase tracking-[0.28em] text-white/70 transition-colors hover:border-white hover:text-white"
                >
                  Your bag
                </Link>
                <button
                  onClick={signOut}
                  className="w-full border border-white bg-white py-[13px] font-mono text-[11px] uppercase tracking-[0.32em] text-black transition-colors hover:bg-transparent hover:text-white"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/40">BXLACK · Members</p>
              <h1 className="mt-3 font-display text-[28px] uppercase leading-[1.05] tracking-[-0.01em] text-white">
                {mode === "signin" ? "Sign in" : "Create account"}
              </h1>
              <p className="mt-3 font-editorial text-[14px] leading-[1.7] text-white/50">
                {mode === "signin"
                  ? "Access your wishlist, bag and drop invitations."
                  : "Join the list — save pieces and get first access to SS26."}
              </p>

              <button
                onClick={google}
                className="mt-7 flex w-full items-center justify-center gap-3 border border-white/20 py-[12px] font-mono text-[10px] uppercase tracking-[0.28em] text-white/80 transition-colors hover:border-white hover:text-white"
              >
                <span className="inline-block h-3.5 w-3.5 rounded-full border border-white/50" aria-hidden />
                Continue with Google
              </button>

              <div className="my-6 flex items-center gap-4">
                <span className="h-px flex-1 bg-white/10" />
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/30">or</span>
                <span className="h-px flex-1 bg-white/10" />
              </div>

              <form onSubmit={submit} className="space-y-4">
                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">Email</span>
                  <input
                    type="email"
                    required
                    maxLength={255}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 w-full border border-white/15 bg-transparent px-3 py-3 font-mono text-[12px] text-white outline-none transition-colors focus:border-white/60"
                  />
                </label>
                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">Password</span>
                  <input
                    type="password"
                    required
                    minLength={6}
                    maxLength={72}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-2 w-full border border-white/15 bg-transparent px-3 py-3 font-mono text-[12px] text-white outline-none transition-colors focus:border-white/60"
                  />
                </label>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full border border-white bg-white py-[13px] font-mono text-[11px] uppercase tracking-[0.32em] text-black transition-colors hover:bg-transparent hover:text-white disabled:opacity-50"
                >
                  {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
                </button>
              </form>

              {notice ? (
                <p className="mt-4 font-mono text-[10px] uppercase leading-relaxed tracking-[0.2em] text-white/60">{notice}</p>
              ) : null}
              {message ? (
                <p className="mt-4 font-mono text-[11px] leading-relaxed text-white/60">{message}</p>
              ) : null}

              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                  className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/50 underline underline-offset-4 hover:text-white"
                >
                  {mode === "signin" ? "Create account" : "I have an account"}
                </button>
                {mode === "signin" ? (
                  <button
                    onClick={resetPassword}
                    className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/40 underline underline-offset-4 hover:text-white"
                  >
                    Forgot password
                  </button>
                ) : null}
              </div>
            </>
          )}
        </motion.div>
      </section>
      <div className="h-16" />
    </AppShell>
  );
}
