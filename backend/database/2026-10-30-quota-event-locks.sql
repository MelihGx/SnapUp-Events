-- PATCH 6: apply manually AFTER PATCH 2 and PATCH 3, with writers drained.
-- No row data, counters, manifests, triggers, RLS, ownership or ACL changes.
-- Event keys are never changed by these functions. NO KEY UPDATE still
-- serializes quota writers, while allowing worker FK checks (KEY SHARE).
-- Keep policy -> event -> guest -> reservation order and the 3s RPC lock budget.
begin;
set local lock_timeout = '3s';
do $$
begin
  if to_regprocedure('public.reserve_upload_quota(uuid,uuid,text,uuid,uuid,text,text,bigint,integer,jsonb)') is null
    or to_regprocedure('public.finalize_upload_quota(uuid,text,jsonb,jsonb)') is null then
    raise exception 'PATCH 6 requires the existing PATCH 3 quota functions';
  end if;
end;
$$;

create or replace function public.reserve_upload_quota(p_reservation_id uuid,p_lease_id uuid,p_owner_hash text,
  p_event_id uuid,p_guest_id uuid,p_key text,p_fingerprint text,p_bytes bigint,p_count integer,p_assets jsonb)
returns jsonb language plpgsql security definer set search_path='' set lock_timeout='3s' as $$
declare e public.event%rowtype; s public.event_settings%rowtype; r public.upload_quota_reservations%rowtype;
  lim bigint; used bigint; cnt bigint; reserved_bytes bigint; guest_bytes bigint; guest_count bigint;
begin
  -- Consistent ordering: admission policy -> event -> guest -> reservation.
  perform 1 from public.upload_admission_policy where singleton for update;
  if not exists(select 1 from public.upload_admission_leases l where l.lease_id=p_lease_id
      and l.owner_hash=p_owner_hash and l.event_id=p_event_id and l.guest_id=p_guest_id
      and l.expires_at>clock_timestamp()) then raise exception 'UPLOAD_ADMISSION_LOST'; end if;
  select * into e from public.event where event_id=p_event_id for no key update;
  if not found then raise exception 'EVENT_NOT_FOUND'; end if;
  perform 1 from public.event_guests where event_id=p_event_id and guest_id=p_guest_id for update;
  if not found then raise exception 'GUEST_SESSION_MISMATCH'; end if;
  if not exists(select 1 from public.upload_admission_leases l where l.lease_id=p_lease_id
      and l.owner_hash=p_owner_hash and l.expires_at>clock_timestamp()) then raise exception 'UPLOAD_ADMISSION_LOST'; end if;
  select * into s from public.event_settings where event_id=p_event_id;
  if e.is_event_active is false or s.allow_upload is false then raise exception 'UPLOAD_DISABLED'; end if;
  -- No live owner can finalize these rows anymore. Keep the manifest for R2 cleanup.
  update public.upload_quota_reservations q set state='cancelled',updated_at=clock_timestamp()
    where q.event_id=p_event_id and q.state='reserved' and not exists(
      select 1 from public.upload_admission_leases l where l.lease_id=q.lease_id
        and l.owner_hash=q.owner_hash and l.expires_at>clock_timestamp());
  select * into r from public.upload_quota_reservations
    where event_id=p_event_id and guest_id=p_guest_id and idempotency_key=p_key and state in ('reserved','committed') for update;
  if found then
    if r.fingerprint<>p_fingerprint then raise exception 'UPLOAD_IDEMPOTENCY_CONFLICT'; end if;
    if r.state='committed' then return jsonb_build_object('state','committed','result',r.result); end if;
    if r.reservation_id=p_reservation_id and r.lease_id=p_lease_id and r.owner_hash=p_owner_hash then
      return jsonb_build_object('state','reserved','reservation_id',r.reservation_id);
    end if;
    raise exception 'UPLOAD_IN_PROGRESS';
  end if;
  if p_bytes<0 or p_bytes>209715200 or p_count<1 or p_count>15
      or jsonb_array_length(p_assets)<>p_count
      or (select coalesce(sum((a->>'bytes')::bigint),0) from jsonb_array_elements(p_assets) a)<>p_bytes
      then raise exception 'INVALID_QUOTA_RESERVATION'; end if;
  lim := case lower(coalesce(e.package_key,'free')) when 'mini' then 5368709120
    when 'plus' then 10737418240 when 'standard' then 10737418240
    when 'premium' then 21474836480 else 104857600 end;
  if e.storage_limit_override_bytes>0 then lim:=e.storage_limit_override_bytes; end if;
  select coalesce(sum(q.bytes),0) into reserved_bytes from public.upload_quota_reservations q
    where q.event_id=p_event_id and q.state='reserved';
  if coalesce(e.storage_consumed_bytes,0)+reserved_bytes+p_bytes>lim then raise exception 'EVENT_STORAGE_QUOTA_EXCEEDED'; end if;
  select * into used,cnt from public.upload_quota_guest_usage(p_event_id,p_guest_id);
  select coalesce(sum(q.bytes),0),coalesce(sum(q.file_count),0) into guest_bytes,guest_count
    from public.upload_quota_reservations q where q.event_id=p_event_id and q.guest_id=p_guest_id and q.state='reserved';
  if used+guest_bytes+p_bytes>least(coalesce(s.max_storage_per_guest,250),2048)::bigint*1048576 then
    raise exception 'GUEST_STORAGE_QUOTA_EXCEEDED'; end if;
  if s.max_upload_per_guest is not null and cnt+guest_count+p_count>s.max_upload_per_guest then
    raise exception 'GUEST_UPLOAD_LIMIT_EXCEEDED'; end if;
  insert into public.upload_quota_reservations(reservation_id,event_id,guest_id,lease_id,owner_hash,
    idempotency_key,fingerprint,bytes,file_count,assets)
    values(p_reservation_id,p_event_id,p_guest_id,p_lease_id,p_owner_hash,p_key,p_fingerprint,p_bytes,p_count,p_assets);
  return jsonb_build_object('state','reserved','reservation_id',p_reservation_id);
