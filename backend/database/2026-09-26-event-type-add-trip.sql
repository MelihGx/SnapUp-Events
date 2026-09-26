-- SnapUp Events — Add Trip event type
-- Safe to run after the original event-type migration.

begin;

alter table public.event
  drop constraint if exists event_type_code_check;

alter table public.event
  add constraint event_type_code_check
  check (
    event_type_code is null
    or event_type_code in (
      'wedding',
      'engagement',
      'henna_night',
      'birthday',
      'graduation',
      'baby_shower',
      'anniversary',
      'corporate',
      'conference_seminar',
      'festival_concert',
      'party_celebration',
      'trip',
      'other'
    )
  );

commit;
