import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertCallerIsAdmin } from "@/lib/admin-guard";
import {
  COPY_FIELDS,
  COPY_FIELD_LABELS,
  TEMPLATE_IDS,
  templateDef,
  unknownVariables,
  type TemplateCopy,
} from "@/lib/email/copy";

export type TemplateSetting = { enabled: boolean; copy: Partial<TemplateCopy>; updatedAt: string };

/** Saved edits for every template that has any, keyed by template id. */
export const listEmailTemplateSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Record<string, TemplateSetting>> => {
    await assertCallerIsAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("email_templates").select("*");
    if (error) throw new Error("Could not load email templates. Has the email_templates migration been run?");
    return Object.fromEntries(
      (data ?? []).map((r) => [
        r.id,
        {
          enabled: r.enabled,
          updatedAt: r.updated_at,
          copy: Object.fromEntries(COPY_FIELDS.filter((f) => r[f]).map((f) => [f, r[f] as string])),
        },
      ]),
    );
  });

const field = z.string().max(2000).nullable();

export const saveEmailTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.enum(TEMPLATE_IDS),
        enabled: z.boolean(),
        subject: field,
        heading: field,
        intro: field,
        button: z.string().max(60).nullable(),
        footer: field,
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertCallerIsAdmin(context.supabase, context.userId);
    const def = templateDef(data.id);

    // Only the variables this template fills are allowed — this also keeps
    // stranger-typed contact-form text out of the public auto-reply.
    for (const f of COPY_FIELDS) {
      const bad = unknownVariables(data[f] ?? "", def.variables);
      if (bad.length) {
        throw new Error(`${COPY_FIELD_LABELS[f]}: {{${bad[0]}}} isn't available in this email.`);
      }
    }

    const clean = (v: string | null) => (v && v.trim() ? v.trim() : null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("email_templates").upsert(
      {
        id: data.id,
        // Supabase sends the auth emails itself, so they can't be switched off here.
        enabled: def.supabase ? true : data.enabled,
        subject: clean(data.subject),
        heading: clean(data.heading),
        intro: clean(data.intro),
        button: clean(data.button),
        footer: clean(data.footer),
      },
      { onConflict: "id" },
    );
    if (error) throw new Error("Could not save the template");
    return { ok: true };
  });

export const resetEmailTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.enum(TEMPLATE_IDS) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertCallerIsAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("email_templates").delete().eq("id", data.id);
    if (error) throw new Error("Could not reset the template");
    return { ok: true };
  });
