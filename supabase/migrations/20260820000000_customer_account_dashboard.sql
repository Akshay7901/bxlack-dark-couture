-- Customer account dashboard: profile, saved addresses, and order history
-- (orders/order_items exist now so the UI has something real to query, but
-- stay empty until a checkout flow is built to actually insert into them).

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

create policy "Users can view own profile" on public.profiles
for select to authenticated using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
for insert to authenticated with check (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

-- Addresses
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  line1 text not null,
  line2 text,
  city text not null,
  state text,
  postal_code text not null,
  country text not null default 'India',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.addresses enable row level security;
grant select, insert, update, delete on public.addresses to authenticated;
grant all on public.addresses to service_role;

create policy "Users can view own addresses" on public.addresses
for select to authenticated using (auth.uid() = user_id);

create policy "Users can insert own addresses" on public.addresses
for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can update own addresses" on public.addresses
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can delete own addresses" on public.addresses
for delete to authenticated using (auth.uid() = user_id);

create trigger addresses_set_updated_at before update on public.addresses
for each row execute function public.set_updated_at();

-- Orders + order items — schema ready for a future checkout flow.
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',
  total numeric(10, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid,
  product_name text not null,
  image_path text,
  size text,
  quantity integer not null default 1,
  price numeric(10, 2) not null default 0
);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
grant select, insert on public.orders to authenticated;
grant select on public.order_items to authenticated;
grant all on public.orders to service_role;
grant all on public.order_items to service_role;

create policy "Users can view own orders" on public.orders
for select to authenticated using (auth.uid() = user_id);

create policy "Users can insert own orders" on public.orders
for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can view own order items" on public.order_items
for select to authenticated using (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);
