-- Keep orders and return requests when a customer account is deleted.
-- Before this, deleting a user cascaded to their orders (and so order items,
-- notes and returns), wiping sales history. Now the link to the account is
-- cleared instead: the order keeps its name, address, phone, items and
-- totals, and shows as a deleted customer in the studio.
-- Profiles and saved addresses still go with the account.

alter table public.orders alter column user_id drop not null;
alter table public.orders drop constraint if exists orders_user_id_fkey;
alter table public.orders
  add constraint orders_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;

alter table public.return_requests alter column user_id drop not null;
alter table public.return_requests drop constraint if exists return_requests_user_id_fkey;
alter table public.return_requests
  add constraint return_requests_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;

notify pgrst, 'reload schema';
