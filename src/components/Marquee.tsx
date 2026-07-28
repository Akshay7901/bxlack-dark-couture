export function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-white/10 bg-black py-6">
      <div className="flex animate-marquee whitespace-nowrap">
        {row.map((t, i) => (
          <span key={i} className="mx-8 flex items-center gap-8 font-display text-4xl font-medium uppercase tracking-[-0.02em] text-white md:text-6xl">
            {t}
            <span className="text-outline">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}