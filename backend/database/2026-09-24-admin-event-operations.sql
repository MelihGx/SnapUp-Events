-- SnapUp Events — Admin Event Operations
-- 1) Suspend / Reactivate Event
-- 2) Change Event Package
-- 3) Storage Override
--
-- Requires public.admin_audit_logs and existing admin roles.

begin;

alter table public.event
  add column if not exists admin_suspended boolean not null default false;

alter table public.event
  add column if not exists admin_previous_active boolean;

alter table public.event
  add column if not exists storage_limit_override_bytes bigint;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'event_storage_limit_override_bytes_check'
      and conrelid = 'public.event'::regclass
  ) then
    alter table public.event
      add constraint event_storage_limit_override_bytes_check
      check (
        storage_limit_override_bytes is null
        or (
          storage_limit_override_bytes >= 10485760
          and storage_limit_override_bytes <= 1099511627776
        )
      );
  end if;
end
$$;

create or replace function public.prevent_admin_suspended_event_reactivation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.admin_suspended is true
     and new.admin_suspended is true
     and new.is_event_active is true then
    raise exception 'event is suspended by an administrator'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_admin_suspended_event_reactivation
on public.event;

create trigger trg_prevent_admin_suspended_event_reactivation
before update on public.event
for each row
execute function public.prevent_admin_suspended_event_reactivation();

