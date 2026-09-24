-- SnapUp Events admin audit log.
-- Run once in Supabase SQL Editor BEFORE deploying the write-enabled admin backend.

begin;

create table if not exists public.admin_audit_logs (
  audit_id uuid primary key default gen_random_uuid(),
  admin_user_id uuid null references public.users(user_id) on delete set null,
  action text not null,
  category text not null,
  target_type text null,
  target_id text null,
  target_label text null,
  description text not null,
  details jsonb not null default '{}'::jsonb,
  ip_address text null,
  request_id text null,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_logs
  drop constraint if exists admin_audit_logs_category_check;

alter table public.admin_audit_logs
  add constraint admin_audit_logs_category_check
  check (category in ('USER', 'EVENT', 'STORAGE', 'SECURITY', 'SYSTEM'));

create index if not exists admin_audit_logs_created_at_idx
  on public.admin_audit_logs (created_at desc);

create index if not exists admin_audit_logs_admin_user_id_idx
  on public.admin_audit_logs (admin_user_id);

create index if not exists admin_audit_logs_category_idx
  on public.admin_audit_logs (category);

alter table public.admin_audit_logs enable row level security;

revoke all on table public.admin_audit_logs from public, anon, authenticated;
grant select, insert on table public.admin_audit_logs to service_role;

comment on table public.admin_audit_logs is
  'Immutable application audit trail for privileged SnapUp admin actions.';

commit;
