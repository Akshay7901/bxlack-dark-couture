import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AppShell } from "@/components/AppShell";
import look1 from "@/assets/look1.jpg";
import look2 from "@/assets/look2.jpg";
import hero from "@/assets/hero.jpg";
import p3 from "@/assets/p3.jpg";
import p5 from "@/assets/p5.jpg";

export const Route = createFileRoute("/lookbook")({
  head: () => ({
    meta: [
      { title: "Lookbook — BXLACK SS26" },
      { name: "description", content: "The SS26 lookbook. Cinematic editorial photography from BXLACK." },
      { property: "og:title", content: "Lookbook — BXLACK SS26" },
      { property: "og:description", content: "Cinematic editorial photography from BXLACK." },
    ],
  }),
  component: LookbookPage,
});

const frames = [
  { img: look1, t: "Brutalist Silhouettes", n: "01" },
  { img: hero, t: "The Portrait", n: "02" },
  { img: p3, t: "Void", n: "03" },
  { img: look2, t: "Fog Vignette", n: "04" },
  { img: p5, t: "Fibre", n: "05" },
];

function LookbookPage() {
  return (
    <AppShell>
      <section className="pt-40">
        <div className="mx-auto max-w-[1600px] px-6 md:px-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/50">Lookbook · Chapter 001</p>
          <h1 className="mt-6 font-display text-6xl font-medium leading-[0.85] tracking-[-0.04em] md:text-[10vw]">
            Silence, <em className="font-editorial italic text-white/70">framed.</em>
          </h1>
        </div>

        <div className="mt-20 space-y-32">
          {frames.map((f, i) => (
            <motion.figure
              key={i}
              initial={{ opacity: 0, y: 80, filter: "blur(20px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-20%" }}
              transition={{ duration: 1.2, ease: [0.7, 0, 0.2, 1] }}
              className={`relative mx-auto ${i % 2 === 0 ? "max-w-[1400px]" : "max-w-[900px] md:ml-[15%]"}`}
            >
              <div className="relative overflow-hidden">
                <img src={f.img} alt={f.t} className="w-full object-cover" loading="lazy" />
              </div>
              <figcaption className="mt-4 flex items-baseline justify-between px-2 font-mono text-[10px] uppercase tracking-[0.3em] text-white/50">
                <span>{f.t}</span>
                <span>Frame {f.n} / 05</span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </section>
      <div className="h-32" />
    </AppShell>
  );
}