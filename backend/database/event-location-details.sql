-- SnapUp Events: mekân, açık adres ve harita pini
-- Supabase SQL Editor'da bir kez çalıştırılabilir.

ALTER TABLE public.event
ADD COLUMN IF NOT EXISTS event_address TEXT,
ADD COLUMN IF NOT EXISTS event_latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS event_longitude DOUBLE PRECISION;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'event_coordinates_valid'
      AND conrelid = 'public.event'::regclass
  ) THEN
    ALTER TABLE public.event
    ADD CONSTRAINT event_coordinates_valid CHECK (
      (
        event_latitude IS NULL
        AND event_longitude IS NULL
      )
      OR
      (
        event_latitude IS NOT NULL
        AND event_longitude IS NOT NULL
        AND
        event_latitude BETWEEN -90 AND 90
        AND event_longitude BETWEEN -180 AND 180
      )
    );
  END IF;
END
$$;

COMMENT ON COLUMN public.event.event_location IS
'Etkinliğin mekân adı veya kısa konum bilgisi.';

COMMENT ON COLUMN public.event.event_address IS
'Etkinliğin isteğe bağlı açık adresi.';

COMMENT ON COLUMN public.event.event_latitude IS
'Haritada seçilen etkinlik pininin enlem değeri.';

COMMENT ON COLUMN public.event.event_longitude IS
'Haritada seçilen etkinlik pininin boylam değeri.';
