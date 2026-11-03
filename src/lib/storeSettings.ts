import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

/**
 * Small storefront settings edited in Studio, one JSON value per key in the
 * store_settings table (e.g. "instagram", "hero"). Anyone can read; staff with
 * the "content" permission can write.
 */

/** Thrown to the admin when the store_settings migration hasn't been run yet. */
export class SettingsTableMissing extends Error {}

function isMissingTable(error: { code?: string; message?: string }) {
  const message = error.message ?? "";
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (/store_settings/.test(message) && /not find|does not exist/.test(message))
  );
}

/** The saved value for a key (null when nothing is saved). Throws SettingsTableMissing before the migration. */
export async function fetchStoreSetting(key: string): Promise<unknown> {
  const { data, error } = await supabase.from("store_settings").select("value").eq("key", key).maybeSingle();
  if (error) {
    if (isMissingTable(error)) throw new SettingsTableMissing(error.message);
    throw error;
  }
  return data?.value ?? null;
}

export async function saveStoreSetting(key: string, value: unknown) {
  const { error } = await supabase.from("store_settings").upsert({ key, value: value as Json });
  if (error) {
    if (isMissingTable(error)) throw new SettingsTableMissing(error.message);
    throw error;
  }
}

/** Trimmed text, or the fallback when it's missing or blank. */
export const textOr = (v: unknown, fallback: string) => (typeof v === "string" && v.trim() ? v.trim() : fallback);