end;
$$;

create or replace function public.finalize_upload_quota(p_reservation_id uuid,p_owner_hash text,p_media jsonb,p_jobs jsonb)
returns jsonb language plpgsql security definer set search_path='' set lock_timeout='3s' as $$
declare r public.upload_quota_reservations%rowtype; e public.event%rowtype; s public.event_settings%rowtype;
  j jsonb; m public.media%rowtype; v public.video_processing_jobs%rowtype;
  images jsonb:='[]'; jobs jsonb:='[]'; output jsonb; total_bytes bigint; lim bigint; other_reserved bigint; rb bigint; rc bigint;
begin
  perform 1 from public.upload_admission_policy where singleton for update;
  select * into r from public.upload_quota_reservations where reservation_id=p_reservation_id;
  if not found or r.owner_hash is distinct from p_owner_hash then raise exception 'QUOTA_RESERVATION_NOT_FOUND'; end if;
  select * into e from public.event where event_id=r.event_id for no key update;
  perform 1 from public.event_guests where event_id=r.event_id and guest_id=r.guest_id for update;
  if not found then raise exception 'GUEST_SESSION_MISMATCH'; end if;
  select * into r from public.upload_quota_reservations where reservation_id=p_reservation_id for update;
  if r.state='committed' then return r.result; end if;
  if r.state<>'reserved' then raise exception 'QUOTA_RESERVATION_CANCELLED'; end if;
  if not exists(select 1 from public.upload_admission_leases l where l.lease_id=r.lease_id
    and l.owner_hash=r.owner_hash and l.expires_at>clock_timestamp()) then raise exception 'UPLOAD_ADMISSION_LOST'; end if;
  select * into s from public.event_settings where event_id=r.event_id;
  if e.is_event_active is false or s.allow_upload is false then raise exception 'UPLOAD_DISABLED'; end if;
  if jsonb_array_length(p_media)+jsonb_array_length(p_jobs)<>r.file_count then raise exception 'INVALID_QUOTA_FINALIZE'; end if;
  select coalesce(sum(b),0) into total_bytes from (
    select (a->>'bytes')::bigint b from jsonb_array_elements(p_media) a union all
    select (a->>'original_bytes')::bigint from jsonb_array_elements(p_jobs) a) x;
  if total_bytes<>r.bytes then raise exception 'INVALID_QUOTA_FINALIZE'; end if;
  -- Manifest equality prevents accepting unrelated or duplicated R2 objects.
  if (select count(distinct a->>'original_key') from jsonb_array_elements(r.assets) a)<>r.file_count then
    raise exception 'INVALID_QUOTA_FINALIZE'; end if;
  for j in select value from jsonb_array_elements(p_media||p_jobs) loop
    if (j->>'event_id')::uuid is distinct from r.event_id or (j->>'guest_id')::uuid is distinct from r.guest_id
      or not exists(select 1 from jsonb_array_elements(r.assets) a where
        a->>'original_key'=coalesce(j->>'r2_original_key',j->>'original_key')
        and a->>'display_key'=coalesce(j->>'r2_display_key',j->>'display_key')
        and (a->>'poster_key') is not distinct from coalesce(j->>'r2_poster_key',j->>'poster_key')
        and (a->>'bytes')::bigint=coalesce((j->>'bytes')::bigint,(j->>'original_bytes')::bigint))
      then raise exception 'INVALID_QUOTA_FINALIZE'; end if;
  end loop;
  if (select count(distinct coalesce(a->>'r2_original_key',a->>'original_key')) from jsonb_array_elements(p_media||p_jobs) a)<>r.file_count then
    raise exception 'INVALID_QUOTA_FINALIZE'; end if;
  -- Recheck admin reductions made during R2 transfer.
  lim:=case lower(coalesce(e.package_key,'free')) when 'mini' then 5368709120 when 'plus' then 10737418240
    when 'standard' then 10737418240 when 'premium' then 21474836480 else 104857600 end;
  if e.storage_limit_override_bytes>0 then lim:=e.storage_limit_override_bytes; end if;
  select coalesce(sum(q.bytes),0) into other_reserved from public.upload_quota_reservations q
    where q.event_id=r.event_id and q.state='reserved' and q.reservation_id<>r.reservation_id
    and exists(select 1 from public.upload_admission_leases l where l.lease_id=q.lease_id and l.owner_hash=q.owner_hash and l.expires_at>clock_timestamp());
  if coalesce(e.storage_consumed_bytes,0)+other_reserved+r.bytes>lim then raise exception 'EVENT_STORAGE_QUOTA_EXCEEDED'; end if;
  -- Exclude this reservation from the guest trigger during its own inserts.
  -- The state change, records and counter are invisible until this transaction commits.
  update public.upload_quota_reservations set state='committed' where reservation_id=r.reservation_id;
  for j in select value from jsonb_array_elements(p_media) loop
    m:=jsonb_populate_record(null::public.media,j);
    insert into public.media(media_id,event_id,guest_id,media_type_id,media_url,message,media_status,bytes,storage_provider,
      r2_original_key,r2_display_key,r2_poster_key,original_bytes,display_bytes,original_mime_type,display_mime_type,
      video_duration_seconds,video_width,video_height,cloudinary_public_id,resource_type,delivery_type,format)
    values(coalesce(m.media_id,gen_random_uuid()),m.event_id,m.guest_id,m.media_type_id,m.media_url,m.message,m.media_status,m.bytes,m.storage_provider,
      m.r2_original_key,m.r2_display_key,m.r2_poster_key,m.original_bytes,m.display_bytes,m.original_mime_type,m.display_mime_type,
      m.video_duration_seconds,m.video_width,m.video_height,m.cloudinary_public_id,m.resource_type,m.delivery_type,m.format)
    returning * into m;
    images:=images||jsonb_build_array(to_jsonb(m));
  end loop;
  for j in select value from jsonb_array_elements(p_jobs) loop
    v:=jsonb_populate_record(null::public.video_processing_jobs,j);
    insert into public.video_processing_jobs(job_id,event_id,guest_id,message,target_media_status,status,original_key,display_key,poster_key,
      original_bytes,original_mime_type,video_duration_seconds,video_width,video_height)
    values(coalesce(v.job_id,gen_random_uuid()),v.event_id,v.guest_id,v.message,v.target_media_status,'queued',v.original_key,v.display_key,v.poster_key,
      v.original_bytes,v.original_mime_type,v.video_duration_seconds,v.video_width,v.video_height) returning * into v;
    jobs:=jobs||jsonb_build_array(jsonb_build_object('job_id',v.job_id,'status',v.status,'event_id',v.event_id,'guest_id',v.guest_id,
      'original_bytes',v.original_bytes,'created_at',v.created_at));
  end loop;
  -- Includes the newly queued videos, excludes their own reservation and avoids
  -- counting worker-created media twice if job status publication is delayed.
  select coalesce(sum(q.bytes),0),coalesce(sum(q.file_count),0) into rb,rc
    from public.upload_quota_reservations q where q.event_id=r.event_id and q.guest_id=r.guest_id and q.state='reserved'
    and exists(select 1 from public.upload_admission_leases l where l.lease_id=q.lease_id and l.owner_hash=q.owner_hash and l.expires_at>clock_timestamp());
  if exists(select 1 from public.upload_quota_guest_usage(r.event_id,r.guest_id) u where
    u.bytes+rb>least(coalesce(s.max_storage_per_guest,250),2048)::bigint*1048576
    or (s.max_upload_per_guest is not null and u.items+rc>s.max_upload_per_guest)) then raise exception 'GUEST_STORAGE_QUOTA_EXCEEDED'; end if;
  if not exists(select 1 from public.upload_admission_leases l where l.lease_id=r.lease_id
      and l.owner_hash=r.owner_hash and l.expires_at>clock_timestamp()) then raise exception 'UPLOAD_ADMISSION_LOST'; end if;
  update public.event set storage_consumed_bytes=coalesce(storage_consumed_bytes,0)+r.bytes where event_id=r.event_id;
  output:=jsonb_build_object('media',images,'video_jobs',jobs,'storage_assets',(
    select jsonb_agg(jsonb_build_object('provider','r2','original_key',a->>'original_key',
      'display_key',case when a->>'kind'='image' then a->>'display_key' else null end,
      'poster_key',null,'processing_status',case when a->>'kind'='image' then 'ready' else 'queued' end,
      'cloudinary_public_id',null)) from jsonb_array_elements(r.assets) a));
  update public.upload_quota_reservations set result=output,updated_at=clock_timestamp() where reservation_id=r.reservation_id;
  return output;
end;
$$;
commit;
