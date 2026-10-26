import type { Email } from "@/lib/email/templates";

export type SendResult = { ok: true; id?: string } | { ok: false; error: string };

/** True when Resend is configured, so emails can actually go out. */
export const emailConfigured = () => !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

/**
 * Sends one email through Resend's HTTP API. Configured with env vars:
 *   RESEND_API_KEY      — from resend.com → API Keys
 *   EMAIL_FROM          — e.g. "BXLACK <orders@bxlack.com>" (domain verified in Resend)
 *   EMAIL_REPLY_TO      — optional, e.g. "clients@bxlack.com"
 *   ADMIN_NOTIFY_EMAIL  — where store alerts go; comma-separate several addresses
 *
 * Never throws: without configuration it logs and skips, and a failed send is
 * logged and reported in the result rather than breaking the order/return/
 * message that triggered it.
 */
export async function sendEmail(to: string | string[], email: Email): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const recipients = (Array.isArray(to) ? to : [to]).map((t) => t.trim()).filter(Boolean);

  if (!apiKey || !from) {
    console.info(`[email] not configured — skipped "${email.subject}"`);
    return { ok: false, error: "Email isn't set up: add RESEND_API_KEY and EMAIL_FROM in Vercel, then redeploy." };
  }
  if (recipients.length === 0) return { ok: false, error: "No recipient address" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: recipients,
        subject: email.subject,
        html: email.html,
        text: email.text,
        ...(process.env.EMAIL_REPLY_TO ? { reply_to: process.env.EMAIL_REPLY_TO } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });
    const body = await res.text();
    if (!res.ok) {
      console.error(`[email] Resend ${res.status} for "${email.subject}": ${body}`);
      let message = body;
      try {
        message = (JSON.parse(body) as { message?: string }).message ?? body;
      } catch {
        // not JSON — keep the raw text
      }
      return { ok: false, error: `Resend ${res.status}: ${message}` };
    }
    let id: string | undefined;
    try {
      id = (JSON.parse(body) as { id?: string }).id;
    } catch {
      // ignore
    }
    return { ok: true, id };
  } catch (err) {
    console.error(`[email] failed to send "${email.subject}"`, err);
    return { ok: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export function adminRecipients(): string[] {
  return (process.env.ADMIN_NOTIFY_EMAIL ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
