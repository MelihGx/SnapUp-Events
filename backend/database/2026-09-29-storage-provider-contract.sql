-- SnapUp Events — storage provider contract
-- Finalizes the intentional hybrid storage model:
--   image   -> R2
--   video   -> Cloudinary
--   message -> Supabase/Postgres only ("database")
-- Legacy Cloudinary image rows remain valid.

begin;

alter table public.media
  alter column storage_provider set default 'database';

alter table public.media
  drop constraint if exists media_storage_provider_check;

alter table public.media
  add constraint media_storage_provider_check
  check (storage_provider in ('cloudinary', 'r2', 'database'));

-- Message-only rows have no external storage object. Older rows inherited the
-- previous 'cloudinary' default even though no Cloudinary object existed.
update public.media m
set
  storage_provider = 'database',
  media_url = null,
  cloudinary_public_id = null,
  r2_original_key = null,
  r2_display_key = null,
  original_bytes = null,
  display_bytes = null,
  original_mime_type = null,
  display_mime_type = null
where m.media_type_id in (
  select mt.media_type_id
  from public.media_type mt
  where mt.media_type = 'message'
);

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
    )
  );

alter table public.media
  drop constraint if exists media_r2_provider_payload_check;

alter table public.media
  add constraint media_r2_provider_payload_check
  check (
    storage_provider <> 'r2'
    or (
      r2_original_key is not null
      and r2_display_key is not null
      and cloudinary_public_id is null
    )
  );

comment on column public.media.storage_provider is
'Physical payload location: r2 for new images, cloudinary for videos/legacy media, database for message-only rows.';

commit;
