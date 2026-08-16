-- Site-wide "coming soon" gate: public settings + waitlist, plus a private
-- password table that is never directly readable by anon/authenticated —
-- only checked via a service-role server function.

create table public.site_settings (
  id boolean primary key default true check (id),
  coming_soon_enabled boolean not null default false,
  launch_at timestamptz,
  headline text not null default 'Something Bold Is Coming',
  subheading text not null default 'Be first through the door when we drop.',
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id) values (true);

grant select on public.site_settings to anon, authenticated;
grant update on public.site_settings to authenticated;
grant all on public.site_settings to service_role;
alter table public.site_settings enable row level security;

create policy "Site settings are viewable by everyone" on public.site_settings
for select to anon, authenticated using (true);

create policy "Admins can update site settings" on public.site_settings
for update to authenticated using (private.has_role(auth.uid(), 'admin')) with check (private.has_role(auth.uid(), 'admin'));

create trigger site_settings_set_updated_at before update on public.site_settings
for each row execute function public.set_updated_at();

-- Password lives outside the public schema entirely and has no client grants
-- at all (no anon, no authenticated) — only service_role can touch it, via
-- src/lib/launch.functions.ts server functions.
create table private.site_password (
  id boolean primary key default true check (id),
  password text not null default 'preview'
);
insert into private.site_password (id, password) values (true, 'preview');
grant all on private.site_password to service_role;

-- Waitlist: anyone can join, only admins can read the list.
create table public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);
grant insert on public.waitlist_signups to anon, authenticated;
grant select, delete on public.waitlist_signups to authenticated;
grant all on public.waitlist_signups to service_role;
alter table public.waitlist_signups enable row level security;

create policy "Anyone can join the waitlist" on public.waitlist_signups
for insert to anon, authenticated with check (true);

create policy "Admins can view the waitlist" on public.waitlist_signups
for select to authenticated using (private.has_role(auth.uid(), 'admin'));

create policy "Admins can remove waitlist entries" on public.waitlist_signups
for delete to authenticated using (private.has_role(auth.uid(), 'admin'));
