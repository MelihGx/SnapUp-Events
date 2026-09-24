-- SnapUp Events — Admin Suspend / Reactivate User
-- Requires:
--   public.users.user_role
--   public.users.token_version
--   public.admin_audit_logs
--
-- This function performs the status change, session invalidation and audit log
-- in one transaction.

begin;

create or replace function public.admin_set_user_active_status(
  p_admin_user_id uuid,
  p_target_user_id uuid,
  p_active boolean,
  p_reason text,
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
  v_current_active boolean;
  v_new_token_version integer;

  v_reason text;
  v_action text;
  v_description text;
begin
  if p_active is null then
    raise exception 'active status is required'
      using errcode = '22023';
  end if;

  v_reason := nullif(btrim(coalesce(p_reason, '')), '');

  if v_reason is null or length(v_reason) < 3 then
    raise exception 'a reason of at least 3 characters is required'
      using errcode = '22023';
  end if;

  if length(v_reason) > 300 then
    raise exception 'reason is too long'
      using errcode = '22023';
  end if;

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
     or v_admin_role not in ('admin', 'super_admin')
     or v_admin_active is not true
     or v_admin_verified is not true then
    raise exception 'admin permission required'
      using errcode = '42501';
  end if;

  if p_admin_user_id = p_target_user_id then
    raise exception 'admin cannot change own account status here'
      using errcode = '42501';
  end if;

  select
    u.user_mail,
    u.user_name,
    u.user_role,
    u.is_user_active
  into
    v_target_email,
    v_target_name,
    v_target_role,
    v_current_active
  from public.users u
  where u.user_id = p_target_user_id
  for update;

  if not found then
    raise exception 'target user not found'
      using errcode = 'P0002';
  end if;

  if v_target_role <> 'user' then
    raise exception 'admin accounts cannot be managed from customer status flow'
      using errcode = '42501';
  end if;

  if v_current_active = p_active then
    raise exception 'user is already in the requested state'
      using errcode = '22023';
  end if;

  update public.users
  set
    is_user_active = p_active,
    token_version = coalesce(token_version, 0) + 1
  where user_id = p_target_user_id
  returning token_version into v_new_token_version;

  if p_active then
    v_action := 'REACTIVATE_USER';
    v_description := format(
      'Reactivated customer account %s (%s).',
      coalesce(v_target_name, 'Unnamed user'),
      v_target_email
    );
  else
    v_action := 'SUSPEND_USER';
    v_description := format(
      'Suspended customer account %s (%s).',
      coalesce(v_target_name, 'Unnamed user'),
      v_target_email
    );
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
    v_action,
    'SECURITY',
    'user',
    p_target_user_id::text,
    v_target_email,
    v_description,
    jsonb_build_object(
      'summary',
      case
        when p_active then 'Customer account reactivated'
        else 'Customer account suspended'
      end,
      'reason',
      v_reason,
      'previous_active',
      v_current_active,
      'new_active',
      p_active,
      'token_version',
      v_new_token_version
    ),
    nullif(btrim(coalesce(p_ip_address, '')), ''),
    nullif(btrim(coalesce(p_request_id, '')), '')
  );

  return jsonb_build_object(
    'changed', true,
    'user_id', p_target_user_id,
    'user_mail', v_target_email,
    'user_name', v_target_name,
    'is_user_active', p_active,
    'token_version', v_new_token_version
  );
end;
$$;

revoke all on function public.admin_set_user_active_status(
  uuid,
  uuid,
  boolean,
  text,
  text,
  text
) from public, anon, authenticated;

grant execute on function public.admin_set_user_active_status(
  uuid,
  uuid,
  boolean,
  text,
  text,
  text
) to service_role;

commit;
