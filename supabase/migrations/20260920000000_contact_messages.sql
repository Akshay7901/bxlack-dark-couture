-- Contact form submissions: anyone can submit one, only admins can read them
-- (mirrors the waitlist_signups pattern — public insert, admin-only select).
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  order_number text,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);
grant insert on public.contact_messages to anon, authenticated;
grant select, update, delete on public.contact_messages to authenticated;
grant all on public.contact_messages to service_role;
alter table public.contact_messages enable row level security;

create policy "Anyone can submit a contact message" on public.contact_messages
for insert to anon, authenticated with check (true);

create policy "Admins can view contact messages" on public.contact_messages
for select to authenticated using (private.has_role(auth.uid(), 'admin'));

create policy "Admins can update contact messages" on public.contact_messages
for update to authenticated using (private.has_role(auth.uid(), 'admin')) with check (private.has_role(auth.uid(), 'admin'));

create policy "Admins can delete contact messages" on public.contact_messages
for delete to authenticated using (private.has_role(auth.uid(), 'admin'));
