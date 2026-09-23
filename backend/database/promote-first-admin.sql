-- Run AFTER 2026-09-23-admin-access.sql.
-- Replace YOUR_ADMIN_EMAIL with the email address of the existing SnapUp account
-- that should become the first super admin.
--
-- Incrementing token_version invalidates existing sessions, so log in again
-- after running this statement.

update public.users
set
  user_role = 'super_admin',
  token_version = token_version + 1
where lower(user_mail) = lower('melih.admin@snapupevents.com');

-- Verify:
select
  user_id,
  user_name,
  user_mail,
  user_role,
  is_user_active,
  is_email_verified,
  token_version
from public.users
where lower(user_mail) = lower('melih.admin@snapupevents.com');
