import { motion } from "framer-motion";
import { AppShell } from "@/components/AppShell";

export type InfoBlock = { heading: string; body: string[] };

export function InfoPage({
  eyebrow,
  title,
  italic,
  intro,
  blocks,
  children,
  hideNewsletter,
}: {
  eyebrow?: string;
  title: string;
  italic?: string;
  intro?: string;
  blocks?: InfoBlock[];
  children?: React.ReactNode;
  hideNewsletter?: boolean;
}) {
  return (
    <AppShell hideNewsletter={hideNewsletter}>
      <section className="mx-auto max-w-[1600px] px-5 pt-28 sm:px-6 md:px-10 md:pt-40">
        {eyebrow ? (
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/50">{eyebrow}</p>
        ) : null}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.7, 0, 0.2, 1] }}
          className="mt-5 font-display text-[14vw] font-medium leading-[0.85] tracking-[-0.04em] sm:text-6xl md:mt-6 md:text-[8vw]"
        >
          {title} {italic ? <em className="font-editorial italic text-white/70">{italic}</em> : null}
        </motion.h1>
        {intro ? (
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-light-grey/70 md:text-lg">{intro}</p>
        ) : null}
      </section>

      <section className="mx-auto mt-14 max-w-[1600px] px-5 pb-32 sm:px-6 md:mt-20 md:px-10">
        {blocks?.map((b, i) => (
          <motion.div
            key={b.heading}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.7, ease: [0.7, 0, 0.2, 1] }}
            className="grid grid-cols-1 gap-4 border-t border-light-grey/10 py-8 md:grid-cols-12 md:gap-8 md:py-12"
          >
            <div className="md:col-span-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-mid-grey/70">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h2 className="mt-3 font-display text-2xl leading-tight tracking-[-0.02em] md:text-3xl">{b.heading}</h2>
            </div>
            <div className="space-y-4 md:col-span-8">
              {b.body.map((p) => (
                <p key={p} className="max-w-3xl text-sm leading-relaxed text-light-grey/70 md:text-base">
                  {p}
                </p>
              ))}
            </div>
          </motion.div>
        ))}
        {children}
      </section>
    </AppShell>
  );
}