create or replace function public.admin_set_event_suspension(
  p_admin_user_id uuid,
  p_event_id uuid,
  p_suspended boolean,
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

  v_event_name text;
  v_event_code text;
  v_active boolean;
  v_admin_suspended boolean;
  v_previous_active boolean;
  v_restored_active boolean;

  v_reason text;
  v_action text;
  v_description text;
begin
  if p_suspended is null then
    raise exception 'suspended state is required'
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

  select u.user_role, u.is_user_active, u.is_email_verified
  into v_admin_role, v_admin_active, v_admin_verified
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

  select
    e.event_name,
    e.event_code,
    e.is_event_active,
    e.admin_suspended,
    e.admin_previous_active
  into
    v_event_name,
    v_event_code,
    v_active,
    v_admin_suspended,
    v_previous_active
  from public.event e
  where e.event_id = p_event_id
  for update;

  if not found then
    raise exception 'event not found'
      using errcode = 'P0002';
  end if;

  if v_admin_suspended = p_suspended then
    raise exception 'event is already in the requested admin suspension state'
      using errcode = '22023';
  end if;

  if p_suspended then
    update public.event
    set
      admin_previous_active = v_active,
      admin_suspended = true,
      is_event_active = false
    where event_id = p_event_id;

    v_action := 'SUSPEND_EVENT';
    v_restored_active := false;
    v_description := format(
      'Suspended event %s (#%s).',
      coalesce(v_event_name, 'Untitled event'),
      coalesce(v_event_code, '------')
    );
  else
    v_restored_active := coalesce(v_previous_active, true);

    update public.event
    set
      admin_suspended = false,
      is_event_active = v_restored_active,
      admin_previous_active = null
    where event_id = p_event_id;

    v_action := 'REACTIVATE_EVENT';
    v_description := format(
      'Reactivated event %s (#%s).',
      coalesce(v_event_name, 'Untitled event'),
      coalesce(v_event_code, '------')
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
    'event',
    p_event_id::text,
    '#' || coalesce(v_event_code, '------'),
    v_description,
    jsonb_build_object(
      'summary',
      case
        when p_suspended then 'Event suspended by admin'
        else 'Event admin suspension removed'
      end,
      'reason',
      v_reason,
      'previous_status',
      case
        when v_admin_suspended then 'Suspended'
        when v_active then 'Active'
        else 'Inactive'
      end,
      'new_status',
      case
        when p_suspended then 'Suspended'
        when v_restored_active then 'Active'
        else 'Inactive'
      end,
      'previous_active',
      v_active,
      'new_active',
      v_restored_active,
      'previous_admin_suspended',
      v_admin_suspended,
      'new_admin_suspended',
      p_suspended
    ),
    nullif(btrim(coalesce(p_ip_address, '')), ''),
    nullif(btrim(coalesce(p_request_id, '')), '')
  );

  return jsonb_build_object(
    'changed', true,
    'event_id', p_event_id,
    'event_name', v_event_name,
    'event_code', v_event_code,
    'admin_suspended', p_suspended,
    'is_event_active', v_restored_active
  );
end;
$$;

create or replace function public.admin_change_event_package(
  p_admin_user_id uuid,
  p_event_id uuid,
  p_package_key text,
  p_packet_level_id uuid,
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

  v_event_name text;
  v_event_code text;
  v_previous_package text;
  v_storage_consumed bigint;
  v_override bigint;
  v_package_limit bigint;

  v_package text;
  v_reason text;
begin
  v_package := lower(btrim(coalesce(p_package_key, '')));
  v_reason := nullif(btrim(coalesce(p_reason, '')), '');

  if v_package not in ('free', 'mini', 'plus', 'premium') then
    raise exception 'invalid package'
      using errcode = '22023';
  end if;

  if p_packet_level_id is null then
    raise exception 'packet level is required'
      using errcode = '22023';
  end if;

  if v_reason is null or length(v_reason) < 3 then
    raise exception 'a reason of at least 3 characters is required'
      using errcode = '22023';
  end if;

  if length(v_reason) > 300 then
    raise exception 'reason is too long'
      using errcode = '22023';
  end if;

  select u.user_role, u.is_user_active, u.is_email_verified
  into v_admin_role, v_admin_active, v_admin_verified
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

  select
    e.event_name,
    e.event_code,
    lower(coalesce(e.package_key, 'free')),
    coalesce(e.storage_consumed_bytes, 0),
    e.storage_limit_override_bytes
  into
    v_event_name,
    v_event_code,
    v_previous_package,
    v_storage_consumed,
    v_override
  from public.event e
  where e.event_id = p_event_id
  for update;

  if not found then
    raise exception 'event not found'
      using errcode = 'P0002';
  end if;

  if v_previous_package = v_package then
    raise exception 'event already uses this package'
      using errcode = '22023';
  end if;

  v_package_limit := case v_package
    when 'free' then 104857600
    when 'mini' then 5368709120
    when 'plus' then 10737418240
    when 'premium' then 21474836480
    else 104857600
  end;

  if v_override is null and v_storage_consumed > v_package_limit then
    raise exception 'new package limit is below consumed storage'
      using errcode = '22023';
  end if;

  update public.event
  set
    package_key = v_package,
    packet_level_id = p_packet_level_id
  where event_id = p_event_id;

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
    'CHANGE_EVENT_PACKAGE',
    'EVENT',
    'event',
    p_event_id::text,
    '#' || coalesce(v_event_code, '------'),
    format(
      'Changed event package for %s (#%s) from %s to %s.',
      coalesce(v_event_name, 'Untitled event'),
      coalesce(v_event_code, '------'),
      v_previous_package,
      v_package
    ),
    jsonb_build_object(
      'summary',
      initcap(v_previous_package) || ' → ' || initcap(v_package),
      'reason',
      v_reason,
      'previous_package',
      v_previous_package,
      'new_package',
      v_package,
      'storage_consumed_bytes',
      v_storage_consumed,
      'storage_override_bytes',
      v_override
    ),
    nullif(btrim(coalesce(p_ip_address, '')), ''),
    nullif(btrim(coalesce(p_request_id, '')), '')
  );

  return jsonb_build_object(
    'changed', true,
    'event_id', p_event_id,
    'package_key', v_package,
    'previous_package', v_previous_package
  );
end;
$$;

create or replace function public.admin_set_event_storage_override(
  p_admin_user_id uuid,
  p_event_id uuid,
  p_limit_bytes bigint,
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

  v_event_name text;
  v_event_code text;
  v_package text;
  v_storage_consumed bigint;
  v_previous_override bigint;
  v_package_limit bigint;

  v_reason text;
  v_action text;
  v_summary text;
begin
  v_reason := nullif(btrim(coalesce(p_reason, '')), '');

  if v_reason is null or length(v_reason) < 3 then
    raise exception 'a reason of at least 3 characters is required'
      using errcode = '22023';
  end if;

  if length(v_reason) > 300 then
    raise exception 'reason is too long'
      using errcode = '22023';
  end if;

  if p_limit_bytes is not null
     and (p_limit_bytes < 10485760 or p_limit_bytes > 1099511627776) then
    raise exception 'storage override must be between 10 MB and 1 TB'
      using errcode = '22023';
  end if;

  select u.user_role, u.is_user_active, u.is_email_verified
  into v_admin_role, v_admin_active, v_admin_verified
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

  select
    e.event_name,
    e.event_code,
    lower(coalesce(e.package_key, 'free')),
    coalesce(e.storage_consumed_bytes, 0),
    e.storage_limit_override_bytes
  into
    v_event_name,
    v_event_code,
    v_package,
    v_storage_consumed,
    v_previous_override
  from public.event e
  where e.event_id = p_event_id
  for update;

  if not found then
    raise exception 'event not found'
      using errcode = 'P0002';
  end if;

  v_package_limit := case v_package
    when 'free' then 104857600
    when 'mini' then 5368709120
    when 'plus' then 10737418240
    when 'premium' then 21474836480
    else 104857600
  end;

  if p_limit_bytes is null then
    if v_previous_override is null then
      raise exception 'event does not have a storage override'
        using errcode = '22023';
    end if;

    if v_storage_consumed > v_package_limit then
      raise exception 'package limit is below consumed storage'
        using errcode = '22023';
    end if;

    v_action := 'CLEAR_EVENT_STORAGE_OVERRIDE';
    v_summary := 'Custom storage limit removed · package limit restored';
  else
    if p_limit_bytes < v_storage_consumed then
      raise exception 'storage override is below consumed storage'
        using errcode = '22023';
    end if;

    if v_previous_override = p_limit_bytes then
      raise exception 'storage override is already set to this value'
        using errcode = '22023';
    end if;

    v_action := 'SET_EVENT_STORAGE_OVERRIDE';
    v_summary := 'Custom storage limit updated';
  end if;

  update public.event
  set storage_limit_override_bytes = p_limit_bytes
  where event_id = p_event_id;

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
    'STORAGE',
    'event',
    p_event_id::text,
    '#' || coalesce(v_event_code, '------'),
    case
      when p_limit_bytes is null then
        format(
          'Removed custom storage limit from %s (#%s).',
          coalesce(v_event_name, 'Untitled event'),
          coalesce(v_event_code, '------')
        )
      else
        format(
          'Set custom storage limit for %s (#%s).',
          coalesce(v_event_name, 'Untitled event'),
          coalesce(v_event_code, '------')
        )
    end,
    jsonb_build_object(
      'summary',
      v_summary,
      'reason',
      v_reason,
      'previous_override_bytes',
      v_previous_override,
      'new_override_bytes',
      p_limit_bytes,
      'package_key',
      v_package,
      'package_limit_bytes',
      v_package_limit,
      'storage_consumed_bytes',
      v_storage_consumed
    ),
    nullif(btrim(coalesce(p_ip_address, '')), ''),
    nullif(btrim(coalesce(p_request_id, '')), '')
  );

  return jsonb_build_object(
    'changed', true,
    'event_id', p_event_id,
    'storage_limit_override_bytes', p_limit_bytes,
    'package_limit_bytes', v_package_limit
  );
end;
$$;

revoke all on function public.admin_set_event_suspension(
  uuid, uuid, boolean, text, text, text
) from public, anon, authenticated;

grant execute on function public.admin_set_event_suspension(
  uuid, uuid, boolean, text, text, text
) to service_role;

revoke all on function public.admin_change_event_package(
  uuid, uuid, text, uuid, text, text, text
) from public, anon, authenticated;

grant execute on function public.admin_change_event_package(
  uuid, uuid, text, uuid, text, text, text
) to service_role;

revoke all on function public.admin_set_event_storage_override(
  uuid, uuid, bigint, text, text, text
) from public, anon, authenticated;

grant execute on function public.admin_set_event_storage_override(
  uuid, uuid, bigint, text, text, text
) to service_role;

commit;
