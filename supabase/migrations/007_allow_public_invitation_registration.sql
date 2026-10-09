drop policy if exists "Public guests can submit invitations" on public.attendees;

create policy "Public guests can submit invitations"
  on public.attendees for insert
  to anon
  with check (
    category = 'undangan'
    and is_checked_in = false
    and invitation_status = 'pending'
  );
