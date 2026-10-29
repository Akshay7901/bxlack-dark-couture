import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { publicStorageUrls, uploadProductImage } from "@/lib/catalog";

/**
 * How a category's products are sized:
 *  - top:      tee/shirt/jacket chart (XS–XXL), top measurement diagram
 *  - denim:    same size labels, waist/rise/inseam diagram
 *  - one_size: a single "One size" option and no size chart (caps, bags…)
 */
export type SizeType = "top" | "denim" | "one_size";

export const SIZE_TYPE_LABELS: Record<SizeType, string> = {
  top: "Clothing sizes",
  denim: "Jeans sizes",
  one_size: "One size",
};

export type Category = {
  /** Stored on products.category and used in the URL (/shop?type=key). Never changes. */
  key: string;
  /** Shown in the navbar, footer, homepage tiles and admin. */
  label: string;
  /** Collection page heading; falls back to label. */
  page_title: string | null;
  size_type: SizeType;
  sort_order: number;
  visible: boolean;
  image_path: string | null;
  imageUrl: string | null;
};

export type CategoryInput = Pick<Category, "label" | "page_title" | "size_type" | "visible">;

/** What the store looked like before categories moved into the database. */
export const DEFAULT_CATEGORIES: Category[] = [
  {
    key: "Tshirt",
    label: "T-Shirt",
    page_title: "T-Shirts",
    size_type: "top",
    sort_order: 10,
    visible: true,
    image_path: null,
    imageUrl: null,
  },
  {
    key: "Shirt",
    label: "Shirt",
    page_title: "Shirts",
    size_type: "top",
    sort_order: 20,
    visible: true,
    image_path: null,
    imageUrl: null,
  },
  {
    key: "Jeans",
    label: "Jeans",
    page_title: "Jeans",
    size_type: "denim",
    sort_order: 30,
    visible: true,
    image_path: null,
    imageUrl: null,
  },
];

export const pageTitleOf = (c: Pick<Category, "label" | "page_title">) => c.page_title || c.label;

/** "Sweat Shirt!" → "SweatShirt" — the URL-safe key for a new category. */
export function categoryKeyFrom(label: string) {
  return label
    .trim()
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("");
}

/** Thrown by fetchCategories when the categories migration hasn't been run yet. */
export class CategoriesTableMissing extends Error {}

function isMissingTable(error: { code?: string; message?: string }) {
  const message = error.message ?? "";
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (/categories/.test(message) && /not find|does not exist/.test(message))
  );
}

async function fetchCategoryRows(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("key, label, page_title, size_type, sort_order, visible, image_path")
    .order("sort_order", { ascending: true });
  if (error) {
    if (isMissingTable(error)) throw new CategoriesTableMissing(error.message);
    throw error;
  }
  const rows = (data ?? []) as Omit<Category, "imageUrl">[];
  const urls = publicStorageUrls(rows.map((r) => r.image_path).filter(Boolean) as string[]);
  return rows.map((r) => ({ ...r, imageUrl: r.image_path ? (urls[r.image_path] ?? null) : null }));
}

/** Before the migration: the three built-in categories with their old homepage images. */
async function legacyCategories(): Promise<Category[]> {
  const { data } = await supabase.from("category_images").select("category, image_path");
  const byKey = new Map((data ?? []).map((r) => [r.category, r.image_path]));
  const urls = publicStorageUrls([...byKey.values()]);
  return DEFAULT_CATEGORIES.map((c) => {
    const path = byKey.get(c.key) ?? null;
    return { ...c, image_path: path, imageUrl: path ? (urls[path] ?? null) : null };
  });
}

/** All categories in display order, hidden ones included. */
export async function fetchCategories(): Promise<Category[]> {
  try {
    return await fetchCategoryRows();
  } catch (e) {
    if (e instanceof CategoriesTableMissing) return legacyCategories();
    throw e;
  }
}

/** Admin only: like fetchCategories, but surfaces a missing table instead of hiding it. */
export const fetchCategoriesStrict = fetchCategoryRows;

/**
 * Categories for the storefront. Until the query resolves (and during SSR) the
 * built-in defaults are used, so menus render immediately and match on hydration.
 */
export function useCategories({ includeHidden = false } = {}) {
  const query = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 5 * 60_000,
    placeholderData: DEFAULT_CATEGORIES,
  });
  const all = query.data ?? DEFAULT_CATEGORIES;
  return {
    ...query,
    categories: includeHidden ? all : all.filter((c) => c.visible),
  };
}

export function findCategory(categories: Category[], key: string) {
  return categories.find((c) => c.key === key) ?? DEFAULT_CATEGORIES.find((c) => c.key === key);
}

export async function createCategory(key: string, input: CategoryInput, sort_order: number) {
  const { error } = await supabase.from("categories").insert({ key, ...input, sort_order });
  if (error) {
    if (error.code === "23505") throw new Error(`A category with the key "${key}" already exists`);
    throw error;
  }
}

export async function updateCategory(
  key: string,
  input: Partial<Omit<Category, "key" | "imageUrl">>,
) {
  const { error } = await supabase.from("categories").update(input).eq("key", key);
  if (error) throw error;
}

export async function deleteCategory(key: string) {
  const { error } = await supabase.from("categories").delete().eq("key", key);
  if (error) throw error;
}

export async function saveCategoryOrder(keys: string[]) {
  await Promise.all(keys.map((key, i) => updateCategory(key, { sort_order: (i + 1) * 10 })));
}

export async function setCategoryImage(key: string, file: File) {
  const image_path = await uploadProductImage(file);
  await updateCategory(key, { image_path });
}

export async function removeCategoryImage(key: string) {
  await updateCategory(key, { image_path: null });
}
