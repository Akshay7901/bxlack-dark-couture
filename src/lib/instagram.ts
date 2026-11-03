import { useQuery } from "@tanstack/react-query";
import { SettingsTableMissing, fetchStoreSetting, saveStoreSetting, textOr } from "@/lib/storeSettings";

export { SettingsTableMissing };

/**
 * Homepage Instagram section. Posts come from a behold.so JSON feed; what's
 * shown (on/off, layout, heading, handle, post count, hidden posts) is edited in
 * Studio → Store → Instagram and stored in store_settings under "instagram".
 */
export type InstagramLayout = "grid" | "slider" | "mosaic" | "marquee" | "strip";

/** Homepage designs to choose from. Below minPosts a layout falls back to the grid. */
export const INSTAGRAM_LAYOUTS: { key: InstagramLayout; label: string; description: string; minPosts: number }[] = [
  { key: "grid", label: "Grid", description: "Square tiles in rows of four", minPosts: 1 },
  { key: "slider", label: "Slider", description: "Swipeable portrait cards with captions", minPosts: 1 },
  { key: "mosaic", label: "Editorial mosaic", description: "Latest post large, the rest beside it", minPosts: 5 },
  { key: "marquee", label: "Marquee", description: "Endless auto-scrolling strip, pauses on hover", minPosts: 4 },
  { key: "strip", label: "Full-width strip", description: "One edge-to-edge row with a follow card on top", minPosts: 3 },
];

/** The layout the homepage actually uses for this many posts. */
export function effectiveLayout(layout: InstagramLayout, postCount: number): InstagramLayout {
  const min = INSTAGRAM_LAYOUTS.find((l) => l.key === layout)?.minPosts ?? 1;
  return postCount >= min ? layout : "grid";
}

export type InstagramSettings = {
  enabled: boolean;
  layout: InstagramLayout;
  heading: string;
  handle: string;
  followText: string;
  feedUrl: string;
  maxPosts: number;
  /** Post ids the admin chose not to show. */
  hiddenPosts: string[];
};

export const POST_COUNT_OPTIONS = [4, 8, 12] as const;

export const DEFAULT_INSTAGRAM_SETTINGS: InstagramSettings = {
  enabled: true,
  layout: "grid",
  heading: "On Instagram",
  handle: "bxlack.official",
  followText: "Follow the darkness",
  feedUrl: "https://feeds.behold.so/1EMrOc8yNyygDDvdZxXn",
  maxPosts: 8,
  hiddenPosts: [],
};

export const instagramUrl = (handle: string) => `https://www.instagram.com/${handle.replace(/^@/, "")}/`;

const SETTINGS_KEY = "instagram";

/** Saved values over the defaults, ignoring anything malformed. */
function resolveSettings(saved: unknown): InstagramSettings {
  const d = DEFAULT_INSTAGRAM_SETTINGS;
  if (!saved || typeof saved !== "object") return d;
  const s = saved as Partial<Record<keyof InstagramSettings, unknown>>;
  const text = textOr;
  return {
    enabled: typeof s.enabled === "boolean" ? s.enabled : d.enabled,
    layout: INSTAGRAM_LAYOUTS.some((l) => l.key === s.layout) ? (s.layout as InstagramLayout) : d.layout,
    heading: text(s.heading, d.heading),
    handle: text(s.handle, d.handle).replace(/^@/, ""),
    followText: text(s.followText, d.followText),
    feedUrl: text(s.feedUrl, d.feedUrl),
    maxPosts: POST_COUNT_OPTIONS.includes(s.maxPosts as 4) ? (s.maxPosts as number) : d.maxPosts,
    hiddenPosts: Array.isArray(s.hiddenPosts) ? s.hiddenPosts.filter((id) => typeof id === "string") : [],
  };
}

/** Admin: surfaces a missing table instead of hiding it. */
export async function fetchInstagramSettingsStrict(): Promise<InstagramSettings> {
  return resolveSettings(await fetchStoreSetting(SETTINGS_KEY));
}

/** Storefront: the defaults when nothing is saved or the table doesn't exist yet. */
async function fetchInstagramSettings(): Promise<InstagramSettings> {
  try {
    return await fetchInstagramSettingsStrict();
  } catch {
    return DEFAULT_INSTAGRAM_SETTINGS;
  }
}

export async function saveInstagramSettings(settings: InstagramSettings) {
  await saveStoreSetting(SETTINGS_KEY, settings);
}

export function useInstagramSettings() {
  return useQuery({
    queryKey: ["instagram-settings"],
    queryFn: fetchInstagramSettings,
    staleTime: 5 * 60_000,
    placeholderData: DEFAULT_INSTAGRAM_SETTINGS,
  });
}

type BeholdSize = { width: number; height: number; mediaUrl: string };

type BeholdPost = {
  id: string;
  permalink: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  mediaUrl?: string;
  thumbnailUrl?: string;
  prunedCaption?: string;
  caption?: string;
  timestamp?: string;
  visibility?: string;
  sizes?: Partial<Record<"small" | "medium" | "large" | "full", BeholdSize>>;
};

export type InstagramPost = {
  id: string;
  url: string;
  image: string;
  caption: string;
  type: BeholdPost["mediaType"];
  timestamp: string | null;
};

export type InstagramFeed = { username: string | null; posts: InstagramPost[] };

export async function fetchInstagramFeed(feedUrl: string): Promise<InstagramFeed> {
  const res = await fetch(feedUrl);
  if (!res.ok) throw new Error(`The feed answered ${res.status}`);
  const data = (await res.json()) as { username?: string; posts?: BeholdPost[] };
  if (!Array.isArray(data.posts)) throw new Error("That link isn't a Behold JSON feed");
  return {
    username: data.username ?? null,
    posts: data.posts
      .filter((p) => p.visibility !== "hidden")
      .map((p) => ({
        id: p.id,
        url: p.permalink,
        // Behold's resized copies are stable; Instagram's own CDN links expire.
        image: p.sizes?.medium?.mediaUrl ?? p.thumbnailUrl ?? p.mediaUrl ?? "",
        caption: (p.prunedCaption ?? p.caption ?? "").trim(),
        type: p.mediaType,
        timestamp: p.timestamp ?? null,
      }))
      .filter((p) => p.image),
  };
}

export function useInstagramFeed(feedUrl: string | null) {
  return useQuery({
    queryKey: ["instagram-feed", feedUrl],
    queryFn: () => fetchInstagramFeed(feedUrl!),
    enabled: !!feedUrl,
    staleTime: 30 * 60_000,
    retry: 1,
  });
}

/** What the homepage shows: settings plus the posts left after hiding and trimming. */
export function useInstagramSection() {
  const settingsQuery = useInstagramSettings();
  const settings = settingsQuery.data ?? DEFAULT_INSTAGRAM_SETTINGS;
  // Wait for the saved settings so a changed feed URL isn't fetched twice.
  const ready = !settingsQuery.isPlaceholderData && settings.enabled;
  const feed = useInstagramFeed(ready ? settings.feedUrl : null);
  const hidden = new Set(settings.hiddenPosts);
  const posts = (feed.data?.posts ?? []).filter((p) => !hidden.has(p.id)).slice(0, settings.maxPosts);
  return {
    settings,
    posts,
    isPending: settingsQuery.isPlaceholderData || (ready && feed.isPending),
    hiddenSection: !settingsQuery.isPlaceholderData && !settings.enabled,
  };
}
