-- Store categories, managed from Studio → Products → Categories.
-- products.category holds a category key; the navbar, collection page, footer,
-- homepage tiles and size picker all read this table.
-- Needs the staff permissions migration (private.can) to have been run.

do $$
begin
  if to_regprocedure('private.can(uuid, text)') is null then
    raise exception 'Run apply-staff-permissions.sql first, then this script.';
  end if;
end $$;

create table if not exists public.categories (
  key text primary key check (length(trim(key)) > 0),
  label text not null check (length(trim(label)) > 0),
  page_title text,
  size_type text not null default 'top' check (size_type in ('top', 'denim', 'one_size')),
  sort_order integer not null default 0,
  visible boolean not null default true,
  image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;

drop policy if exists "Categories are viewable by everyone" on public.categories;
create policy "Categories are viewable by everyone" on public.categories
for select to anon, authenticated using (true);

drop policy if exists "Product staff can insert categories" on public.categories;
create policy "Product staff can insert categories" on public.categories
for insert to authenticated with check (private.can(auth.uid(), 'products'));

drop policy if exists "Product staff can update categories" on public.categories;
create policy "Product staff can update categories" on public.categories
for update to authenticated
using (private.can(auth.uid(), 'products')) with check (private.can(auth.uid(), 'products'));

drop policy if exists "Product staff can delete categories" on public.categories;
create policy "Product staff can delete categories" on public.categories
for delete to authenticated using (private.can(auth.uid(), 'products'));

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at before update on public.categories
for each row execute function public.set_updated_at();

-- The three categories the store launched with.
insert into public.categories (key, label, page_title, size_type, sort_order) values
  ('Tshirt', 'T-Shirt', 'T-Shirts', 'top', 10),
  ('Shirt', 'Shirt', 'Shirts', 'top', 20),
  ('Jeans', 'Jeans', 'Jeans', 'denim', 30)
on conflict (key) do nothing;

-- Any other category a product already uses, so nothing disappears.
insert into public.categories (key, label, sort_order)
select distinct category, category, 100 from public.products
where length(trim(category)) > 0
on conflict (key) do nothing;

-- Carry over the homepage tile images uploaded under "Category images".
update public.categories c
set image_path = ci.image_path
from public.category_images ci
where ci.category = c.key and c.image_path is null;

notify pgrst, 'reload schema';
