-- SnapUp Events: convert existing event codes to six-character codes that
-- contain both letters and numbers.
--
-- Important: this changes existing shared codes and invalidates their old QR
-- images. Run once immediately before deploying the matching backend version.

begin;

create extension if not exists pgcrypto;

lock table public.event in share row exclusive mode;

alter table public.event
  drop constraint if exists event_code_six_digits;

alter table public.event
  drop constraint if exists event_code_six_characters;

do $migration$
declare
  target_event record;
  candidate_code text;
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  attempt_count integer;
  character_index integer;
begin
  for target_event in
    select event_id
    from public.event
    where event_code is null
       or event_code !~ '^[A-HJ-NP-Z2-9]{6}$'
       or event_code !~ '[A-HJ-NP-Z]'
       or event_code !~ '[2-9]'
    order by event_created_at, event_id
  loop
    attempt_count := 0;

    loop
      attempt_count := attempt_count + 1;

      if attempt_count > 500 then
        raise exception 'Could not allocate a unique six-character event code.';
      end if;

      candidate_code := '';

      for character_index in 1..6 loop
        candidate_code := candidate_code || substr(
          alphabet,
          (get_byte(gen_random_bytes(1), 0) % length(alphabet)) + 1,
          1
        );
      end loop;

      exit when candidate_code ~ '[A-HJ-NP-Z]'
        and candidate_code ~ '[2-9]'
        and not exists (
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
  add constraint event_code_six_characters
  check (
    event_code ~ '^[A-HJ-NP-Z2-9]{6}$'
    and event_code ~ '[A-HJ-NP-Z]'
    and event_code ~ '[2-9]'
  );

commit;

select
  count(*) as total_events,
  count(*) filter (
    where event_code ~ '^[A-HJ-NP-Z2-9]{6}$'
      and event_code ~ '[A-HJ-NP-Z]'
      and event_code ~ '[2-9]'
  ) as six_character_events,
  count(distinct event_code) as unique_codes
from public.event;
