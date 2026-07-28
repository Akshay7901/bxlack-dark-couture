import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import story from "@/assets/story.jpg";
import look2 from "@/assets/look2.jpg";

export function Story() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y1 = useTransform(scrollYProgress, [0, 1], ["-10%", "20%"]);
  const y2 = useTransform(scrollYProgress, [0, 1], ["20%", "-20%"]);

  return (
    <section id="story" ref={ref} className="relative overflow-hidden bg-[oklch(0.05_0_0)]">
      {/* Section 1 — huge typography with parallax bg */}
      <div className="relative flex min-h-[120vh] items-center justify-center px-6 py-40">
        <motion.img
          style={{ y: y1 }}
          src={story}
          alt="Fabric close-up"
          className="absolute inset-0 h-full w-full object-cover opacity-30"
          loading="lazy"
          width={1600}
          height={1000}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        <motion.h2
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-20%" }}
          transition={{ duration: 1.4, ease: [0.7, 0, 0.2, 1] }}
          className="relative z-10 max-w-6xl text-center font-display text-[16vw] font-medium uppercase leading-[0.85] tracking-[-0.05em] text-white md:text-[10vw]"
        >
          Every <em className="font-editorial italic text-white/60">thread</em><br />
          has a<br />
          <span className="text-outline">purpose.</span>
        </motion.h2>
      </div>

      {/* Section 2 — split layout */}
      <div className="grid grid-cols-1 gap-0 md:grid-cols-2 md:min-h-screen">
        <div className="relative overflow-hidden">
          <motion.img
            style={{ y: y2 }}
            src={look2}
            alt="Model"
            className="h-full min-h-[60vh] w-full object-cover"
            loading="lazy"
            width={1400}
            height={1750}
          />
        </div>
        <div className="flex flex-col justify-center gap-8 border-l border-white/10 bg-[oklch(0.07_0_0)] p-10 md:p-20">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/50"
          >
            Manifesto — 002
          </motion.p>
          <motion.h3
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.7, 0, 0.2, 1] }}
            className="font-display text-4xl leading-[0.95] tracking-[-0.03em] text-white md:text-6xl"
          >
            Our pieces are built for people who <em className="font-editorial italic text-white/70">refuse</em> to blend in.
          </motion.h3>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 1 }}
            className="max-w-md text-base leading-relaxed text-white/60"
          >
            Cut by hand in Antwerp. Finished in Tokyo. Every seam is a decision, every silhouette a refusal. We build one garment at a time — never fast, never quiet, never the same.
          </motion.p>
          <div className="mt-4 flex items-center gap-6 font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
            <span>· 100% Deadstock</span>
            <span>· Small Batch</span>
            <span>· Numbered</span>
          </div>
        </div>
      </div>
    </section>
  );
}