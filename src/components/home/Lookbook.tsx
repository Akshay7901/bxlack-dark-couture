import { motion } from "framer-motion";
import look1 from "@/assets/look1.jpg";
import look2 from "@/assets/look2.jpg";
import hero from "@/assets/hero.jpg";

const shots = [
  { img: look1, title: "The Concrete Chapter", n: "01" },
  { img: hero, title: "After Midnight", n: "02" },
  { img: look2, title: "Fog & Fur", n: "03" },
];

export function Lookbook() {
  return (
    <section className="relative overflow-hidden bg-black py-32">
      <div className="mx-auto max-w-[1600px] px-6 md:px-10">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/50">Lookbook — 004</p>
            <h2 className="mt-6 font-display text-6xl font-medium leading-[0.9] tracking-[-0.04em] md:text-8xl">
              Editorial <em className="font-editorial italic text-white/70">motion.</em>
            </h2>
          </div>
        </div>
      </div>

      <div className="mt-16 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-6 px-6 md:px-10" style={{ width: "max-content" }}>
          {shots.map((s, i) => (
            <motion.figure
              key={i}
              initial={{ opacity: 0, y: 80 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-20%" }}
              transition={{ delay: i * 0.1, duration: 1, ease: [0.7, 0, 0.2, 1] }}
              className="relative w-[85vw] shrink-0 md:w-[70vw] lg:w-[900px]"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-[oklch(0.08_0_0)]">
                <img src={s.img} alt={s.title} className="h-full w-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-8">
                  <p className="font-display text-4xl leading-none text-white md:text-6xl">{s.title}</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/70">{s.n} / 03</p>
                </div>
              </div>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}