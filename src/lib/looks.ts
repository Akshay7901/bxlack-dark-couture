import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { publicStorageUrls, toCardProduct, type CatalogProductWithUrls } from "@/lib/catalog";
import type { Product } from "@/lib/products";

/**
 * Homepage "Try the Look": a lineup of full-body looks. Hovering one brings it
 * forward; clicking opens the pieces it's wearing. Edited in Studio → Store →
 * Looks and stored in store_settings under "looks".
 */
export type Look = {
  id: string;
  name: string;
  /** product-images storage path; a cut-out PNG/WebP on a transparent background works best. */
  image: string;
  /** Product ids (uuid) worn in the look, in the order shown. */
  productIds: string[];
};

export type LooksSettings = {
  enabled: boolean;
  heading: string;
  subheading: string;
  looks: Look[];
};

export const MAX_LOOKS = 8;

export const DEFAULT_LOOKS_SETTINGS: LooksSettings = {
  enabled: true,
  heading: "Try the Look",
  subheading: "Pick a look to see what it's wearing",
  looks: [],
};

const SETTINGS_KEY = "looks";

const text = (v: unknown, fallback: string) => (typeof v === "string" && v.trim() ? v.trim() : fallback);

function resolveSettings(saved: unknown): LooksSettings {
  const d = DEFAULT_LOOKS_SETTINGS;
  if (!saved || typeof saved !== "object") return d;
  const s = saved as Partial<Record<keyof LooksSettings, unknown>>;
  const looks = Array.isArray(s.looks)
    ? s.looks
        .filter((l): l is Record<string, unknown> => !!l && typeof l === "object")
        .map((l) => ({
          id: typeof l.id === "string" ? l.id : crypto.randomUUID(),
          name: typeof l.name === "string" ? l.name : "",
          image: typeof l.image === "string" ? l.image : "",
          productIds: Array.isArray(l.productIds) ? l.productIds.filter((p): p is string => typeof p === "string") : [],
        }))
        .slice(0, MAX_LOOKS)
    : [];
  return {
    enabled: typeof s.enabled === "boolean" ? s.enabled : d.enabled,
    heading: text(s.heading, d.heading),
    subheading: typeof s.subheading === "string" ? s.subheading.trim() : d.subheading,
    looks,
  };
}

/** Thrown to the admin when the store_settings migration hasn't been run yet. */
export class LooksTableMissing extends Error {}

function isMissingTable(error: { code?: string; message?: string }) {
  const message = error.message ?? "";
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (/store_settings/.test(message) && /not find|does not exist/.test(message))
  );
}

export async function fetchLooksSettingsStrict(): Promise<LooksSettings> {
  const { data, error } = await supabase.from("store_settings").select("value").eq("key", SETTINGS_KEY).maybeSingle();
  if (error) {
    if (isMissingTable(error)) throw new LooksTableMissing(error.message);
    throw error;
  }
  return resolveSettings(data?.value);
}

export async function saveLooksSettings(settings: LooksSettings) {
  const { error } = await supabase.from("store_settings").upsert({ key: SETTINGS_KEY, value: settings as unknown as Json });
  if (error) {
    if (isMissingTable(error)) throw new LooksTableMissing(error.message);
    throw error;
  }
}

export function useLooksSettingsAdmin() {
  return useQuery({
    queryKey: ["looks-settings", "admin"],
    queryFn: fetchLooksSettingsStrict,
    retry: (count, e) => !(e instanceof LooksTableMissing) && count < 2,
  });
}

export function lookImageUrl(path: string): string {
  if (!path) return "";
  return publicStorageUrls([path])[path] ?? "";
}

/** What the homepage renders: each look with its image URL and the published products it wears. */
export type HomeLook = { id: string; name: string; image: string; products: Product[] };
export type HomeLooks = { heading: string; subheading: string; looks: HomeLook[] };

/**
 * For the homepage loader. Looks without an image or without any published
 * product are left out; the section is null when nothing is left or it's off.
 */
export async function loadHomeLooks(products: CatalogProductWithUrls[]): Promise<HomeLooks | null> {
  let settings: LooksSettings;
  try {
    settings = await fetchLooksSettingsStrict();
  } catch {
    return null;
  }
  if (!settings.enabled) return null;
  const byId = new Map(products.map((p) => [p.id, p]));
  const urls = publicStorageUrls(settings.looks.map((l) => l.image));
  const looks = settings.looks
    .map((l) => ({
      id: l.id,
      name: l.name.trim(),
      image: urls[l.image] ?? "",
      products: l.productIds
        .map((id) => byId.get(id))
        .filter((p): p is CatalogProductWithUrls => !!p)
        .map(toCardProduct),
    }))
    .filter((l) => l.image && l.products.length > 0);
  if (looks.length === 0) return null;
  return { heading: settings.heading, subheading: settings.subheading, looks };
}
