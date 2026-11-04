import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertCan } from "@/lib/admin-guard";
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
    await assertCan(context.supabase, context.userId, "content");
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
    await assertCan(context.supabase, context.userId, "content");
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

/**
 * Sends one template, rendered with sample data and the saved wording, to a
 * test address. The Studio calls this once per email ("Send all" loops on the
 * client), so each request stays short and the admin sees per-email results.
 */
export const sendTestEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.enum(TEMPLATE_IDS), to: z.string().trim().email().max(255) }).parse(input),
  )
  .handler(async ({ data, context }): Promise<{ ok: boolean; error?: string; subject: string }> => {
    await assertCan(context.supabase, context.userId, "content");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendEmail } = await import("@/lib/email/send.server");
    const { emailCatalog } = await import("@/lib/email/catalog");
    const { SITE_URL } = await import("@/lib/seo");

    // Real product photos for the sample order, so thumbnails look like the real thing.
    const { data: products } = await supabaseAdmin
      .from("products")
      .select("card_image_path, image_path")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .limit(2);
    const images = (products ?? []).map((p) => {
      const path = p.card_image_path ?? p.image_path;
      return path ? supabaseAdmin.storage.from("product-images").getPublicUrl(path).data.publicUrl : null;
    });

    const { data: saved } = await supabaseAdmin.from("email_templates").select("*").eq("id", data.id).maybeSingle();
    const copy = saved
      ? Object.fromEntries(COPY_FIELDS.filter((f) => saved[f]).map((f) => [f, saved[f] as string]))
      : null;

    const preview = emailCatalog(images).find((e) => e.id === data.id)!;
    const email = preview.render(copy);
    // Supabase fills this link in real sends; point it somewhere harmless for the test.
    const html = email.html.replaceAll("{{ .ConfirmationURL }}", `${SITE_URL}/account`);
    const text = email.text.replaceAll("{{ .ConfirmationURL }}", `${SITE_URL}/account`);
    const subject = `[Test] ${email.subject}`;

    const result = await sendEmail(data.to, { subject, html, text });
    return result.ok ? { ok: true, subject } : { ok: false, error: result.error, subject };
  });

export const resetEmailTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.enum(TEMPLATE_IDS) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertCan(context.supabase, context.userId, "content");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("email_templates").delete().eq("id", data.id);
    if (error) throw new Error("Could not reset the template");
    return { ok: true };
  });
