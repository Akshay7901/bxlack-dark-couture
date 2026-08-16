/*
# Create categories table

1. New Tables
- `categories`
  - `id` (uuid, primary key)
  - `name` (text, not null) — display label shown in the shop, e.g. "T-Shirt"
  - `slug` (text, not null, unique) — URL-safe key used in shop filters, e.g. "Tshirt"
  - `image_path` (text, nullable) — storage path to the category hero image in the `product-images` bucket
  - `sort_order` (integer, default 0) — controls display order on the homepage and admin list
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

2. Security
- Enable RLS on `categories`.
- Public SELECT for categories so the storefront (anon key) can read them.
- Admin-only INSERT / UPDATE / DELETE using the existing `private.has_role()` helper, matching the products table pattern.

3. Notes
- The category `slug` values ("Tshirt", "Shirt", "Jeans") intentionally match the existing `products.category` column so the shop filter continues to work without changing product rows.
- Images are stored in the existing `product-images` storage bucket under a `categories/` prefix.
*/

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  image_path text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view categories" ON categories;
CREATE POLICY "Public can view categories"
ON categories FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
CREATE POLICY "Admins can insert categories"
ON categories FOR INSERT
TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update categories" ON categories;
CREATE POLICY "Admins can update categories"
ON categories FOR UPDATE
TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete categories" ON categories;
CREATE POLICY "Admins can delete categories"
ON categories FOR DELETE
TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));
