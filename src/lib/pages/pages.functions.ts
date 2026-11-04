import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertCan } from "@/lib/admin-guard";
import { PAGE_SCHEMAS, PAGE_SLUGS } from "@/lib/pages/content";

/** Saves a page's content after validating it against that page's structure. */
export const savePageContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ slug: z.enum(PAGE_SLUGS), content: z.unknown() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertCan(context.supabase, context.userId, "content");
    const parsed = PAGE_SCHEMAS[data.slug].safeParse(data.content);
    if (!parsed.success) {
      throw new Error(`Some text is too long or missing: ${parsed.error.issues[0]?.path.join(" › ") || "check the fields"}`);
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("site_pages")
      .upsert({ slug: data.slug, content: parsed.data as never }, { onConflict: "slug" });
    if (error) throw new Error("Could not save the page. Has the site_pages migration been run?");
    return { ok: true };
  });

/** Removes saved edits so the page shows its original copy again. */
export const resetPageContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ slug: z.enum(PAGE_SLUGS) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertCan(context.supabase, context.userId, "content");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("site_pages").delete().eq("slug", data.slug);
    if (error) throw new Error("Could not reset the page");
    return { ok: true };
  });
