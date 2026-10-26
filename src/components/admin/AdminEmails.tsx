import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Monitor, Smartphone, Tablet, Columns3 } from "lucide-react";
import { fetchProducts } from "@/lib/catalog";
import { emailCatalog, preheaderOf, type EmailPreview } from "@/lib/email/catalog";

const DEVICES = [
  { key: "phone", label: "Phone", width: 375, icon: Smartphone },
  { key: "tablet", label: "Tablet", width: 768, icon: Tablet },
  { key: "desktop", label: "Desktop", width: 1280, icon: Monitor },
] as const;
type DeviceKey = (typeof DEVICES)[number]["key"] | "all";

const labelClass = "font-mono text-[10px] uppercase tracking-[0.28em] text-neutral-500";

export function AdminEmails() {
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: () => fetchProducts() });
  const images = useMemo(
    () => products.slice(0, 2).map((p) => p.cardImageUrl ?? p.imageUrl),
    [products],
  );
  const catalog = useMemo(() => emailCatalog(images), [images]);
  const [selectedId, setSelectedId] = useState(catalog[0].id);
  const [device, setDevice] = useState<DeviceKey>("phone");

  const selected = catalog.find((e) => e.id === selectedId) ?? catalog[0];
  const email = useMemo(() => selected.render(), [selected]);
  const groups = Array.from(new Set(catalog.map((e) => e.group)));

  return (
    <section>
      <h2 className="font-display text-xl uppercase tracking-[-0.01em] text-neutral-900">
        Emails — {catalog.length}
      </h2>
      <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-500">
        Every email the store sends, shown with sample data
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Email templates" className="space-y-5">
          {groups.map((g) => (
            <div key={g}>
              <p className={`${labelClass} mb-1.5`}>{g}</p>
              <div className="flex flex-wrap gap-1 lg:flex-col">
                {catalog
                  .filter((e) => e.group === g)
                  .map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => setSelectedId(e.id)}
                      aria-pressed={e.id === selected.id}
                      className={`px-3 py-2 text-left font-sans text-[13px] transition-colors ${
                        e.id === selected.id
                          ? "bg-black text-white"
                          : "bg-black/[0.03] text-neutral-700 hover:bg-black/[0.07]"
                      }`}
                    >
                      {e.name}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="min-w-0 space-y-4">
          <InboxHeader preview={selected} subject={email.subject} preheader={preheaderOf(email.html)} />

          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Preview size">
            {[...DEVICES, { key: "all" as const, label: "All sizes", width: 0, icon: Columns3 }].map((d) => {
              const Icon = d.icon;
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setDevice(d.key)}
                  aria-pressed={device === d.key}
                  className={`flex items-center gap-2 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
                    device === d.key ? "bg-black text-white" : "bg-black/5 text-neutral-600 hover:bg-black/10"
                  }`}
                >
                  <Icon size={13} />
                  {d.label}
                  {d.width ? <span className="opacity-60">{d.width}px</span> : null}
                </button>
              );
            })}
          </div>

          {device === "all" ? (
            <div className="grid gap-4 md:grid-cols-[1fr_1.4fr_2fr]">
              {DEVICES.map((d) => (
                <DeviceFrame key={d.key} label={`${d.label} · ${d.width}px`} width={d.width} kind={d.key} html={email.html} />
              ))}
            </div>
          ) : (
            DEVICES.filter((d) => d.key === device).map((d) => (
              <DeviceFrame key={d.key} label={`${d.label} · ${d.width}px`} width={d.width} kind={d.key} html={email.html} />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function InboxHeader({ preview, subject, preheader }: { preview: EmailPreview; subject: string; preheader: string }) {
  return (
    <div className="border border-black/10 bg-black/[0.02] p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="font-mono text-[11px] text-neutral-500">
          <span className="text-neutral-900">BXLACK</span> · to {preview.to}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400">Sent when: {preview.when}</p>
      </div>
      <p className="mt-2 font-sans text-[15px] font-semibold text-neutral-900">{subject}</p>
      <p className="mt-0.5 truncate font-sans text-[13px] text-neutral-500">{preheader}</p>
    </div>
  );
}

/** Renders the email in a sandboxed frame at a real device width, scaled
 * down to fit the available space, with the frame's height following the
 * email's own height. */
function DeviceFrame({
  label,
  width,
  kind,
  html,
}: {
  label: string;
  width: number;
  kind: "phone" | "tablet" | "desktop";
  html: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [available, setAvailable] = useState(width);
  const [height, setHeight] = useState(900);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setAvailable(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fit = () => {
    const doc = frameRef.current?.contentDocument;
    if (doc?.documentElement) setHeight(doc.documentElement.scrollHeight);
  };

  // Images (logo, thumbnails) load after the frame does, changing its height.
  useEffect(() => {
    const t = setTimeout(fit, 400);
    return () => clearTimeout(t);
  }, [html, width]);

  const bezel = kind === "desktop" ? 2 : 20;
  const scale = Math.min(1, Math.max(available - bezel, 120) / width);
  const chrome =
    kind === "phone"
      ? "rounded-[28px] border-[10px] border-neutral-900"
      : kind === "tablet"
        ? "rounded-[18px] border-[10px] border-neutral-900"
        : "rounded-md border border-neutral-300";

  return (
    <figure className="min-w-0">
      <figcaption className={`${labelClass} mb-2`}>{label}</figcaption>
      <div ref={boxRef} className="w-full">
        <div
          className={`mx-auto overflow-hidden bg-black ${chrome}`}
          style={{ width: width * scale + bezel }}
        >
          {kind === "desktop" ? (
            <div className="flex items-center gap-1.5 border-b border-neutral-300 bg-neutral-100 px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
            </div>
          ) : null}
          <div style={{ width: width * scale, height: height * scale, overflow: "hidden" }}>
            <iframe
              ref={frameRef}
              title={`${label} preview`}
              sandbox="allow-same-origin"
              srcDoc={html}
              onLoad={fit}
              style={{
                width,
                height,
                border: 0,
                display: "block",
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            />
          </div>
        </div>
      </div>
    </figure>
  );
}
