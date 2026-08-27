import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AppShell } from "@/components/AppShell";
import { SilkBackdrop } from "@/components/SilkBackdrop";
import hero from "@/assets/gate-model-back.png";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — BXLACK" },
      { name: "description", content: "One colour, no limits. The philosophy, story and codes behind BXLACK." },
      { property: "og:title", content: "About — BXLACK" },
      { property: "og:description", content: "One colour, no limits. The philosophy, story and codes behind BXLACK." },
    ],
  }),
  component: AboutPage,
});

const codes = [
  {
    n: "01",
    name: "Street",
    line: "The urban register.",
    body: "Built for everyday use in city environments. Proportions are generous, construction is honest, hardware is matte. Nothing is decorative — every detail is there because it needs to be.",
    attrs: [
      ["Proportion", "Generous, deliberate"],
      ["Hardware", "Matte black"],
      ["Feel", "Heavy, considered"],
      ["Reference", "Urban architecture"],
    ],
  },
  {
    n: "02",
    name: "Active",
    line: "The technical register.",
    body: "Follows the logic of performance: clean lines, functional closures, minimal weight, materials built to work under pressure. Every element earns its place.",
    attrs: [
      ["Line", "Technical, clean"],
      ["Closures", "Functional"],
      ["Material", "Performance grade"],
      ["Weight", "Minimal"],
    ],
  },
  {
    n: "03",
    name: "Alpine",
    line: "The severe register.",
    body: "The language of extreme environments — stripped back, built for conditions, no margin for error. It looks like it was made where there are no second chances.",
    attrs: [
      ["Form", "Stripped to function"],
      ["Seams", "Welded or taped"],
      ["Hardware", "Zero excess"],
      ["Reference", "Mountain engineering"],
    ],
  },
] as const;

const labelClass = "font-mono text-[10px] uppercase tracking-[0.4em] text-white/40";

