-- SnapUp Events — Cloudflare R2 event cover storage
-- Phase 2: new event covers use the same original + display model as photos.
-- Existing Cloudinary covers remain valid and are marked as cloudinary.

begin;

alter table public.event
  add column if not exists event_cover_storage_provider text,
  add column if not exists event_cover_r2_original_key text,
  add column if not exists event_cover_r2_display_key text,
  add column if not exists event_cover_original_bytes bigint,
  add column if not exists event_cover_display_bytes bigint,
  add column if not exists event_cover_original_mime_type text,
  add column if not exists event_cover_display_mime_type text;

update public.event
set event_cover_storage_provider = 'cloudinary'
where event_cover_url is not null
  and event_cover_storage_provider is null;

alter table public.event
  drop constraint if exists event_cover_storage_provider_check;

alter table public.event
  add constraint event_cover_storage_provider_check
  check (
    event_cover_storage_provider is null
    or event_cover_storage_provider in ('cloudinary', 'r2')
  );

alter table public.event
  drop constraint if exists event_cover_r2_pair_check;

alter table public.event
  add constraint event_cover_r2_pair_check
  check (
    event_cover_storage_provider <> 'r2'
    or (
      event_cover_url is not null
      and event_cover_r2_original_key is not null
      and event_cover_r2_display_key is not null
    )
  );

alter table public.event
  drop constraint if exists event_cover_original_bytes_check;

alter table public.event
  add constraint event_cover_original_bytes_check
  check (
    event_cover_original_bytes is null
    or event_cover_original_bytes >= 0
  );

alter table public.event
  drop constraint if exists event_cover_display_bytes_check;

alter table public.event
  add constraint event_cover_display_bytes_check
  check (
    event_cover_display_bytes is null
    or event_cover_display_bytes >= 0
  );

create unique index if not exists event_cover_r2_original_key_unique
  on public.event(event_cover_r2_original_key)
  where event_cover_r2_original_key is not null;

create unique index if not exists event_cover_r2_display_key_unique
  on public.event(event_cover_r2_display_key)
  where event_cover_r2_display_key is not null;

comment on column public.event.event_cover_url is
'Public display URL for the event cover. New covers use the R2 display bucket; legacy Cloudinary URLs remain supported.';

comment on column public.event.event_cover_r2_original_key is
'Private Cloudflare R2 object key for the original event cover.';

comment on column public.event.event_cover_r2_display_key is
'Public Cloudflare R2 object key for the optimized WEBP event cover.';

commit;
