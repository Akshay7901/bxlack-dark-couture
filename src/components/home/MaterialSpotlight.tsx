import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import story from "@/assets/story.jpg";
import p3 from "@/assets/p3.jpg";
import p5 from "@/assets/p5.jpg";
import look2 from "@/assets/look2.jpg";

const materials = [
  {
    id: "m1",
    index: "01",
    name: "Bonded Jersey",
    origin: "Osaka, JP",
    weight: "320 gsm",
    img: story,
    body: "Double-knit cotton bonded under heat until it holds its own architecture. Cut heavy, worn heavier — the drape stays where you leave it.",
  },
  {
    id: "m2",
    index: "02",
    name: "Dry Selvedge",
    origin: "Okayama, JP",
    weight: "14.5 oz",
    img: p3,
    body: "Unwashed, unsanforised, woven on shuttle looms at a crawl. It fades to a map of the body that wears it and nothing else.",
  },
  {
    id: "m3",
    index: "03",
    name: "Waxed Poplin",
    origin: "Antwerp, BE",
    weight: "210 gsm",
    img: p5,
    body: "Long-staple poplin passed through a cold wax bath. Matte in daylight, liquid under flash — a surface built for the camera.",
  },
  {
    id: "m4",
    index: "04",
    name: "Ghost Mohair",
    origin: "Biella, IT",
    weight: "480 gsm",
    img: look2,
    body: "Brushed until the halo lifts, then brushed once more. Weightless volume that reads like fog under a single hard light.",
  },
];

export function MaterialSpotlight() {
  const [open, setOpen] = useState(0);

  return (
    <section className="relative overflow-hidden border-y border-light-grey/10 bg-noir">
      <div className="mx-auto max-w-[1600px] px-5 pb-10 pt-16 sm:px-6 md:px-10 md:pb-16 md:pt-28">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-mid-grey">Material spotlight — 005</p>
            <h2 className="mt-5 font-display text-[11vw] font-medium uppercase leading-[0.9] tracking-[-0.04em] text-foreground sm:text-5xl md:text-7xl">
              What it&apos;s <em className="font-editorial italic text-foreground/55">made of.</em>
            </h2>
          </div>
          <p className="max-w-xs font-sans text-xs leading-relaxed text-foreground/45 md:text-sm">
            Four fabrics, four ateliers. Open a card to read the spec — hover to let the fibre surface.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-5 pb-16 sm:px-6 md:px-10 md:pb-28">
        <div className="border-t border-light-grey/10">
          {materials.map((m, i) => (
            <MaterialRow key={m.id} m={m} isOpen={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
          ))}
        </div>
      </div>
    </section>
  );
}

function MaterialRow({
  m,
  isOpen,
  onToggle,
}: {
  m: (typeof materials)[number];
  isOpen: boolean;
  onToggle: () => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const titleRef = useRef<HTMLParagraphElement>(null);

  // expand / collapse
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.to(el, {
        height: isOpen ? el.scrollHeight : 0,
        opacity: isOpen ? 1 : 0,
        duration: 0.75,
        ease: "power3.inOut",
      });
    });
    return () => ctx.revert();
  }, [isOpen]);

  // hover reveal
  useEffect(() => {
    const row = rowRef.current;
    const reveal = revealRef.current;
    if (!row || !reveal) return;

    const ctx = gsap.context(() => {
      const setX = gsap.quickTo(reveal, "x", { duration: 0.5, ease: "power3.out" });
      const setY = gsap.quickTo(reveal, "y", { duration: 0.5, ease: "power3.out" });
      gsap.set(reveal, { autoAlpha: 0, scale: 0.85, xPercent: -50, yPercent: -50 });

      const enter = () => {
        gsap.to(reveal, { autoAlpha: 1, scale: 1, duration: 0.5, ease: "power3.out" });
        gsap.to(imgRef.current, { scale: 1.08, duration: 1.4, ease: "power3.out" });
        gsap.to(titleRef.current, { x: 14, duration: 0.6, ease: "power3.out" });
      };
      const leave = () => {
        gsap.to(reveal, { autoAlpha: 0, scale: 0.85, duration: 0.45, ease: "power2.inOut" });
        gsap.to(imgRef.current, { scale: 1, duration: 0.9, ease: "power3.out" });
        gsap.to(titleRef.current, { x: 0, duration: 0.6, ease: "power3.out" });
      };
      const move = (e: MouseEvent) => {
        const r = row.getBoundingClientRect();
        setX(e.clientX - r.left);
        setY(e.clientY - r.top);
      };

      row.addEventListener("mouseenter", enter);
      row.addEventListener("mouseleave", leave);
      row.addEventListener("mousemove", move);
      return () => {
        row.removeEventListener("mouseenter", enter);
        row.removeEventListener("mouseleave", leave);
        row.removeEventListener("mousemove", move);
      };
    }, row);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={rowRef} className="relative border-b border-light-grey/10">
      {/* cursor-following fabric reveal */}
      <div
        ref={revealRef}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 z-20 hidden h-[220px] w-[170px] overflow-hidden opacity-0 md:block"
      >
        <img ref={imgRef} src={m.img} alt="" className="h-full w-full object-cover grayscale" loading="lazy" />
        <span className="absolute inset-0 bg-noir/20" />
        <span className="absolute bottom-2 left-2 font-mono text-[9px] uppercase tracking-[0.3em] text-foreground/80">
          {m.weight}
        </span>
      </div>

      <button
        type="button"
        onClick={onToggle}
        data-cursor={isOpen ? "Close" : "Open"}
        aria-expanded={isOpen}
        className="group flex w-full items-baseline gap-4 py-7 text-left md:gap-10 md:py-10"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/35">{m.index}</span>
        <p
          ref={titleRef}
          className="min-w-0 flex-1 truncate font-display text-3xl uppercase leading-none tracking-[-0.03em] text-foreground md:text-6xl"
        >
          {m.name}
        </p>
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/40 md:inline">
          {m.origin}
        </span>
        <span
          className={`font-mono text-lg leading-none text-foreground/60 transition-transform duration-500 ease-[cubic-bezier(0.7,0,0.2,1)] ${
            isOpen ? "rotate-45" : ""
          }`}
        >
          +
        </span>
      </button>

      <div ref={panelRef} style={{ height: 0, opacity: 0 }} className="overflow-hidden">
        <div className="grid grid-cols-1 gap-6 pb-10 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-4">
            <div className="aspect-[4/5] overflow-hidden bg-charcoal">
              <img src={m.img} alt={m.name} className="h-full w-full object-cover" loading="lazy" />
            </div>
          </div>
          <div className="flex flex-col justify-between gap-6 md:col-span-6 md:col-start-6">
            <p className="max-w-xl font-sans text-sm leading-relaxed text-foreground/60 md:text-base">{m.body}</p>
            <dl className="grid grid-cols-2 gap-4 font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/40 sm:grid-cols-3">
              <div>
                <dt className="text-foreground/30">Origin</dt>
                <dd className="mt-2 text-foreground/70">{m.origin}</dd>
              </div>
              <div>
                <dt className="text-foreground/30">Weight</dt>
                <dd className="mt-2 text-foreground/70">{m.weight}</dd>
              </div>
              <div>
                <dt className="text-foreground/30">Batch</dt>
                <dd className="mt-2 text-foreground/70">Fifty units</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}