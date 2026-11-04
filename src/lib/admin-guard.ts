import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { PERMISSION_KEYS, type Permission, type StudioAccess } from "@/lib/permissions";

/** The caller's studio role and permissions, read with their own (RLS) client. */
export async function getStudioAccess(supabase: SupabaseClient<Database>, userId: string): Promise<StudioAccess> {
  const { data: admin } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (admin) return { role: "admin", permissions: [...PERMISSION_KEYS] };

  const { data: staff } = await supabase
    .from("staff_members")
    .select("permissions")
    .eq("user_id", userId)
    .maybeSingle();
  if (staff) {
    return {
      role: "staff",
      permissions: (staff.permissions ?? []).filter((p): p is Permission =>
        (PERMISSION_KEYS as string[]).includes(p),
      ),
    };
  }
  return { role: null, permissions: [] };
}

/** What requireSupabaseAuth puts on a server function's context. */
export type StudioCaller = {
  supabase: SupabaseClient<Database>;
  userId: string;
  claims?: { aal?: unknown } | null;
};

/**
 * Studio accounts must pass two-step verification. Set STUDIO_MFA_OPTIONAL=true
 * in Vercel only as an emergency switch (e.g. the last admin lost their
 * authenticator), then remove it once their two-step verification is reset.
 */
export const studioMfaRequired = () => process.env.STUDIO_MFA_OPTIONAL !== "true";

export const MFA_REQUIRED_MESSAGE =
  "Two-step verification is required. Sign in again and enter the code from your authenticator app.";

function assertMfa(caller: StudioCaller) {
  if (studioMfaRequired() && caller.claims?.aal !== "aal2") throw new Error(MFA_REQUIRED_MESSAGE);
}

/** Throws unless the signed-in caller has the admin role (and a two-step verified session). */
export async function assertCallerIsAdmin(caller: StudioCaller) {
  const access = await getStudioAccess(caller.supabase, caller.userId);
  if (access.role !== "admin") throw new Error("Forbidden");
  assertMfa(caller);
}

/** Throws unless the caller is an admin, or staff holding this permission (with a two-step verified session). */
export async function assertCan(caller: StudioCaller, permission: Permission) {
  const access = await getStudioAccess(caller.supabase, caller.userId);
  if (access.role !== "admin" && !access.permissions.includes(permission)) {
    throw new Error("You don't have access to this section. Ask an admin to grant it.");
  }
  assertMfa(caller);
  return access;
}

/** Every auth user, paging through the admin API (it caps each page). */
export async function listAllUsers(admin: SupabaseClient<Database>): Promise<User[]> {
  const users: User[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error("Could not load users");
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }
  return users;
}

/** Turns the prefixed exceptions raised by our SQL functions into readable messages. */
export function friendlyDbError(message: string | undefined, fallback: string): string {
  if (!message) return fallback;
  const discount = message.match(/DISCOUNT:(.*)$/);
  if (discount) return discount[1].trim();
  const stock = message.match(/OUT_OF_STOCK:(.*)$/);
  if (stock) return `Sorry, ${stock[1].trim()} just sold out. Please update your bag.`;
  return fallback;
}
