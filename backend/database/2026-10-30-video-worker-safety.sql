-- PATCH 7. Manual migration only, AFTER PATCH 6. Stop/drain ALL old workers.
-- Existing jobs/media/counters are preserved. NULL legacy leases may be reclaimed
-- only after the operator has established that no old worker is still running.
begin;
set local lock_timeout='3s';
do $$
begin
  if (select count(*) from pg_catalog.pg_proc where oid in (
    to_regprocedure('public.reserve_upload_quota(uuid,uuid,text,uuid,uuid,text,text,bigint,integer,jsonb)'),
    to_regprocedure('public.finalize_upload_quota(uuid,text,jsonb,jsonb)'))
    and lower(prosrc) like '%for no key update%')<>2 then
    raise exception 'PATCH 7 requires PATCH 6 quota functions';
  end if;
end;
$$;
alter table public.video_processing_jobs
  add column worker_owner uuid,
  add column worker_generation bigint not null default 0 check(worker_generation>=0),
  add column worker_lease_expires_at timestamptz;
create index video_worker_expiry_idx on public.video_processing_jobs(status,worker_lease_expires_at);
create table public.video_worker_attempts (
  attempt_id uuid primary key,
  -- Intentionally retained even when a job/event is removed; do not lose the
  -- manifest of a late R2 writer or block existing account deletion cascades.
  job_id uuid not null,
  generation bigint not null check(generation>0),
  original_key text not null,
  display_key text not null unique,
  poster_key text not null unique,
  state text not null check(state in ('processing','committed','failed','abandoned')),
  cleanup_required boolean not null default true,
  result jsonb,
  error_code text,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique(job_id,generation)
);
alter table public.video_worker_attempts enable row level security;
revoke all on public.video_worker_attempts from public,anon,authenticated;
grant select,insert,update on public.video_worker_attempts to service_role;

create function public.claim_video_job(p_owner uuid,p_lease_seconds integer default 90)
returns jsonb language plpgsql security definer set search_path='' set lock_timeout='3s' as $$
declare j public.video_processing_jobs%rowtype; a public.video_worker_attempts%rowtype; m public.media%rowtype; prefix text;
begin
  if p_owner is null or p_lease_seconds not between 30 and 600 or p_lease_seconds is null then raise exception 'INVALID_VIDEO_LEASE'; end if;
  -- A lost claim reply never grants a second job for the same attempt token.
  select * into a from public.video_worker_attempts where attempt_id=p_owner;
  if found then
    select * into j from public.video_processing_jobs where job_id=a.job_id;
    if j.worker_owner=p_owner and j.worker_generation=a.generation and j.status='processing'
       and j.worker_lease_expires_at>clock_timestamp() then
      return to_jsonb(j)||jsonb_build_object('worker_display_key',a.display_key,'worker_poster_key',a.poster_key,
        'lease_seconds',greatest(0,extract(epoch from(j.worker_lease_expires_at-clock_timestamp()))));
    end if;
    return null;
  end if;
  select * into j from public.video_processing_jobs
    where status='queued' or (status='processing' and (worker_lease_expires_at is null or worker_lease_expires_at<=clock_timestamp()))
    order by created_at,job_id for update skip locked limit 1;
  if not found then return null; end if;
  -- Recover a legacy publication gap without re-rendering or changing moderation.
  select * into m from public.media where media_id=j.job_id;
  if found then
    if m.event_id is distinct from j.event_id or m.guest_id is distinct from j.guest_id
      or m.r2_original_key is distinct from j.original_key then raise exception 'VIDEO_MEDIA_CONFLICT'; end if;
    update public.video_processing_jobs set status='ready',media_id=m.media_id,
      display_key=coalesce(m.r2_display_key,j.display_key),poster_key=coalesce(m.r2_poster_key,j.poster_key),
      worker_owner=null,worker_lease_expires_at=null,completed_at=clock_timestamp(),updated_at=clock_timestamp()
      where job_id=j.job_id;
    return null;
  end if;
  update public.video_worker_attempts set state='abandoned',updated_at=clock_timestamp()
    where job_id=j.job_id and state='processing';
  j.worker_generation:=j.worker_generation+1;
  prefix:='events/'||j.event_id||'/media/'||j.job_id||'/attempts/'||j.worker_generation||'-'||p_owner;
  insert into public.video_worker_attempts(attempt_id,job_id,generation,original_key,display_key,poster_key,state)
    values(p_owner,j.job_id,j.worker_generation,j.original_key,prefix||'/display.mp4',prefix||'/poster.webp','processing') returning * into a;
  update public.video_processing_jobs set status='processing',worker_owner=p_owner,worker_generation=j.worker_generation,
    worker_lease_expires_at=clock_timestamp()+make_interval(secs=>p_lease_seconds),
    attempt_count=attempt_count+1,started_at=clock_timestamp(),updated_at=clock_timestamp(),error_code=null,error_message=null
    where job_id=j.job_id returning * into j;
  return to_jsonb(j)||jsonb_build_object('worker_display_key',a.display_key,'worker_poster_key',a.poster_key,'lease_seconds',p_lease_seconds);
