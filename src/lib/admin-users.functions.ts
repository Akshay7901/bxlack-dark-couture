import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const credentialsSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
});

export const hasAnyAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count, error } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");
  if (error) throw new Error("Could not check admin status");
  return { hasAdmin: (count ?? 0) > 0 };
});

/**
 * One-time bootstrap: creates the very first admin account.
 * Closes itself permanently as soon as one admin exists.
 */
export const bootstrapFirstAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => credentialsSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count, error: countError } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if (countError) throw new Error("Could not check admin status");
    if ((count ?? 0) > 0) throw new Error("An admin already exists. Ask them to invite you.");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (error || !created.user) throw new Error(error?.message ?? "Could not create account");

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.user.id, role: "admin" });
    if (roleError) throw new Error("Account created but admin role failed. Contact support.");

    return { ok: true };
  });

async function assertCallerIsAdmin(supabase: unknown, userId: string) {
  const client = supabase as {
    from: (table: string) => any;
  };
  const { data } = await client
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}

export const listAdmins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertCallerIsAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: roles, error } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, created_at")
      .eq("role", "admin");
    if (error) throw new Error("Could not load admins");

    const { data: users } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const emails = new Map((users?.users ?? []).map((u) => [u.id, u.email ?? ""]));

    return (roles ?? []).map((r) => ({
      userId: r.user_id,
      email: emails.get(r.user_id) ?? "unknown",
      createdAt: r.created_at,
    }));
  });

export type AdminCustomer = {
  userId: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  instagram: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  orderCount: number;
  isAdmin: boolean;
};

/** Every account registered on the site, newest first, with profile details
 * and order counts — auth.users is only reachable via the service-role client. */
export const listCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminCustomer[]> => {
    await assertCallerIsAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const users = [];
    for (let page = 1; ; page++) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw new Error("Could not load users");
      users.push(...data.users);
      if (data.users.length < 1000) break;
    }

    const [profilesRes, ordersRes, rolesRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name, phone, instagram"),
      supabaseAdmin.from("orders").select("user_id"),
      supabaseAdmin.from("user_roles").select("user_id").eq("role", "admin"),
    ]);
    if (profilesRes.error || ordersRes.error || rolesRes.error) {
      throw new Error("Could not load customer details");
    }

    const profiles = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
    const orderCounts = new Map<string, number>();
    for (const o of ordersRes.data ?? []) {
      orderCounts.set(o.user_id, (orderCounts.get(o.user_id) ?? 0) + 1);
    }
    const admins = new Set((rolesRes.data ?? []).map((r) => r.user_id));

    return users
      .map((u) => {
        const profile = profiles.get(u.id);
        return {
          userId: u.id,
          email: u.email ?? "unknown",
          fullName: profile?.full_name ?? null,
          phone: profile?.phone ?? null,
          instagram: profile?.instagram ?? null,
          createdAt: u.created_at,
          lastSignInAt: u.last_sign_in_at ?? null,
          orderCount: orderCounts.get(u.id) ?? 0,
          isAdmin: admins.has(u.id),
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });

export const createAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => credentialsSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertCallerIsAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (error || !created.user) throw new Error(error?.message ?? "Could not create account");

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.user.id, role: "admin" });
    if (roleError) throw new Error("Account created but admin role failed.");

    return { ok: true, email: data.email };
  });

export const removeAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertCallerIsAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) throw new Error("You cannot remove your own admin access.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    return { ok: true };
  });