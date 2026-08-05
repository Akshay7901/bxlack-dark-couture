import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="grain relative overflow-hidden border-t border-light-grey/10 bg-noir px-5 pb-10 pt-16 sm:px-6 md:px-10 md:pt-24">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex flex-col gap-12 md:flex-row md:justify-between md:gap-16">
          <div className="max-w-md">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-mid-grey">Newsletter — 001</p>
            <h3 className="mt-5 font-display text-3xl leading-[0.95] text-white sm:text-4xl md:text-6xl">
              Enter the <em className="font-editorial italic text-light-grey">void.</em>
            </h3>
            <p className="mt-4 max-w-sm text-sm text-light-grey/70">
              First access to drops, private lookbooks, and campaigns. No noise. Only signal.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="mt-8 flex items-center border-b border-light-grey/20 pb-2">
              <input
                type="email"
                placeholder="your@email"
                className="flex-1 bg-transparent py-2 font-sans text-sm text-white placeholder:text-light-grey/40 focus:outline-none"
              />
              <button className="font-mono text-[11px] uppercase tracking-[0.3em] text-white hover:text-light-grey">
                Subscribe →
              </button>
            </form>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 sm:gap-10">
            {[
              { t: "Shop", l: ["New", "Outerwear", "Knitwear", "Accessories"] },
              { t: "Universe", l: ["Lookbook", "Journal", "Campaigns", "Ateliers"] },
              { t: "Contact", l: ["Concierge", "Shipping", "Returns", "Press"] },
            ].map((c) => (
              <div key={c.t}>
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-mid-grey/70">{c.t}</p>
                <ul className="mt-5 space-y-3">
                  {c.l.map((i) => (
                    <li key={i}>
                      <Link to="/shop" search={{ type: "All" }} className="text-sm text-light-grey/90 transition-colors hover:text-white">{i}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
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