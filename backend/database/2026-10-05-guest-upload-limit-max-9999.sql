-- SnapUp Events — cap optional per-guest upload count at 9999.
-- NULL continues to mean unlimited.

begin;

update public.event_settings
set max_upload_per_guest = 9999
where max_upload_per_guest > 9999;

alter table public.event_settings
  drop constraint if exists event_settings_upload_limit_check;

alter table public.event_settings
  add constraint event_settings_upload_limit_check
  check (
    max_upload_per_guest is null
    or max_upload_per_guest between 1 and 9999
  );

commit;
