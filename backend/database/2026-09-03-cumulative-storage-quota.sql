-- SnapUp Events: cumulative event storage quota
-- Uploaded bytes consume quota permanently for the lifetime of the event.
-- Deleting a media row/file does NOT return consumed quota.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'event'
      AND column_name = 'storage_consumed_bytes'
  ) THEN
    ALTER TABLE public.event
      ADD COLUMN storage_consumed_bytes bigint NOT NULL DEFAULT 0;

    -- One-time backfill: start existing events from their media that still exists
    -- at the moment this migration is first applied.
    UPDATE public.event AS e
    SET storage_consumed_bytes = COALESCE((
      SELECT SUM(GREATEST(COALESCE(m.bytes, 0), 0))
      FROM public.media AS m
      WHERE m.event_id = e.event_id
    ), 0);
  END IF;
END
$$;

ALTER TABLE public.event
  DROP CONSTRAINT IF EXISTS event_storage_consumed_bytes_nonnegative;

ALTER TABLE public.event
  ADD CONSTRAINT event_storage_consumed_bytes_nonnegative
  CHECK (storage_consumed_bytes >= 0);

CREATE OR REPLACE FUNCTION public.increment_event_storage_consumed(
  p_event_id uuid,
  p_bytes bigint
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_total bigint;
BEGIN
  IF p_event_id IS NULL THEN
    RAISE EXCEPTION 'event id is required';
  END IF;

  IF p_bytes IS NULL OR p_bytes < 0 THEN
    RAISE EXCEPTION 'bytes must be zero or greater';
  END IF;

  UPDATE public.event
  SET storage_consumed_bytes = storage_consumed_bytes + p_bytes
  WHERE event_id = p_event_id
  RETURNING storage_consumed_bytes INTO v_new_total;

  IF v_new_total IS NULL THEN
    RAISE EXCEPTION 'event not found';
  END IF;

  RETURN v_new_total;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_event_storage_consumed(uuid, bigint)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_event_storage_consumed(uuid, bigint)
  TO service_role;
