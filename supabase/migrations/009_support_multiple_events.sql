alter table public.attendees
  add column if not exists event_names text[] not null default '{}';

update public.attendees
set event_names = array[event_name]
where cardinality(event_names) = 0
  and event_name in ('food_festival', 'cultural_night');

alter table public.attendees
  drop constraint if exists attendees_event_names_check;

alter table public.attendees
  add constraint attendees_event_names_check
  check (
    cardinality(event_names) between 0 and 2
    and event_names <@ array['food_festival', 'cultural_night']::text[]
  );

drop policy if exists "Public guests can submit invitations" on public.attendees;

create policy "Public guests can submit invitations"
  on public.attendees for insert
  to anon
  with check (
    category = 'undangan'
    and is_checked_in = false
    and invitation_status = 'pending'
    and cardinality(event_names) between 1 and 2
    and event_names <@ array['food_festival', 'cultural_night']::text[]
    and ('cultural_night' <> all(event_names) or international_student = true)
  );
