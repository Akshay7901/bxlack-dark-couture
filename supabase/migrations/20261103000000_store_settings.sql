-- Small storefront settings edited in Studio, one JSON value per key.
-- First used for the homepage Instagram section (key 'instagram').
-- Anyone can read (the storefront needs it); staff with the "content"
-- permission can write. Needs the staff permissions migration (private.can).

do $$
begin
  if to_regprocedure('private.can(uuid, text)') is null then
    raise exception 'Run apply-staff-permissions.sql first, then this script.';
  end if;
end $$;

create table if not exists public.store_settings (
  key text primary key check (length(trim(key)) > 0),
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

grant select on public.store_settings to anon, authenticated;
grant insert, update, delete on public.store_settings to authenticated;
grant all on public.store_settings to service_role;
alter table public.store_settings enable row level security;

drop policy if exists "Store settings are viewable by everyone" on public.store_settings;
create policy "Store settings are viewable by everyone" on public.store_settings
for select to anon, authenticated using (true);

drop policy if exists "Content staff can insert store settings" on public.store_settings;
create policy "Content staff can insert store settings" on public.store_settings
for insert to authenticated with check (private.can(auth.uid(), 'content'));

drop policy if exists "Content staff can update store settings" on public.store_settings;
create policy "Content staff can update store settings" on public.store_settings
for update to authenticated
using (private.can(auth.uid(), 'content')) with check (private.can(auth.uid(), 'content'));

drop policy if exists "Content staff can delete store settings" on public.store_settings;
create policy "Content staff can delete store settings" on public.store_settings
for delete to authenticated using (private.can(auth.uid(), 'content'));

drop trigger if exists store_settings_set_updated_at on public.store_settings;
create trigger store_settings_set_updated_at before update on public.store_settings
for each row execute function public.set_updated_at();

notify pgrst, 'reload schema';
