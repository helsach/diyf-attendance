alter table public.attendees
  add column if not exists event_name text,
  add column if not exists faculty text,
  add column if not exists student_number text,
  add column if not exists international_student boolean not null default false;

alter table public.attendees
  drop constraint if exists attendees_event_name_check;

alter table public.attendees
  add constraint attendees_event_name_check
  check (event_name is null or event_name in ('food_festival', 'cultural_night'));

alter table public.attendees
  drop constraint if exists attendees_cultural_night_international_check;

alter table public.attendees
  add constraint attendees_cultural_night_international_check
  check (event_name is null or event_name <> 'cultural_night' or international_student = true);

create index if not exists attendees_event_name_idx on public.attendees (event_name);
create index if not exists attendees_student_number_idx on public.attendees (student_number);

drop policy if exists "Public guests can submit invitations" on public.attendees;

create policy "Public guests can submit invitations"
  on public.attendees for insert
  to anon
  with check (
    category = 'undangan'
    and is_checked_in = false
    and invitation_status = 'pending'
    and event_name in ('food_festival', 'cultural_night')
    and (event_name <> 'cultural_night' or international_student = true)
  );
