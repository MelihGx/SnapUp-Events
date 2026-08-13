-- SnapUp Events feedback inbox.
-- Run this migration in the Supabase SQL Editor before deploying the backend.
begin;

create table if not exists public.feedback (
  feedback_id uuid primary key default gen_random_uuid(),
  user_id text,
  category text not null,
  message text not null,
  contact_email text,
  page_path text not null,
  language_code text not null default 'en',
  status text not null default 'new',
  request_id text,
  turnstile_hostname text,
  notification_sent_at timestamptz,
  created_at timestamptz not null default now(),
  constraint feedback_category_check
    check (category in ('bug', 'suggestion', 'complaint', 'other')),
  constraint feedback_message_length_check
    check (char_length(btrim(message)) between 10 and 2000),
  constraint feedback_contact_email_length_check
    check (contact_email is null or char_length(contact_email) between 3 and 254),
  constraint feedback_page_path_length_check
    check (char_length(page_path) between 1 and 500),
  constraint feedback_language_code_check
    check (language_code ~ '^[a-z]{2,3}(-[a-z]{2})?$'),
  constraint feedback_status_check
    check (status in ('new', 'reviewed', 'resolved', 'archived'))
);

create index if not exists feedback_created_at_idx
  on public.feedback (created_at desc);
create index if not exists feedback_status_created_at_idx
  on public.feedback (status, created_at desc);
create index if not exists feedback_user_id_idx
  on public.feedback (user_id)
  where user_id is not null;

alter table public.feedback enable row level security;
revoke all on table public.feedback from public, anon, authenticated;
grant select, insert, update, delete on table public.feedback to service_role;

commit;