end;
$$;

create function public.renew_video_job(p_job uuid,p_owner uuid,p_generation bigint,p_lease_seconds integer default 90)
returns jsonb language plpgsql security definer set search_path='' set lock_timeout='3s' as $$
begin
  if p_lease_seconds is null or p_lease_seconds not between 30 and 600 then raise exception 'INVALID_VIDEO_LEASE'; end if;
  update public.video_processing_jobs set worker_lease_expires_at=clock_timestamp()+make_interval(secs=>p_lease_seconds),updated_at=clock_timestamp()
    where job_id=p_job and status='processing' and worker_owner=p_owner and worker_generation=p_generation
      and worker_lease_expires_at>clock_timestamp();
  return jsonb_build_object('renewed',found,'lease_seconds',p_lease_seconds);
end;
$$;

create function public.video_job_outcome(p_job uuid,p_owner uuid,p_generation bigint)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object('state',case
    when a.state='committed' then 'committed'
    when j.status='processing' and j.worker_owner=p_owner and j.worker_generation=p_generation
      and j.worker_lease_expires_at>clock_timestamp() then 'owned' else 'lost' end,'result',a.result)
  from public.video_processing_jobs j join public.video_worker_attempts a on a.job_id=j.job_id
  where j.job_id=p_job and a.attempt_id=p_owner and a.generation=p_generation;
$$;

create function public.publish_video_job(p_job uuid,p_owner uuid,p_generation bigint,p_media jsonb)
returns jsonb language plpgsql security definer set search_path='' set lock_timeout='3s' as $$
declare j public.video_processing_jobs%rowtype; a public.video_worker_attempts%rowtype;
  m public.media%rowtype; saved public.media%rowtype; v_result jsonb;
