import { supabase } from "@/integrations/supabase/client";

export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  compare_at: number | null;
  badge: string | null;
  tag: string | null;
  description: string | null;
  card_image_path: string | null;
  image_path: string | null;
  back_image_path: string | null;
  gallery_paths: string[];
  sort_order: number;
  published: boolean;
};

export type CatalogProductWithUrls = CatalogProduct & {
  cardImageUrl: string | null;
  imageUrl: string | null;
  backImageUrl: string | null;
  galleryUrls: string[];
};

export const CATEGORIES = ["Tshirt", "Shirt", "Jeans"] as const;

/**
 * The product-images bucket is public-read (see storage policies), so URLs can be
 * built locally with no network round-trip — unlike signed URLs, which would force
 * every image to wait on an extra API call before it can even start downloading.
 */
export function publicStorageUrls(paths: string[]): Record<string, string> {
  const unique = Array.from(new Set(paths.filter(Boolean)));
  const map: Record<string, string> = {};
  for (const path of unique) {
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    if (data?.publicUrl) map[path] = data.publicUrl;
  }
  return map;
}

function withUrls(rows: CatalogProduct[]): CatalogProductWithUrls[] {
  const paths = rows.flatMap(
    (r) =>
      [r.card_image_path, r.image_path, r.back_image_path, ...(r.gallery_paths ?? [])].filter(
        Boolean,
      ) as string[],
  );
  const map = publicStorageUrls(paths);
  return rows.map((r) => ({
    ...r,
    cardImageUrl: r.card_image_path ? (map[r.card_image_path] ?? null) : null,
    imageUrl: r.image_path ? (map[r.image_path] ?? null) : null,
    backImageUrl: r.back_image_path ? (map[r.back_image_path] ?? null) : null,
    galleryUrls: (r.gallery_paths ?? []).map((p) => map[p]).filter(Boolean) as string[],
  }));
}

export async function fetchProducts(includeUnpublished = false): Promise<CatalogProductWithUrls[]> {
  let query = supabase.from("products").select("*").order("sort_order", { ascending: true });
  if (!includeUnpublished) query = query.eq("published", true);
  const { data, error } = await query;
  if (error) throw error;
  return withUrls((data ?? []) as CatalogProduct[]);
}

export async function fetchProductBySlug(slug: string): Promise<CatalogProductWithUrls | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [product] = withUrls([data as CatalogProduct]);
  return product ?? null;
}

export type ProductInput = {
  slug: string;
  name: string;
  category: string;
  price: number;
  compare_at: number | null;
  badge: string | null;
  tag: string | null;
  description: string | null;
  card_image_path: string | null;
  image_path: string | null;
  back_image_path: string | null;
  gallery_paths: string[];
  sort_order: number;
  published: boolean;
};

export async function createProduct(input: ProductInput) {
  const { error } = await supabase.from("products").insert(input);
  if (error) throw error;
}

export async function updateProduct(id: string, input: Partial<ProductInput>) {
  const { error } = await supabase.from("products").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Downscales oversized images (phone photos, AI-generated art, etc. easily land at
 * 4000px+ / several MB) before upload — otherwise every first-time visitor eats the
 * full original download on every product/category image.
 */
async function compressImage(file: File, maxDimension = 1600, quality = 0.88): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return file;

  const bitmap = await createImageBitmap(file);
  if (bitmap.width <= maxDimension && bitmap.height <= maxDimension && file.size < 1_500_000) {
    bitmap.close();
    return file;
  }

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, outputType, quality),
  );
  if (!blob || blob.size >= file.size) return file;

  const ext = outputType === "image/png" ? "png" : "jpg";
  return new File([blob], file.name.replace(/\.[^.]+$/, `.${ext}`), { type: outputType });
}

export async function uploadProductImage(file: File): Promise<string> {
  const compressed = await compressImage(file);
  const ext = compressed.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `uploads/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("product-images").upload(path, compressed, {
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export type CategoryImage = {
  category: string;
  image_path: string;
  imageUrl: string | null;
};

export async function fetchCategoryImages(): Promise<CategoryImage[]> {
  const { data, error } = await supabase.from("category_images").select("*");
  if (error) throw error;
  const rows = data ?? [];
  const map = publicStorageUrls(rows.map((r) => r.image_path));
  return rows.map((r) => ({ ...r, imageUrl: map[r.image_path] ?? null }));
}

export async function setCategoryImage(category: string, file: File): Promise<void> {
  const path = await uploadProductImage(file);
  const { error } = await supabase.from("category_images").upsert({ category, image_path: path });
  if (error) throw error;
}

export async function removeCategoryImage(category: string): Promise<void> {
  const { error } = await supabase.from("category_images").delete().eq("category", category);
  if (error) throw error;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Maps a database product onto the shape the storefront UI expects.
 * `image` is the single dedicated shop-card/cart/wishlist thumbnail; `gallery` is the
 * separate, independently-curated set of images shown on the product detail page.
 */
export function toCardProduct(p: CatalogProductWithUrls) {
  const gallery = [p.imageUrl, p.backImageUrl, ...p.galleryUrls].filter(Boolean) as string[];
  return {
    id: p.slug,
    name: p.name,
    price: p.price,
    category: p.category,
    image: p.cardImageUrl ?? p.imageUrl ?? "",
    backImage: p.backImageUrl ?? undefined,
    gallery,
    tag: p.tag ?? undefined,
    compareAt: p.compare_at ?? undefined,
    badge: p.badge ?? undefined,
    description: p.description ?? undefined,
  };
}
