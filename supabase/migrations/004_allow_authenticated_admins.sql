  drop policy if exists "Authenticated admins can manage attendees" on public.attendees;

  create policy "Authenticated admins can manage attendees"
    on public.attendees for all
    to authenticated
    using (true)
    with check (true);
