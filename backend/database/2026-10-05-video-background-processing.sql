-- SnapUp Events — background video processing queue
-- Run this migration before deploying the backend version that contains
-- videoProcessingQueueService.js.
--
-- Upload flow after this migration:
--   browser -> Render temp -> R2 original -> queued job -> HTTP 202
--   worker  -> R2 original -> FFmpeg -> display.mp4 + poster.webp -> media row

begin;

create table if not exists public.video_processing_jobs (
  job_id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.event(event_id) on delete cascade,
  guest_id uuid not null references public.event_guests(guest_id) on delete cascade,
  message text,
  target_media_status text not null
    check (target_media_status in ('pending', 'approved', 'rejected')),
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'ready', 'failed')),
  original_key text not null unique,
  display_key text not null unique,
  poster_key text not null unique,
  original_bytes bigint not null check (original_bytes >= 0),
  original_mime_type text,
  video_duration_seconds numeric(10,3)
    check (
      video_duration_seconds is null
      or (video_duration_seconds > 0 and video_duration_seconds <= 300.25)
    ),
  video_width integer
    check (video_width is null or (video_width > 0 and video_width <= 3840)),
  video_height integer
    check (video_height is null or (video_height > 0 and video_height <= 3840)),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  error_code text,
  error_message text,
  media_id uuid references public.media(media_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create index if not exists video_processing_jobs_status_created_idx
  on public.video_processing_jobs(status, created_at);

create index if not exists video_processing_jobs_event_idx
  on public.video_processing_jobs(event_id);

create index if not exists video_processing_jobs_guest_active_idx
  on public.video_processing_jobs(event_id, guest_id, status);

alter table public.video_processing_jobs enable row level security;

comment on table public.video_processing_jobs is
'Persistent R2-backed queue for videos waiting for or undergoing FFmpeg processing. The backend service-role worker is the only intended caller.';

comment on column public.video_processing_jobs.target_media_status is
'Final moderation status copied to public.media after video processing succeeds.';

commit;
