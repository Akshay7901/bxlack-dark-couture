-- Removes the studio two-step verification requirement
-- (undoes 20261104000000_studio_mfa.sql / apply-studio-mfa.sql).
-- Restores has_role / can to their original definitions. Safe to run even if
-- the two-step script was never run.

create or replace function private.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

do $$
begin
  if to_regprocedure('private.can(uuid, text)') is not null then
    execute $f$
      create or replace function private.can(_user_id uuid, _permission text)
      returns boolean
      language sql
      stable
      security definer
      set search_path = public
      as $body$
        select private.has_role(_user_id, 'admin')
          or exists (
            select 1 from public.staff_members
            where user_id = _user_id and _permission = any(permissions)
          )
      $body$;
    $f$;
  end if;
end $$;

drop function if exists private.studio_mfa_ok(uuid);

notify pgrst, 'reload schema';
