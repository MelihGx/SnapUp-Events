-- SnapUp Events: etkinlik kapak fotoğrafı
-- Supabase SQL Editor'da bir kez çalıştırılabilir.

ALTER TABLE public.event
ADD COLUMN IF NOT EXISTS event_cover_url TEXT;

COMMENT ON COLUMN public.event.event_cover_url IS
'Cloudinary üzerinde saklanan etkinlik kapak fotoğrafının güvenli URL adresi.';
