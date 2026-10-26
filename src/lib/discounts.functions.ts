import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertCallerIsAdmin } from "@/lib/admin-guard";

export type DiscountCode = {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrder: number;
  maxUses: number | null;
  usedCount: number;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
};

export const listDiscountCodes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DiscountCode[]> => {
    await assertCallerIsAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("discount_codes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error("Could not load discount codes");
    return (data ?? []).map((d) => ({
      id: d.id,
      code: d.code,
      type: d.type as DiscountCode["type"],
      value: Number(d.value),
      minOrder: Number(d.min_order),
      maxUses: d.max_uses,
      usedCount: d.used_count,
      startsAt: d.starts_at,
      endsAt: d.ends_at,
      active: d.active,
    }));
  });

const saveSchema = z
  .object({
    id: z.string().uuid().nullable(),
    code: z
      .string()
      .trim()
      .min(2)
      .max(40)
      .regex(/^[A-Za-z0-9_-]+$/, "Use letters, numbers, - or _ only")
      .transform((c) => c.toUpperCase()),
    type: z.enum(["percent", "fixed"]),
    value: z.number().positive(),
    minOrder: z.number().min(0),
    maxUses: z.number().int().positive().nullable(),
    startsAt: z.string().datetime().nullable(),
    endsAt: z.string().datetime().nullable(),
    active: z.boolean(),
  })
  .refine((d) => d.type !== "percent" || d.value <= 100, {
    message: "A percentage discount can't be more than 100%",
  });

export const saveDiscountCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => saveSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertCallerIsAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const row = {
      code: data.code,
      type: data.type,
      value: data.value,
      min_order: data.minOrder,
      max_uses: data.maxUses,
      starts_at: data.startsAt,
      ends_at: data.endsAt,
      active: data.active,
    };
    const { error } = data.id
      ? await supabaseAdmin.from("discount_codes").update(row).eq("id", data.id)
      : await supabaseAdmin.from("discount_codes").insert(row);
    if (error) {
      if (error.code === "23505") throw new Error(`The code ${data.code} already exists`);
      throw new Error("Could not save discount code");
    }
    return { ok: true };
  });

export const deleteDiscountCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertCallerIsAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("discount_codes").delete().eq("id", data.id);
    if (error) throw new Error("Could not delete discount code");
    return { ok: true };
  });
