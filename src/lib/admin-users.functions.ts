import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertCallerIsAdmin, assertCan, getStudioAccess, listAllUsers } from "@/lib/admin-guard";
import { PERMISSION_KEYS, type Permission, type StudioAccess, type StudioRole } from "@/lib/permissions";

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

/** The signed-in user's studio role and permissions (drives the sidebar). */
export const getMyStudioAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<StudioAccess> => getStudioAccess(context.supabase, context.userId));

export type AdminCustomer = {
  userId: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  instagram: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  orderCount: number;
  /** Sum of non-cancelled order totals. */
  totalSpent: number;
  isAdmin: boolean;
};

/** Every account registered on the site, newest first, with profile details
 * and order counts — auth.users is only reachable via the service-role client. */
export const listCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminCustomer[]> => {
    await assertCan(context.supabase, context.userId, "customers");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const users = await listAllUsers(supabaseAdmin);

    const [profilesRes, ordersRes, rolesRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name, phone, instagram"),
      supabaseAdmin.from("orders").select("user_id, total, status"),
      supabaseAdmin.from("user_roles").select("user_id").eq("role", "admin"),
    ]);
    if (profilesRes.error || ordersRes.error || rolesRes.error) {
      throw new Error("Could not load customer details");
    }

    const profiles = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
    const orderCounts = new Map<string, number>();
    const spent = new Map<string, number>();
    for (const o of ordersRes.data ?? []) {
      orderCounts.set(o.user_id, (orderCounts.get(o.user_id) ?? 0) + 1);
      if (o.status !== "cancelled") {
        spent.set(o.user_id, (spent.get(o.user_id) ?? 0) + Number(o.total));
      }
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
          totalSpent: spent.get(u.id) ?? 0,
          isAdmin: admins.has(u.id),
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });

// ---------------------------------------------------------------------------
// Staff & permissions (admin only)
// ---------------------------------------------------------------------------

export type StaffMember = {
  userId: string;
  email: string;
  role: StudioRole;
  permissions: Permission[];
  addedAt: string;
  lastSignInAt: string | null;
};

const cleanPermissions = (list: string[] | null | undefined) =>
  (list ?? []).filter((p): p is Permission => (PERMISSION_KEYS as string[]).includes(p));

export const listStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<StaffMember[]> => {
    await assertCallerIsAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [rolesRes, staffRes] = await Promise.all([
      supabaseAdmin.from("user_roles").select("user_id, created_at").eq("role", "admin"),
      supabaseAdmin.from("staff_members").select("user_id, permissions, created_at"),
    ]);
    if (rolesRes.error) throw new Error("Could not load admins");
    if (staffRes.error) throw new Error("Could not load staff. Has the staff_permissions migration been run?");

    const users = new Map((await listAllUsers(supabaseAdmin)).map((u) => [u.id, u]));
    const adminIds = new Set((rolesRes.data ?? []).map((r) => r.user_id));
    const describe = (userId: string, role: StudioRole, permissions: Permission[], addedAt: string): StaffMember => ({
      userId,
      email: users.get(userId)?.email ?? "unknown",
      role,
      permissions,
      addedAt,
      lastSignInAt: users.get(userId)?.last_sign_in_at ?? null,
    });

    return [
      ...(rolesRes.data ?? []).map((r) => describe(r.user_id, "admin", [...PERMISSION_KEYS], r.created_at)),
      ...(staffRes.data ?? [])
        .filter((s) => !adminIds.has(s.user_id))
        .map((s) => describe(s.user_id, "staff", cleanPermissions(s.permissions), s.created_at)),
    ].sort((a, b) => (a.role === b.role ? a.email.localeCompare(b.email) : a.role === "admin" ? -1 : 1));
  });

const saveStaffSchema = z
  .object({
    /** Existing member being edited; null to add someone new. */
    userId: z.string().uuid().nullable(),
    email: z.string().trim().email().max(255).nullable(),
    /** Only used when a brand-new account is created. */
    password: z.string().min(8).max(72).nullable(),
    role: z.enum(["admin", "staff"]),
    permissions: z.array(z.enum(PERMISSION_KEYS as [Permission, ...Permission[]])).max(PERMISSION_KEYS.length),
  })
  .refine((d) => d.role === "admin" || d.permissions.length > 0, {
    message: "Give staff access to at least one section",
  })
  .refine((d) => d.userId || d.email, { message: "Enter an email address" });

/** Adds a staff member or admin (creating the account if needed), or changes
 * an existing member's role and permissions. */
export const saveStaffMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => saveStaffSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertCallerIsAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let userId = data.userId;
    let created = false;
    if (!userId) {
      const email = data.email!.toLowerCase();
      const existing = (await listAllUsers(supabaseAdmin)).find((u) => u.email?.toLowerCase() === email);
      if (existing) {
        userId = existing.id;
      } else {
        if (!data.password) throw new Error("Set a temporary password for the new account (8+ characters)");
        const { data: made, error } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: data.password,
          email_confirm: true,
        });
        if (error || !made.user) throw new Error(error?.message ?? "Could not create account");
        userId = made.user.id;
        created = true;
      }
    }

    const { data: adminRows } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "admin");
    const admins = new Set((adminRows ?? []).map((r) => r.user_id));

    if (data.role === "admin") {
      if (!admins.has(userId)) {
        const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "admin" });
        if (error) throw new Error("Could not grant admin access");
      }
      await supabaseAdmin.from("staff_members").delete().eq("user_id", userId);
    } else {
      if (userId === context.userId) throw new Error("You can't remove your own admin access.");
      if (admins.has(userId) && admins.size <= 1) throw new Error("The store needs at least one admin.");
      const { error } = await supabaseAdmin
        .from("staff_members")
        .upsert({ user_id: userId, permissions: data.permissions }, { onConflict: "user_id" });
      if (error) throw new Error("Could not save staff permissions");
      if (admins.has(userId)) {
        await supabaseAdmin.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
      }
    }
    return { ok: true, created };
  });

/** Revokes studio access. The person's account (and any orders) is kept, so
 * they can still shop as a customer. */
export const removeStaffMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertCallerIsAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) throw new Error("You can't remove your own access.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: adminRows } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "admin");
    const admins = new Set((adminRows ?? []).map((r) => r.user_id));
    if (admins.has(data.userId) && admins.size <= 1) throw new Error("The store needs at least one admin.");

    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).eq("role", "admin");
    await supabaseAdmin.from("staff_members").delete().eq("user_id", data.userId);
    return { ok: true };
  });