begin;

create table if not exists public.event_slideshow_settings (
  event_id uuid primary key
    references public.event(event_id) on delete cascade,
  slideshow_mode text not null default 'latest'
    check (slideshow_mode in ('latest', 'random', 'selected')),
  latest_min_seconds integer not null default 10
    check (latest_min_seconds between 3 and 300),
  random_interval_seconds integer not null default 10
    check (random_interval_seconds between 3 and 300),
  selected_media_id uuid null
    references public.media(media_id) on delete set null,
  slideshow_updated_at timestamptz not null default now(),
  updated_by uuid null
    references public.users(user_id) on delete set null
);

comment on table public.event_slideshow_settings is
  'Admin-controlled live slideshow mode and timing for each SnapUp event.';

create index if not exists idx_event_slideshow_selected_media
  on public.event_slideshow_settings(selected_media_id)
  where selected_media_id is not null;

alter table public.event_slideshow_settings enable row level security;
revoke all on table public.event_slideshow_settings from public, anon, authenticated;
grant select, insert, update, delete
  on table public.event_slideshow_settings to service_role;

commit;
