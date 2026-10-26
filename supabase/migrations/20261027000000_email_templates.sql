-- Admin edits to email wording. One row per edited template; a null field
-- means "use the default wording in code". Read and written only through
-- admin server functions (service role), so no client policies.
create table if not exists public.email_templates (
  id text primary key,
  enabled boolean not null default true,
  subject text,
  heading text,
  intro text,
  button text,
  footer text,
  updated_at timestamptz not null default now()
);

alter table public.email_templates enable row level security;
grant all on public.email_templates to service_role;

create trigger email_templates_set_updated_at before update on public.email_templates
for each row execute function public.set_updated_at();
