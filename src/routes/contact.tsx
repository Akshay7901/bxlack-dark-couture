import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { InfoPage } from "@/components/InfoPage";
import { TURNSTILE_SITE_KEY, Turnstile } from "@/components/Turnstile";
import { submitContactMessage } from "@/lib/contact.functions";
import { seo } from "@/lib/seo";
import { loadPage } from "@/lib/pages/pages";

export const Route = createFileRoute("/contact")({
  head: () =>
    seo({
      title: "Contact Us — BXLACK",
      description:
        "Get in touch with BXLACK for help with orders, sizing, shipping or returns. Find our support hours, email and phone details.",
      path: "/contact",
    }),
  // Copy and contact details are editable in Studio → Store → Pages.
  loader: () => loadPage("contact"),
  component: ContactPage,
});

const inputClass =
  "w-full border-b border-light-grey/20 bg-transparent py-4 text-base text-white outline-none transition-colors placeholder:text-mid-grey/60 focus:border-white sm:text-sm";

function ContactPage() {
  const page = Route.useLoaderData();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const waitingForCaptcha = !!TURNSTILE_SITE_KEY && !captcha;

  return (
    <InfoPage
      eyebrow={page.eyebrow || undefined}
      title={page.title}
      italic={page.italic || undefined}
      intro={page.intro || undefined}
    >
      <div className="grid grid-cols-1 gap-12 border-t border-light-grey/10 pt-12 md:grid-cols-12 md:gap-16">
        <div className="md:col-span-4">
          <ul className="space-y-8">
            {page.channels.map((c, i) => (
              <li key={i}>
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-mid-grey/70">{c.label}</p>
                <p className="mt-2 text-sm text-light-grey/80">{c.value}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-8">
          {sent ? (
            <p className="font-display text-2xl leading-snug text-white md:text-4xl">
              Received. We will answer <em className="font-editorial italic text-white/70">shortly.</em>
            </p>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const data = new FormData(form);
                setBusy(true);
                try {
                  await submitContactMessage({
                    data: {
                      name: String(data.get("name") ?? "").trim(),
                      email: String(data.get("email") ?? "").trim(),
                      order_number: String(data.get("order") ?? "").trim() || null,
                      message: String(data.get("message") ?? "").trim(),
                      captcha,
                    },
                  });
                  setSent(true);
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not send message");
                  // A token works once; get a fresh one for the next try.
                  setCaptchaReset((n) => n + 1);
                } finally {
                  setBusy(false);
                }
              }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                <input required name="name" placeholder="Name" className={inputClass} aria-label="Name" />
                <input required type="email" name="email" placeholder="Email" className={inputClass} aria-label="Email" />
              </div>
              <input name="order" placeholder="Order number (optional)" className={inputClass} aria-label="Order number" />
              <textarea required name="message" rows={5} placeholder="Message" className={`${inputClass} resize-none`} aria-label="Message" />
              <Turnstile onToken={setCaptcha} resetKey={captchaReset} />
              <button
                type="submit"
                disabled={busy || waitingForCaptcha}
                className="border border-light-grey/25 px-10 py-4 font-mono text-[10px] uppercase tracking-[0.3em] text-white transition-colors hover:bg-white hover:text-noir disabled:opacity-50"
              >
                {busy ? "Sending…" : waitingForCaptcha ? "Verifying…" : "Send message"}
              </button>
            </form>
          )}
        </div>
      </div>
    </InfoPage>
  );
}