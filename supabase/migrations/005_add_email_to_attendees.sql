alter table public.attendees
  add column if not exists email text;

create index if not exists attendees_email_idx on public.attendees (email);
