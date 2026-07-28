import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import hero from "@/assets/hero.jpg";
import look1 from "@/assets/look1.jpg";
import look2 from "@/assets/look2.jpg";
import story from "@/assets/story.jpg";

type Panel = {
  img: string;
  eyebrow: string;
  head: string;
  em: string;
  body: string;
  side: "left" | "right";
};

const PANELS: Panel[] = [
  { img: hero, eyebrow: "New Season", head: "Silence, worn", em: "loud.", body: "The SS26 silhouette is drawn tight to the body, then broken open at the shoulder — a whisper cut to carry across a room.", side: "left" },
  { img: look1, eyebrow: "Limited Drop", head: "Every thread tells a", em: "story.", body: "Woven from 320g Japanese wool, dyed in three passes of unrepeatable black. Fifty pieces cut. None will be re-made.", side: "right" },
  { img: look2, eyebrow: "Chapter 002", head: "Not clothing. An", em: "identity.", body: "BXLACK is not styled — it's inhabited. The wearer is the campaign.", side: "left" },
  { img: story, eyebrow: "Fabric Study", head: "Cut once,", em: "worn forever.", body: "Every seam is a decision. Every finish is signed. Every garment is numbered by hand.", side: "right" },
];

function Panel({ p, i }: { p: Panel; i: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "12%"]);
  const textX = useTransform(scrollYProgress, [0, 1], p.side === "left" ? ["-4%", "4%"] : ["4%", "-4%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.05, 1.15]);

  return (
    <div ref={ref} className="relative h-[110vh] w-full overflow-hidden">
      <motion.div style={{ y, scale }} className="absolute inset-0">
        <img src={p.img} alt={p.head} className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/50" />
      </motion.div>

      <motion.div
        style={{ x: textX }}
        className={`relative z-10 flex h-full items-center px-6 md:px-16 ${p.side === "left" ? "justify-start text-left" : "justify-end text-right"}`}
      >
        <div className="max-w-2xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/60">
            {String(i + 1).padStart(2, "0")} · {p.eyebrow}
          </p>
          <h3 className="mt-6 font-display text-[13vw] font-medium leading-[0.85] tracking-[-0.05em] text-white md:text-[7vw]">
            {p.head} <em className="font-editorial italic text-white/70">{p.em}</em>
          </h3>
          <p className="mt-6 max-w-md font-editorial text-lg italic leading-relaxed text-white/70 md:text-xl">
            {p.body}
          </p>
          <div className={`mt-8 flex ${p.side === "right" ? "justify-end" : "justify-start"}`}>
            <a href="/shop" data-cursor="View" className="group inline-flex items-center gap-3 border-b border-white/40 pb-2 font-mono text-[11px] uppercase tracking-[0.3em] text-white hover:border-white">
              Enter the story <span className="transition-transform group-hover:translate-x-1">→</span>
            </a>
          </div>
        </div>
      </motion.div>

      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-between px-6 font-mono text-[9px] uppercase tracking-[0.4em] text-white/40 md:px-10">
        <span>Frame · 0{i + 1}</span>
        <span>BXLACK / Campaign</span>
      </div>
    </div>
  );
}

export function Campaign() {
  return (
    <section className="relative bg-black">
      {PANELS.map((p, i) => (
        <Panel key={i} p={p} i={i} />
      ))}
    </section>
  );
}