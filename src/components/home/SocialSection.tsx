import { motion } from "framer-motion";
import { Instagram } from "lucide-react";
import look1 from "@/assets/look1.jpg";
import look2 from "@/assets/look2.jpg";
import story from "@/assets/story.jpg";
import hero from "@/assets/hero.jpg";
import p1 from "@/assets/p1.jpg";
import p4 from "@/assets/p4.jpg";

const feed = [look1, story, hero, look2, p1, p4];

export function SocialSection() {
  return (
    <section className="bg-noir py-16 sm:py-24 md:py-32">
      <div className="mx-auto max-w-[1600px] px-5 sm:px-6 md:px-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/50">Community</p>
            <h2 className="mt-5 font-display text-[12vw] font-medium leading-[0.9] tracking-[-0.04em] text-white sm:text-5xl md:text-7xl">
              Worn <em className="font-editorial italic text-white/70">in the wild.</em>
            </h2>
          </div>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            data-cursor="Follow"
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-white/60 hover:text-white"
          >
            <Instagram className="h-4 w-4" /> @bxlack
          </a>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-2 sm:gap-3 md:mt-14 md:grid-cols-6">
          {feed.map((src, i) => (
            <motion.a
              key={i}
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              data-cursor="View"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ delay: i * 0.06, duration: 0.7, ease: [0.7, 0, 0.2, 1] }}
              className="group relative aspect-square overflow-hidden rounded-sm bg-card"
            >
              <img
                src={src}
                alt="BXLACK community post"
                loading="lazy"
                className="h-full w-full object-cover opacity-80 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100"
              />
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <Instagram className="h-5 w-5 text-white" />
              </span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
