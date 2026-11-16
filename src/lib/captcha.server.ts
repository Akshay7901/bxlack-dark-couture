import { getRequestHeader } from "@tanstack/react-start/server";

/**
 * Checks a Cloudflare Turnstile token. Without TURNSTILE_SECRET_KEY the check
 * is skipped, so public forms keep working until the keys are added.
 * Used by the public forms that don't need an account (contact, guest checkout).
 */
export async function verifyCaptcha(token: string | null | undefined) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return;
  if (!token) throw new Error("Please complete the verification and try again.");
  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token);
  const ip = getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim();
  if (ip) body.append("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
  const result = res?.ok ? ((await res.json()) as { success?: boolean }) : null;
  if (!result?.success) throw new Error("Verification failed. Please reload the page and try again.");
}
