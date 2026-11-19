import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Check, ExternalLink, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/admin/Badge";
import { fetchProducts, uploadProductImage, type CatalogProductWithUrls } from "@/lib/catalog";
import {
  DEFAULT_LOOKS_SETTINGS,
  LooksTableMissing,
  MAX_LOOKS,
  lookImageUrl,
  saveLooksSettings,
  useLooksSettingsAdmin,
  type Look,
  type LooksSettings,
} from "@/lib/looks";

const inputClass =
  "mt-2 w-full border border-black/15 bg-transparent px-3 py-2.5 font-mono text-[14px] text-neutral-900 outline-none transition-colors focus:border-black/60";
const labelClass = "font-mono text-[11px] uppercase tracking-[0.28em] text-neutral-400";
const hintClass = "mt-1.5 block font-mono text-[11px] text-neutral-400";

/** Studio → Store → Looks: the homepage "Try the Look" lineup. */
export function AdminLooks() {
  const qc = useQueryClient();
  const { data: saved, isLoading, error } = useLooksSettingsAdmin();
  const tableMissing = error instanceof LooksTableMissing;
  const { data: products = [] } = useQuery({ queryKey: ["admin-products"], queryFn: () => fetchProducts(true) });

  const [form, setForm] = useState<LooksSettings>(DEFAULT_LOOKS_SETTINGS);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (saved) setForm(saved);
  }, [saved]);
  const set = <K extends keyof LooksSettings>(k: K, v: LooksSettings[K]) => setForm((f) => ({ ...f, [k]: v }));
  const setLook = (id: string, patch: Partial<Look>) =>
    set("looks", form.looks.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const move = (i: number, dir: -1 | 1) => {
    const next = [...form.looks];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    set("looks", next);
  };

  const published = new Set(products.filter((p) => p.published).map((p) => p.id));
  const isLive = (l: Look) => !!l.image && l.productIds.some((id) => published.has(id));
  const liveCount = form.looks.filter(isLive).length;

  const dirty = !!saved && JSON.stringify(normalize(form)) !== JSON.stringify(normalize(saved));
  const canSave = !tableMissing && dirty && !saving;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await saveLooksSettings(normalize(form));
      toast.success("Looks saved");
      await qc.invalidateQueries({ queryKey: ["looks-settings"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-8 pb-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl uppercase tracking-[-0.01em] text-neutral-900">Looks</h2>
          <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-500">
            Homepage “Try the Look” lineup, below Shop by Category
          </p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-500 hover:text-black"
        >
          View homepage <ExternalLink size={12} />
        </a>
      </div>

      {tableMissing ? (
        <div className="border border-amber-500/30 bg-amber-50 p-5 font-sans text-[13px] leading-relaxed text-amber-900">
          Store settings aren't set up in the database yet. Open the Supabase SQL Editor, run{" "}
          <code className="font-mono">apply-store-settings.sql</code>, then reload this page.
        </div>
      ) : null}

      {isLoading ? (
        <p className="font-mono text-[12px] uppercase tracking-[0.3em] text-neutral-500">Loading…</p>
      ) : error && !tableMissing ? (
        <p className="font-sans text-[13px] text-red-600">{error instanceof Error ? error.message : "Could not load"}</p>
      ) : (
        <>
          {/* On/off */}
          <div className="flex flex-wrap items-center justify-between gap-4 border border-black/12 p-5">
            <div>
              <p className="flex items-center gap-2 text-[14px] font-semibold text-neutral-900">
                Show on homepage
                {form.enabled && liveCount > 0 ? (
                  <Badge tone="success">Visible</Badge>
                ) : (
                  <Badge tone="neutral">Hidden</Badge>
                )}
              </p>
              <p className="mt-1 text-[13px] text-neutral-500">
                {form.enabled && liveCount === 0
                  ? "Add at least one look with a photo and a published product for the section to appear."
                  : "Turn off to remove the section without losing your looks."}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.enabled}
              aria-label="Show Try the Look on homepage"
              disabled={tableMissing}
              onClick={() => set("enabled", !form.enabled)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-40 ${
                form.enabled ? "bg-black" : "bg-neutral-300"
              }`}
            >
              <span
                className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  form.enabled ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Text */}
          <div className="grid gap-5 border border-black/12 p-5 md:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Heading</span>
              <input
                className={inputClass}
                value={form.heading}
                placeholder={DEFAULT_LOOKS_SETTINGS.heading}
                onChange={(e) => set("heading", e.target.value)}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Line beside the heading</span>
              <input
                className={inputClass}
                value={form.subheading}
                placeholder={DEFAULT_LOOKS_SETTINGS.subheading}
                onChange={(e) => set("subheading", e.target.value)}
              />
              <span className={hintClass}>Leave empty to hide it</span>
            </label>
          </div>

          {/* Looks */}
          <div>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[14px] font-semibold text-neutral-900">
                  Looks ({form.looks.length}/{MAX_LOOKS})
                </p>
                <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-neutral-500">
                  One full-body photo per look, then tick the products it's wearing. For the lineup effect, use cut-out
                  photos on a transparent background (PNG or WebP, head to toe, same framing for every look). 4–6 looks
                  works best.
                </p>
              </div>
              <button
                type="button"
                disabled={form.looks.length >= MAX_LOOKS || tableMissing}
                onClick={() =>
                  set("looks", [...form.looks, { id: crypto.randomUUID(), name: "", image: "", productIds: [] }])
                }
                className="flex items-center gap-2 border border-black px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.24em] text-black transition-colors hover:bg-black hover:text-white disabled:opacity-40"
              >
                <Plus size={13} /> Add look
              </button>
            </div>

            {form.looks.length === 0 ? (
              <p className="mt-4 border border-dashed border-black/15 p-8 text-center text-[13px] text-neutral-500">
                No looks yet. Click “Add look” to start.
              </p>
            ) : (
              <ol className="mt-4 space-y-4">
                {form.looks.map((look, i) => (
                  <LookEditor
                    key={look.id}
                    index={i}
                    look={look}
                    products={products}
                    live={isLive(look)}
                    isFirst={i === 0}
                    isLast={i === form.looks.length - 1}
                    onChange={(patch) => setLook(look.id, patch)}
                    onMove={(dir) => move(i, dir)}
                    onRemove={() => set("looks", form.looks.filter((l) => l.id !== look.id))}
                  />
                ))}
              </ol>
            )}
          </div>
        </>
      )}

      {!isLoading && !tableMissing ? (
        <div className="sticky bottom-0 -mx-1 flex items-center justify-end gap-4 border-t border-black/10 bg-white/95 px-1 py-3 backdrop-blur">
          {dirty ? <span className="text-[12px] text-neutral-500">Unsaved changes</span> : null}
          {dirty ? (
            <button
              type="button"
              onClick={() => saved && setForm(saved)}
              className="font-mono text-[10px] uppercase tracking-[0.28em] text-neutral-500 hover:text-black"
            >
              Discard
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void save()}
            disabled={!canSave}
            className="flex items-center gap-2 border border-black bg-black px-6 py-3 font-mono text-[10px] uppercase tracking-[0.3em] text-white transition-colors hover:bg-transparent hover:text-black disabled:opacity-40"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : null}
            Save changes
          </button>
        </div>
      ) : null}
    </section>
  );
}

function LookEditor({
  index,
  look,
  products,
  live,
  isFirst,
  isLast,
  onChange,
  onMove,
  onRemove,
}: {
  index: number;
  look: Look;
  products: CatalogProductWithUrls[];
  live: boolean;
  isFirst: boolean;
  isLast: boolean;
  onChange: (patch: Partial<Look>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const selected = new Set(look.productIds);
  const toggle = (id: string) =>
    onChange({ productIds: selected.has(id) ? look.productIds.filter((p) => p !== id) : [...look.productIds, id] });

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file");
      return;
    }
    setUploading(true);
    try {
      onChange({ image: await uploadProductImage(file) });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const iconBtn = "flex h-8 w-8 items-center justify-center text-neutral-500 hover:bg-black/5 hover:text-black disabled:opacity-30";

  return (
    <li className="grid gap-5 border border-black/12 p-4 sm:grid-cols-[150px_1fr]">
      {/* Photo */}
      <div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="relative flex aspect-[1/2] w-full items-center justify-center overflow-hidden bg-[repeating-conic-gradient(#f2f2f2_0%_25%,#fafafa_0%_50%)] bg-[length:16px_16px] text-neutral-500 hover:text-black"
          aria-label={look.image ? "Replace photo" : "Upload photo"}
        >
          {look.image ? (
            <img src={lookImageUrl(look.image)} alt="" className="h-full w-full object-contain object-bottom" />
          ) : (
            <span className="flex flex-col items-center gap-2 px-3 text-center font-mono text-[10px] uppercase tracking-[0.2em]">
              <ImagePlus size={20} /> Upload photo
            </span>
          )}
          {uploading ? (
            <span className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Loader2 size={18} className="animate-spin" />
            </span>
          ) : null}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/webp,image/jpeg"
          className="hidden"
          onChange={(e) => void upload(e.target.files?.[0])}
        />
        {look.image ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-2 w-full font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 hover:text-black"
          >
            Replace photo
          </button>
        ) : null}
      </div>

      {/* Details */}
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-neutral-500">
            Look {String(index + 1).padStart(2, "0")}
            {live ? <Badge tone="success">On homepage</Badge> : <Badge tone="neutral">Not shown yet</Badge>}
          </p>
          <div className="flex items-center">
            <button type="button" className={iconBtn} disabled={isFirst} onClick={() => onMove(-1)} aria-label="Move up">
              <ArrowUp size={15} />
            </button>
            <button type="button" className={iconBtn} disabled={isLast} onClick={() => onMove(1)} aria-label="Move down">
              <ArrowDown size={15} />
            </button>
            <button
              type="button"
              className={`${iconBtn} hover:text-red-600`}
              onClick={onRemove}
              aria-label="Remove look"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        <label className="mt-3 block">
          <span className={labelClass}>Name (optional)</span>
          <input
            className={inputClass}
            value={look.name}
            placeholder={`Look ${String(index + 1).padStart(2, "0")}`}
            maxLength={40}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </label>

        <p className={`${labelClass} mt-5`}>Products in this look ({look.productIds.length})</p>
        {!live ? (
          <p className="mt-1 text-[12px] text-amber-700">
            {!look.image ? "Needs a photo" : "Needs at least one published product"} to show on the homepage.
          </p>
        ) : null}
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {products.map((p) => {
            const on = selected.has(p.id);
            return (
              <button
                key={p.id}
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => toggle(p.id)}
                className={`flex items-center gap-3 border p-2 text-left transition-colors ${
                  on ? "border-black bg-black/[0.03]" : "border-black/12 hover:border-black/40"
                }`}
              >
                <span className="block h-12 w-10 shrink-0 overflow-hidden bg-neutral-100">
                  {p.cardImageUrl || p.imageUrl ? (
                    <img src={p.cardImageUrl ?? p.imageUrl ?? ""} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-neutral-900">{p.name}</span>
                  <span className="block text-[11px] text-neutral-500">
                    ₹{p.price}
                    {p.published ? "" : " · Unpublished"}
                  </span>
                </span>
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center border ${
                    on ? "border-black bg-black text-white" : "border-black/25"
                  }`}
                >
                  {on ? <Check size={12} /> : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </li>
  );
}

function normalize(s: LooksSettings): LooksSettings {
  return {
    enabled: s.enabled,
    heading: s.heading.trim() || DEFAULT_LOOKS_SETTINGS.heading,
    subheading: s.subheading.trim(),
    looks: s.looks.map((l) => ({ id: l.id, name: l.name.trim(), image: l.image, productIds: [...new Set(l.productIds)] })),
  };
}
