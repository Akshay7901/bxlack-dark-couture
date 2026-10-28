-- Editable content for the About, Shipping, Returns, FAQ and Contact pages.
-- One row per page with its content as JSON; a page with no row shows the
-- default copy built into the site. Anyone can read (the pages are public);
-- changes go through a server function that requires the "content"
-- permission, so there are no client write policies.
create table if not exists public.site_pages (
  slug text primary key check (slug in ('about', 'shipping', 'returns', 'faq', 'contact')),
  content jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.site_pages enable row level security;
grant select on public.site_pages to anon, authenticated;
grant all on public.site_pages to service_role;

create policy "Site pages are viewable by everyone" on public.site_pages
for select to anon, authenticated using (true);

create trigger site_pages_set_updated_at before update on public.site_pages
for each row execute function public.set_updated_at();
