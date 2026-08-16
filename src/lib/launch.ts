import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = {
  coming_soon_enabled: boolean;
  launch_at: string | null;
  headline: string;
  subheading: string;
};

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("coming_soon_enabled, launch_at, headline, subheading")
    .eq("id", true)
    .single();
  if (error) throw error;
  return data;
}

export async function updateSiteSettings(input: Partial<SiteSettings>): Promise<void> {
  const { error } = await supabase.from("site_settings").update(input).eq("id", true);
  if (error) throw error;
}

/** Never resolves the actual password client-side — checked server-side via a
 * SECURITY DEFINER SQL function that only ever returns true/false. */
export async function verifyLaunchPassword(candidate: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("verify_launch_password", { candidate });
  if (error) throw error;
  return data === true;
}

export async function updateLaunchPassword(newPassword: string): Promise<void> {
  const { error } = await supabase.rpc("update_launch_password", { new_password: newPassword });
  if (error) throw error;
}

export async function joinWaitlist(email: string): Promise<void> {
  const { error } = await supabase.from("waitlist_signups").insert({ email });
  if (error) {
    if (error.code === "23505") throw new Error("You're already on the list.");
    throw error;
  }
}

export type WaitlistEntry = { id: string; email: string; created_at: string };

export async function fetchWaitlist(): Promise<WaitlistEntry[]> {
  const { data, error } = await supabase
    .from("waitlist_signups")
    .select("id, email, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function removeWaitlistEntry(id: string): Promise<void> {
  const { error } = await supabase.from("waitlist_signups").delete().eq("id", id);
  if (error) throw error;
}
