export const SITE_URL = "https://bxlack-dark-couture.vercel.app";
export const SITE_NAME = "BXLACK";

/** 1200×630 share image served from /public. */
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

type SeoInput = {
  /** Full page title, e.g. "Shop — BXLACK". */
  title: string;
  /** Aim for 120–160 characters; this is the snippet shown in search results. */
  description: string;
  /** Path on the site, e.g. "/shop". Sets og:url and the canonical link. */
  path?: string;
  image?: string | null;
  type?: "website" | "product" | "article";
  /** Keeps private/utility pages (cart, account, admin…) out of search results. */
  noindex?: boolean;
};

/** Builds a route's `head` with a consistent set of title, description,
 * Open Graph and Twitter tags so every page previews correctly when shared. */
export function seo({ title, description, path, image, type = "website", noindex }: SeoInput) {
  const url = path ? `${SITE_URL}${path}` : undefined;
  const img = image || DEFAULT_IMAGE;

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: type },
      { property: "og:image", content: img },
      ...(url ? [{ property: "og:url", content: url }] : []),
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: img },
      ...(noindex ? [{ name: "robots", content: "noindex, nofollow" }] : []),
    ],
    links: url && !noindex ? [{ rel: "canonical", href: url }] : [],
  };
}
