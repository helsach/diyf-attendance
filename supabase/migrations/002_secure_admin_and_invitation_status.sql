alter table public.attendees
  add column if not exists invitation_status text not null default 'pending',
  add column if not exists invitation_sent_at timestamptz;

alter table public.attendees
  drop constraint if exists attendees_invitation_status_check;

alter table public.attendees
  add constraint attendees_invitation_status_check
  check (invitation_status in ('pending', 'opened', 'sent', 'failed'));

create unique index if not exists attendees_ticket_code_unique on public.attendees (ticket_code);

alter table public.attendees enable row level security;

drop policy if exists "Public can read attendees" on public.attendees;
drop policy if exists "Authenticated admins can manage attendees" on public.attendees;

create policy "Authenticated admins can manage attendees"
  on public.attendees for all
  to authenticated
  using (true)
  with check (true);

create or replace function public.get_attendee_by_ticket(p_ticket_code text)
returns setof public.attendees
language sql
security definer
set search_path = public
as $$
  select * from public.attendees
  where ticket_code = p_ticket_code
  limit 1;
$$;

grant execute on function public.get_attendee_by_ticket(text) to anon, authenticated;
