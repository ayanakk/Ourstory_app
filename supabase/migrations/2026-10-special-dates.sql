-- Yearly recurring dates (birthdays, own anniversaries...). Run once in the Supabase SQL editor.
create table if not exists special_dates (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references spaces(id) on delete cascade,
  created_by uuid references auth.users(id) default auth.uid(),
  title text not null,
  emoji text,
  month int not null check (month between 1 and 12),
  day int not null check (day between 1 and 31),
  year_started int,                     -- optional, e.g. birth year; shows "Nth" in the calendar
  note text,
  created_at timestamptz default now()
);

alter table special_dates enable row level security;

create policy "read"   on special_dates for select using (is_member(space_id));
create policy "insert" on special_dates for insert with check (is_member(space_id));
create policy "update" on special_dates for update using (is_member(space_id));
create policy "delete" on special_dates for delete using (is_member(space_id));
