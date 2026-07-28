import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import hero from "@/assets/hero.jpg";
import look1 from "@/assets/look1.jpg";
import look2 from "@/assets/look2.jpg";
import story from "@/assets/story.jpg";
import p2 from "@/assets/p2.jpg";

const FRAMES = [
  { img: hero, code: "F.01", caption: "Silhouette / Antwerp" },
  { img: look1, code: "F.02", caption: "Concrete / 04:12 AM" },
  { img: story, code: "F.03", caption: "Fabric study — wool 320g" },
  { img: p2, code: "F.04", caption: "Cut & drape" },
  { img: look2, code: "F.05", caption: "Fog / Untitled figure" },
];

export function FilmStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], ["4%", "-82%"]);
  const progress = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section ref={ref} className="relative h-[400vh] bg-black">
      <div className="sticky top-0 flex h-screen flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 font-mono text-[10px] uppercase tracking-[0.4em] text-white/50 md:px-10 md:pt-10">
          <span>Reel A / Campaign SS26</span>
          <span>16mm · Silent · No colour grade</span>
        </div>

        <motion.div style={{ x }} className="flex flex-1 items-center gap-6 pl-6 will-change-transform md:gap-10 md:pl-10">
          {FRAMES.map((f, i) => (
            <figure key={i} className="relative h-[70vh] w-[78vw] shrink-0 overflow-hidden bg-[oklch(0.08_0_0)] md:w-[62vw] lg:w-[52vw]">
              <img src={f.img} alt={f.caption} className="h-full w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
              <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6 md:p-8">
                <span className="font-editorial text-2xl italic text-white/90 md:text-3xl">{f.caption}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/60">{f.code}</span>
              </figcaption>
              <div className="absolute left-4 top-4 flex gap-1">
                <span className="h-2 w-2 rounded-full bg-white/80" />
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/70">Rec</span>
              </div>
            </figure>
          ))}
          <div className="flex h-[70vh] w-[70vw] shrink-0 items-center pl-6 md:w-[40vw]">
            <div>
              <p className="font-editorial text-5xl italic text-white/70">End<br/>of reel.</p>
              <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">Rewind — or fall forward</p>
            </div>
          </div>
        </motion.div>

        <div className="flex items-center gap-4 px-6 pb-6 md:px-10 md:pb-10">
          <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/40">Timecode</span>
          <div className="relative h-px flex-1 bg-white/10">
            <motion.div style={{ width: progress }} className="absolute inset-y-0 left-0 bg-white" />
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/60">05 / 05</span>
        </div>
      </div>
    </section>
  );
}