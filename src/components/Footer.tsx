import { Newsletter } from "@/components/Newsletter";

export function Footer() {
  return (
    <footer className="grain relative overflow-hidden border-t border-light-grey/10 bg-noir px-5 pb-10 pt-16 sm:px-6 md:px-10 md:pt-24">
      <div className="mx-auto max-w-[1600px]">
        <Newsletter />

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