begin
  -- PATCH 6 ordering and FK-compatible event lock. Never hold this transaction
  -- during R2/FFmpeg. Claim/renew/fail take only job/attempt locks, not event locks.
  select * into j from public.video_processing_jobs where job_id=p_job;
  if not found then raise exception 'VIDEO_JOB_NOT_FOUND'; end if;
  perform 1 from public.upload_admission_policy where singleton for update;
  perform 1 from public.event where event_id=j.event_id for no key update;
  perform 1 from public.event_guests where event_id=j.event_id and guest_id=j.guest_id for update;
  if not found then raise exception 'GUEST_SESSION_MISMATCH'; end if;
  select * into j from public.video_processing_jobs where job_id=p_job for update;
  select * into a from public.video_worker_attempts where attempt_id=p_owner and job_id=p_job and generation=p_generation for update;
  if not found then raise exception 'VIDEO_OWNERSHIP_LOST'; end if;
  if a.state='committed' then return a.result; end if;
  if j.status<>'processing' or j.worker_owner is distinct from p_owner or j.worker_generation<>p_generation
    or j.worker_lease_expires_at<=clock_timestamp() or j.worker_lease_expires_at is null then raise exception 'VIDEO_OWNERSHIP_LOST'; end if;
  m:=jsonb_populate_record(null::public.media,p_media);
  if m.media_id is distinct from p_job or m.event_id is distinct from j.event_id or m.guest_id is distinct from j.guest_id
    or m.r2_original_key is distinct from j.original_key or m.r2_display_key is distinct from a.display_key
    or m.r2_poster_key is distinct from a.poster_key or m.bytes is distinct from j.original_bytes
    or m.media_status is distinct from j.target_media_status or m.storage_provider is distinct from 'r2'
    or m.media_type_id is null or m.media_url is null then raise exception 'INVALID_VIDEO_PUBLICATION'; end if;
  insert into public.media(media_id,event_id,guest_id,media_type_id,media_url,message,media_status,bytes,storage_provider,
    r2_original_key,r2_display_key,r2_poster_key,original_bytes,display_bytes,original_mime_type,display_mime_type,
    video_duration_seconds,video_width,video_height,cloudinary_public_id,resource_type,delivery_type,format)
    values(p_job,j.event_id,j.guest_id,m.media_type_id,m.media_url,j.message,j.target_media_status,j.original_bytes,'r2',
      j.original_key,a.display_key,a.poster_key,j.original_bytes,m.display_bytes,j.original_mime_type,m.display_mime_type,
      m.video_duration_seconds,m.video_width,m.video_height,null,'video','authenticated','mp4')
    on conflict(media_id) do nothing returning * into saved;
  if not found then
    select * into saved from public.media where media_id=p_job;
    if saved.r2_display_key is distinct from a.display_key or saved.r2_poster_key is distinct from a.poster_key
      or saved.r2_original_key is distinct from j.original_key
      or saved.event_id is distinct from j.event_id or saved.guest_id is distinct from j.guest_id then raise exception 'VIDEO_MEDIA_CONFLICT'; end if;
  end if;
  if j.worker_lease_expires_at<=clock_timestamp() then raise exception 'VIDEO_OWNERSHIP_LOST'; end if;
  v_result:=jsonb_build_object('state','committed','media_id',p_job);
  update public.video_processing_jobs set status='ready',media_id=p_job,display_key=a.display_key,poster_key=a.poster_key,
    completed_at=clock_timestamp(),updated_at=clock_timestamp(),worker_owner=null,worker_lease_expires_at=null,error_code=null,error_message=null where job_id=p_job;
  update public.video_worker_attempts set state='committed',cleanup_required=false,result=v_result,updated_at=clock_timestamp() where attempt_id=p_owner;
  return v_result;
end;
$$;

create function public.fail_video_job(p_job uuid,p_owner uuid,p_generation bigint,p_code text)
returns boolean language plpgsql security definer set search_path='' set lock_timeout='3s' as $$
declare j public.video_processing_jobs%rowtype;
begin
  select * into j from public.video_processing_jobs where job_id=p_job for update;
  if not found or j.status<>'processing' or j.worker_owner is distinct from p_owner or j.worker_generation<>p_generation
    or j.worker_lease_expires_at<=clock_timestamp() or j.worker_lease_expires_at is null
    or exists(select 1 from public.media where media_id=p_job) then return false; end if;
  update public.video_processing_jobs set status='failed',worker_owner=null,worker_lease_expires_at=null,
    error_code=left(coalesce(p_code,'VIDEO_PROCESS_FAILED'),100),error_message='Video processing failed.',updated_at=clock_timestamp() where job_id=p_job;
  update public.video_worker_attempts set state='failed',error_code=left(coalesce(p_code,'VIDEO_PROCESS_FAILED'),100),updated_at=clock_timestamp()
    where attempt_id=p_owner and job_id=p_job and generation=p_generation;
  return true;
end;
$$;

revoke all on function public.claim_video_job(uuid,integer),public.renew_video_job(uuid,uuid,bigint,integer),
  public.video_job_outcome(uuid,uuid,bigint),public.publish_video_job(uuid,uuid,bigint,jsonb),public.fail_video_job(uuid,uuid,bigint,text)
  from public,anon,authenticated;
grant execute on function public.claim_video_job(uuid,integer),public.renew_video_job(uuid,uuid,bigint,integer),
  public.video_job_outcome(uuid,uuid,bigint),public.publish_video_job(uuid,uuid,bigint,jsonb),public.fail_video_job(uuid,uuid,bigint,text)
  to service_role;
commit;
