-- =====================================================
-- Our Story: Supabase schema (run once in SQL Editor)
-- =====================================================

-- ---------- TABLES ----------
create table spaces (
  id uuid primary key default gen_random_uuid(),
  name text,
  start_date date,
  invite_code text unique not null default substr(md5(random()::text), 1, 8),
  status text not null default 'active' check (status in ('active', 'deleting')),
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table members (
  space_id uuid references spaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  display_name text,
  joined_at timestamptz default now(),
  primary key (space_id, user_id),
  unique (user_id)                      -- one space per user
);

create table memories (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references spaces(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  date date not null,
  place_name text,
  lat double precision,
  lng double precision,
  title text,
  body text,
  mood text,
  layout text default 'classic',
  title_position text default 'bottom',
  caption text,
  song_url text,
  cover_photo_id uuid,
  is_favorite boolean default false,
  created_at timestamptz default now()
);

create table memory_notes (             -- private notes, visible only to author
  memory_id uuid primary key references memories(id) on delete cascade,
  space_id uuid not null references spaces(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  note text
);

create table photos (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references spaces(id) on delete cascade,
  memory_id uuid references memories(id) on delete cascade,
  uploaded_by uuid references auth.users(id),
  path text not null,
  is_favorite boolean default false,
  created_at timestamptz default now()
);

create table little_moments (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references spaces(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  kind text,                            -- message, selfie, gift, food, funny, quote, joke
  text text,
  photo_path text,
  created_at timestamptz default now()
);

create table capsules (                 -- capsules + future letters
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references spaces(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  kind text not null check (kind in ('capsule', 'letter')),
  to_user uuid references auth.users(id),   -- null = both
  title text,
  body text,
  photo_paths text[] default '{}',
  video_path text,
  opens_at timestamptz not null,
  created_at timestamptz default now()
);

create table wishlist (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references spaces(id) on delete cascade,
  created_by uuid references auth.users(id),
  title text not null,
  category text,                        -- place, restaurant, movie, buy, experience, trip
  priority int default 2,
  notes text,
  target_date date,
  place_name text,
  plan_items jsonb default '[]',        -- [{text, done}]
  is_done boolean default false,
  converted_memory_id uuid references memories(id) on delete set null,
  created_at timestamptz default now()
);

create table special_dates (
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

create table checkins (
  user_id uuid references auth.users(id) on delete cascade,
  space_id uuid references spaces(id) on delete cascade,
  day date not null default current_date,
  mood text,
  primary key (user_id, day)
);

create table favorites (                -- favorite quote / place / moment
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references spaces(id) on delete cascade,
  author_id uuid references auth.users(id),
  kind text check (kind in ('quote', 'place', 'moment')),
  text text,
  created_at timestamptz default now()
);

create table deletion_passes (          -- one-time pass a partner must approve before the other deletes
  space_id uuid primary key references spaces(id) on delete cascade,
  issued_by uuid not null references auth.users(id) on delete cascade,
  code text not null,
  expires_at timestamptz not null
);

-- ---------- HELPER FUNCTIONS ----------
create or replace function is_member(sid uuid)
returns boolean
language sql security definer stable
set search_path = public as $$
  select exists (
    select 1 from members where space_id = sid and user_id = auth.uid()
  );
$$;

-- Create a space and join it as the first member
create or replace function create_space(p_name text, p_start_date date, p_display_name text)
returns uuid
language plpgsql security definer
set search_path = public as $$
declare sid uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if exists (select 1 from members where user_id = auth.uid()) then
    raise exception 'You already belong to a space';
  end if;
  insert into spaces (name, start_date, created_by)
    values (p_name, p_start_date, auth.uid()) returning id into sid;
  insert into members (space_id, user_id, display_name)
    values (sid, auth.uid(), p_display_name);
  return sid;
end $$;

-- Join with invite code (max 2 people per space).
-- Locks the space row so joining and account deletion can't both win; an unknown
-- code and a space being deleted give the same error so nothing leaks.
create or replace function join_space(p_code text, p_display_name text)
returns uuid
language plpgsql security definer
set search_path = public as $$
declare sid uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if exists (select 1 from members where user_id = auth.uid()) then
    raise exception 'You already belong to a space';
  end if;
  select id into sid from spaces
    where invite_code = lower(trim(p_code)) and status = 'active'
    for update;
  if sid is null then raise exception 'Invalid invite code'; end if;
  if (select count(*) from members where space_id = sid) >= 2 then
    raise exception 'This space is already full';
  end if;
  insert into members (space_id, user_id, display_name)
    values (sid, auth.uid(), p_display_name);
  return sid;
end $$;

-- Can the current user delete their account? Only when nobody else is in the space.
create or replace function delete_account_check()
returns jsonb
language plpgsql security definer stable
set search_path = public as $$
declare sid uuid; partner text;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select space_id into sid from members where user_id = auth.uid();
  if sid is not null and (select count(*) from members where space_id = sid) > 1 then
    select display_name into partner from members
      where space_id = sid and user_id <> auth.uid();
    return jsonb_build_object('allowed', false, 'reason', 'SPACE_CONNECTED', 'partner_name', partner);
  end if;
  return jsonb_build_object('allowed', true);
end $$;

-- Called only by the delete-account Edge Function (service role).
-- Locks the space, re-checks the user is alone, and marks it 'deleting' so the
-- invite link dies. Safe to call again on retry. Returns the space id (null if none).
create or replace function begin_account_deletion(p_user uuid)
returns uuid
language plpgsql security definer
set search_path = public as $$
declare sid uuid;
begin
  select space_id into sid from members where user_id = p_user;
  if sid is null then return null; end if;
  perform 1 from spaces where id = sid for update;
  if (select count(*) from members where space_id = sid) > 1 then
    raise exception 'SPACE_CONNECTED';
  end if;
  update spaces set status = 'deleting' where id = sid;
  return sid;
end $$;

revoke all on function begin_account_deletion(uuid) from public, anon, authenticated;
grant execute on function begin_account_deletion(uuid) to service_role;

-- ---------- DELETE ACCOUNT WHILE CONNECTED ----------
-- The partner shows a one-time pass; the person leaving must type it in.
create or replace function issue_deletion_pass()
returns jsonb
language plpgsql security definer
set search_path = public as $$
declare sid uuid; pass text; exp timestamptz;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select space_id into sid from members where user_id = auth.uid();
  if sid is null or (select count(*) from members where space_id = sid) < 2 then
    raise exception 'NOT_CONNECTED';
  end if;
  pass := lpad(floor(random() * 1000000)::int::text, 6, '0');
  exp := now() + interval '10 minutes';
  insert into deletion_passes (space_id, issued_by, code, expires_at)
    values (sid, auth.uid(), pass, exp)
    on conflict (space_id) do update
      set issued_by = excluded.issued_by, code = excluded.code, expires_at = excluded.expires_at;
  return jsonb_build_object('code', pass, 'expires_at', exp);
end $$;

grant execute on function issue_deletion_pass() to authenticated;

-- Checks the pass for p_user leaving a two-person space.
-- 'transfer' hands everything to the partner and removes p_user from the space.
-- 'wipe' only verifies (the Edge Function then clears storage and calls finish_wipe).
-- Returns the space id. Raises INVALID_PASS / NOT_CONNECTED.
create or replace function begin_connected_deletion(p_user uuid, p_code text, p_mode text)
returns uuid
language plpgsql security definer
set search_path = public as $$
declare sid uuid; partner uuid;
begin
  if p_mode not in ('transfer', 'wipe') then raise exception 'INVALID_MODE'; end if;
  select space_id into sid from members where user_id = p_user;
  if sid is null then raise exception 'NOT_CONNECTED'; end if;
  perform 1 from spaces where id = sid for update;
  select user_id into partner from members where space_id = sid and user_id <> p_user;
  if partner is null then raise exception 'NOT_CONNECTED'; end if;

  if not exists (
    select 1 from deletion_passes
    where space_id = sid and issued_by = partner
      and code = trim(coalesce(p_code, '')) and expires_at > now()
  ) then
    raise exception 'INVALID_PASS';
  end if;

  if p_mode = 'transfer' then
    delete from memory_notes where author_id = p_user;       -- private to the author
    update memories       set author_id   = partner where author_id   = p_user and space_id = sid;
    update photos         set uploaded_by = partner where uploaded_by = p_user and space_id = sid;
    update little_moments set author_id   = partner where author_id   = p_user and space_id = sid;
    update capsules       set author_id   = partner where author_id   = p_user and space_id = sid;
    update capsules       set to_user     = partner where to_user     = p_user and space_id = sid;
    update wishlist       set created_by  = partner where created_by  = p_user and space_id = sid;
    update special_dates  set created_by  = partner where created_by  = p_user and space_id = sid;
    update favorites      set author_id   = partner where author_id   = p_user and space_id = sid;
    delete from members where space_id = sid and user_id = p_user;
    delete from deletion_passes where space_id = sid;
    update spaces set invite_code = substr(md5(random()::text), 1, 8) where id = sid;
  end if;
  return sid;
end $$;

-- Second step of 'wipe', after the storage files are gone: remove all shared data
-- and the leaver's membership. The partner keeps an empty space.
create or replace function finish_wipe(p_user uuid)
returns void
language plpgsql security definer
set search_path = public as $$
declare sid uuid;
begin
  select space_id into sid from members where user_id = p_user;
  if sid is null then return; end if;
  perform 1 from spaces where id = sid for update;
  delete from memories       where space_id = sid;   -- cascades photos + notes
  delete from photos         where space_id = sid;
  delete from little_moments where space_id = sid;
  delete from capsules       where space_id = sid;
  delete from wishlist       where space_id = sid;
  delete from special_dates  where space_id = sid;
  delete from favorites      where space_id = sid;
  delete from checkins       where space_id = sid;
  delete from members where space_id = sid and user_id = p_user;
  delete from deletion_passes where space_id = sid;
  update spaces set invite_code = substr(md5(random()::text), 1, 8) where id = sid;
end $$;

revoke all on function begin_connected_deletion(uuid, text, text) from public, anon, authenticated;
revoke all on function finish_wipe(uuid) from public, anon, authenticated;
grant execute on function begin_connected_deletion(uuid, text, text) to service_role;
grant execute on function finish_wipe(uuid) to service_role;

-- Capsule list: metadata always visible, content only after opens_at
create or replace function list_capsules()
returns table (
  id uuid, kind text, author_id uuid, to_user uuid, title text,
  opens_at timestamptz, created_at timestamptz, is_open boolean,
  body text, photo_paths text[], video_path text
)
language sql security definer stable
set search_path = public as $$
  select c.id, c.kind, c.author_id, c.to_user, c.title,
         c.opens_at, c.created_at, (c.opens_at <= now()) as is_open,
         case when c.opens_at <= now() then c.body end,
         case when c.opens_at <= now() then c.photo_paths end,
         case when c.opens_at <= now() then c.video_path end
  from capsules c
  where is_member(c.space_id)
    and (c.to_user is null or c.to_user = auth.uid() or c.author_id = auth.uid())
  order by c.opens_at;
$$;

-- ---------- ROW LEVEL SECURITY ----------
alter table spaces         enable row level security;
alter table members        enable row level security;
alter table memories       enable row level security;
alter table memory_notes   enable row level security;
alter table photos         enable row level security;
alter table little_moments enable row level security;
alter table capsules       enable row level security;
alter table wishlist       enable row level security;
alter table special_dates  enable row level security;
alter table checkins       enable row level security;
alter table favorites      enable row level security;
alter table deletion_passes enable row level security;   -- no policies: RPC-only

-- spaces / members: read only (writes go through the functions above)
create policy "members read space"   on spaces  for select using (is_member(id));
create policy "members update space" on spaces  for update using (is_member(id));
create policy "members read members" on members for select using (is_member(space_id));
create policy "update own profile"   on members for update using (user_id = auth.uid());

-- memories
create policy "read"   on memories for select using (is_member(space_id));
create policy "insert" on memories for insert with check (is_member(space_id) and author_id = auth.uid());
create policy "update" on memories for update using (is_member(space_id));
create policy "delete" on memories for delete using (author_id = auth.uid());

-- private notes: author only
create policy "own notes" on memory_notes for all
  using (author_id = auth.uid() and is_member(space_id))
  with check (author_id = auth.uid() and is_member(space_id));

-- photos
create policy "read"   on photos for select using (is_member(space_id));
create policy "insert" on photos for insert with check (is_member(space_id));
create policy "update" on photos for update using (is_member(space_id));
create policy "delete" on photos for delete using (uploaded_by = auth.uid());

-- little moments
create policy "read"   on little_moments for select using (is_member(space_id));
create policy "insert" on little_moments for insert with check (is_member(space_id) and author_id = auth.uid());
create policy "delete" on little_moments for delete using (author_id = auth.uid());

-- capsules: insert only; reading goes through list_capsules() so sealed content stays sealed
create policy "insert" on capsules for insert with check (is_member(space_id) and author_id = auth.uid());
create policy "delete own unopened" on capsules for delete
  using (author_id = auth.uid() and opens_at > now());

-- special_dates
create policy "read"   on special_dates for select using (is_member(space_id));
create policy "insert" on special_dates for insert with check (is_member(space_id));
create policy "update" on special_dates for update using (is_member(space_id));
create policy "delete" on special_dates for delete using (is_member(space_id));

-- wishlist
create policy "read"   on wishlist for select using (is_member(space_id));
create policy "insert" on wishlist for insert with check (is_member(space_id));
create policy "update" on wishlist for update using (is_member(space_id));
create policy "delete" on wishlist for delete using (is_member(space_id));

-- check-ins: both can see, each writes own
create policy "read"   on checkins for select using (is_member(space_id));
create policy "insert" on checkins for insert with check (is_member(space_id) and user_id = auth.uid());
create policy "update" on checkins for update using (user_id = auth.uid());

-- favorites
create policy "read"   on favorites for select using (is_member(space_id));
create policy "insert" on favorites for insert with check (is_member(space_id));
create policy "delete" on favorites for delete using (is_member(space_id));

-- ---------- STORAGE (private bucket) ----------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

-- File path convention: {space_id}/{memory_id}/{filename}
create policy "members read photos" on storage.objects for select
  using (bucket_id = 'photos' and is_member(((storage.foldername(name))[1])::uuid));
create policy "members upload photos" on storage.objects for insert
  with check (bucket_id = 'photos' and is_member(((storage.foldername(name))[1])::uuid));
create policy "members delete photos" on storage.objects for delete
  using (bucket_id = 'photos' and is_member(((storage.foldername(name))[1])::uuid));

-- ---------- INDEXES ----------
create index on memories (space_id, date desc);
create index on photos (memory_id);
create index on capsules (space_id, opens_at);
