-- Delete account (Flow 1): run once in the Supabase SQL editor on an existing database.
alter table spaces add column if not exists status text not null default 'active'
  check (status in ('active', 'deleting'));

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
