import { useState } from "react";

export function Footer() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <footer className="grain relative overflow-hidden border-t border-light-grey/10 bg-noir px-5 pb-10 pt-16 sm:px-6 md:px-10 md:pt-24">
      <div className="mx-auto max-w-[1600px]">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-mid-grey">Newsletter — 001</p>
          <h3 className="mt-6 font-display text-[13vw] leading-[0.9] text-white sm:text-6xl md:text-7xl">
            Enter the <em className="font-editorial italic text-light-grey">void.</em>
          </h3>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-light-grey/70">
            First access to drops, private lookbooks, and campaigns. No noise. Only signal.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (email.trim()) setSent(true);
            }}
            className="group mx-auto mt-10 flex w-full max-w-xl items-center gap-4 border-b border-light-grey/20 pb-3 transition-colors focus-within:border-white/70"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setSent(false);
              }}
              placeholder="your@email"
              className="min-w-0 flex-1 bg-transparent py-2 text-center font-sans text-base text-white placeholder:text-light-grey/40 focus:outline-none sm:text-left"
            />
            <button
              type="submit"
              className="relative shrink-0 font-mono text-[11px] uppercase tracking-[0.3em] text-white transition-opacity hover:opacity-70 after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-white after:transition-transform after:duration-500 hover:after:scale-x-100"
            >
              Subscribe →
            </button>
          </form>

          <p
            className={`mt-4 font-mono text-[10px] uppercase tracking-[0.3em] transition-opacity duration-500 ${
              sent ? "text-light-grey opacity-100" : "opacity-0"
            }`}
            aria-live="polite"
          >
            You are on the list.
          </p>
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