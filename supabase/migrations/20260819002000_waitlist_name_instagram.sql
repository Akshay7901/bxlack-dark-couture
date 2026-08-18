-- Capture name and Instagram handle alongside email on waitlist signup.
alter table public.waitlist_signups
  add column name text not null,
  add column instagram text;
