-- Delete account while connected (partner pass). Run once in the Supabase SQL editor.
create table deletion_passes (          -- one-time pass a partner must approve before the other deletes
  space_id uuid primary key references spaces(id) on delete cascade,
  issued_by uuid not null references auth.users(id) on delete cascade,
  code text not null,
  expires_at timestamptz not null
);

alter table deletion_passes enable row level security;

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
