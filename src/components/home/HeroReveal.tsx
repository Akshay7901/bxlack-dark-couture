import { useEffect, useRef } from "react";

/**
 * "Unmask" reveal for the hero: the pointer tears a hole through the front
 * photo, showing the back photo beneath. The hole has a ragged, torn-paper
 * edge traced by a thin neon line with a glow; neon specks fly off the edge
 * while it tears, and a small neon marker sits at the cursor. Once the
 * pointer moves on, each part of the trail holds briefly, then shrinks into a
 * glowing slash and closes.
 *
 * Drawn on a canvas laid exactly over the front image. Each frame the trail's
 * blobs are drawn twice: as the hole (clips the back image) and a little
 * larger in neon (the edge line and, blurred, its glow).
 */
const NEON = "#d8ff2e";
const RADIUS = 0.11; // blob radius as a share of the hero's shorter side
const RIM = 3; // neon edge thickness, CSS px
const HOLD_MS = 300; // how long a part of the trail stays fully open
const HEAL_MS = 750; // then how long it takes to close
const MAX_BLOBS = 240;
const VERTS = 44;

type Blob = { x: number; y: number; r: number; born: number; seed: number; jitter: Float32Array };
type Speck = { x: number; y: number; vx: number; vy: number; born: number; life: number; size: number };

