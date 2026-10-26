import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/** Throws unless the signed-in caller has the admin role. */
export async function assertCallerIsAdmin(supabase: SupabaseClient<Database>, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
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
