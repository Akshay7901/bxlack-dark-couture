-- Guest checkout: orders can be placed without an account.
-- A guest order has no user_id and keeps the shopper's email on the order
-- itself (signed-in orders record the account email too). Orders are still
-- only created by the checkout server functions with the service role.

alter table public.orders alter column user_id drop not null;
alter table public.orders add column if not exists email text;

alter table public.orders drop constraint if exists orders_email_len;
alter table public.orders
  add constraint orders_email_len check (email is null or char_length(email) <= 255) not valid;

-- Every order needs someone to contact: an account or an email.
alter table public.orders drop constraint if exists orders_contact_required;
alter table public.orders
  add constraint orders_contact_required check (user_id is not null or email is not null) not valid;

create index if not exists orders_email_created_idx on public.orders (lower(email), created_at desc);

notify pgrst, 'reload schema';
