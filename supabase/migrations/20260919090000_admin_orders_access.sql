-- Orders/order_items only had policies letting a customer see their own
-- order (for the account dashboard) - nothing let an admin see or manage
-- any order at all. This adds admin read access plus the ability to update
-- an order's status (e.g. mark it shipped), needed for an admin Orders view.
grant update on public.orders to authenticated;

-- The order never captured who/where it ships to - there was nowhere to put
-- a name, phone or address at all. Snapshotting these onto the order itself
-- (rather than joining to the customer's current profile/address) means the
-- order keeps showing what was actually shipped to even if the customer
-- edits or deletes that address later.
alter table public.orders
  add column if not exists full_name text,
  add column if not exists phone text,
  add column if not exists address_line1 text,
  add column if not exists address_line2 text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists postal_code text,
  add column if not exists country text;

create policy "Admins can view all orders" on public.orders
for select to authenticated using (private.has_role(auth.uid(), 'admin'));

create policy "Admins can update orders" on public.orders
for update to authenticated using (private.has_role(auth.uid(), 'admin')) with check (private.has_role(auth.uid(), 'admin'));

create policy "Admins can view all order items" on public.order_items
for select to authenticated using (private.has_role(auth.uid(), 'admin'));
