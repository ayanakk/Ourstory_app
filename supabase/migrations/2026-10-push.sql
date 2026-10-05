-- Push notifications. Run once in the Supabase SQL editor, then follow the setup notes at the bottom.
create extension if not exists pg_net;
create extension if not exists pg_cron;

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz default now()
);

create table if not exists notification_prefs (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  partner_memory boolean not null default true,
  capsule        boolean not null default true,
  special_dates  boolean not null default true,
  daily_nudge    boolean not null default true,
  tz text not null default 'UTC',          -- IANA zone; the daily job sends at 9am local
  updated_at timestamptz default now()
);

alter table push_subscriptions enable row level security;
alter table notification_prefs enable row level security;

drop policy if exists "own subs" on push_subscriptions;
create policy "own subs"  on push_subscriptions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "own prefs" on notification_prefs;
create policy "own prefs" on notification_prefs for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Server-only config (function URL + shared secret). RLS on, no policies: invisible to clients.
create table if not exists push_config (key text primary key, value text not null);
alter table push_config enable row level security;

-- Tell the partner when a memory is added.
create or replace function notify_partner_memory() returns trigger
language plpgsql security definer set search_path = public as $$
declare url text; secret text;
begin
  select value into url    from push_config where key = 'send_push_url';
  select value into secret from push_config where key = 'webhook_secret';
  if url is null or secret is null then return new; end if;
  perform net.http_post(
    url := url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', secret),
    body := jsonb_build_object('type', 'memory', 'memory_id', new.id)
  );
  return new;
end $$;

drop trigger if exists memories_notify_partner on memories;
create trigger memories_notify_partner after insert on memories
  for each row execute function notify_partner_memory();

-- ---- Setup notes (run by hand, with your own values) ----
-- insert into push_config values
--   ('send_push_url',  'https://<project-ref>.supabase.co/functions/v1/send-push'),
--   ('webhook_secret', '<same value as the PUSH_WEBHOOK_SECRET function secret>');
--
-- select cron.schedule('daily-notify', '0 * * * *', $$
--   select net.http_post(
--     url := 'https://<project-ref>.supabase.co/functions/v1/daily-notify',
--     headers := jsonb_build_object('Content-Type','application/json','x-webhook-secret','<secret>')
--   ) $$);
