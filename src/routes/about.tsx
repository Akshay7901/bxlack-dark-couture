import { Fragment } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AppShell } from "@/components/AppShell";
import { SilkBackdrop } from "@/components/SilkBackdrop";
import hero from "@/assets/gate-model-back.webp";
import { seo } from "@/lib/seo";
import { loadPage } from "@/lib/pages/pages";
import { lines } from "@/lib/pages/content";

export const Route = createFileRoute("/about")({
  head: () =>
    seo({
      title: "About — BXLACK",
      description:
        "One colour, no limits. Discover the story, philosophy and design codes behind BXLACK, the luxury streetwear label born to stand apart.",
      path: "/about",
    }),
  // Copy is editable in Studio → Store → Pages; falls back to the default text.
  loader: () => loadPage("about"),
  component: AboutPage,
});

const labelClass = "font-mono text-[10px] uppercase tracking-[0.4em] text-white/40";

/** Renders a heading that may contain line breaks. */
function MultiLine({ text }: { text: string }) {
  return (
    <>
      {lines(text).map((l, i, all) => (
        <Fragment key={i}>
          {l}
          {i < all.length - 1 ? <br /> : null}
        </Fragment>
      ))}
    </>
  );
}

function AboutPage() {
  const page = Route.useLoaderData();
  const { hero: h, philosophy, story, codes, closing } = page;

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
          {h.eyebrow ? <p className={labelClass}>{h.eyebrow}</p> : null}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.7, 0, 0.2, 1] }}
            className="mt-6 max-w-5xl font-display text-6xl font-medium leading-[0.85] tracking-[-0.04em] md:text-[9vw]"
          >
            {h.title} {h.italic ? <em className="font-editorial italic text-white/70">{h.italic}</em> : null}
          </motion.h1>
          {h.tagline ? (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 1 }}
              className="mt-6 font-editorial text-lg italic text-white/50"
            >
              {h.tagline}
            </motion.p>
          ) : null}
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
            <p className={labelClass}>{philosophy.label}</p>
            <h2 className="mt-4 font-display text-4xl leading-[0.95] md:text-6xl">
              <MultiLine text={philosophy.title} />
            </h2>
          </div>
          <div className="max-w-2xl space-y-5 text-base leading-relaxed text-white/60 md:col-span-7 md:col-start-6">
            {philosophy.lead ? <p className="text-white/80">{philosophy.lead}</p> : null}
            {philosophy.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {philosophy.quote ? (
              <p className="border-l border-white/20 pl-5 font-editorial italic text-white/80">{philosophy.quote}</p>
            ) : null}
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
              <p className={labelClass}>{story.label}</p>
              <h2 className="mt-4 font-display text-4xl leading-[0.95] md:text-6xl">
                <MultiLine text={story.title} />
              </h2>
            </div>
            <div className="max-w-2xl space-y-5 text-base leading-relaxed text-white/60 md:col-span-7 md:col-start-6">
              {story.lead ? <p className="text-white/80">{story.lead}</p> : null}
              {story.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </motion.div>

          {story.quote ? (
            <motion.blockquote
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-15%" }}
              transition={{ duration: 1, ease: [0.7, 0, 0.2, 1] }}
              className="mx-auto mt-24 max-w-3xl text-center"
            >
              <p className="font-editorial text-3xl italic leading-tight text-white/85 md:text-4xl">{story.quote}</p>
              {story.cite ? <cite className={`mt-6 block not-italic ${labelClass}`}>{story.cite}</cite> : null}
            </motion.blockquote>
          ) : null}
        </div>
      </section>

      {/* 03 — The Codes */}
      <section className="relative z-10 mx-auto max-w-[1400px] px-6 py-28 md:px-10 md:py-36">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 1, ease: [0.7, 0, 0.2, 1] }}
        >
          <p className={labelClass}>{codes.label}</p>
          <h2 className="mt-4 max-w-2xl font-display text-4xl leading-[0.95] md:text-6xl">
            <MultiLine text={codes.title} />
          </h2>
          {codes.intro ? <p className="mt-6 max-w-xl text-base leading-relaxed text-white/60">{codes.intro}</p> : null}
        </motion.div>

        {codes.items.length ? (
          <div
            className={`mt-16 grid grid-cols-1 gap-px overflow-hidden border border-white/10 bg-white/10 ${
              codes.items.length >= 3 ? "md:grid-cols-3" : codes.items.length === 2 ? "md:grid-cols-2" : ""
            }`}
          >
            {codes.items.map((code, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ delay: i * 0.12, duration: 0.9, ease: [0.7, 0, 0.2, 1] }}
                className="bg-noir p-8 sm:p-10"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-4 font-display text-3xl uppercase tracking-[-0.01em]">{code.name}</h3>
                <p className="mt-1 font-editorial italic text-white/50">{code.line}</p>
                <p className="mt-5 text-sm leading-relaxed text-white/55">{code.body}</p>
                {code.attrs.length ? (
                  <dl className="mt-8 space-y-3 border-t border-white/10 pt-6">
                    {code.attrs.map((a, j) => (
                      <div key={j} className="flex items-baseline justify-between gap-4">
                        <dt className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">{a.k}</dt>
                        <dd className="text-right text-[13px] text-white/70">{a.v}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </motion.div>
            ))}
          </div>
        ) : null}
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
          {closing.statement}
        </motion.p>
        {closing.button ? (
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
              {closing.button}
            </Link>
          </motion.div>
        ) : null}
      </section>
    </AppShell>
  );
}
