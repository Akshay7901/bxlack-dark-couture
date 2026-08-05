import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import p3 from "@/assets/p3.jpg";
import p5 from "@/assets/p5.jpg";
import look1 from "@/assets/look1.jpg";

const CHAPTERS = [
  { n: "01", title: "The refusal", body: "A wardrobe drawn like a signature. Nothing borrowed, nothing loud, everything intentional.", img: p3 },
  { n: "02", title: "The silhouette", body: "Volume held against the body like architecture — heavy shoulders, cinched line, sharp exit.", img: p5 },
  { n: "03", title: "The exit", body: "Worn once in front of the wrong crowd. Photographed. Never restocked.", img: look1 },
];

function Chapter({ n, title, body, img, index }: typeof CHAPTERS[0] & { index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const clip = useTransform(scrollYProgress, [0.15, 0.6], ["inset(100% 0 0 0)", "inset(0% 0 0 0)"]);
  const numY = useTransform(scrollYProgress, [0, 1], ["25%", "-25%"]);
  const bodyY = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"]);
  const flip = index % 2 === 1;

  return (
    <div ref={ref} className={`relative grid min-h-[110vh] grid-cols-12 items-center gap-6 border-t border-white/10 px-6 py-24 md:px-10 ${flip ? "md:[direction:rtl]" : ""}`}>
      <div className="relative col-span-12 md:col-span-7 md:[direction:ltr]">
        <motion.p
          style={{ y: numY }}
          className="pointer-events-none select-none font-display text-[42vw] font-medium leading-[0.8] tracking-[-0.06em] text-outline md:text-[26vw]"
        >
          {n}
        </motion.p>
        <motion.div
          style={{ clipPath: clip, WebkitClipPath: clip as unknown as string }}
          className="absolute inset-0 overflow-hidden"
        >
          <img src={img} alt={title} className="h-full w-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-black/20 mix-blend-multiply" />
        </motion.div>
      </div>

      <motion.div style={{ y: bodyY }} className="col-span-12 md:col-span-5 md:[direction:ltr]">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/40">Chapter {n}</p>
        <h3 className="mt-4 font-display text-[11vw] leading-[0.9] tracking-[-0.03em] text-white sm:text-5xl md:text-7xl">
          {title.split(" ").slice(0, -1).join(" ")} <em className="font-editorial italic text-white/70">{title.split(" ").slice(-1)}</em>.
        </h3>
        <p className="mt-6 max-w-sm text-base leading-relaxed text-white/60">{body}</p>
        <div className="mt-8 h-px w-24 bg-white/30" />
      </motion.div>
    </div>
  );
}

export function Numerals() {
  return (
    <section className="relative overflow-hidden bg-[oklch(0.05_0_0)]">
      <div className="flex items-end justify-between px-6 pb-10 pt-32 md:px-10">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/40">Index — 005</p>
          <h2 className="mt-6 font-display text-[13vw] font-medium leading-[0.9] tracking-[-0.04em] text-white sm:text-6xl md:text-8xl">
            Read in <em className="font-editorial italic text-white/70">three acts.</em>
          </h2>
        </div>
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.4em] text-white/40 md:block">03 · Chapters</span>
      </div>
      {CHAPTERS.map((c, i) => (
        <Chapter key={c.n} index={i} {...c} />
      ))}
    </section>
  );
}