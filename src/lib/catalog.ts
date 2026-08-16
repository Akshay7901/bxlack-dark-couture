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
  image_path: string | null;
  back_image_path: string | null;
  gallery_paths: string[];
  sort_order: number;
  published: boolean;
};

export type CatalogProductWithUrls = CatalogProduct & {
  imageUrl: string | null;
  backImageUrl: string | null;
  galleryUrls: string[];
};

export const CATEGORIES = ["Tshirt", "Shirt", "Jeans"] as const;

const SIGNED_URL_TTL = 60 * 60;

export async function signStoragePaths(paths: string[]): Promise<Record<string, string>> {
  const unique = Array.from(new Set(paths.filter(Boolean)));
  if (unique.length === 0) return {};
  const { data, error } = await supabase.storage
    .from("product-images")
    .createSignedUrls(unique, SIGNED_URL_TTL);
  if (error || !data) return {};
  const map: Record<string, string> = {};
  data.forEach((entry, i) => {
    const path = entry.path ?? unique[i];
    if (entry.signedUrl && path) map[path] = entry.signedUrl;
  });
  return map;
}

async function withUrls(rows: CatalogProduct[]): Promise<CatalogProductWithUrls[]> {
  const paths = rows.flatMap(
    (r) => [r.image_path, r.back_image_path, ...(r.gallery_paths ?? [])].filter(Boolean) as string[],
  );
  const map = await signStoragePaths(paths);
  return rows.map((r) => ({
    ...r,
    imageUrl: r.image_path ? map[r.image_path] ?? null : null,
    backImageUrl: r.back_image_path ? map[r.back_image_path] ?? null : null,
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
  const { data, error } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [product] = await withUrls([data as CatalogProduct]);
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

export async function uploadProductImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `uploads/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export type CatalogCategory = {
  id: string;
  name: string;
  slug: string;
  image_path: string | null;
  sort_order: number;
};

export type CatalogCategoryWithUrl = CatalogCategory & {
  imageUrl: string | null;
};

export type CategoryInput = {
  name: string;
  slug: string;
  image_path: string | null;
  sort_order: number;
};

export async function fetchCategories(): Promise<CatalogCategoryWithUrl[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as CatalogCategory[];
  const paths = rows.map((r) => r.image_path).filter(Boolean) as string[];
  const map = await signStoragePaths(paths);
  return rows.map((r) => ({
    ...r,
    imageUrl: r.image_path ? map[r.image_path] ?? null : null,
  }));
}

export async function createCategory(input: CategoryInput) {
  const { error } = await supabase.from("categories").insert(input);
  if (error) throw error;
}

export async function updateCategory(id: string, input: Partial<CategoryInput>) {
  const { error } = await supabase.from("categories").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadCategoryImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `categories/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Maps a database product onto the shape the storefront card/detail UI expects. */
export function toCardProduct(p: CatalogProductWithUrls) {
  const gallery = [p.imageUrl, p.backImageUrl, ...p.galleryUrls].filter(Boolean) as string[];
  return {
    id: p.slug,
    name: p.name,
    price: p.price,
    category: p.category,
    image: p.imageUrl ?? "",
    backImage: p.backImageUrl ?? undefined,
    gallery,
    tag: p.tag ?? undefined,
    compareAt: p.compare_at ?? undefined,
    badge: p.badge ?? undefined,
  };
}