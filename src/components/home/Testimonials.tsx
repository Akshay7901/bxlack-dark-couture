const QUOTES = [
  { q: "The cut sits like it was drafted on me. Nothing else in my wardrobe comes close.", a: "A. Mehra — Mumbai" },
  { q: "Packaging, fabric, finish — it reads couture, not streetwear.", a: "L. Novák — Berlin" },
  { q: "Numbered, unrepeatable, and never restocked. That's the whole point.", a: "K. Tanaka — Tokyo" },
];

export function Testimonials() {
  return (
    <section className="bg-noir py-16 md:py-28">
      <div className="mx-auto max-w-[1600px] px-5 sm:px-6 md:px-10">
        <h2 className="mb-10 text-center font-display text-2xl font-medium uppercase tracking-[0.05em] text-foreground sm:text-3xl md:mb-16 md:text-4xl">
          What our fellows say
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {QUOTES.map((t) => (
            <figure key={t.a} className="border border-light-grey/10 bg-card/40 p-7 md:p-9">
              <div className="font-mono text-[10px] tracking-[0.4em] text-foreground/50">★★★★★</div>
              <blockquote className="mt-5 font-editorial text-lg italic leading-relaxed text-foreground/80 md:text-xl">
                “{t.q}”
              </blockquote>
              <figcaption className="mt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/45">
                {t.a}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}