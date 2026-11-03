import { publicStorageUrls } from "@/lib/catalog";
import { fetchStoreSetting, saveStoreSetting, textOr } from "@/lib/storeSettings";

/**
 * Homepage hero, edited in Studio → Store → Homepage hero and stored in
 * store_settings under "hero".
 *  - lights-out: the page opens dark; the cursor (or finger) is a torch that
 *    lights up the campaign image, then the lights come on.
 *  - classic: the original front/back reveal.
 */
export type HeroStyle = "lights-out" | "classic";

export type HeroSettings = {
  style: HeroStyle;
  /** Uploaded image in the product-images bucket; null = the built-in campaign photo. */
  imagePath: string | null;
  eyebrow: string;
  title: string;
  hint: string;
  ctaLabel: string;
  ctaLink: string;
  /** Lights come on by themselves this many seconds after the visitor starts exploring; 0 = only on click. */
  autoRevealSeconds: number;
};

export const HERO_STYLES: { key: HeroStyle; label: string; description: string }[] = [
  {
    key: "lights-out",
    label: "Lights Out",
    description: "Opens in darkness. The cursor or finger is a torch that reveals the image, then the lights come on.",
  },
  { key: "classic", label: "Classic", description: "The campaign photo with the front/back print reveal under the cursor." },
];

export const AUTO_REVEAL_OPTIONS = [0, 5, 8, 12] as const;

export const DEFAULT_HERO_SETTINGS: HeroSettings = {
  style: "lights-out",
  imagePath: null,
  eyebrow: "SS2026 · Out now",
  title: "Find it in the dark.",
  hint: "Move to light it up",
  ctaLabel: "Shop the drop",
  ctaLink: "/new-drop",
  autoRevealSeconds: 8,
};

const SETTINGS_KEY = "hero";

/** Internal paths ("/new-drop") or full https links only. */
export const isValidCtaLink = (s: string) => /^\/(?!\/)\S*$/.test(s) || /^https:\/\/\S+$/.test(s);

export function resolveHeroSettings(saved: unknown): HeroSettings {
  const d = DEFAULT_HERO_SETTINGS;
  if (!saved || typeof saved !== "object") return d;
  const s = saved as Partial<Record<keyof HeroSettings, unknown>>;
  const link = textOr(s.ctaLink, d.ctaLink);
  return {
    style: HERO_STYLES.some((h) => h.key === s.style) ? (s.style as HeroStyle) : d.style,
    imagePath: typeof s.imagePath === "string" && s.imagePath ? s.imagePath : null,
    eyebrow: typeof s.eyebrow === "string" ? s.eyebrow.trim() : d.eyebrow,
    title: textOr(s.title, d.title),
    hint: textOr(s.hint, d.hint),
    ctaLabel: textOr(s.ctaLabel, d.ctaLabel),
    ctaLink: isValidCtaLink(link) ? link : d.ctaLink,
    autoRevealSeconds: AUTO_REVEAL_OPTIONS.includes(s.autoRevealSeconds as 0)
      ? (s.autoRevealSeconds as number)
      : d.autoRevealSeconds,
  };
}

export type HeroData = HeroSettings & { imageUrl: string | null };

const withImageUrl = (s: HeroSettings): HeroData => ({
  ...s,
  imageUrl: s.imagePath ? (publicStorageUrls([s.imagePath])[s.imagePath] ?? null) : null,
});

/** Admin: surfaces a missing table (SettingsTableMissing) instead of hiding it. */
export async function fetchHeroSettingsStrict(): Promise<HeroData> {
  return withImageUrl(resolveHeroSettings(await fetchStoreSetting(SETTINGS_KEY)));
}

/** Storefront (homepage loader): the defaults when nothing is saved or anything fails. */
export async function loadHeroSettings(): Promise<HeroData> {
  try {
    return await fetchHeroSettingsStrict();
  } catch {
    return withImageUrl(DEFAULT_HERO_SETTINGS);
  }
}

export async function saveHeroSettings(settings: HeroSettings) {
  const { style, imagePath, eyebrow, title, hint, ctaLabel, ctaLink, autoRevealSeconds } = settings;
  await saveStoreSetting(SETTINGS_KEY, { style, imagePath, eyebrow, title, hint, ctaLabel, ctaLink, autoRevealSeconds });
}
