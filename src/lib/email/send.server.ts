import type { Email } from "@/lib/email/templates";

/**
 * Sends one email through Resend's HTTP API. Configured with env vars:
 *   RESEND_API_KEY      — from resend.com → API Keys
 *   EMAIL_FROM          — e.g. "BXLACK <orders@bxlack.com>" (domain verified in Resend)
 *   EMAIL_REPLY_TO      — optional, e.g. "clients@bxlack.com"
 *   ADMIN_NOTIFY_EMAIL  — where store alerts go; comma-separate several addresses
 *
 * Never throws: without configuration it logs and skips, and a failed send is
 * logged rather than breaking the order/return/message that triggered it.
 */
export async function sendEmail(to: string | string[], email: Email): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const recipients = (Array.isArray(to) ? to : [to]).map((t) => t.trim()).filter(Boolean);

  if (!apiKey || !from) {
    console.info(`[email] not configured — skipped "${email.subject}"`);
    return;
  }
  if (recipients.length === 0) return;

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
    if (!res.ok) {
      console.error(`[email] Resend ${res.status} for "${email.subject}": ${await res.text()}`);
    }
  } catch (err) {
    console.error(`[email] failed to send "${email.subject}"`, err);
  }
}

export function adminRecipients(): string[] {
  return (process.env.ADMIN_NOTIFY_EMAIL ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
