-- The product-images bucket was originally created by hand, outside
-- migrations, so a fresh Supabase project never got it. Public read:
-- the storefront builds plain public URLs for product photos. Upload,
-- update and delete stay admin-only via the storage policies added in
-- the 20260808 migrations.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;
