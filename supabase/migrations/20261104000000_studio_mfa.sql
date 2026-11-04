-- Two-step verification for the studio.
-- Studio rights (admin role, staff permissions) only count when the
-- caller's session has passed two-step verification (JWT aal = 'aal2').
-- A password-only session (aal1) can still sign in and set up an
-- authenticator, but every admin/staff policy and function treats it as
-- having no studio rights. Customers are unaffected: they have no studio
-- rights to begin with.
-- Needs the staff permissions migration (private.can) to have been run.

do $$
begin
  if to_regprocedure('private.can(uuid, text)') is null then
    raise exception 'Run apply-staff-permissions.sql first, then this script.';
  end if;
end $$;

-- True when the check is about someone other than the caller (server-side
-- checks with the service role), or the caller's session is two-step verified.
create or replace function private.studio_mfa_ok(_user_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select _user_id is distinct from auth.uid()
    or coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
$$;

revoke all on function private.studio_mfa_ok(uuid) from public;
grant execute on function private.studio_mfa_ok(uuid) to authenticated, service_role;

create or replace function private.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
    and private.studio_mfa_ok(_user_id)
$$;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
    and private.studio_mfa_ok(_user_id)
$$;

create or replace function private.can(_user_id uuid, _permission text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (
    private.has_role(_user_id, 'admin')
    or exists (
      select 1 from public.staff_members
      where user_id = _user_id and _permission = any(permissions)
    )
  ) and private.studio_mfa_ok(_user_id)
$$;

notify pgrst, 'reload schema';
