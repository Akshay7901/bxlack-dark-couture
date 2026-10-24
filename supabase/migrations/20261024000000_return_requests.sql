-- Returns & exchanges requested by customers from their account, plus the
-- delivery timestamp the 7-day return window is measured from.

-- 1. When was the order delivered? Stamped automatically the first time an
--    admin moves the order to "delivered".
alter table public.orders add column if not exists delivered_at timestamptz;

create or replace function public.set_order_delivered_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'delivered' and old.status is distinct from 'delivered' then
    new.delivered_at := coalesce(new.delivered_at, now());
  end if;
  return new;
end;
$$;

drop trigger if exists orders_set_delivered_at on public.orders;
create trigger orders_set_delivered_at
before update of status on public.orders
for each row execute function public.set_order_delivered_at();

-- Orders already delivered before this existed: count the window from when
-- they were placed (the earliest they could have been delivered).
update public.orders
set delivered_at = created_at
where status = 'delivered' and delivered_at is null;

-- 2. Return / exchange requests. One per order (the policy allows a single
--    return or exchange per order), created only through the server, which
--    enforces the window and eligibility rules.
create table if not exists public.return_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('return', 'exchange')),
  -- [{ orderItemId, productName, size, quantity, exchangeSize }]
  items jsonb not null,
  reason text not null,
  details text,
  status text not null default 'requested'
    check (status in ('requested', 'approved', 'rejected', 'picked_up', 'completed')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.return_requests enable row level security;
grant select on public.return_requests to authenticated;
grant all on public.return_requests to service_role;

create policy "Users can view own return requests" on public.return_requests
for select to authenticated using (auth.uid() = user_id);

create policy "Admins can view all return requests" on public.return_requests
for select to authenticated using (private.has_role(auth.uid(), 'admin'));

create trigger return_requests_set_updated_at before update on public.return_requests
for each row execute function public.set_updated_at();
