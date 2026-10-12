create table if not exists public.attendee_event_checkins (
  id uuid primary key default gen_random_uuid(),
  attendee_id uuid not null references public.attendees(id) on delete cascade,
  event_name text not null check (event_name in ('food_festival', 'cultural_night')),
  checked_in_at timestamptz not null default now(),
  unique (attendee_id, event_name)
);

create index if not exists attendee_event_checkins_attendee_idx
  on public.attendee_event_checkins (attendee_id);

alter table public.attendee_event_checkins enable row level security;

drop policy if exists "Authenticated admins can manage event check-ins" on public.attendee_event_checkins;

create policy "Authenticated admins can manage event check-ins"
  on public.attendee_event_checkins for all
  to authenticated
  using (true)
  with check (true);
