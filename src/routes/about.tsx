import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AppShell } from "@/components/AppShell";
import story from "@/assets/story.jpg";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — BXLACK" },
      { name: "description", content: "The story, craft and identity behind BXLACK." },
      { property: "og:title", content: "About — BXLACK" },
      { property: "og:description", content: "The story, craft and identity behind BXLACK." },
    ],
  }),
  component: AboutPage,
});

const chapters = [
  { n: "I", t: "Our Vision", body: "To dress the ones who refuse to disappear. Every collection is a chapter in a longer sentence about identity, silence and defiance." },
  { n: "II", t: "Our Craft", body: "Cut and stitched by hand in a small Antwerp atelier. Finished under a single light in Tokyo. No factory floors. No repetition." },
  { n: "III", t: "Our Identity", body: "Matte black. Editorial. Uncompromising. BXLACK is not a season, it is a state of mind." },
];

function AboutPage() {
  return (
    <AppShell>
      <section className="relative flex min-h-[90vh] items-end overflow-hidden pt-40">
        <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black" />
        <div className="relative z-10 mx-auto max-w-[1600px] px-6 pb-20 md:px-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/60">Est. 2019 · Antwerp</p>
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.7, 0, 0.2, 1] }}
            className="mt-6 max-w-5xl font-display text-6xl font-medium leading-[0.85] tracking-[-0.04em] md:text-[9vw]"
          >
            A house built on <em className="font-editorial italic text-white/70">shadow.</em>
          </motion.h1>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 py-32 md:px-10">
        {chapters.map((c, i) => (
          <motion.div
            key={c.n}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 1, ease: [0.7, 0, 0.2, 1] }}
            className="grid grid-cols-1 gap-8 border-t border-white/10 py-16 md:grid-cols-12"
          >
            <div className="md:col-span-2">
              <p className="font-editorial text-6xl italic text-white/30">{c.n}</p>
            </div>
            <div className="md:col-span-4">
              <h3 className="font-display text-4xl leading-none md:text-6xl">{c.t}</h3>
            </div>
            <p className="max-w-lg text-base leading-relaxed text-white/60 md:col-span-6">{c.body}</p>
          </motion.div>
        ))}
      </section>

      <section className="relative overflow-hidden">
        <img src={story} alt="" className="h-[60vh] w-full object-cover opacity-70" loading="lazy" />
      </section>
    </AppShell>
  );
}