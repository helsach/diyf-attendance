drop policy if exists "Public guests can submit names" on public.attendees;

create policy "Public guests can submit names"
  on public.attendees for insert
  to anon
  with check (
    category = 'guest'
    and is_checked_in = false
    and invitation_status = 'pending'
  );
