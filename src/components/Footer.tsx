import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Twitter } from "lucide-react";
import { Newsletter } from "@/components/Newsletter";
import logoAsset from "@/assets/bxlack-logo.png.asset.json";

const SHOP = [
  { label: "All Pieces", type: "All" as const },
  { label: "T-Shirt", type: "Tshirt" as const },
  { label: "Shirt", type: "Shirt" as const },
  { label: "Jeans", type: "Jeans" as const },
];

const SERVICES = [
  { label: "About Us", to: "/about" },
  { label: "Shipping", to: "/shipping" },
  { label: "Returns", to: "/returns" },
  { label: "FAQ", to: "/faq" },
  { label: "Contact", to: "/contact" },
];

const SOCIAL = [
  { label: "Instagram", href: "https://instagram.com", Icon: Instagram },
  { label: "Facebook", href: "https://facebook.com", Icon: Facebook },
  { label: "X", href: "https://x.com", Icon: Twitter },
];

const linkClass =
  "relative inline-block text-sm text-light-grey/80 transition-colors hover:text-white after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-white after:transition-transform after:duration-500 hover:after:scale-x-100";

export function Footer({ hideNewsletter }: { hideNewsletter?: boolean }) {
  return (
    <footer className="grain relative overflow-hidden border-t border-light-grey/10 bg-noir px-5 pb-10 pt-16 sm:px-6 md:px-10 md:pt-24">
      <div className="mx-auto max-w-[1600px]">
        {hideNewsletter ? null : <Newsletter />}

        <div className={`grid grid-cols-2 gap-10 border-t border-light-grey/10 pt-12 sm:grid-cols-2 lg:grid-cols-4 ${hideNewsletter ? "" : "mt-16 md:mt-24"}`}>
          <div className="col-span-2 sm:col-span-1">
            <img src={logoAsset.url} alt="BXLACK" className="h-10 w-auto object-contain" />
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
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-mid-grey/70">Client Services</p>
            <ul className="mt-5 space-y-3">
              {SERVICES.map((s) => (
                <li key={s.label}>
                  <Link to={s.to} className={linkClass}>
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-mid-grey/70">Follow</p>
            <ul className="mt-5 flex items-center gap-3">
              {SOCIAL.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    title={label}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-light-grey/20 text-light-grey/80 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/70 hover:text-white"
                  >
                    <Icon size={16} strokeWidth={1.5} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col justify-between gap-3 border-t border-light-grey/10 pt-6 font-mono text-[9px] uppercase tracking-[0.2em] text-mid-grey/70 sm:text-[10px] sm:tracking-[0.25em] md:flex-row md:gap-4">
          <span>© 2026 BXLACK Maison. All rights reserved.</span>
          <span className="flex gap-4">
            <Link to="/privacy" className="transition-colors hover:text-white">Privacy</Link>
            <Link to="/terms" className="transition-colors hover:text-white">Terms</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}