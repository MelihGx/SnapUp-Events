-- SnapUp Events — User country
-- Stores a self-reported registration country as ISO 3166-1 alpha-2.
-- Existing accounts remain NULL and appear as "Unknown / Not set" in Admin.

begin;

alter table public.users
  add column if not exists user_country_code varchar(2);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_country_code_format_check'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_country_code_format_check
      check (
        user_country_code is null
        or user_country_code ~ '^[A-Z]{2}$'
      );
  end if;
end
$$;

create index if not exists idx_users_country_code
  on public.users(user_country_code);

comment on column public.users.user_country_code is
  'Self-reported registration country code (ISO 3166-1 alpha-2; XK also accepted by the application for Kosovo).';

commit;
