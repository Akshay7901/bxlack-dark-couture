create table public.category_images (
  category text primary key,
  image_path text not null,
  updated_at timestamptz not null default now()
);
grant select on public.category_images to anon, authenticated;
grant insert, update, delete on public.category_images to authenticated;
grant all on public.category_images to service_role;
alter table public.category_images enable row level security;

create policy "Category images are viewable by everyone" on public.category_images
for select to anon, authenticated using (true);

create policy "Admins can insert category images" on public.category_images
for insert to authenticated with check (private.has_role(auth.uid(), 'admin'));

create policy "Admins can update category images" on public.category_images
for update to authenticated using (private.has_role(auth.uid(), 'admin')) with check (private.has_role(auth.uid(), 'admin'));

create policy "Admins can delete category images" on public.category_images
for delete to authenticated using (private.has_role(auth.uid(), 'admin'));

create trigger category_images_set_updated_at before update on public.category_images
for each row execute function public.set_updated_at();
