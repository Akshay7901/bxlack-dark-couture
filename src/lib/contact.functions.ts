import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(255),
  order_number: z.string().trim().max(50).nullable(),
  message: z.string().trim().min(1).max(5000),
  /** Cloudflare Turnstile token from the form; required once TURNSTILE_SECRET_KEY is set. */
  captcha: z.string().max(4096).nullable().optional(),
});

/** Messages one email address may send per hour. */
const MAX_PER_HOUR = 3;

/**
 * Checks a Turnstile token with Cloudflare. Without TURNSTILE_SECRET_KEY the
 * check is skipped, so the form keeps working until the keys are added.
 */
async function verifyCaptcha(token: string | null | undefined) {
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

/** Saves a contact-form message, alerts the store and sends the customer an
 * acknowledgement. Public — no sign-in needed, like the form itself — so it is
 * guarded by Turnstile and a per-address limit. */
export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => contactSchema.parse(input))
  .handler(async ({ data }) => {
    await verifyCaptcha(data.captcha);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.toLowerCase();
    const since = (ms: number) => new Date(Date.now() - ms).toISOString();

    const { count: lastHour } = await supabaseAdmin
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .ilike("email", email)
      .gte("created_at", since(60 * 60_000));
    if ((lastHour ?? 0) >= MAX_PER_HOUR) {
      throw new Error("You've sent several messages already. We'll reply soon — please try again in an hour.");
    }
    // Only one acknowledgement per address a day, so the form can't be used
    // to flood someone else's inbox with our emails.
    const { count: lastDay } = await supabaseAdmin
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .ilike("email", email)
      .gte("created_at", since(24 * 60 * 60_000));

    const { error } = await supabaseAdmin.from("contact_messages").insert({
      name: data.name,
      email: data.email,
      order_number: data.order_number,
      message: data.message,
    });
    if (error) throw new Error("Could not send message");

    const { notifyContactMessage } = await import("@/lib/email/notify.server");
    await notifyContactMessage(
      {
        name: data.name,
        email: data.email,
        orderNumber: data.order_number,
        message: data.message,
      },
      { acknowledge: (lastDay ?? 0) === 0 },
    );
    return { ok: true };
  });
