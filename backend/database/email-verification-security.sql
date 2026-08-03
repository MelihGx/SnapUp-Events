BEGIN;

-- Bind each verification token to the exact email address that received it.
ALTER TABLE public.email_verification_tokens
  ADD COLUMN IF NOT EXISTS email_address TEXT;

UPDATE public.email_verification_tokens AS token
SET email_address = lower(trim(user_row.user_mail))
FROM public.users AS user_row
WHERE token.user_id = user_row.user_id
  AND token.email_address IS NULL;

ALTER TABLE public.email_verification_tokens
  ALTER COLUMN email_address SET NOT NULL;

-- Changing an account email always requires verification again.
CREATE OR REPLACE FUNCTION public.reset_email_verification_on_mail_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_mail IS DISTINCT FROM OLD.user_mail THEN
    NEW.is_email_verified := FALSE;
    NEW.email_verified_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_reset_email_verification
  ON public.users;

CREATE TRIGGER users_reset_email_verification
BEFORE UPDATE OF user_mail ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.reset_email_verification_on_mail_change();

COMMIT;
