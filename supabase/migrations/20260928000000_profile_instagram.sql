-- Optional Instagram handle, captured at sign-up and editable from Profile.
alter table public.profiles add column if not exists instagram text;
