-- SnapUp Events — Event type analytics
begin;

alter table public.event
  add column if not exists event_type_code varchar(32);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'event_type_code_check'
      and conrelid = 'public.event'::regclass
  ) then
    alter table public.event
      add constraint event_type_code_check
      check (
        event_type_code is null
        or event_type_code in ('wedding', 'engagement', 'henna_night', 'birthday', 'graduation', 'baby_shower', 'anniversary', 'corporate', 'conference_seminar', 'festival_concert', 'party_celebration', 'other')
      );
  end if;
end
$$;

create index if not exists idx_event_type_code
  on public.event(event_type_code);

comment on column public.event.event_type_code is
  'Stable event concept code used for SnapUp product analytics.';

commit;
