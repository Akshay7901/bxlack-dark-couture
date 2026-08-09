import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { SilkBackdrop } from "@/components/SilkBackdrop";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — BXLACK" },
      { name: "description", content: "Set a new password for your BXLACK account." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Reset Password — BXLACK" },
      { property: "og:description", content: "Set a new password for your BXLACK account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  ssr: false,
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    navigate({ to: "/account", replace: true });
  };

  return (
    <AppShell hideNewsletter>
      <SilkBackdrop />
      <section className="relative mx-auto flex min-h-[80vh] max-w-[1500px] items-center justify-center px-5 pt-28">
        <div className="w-full max-w-[420px] border border-white/10 bg-white/[0.02] px-7 py-10 backdrop-blur-sm sm:px-9">
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/40">BXLACK · Members</p>
          <h1 className="mt-3 font-display text-[28px] uppercase leading-[1.05] tracking-[-0.01em] text-white">
            New password
          </h1>
          <form onSubmit={submit} className="mt-7 space-y-4">
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
              {busy ? "Saving…" : "Update password"}
            </button>
          </form>
          {message ? <p className="mt-4 font-mono text-[11px] text-white/60">{message}</p> : null}
        </div>
      </section>
      <div className="h-16" />
    </AppShell>
  );
}
