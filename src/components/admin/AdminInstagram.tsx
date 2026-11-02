import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, ExternalLink, Eye, EyeOff, Loader2, Play, RefreshCw } from "lucide-react";
import { Badge } from "@/components/admin/Badge";
import {
  DEFAULT_INSTAGRAM_SETTINGS,
  POST_COUNT_OPTIONS,
  SettingsTableMissing,
  fetchInstagramSettingsStrict,
  instagramUrl,
  saveInstagramSettings,
  useInstagramFeed,
  type InstagramSettings,
} from "@/lib/instagram";

const inputClass =
  "mt-2 w-full border border-black/15 bg-transparent px-3 py-2.5 font-mono text-[14px] text-neutral-900 outline-none transition-colors focus:border-black/60";
const labelClass = "font-mono text-[11px] uppercase tracking-[0.28em] text-neutral-400";
const hintClass = "mt-1.5 block font-mono text-[11px] text-neutral-400";

const isHttpsUrl = (s: string) => /^https:\/\/\S+$/.test(s.trim());

/** Studio → Store → Instagram: the homepage Instagram section. */
export function AdminInstagram() {
  const qc = useQueryClient();
  const { data: saved, isLoading, error } = useQuery({
    queryKey: ["instagram-settings", "admin"],
    queryFn: fetchInstagramSettingsStrict,
    retry: (count, e) => !(e instanceof SettingsTableMissing) && count < 2,
  });
  const tableMissing = error instanceof SettingsTableMissing;

  const [form, setForm] = useState<InstagramSettings>(DEFAULT_INSTAGRAM_SETTINGS);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (saved) setForm(saved);
  }, [saved]);
  const set = <K extends keyof InstagramSettings>(k: K, v: InstagramSettings[K]) => setForm((f) => ({ ...f, [k]: v }));

  // Preview the feed URL once it looks complete, not on every keystroke.
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    const url = form.feedUrl.trim();
    const t = setTimeout(() => setPreviewUrl(isHttpsUrl(url) ? url : null), 500);
    return () => clearTimeout(t);
  }, [form.feedUrl]);
  const feed = useInstagramFeed(previewUrl);
  const posts = feed.data?.posts ?? [];

  const hidden = new Set(form.hiddenPosts);
  const onHomepage = new Set(
    posts
      .filter((p) => !hidden.has(p.id))
      .slice(0, form.maxPosts)
      .map((p) => p.id),
  );
  const toggleHidden = (id: string) =>
    set("hiddenPosts", hidden.has(id) ? form.hiddenPosts.filter((h) => h !== id) : [...form.hiddenPosts, id]);

  const dirty = !!saved && JSON.stringify(normalize(form)) !== JSON.stringify(normalize(saved));
  const canSave = !tableMissing && dirty && !saving && form.handle.trim() && isHttpsUrl(form.feedUrl);

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await saveInstagramSettings(normalize(form));
      toast.success("Instagram section saved");
      await qc.invalidateQueries({ queryKey: ["instagram-settings"] });
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
          <h2 className="font-display text-xl uppercase tracking-[-0.01em] text-neutral-900">Instagram</h2>
          <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-500">
            Homepage section above the newsletter
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
          Instagram settings aren't set up in the database yet. Open the Supabase SQL Editor, run{" "}
          <code className="font-mono">apply-store-settings.sql</code>, then reload this page. Until then the homepage
          shows the section with its built-in settings.
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
          {/* On/off */}
          <div className="flex flex-wrap items-center justify-between gap-4 border border-black/12 p-5">
            <div>
              <p className="flex items-center gap-2 text-[14px] font-semibold text-neutral-900">
                Show on homepage
                {form.enabled ? <Badge tone="success">Visible</Badge> : <Badge tone="neutral">Hidden</Badge>}
              </p>
              <p className="mt-1 text-[13px] text-neutral-500">
                Turn off to remove the section from the homepage without losing these settings.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.enabled}
              aria-label="Show Instagram section on homepage"
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

          {/* Text and source */}
          <div className="grid gap-5 border border-black/12 p-5 md:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Heading</span>
              <input
                className={inputClass}
                value={form.heading}
                placeholder={DEFAULT_INSTAGRAM_SETTINGS.heading}
                onChange={(e) => set("heading", e.target.value)}
              />
              <span className={hintClass}>Title above the posts</span>
            </label>

            <label className="block">
              <span className={labelClass}>Instagram handle</span>
              <input
                className={inputClass}
                value={form.handle}
                placeholder="bxlack.official"
                onChange={(e) => set("handle", e.target.value.replace(/^@/, "").trim())}
              />
              <span className={hintClass}>
                {form.handle ? (
                  <a href={instagramUrl(form.handle)} target="_blank" rel="noopener noreferrer" className="underline">
                    {instagramUrl(form.handle)}
                  </a>
                ) : (
                  "Used for the Follow links and the footer icon"
                )}
              </span>
            </label>

            <label className="block">
              <span className={labelClass}>Follow tile text</span>
              <input
                className={inputClass}
                value={form.followText}
                placeholder={DEFAULT_INSTAGRAM_SETTINGS.followText}
                onChange={(e) => set("followText", e.target.value)}
              />
              <span className={hintClass}>Shown on the extra tile while there are fewer than 4 posts</span>
            </label>

            <label className="block">
              <span className={labelClass}>Posts to show</span>
              <select
                className={`${inputClass} [&>option]:bg-white`}
                value={form.maxPosts}
                onChange={(e) => set("maxPosts", Number(e.target.value))}
              >
                {POST_COUNT_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    Up to {n} ({n / 4} {n === 4 ? "row" : "rows"})
                  </option>
                ))}
              </select>
              <span className={hintClass}>Your Behold feed must include at least this many posts</span>
            </label>

            <label className="block md:col-span-2">
              <span className={labelClass}>Behold feed URL</span>
              <input
                className={inputClass}
                value={form.feedUrl}
                placeholder="https://feeds.behold.so/…"
                onChange={(e) => set("feedUrl", e.target.value.trim())}
              />
              <span className={`${hintClass} ${form.feedUrl && !isHttpsUrl(form.feedUrl) ? "text-red-600" : ""}`}>
                {form.feedUrl && !isHttpsUrl(form.feedUrl)
                  ? "Must be a full https:// link"
                  : "Behold → your feed → Feed URL. Feed type must be JSON."}
              </span>
            </label>
          </div>

          {/* Posts */}
          <div>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[14px] font-semibold text-neutral-900">Posts</p>
                <p className="mt-1 text-[12px] text-neutral-500">
                  {feed.data
                    ? `${onHomepage.size} of ${posts.length} shown on the homepage${
                        feed.data.username ? ` · from @${feed.data.username}` : ""
                      }. Click the eye to hide a post.`
                    : "Your latest Instagram posts from the feed above."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void feed.refetch()}
                disabled={!previewUrl || feed.isFetching}
                className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-500 hover:text-black disabled:opacity-40"
              >
                <RefreshCw size={12} className={feed.isFetching ? "animate-spin" : ""} /> Refresh
              </button>
            </div>

            {feed.data?.username && form.handle && feed.data.username !== form.handle ? (
              <p className="mt-3 border border-amber-500/30 bg-amber-50 px-4 py-2.5 text-[12px] text-amber-900">
                This feed is from @{feed.data.username}, but the handle above is @{form.handle}.
              </p>
            ) : null}

            <div className="mt-4">
              {!previewUrl ? (
                <p className="text-[13px] text-neutral-500">Add a feed URL to see your posts.</p>
              ) : feed.isPending ? (
                <p className="flex items-center gap-2 text-[13px] text-neutral-500">
                  <Loader2 size={14} className="animate-spin" /> Loading posts…
                </p>
              ) : feed.error ? (
                <p className="text-[13px] text-red-600">
                  Couldn't load the feed: {feed.error instanceof Error ? feed.error.message : "unknown error"}. Check
                  the URL in Behold.
                </p>
              ) : posts.length === 0 ? (
                <p className="text-[13px] text-neutral-500">
                  The feed has no posts yet. While it's empty, the section stays hidden on the homepage.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                  {posts.map((p) => {
                    const isHidden = hidden.has(p.id);
                    const shown = onHomepage.has(p.id);
                    return (
                      <div key={p.id} className="border border-black/12">
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative block aspect-square overflow-hidden bg-neutral-100"
                          title="Open on Instagram"
                        >
                          <img
                            src={p.image}
                            alt=""
                            loading="lazy"
                            className={`h-full w-full object-cover transition-opacity ${isHidden ? "opacity-30 grayscale" : ""}`}
                          />
                          {p.type !== "IMAGE" ? (
                            <span className="absolute right-2 top-2 text-white drop-shadow">
                              {p.type === "VIDEO" ? <Play size={14} className="fill-current" /> : <Copy size={14} />}
                            </span>
                          ) : null}
                        </a>
                        <div className="flex items-center justify-between gap-2 px-2.5 py-2">
                          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                            {isHidden ? "Hidden" : shown ? "On homepage" : "Over limit"}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleHidden(p.id)}
                            aria-label={isHidden ? "Show this post" : "Hide this post"}
                            title={isHidden ? "Show this post" : "Hide this post"}
                            className="p-1 text-neutral-500 hover:text-black"
                          >
                            {isHidden ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="border border-black/12 bg-neutral-50 p-5 text-[13px] leading-relaxed text-neutral-600">
            <p className="font-semibold text-neutral-900">How new posts arrive</p>
            <p className="mt-1">
              Posts come from your Behold feed, which picks up new Instagram posts automatically (about once a day on
              the free plan). To remove a post everywhere or change how many posts the feed holds, use{" "}
              <a href="https://app.behold.so/feeds" target="_blank" rel="noopener noreferrer" className="underline">
                Behold
              </a>
              .
            </p>
          </div>
        </>
      )}

      {/* Save bar */}
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

/** Trimmed copy with empty text falling back to the defaults, for saving and dirty checks. */
function normalize(s: InstagramSettings): InstagramSettings {
  const d = DEFAULT_INSTAGRAM_SETTINGS;
  return {
    enabled: s.enabled,
    heading: s.heading.trim() || d.heading,
    handle: s.handle.trim().replace(/^@/, ""),
    followText: s.followText.trim() || d.followText,
    feedUrl: s.feedUrl.trim(),
    maxPosts: s.maxPosts,
    hiddenPosts: [...new Set(s.hiddenPosts)].sort(),
  };
}
