-- SnapUp Events — R2 Video Phase 1
-- New videos are stored entirely in Cloudflare R2:
--   private original -> snapup-originals
--   H.264/AAC MP4    -> snapup-display
--   WEBP poster      -> snapup-display

begin;

alter table public.media
  add column if not exists r2_poster_key text,
  add column if not exists video_duration_seconds numeric(10,3),
  add column if not exists video_width integer,
  add column if not exists video_height integer;

create unique index if not exists media_r2_poster_key_unique
  on public.media(r2_poster_key)
  where r2_poster_key is not null;

alter table public.media
  drop constraint if exists media_video_duration_check;

alter table public.media
  add constraint media_video_duration_check
  check (
    video_duration_seconds is null
    or (video_duration_seconds > 0 and video_duration_seconds <= 300.25)
  );

alter table public.media
  drop constraint if exists media_video_width_check;

alter table public.media
  add constraint media_video_width_check
  check (video_width is null or (video_width > 0 and video_width <= 3840));

alter table public.media
  drop constraint if exists media_video_height_check;

alter table public.media
  add constraint media_video_height_check
  check (video_height is null or (video_height > 0 and video_height <= 3840));

-- Message-only rows must not point at any physical media object.
alter table public.media
  drop constraint if exists media_database_payload_check;

alter table public.media
  add constraint media_database_payload_check
  check (
    storage_provider <> 'database'
    or (
      media_url is null
      and cloudinary_public_id is null
      and r2_original_key is null
      and r2_display_key is null
      and r2_poster_key is null
    )
  );

comment on column public.media.storage_provider is
'Physical payload location: r2 for new images/videos, cloudinary only for legacy media, database for message-only rows.';

comment on column public.media.r2_poster_key is
'Optional WEBP poster object in the R2 display bucket for video media.';

comment on column public.media.video_duration_seconds is
'Validated original video duration in seconds.';

comment on column public.media.video_width is
'Validated original video width in pixels.';

comment on column public.media.video_height is
'Validated original video height in pixels.';

commit;
