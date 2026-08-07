import { Link } from "@tanstack/react-router";
import story from "@/assets/story.jpg";
import look1 from "@/assets/look1.jpg";
import look2 from "@/assets/look2.jpg";

const PILLARS = [
  { label: "About us", to: "/about", img: story },
  { label: "Our journey", to: "/journal", img: look1 },
  { label: "Lookbook", to: "/lookbook", img: look2 },
] as const;

export function BrandPillars() {
  return (
    <section className="border-t border-light-grey/10 bg-charcoal/30 py-16 md:py-24">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-5 px-5 sm:grid-cols-3 sm:px-6 md:gap-8 md:px-10">
        {PILLARS.map((p) => (
          <Link key={p.label} to={p.to} data-cursor="Read" className="group relative block overflow-hidden">
            <div className="aspect-[4/5] overflow-hidden bg-card sm:aspect-[3/4]">
              <img
                src={p.img}
                alt={p.label}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.7,0,0.2,1)] group-hover:scale-105"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-noir/85 to-transparent" />
            <p className="absolute bottom-6 left-6 font-mono text-[11px] uppercase tracking-[0.35em] text-foreground">
              {p.label} →
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}