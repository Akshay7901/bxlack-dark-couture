import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

export type HomeFaqItem = { q: string; a: string };

/** Always first: a plain answer to "what is this brand?" for people and answer engines. */
export const BRAND_FAQ: HomeFaqItem = {
  q: "What is BXLACK?",
  a: "BXLACK is an Indian luxury streetwear label making numbered, small-batch, all-black clothing: oversized T-shirts, shirts and jeans. Every piece is produced in a limited run, carries its own number and is never restocked, so each drop belongs to the few who want to stand apart rather than blend in.",
};

/**
 * Short FAQ near the bottom of the homepage. The questions after the brand
 * one come from the FAQ page (Studio → Store → Pages → FAQ). Answers stay in
 * the page even when closed, so search engines can read them.
 */
export function HomeFaq({ items }: { items: HomeFaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section aria-labelledby="home-faq-heading" className="bg-noir py-16 text-foreground sm:py-20 md:py-28">
      <div className="mx-auto grid max-w-[1600px] gap-10 px-5 sm:px-6 md:grid-cols-12 md:gap-16 md:px-10">
        <div className="md:col-span-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-mid-grey/70">Client Services</p>
          <h2
            id="home-faq-heading"
            className="mt-4 font-display text-3xl font-medium uppercase leading-[1.05] tracking-[-0.01em] sm:text-4xl"
          >
            Good to <em className="font-editorial font-normal normal-case italic text-white/70">know.</em>
          </h2>
          <Link
            to="/faq"
            className="mt-8 inline-flex items-center gap-3 border-b border-white/60 pb-1 font-mono text-[10px] uppercase tracking-[0.3em] text-white transition-all hover:gap-5"
          >
            All questions <span>→</span>
          </Link>
        </div>

        <div className="border-t border-light-grey/10 md:col-span-8">
          {items.map((f, i) => {
            const isOpen = open === i;
            const id = `home-faq-${i}`;
            return (
              <motion.div
                key={f.q}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ delay: i * 0.05, duration: 0.6, ease: [0.7, 0, 0.2, 1] }}
                className="border-b border-light-grey/10"
              >
                <h3 id={f.q.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={id}
                    className="flex w-full items-center justify-between gap-6 py-6 text-left"
                  >
                    <span className="font-display text-lg leading-snug tracking-[-0.01em] text-white md:text-xl">
                      {f.q}
                    </span>
                    <Plus
                      size={18}
                      className={`shrink-0 text-white/60 transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}
                    />
                  </button>
                </h3>
                <div
                  id={id}
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p
                      data-speakable={i === 0 ? "" : undefined}
                      className="max-w-2xl pb-6 text-[15px] leading-relaxed text-light-grey/70"
                    >
                      {f.a}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
