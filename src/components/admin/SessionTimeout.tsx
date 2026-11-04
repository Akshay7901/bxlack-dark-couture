import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";

/**
 * Studio session limits:
 *  - Idle: signed out after IDLE_MINUTES with no mouse, keyboard, touch or
 *    scroll activity in any studio tab. A warning with a countdown appears
 *    WARNING_SECONDS before, with "Stay signed in".
 *  - Absolute: signed out MAX_SESSION_HOURS after signing in, however active,
 *    so a session on a shared or lost device can't live forever.
 * Activity is shared between tabs through localStorage, so working in one
 * studio tab keeps the others open, and closing the laptop for longer than
 * the idle limit means signing in again.
 */
export const IDLE_MINUTES = 30;
export const WARNING_SECONDS = 120;
export const MAX_SESSION_HOURS = 12;

const IDLE_MS = IDLE_MINUTES * 60_000;
const WARNING_MS = WARNING_SECONDS * 1000;
const MAX_MS = MAX_SESSION_HOURS * 60 * 60_000;
const ACTIVE_KEY = "bxlack:admin-last-active";
const ACTIVITY_EVENTS = ["pointerdown", "pointermove", "keydown", "scroll", "touchstart", "wheel"] as const;

export type TimeoutReason = "idle" | "expired";

let memoryLastActive = 0;
function readLastActive() {
  try {
    return Number(localStorage.getItem(ACTIVE_KEY)) || memoryLastActive;
  } catch {
    return memoryLastActive;
  }
}
function writeLastActive(at: number) {
  memoryLastActive = at;
  try {
    localStorage.setItem(ACTIVE_KEY, String(at));
  } catch {
    // storage blocked — this tab still times out on its own
  }
}

export function SessionTimeout({
  signedInAt,
  onTimeout,
  onSignOut,
}: {
  /** When this session signed in (ISO), for the absolute limit. */
  signedInAt: string | null | undefined;
  onTimeout: (reason: TimeoutReason) => void;
  onSignOut: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const warningRef = useRef(false);
  const doneRef = useRef(false);
  const stayButton = useRef<HTMLButtonElement>(null);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    const signedInMs = signedInAt ? Date.parse(signedInAt) || Date.now() : Date.now();
    // A fresh sign-in counts as activity, so an old timestamp from a previous
    // session never signs someone out the moment they arrive.
    if (readLastActive() < signedInMs) writeLastActive(signedInMs);

    let lastWrite = 0;
    const onActivity = () => {
      // Once the warning is up, only "Stay signed in" keeps the session.
      if (warningRef.current) return;
      const now = Date.now();
      if (now - lastWrite < 5_000) return;
      lastWrite = now;
      writeLastActive(now);
    };

    const finish = (reason: TimeoutReason) => {
      if (doneRef.current) return;
      doneRef.current = true;
      onTimeoutRef.current(reason);
    };

    const check = () => {
      if (doneRef.current) return;
      const now = Date.now();
      if (now - signedInMs >= MAX_MS) return finish("expired");
      const idle = now - readLastActive();
      if (idle >= IDLE_MS) return finish("idle");
      const warn = idle >= IDLE_MS - WARNING_MS;
      warningRef.current = warn;
      setSecondsLeft(warn ? Math.ceil((IDLE_MS - idle) / 1000) : null);
    };

    for (const e of ACTIVITY_EVENTS) window.addEventListener(e, onActivity, { passive: true });
    // Checked every second for the countdown, and straight away when a
    // sleeping laptop or hidden tab comes back.
    const timer = window.setInterval(check, 1000);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("storage", check);
    check();
    return () => {
      for (const e of ACTIVITY_EVENTS) window.removeEventListener(e, onActivity);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("storage", check);
    };
  }, [signedInAt]);

  const warning = secondsLeft !== null;
  useEffect(() => {
    if (warning) stayButton.current?.focus();
  }, [warning]);

  if (!warning) return null;

  const stay = () => {
    warningRef.current = false;
    writeLastActive(Date.now());
    setSecondsLeft(null);
  };
  const mm = Math.floor(secondsLeft / 60);
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="session-timeout-title"
        aria-describedby="session-timeout-desc"
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl"
        onKeyDown={(e) => {
          if (e.key === "Escape") stay();
        }}
      >
        <p className="flex items-center gap-2 text-[15px] font-semibold text-neutral-900" id="session-timeout-title">
          <Clock size={16} /> Still there?
        </p>
        <p id="session-timeout-desc" className="mt-2 text-[13px] leading-relaxed text-neutral-600">
          For security, you'll be signed out of the studio after {IDLE_MINUTES} minutes without activity.
        </p>
        <p className="mt-4 font-mono text-3xl tabular-nums text-neutral-900" aria-live="polite" aria-atomic="true">
          {mm}:{ss}
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onSignOut}
            className="border border-black/15 px-4 py-2 text-[13px] text-neutral-700 hover:bg-neutral-50"
          >
            Sign out now
          </button>
          <button
            ref={stayButton}
            type="button"
            onClick={stay}
            className="border border-black bg-black px-4 py-2 text-[13px] font-medium text-white"
          >
            Stay signed in
          </button>
        </div>
      </div>
    </div>
  );
}

/** Message for the sign-in page after a timeout, set just before signing out. */
const REASON_KEY = "bxlack:admin-signed-out";

export function rememberTimeout(reason: TimeoutReason) {
  try {
    localStorage.setItem(REASON_KEY, JSON.stringify({ reason, at: Date.now() }));
  } catch {
    // ignore
  }
}

/** Clears the timeout message once the sign-in page has shown it. */
export function clearTimeoutMessage() {
  try {
    localStorage.removeItem(REASON_KEY);
  } catch {
    // ignore
  }
}

/** A recent timeout message for the sign-in page (read-only; see clearTimeoutMessage). */
export function readTimeoutMessage(): string | null {
  try {
    const raw = localStorage.getItem(REASON_KEY);
    if (!raw) return null;
    const { reason, at } = JSON.parse(raw) as { reason: TimeoutReason; at: number };
    if (Date.now() - at > 10 * 60_000) return null;
    return reason === "expired"
      ? `For security, studio sessions end ${MAX_SESSION_HOURS} hours after signing in. Please sign in again.`
      : `You were signed out after ${IDLE_MINUTES} minutes of inactivity. Please sign in again.`;
  } catch {
    return null;
  }
}
