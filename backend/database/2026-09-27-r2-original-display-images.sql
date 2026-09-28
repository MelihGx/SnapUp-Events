-- SnapUp Events — Cloudflare R2 original + display image storage
-- Phase 1: photos move to R2; videos and event covers remain on Cloudinary.
begin;

alter table public.media
  add column if not exists storage_provider text not null default 'cloudinary',
  add column if not exists r2_original_key text,
  add column if not exists r2_display_key text,
  add column if not exists original_bytes bigint,
  add column if not exists display_bytes bigint,
  add column if not exists original_mime_type text,
  add column if not exists display_mime_type text;

alter table public.media
  drop constraint if exists media_storage_provider_check;

alter table public.media
  add constraint media_storage_provider_check
  check (storage_provider in ('cloudinary', 'r2'));

alter table public.media
  drop constraint if exists media_r2_pair_check;

alter table public.media
  add constraint media_r2_pair_check
  check (
    storage_provider <> 'r2'
    or (
      r2_original_key is not null
      and r2_display_key is not null
    )
  );

alter table public.media
  drop constraint if exists media_original_bytes_check;

alter table public.media
  add constraint media_original_bytes_check
  check (original_bytes is null or original_bytes >= 0);

alter table public.media
  drop constraint if exists media_display_bytes_check;

alter table public.media
  add constraint media_display_bytes_check
  check (display_bytes is null or display_bytes >= 0);

create unique index if not exists media_r2_original_key_unique
  on public.media(r2_original_key)
  where r2_original_key is not null;

create unique index if not exists media_r2_display_key_unique
  on public.media(r2_display_key)
  where r2_display_key is not null;

-- Existing media stays Cloudinary. New R2 photo rows explicitly write 'r2'.
update public.media
set storage_provider = 'cloudinary'
where storage_provider is null;

commit;
