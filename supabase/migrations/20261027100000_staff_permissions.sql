-- Staff accounts with per-section permissions (Shopify-style).
-- Admins (user_roles.role = 'admin') keep full access. Staff are listed in
-- staff_members with the studio sections they may use:
--   home, orders, returns, products, customers, discounts, messages, content
-- Managing staff and admins stays admin-only.

create table if not exists public.staff_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  permissions text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.staff_members enable row level security;
grant select on public.staff_members to authenticated;
grant all on public.staff_members to service_role;

create policy "Staff can view own permissions" on public.staff_members
for select to authenticated using (auth.uid() = user_id);

create trigger staff_members_set_updated_at before update on public.staff_members
for each row execute function public.set_updated_at();

-- True for admins, and for staff who hold the given permission.
create or replace function private.can(_user_id uuid, _permission text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select private.has_role(_user_id, 'admin')
    or exists (
      select 1 from public.staff_members
      where user_id = _user_id and _permission = any(permissions)
    )
$$;

revoke all on function private.can(uuid, text) from public;
grant execute on function private.can(uuid, text) to authenticated, service_role;

-- Products, inventory and product images → "products"
alter policy "Admins can view all products" on public.products
  using (private.can(auth.uid(), 'products'));
alter policy "Admins can insert products" on public.products
  with check (private.can(auth.uid(), 'products'));
alter policy "Admins can update products" on public.products
  using (private.can(auth.uid(), 'products')) with check (private.can(auth.uid(), 'products'));
alter policy "Admins can delete products" on public.products
  using (private.can(auth.uid(), 'products'));

alter policy "Admins can insert inventory" on public.product_inventory
  with check (private.can(auth.uid(), 'products'));
alter policy "Admins can update inventory" on public.product_inventory
  using (private.can(auth.uid(), 'products')) with check (private.can(auth.uid(), 'products'));
alter policy "Admins can delete inventory" on public.product_inventory
  using (private.can(auth.uid(), 'products'));

alter policy "Admins can insert category images" on public.category_images
  with check (private.can(auth.uid(), 'products'));
alter policy "Admins can update category images" on public.category_images
  using (private.can(auth.uid(), 'products')) with check (private.can(auth.uid(), 'products'));
alter policy "Admins can delete category images" on public.category_images
  using (private.can(auth.uid(), 'products'));

alter policy "Admins can upload product images" on storage.objects
  with check (bucket_id = 'product-images' and private.can(auth.uid(), 'products'));
alter policy "Admins can update product images" on storage.objects
  using (bucket_id = 'product-images' and private.can(auth.uid(), 'products'))
  with check (bucket_id = 'product-images' and private.can(auth.uid(), 'products'));
alter policy "Admins can delete product images" on storage.objects
  using (bucket_id = 'product-images' and private.can(auth.uid(), 'products'));

-- Orders → "orders"; return/exchange requests → "returns"
alter policy "Admins can view all orders" on public.orders
  using (private.can(auth.uid(), 'orders'));
alter policy "Admins can update orders" on public.orders
  using (private.can(auth.uid(), 'orders')) with check (private.can(auth.uid(), 'orders'));
alter policy "Admins can view all order items" on public.order_items
  using (private.can(auth.uid(), 'orders'));
alter policy "Admins can view all return requests" on public.return_requests
  using (private.can(auth.uid(), 'returns'));

-- Contact messages → "messages"
alter policy "Admins can view contact messages" on public.contact_messages
  using (private.can(auth.uid(), 'messages'));
alter policy "Admins can update contact messages" on public.contact_messages
  using (private.can(auth.uid(), 'messages')) with check (private.can(auth.uid(), 'messages'));
alter policy "Admins can delete contact messages" on public.contact_messages
  using (private.can(auth.uid(), 'messages'));

-- Launch settings, waitlist and the launch password → "content"
alter policy "Admins can update site settings" on public.site_settings
  using (private.can(auth.uid(), 'content')) with check (private.can(auth.uid(), 'content'));
alter policy "Admins can view the waitlist" on public.waitlist_signups
  using (private.can(auth.uid(), 'content'));
alter policy "Admins can remove waitlist entries" on public.waitlist_signups
  using (private.can(auth.uid(), 'content'));

create or replace function public.update_launch_password(new_password text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not private.can(auth.uid(), 'content') then
    raise exception 'Forbidden';
  end if;
  update private.site_password set password = new_password where id = true;
end;
$$;
