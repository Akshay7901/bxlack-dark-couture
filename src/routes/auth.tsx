import { useEffect, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, CheckCircle2, Clock, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { bootstrapFirstAdmin, hasAnyAdmin } from "@/lib/admin-users.functions";
import { seo } from "@/lib/seo";
import { IDLE_MINUTES, clearTimeoutMessage, readTimeoutMessage } from "@/components/admin/SessionTimeout";
import logo from "@/assets/bxlack-logo.webp";

export const Route = createFileRoute("/auth")({
  head: () =>
    seo({
      title: "Sign In — BXLACK Studio",
      description: "Sign in to the BXLACK studio.",
      noindex: true,
    }),
  ssr: false,
  component: AuthPage,
});

type Mode = "signin" | "forgot";
type Notice = { tone: "error" | "info" | "success"; text: string };

const labelClass = "block text-[13px] font-medium text-[#303030]";
const inputClass =
  "mt-1.5 block w-full rounded-lg border border-[#8a8a8a66] bg-white px-3 py-2.5 text-[14px] text-[#303030] outline-none transition-shadow placeholder:text-[#8a8a8a] focus:border-[#303030] focus:shadow-[0_0_0_1px_#303030]";

/** Studio sign-in, styled like the admin itself (Shopify/WordPress-style card). */
function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // Explains a studio timeout, if that is how we got here.
  const [notice, setNotice] = useState<Notice | null>(() => {
    const text = readTimeoutMessage();
    return text ? { tone: "info", text } : null;
  });
  const [busy, setBusy] = useState(false);
  useEffect(clearTimeoutMessage, []);

  const { data: adminState, refetch } = useQuery({
    queryKey: ["has-any-admin"],
    queryFn: () => hasAnyAdmin(),
  });
  const needsBootstrap = adminState?.hasAdmin === false;

  useEffect(() => {
    if (!loading && user) navigate({ to: "/admin", replace: true });
  }, [loading, user, navigate]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      if (needsBootstrap) {
        await bootstrapFirstAdmin({ data: { email, password } });
        await refetch();
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate({ to: "/admin", replace: true });
    } catch (err) {
      const text = err instanceof Error ? err.message : "Something went wrong.";
      setNotice({
        tone: "error",
        text: /invalid login credentials/i.test(text) ? "Incorrect email or password. Please try again." : text,
      });
    } finally {
      setBusy(false);
    }
  };

  const sendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    // Same redirect URL as the customer flow (already allowed in Supabase);
    // the flag sends staff back to the studio once the new password is set.
    try {
      localStorage.setItem("bxlack:reset-next", "/admin");
    } catch {
      // ignore — they land on their account page instead
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    setNotice(
      error
        ? { tone: "error", text: error.message }
        : {
            tone: "success",
            text: `If ${email} has a studio account, we've emailed a link to reset the password. Check your inbox and spam folder.`,
          },
    );
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setNotice(null);
  };

  return (
    <div className="admin-ui flex min-h-screen flex-col items-center justify-center bg-[#f1f1f1] px-4 py-10 [background-image:radial-gradient(ellipse_at_top,#ffffff_0%,transparent_60%)]">
      <div className="w-full max-w-[400px]">
        <div className="rounded-2xl bg-white p-8 shadow-[0_1px_0_#1a1a1a12,0_8px_24px_-8px_#1a1a1a26] ring-1 ring-black/5 sm:p-10">
          <img src={logo} alt="BXLACK" width={480} height={266} className="h-9 w-auto invert" />

          <h1 className="mt-7 text-[20px] font-semibold leading-tight text-[#303030]">
            {mode === "forgot" ? "Reset your password" : needsBootstrap ? "Create the owner account" : "Log in"}
          </h1>
          <p className="mt-1 text-[13px] text-[#616161]">
            {mode === "forgot"
              ? "Enter your studio email and we'll send you a reset link."
              : needsBootstrap
                ? "No admin exists yet. This account will own the studio; the form closes once it's created."
                : "Continue to BXLACK Studio"}
          </p>

          {notice ? <NoticeBox notice={notice} /> : null}

          {mode === "signin" ? (
            <form onSubmit={signIn} className="mt-6 space-y-4">
              <label className="block">
                <span className={labelClass}>Email</span>
                <input
                  type="email"
                  required
                  autoFocus
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </label>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="auth-password" className={labelClass}>
                    Password
                  </label>
                  {!needsBootstrap ? (
                    <button
                      type="button"
                      onClick={() => switchMode("forgot")}
                      className="rounded-none text-[13px] text-[#005bd3] hover:underline"
                    >
                      Forgot password?
                    </button>
                  ) : null}
                </div>
                <div className="relative">
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete={needsBootstrap ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClass} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 mt-1.5 flex w-11 items-center justify-center text-[#616161] hover:text-[#303030]"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 border border-black bg-black py-2.5 text-[14px] font-medium text-white disabled:opacity-60"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : null}
                {busy ? "Logging in…" : needsBootstrap ? "Create account & log in" : "Log in"}
              </button>
            </form>
          ) : (
            <form onSubmit={sendReset} className="mt-6 space-y-4">
              <label className="block">
                <span className={labelClass}>Email</span>
                <input
                  type="email"
                  required
                  autoFocus
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 border border-black bg-black py-2.5 text-[14px] font-medium text-white disabled:opacity-60"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : null}
                Send reset link
              </button>
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="flex w-full items-center justify-center gap-1.5 text-[13px] text-[#005bd3] hover:underline"
              >
                <ArrowLeft size={14} /> Back to log in
              </button>
            </form>
          )}

          <p className="mt-7 flex items-start gap-1.5 border-t border-[#e3e3e3] pt-5 text-[12px] leading-snug text-[#8a8a8a]">
            <Lock size={12} className="mt-0.5 shrink-0" />
            Invite-only. Sessions end after {IDLE_MINUTES} minutes of inactivity.
          </p>
        </div>

        <nav className="mt-6 flex items-center justify-center gap-5 text-[12px] text-[#616161]">
          <Link to="/" className="flex items-center gap-1 hover:text-[#303030]">
            <ArrowLeft size={12} /> Back to store
          </Link>
          <Link to="/privacy" className="hover:text-[#303030]">
            Privacy
          </Link>
          <Link to="/terms" className="hover:text-[#303030]">
            Terms
          </Link>
        </nav>
      </div>
    </div>
  );
}

function NoticeBox({ notice }: { notice: Notice }) {
  const styles = {
    error: { box: "bg-[#fee9e8] text-[#8e1f0b]", Icon: AlertCircle },
    info: { box: "bg-[#eaf4ff] text-[#00527c]", Icon: Clock },
    success: { box: "bg-[#e3f1df] text-[#0c5132]", Icon: CheckCircle2 },
  }[notice.tone];
  const { Icon } = styles;
  return (
    <div
      role={notice.tone === "error" ? "alert" : "status"}
      className={`mt-5 flex gap-2.5 rounded-lg px-3.5 py-3 text-[13px] leading-snug ${styles.box}`}
    >
      <Icon size={16} className="mt-px shrink-0" />
      <span>{notice.text}</span>
    </div>
  );
}
