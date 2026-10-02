drop policy if exists "Authenticated admins can manage attendees" on public.attendees;

create policy "Authenticated admins can manage attendees"
  on public.attendees for all
  to authenticated
  using (true)
  with check (true);

drop function if exists public.get_attendee_by_ticket(text);

create function public.get_attendee_by_ticket(p_ticket_code text)
returns table (
  id uuid,
  ticket_code text,
  name text,
  category text,
  is_checked_in boolean,
  checked_in_at timestamptz,
  invitation_status text
)
language sql
security definer
set search_path = public
as $$
  select a.id, a.ticket_code, a.name, a.category, a.is_checked_in, a.checked_in_at, a.invitation_status
  from public.attendees as a
  where a.ticket_code = p_ticket_code
  limit 1;
$$;

grant execute on function public.get_attendee_by_ticket(text) to anon, authenticated;