function AboutPage() {
  return (
    <AppShell hideNewsletter>
      <SilkBackdrop />

      {/* Hero */}
      <section className="relative flex min-h-[90vh] items-end overflow-hidden pt-28 md:pt-40">
        <img
          src={hero}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[30%_35%] opacity-40"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black" />
        <div className="relative z-10 mx-auto max-w-[1600px] px-6 pb-20 md:px-10">
          <p className={labelClass}>Est. 2019 · Antwerp</p>
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.7, 0, 0.2, 1] }}
            className="mt-6 max-w-5xl font-display text-6xl font-medium leading-[0.85] tracking-[-0.04em] md:text-[9vw]"
          >
            A house built on <em className="font-editorial italic text-white/70">shadow.</em>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="mt-6 font-editorial text-lg italic text-white/50"
          >
            The point where everything happens.
          </motion.p>
        </div>
      </section>

      {/* 01 — Philosophy */}
      <section className="relative z-10 mx-auto max-w-[1400px] px-6 py-28 md:px-10 md:py-36">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 1, ease: [0.7, 0, 0.2, 1] }}
          className="grid grid-cols-1 gap-10 md:grid-cols-12"
        >
          <div className="md:col-span-4">
            <p className={labelClass}>01 — Philosophy</p>
            <h2 className="mt-4 font-display text-4xl leading-[0.95] md:text-6xl">
              One colour.
              <br />
              No limits.
            </h2>
          </div>
          <div className="max-w-2xl space-y-5 text-base leading-relaxed text-white/60 md:col-span-7 md:col-start-6">
            <p className="text-white/80">
              Working in black does not restrict what we can make. It does the opposite.
            </p>
            <p>
              When every product shares the same colour, the catalogue becomes infinite. A
              jacket, a bag, a boot, an accessory — they all belong together. You never have to
              ask whether something fits the brand. If it is built properly and it is black, it
              is BXLACK.
            </p>
            <p>
              Colour forces decisions: which season, which market, which customer. Black removes
              those questions. The product stands on its construction, its materials, its
              function. There is nothing else to look at.
            </p>
            <p className="border-l border-white/20 pl-5 font-editorial italic text-white/80">
              The single-colour rule is not a limitation. It is what makes expansion possible.
            </p>
          </div>
        </motion.div>
      </section>

      {/* 02 — Story */}
      <section className="relative z-10 border-t border-white/10 bg-white/[0.015]">
        <div className="mx-auto max-w-[1400px] px-6 py-28 md:px-10 md:py-36">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 1, ease: [0.7, 0, 0.2, 1] }}
            className="grid grid-cols-1 gap-10 md:grid-cols-12"
          >
            <div className="md:col-span-4">
              <p className={labelClass}>02 — Story</p>
              <h2 className="mt-4 font-display text-4xl leading-[0.95] md:text-6xl">
                Every piece
                <br />
                has a story.
              </h2>
            </div>
            <div className="max-w-2xl space-y-5 text-base leading-relaxed text-white/60 md:col-span-7 md:col-start-6">
              <p className="text-white/80">
                Design without story is product. Design with story is brand.
              </p>
              <p>
                Every garment we release carries a reason for existing — not a trend, not a
                season, not a mood board. A story: where it was built, what problem it solves,
                who it was made for, what it means to own it.
              </p>
              <p>
                That story is what connects you to the product. Not the colour, not the logo, not
                the marketing. The story behind the thing.
              </p>
            </div>
          </motion.div>

          <motion.blockquote
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 1, ease: [0.7, 0, 0.2, 1] }}
            className="mx-auto mt-24 max-w-3xl text-center"
          >
            <p className="font-editorial text-3xl italic leading-tight text-white/85 md:text-4xl">
              "Every piece has a story. The story builds the connection."
            </p>
            <cite className={`mt-6 block not-italic ${labelClass}`}>BXLACK Brand Philosophy</cite>
          </motion.blockquote>
        </div>
      </section>

      {/* 03 — The Three Codes */}
      <section className="relative z-10 mx-auto max-w-[1400px] px-6 py-28 md:px-10 md:py-36">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 1, ease: [0.7, 0, 0.2, 1] }}
        >
          <p className={labelClass}>03 — The Codes</p>
          <h2 className="mt-4 max-w-2xl font-display text-4xl leading-[0.95] md:text-6xl">
            Three moods.
            <br />
            Any product.
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/60">
            The codes are not product lines. They are aesthetic registers. Any BXLACK piece can
            draw from any code.
          </p>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden border border-white/10 bg-white/10 md:grid-cols-3">
          {codes.map((code, i) => (
            <motion.div
              key={code.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ delay: i * 0.12, duration: 0.9, ease: [0.7, 0, 0.2, 1] }}
              className="bg-noir p-8 sm:p-10"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">
                {code.n}
              </p>
              <h3 className="mt-4 font-display text-3xl uppercase tracking-[-0.01em]">
                {code.name}
              </h3>
              <p className="mt-1 font-editorial italic text-white/50">{code.line}</p>
              <p className="mt-5 text-sm leading-relaxed text-white/55">{code.body}</p>
              <dl className="mt-8 space-y-3 border-t border-white/10 pt-6">
                {code.attrs.map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-4">
                    <dt className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">
                      {k}
                    </dt>
                    <dd className="text-right text-[13px] text-white/70">{v}</dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Closing statement */}
      <section className="relative z-10 mx-auto max-w-[1000px] px-6 py-28 text-center md:px-10 md:py-36">
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 1, ease: [0.7, 0, 0.2, 1] }}
          className="font-display text-4xl leading-[0.95] tracking-[-0.02em] md:text-6xl"
        >
          Every piece has a story.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 1 }}
        >
          <Link
            to="/shop"
            search={{ type: "All" }}
            className="mt-10 inline-block border border-white px-8 py-3.5 font-mono text-[11px] uppercase tracking-[0.32em] text-white transition-colors hover:bg-white hover:text-black"
          >
            Shop the collection
          </Link>
        </motion.div>
      </section>
    </AppShell>
  );
}
