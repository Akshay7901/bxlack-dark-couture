import { Link } from "@tanstack/react-router";
import { Newsletter } from "@/components/Newsletter";

const SHOP = [
  { label: "All Pieces", type: "All" as const },
  { label: "T-Shirt", type: "Tshirt" as const },
  { label: "Shirt", type: "Shirt" as const },
  { label: "Jeans", type: "Jeans" as const },
];

const MAISON = [
  { label: "About", to: "/about" },
  { label: "Journal", to: "/journal" },
  { label: "Lookbook", to: "/lookbook" },
  { label: "New Drop", to: "/new-drop" },
];

const SOCIAL = [
  { label: "Instagram", href: "https://instagram.com" },
  { label: "TikTok", href: "https://tiktok.com" },
  { label: "Vimeo", href: "https://vimeo.com" },
];

const linkClass =
  "relative inline-block text-sm text-light-grey/80 transition-colors hover:text-white after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-white after:transition-transform after:duration-500 hover:after:scale-x-100";

export function Footer() {
  return (
    <footer className="grain relative overflow-hidden border-t border-light-grey/10 bg-noir px-5 pb-10 pt-16 sm:px-6 md:px-10 md:pt-24">
      <div className="mx-auto max-w-[1600px]">
        <Newsletter />

        <div className="mt-16 grid grid-cols-2 gap-10 border-t border-light-grey/10 pt-12 sm:grid-cols-4 md:mt-24">
          <div className="col-span-2 sm:col-span-1">
            <p className="font-display text-2xl leading-none text-white">BXLACK</p>
            <p className="mt-4 max-w-[22ch] text-sm leading-relaxed text-light-grey/60">
              Born to stand apart. Designed in Antwerp, made in limited runs.
            </p>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-mid-grey/70">Shop</p>
            <ul className="mt-5 space-y-3">
              {SHOP.map((s) => (
                <li key={s.label}>
                  <Link to="/shop" search={{ type: s.type }} className={linkClass}>
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-mid-grey/70">Maison</p>
            <ul className="mt-5 space-y-3">
              {MAISON.map((m) => (
                <li key={m.label}>
                  <Link to={m.to} className={linkClass}>
                    {m.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-mid-grey/70">Follow</p>
            <ul className="mt-5 space-y-3">
              {SOCIAL.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noreferrer" className={linkClass}>
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 select-none md:mt-24">
          <p className="font-display text-[18vw] font-medium leading-[0.8] tracking-[-0.05em] text-white/[0.06]">BXLACK</p>
        </div>

        <div className="mt-10 flex flex-col justify-between gap-3 border-t border-light-grey/10 pt-6 font-mono text-[9px] uppercase tracking-[0.2em] text-mid-grey/70 sm:text-[10px] sm:tracking-[0.25em] md:flex-row md:gap-4">
          <span>© 2026 BXLACK Maison. All rights reserved.</span>
          <span>Antwerp · Tokyo · Paris</span>
          <span>Instagram — TikTok — Vimeo</span>
        </div>
      </div>
    </footer>
  );
}