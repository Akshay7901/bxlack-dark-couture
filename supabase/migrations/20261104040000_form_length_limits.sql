-- Size limits for the fields customers (and visitors) write straight to the
-- database: profile, saved addresses and the launch waitlist. They match the
-- limits the checkout form already enforces, so oversized text can't be
-- stored. NOT VALID: existing rows are left alone; new writes are checked.

do $$
declare
  c record;
begin
  for c in
    select * from (values
      ('profiles',  'profiles_full_name_len',  'full_name',   200),
      ('profiles',  'profiles_phone_len',      'phone',        30),
      ('profiles',  'profiles_instagram_len',  'instagram',   100),
      ('addresses', 'addresses_full_name_len', 'full_name',   200),
      ('addresses', 'addresses_phone_len',     'phone',        30),
      ('addresses', 'addresses_line1_len',     'line1',       200),
      ('addresses', 'addresses_line2_len',     'line2',       200),
      ('addresses', 'addresses_city_len',      'city',        100),
      ('addresses', 'addresses_state_len',     'state',       100),
      ('addresses', 'addresses_postal_len',    'postal_code',  20),
      ('addresses', 'addresses_country_len',   'country',     100),
      ('waitlist_signups', 'waitlist_email_len', 'email',     255)
    ) as t(tbl, name, col, max_len)
  loop
    -- Skip columns this database doesn't have.
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = c.tbl and column_name = c.col
    ) then
      execute format('alter table public.%I drop constraint if exists %I', c.tbl, c.name);
      execute format(
        'alter table public.%I add constraint %I check (%I is null or char_length(%I) <= %s) not valid',
        c.tbl, c.name, c.col, c.col, c.max_len
      );
    end if;
  end loop;
end $$;
