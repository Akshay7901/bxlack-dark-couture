import { useEffect, useRef } from "react";

/**
 * "Unmask" reveal for the hero: the pointer melts a liquid hole through the
 * front photo, showing the back photo beneath. The hole has a glowing rim and,
 * once the pointer moves on, each part of the trail stays open for a moment
 * and then shrinks shut.
 *
 * Drawn on a canvas laid exactly over the front image. The trail is a list of
 * wobbly blobs; every frame they're redrawn into an off-screen mask (each at
 * its current size), the back image is clipped to that mask, and a blurred,
 * tinted copy of the mask underneath gives the glow.
 */
const RADIUS = 0.12; // blob radius as a share of the hero's shorter side
const HOLD_MS = 450; // how long a part of the trail stays fully open
const HEAL_MS = 900; // then how long it takes to shrink shut
const GLOW = "rgba(255, 238, 214, 1)";
const GLOW_BLUR = 6; // px, at CSS size
const MAX_BLOBS = 260;

type Blob = { x: number; y: number; r: number; born: number; seed: number };

export function HeroReveal({ src, className = "" }: { src: string; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const mask = document.createElement("canvas");
    const mctx = mask.getContext("2d");
    const layer = document.createElement("canvas");
    const lctx = layer.getContext("2d");
    if (!ctx || !mctx || !lctx) return;

    const img = new Image();
    img.decoding = "async";
    img.src = src;

    let dpr = 1;
    let raf = 0;
    let running = false;
    let last: { x: number; y: number } | null = null;
    const blobs: Blob[] = [];

    const resize = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (!w || !h) return;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      for (const c of [canvas, layer]) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
      }
      // The mask only shapes the hole, so it can be coarser.
      mask.width = Math.round(w * 0.6);
      mask.height = Math.round(h * 0.6);
      blobs.length = 0;
    };

    /** One organic blob: a circle whose edge wobbles with a few moving sine waves. */
    const drawBlob = (b: Blob, r: number, t: number) => {
      mctx.beginPath();
      const steps = 30;
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        const wobble =
          1 +
          0.14 * Math.sin(3 * a + b.seed + t * 1.6) +
          0.09 * Math.sin(5 * a - b.seed * 2 - t * 2.2) +
          0.05 * Math.sin(9 * a + b.seed * 3 + t * 3.1);
        const px = b.x + Math.cos(a) * r * wobble;
        const py = b.y + Math.sin(a) * r * wobble;
        if (i === 0) mctx.moveTo(px, py);
        else mctx.lineTo(px, py);
      }
      mctx.closePath();
      mctx.fill();
    };

    const draw = (now: number) => {
      const t = now / 1000;
      // Rebuild the mask from the live blobs at their current size.
      mctx.clearRect(0, 0, mask.width, mask.height);
      mctx.fillStyle = "#000";
      for (let i = blobs.length - 1; i >= 0; i--) {
        const b = blobs[i];
        const age = now - b.born;
        if (age > HOLD_MS + HEAL_MS) {
          blobs.splice(i, 1);
          continue;
        }
        const k = age <= HOLD_MS ? 1 : 1 - (age - HOLD_MS) / HEAL_MS;
        // Ease the shrink so the hole closes softly at the end.
        const size = k * k * (3 - 2 * k);
        if (size > 0.02) drawBlob(b, b.r * size, t);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (blobs.length && img.complete && img.naturalWidth) {
        // Glow: the mask blurred and tinted, peeking out around the hole's edge.
        ctx.save();
        ctx.filter = `blur(${GLOW_BLUR * dpr}px)`;
        ctx.drawImage(mask, 0, 0, canvas.width, canvas.height);
        ctx.drawImage(mask, 0, 0, canvas.width, canvas.height);
        ctx.restore();
        ctx.save();
        ctx.globalCompositeOperation = "source-in";
        ctx.fillStyle = GLOW;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();

        // Back photo, cropped like the <img> (cover, anchored top), clipped to the mask.
        lctx.globalCompositeOperation = "source-over";
        lctx.clearRect(0, 0, layer.width, layer.height);
        const s = Math.max(layer.width / img.naturalWidth, layer.height / img.naturalHeight);
        const dw = img.naturalWidth * s;
        const dh = img.naturalHeight * s;
        lctx.drawImage(img, (layer.width - dw) / 2, 0, dw, dh);
        lctx.globalCompositeOperation = "destination-in";
        lctx.drawImage(mask, 0, 0, layer.width, layer.height);
        ctx.drawImage(layer, 0, 0);
      }

      if (blobs.length) {
        raf = requestAnimationFrame(draw);
      } else {
        running = false;
      }
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(draw);
    };

    const add = (x: number, y: number, r: number) => {
      blobs.push({ x, y, r, born: performance.now(), seed: Math.random() * 10 });
      if (blobs.length > MAX_BLOBS) blobs.splice(0, blobs.length - MAX_BLOBS);
    };

    const onMove = (e: PointerEvent) => {
      if (!mask.width) resize();
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      // Pointer position in mask pixels (the hero may be zoomed by the scroll effect).
      const x = ((e.clientX - rect.left) / rect.width) * mask.width;
      const y = ((e.clientY - rect.top) / rect.height) * mask.height;
      if (x < 0 || y < 0 || x > mask.width || y > mask.height) return;
      const r = Math.min(mask.width, mask.height) * RADIUS * (e.pointerType === "touch" ? 1.2 : 1);
      // Fill gaps between pointer events so fast moves leave a continuous trail.
      if (last) {
        const dist = Math.hypot(x - last.x, y - last.y);
        const n = Math.min(20, Math.floor(dist / (r * 0.4)));
        for (let i = 1; i <= n; i++) {
          add(last.x + ((x - last.x) * i) / (n + 1), last.y + ((y - last.y) * i) / (n + 1), r * 0.92);
        }
      }
      add(x, y, r);
      last = { x, y };
      start();
    };
    const onLeave = () => {
      last = null;
    };

    resize();
    const target = canvas.parentElement ?? canvas;
    target.addEventListener("pointermove", onMove);
    target.addEventListener("pointerdown", onMove);
    target.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerdown", onMove);
      target.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", resize);
    };
  }, [src]);

  return <canvas ref={canvasRef} aria-hidden className={`pointer-events-none ${className}`} />;
}
