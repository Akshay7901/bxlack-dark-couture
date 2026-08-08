DROP POLICY "Published products are viewable by everyone" ON public.products;

CREATE POLICY "Published products are viewable by everyone" ON public.products
FOR SELECT TO anon, authenticated USING (published = true);

CREATE POLICY "Admins can view all products" ON public.products
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY "Product images are viewable by everyone" ON storage.objects;

CREATE POLICY "Product images are viewable by everyone" ON storage.objects
FOR SELECT TO anon, authenticated USING (bucket_id = 'product-images');

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM authenticated;