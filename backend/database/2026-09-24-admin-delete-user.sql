-- SnapUp Events — super-admin user deletion.
-- Run AFTER:
--   1) 2026-08-07-security-hardening.sql
--   2) 2026-09-24-admin-audit-logs.sql
--
-- The existing delete_user_account() function performs the relational cleanup.
-- This wrapper adds:
--   - live super_admin verification
--   - protection against deleting self/admin accounts
--   - exact target-email confirmation
--   - audit logging in the SAME database transaction
--   - event-cover cleanup outbox entries

begin;

create or replace function public.admin_delete_user_account(
  p_admin_user_id uuid,
  p_target_user_id uuid,
  p_confirmation_email text,
  p_request_id text default null,
  p_ip_address text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_role text;
  v_admin_active boolean;
  v_admin_verified boolean;
  v_target_email text;
  v_target_name text;
  v_target_role text;
  v_result jsonb;
begin
  select
    u.user_role,
    u.is_user_active,
    u.is_email_verified
  into
    v_admin_role,
    v_admin_active,
    v_admin_verified
  from public.users u
  where u.user_id = p_admin_user_id
  for update;

  if not found
     or v_admin_role <> 'super_admin'
     or v_admin_active is not true
     or v_admin_verified is not true then
    raise exception 'super admin permission required'
      using errcode = '42501';
  end if;

  if p_admin_user_id = p_target_user_id then
    raise exception 'super admin cannot delete own account'
      using errcode = '42501';
  end if;

  select
    u.user_mail,
    u.user_name,
    u.user_role
  into
    v_target_email,
    v_target_name,
    v_target_role
  from public.users u
  where u.user_id = p_target_user_id
  for update;

  if not found then
    raise exception 'target user not found'
      using errcode = 'P0002';
  end if;

  -- Admin and super-admin accounts require a separate privilege-management flow.
  if v_target_role <> 'user' then
    raise exception 'admin accounts cannot be deleted from customer deletion flow'
      using errcode = '42501';
  end if;

  if lower(btrim(coalesce(p_confirmation_email, ''))) <>
     lower(btrim(v_target_email)) then
    raise exception 'target email confirmation does not match'
      using errcode = '22023';
  end if;

  -- The original account-deletion RPC queues media Cloudinary public IDs.
  -- Queue event covers too, because event_cover_url is stored directly on event.
  insert into public.cloudinary_cleanup_outbox(
    public_id,
    resource_type,
    delivery_type
  )
  select distinct
    regexp_replace(
      regexp_replace(
        case
          when position('/upload/' in e.event_cover_url) > 0
            then split_part(e.event_cover_url, '/upload/', 2)
          when position('/authenticated/' in e.event_cover_url) > 0
            then split_part(e.event_cover_url, '/authenticated/', 2)
          else ''
        end,
        '^v[0-9]+/',
        ''
      ),
      '\.[^./?]+(\?.*)?$',
      ''
    ),
    'image',
    case
      when position('/upload/' in e.event_cover_url) > 0 then 'upload'
      else 'authenticated'
    end
  from public.event e
  where e.user_id = p_target_user_id
    and e.event_cover_url is not null
    and (
      position('/upload/' in e.event_cover_url) > 0
      or position('/authenticated/' in e.event_cover_url) > 0
    )
    and length(
      regexp_replace(
        regexp_replace(
          case
            when position('/upload/' in e.event_cover_url) > 0
              then split_part(e.event_cover_url, '/upload/', 2)
            else split_part(e.event_cover_url, '/authenticated/', 2)
          end,
          '^v[0-9]+/',
          ''
        ),
        '\.[^./?]+(\?.*)?$',
        ''
      )
    ) > 0;

  v_result := public.delete_user_account(p_target_user_id::text);

  if coalesce((v_result->>'deleted')::boolean, false) is not true then
    raise exception 'user account could not be deleted';
  end if;

  insert into public.admin_audit_logs(
    admin_user_id,
    action,
    category,
    target_type,
    target_id,
    target_label,
    description,
    details,
    ip_address,
    request_id
  )
  values (
    p_admin_user_id,
    'DELETE_USER_ACCOUNT',
    'SECURITY',
    'user',
    p_target_user_id::text,
    v_target_email,
    format(
      'Permanently deleted customer account %s (%s).',
      coalesce(v_target_name, 'Unnamed user'),
      v_target_email
    ),
    jsonb_build_object(
      'summary',
      'Customer account permanently deleted',
      'target_email',
      v_target_email,
      'target_name',
      v_target_name,
      'deleted_events',
      coalesce((v_result->>'events')::bigint, 0),
      'assets_queued',
      coalesce((v_result->>'assets_queued')::bigint, 0)
    ),
    nullif(btrim(coalesce(p_ip_address, '')), ''),
    nullif(btrim(coalesce(p_request_id, '')), '')
  );

  return v_result || jsonb_build_object(
    'target_email', v_target_email,
    'target_name', v_target_name
  );
end;
$$;

revoke all on function public.admin_delete_user_account(
  uuid,
  uuid,
  text,
  text,
  text
) from public, anon, authenticated;

grant execute on function public.admin_delete_user_account(
  uuid,
  uuid,
  text,
  text,
  text
) to service_role;

commit;
