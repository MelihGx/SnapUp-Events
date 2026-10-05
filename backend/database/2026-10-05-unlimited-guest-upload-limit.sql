-- SnapUp Events — optional per-guest upload count limit.
-- NULL means unlimited. Existing default-20 rows are migrated to unlimited.
-- Custom non-20 limits are preserved.

begin;

alter table public.event_settings
  alter column max_upload_per_guest drop not null;

alter table public.event_settings
  alter column max_upload_per_guest drop default;

alter table public.event_settings
  drop constraint if exists event_settings_upload_limit_check;

alter table public.event_settings
  add constraint event_settings_upload_limit_check
  check (max_upload_per_guest is null or max_upload_per_guest between 1 and 9999);

update public.event_settings
set max_upload_per_guest = null
where max_upload_per_guest = 20;

create or replace function public.enforce_guest_media_quota()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_max_count integer;
  v_max_bytes bigint;
  v_count bigint;
  v_bytes bigint;
begin
  perform 1
    from public.event_guests g
   where g.guest_id = new.guest_id
     and g.event_id = new.event_id
   for update;

  if not found then
    raise exception 'guest does not belong to event' using errcode = '42501';
  end if;

  select s.max_upload_per_guest,
         least(coalesce(s.max_storage_per_guest, 250), 2048)::bigint * 1024 * 1024
    into v_max_count, v_max_bytes
    from public.event_settings s
   where s.event_id = new.event_id;

  v_max_bytes := coalesce(v_max_bytes, 250::bigint * 1024 * 1024);

  select count(*), coalesce(sum(m.bytes), 0)
    into v_count, v_bytes
    from public.media m
   where m.event_id = new.event_id
     and m.guest_id = new.guest_id;

  if v_max_count is not null and v_count + 1 > v_max_count then
    raise exception 'guest upload count exceeded' using errcode = 'P0001';
  end if;

  if v_bytes + coalesce(new.bytes, 0) > v_max_bytes then
    raise exception 'guest storage quota exceeded' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

commit;
