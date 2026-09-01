import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AppShell } from "@/components/AppShell";
import look1 from "@/assets/look1.jpg";
import look2 from "@/assets/look2.jpg";
import story from "@/assets/story.jpg";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "Journal — BXLACK" },
      { name: "description", content: "Studio notes, essays and dispatches from BXLACK." },
      { property: "og:title", content: "Journal — BXLACK" },
      { property: "og:description", content: "Studio notes, essays and dispatches." },
    ],
  }),
  component: JournalPage,
});

const ENTRIES = [
  { n: "01", img: hero, cat: "Essay", title: "On dressing in silence", date: "26.02.26", read: "6 min" },
  { n: "02", img: look1, cat: "Studio note", title: "The last black we could find", date: "18.02.26", read: "4 min" },
  { n: "03", img: story, cat: "Craft", title: "Antwerp, 04:12 AM", date: "07.02.26", read: "8 min" },
  { n: "04", img: look2, cat: "Dispatch", title: "Letter from Tokyo", date: "22.01.26", read: "5 min" },
];

function JournalPage() {
  return (
    <AppShell>
      <section className="pt-28 md:pt-40">
        <div className="mx-auto max-w-[1600px] px-5 sm:px-6 md:px-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/50">Journal · Reel B</p>
          <h1 className="mt-6 font-display text-6xl font-medium leading-[0.85] tracking-[-0.05em] md:text-[11vw]">
            Field <em className="font-editorial italic text-white/70">notes.</em>
          </h1>
          <p className="mt-6 max-w-xl font-editorial text-xl italic text-white/60">
            Longform from the atelier: essays, studio dispatches, and things we cannot make into a garment.
          </p>
        </div>

        <div className="mx-auto mt-14 md:mt-24 max-w-[1600px] px-5 sm:px-6 md:px-10">
          {ENTRIES.map((e, i) => (
            <motion.article
              key={e.n}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-15%" }}
              transition={{ duration: 1, ease: [0.7, 0, 0.2, 1] }}
              className="group grid grid-cols-1 items-center gap-8 border-t border-white/10 py-16 md:grid-cols-12 md:gap-16"
              data-cursor="Read"
            >
              <div className="md:col-span-1">
                <p className="font-editorial text-4xl italic text-white/30">{e.n}</p>
              </div>
              <div className="md:col-span-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/40">{e.cat} · {e.date}</p>
                <h2 className="mt-4 font-display text-4xl leading-[0.95] tracking-[-0.03em] text-white transition-transform duration-500 group-hover:-translate-y-1 md:text-6xl">
                  {e.title}.
                </h2>
                <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">{e.read} · Read</p>
              </div>
              <div className="relative aspect-[4/3] overflow-hidden bg-[oklch(0.08_0_0)] md:col-span-6">
                <img src={e.img} alt={e.title} className="h-full w-full object-cover transition-transform duration-[1.4s] group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              </div>
            </motion.article>
          ))}
        </div>
        <div className="h-32" />
      </section>
    </AppShell>
  );
}