-- Per-size stock counts for each product, so admin can see and edit exactly
-- how many units are left in every size instead of just listing size names
-- with no numbers behind them.
create table public.product_inventory (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null,
  quantity integer not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now(),
  unique (product_id, size)
);
grant select on public.product_inventory to anon, authenticated;
grant insert, update, delete on public.product_inventory to authenticated;
grant all on public.product_inventory to service_role;
alter table public.product_inventory enable row level security;

create policy "Inventory is viewable by everyone" on public.product_inventory
for select to anon, authenticated using (true);

create policy "Admins can insert inventory" on public.product_inventory
for insert to authenticated with check (private.has_role(auth.uid(), 'admin'));

create policy "Admins can update inventory" on public.product_inventory
for update to authenticated using (private.has_role(auth.uid(), 'admin')) with check (private.has_role(auth.uid(), 'admin'));

create policy "Admins can delete inventory" on public.product_inventory
for delete to authenticated using (private.has_role(auth.uid(), 'admin'));

create trigger product_inventory_set_updated_at before update on public.product_inventory
for each row execute function public.set_updated_at();