export function HeroReveal({ src, className = "" }: { src: string; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const hole = document.createElement("canvas");
    const hctx = hole.getContext("2d");
    const rim = document.createElement("canvas");
    const rctx = rim.getContext("2d");
    const layer = document.createElement("canvas");
    const lctx = layer.getContext("2d");
    if (!ctx || !hctx || !rctx || !lctx) return;

    const img = new Image();
    img.decoding = "async";
    img.src = src;

    let w = 0; // layout size in CSS px
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let running = false;
    let last: { x: number; y: number } | null = null;
    let cursor: { x: number; y: number; at: number } | null = null;
    const blobs: Blob[] = [];
    const specks: Speck[] = [];

    const resize = () => {
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      if (!w || !h) return;
      dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      for (const c of [canvas, hole, rim, layer]) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
      }
      blobs.length = 0;
      specks.length = 0;
    };

    /** A torn blob: a circle with slow wobble plus fixed fine jitter for a ragged edge. */
    const blobPath = (c: CanvasRenderingContext2D, b: Blob, r: number, t: number) => {
      c.beginPath();
      for (let i = 0; i <= VERTS; i++) {
        const k = i % VERTS;
        const a = (k / VERTS) * Math.PI * 2;
        const wobble =
          1 +
          0.13 * Math.sin(2 * a + b.seed + t * 1.2) +
          0.08 * Math.sin(5 * a - b.seed * 2 - t * 1.9) +
          b.jitter[k];
        const px = (b.x + Math.cos(a) * r * wobble) * dpr;
        const py = (b.y + Math.sin(a) * r * wobble * 0.86) * dpr;
        if (i === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.closePath();
      c.fill();
    };

    const draw = (now: number) => {
      const t = now / 1000;
      hctx.clearRect(0, 0, hole.width, hole.height);
      rctx.globalCompositeOperation = "source-over";
      rctx.clearRect(0, 0, rim.width, rim.height);
      hctx.fillStyle = "#000";
      rctx.fillStyle = "#000";

      for (let i = blobs.length - 1; i >= 0; i--) {
        const b = blobs[i];
        const age = now - b.born;
        if (age > HOLD_MS + HEAL_MS) {
          blobs.splice(i, 1);
          continue;
        }
        const k = age <= HOLD_MS ? 1 : 1 - (age - HOLD_MS) / HEAL_MS;
        const size = k * k * (3 - 2 * k);
        // The neon edge outlives the hole a moment, so a closing tear ends as a glowing slash.
        const edge = RIM * Math.min(1, k * 3);
        if (size > 0.01) blobPath(hctx, b, b.r * size, t);
        if (size * b.r + edge > 0.5) blobPath(rctx, b, b.r * size + edge, t);
      }
      // Keep only the ring around the hole, and tint it neon.
      rctx.globalCompositeOperation = "destination-out";
      rctx.drawImage(hole, 0, 0);
      rctx.globalCompositeOperation = "source-in";
      rctx.fillStyle = NEON;
      rctx.fillRect(0, 0, rim.width, rim.height);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const ready = img.complete && img.naturalWidth > 0;
      if (blobs.length && ready) {
        // Outer glow, then the crisp neon edge.
        ctx.save();
        ctx.filter = `blur(${10 * dpr}px)`;
        ctx.globalAlpha = 0.75;
        ctx.drawImage(rim, 0, 0);
        ctx.restore();
        ctx.drawImage(rim, 0, 0);

        // Back photo, cropped like the <img> (cover, anchored top), clipped to the hole.
        lctx.globalCompositeOperation = "source-over";
        lctx.clearRect(0, 0, layer.width, layer.height);
        const s = Math.max(layer.width / img.naturalWidth, layer.height / img.naturalHeight);
        const dw = img.naturalWidth * s;
        const dh = img.naturalHeight * s;
        lctx.drawImage(img, (layer.width - dw) / 2, 0, dw, dh);
        lctx.globalCompositeOperation = "destination-in";
        lctx.drawImage(hole, 0, 0);
        ctx.drawImage(layer, 0, 0);

        // A faint neon cast just inside the edge.
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.filter = `blur(${5 * dpr}px)`;
        ctx.globalAlpha = 0.5;
        ctx.drawImage(rim, 0, 0);
        ctx.restore();
      }

      // Specks flying off the tear.
      ctx.fillStyle = NEON;
      for (let i = specks.length - 1; i >= 0; i--) {
        const p = specks[i];
        const age = (now - p.born) / p.life;
        if (age >= 1) {
          specks.splice(i, 1);
          continue;
        }
        const x = p.x + p.vx * age * p.life * 0.001;
        const y = p.y + p.vy * age * p.life * 0.001 + 30 * age * age;
        ctx.globalAlpha = 1 - age;
        const sz = p.size * dpr * (1 - age * 0.5);
        ctx.fillRect(x * dpr - sz / 2, y * dpr - sz / 2, sz, sz);
      }
      ctx.globalAlpha = 1;

      // Cursor marker: a small neon diamond.
      const showCursor = cursor && now - cursor.at < 900 && ready;
      if (showCursor && cursor) {
        const a = 1 - Math.max(0, (now - cursor.at - 500) / 400);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(cursor.x * dpr, cursor.y * dpr);
        ctx.rotate(Math.PI / 4);
        const d = 7 * dpr;
        ctx.fillStyle = NEON;
        ctx.fillRect(-d / 2, -d / 2, d, d);
        ctx.strokeStyle = "rgba(0,0,0,0.55)";
        ctx.lineWidth = 1 * dpr;
        ctx.strokeRect(-d / 2, -d / 2, d, d);
        ctx.restore();
      }

      if (blobs.length || specks.length || showCursor) {
        raf = requestAnimationFrame(draw);
      } else {
        running = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(draw);
    };

    const add = (x: number, y: number, r: number) => {
      const jitter = new Float32Array(VERTS);
      for (let i = 0; i < VERTS; i++) jitter[i] = (Math.random() - 0.5) * 0.11;
      blobs.push({ x, y, r, born: performance.now(), seed: Math.random() * 10, jitter });
      if (blobs.length > MAX_BLOBS) blobs.splice(0, blobs.length - MAX_BLOBS);
    };

    const spray = (x: number, y: number, r: number, dx: number, dy: number) => {
      const n = Math.random() < 0.6 ? 1 : 2;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const speed = 40 + Math.random() * 90;
        specks.push({
          x: x + Math.cos(a) * r,
          y: y + Math.sin(a) * r * 0.86,
          vx: Math.cos(a) * speed - dx * 2,
          vy: Math.sin(a) * speed - dy * 2,
          born: performance.now(),
          life: 450 + Math.random() * 450,
          size: 2 + Math.random() * 3,
        });
      }
      if (specks.length > 120) specks.splice(0, specks.length - 120);
    };

    const onMove = (e: PointerEvent) => {
      if (!w) resize();
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      // Pointer position in layout px (the hero may be zoomed by the scroll effect).
      const x = ((e.clientX - rect.left) / rect.width) * w;
      const y = ((e.clientY - rect.top) / rect.height) * h;
      if (x < 0 || y < 0 || x > w || y > h) return;
      const r = Math.min(w, h) * RADIUS * (e.pointerType === "touch" ? 1.2 : 1);
      let dx = 0;
      let dy = 0;
      // Fill gaps between pointer events so fast moves leave a continuous tear.
      if (last) {
        dx = x - last.x;
        dy = y - last.y;
        const dist = Math.hypot(dx, dy);
        const n = Math.min(18, Math.floor(dist / (r * 0.35)));
        for (let i = 1; i <= n; i++) add(last.x + (dx * i) / (n + 1), last.y + (dy * i) / (n + 1), r * 0.92);
        if (dist > 3) spray(x, y, r, dx, dy);
      }
      add(x, y, r);
      last = { x, y };
      cursor = { x, y, at: performance.now() };
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
