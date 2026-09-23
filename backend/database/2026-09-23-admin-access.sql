-- SnapUp Events admin access roles.
-- Run this once in Supabase SQL Editor before deploying the admin backend.
begin;

alter table public.users
  add column if not exists user_role text not null default 'user';

update public.users
set user_role = 'user'
where user_role is null
   or user_role not in ('user', 'admin', 'super_admin');

alter table public.users
  alter column user_role set default 'user';

alter table public.users
  alter column user_role set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_user_role_check'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_user_role_check
      check (user_role in ('user', 'admin', 'super_admin'));
  end if;
end $$;

create index if not exists users_user_role_idx
  on public.users (user_role);

-- Existing SnapUp security hardening revokes anon/authenticated direct table access,
-- so this role column remains behind the Express/service-role boundary.

commit;
