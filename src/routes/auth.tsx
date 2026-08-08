import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { bootstrapFirstAdmin, hasAnyAdmin } from "@/lib/admin-users.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In — BXLACK Studio" },
      { name: "description", content: "Sign in to the BXLACK studio to manage the SS26 catalogue." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Sign In — BXLACK Studio" },
      { property: "og:description", content: "Studio access for the BXLACK catalogue." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: adminState, refetch } = useQuery({
    queryKey: ["has-any-admin"],
    queryFn: () => hasAnyAdmin(),
  });
  const needsBootstrap = adminState?.hasAdmin === false;

  useEffect(() => {
    if (!loading && user) navigate({ to: "/admin", replace: true });
  }, [loading, user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      if (needsBootstrap) {
        await bootstrapFirstAdmin({ data: { email, password } });
        await refetch();
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate({ to: "/admin", replace: true });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grain relative flex min-h-screen items-center justify-center bg-noir px-5 text-white">
      <div className="w-full max-w-sm">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/40">BXLACK · Studio</p>
        <h1 className="mt-3 font-display text-3xl uppercase leading-none tracking-[-0.02em]">
          {needsBootstrap ? "Create first admin" : "Sign in"}
        </h1>
        <p className="mt-3 font-mono text-[10px] uppercase leading-relaxed tracking-[0.22em] text-white/35">
          {needsBootstrap
            ? "No admin exists yet — set up the owner account. This form closes once created."
            : "Studio access is invite-only. Admins are created from inside the studio."}
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">Email</span>
            <input
              type="email"
              required
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
            {busy ? "Please wait…" : needsBootstrap ? "Create admin & sign in" : "Sign in"}
          </button>
        </form>

        {message ? (
          <p className="mt-4 font-mono text-[11px] leading-relaxed text-white/60">{message}</p>
        ) : null}
      </div>
    </div>
  );
}