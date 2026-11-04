import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Copy, KeyRound, Loader2, LogOut, Plus, ShieldCheck, Smartphone, Trash2 } from "lucide-react";
import { Badge } from "@/components/admin/Badge";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import {
  getAssurance,
  listAuthenticators,
  removeAuthenticator,
  startEnrollment,
  verifyCode,
  type Enrollment,
} from "@/lib/mfa";

/** One field for a 6-digit code; submits by itself when the sixth digit goes in. */
export function CodeField({
  value,
  onChange,
  onComplete,
  disabled,
  autoFocus = true,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <input
      value={value}
      disabled={disabled}
      autoFocus={autoFocus}
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9]{6}"
      maxLength={6}
      placeholder="000000"
      aria-label="6-digit code"
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
        onChange(digits);
        if (digits.length === 6) onComplete?.(digits);
      }}
      className="block w-full rounded-lg border border-[#8a8a8a66] bg-white px-3 py-2.5 text-center font-mono text-[22px] tracking-[0.5em] text-[#303030] outline-none placeholder:text-[#d4d4d4] focus:border-[#303030] focus:shadow-[0_0_0_1px_#303030] disabled:opacity-60"
    />
  );
}

/** Scan-a-QR-code setup for one authenticator app. Calls onDone once verified. */
export function TotpSetup({ onDone, onCancel }: { onDone: () => void; onCancel?: () => void }) {
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    startEnrollment()
      .then(setEnrollment)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not start setup"));
  }, []);

  const confirm = async (value = code) => {
    if (!enrollment || value.length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      await verifyCode(enrollment.factorId, value);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "That code didn't work");
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  if (error && !enrollment) {
    return <p className="rounded-lg bg-[#fee9e8] px-3.5 py-3 text-[13px] text-[#8e1f0b]">{error}</p>;
  }
  if (!enrollment) {
    return (
      <p className="flex items-center gap-2 text-[13px] text-[#616161]">
        <Loader2 size={14} className="animate-spin" /> Preparing your QR code…
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <ol className="space-y-5 text-[13px] text-[#303030]">
        <li>
          <p className="font-medium">1. Install an authenticator app on your phone</p>
          <p className="mt-1 text-[#616161]">Google Authenticator, Microsoft Authenticator, Authy or 1Password all work.</p>
        </li>
        <li>
          <p className="font-medium">2. Scan this QR code with the app</p>
          <div className="mt-3 flex flex-wrap items-center gap-5">
            <img
              src={enrollment.qrCode}
              alt="QR code for your authenticator app"
              className="h-40 w-40 rounded-lg border border-[#e3e3e3] bg-white p-2"
            />
            <div className="min-w-0 max-w-[260px] text-[12px] text-[#616161]">
              Can't scan? Choose "Enter a setup key" in the app and type:
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText(enrollment.secret);
                  toast.success("Setup key copied");
                }}
                className="mt-2 flex w-full items-center justify-between gap-2 rounded-lg border border-[#e3e3e3] bg-[#f7f7f7] px-3 py-2 text-left font-mono text-[12px] text-[#303030] hover:bg-white"
              >
                <span className="break-all">{enrollment.secret.replace(/(.{4})/g, "$1 ").trim()}</span>
                <Copy size={13} className="shrink-0" />
              </button>
            </div>
          </div>
        </li>
        <li>
          <p className="font-medium">3. Enter the 6-digit code the app shows</p>
          <div className="mt-2 max-w-[260px]">
            <CodeField value={code} onChange={setCode} onComplete={(c) => void confirm(c)} disabled={busy} />
          </div>
        </li>
      </ol>

      {error ? <p className="rounded-lg bg-[#fee9e8] px-3.5 py-3 text-[13px] text-[#8e1f0b]">{error}</p> : null}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void confirm()}
          disabled={busy || code.length !== 6}
          className="flex items-center gap-2 border border-black bg-black px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
          Verify and turn on
        </button>
        {onCancel ? (
          <button type="button" onClick={onCancel} className="text-[13px] text-[#616161] hover:text-[#303030]">
            Cancel
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** Full-page step shown to studio accounts that haven't set up two-step verification yet. */
export function TwoStepSetupGate({ email, onDone, onSignOut }: { email: string; onDone: () => void; onSignOut: () => void }) {
  return (
    <div className="admin-ui flex min-h-screen items-start justify-center bg-[#f1f1f1] px-4 py-12">
      <div className="w-full max-w-[520px] rounded-2xl bg-white p-8 shadow-[0_1px_0_#1a1a1a12,0_8px_24px_-8px_#1a1a1a26] ring-1 ring-black/5 sm:p-10">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f1f1f1]">
          <ShieldCheck size={20} className="text-[#303030]" />
        </span>
        <h1 className="mt-5 text-[20px] font-semibold text-[#303030]">Secure your studio account</h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[#616161]">
          The studio requires two-step verification. After your password, you'll enter a code from your phone, so a
          stolen password alone can't open your orders and customer details. This takes about a minute.
        </p>
        <div className="mt-7 border-t border-[#e3e3e3] pt-7">
          <TotpSetup onDone={onDone} />
        </div>
        <p className="mt-8 flex items-center justify-between gap-3 border-t border-[#e3e3e3] pt-5 text-[12px] text-[#8a8a8a]">
          <span className="truncate">Signed in as {email}</span>
          <button type="button" onClick={onSignOut} className="flex shrink-0 items-center gap-1.5 hover:text-[#303030]">
            <LogOut size={12} /> Sign out
          </button>
        </p>
      </div>
    </div>
  );
}

/** Studio → Security: your own authenticator apps. */
export function SecuritySection({ mfaRequired }: { mfaRequired: boolean }) {
  const qc = useQueryClient();
  const { confirm, dialog } = useConfirm("light");
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { data: authenticators = [], isLoading } = useQuery({
    queryKey: ["mfa-authenticators"],
    queryFn: listAuthenticators,
  });
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["mfa-authenticators"] });
    void qc.invalidateQueries({ queryKey: ["mfa-assurance"] });
  };
  const lastOne = authenticators.length <= 1;

  return (
    <section className="space-y-6">
      {dialog}
      <div>
        <h2 className="font-display text-xl uppercase tracking-[-0.01em] text-neutral-900">Security</h2>
        <p className="mt-1.5 text-[13px] text-neutral-500">Two-step verification for your studio account.</p>
      </div>

      <div className="border border-black/12 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-[14px] font-semibold text-neutral-900">
            <ShieldCheck size={16} /> Two-step verification
          </p>
          {authenticators.length ? (
            <Badge tone="success">
              <CheckCircle2 size={12} /> On
            </Badge>
          ) : (
            <Badge tone="neutral">Off</Badge>
          )}
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">
          Each sign-in asks for your password and a 6-digit code from an authenticator app.
          {mfaRequired ? " It's required for every studio account." : ""} Add a second device (for example a tablet,
          or a password manager like 1Password) so you can still sign in if you lose your phone.
        </p>
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[14px] font-semibold text-neutral-900">Authenticator apps</p>
          {!adding ? (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex items-center gap-1.5 border border-black/15 px-3 py-1.5 text-[13px] text-neutral-800"
            >
              <Plus size={14} /> Add a device
            </button>
          ) : null}
        </div>

        {adding ? (
          <div className="mt-4 border border-black/12 p-5">
            <TotpSetup
              onDone={() => {
                toast.success("Authenticator added");
                setAdding(false);
                refresh();
              }}
              onCancel={() => setAdding(false)}
            />
          </div>
        ) : null}

        <div className="mt-4 space-y-2">
          {isLoading ? (
            <p className="text-[13px] text-neutral-500">Loading…</p>
          ) : authenticators.length === 0 ? (
            <p className="text-[13px] text-neutral-500">No authenticator apps yet.</p>
          ) : (
            authenticators.map((a) => (
              <div key={a.id} className="flex items-center gap-3 border border-black/12 px-4 py-3">
                <Smartphone size={16} className="shrink-0 text-neutral-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-neutral-900">{a.name}</p>
                  <p className="text-[12px] text-neutral-500">
                    Added {new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busyId === a.id || (mfaRequired && lastOne)}
                  title={mfaRequired && lastOne ? "Add another device before removing your only one" : "Remove"}
                  onClick={() =>
                    confirm({
                      title: "Remove authenticator",
                      message: `"${a.name}" will no longer be able to sign you in.`,
                      confirmLabel: "Remove",
                      destructive: true,
                      onConfirm: async () => {
                        setBusyId(a.id);
                        try {
                          await removeAuthenticator(a.id);
                          toast.success("Authenticator removed");
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Could not remove it");
                        } finally {
                          setBusyId(null);
                          refresh();
                        }
                      },
                    })
                  }
                  className="flex items-center gap-1.5 p-1.5 text-[12px] text-neutral-500 hover:text-red-600 disabled:opacity-40 disabled:hover:text-neutral-500"
                  aria-label={`Remove ${a.name}`}
                >
                  {busyId === a.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex gap-3 border border-black/12 bg-neutral-50 p-5 text-[13px] leading-relaxed text-neutral-600">
        <KeyRound size={16} className="mt-0.5 shrink-0" />
        <p>
          Lost your phone? Ask an admin to reset your two-step verification under Settings → Staff & permissions, then
          set it up again on your new phone.
        </p>
      </div>
    </section>
  );
}

/** Two-step state of the current session, for the studio gate. */
export function useAssurance(enabled: boolean) {
  return useQuery({ queryKey: ["mfa-assurance"], queryFn: getAssurance, enabled, staleTime: 30_000 });
}
