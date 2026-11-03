import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { ExternalLink, ImagePlus, Loader2, RotateCcw } from "lucide-react";
import { Badge } from "@/components/admin/Badge";
import { LightsOutHero } from "@/components/home/LightsOutHero";
import fallbackImage from "@/assets/hero-front-v2.webp";
import { publicStorageUrls, uploadProductImage } from "@/lib/catalog";
import {
  AUTO_REVEAL_OPTIONS,
  DEFAULT_HERO_SETTINGS,
  HERO_STYLES,
  fetchHeroSettingsStrict,
  isValidCtaLink,
  saveHeroSettings,
  type HeroSettings,
  type HeroStyle,
} from "@/lib/hero";
import { SettingsTableMissing } from "@/lib/storeSettings";

const inputClass =
  "mt-2 w-full border border-black/15 bg-transparent px-3 py-2.5 font-mono text-[14px] text-neutral-900 outline-none transition-colors focus:border-black/60";
const labelClass = "font-mono text-[11px] uppercase tracking-[0.28em] text-neutral-400";
const hintClass = "mt-1.5 block font-mono text-[11px] text-neutral-400";

/** Studio → Store → Homepage hero: choose the hero style and edit its image and copy. */
export function AdminHero() {
  const qc = useQueryClient();
  const router = useRouter();
  const { data: saved, isLoading, error } = useQuery({
    queryKey: ["hero-settings", "admin"],
    queryFn: fetchHeroSettingsStrict,
    retry: (count, e) => !(e instanceof SettingsTableMissing) && count < 2,
  });
  const tableMissing = error instanceof SettingsTableMissing;

  const [form, setForm] = useState<HeroSettings>(DEFAULT_HERO_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [replay, setReplay] = useState(0);
  useEffect(() => {
    if (saved) setForm(normalize(saved));
  }, [saved]);
  const set = <K extends keyof HeroSettings>(k: K, v: HeroSettings[K]) => setForm((f) => ({ ...f, [k]: v }));

  const imageUrl = form.imagePath ? (publicStorageUrls([form.imagePath])[form.imagePath] ?? null) : null;
  const dirty = !!saved && JSON.stringify(normalize(form)) !== JSON.stringify(normalize(saved));
  const linkOk = isValidCtaLink(form.ctaLink.trim());
  const canSave = !tableMissing && dirty && !saving && !uploading && linkOk && form.title.trim().length > 0;

  const upload = async (file: File) => {
    setUploading(true);
    try {
      set("imagePath", await uploadProductImage(file));
      setReplay((n) => n + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await saveHeroSettings(normalize(form));
      toast.success("Homepage hero saved");
      await qc.invalidateQueries({ queryKey: ["hero-settings"] });
      // The homepage reads this in its route loader.
      void router.invalidate();
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
          <h2 className="font-display text-xl uppercase tracking-[-0.01em] text-neutral-900">Homepage hero</h2>
          <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-500">
            The first screen of the homepage
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
          Homepage settings aren't set up in the database yet. Open the Supabase SQL Editor, run{" "}
          <code className="font-mono">apply-store-settings.sql</code>, then reload this page. Until then the homepage
          shows the Lights Out hero with its built-in text.
        </div>
      ) : null}

      {isLoading ? (
        <p className="font-mono text-[12px] uppercase tracking-[0.3em] text-neutral-500">Loading…</p>
      ) : error && !tableMissing ? (
        <p className="font-sans text-[13px] text-red-600">
          {error instanceof Error ? error.message : "Could not load settings"}
        </p>
      ) : (
        <>
          {/* Style */}
          <div>
            <p className="text-[14px] font-semibold text-neutral-900">Style</p>
            <div role="radiogroup" aria-label="Hero style" className="mt-3 grid gap-3 sm:grid-cols-2">
              {HERO_STYLES.map((s) => {
                const selected = form.style === s.key;
                return (
                  <button
                    key={s.key}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => set("style", s.key)}
                    className={`flex gap-4 border p-3 text-left transition-colors ${
                      selected ? "border-black ring-1 ring-black" : "border-black/12 hover:border-black/40"
                    }`}
                  >
                    <StyleThumb style={s.key} />
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 text-[13px] font-semibold text-neutral-900">
                        {s.label}
                        {selected ? <Badge tone="success">Selected</Badge> : null}
                      </span>
                      <span className="mt-1 block text-[12px] leading-snug text-neutral-500">{s.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {form.style === "classic" ? (
            <p className="border border-black/12 bg-neutral-50 p-5 text-[13px] leading-relaxed text-neutral-600">
              The Classic hero uses the built-in campaign photos and text. Switch to Lights Out to choose an image and
              edit the words.
            </p>
          ) : (
            <>
              {/* Live preview */}
              <div>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-semibold text-neutral-900">Preview</p>
                    <p className="mt-1 text-[12px] text-neutral-500">
                      Move your mouse over it. Click, or press Lights on, to see the lit version.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplay((n) => n + 1)}
                    className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-500 hover:text-black"
                  >
                    <RotateCcw size={12} /> Replay
                  </button>
                </div>
                <div className="store-preview mt-3 h-[420px] overflow-hidden bg-black sm:h-[520px]">
                  <LightsOutHero key={replay} preview hero={{ ...normalize(form), imageUrl }} />
                </div>
              </div>

              {/* Image */}
              <div className="flex flex-wrap items-center gap-5 border border-black/12 p-5">
                <img
                  src={imageUrl ?? fallbackImage}
                  alt=""
                  className="h-20 w-36 shrink-0 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-neutral-900">Image</p>
                  <p className="mt-1 text-[12px] text-neutral-500">
                    {form.imagePath ? "Your uploaded image." : "The built-in campaign photo."} Wide (landscape) photos
                    with a dark background work best.
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <label
                    className={`flex items-center gap-2 border border-black px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.24em] ${
                      uploading || tableMissing ? "cursor-wait opacity-50" : "cursor-pointer hover:bg-black hover:text-white"
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={uploading || tableMissing}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (file) void upload(file);
                      }}
                    />
                    {uploading ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
                    {form.imagePath ? "Change image" : "Upload image"}
                  </label>
                  {form.imagePath ? (
                    <button
                      type="button"
                      onClick={() => set("imagePath", null)}
                      className="font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-500 hover:text-red-600"
                    >
                      Use built-in
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Words */}
              <div className="grid gap-5 border border-black/12 p-5 md:grid-cols-2">
                <label className="block md:col-span-2">
                  <span className={labelClass}>Headline</span>
                  <input
                    className={inputClass}
                    value={form.title}
                    maxLength={60}
                    placeholder={DEFAULT_HERO_SETTINGS.title}
                    onChange={(e) => set("title", e.target.value)}
                  />
                  <span className={hintClass}>Big words hidden in the dark. Keep it short — 2 to 5 words.</span>
                </label>

                <label className="block">
                  <span className={labelClass}>Small line above (optional)</span>
                  <input
                    className={inputClass}
                    value={form.eyebrow}
                    maxLength={40}
                    placeholder={DEFAULT_HERO_SETTINGS.eyebrow}
                    onChange={(e) => set("eyebrow", e.target.value)}
                  />
                  <span className={hintClass}>e.g. the drop name or season</span>
                </label>

                <label className="block">
                  <span className={labelClass}>Hint</span>
                  <input
                    className={inputClass}
                    value={form.hint}
                    maxLength={40}
                    placeholder={DEFAULT_HERO_SETTINGS.hint}
                    onChange={(e) => set("hint", e.target.value)}
                  />
                  <span className={hintClass}>Shown in the dark. On phones "Move…" reads "Drag…".</span>
                </label>

                <label className="block">
                  <span className={labelClass}>Button text</span>
                  <input
                    className={inputClass}
                    value={form.ctaLabel}
                    maxLength={30}
                    placeholder={DEFAULT_HERO_SETTINGS.ctaLabel}
                    onChange={(e) => set("ctaLabel", e.target.value)}
                  />
                  <span className={hintClass}>Appears once the lights are on</span>
                </label>

                <label className="block">
                  <span className={labelClass}>Button link</span>
                  <input
                    className={inputClass}
                    value={form.ctaLink}
                    placeholder="/new-drop"
                    onChange={(e) => set("ctaLink", e.target.value.trim())}
                  />
                  <span className={`${hintClass} ${linkOk ? "" : "text-red-600"}`}>
                    {linkOk ? "A page on your site like /new-drop or /shop?type=Tshirt" : "Start with / (or https://)"}
                  </span>
                </label>

                <label className="block">
                  <span className={labelClass}>Lights come on by themselves</span>
                  <select
                    className={`${inputClass} [&>option]:bg-white`}
                    value={form.autoRevealSeconds}
                    onChange={(e) => set("autoRevealSeconds", Number(e.target.value))}
                  >
                    {AUTO_REVEAL_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n === 0 ? "Never — only when the visitor clicks" : `After about ${n + 2} seconds`}
                      </option>
                    ))}
                  </select>
                  <span className={hintClass}>Visitors can always click or press Lights on</span>
                </label>
              </div>
            </>
          )}
        </>
      )}

      {/* Save bar */}
      {!isLoading && !tableMissing ? (
        <div className="sticky bottom-0 -mx-1 flex items-center justify-end gap-4 border-t border-black/10 bg-white/95 px-1 py-3 backdrop-blur">
          {dirty ? <span className="text-[12px] text-neutral-500">Unsaved changes</span> : null}
          {dirty ? (
            <button
              type="button"
              onClick={() => saved && setForm(normalize(saved))}
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

/** Settings only (no imageUrl), trimmed, blanks back to defaults — for saving and dirty checks. */
function normalize(s: HeroSettings): HeroSettings {
  const d = DEFAULT_HERO_SETTINGS;
  return {
    style: s.style,
    imagePath: s.imagePath,
    eyebrow: s.eyebrow.trim(),
    title: s.title.trim() || d.title,
    hint: s.hint.trim() || d.hint,
    ctaLabel: s.ctaLabel.trim() || d.ctaLabel,
    ctaLink: s.ctaLink.trim(),
    autoRevealSeconds: s.autoRevealSeconds,
  };
}

/** Small drawing of each style for the picker. */
function StyleThumb({ style }: { style: HeroStyle }) {
  return (
    <div aria-hidden className="relative h-16 w-28 shrink-0 overflow-hidden bg-black">
      {style === "lights-out" ? (
        <>
          <div className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,#a3a3a3,#525252_45%,transparent_70%)]" />
          <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center">
            <div className="h-1.5 w-14 bg-white/15" />
          </div>
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-500 to-neutral-800" />
          <div className="absolute bottom-2 left-2 h-1 w-8 bg-white/80" />
          <div className="absolute bottom-4 left-2 h-1 w-5 bg-white/50" />
        </>
      )}
    </div>
  );
}
