import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SITE_URL } from "@/lib/seo";

/** Public pages that always exist. */
const STATIC_PATHS = [
  "/",
  "/shop",
  "/new-drop",
  "/lookbook",
  "/about",
  "/journal",
  "/size-guide",
  "/shipping",
  "/returns",
  "/faq",
  "/contact",
  "/privacy",
  "/terms",
];

const xmlEscape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!);

/**
 * /sitemap.xml, built from the live catalogue: every public page, every
 * visible category collection and every published product, so new products
 * reach Google without anyone editing a file.
 */
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const urls: { loc: string; lastmod?: string }[] = STATIC_PATHS.map((p) => ({ loc: `${SITE_URL}${p}` }));

        // Public reads (published products / visible categories only, via RLS).
        const [products, categories] = await Promise.all([
          supabase.from("products").select("slug, updated_at").eq("published", true),
          supabase.from("categories").select("key").eq("visible", true),
        ]);
        for (const c of categories.data ?? []) {
          urls.push({ loc: `${SITE_URL}/shop?type=${encodeURIComponent(c.key)}` });
        }
        for (const p of products.data ?? []) {
          urls.push({ loc: `${SITE_URL}/product/${encodeURIComponent(p.slug)}`, lastmod: p.updated_at?.slice(0, 10) });
        }

        const body =
          `<?xml version="1.0" encoding="UTF-8"?>\n` +
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
          urls
            .map(
              (u) =>
                `  <url><loc>${xmlEscape(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`,
            )
            .join("\n") +
          `\n</urlset>\n`;

        return new Response(body, {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=0, s-maxage=3600",
          },
        });
      },
    },
  },
});
