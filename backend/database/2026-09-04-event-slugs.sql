-- SnapUp Events - human-readable public event gallery URLs
-- Example: /gallery/melih-sude-wedding

ALTER TABLE public.event
  ADD COLUMN IF NOT EXISTS event_slug text;

-- Build a stable slug for existing events. PostgreSQL's [:alnum:] class keeps
-- letters/numbers from the database locale, so non-English event names are not
-- forced to an event code.
WITH slug_source AS (
  SELECT
    event_id,
    event_created_at,
    left(
      COALESCE(
        NULLIF(
          trim(
            BOTH '-'
            FROM regexp_replace(
              translate(lower(trim(event_name)), 'çğıöşü', 'cgiosu'),
              '[^[:alnum:]]+',
              '-',
              'g'
            )
          ),
          ''
        ),
        'event'
      ),
      90
    ) AS base_slug
  FROM public.event
  WHERE event_slug IS NULL OR btrim(event_slug) = ''
),
slug_ranked AS (
  SELECT
    event_id,
    base_slug,
    row_number() OVER (
      PARTITION BY base_slug
      ORDER BY event_created_at NULLS LAST, event_id
    ) AS slug_number
  FROM slug_source
)
UPDATE public.event AS e
SET event_slug = CASE
  WHEN r.slug_number = 1 THEN left(r.base_slug, 90)
  ELSE left(r.base_slug, 82) || '-' || r.slug_number::text
END
FROM slug_ranked AS r
WHERE e.event_id = r.event_id;

-- If this migration is rerun after manual data edits, repair any remaining
-- blank values before applying NOT NULL.
UPDATE public.event
SET event_slug = 'event-' || left(replace(event_id::text, '-', ''), 10)
WHERE event_slug IS NULL OR btrim(event_slug) = '';

CREATE UNIQUE INDEX IF NOT EXISTS event_event_slug_unique_idx
  ON public.event (event_slug);

ALTER TABLE public.event
  ALTER COLUMN event_slug SET NOT NULL;

COMMENT ON COLUMN public.event.event_slug IS
  'Stable, human-readable public URL slug for event gallery links.';
