-- PATCH 2: prepare only; do not apply to production automatically.
begin;

create table public.upload_admission_policy (
  singleton boolean primary key default true check (singleton),
  global_limit integer not null check (global_limit between 1 and 1000),
  event_limit integer not null check (event_limit between 1 and global_limit),
  guest_limit integer not null check (guest_limit between 1 and event_limit),
  lease_seconds integer not null default 90 check (lease_seconds between 30 and 600)
);
-- Intentionally no policy row: operators must choose capacity before enabling.
create table public.upload_admission_leases (
  lease_id uuid primary key,
  owner_hash text not null check (owner_hash ~ '^[a-f0-9]{64}$'),
  event_id uuid not null,
  guest_id uuid not null,
  expires_at timestamptz not null
);
create index upload_admission_expiry_idx on public.upload_admission_leases(expires_at);
create index upload_admission_event_idx on public.upload_admission_leases(event_id, expires_at);
create index upload_admission_guest_idx on public.upload_admission_leases(event_id, guest_id, expires_at);

create function public.acquire_upload_admission(p_lease_id uuid, p_owner_hash text, p_event_id uuid, p_guest_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  p public.upload_admission_policy%rowtype;
  existing public.upload_admission_leases%rowtype;
  n_global integer; n_event integer; n_guest integer;
  retry integer; reason text; ts timestamptz;
begin
  -- Every admission mutation takes the same short row lock. No transaction
  -- remains open while bytes are uploaded; counts and insert are atomic.
  select * into p from public.upload_admission_policy where singleton for update;
  if not found then return jsonb_build_object('acquired', false, 'reason', 'unconfigured'); end if;
  ts := clock_timestamp();
  delete from public.upload_admission_leases where expires_at <= ts;
  select * into existing from public.upload_admission_leases where lease_id = p_lease_id;
  if found then
    if existing.owner_hash is distinct from p_owner_hash or existing.event_id is distinct from p_event_id or existing.guest_id is distinct from p_guest_id then
      return jsonb_build_object('acquired', false, 'reason', 'ownership');
    end if;
    -- Repeating acquisition with the same identity is safe, but never extends
    -- ownership. The caller uses the remaining TTL, not the configured TTL.
    return jsonb_build_object('acquired', true, 'lease_seconds',
      greatest(0, extract(epoch from (existing.expires_at - ts))));
  end if;
  select count(*), count(*) filter (where event_id = p_event_id),
    count(*) filter (where event_id = p_event_id and guest_id = p_guest_id),
    greatest(1, ceil(extract(epoch from (min(expires_at) - ts)))::integer)
    into n_global, n_event, n_guest, retry from public.upload_admission_leases;
  if n_guest >= p.guest_limit then reason := 'guest';
  elsif n_event >= p.event_limit then reason := 'event';
  elsif n_global >= p.global_limit then reason := 'global'; end if;
  if reason is not null then
    return jsonb_build_object('acquired', false, 'reason', reason, 'retry_after', least(5, coalesce(retry, 1)));
  end if;
  insert into public.upload_admission_leases values
    (p_lease_id, p_owner_hash, p_event_id, p_guest_id, ts + make_interval(secs => p.lease_seconds));
  return jsonb_build_object('acquired', true, 'lease_seconds', p.lease_seconds);
end;
$$;

create function public.renew_upload_admission(p_lease_id uuid, p_owner_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare p public.upload_admission_policy%rowtype; ts timestamptz;
begin
  select * into p from public.upload_admission_policy where singleton for update;
  if not found then return jsonb_build_object('renewed', false); end if;
  ts := clock_timestamp();
  update public.upload_admission_leases
    set expires_at = ts + make_interval(secs => p.lease_seconds)
    where lease_id = p_lease_id and owner_hash = p_owner_hash and expires_at > ts;
  return jsonb_build_object('renewed', found, 'lease_seconds', p.lease_seconds);
end;
$$;

create function public.release_upload_admission(p_lease_id uuid, p_owner_hash text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.upload_admission_policy where singleton for update;
  delete from public.upload_admission_leases where lease_id = p_lease_id and owner_hash = p_owner_hash;
  return found;
end;
$$;

alter table public.upload_admission_policy enable row level security;
alter table public.upload_admission_leases enable row level security;
revoke all on public.upload_admission_policy, public.upload_admission_leases from public, anon, authenticated;
grant select, insert, update, delete on public.upload_admission_policy, public.upload_admission_leases to service_role;
revoke all on function public.acquire_upload_admission(uuid,text,uuid,uuid),
  public.renew_upload_admission(uuid,text), public.release_upload_admission(uuid,text) from public, anon, authenticated;
grant execute on function public.acquire_upload_admission(uuid,text,uuid,uuid),
  public.renew_upload_admission(uuid,text), public.release_upload_admission(uuid,text) to service_role;
commit;
