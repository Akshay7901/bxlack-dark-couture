import { supabase } from "@/integrations/supabase/client";
import { resolvePage, type PageContentMap, type PageSlug } from "@/lib/pages/content";

/**
 * Loads a page's saved content (public read). Falls back to the default copy
 * when nothing is saved, the row is invalid, or the table doesn't exist yet,
 * so a page always renders.
 */
export async function loadPage<K extends PageSlug>(slug: K): Promise<PageContentMap[K]> {
  try {
    const { data } = await supabase.from("site_pages").select("content").eq("slug", slug).maybeSingle();
    return resolvePage(slug, data?.content ?? null);
  } catch {
    return resolvePage(slug, null);
  }
}

/** When each page was last edited (null = still the default copy). */
export async function loadPageEditTimes(): Promise<Partial<Record<PageSlug, string>>> {
  const { data, error } = await supabase.from("site_pages").select("slug, updated_at");
  if (error) throw new Error("Could not load pages. Has the site_pages migration been run?");
  return Object.fromEntries((data ?? []).map((r) => [r.slug, r.updated_at]));
}
