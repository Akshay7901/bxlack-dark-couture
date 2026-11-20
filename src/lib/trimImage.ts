import { useEffect, useState } from "react";

/**
 * Cut-outs from background removers usually keep the whole original canvas,
 * so the person fills only part of a mostly transparent image and would
 * render tiny. This crops an image to its visible pixels (in the browser,
 * once per URL) and returns an object URL for the cropped copy. Images
 * without transparent margins, or that can't be read (CORS), come back as-is.
 */
const cache = new Map<string, Promise<string>>();

const MAX_SIDE = 1400;
const ALPHA_MIN = 16;

/** Show the untrimmed image rather than nothing if the copy takes this long (slow mobile data). */
const GIVE_UP_MS = 4000;

function trim(src: string): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(src), GIVE_UP_MS);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onerror = () => resolve(src);
    img.onload = () => {
      try {
        const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return resolve(src);
        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);

        let top = h, left = w, right = -1, bottom = -1;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            if (data[(y * w + x) * 4 + 3] > ALPHA_MIN) {
              if (x < left) left = x;
              if (x > right) right = x;
              if (y < top) top = y;
              if (y > bottom) bottom = y;
            }
          }
        }
        // Fully transparent, or nothing worth cropping (opaque photo, already tight).
        if (right < 0) return resolve(src);
        const cw = right - left + 1;
        const ch = bottom - top + 1;
        if (cw * ch > w * h * 0.9) return resolve(src);

        const out = document.createElement("canvas");
        out.width = cw;
        out.height = ch;
        out.getContext("2d")?.drawImage(canvas, left, top, cw, ch, 0, 0, cw, ch);
        out.toBlob((blob) => resolve(blob ? URL.createObjectURL(blob) : src), "image/png");
      } catch {
        resolve(src);
      }
    };
    img.src = src;
  });
}

export function trimmedImage(src: string): Promise<string> {
  if (!src || typeof window === "undefined") return Promise.resolve(src);
  let p = cache.get(src);
  if (!p) {
    p = trim(src);
    cache.set(src, p);
  }
  return p;
}

/** The cropped image URL once ready; the original until then. */
export function useTrimmedImage(src: string): { src: string; ready: boolean } {
  const [state, setState] = useState<{ for: string; src: string } | null>(null);
  useEffect(() => {
    let alive = true;
    void trimmedImage(src).then((out) => alive && setState({ for: src, src: out }));
    return () => {
      alive = false;
    };
  }, [src]);
  return state?.for === src ? { src: state.src, ready: true } : { src, ready: false };
}
