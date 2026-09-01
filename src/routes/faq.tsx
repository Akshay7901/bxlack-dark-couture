import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { InfoPage } from "@/components/InfoPage";

const FAQS = [
  { q: "When does the next drop release?", a: "Drops are announced by email first. Join the list in the footer and you will receive the exact release time 24 hours ahead of the public." },
  { q: "Are pieces restocked?", a: "No. Every run is numbered and finite. Once a size is gone it does not return." },
  { q: "How do your pieces fit?", a: "Cut oversized with a dropped shoulder. If you prefer a closer line, size down. Full measurements are on the size guide." },
  { q: "How long does delivery take?", a: "1–2 working days to dispatch, then 3–5 days domestically and 4–12 days internationally depending on destination." },
  { q: "Can I return or exchange a piece?", a: "Yes, within 14 days of delivery, unworn and with the numbered tag attached. Size exchanges are free within Europe." },
  { q: "Which payment methods do you accept?", a: "Major cards, wallets and local methods supported by our payment provider at checkout. Card details are never stored by BXLACK." },
  { q: "Do you ship internationally?", a: "Yes, worldwide. Orders outside the EU may attract import duties collected by the carrier on delivery." },
  { q: "How should I care for my piece?", a: "Cold wash inside out, no bleach, hang to dry, iron on reverse. Never tumble dry embroidered or printed pieces." },
];

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — BXLACK" },
      { name: "description", content: "Answers on drops, sizing, delivery, returns, payment and garment care at BXLACK." },
      { property: "og:title", content: "FAQ — BXLACK" },
      { property: "og:description", content: "Drops, sizing, delivery, returns, payment and care — answered." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://bxlack-dark-couture.lovable.app/faq" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://bxlack-dark-couture.lovable.app/faq" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <InfoPage
      eyebrow="Client Services"
      title="Frequently"
      italic="asked."
      intro="Everything on drops, sizing, delivery and care. If your question is not here, write to clients@bxlack.com."
    >
      <div className="border-t border-light-grey/10">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={f.q} className="border-b border-light-grey/10">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-6 py-6 text-left"
              >
                <span className="font-display text-lg leading-snug tracking-[-0.01em] text-white md:text-2xl">{f.q}</span>
                <Plus
                  size={18}
                  strokeWidth={1.25}
                  className={`shrink-0 text-light-grey/60 transition-transform duration-500 ${isOpen ? "rotate-45" : ""}`}
                />
              </button>
              <div className={`grid transition-all duration-500 ease-[cubic-bezier(0.7,0,0.2,1)] ${isOpen ? "grid-rows-[1fr] pb-6 opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                <div className="overflow-hidden">
                  <p className="max-w-2xl text-sm leading-relaxed text-light-grey/70 md:text-base">{f.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </InfoPage>
  );
}