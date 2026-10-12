alter table public.attendees
  drop constraint if exists attendees_event_name_check,
  drop constraint if exists attendees_cultural_night_international_check,
  drop constraint if exists attendees_event_names_check;

alter table public.attendees
  add constraint attendees_event_name_food_festival_check
  check (event_name is null or event_name = 'food_festival');

alter table public.attendees
  add constraint attendees_event_names_food_festival_check
  check (
    cardinality(event_names) = 0
    or event_names = array['food_festival']::text[]
  );

drop policy if exists "Public guests can submit invitations" on public.attendees;

create policy "Public guests can submit invitations"
  on public.attendees for insert
  to anon
  with check (
    category = 'guest'
    and is_checked_in = false
    and invitation_status = 'pending'
    and event_name = 'food_festival'
    and event_names = array['food_festival']::text[]
  );
