import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="grain relative overflow-hidden border-t border-white/10 bg-[oklch(0.06_0_0)] px-6 pb-10 pt-24 md:px-10">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex flex-col gap-16 md:flex-row md:justify-between">
          <div className="max-w-md">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/50">Newsletter — 001</p>
            <h3 className="mt-6 font-display text-4xl leading-[0.95] text-white md:text-6xl">
              Enter the <em className="font-editorial italic text-white/70">void.</em>
            </h3>
            <p className="mt-4 max-w-sm text-sm text-white/60">
              First access to drops, private lookbooks, and campaigns. No noise. Only signal.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="mt-8 flex items-center border-b border-white/20 pb-2">
              <input
                type="email"
                placeholder="your@email"
                className="flex-1 bg-transparent py-2 font-sans text-sm text-white placeholder:text-white/30 focus:outline-none"
              />
              <button className="font-mono text-[11px] uppercase tracking-[0.3em] text-white hover:text-white/60">
                Subscribe →
              </button>
            </form>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {[
              { t: "Shop", l: ["New", "Outerwear", "Knitwear", "Accessories"] },
              { t: "Universe", l: ["Lookbook", "Journal", "Campaigns", "Ateliers"] },
              { t: "Contact", l: ["Concierge", "Shipping", "Returns", "Press"] },
            ].map((c) => (
              <div key={c.t}>
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">{c.t}</p>
                <ul className="mt-5 space-y-3">
                  {c.l.map((i) => (
                    <li key={i}>
                      <Link to="/shop" className="text-sm text-white/80 transition-colors hover:text-white">{i}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-24 select-none">
          <p className="font-display text-[18vw] font-medium leading-[0.8] tracking-[-0.05em] text-white/[0.06]">BXLACK</p>
        </div>

        <div className="mt-10 flex flex-col justify-between gap-4 border-t border-white/10 pt-6 font-mono text-[10px] uppercase tracking-[0.25em] text-white/40 md:flex-row">
          <span>© 2026 BXLACK Maison. All rights reserved.</span>
          <span>Antwerp · Tokyo · Paris</span>
          <span>Instagram — TikTok — Vimeo</span>
        </div>
      </div>
    </footer>
  );
}