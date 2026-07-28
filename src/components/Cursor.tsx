import { useEffect, useRef, useState } from "react";

export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx, ry = my;
    let raf = 0;

    const move = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      if (dot.current) {
        dot.current.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
      }
      const t = e.target as HTMLElement | null;
      const el = t?.closest("[data-cursor]") as HTMLElement | null;
      setLabel(el?.dataset.cursor || null);
      setHover(!!(t && t.closest("a, button, [data-hover]")));
    };

    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      if (ring.current) {
        ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    window.addEventListener("mousemove", move);
    return () => {
      window.removeEventListener("mousemove", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div
        ref={dot}
        className="pointer-events-none fixed left-0 top-0 z-[9999] hidden h-1.5 w-1.5 rounded-full bg-white mix-blend-difference md:block"
      />
      <div
        ref={ring}
        className={`pointer-events-none fixed left-0 top-0 z-[9998] hidden items-center justify-center rounded-full border border-white/70 mix-blend-difference transition-[width,height,background-color] duration-300 md:flex ${
          label ? "h-16 w-16 bg-white/90 text-[10px] font-medium uppercase tracking-[0.2em] text-black" : hover ? "h-10 w-10" : "h-8 w-8"
        }`}
      >
        {label}
      </div>
    </>
  );
}