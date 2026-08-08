CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can read their own roles" ON public.user_roles
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all roles" ON public.user_roles
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL,
  price integer NOT NULL,
  compare_at integer,
  badge text,
  tag text,
  description text,
  image_path text,
  back_image_path text,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published products are viewable by everyone" ON public.products
FOR SELECT TO anon, authenticated USING (published = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert products" ON public.products
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update products" ON public.products
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete products" ON public.products
FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER products_set_updated_at BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Product images are viewable by everyone" ON storage.objects
FOR SELECT TO anon, authenticated USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update product images" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete product images" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

INSERT INTO public.products (slug, name, category, price, compare_at, badge, tag, image_path, back_image_path, sort_order) VALUES
('venus-flytrap-tee', 'Venus Flytrap Tee', 'Tshirt', 4999, 6499, 'New Arrival', 'SS26 / 000', 'seed/venus-front.jpg', 'seed/venus-back.jpg', 0),
('shadow-tee', 'Shadow Jersey Tee', 'Tshirt', 5499, 6999, 'New Arrival', 'SS26 / 001', 'seed/p3.jpg', NULL, 1),
('obsidian-shirt', 'Obsidian Camp Shirt', 'Shirt', 6499, 7999, 'Best Seller', 'SS26 / 002', 'seed/p1.jpg', NULL, 2),
('void-denim', 'Void Raw Denim', 'Jeans', 6999, NULL, NULL, 'SS26 / 003', 'seed/p2.jpg', NULL, 3),
('onyx-denim', 'Onyx Washed Denim', 'Jeans', 7999, 8999, 'Hot Selling', 'SS26 / 004', 'seed/p4.jpg', NULL, 4);