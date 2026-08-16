-- PostgREST only exposes the public/graphql_public schemas by default, so
-- private.site_password can't be queried directly via the client SDK even
-- with the service-role key. Fix: two SECURITY DEFINER RPC functions in the
-- public schema (same pattern as private.has_role) that touch the private
-- table server-side and only ever return a boolean/void — the password value
-- itself is never sent back to any caller.

create or replace function public.verify_launch_password(candidate text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from private.site_password where id = true and password = candidate
  )
$$;
revoke all on function public.verify_launch_password(text) from public;
grant execute on function public.verify_launch_password(text) to anon, authenticated;

create or replace function public.update_launch_password(new_password text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not private.has_role(auth.uid(), 'admin') then
    raise exception 'Forbidden';
  end if;
  update private.site_password set password = new_password where id = true;
end;
$$;
revoke all on function public.update_launch_password(text) from public;
grant execute on function public.update_launch_password(text) to authenticated;
