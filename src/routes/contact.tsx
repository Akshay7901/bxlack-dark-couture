import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { InfoPage } from "@/components/InfoPage";
import { submitContactMessage } from "@/lib/contact";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — BXLACK" },
      { name: "description", content: "Get in touch with BXLACK — timing, email and phone contact details." },
      { property: "og:title", content: "Contact — BXLACK" },
      { property: "og:description", content: "Timing, email and phone contact details for BXLACK." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://bxlack-dark-couture.lovable.app/contact" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://bxlack-dark-couture.lovable.app/contact" }],
  }),
  component: ContactPage,
});

// Placeholder contact details — replace with the real timing/email/number.
const CHANNELS = [
  { label: "Timing", value: "Mon – Sat, 10:00 AM – 7:00 PM" },
  { label: "Email", value: "hello@bxlack.com" },
  { label: "Contact number", value: "+91 00000 00000" },
];

const inputClass =
  "w-full border-b border-light-grey/20 bg-transparent py-4 text-base text-white outline-none transition-colors placeholder:text-mid-grey/60 focus:border-white sm:text-sm";

function ContactPage() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <InfoPage
      eyebrow="Client Services"
      title="Write to"
      italic="us."
      intro="We answer every message within one working day. For order enquiries, include your order number."
    >
      <div className="grid grid-cols-1 gap-12 border-t border-light-grey/10 pt-12 md:grid-cols-12 md:gap-16">
        <div className="md:col-span-4">
          <ul className="space-y-8">
            {CHANNELS.map((c) => (
              <li key={c.label}>
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
                    name: String(data.get("name") ?? "").trim(),
                    email: String(data.get("email") ?? "").trim(),
                    order_number: String(data.get("order") ?? "").trim() || null,
                    message: String(data.get("message") ?? "").trim(),
                  });
                  setSent(true);
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not send message");
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
              <button
                type="submit"
                disabled={busy}
                className="border border-light-grey/25 px-10 py-4 font-mono text-[10px] uppercase tracking-[0.3em] text-white transition-colors hover:bg-white hover:text-noir disabled:opacity-50"
              >
                {busy ? "Sending…" : "Send message"}
              </button>
            </form>
          )}
        </div>
      </div>
    </InfoPage>
  );
}