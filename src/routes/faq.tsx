import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { InfoPage } from "@/components/InfoPage";
import { seo } from "@/lib/seo";
import { loadPage } from "@/lib/pages/pages";
import { DEFAULT_PAGES } from "@/lib/pages/content";

export const Route = createFileRoute("/faq")({
  // Copy is editable in Studio → Store → Pages; falls back to the default text.
  loader: () => loadPage("faq"),
  head: ({ loaderData }) => ({
    ...seo({
      title: "FAQ — BXLACK",
      description:
        "Answers to common questions about BXLACK drops, sizing, delivery, returns, payment and garment care.",
      path: "/faq",
    }),
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: (loaderData ?? DEFAULT_PAGES.faq).faqs.map((f) => ({
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
  const page = Route.useLoaderData();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <InfoPage
      eyebrow={page.eyebrow || undefined}
      title={page.title}
      italic={page.italic || undefined}
      intro={page.intro || undefined}
    >
      <div className="border-t border-light-grey/10">
        {page.faqs.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className="border-b border-light-grey/10">
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