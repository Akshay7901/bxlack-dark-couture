import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import type { HomeLooks } from "@/lib/looks";
import { EASE_IN, EASE_OUT } from "@/lib/motion";

const num = (i: number) => String(i + 1).padStart(2, "0");

/**
 * "Try the Look": full-body looks standing side by side on a lit floor.
 * Hovering (or focusing) one brings it forward and dims the rest; clicking
 * opens a panel listing the pieces it's wearing. Phones scroll the lineup
 * sideways and open the panel as a bottom sheet.
 */
export function TryTheLook({ data }: { data: HomeLooks }) {
  const { looks } = data;
  const [hovered, setHovered] = useState<number | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const close = useCallback(() => {
    setOpen(null);
    triggerRef.current?.focus();
  }, []);

  return (
    <section aria-labelledby="try-the-look" className="bg-noir pb-8 pt-0 text-foreground sm:pb-10 md:pb-12">
      <div className="mx-auto mb-6 flex max-w-[1600px] flex-wrap items-end justify-between gap-x-6 gap-y-2 px-5 sm:mb-8 sm:px-6 md:mb-10 md:px-10">
        <h2 id="try-the-look" className="font-display text-2xl font-medium uppercase tracking-[0.12em] sm:text-3xl md:text-4xl">
          {data.heading}
        </h2>
        {data.subheading ? (
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-mid-grey/80">{data.subheading}</p>
        ) : null}
      </div>

      {/* The stage: a soft spotlight and a floor line the looks stand on. */}
      <div className="relative mx-auto max-w-[1600px] overflow-hidden">
        {/* Spotlight centred on the floor line (76px = labels + padding below the figures). */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 55% 45% at 50% calc(100% - 76px), rgba(255,255,255,0.09), transparent 70%)",
          }}
        />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[76px] h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        <ul
          className="relative flex snap-x snap-mandatory items-end gap-2 overflow-x-auto px-5 pb-4 pt-6 [scrollbar-width:none] sm:px-6 md:justify-center md:gap-4 md:overflow-visible md:px-10 [&::-webkit-scrollbar]:hidden"
          onMouseLeave={() => setHovered(null)}
        >
          {looks.map((look, i) => {
            const active = hovered === i;
            const dimmed = hovered !== null && !active;
            const label = look.name || `Look ${num(i)}`;
            return (
              <motion.li
                key={look.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.8, delay: i * 0.08, ease: EASE_OUT }}
                className="w-[44vw] shrink-0 snap-center sm:w-[30vw] md:w-auto md:min-w-0 md:max-w-[230px] md:flex-1"
              >
                <button
                  type="button"
                  onMouseEnter={() => setHovered(i)}
                  onFocus={() => setHovered(i)}
                  onBlur={() => setHovered(null)}
                  onClick={(e) => {
                    triggerRef.current = e.currentTarget;
                    setOpen(i);
                  }}
                  aria-haspopup="dialog"
                  aria-label={`${label}: see the ${look.products.length} ${look.products.length === 1 ? "piece" : "pieces"}`}
                  className={`group flex w-full flex-col items-center outline-none transition-[opacity,filter] duration-500 focus-visible:ring-1 focus-visible:ring-white/50 ${
                    dimmed ? "opacity-35 grayscale" : "opacity-100"
                  }`}
                >
                  <span className="relative block h-[min(110vw,58vh)] w-full md:h-[clamp(300px,58vh,600px)]">
                    <img
                      src={look.image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className={`h-full w-full object-contain object-bottom transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        active ? "-translate-y-1.5 scale-[1.04]" : ""
                      } motion-reduce:transform-none`}
                    />
                    {/* Shadow on the floor. */}
                    <span
                      aria-hidden
                      className={`absolute -bottom-1 left-1/2 h-3 w-2/3 -translate-x-1/2 rounded-[50%] bg-black blur-md transition-opacity duration-500 ${
                        active ? "opacity-90" : "opacity-60"
                      }`}
                    />
                  </span>
                  <span className="mt-5 flex h-10 w-full flex-col items-center justify-start font-mono text-[10px] uppercase tracking-[0.25em]">
                    <span className={`transition-colors duration-300 ${active ? "text-white" : "text-mid-grey/70"}`}>
                      {num(i)}
                    </span>
                    <span
                      className={`mt-1.5 max-w-full truncate leading-normal text-white transition-all duration-300 ${
                        active ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
                      } max-md:translate-y-0 max-md:opacity-70`}
                    >
                      {label}
                    </span>
                  </span>
                </button>
              </motion.li>
            );
          })}
        </ul>
      </div>

      <AnimatePresence>
        {open !== null && looks[open] ? (
          <LookPanel key={looks[open].id} index={open} look={looks[open]} onClose={close} />
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function LookPanel({
  index,
  look,
  onClose,
}: {
  index: number;
  look: HomeLooks["looks"][number];
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const total = look.products.reduce((sum, p) => sum + p.price, 0);
  const label = look.name || `Look ${num(index)}`;

  // Focus inside the panel, Escape closes, Tab stays inside, page doesn't scroll behind.
  useEffect(() => {
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Tab" && panelRef.current) {
        const items = panelRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-labelledby="look-panel-title">
      <motion.button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.3 } }}
        exit={{ opacity: 0, transition: { duration: 0.2 } }}
        className="absolute inset-0 h-full w-full cursor-default bg-black/60 backdrop-blur-[2px]"
      />
      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0, transition: { duration: 0.5, ease: EASE_OUT } }}
        exit={{ opacity: 0, x: 30, transition: { duration: 0.25, ease: EASE_IN } }}
        className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col border-t border-light-grey/15 bg-noir text-foreground md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[440px] md:border-l md:border-t-0"
      >
        <div className="flex items-start justify-between gap-4 border-b border-light-grey/10 px-6 py-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-mid-grey/70">Look {num(index)}</p>
            <h3 id="look-panel-title" className="mt-1.5 font-display text-xl uppercase tracking-[0.08em]">
              {label}
            </h3>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 flex h-10 w-10 items-center justify-center text-white/70 transition-colors hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 gap-5 overflow-y-auto px-6 py-6">
          <img
            src={look.image}
            alt=""
            className="hidden h-[260px] w-[110px] shrink-0 object-contain object-top md:block"
          />
          <ul className="min-w-0 flex-1 space-y-4">
            {look.products.map((p, i) => (
              <motion.li
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.15 + i * 0.06, duration: 0.45, ease: EASE_OUT } }}
              >
                <Link
                  to="/product/$id"
                  params={{ id: p.id }}
                  onClick={onClose}
                  className="group flex items-center gap-4 border border-light-grey/10 p-2.5 transition-colors hover:border-white/40"
                >
                  <span className="block h-[84px] w-[68px] shrink-0 overflow-hidden bg-white/[0.03]">
                    {p.image ? <img src={p.image} alt="" className="h-full w-full object-cover" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] text-white">{p.name}</span>
                    <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-mid-grey/70">
                      {p.category}
                    </span>
                    <span className="mt-1.5 block font-mono text-[13px] text-white">₹{p.price}</span>
                  </span>
                  <ArrowRight
                    size={15}
                    className="shrink-0 text-white/40 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white"
                  />
                </Link>
              </motion.li>
            ))}
          </ul>
        </div>

        {look.products.length > 1 ? (
          <div className="flex items-center justify-between border-t border-light-grey/10 px-6 py-4 font-mono text-[11px] uppercase tracking-[0.25em]">
            <span className="text-mid-grey/80">Complete look</span>
            <span className="text-white">₹{total}</span>
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}
