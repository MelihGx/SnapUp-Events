-- SnapUp Events: convert every existing event code to a six-digit number.
--
-- Important: existing shared codes and links stop working after this migration.
-- The frontend rebuilds QR images from the new code, so old cached QR data is
-- cleared here. Run this file once, immediately before deploying the backend
-- version that generates six-digit codes.

begin;

lock table public.event in share row exclusive mode;

do $migration$
declare
  target_event record;
  candidate_code text;
  attempt_count integer;
begin
  for target_event in
    select event_id
    from public.event
    where event_code is null
       or event_code !~ '^[0-9]{6}$'
    order by event_created_at, event_id
  loop
    attempt_count := 0;

    loop
      attempt_count := attempt_count + 1;

      if attempt_count > 200 then
        raise exception 'Could not allocate a unique six-digit event code.';
      end if;

      candidate_code := lpad(
        floor(random() * 1000000)::integer::text,
        6,
        '0'
      );

      exit when not exists (
        select 1
        from public.event
        where event_code = candidate_code
      );
    end loop;

    update public.event
    set
      event_code = candidate_code,
      qr_code_url = null
    where event_id = target_event.event_id;
  end loop;
end
$migration$;

alter table public.event
  drop constraint if exists event_code_six_digits;

alter table public.event
  add constraint event_code_six_digits
  check (event_code ~ '^[0-9]{6}$');

commit;

select
  count(*) as total_events,
  count(*) filter (where event_code ~ '^[0-9]{6}$') as six_digit_events,
  count(distinct event_code) as unique_codes
from public.event;
