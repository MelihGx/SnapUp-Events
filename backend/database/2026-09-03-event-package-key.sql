-- SnapUp Events: persist the commercial package selected for each event.
-- Run this once in the Supabase SQL Editor before deploying the backend patch.

begin;

alter table public.event
  add column if not exists package_key text;

-- Existing events predate the separate Mini/Plus commercial distinction.
-- They are backfilled from the legacy packet level. Legacy "Plus" rows are
-- treated as Plus because historical Mini selections cannot be distinguished.
update public.event as e
set package_key = case
  when lower(coalesce(p.packet_name, '')) = 'premium' then 'premium'
  when lower(coalesce(p.packet_name, '')) = 'plus' then 'plus'
  else 'free'
end
from public.packet_level as p
where e.packet_level_id = p.packet_level_id
  and (e.package_key is null or btrim(e.package_key) = '');

update public.event
set package_key = 'free'
where package_key is null or btrim(package_key) = '';

alter table public.event
  alter column package_key set default 'free',
  alter column package_key set not null;

alter table public.event
  drop constraint if exists event_package_key_check;

alter table public.event
  add constraint event_package_key_check
  check (package_key in ('free', 'mini', 'plus', 'premium'));

comment on column public.event.package_key is
  'Commercial SnapUp package selected for this event: free, mini, plus, or premium.';

commit;
