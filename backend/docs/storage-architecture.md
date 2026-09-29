# SnapUp Events Storage Architecture

## Status

This document defines the intentional storage model after the Cloudflare R2
image migration. The system is intentionally hybrid; Cloudinary is not an
accidental leftover.

| Payload | New storage provider | Database provider value |
|---|---|---|
| Photo original | Cloudflare R2 `snapup-originals` | `r2` |
| Photo display derivative | Cloudflare R2 `snapup-display` | `r2` |
| Event cover original | Cloudflare R2 `snapup-originals` | `event.event_cover_storage_provider = r2` |
| Event cover display derivative | Cloudflare R2 `snapup-display` | `event.event_cover_storage_provider = r2` |
| Video | Cloudinary | `cloudinary` |
| Message-only media row | Supabase/Postgres only | `database` |
| Legacy photo/video | Cloudinary until migrated/removed | `cloudinary` |
| Legacy event cover | Cloudinary until changed/removed | `event.event_cover_storage_provider = cloudinary` |

## R2 object layout

New image:

```text
snapup-originals/
  events/{event_id}/media/{asset_uuid}/original.{jpg|png|webp}

snapup-display/
  events/{event_id}/media/{asset_uuid}/display.webp
```

New event cover:

```text
snapup-originals/
  events/{event_id}/cover/{asset_uuid}/original.{jpg|png|webp}

snapup-display/
  events/{event_id}/cover/{asset_uuid}/display.webp
```

`original` is private and preserves the uploaded bytes.

`display.webp` is generated independently with Sharp and is the copy used for
gallery/detail/slideshow delivery.

## Database contract

### `media.storage_provider`

- `r2`: the media payload is an R2 image pair.
- `cloudinary`: the payload is a Cloudinary asset. New videos use this value;
  old Cloudinary photos can also keep it.
- `database`: there is no external media object; the row is a message.

For R2 rows:

```text
r2_original_key != null
r2_display_key  != null
cloudinary_public_id = null
```

For message rows:

```text
media_url = null
cloudinary_public_id = null
r2_original_key = null
r2_display_key = null
```

### Event cover

A cover can have:

- `event_cover_storage_provider = r2`
- `event_cover_storage_provider = cloudinary`
- `null` when no cover exists.

## Read paths

Normal image display:
`media.media_url` -> `https://media.snapupevents.com/.../display.webp`

Memory Book:
R2 S3 `GetObject(r2_display_key)` -> Sharp -> PDFKit.
The browser does not build the PDF from R2 images.

Original Event Archive:
R2 S3 `GetObject(r2_original_key)` -> direct stream into ZIP.
No presigned R2 hostname or public display URL is required.

Optimized Event Archive:
uses the public display derivative.

Video playback/archive:
Cloudinary delivery remains active.

## Delete paths

When an R2 image is removed, both keys must be deleted:

```text
r2_original_key
r2_display_key
```

The same applies to event covers.

Current cleanup paths cover individual media delete, cover replacement/removal,
event delete, user delete and super-admin user delete.

## R2 reconciliation

Uploads are multi-system operations: R2 succeeds first, then Supabase metadata
is written. Rollback is implemented, but a process crash can still theoretically
leave an orphan object.

Run a read-only audit:

```powershell
node scripts/r2Reconcile.js
```

Verbose:

```powershell
node scripts/r2Reconcile.js --verbose
```

Only after reviewing the dry-run output, delete eligible orphan objects:

```powershell
node scripts/r2Reconcile.js --apply
```

The default orphan safety age is 24 hours. Override it with:

```env
R2_RECONCILE_MIN_AGE_HOURS=24
```

The script never deletes database-referenced objects. Recent unreferenced
objects are also protected by the safety-age window.

A "missing object" means Supabase references an R2 key that R2 does not contain.
The script reports this as an integrity problem and does not modify the database.

## Cloudinary retirement

Do not remove Cloudinary columns or credentials yet.

Cloudinary can be retired only after:

1. new video uploads have a replacement storage/transcoding strategy,
2. legacy Cloudinary images/covers have been migrated or expired,
3. `media.storage_provider = cloudinary` contains no required assets,
4. legacy cover rows no longer require Cloudinary,
5. deletion/archive/slideshow paths are verified without Cloudinary.

Until then, the hybrid architecture is the supported production design.
