const STATS = [
  { value: "170,000+", label: "Satisfied clients" },
  { value: "9,820+", label: "Cities reached" },
  { value: "12 Hours", label: "Ships within" },
];

export function TrustBar() {
  return (
    <section className="border-y border-light-grey/10 bg-charcoal/40">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 divide-y divide-light-grey/10 px-5 sm:px-6 md:grid-cols-3 md:divide-x md:divide-y-0 md:px-10">
        {STATS.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-2 py-8 md:py-12">
            <p className="font-display text-3xl uppercase tracking-[-0.03em] text-foreground md:text-4xl">{s.value}</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-foreground/45">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}