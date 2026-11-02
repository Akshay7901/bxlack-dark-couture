import { useQuery } from "@tanstack/react-query";

export const INSTAGRAM_HANDLE = "bxlack.official";
export const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_HANDLE}/`;

/** Public JSON feed from behold.so (connected to @bxlack.official). */
const BEHOLD_FEED_URL = "https://feeds.behold.so/1EMrOc8yNyygDDvdZxXn";

type BeholdSize = { width: number; height: number; mediaUrl: string };

type BeholdPost = {
  id: string;
  permalink: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  mediaUrl?: string;
  thumbnailUrl?: string;
  prunedCaption?: string;
  caption?: string;
  visibility?: string;
  sizes?: Partial<Record<"small" | "medium" | "large" | "full", BeholdSize>>;
};

export type InstagramPost = {
  id: string;
  url: string;
  image: string;
  caption: string;
  type: BeholdPost["mediaType"];
};

async function fetchInstagramPosts(): Promise<InstagramPost[]> {
  const res = await fetch(BEHOLD_FEED_URL);
  if (!res.ok) throw new Error(`Instagram feed ${res.status}`);
  const data = (await res.json()) as { posts?: BeholdPost[] };
  return (data.posts ?? [])
    .filter((p) => p.visibility !== "hidden")
    .map((p) => ({
      id: p.id,
      url: p.permalink,
      // Behold's resized copies are stable; Instagram's own CDN links expire.
      image: p.sizes?.medium?.mediaUrl ?? p.thumbnailUrl ?? p.mediaUrl ?? "",
      caption: (p.prunedCaption ?? p.caption ?? "").trim(),
      type: p.mediaType,
    }))
    .filter((p) => p.image);
}

/** Latest posts, fetched in the browser. Errors resolve to "no posts" so the section just hides. */
export function useInstagramPosts() {
  return useQuery({
    queryKey: ["instagram"],
    queryFn: fetchInstagramPosts,
    staleTime: 30 * 60_000,
    retry: 1,
  });
}
