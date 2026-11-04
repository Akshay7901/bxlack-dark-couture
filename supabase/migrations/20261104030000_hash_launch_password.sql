-- Store the launch-gate password as a bcrypt hash instead of plain text.
-- The existing password keeps working: it is hashed in place, and
-- verify_launch_password compares against the hash. Changing it from the
-- studio stores a new hash.

create extension if not exists pgcrypto with schema extensions;

-- Hash the current password if it is still plain text.
update private.site_password
set password = extensions.crypt(password, extensions.gen_salt('bf'))
where id = true and password !~ '^\$2[aby]\$';

create or replace function public.verify_launch_password(candidate text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from private.site_password
    where id = true and password = extensions.crypt(candidate, password)
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
  if not private.can(auth.uid(), 'content') then
    raise exception 'Forbidden';
  end if;
  if length(coalesce(new_password, '')) < 4 then
    raise exception 'Password is too short';
  end if;
  update private.site_password
  set password = extensions.crypt(new_password, extensions.gen_salt('bf'))
  where id = true;
end;
$$;
revoke all on function public.update_launch_password(text) from public;
grant execute on function public.update_launch_password(text) to authenticated;

notify pgrst, 'reload schema';
