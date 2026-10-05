# Date App

A shared space for couples to log memories, milestones, and moments together. Built with React, Vite, Tailwind CSS, and Supabase.

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Copy the environment example and fill in your Supabase project details:
   ```
   cp .env.example .env
   ```
   Then set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`.
3. Apply the database schema in `supabase/schema.sql` to your Supabase project. On an existing database, run `supabase/migrations/2026-10-delete-account.sql` instead.
4. Deploy the account-deletion function (needs the Supabase CLI, linked to your project):
   ```
   supabase functions deploy delete-account
   ```

### Deleting an account while connected

When a space has two members, the person leaving needs a one-time pass from their partner. On an existing database, run `supabase/migrations/2026-10-delete-connected.sql` once in the Supabase SQL editor. It adds:

- `deletion_passes` table (RLS on, no policies, so it is only reachable through the functions below).
- `issue_deletion_pass()` — callable by the partner. Returns a 6-digit code valid for 10 minutes.
- `begin_connected_deletion(user, code, mode)` — service role only. Checks the partner's pass, then:
  - `transfer`: hands the leaver's memories, photos, moments, capsules, wishlist items, special dates and favorites to the partner, removes the leaver from the space and rotates the invite code. The leaver's private notes are deleted.
  - `wipe`: only verifies the pass. The Edge Function then clears storage and calls `finish_wipe`.
- `finish_wipe(user)` — service role only. Deletes all shared data and the leaver's membership. The partner keeps an empty space.

The `delete-account` Edge Function (step 4) calls these, so deploy it too.

### Mobile app and push notifications

The app is an installable PWA (Android: "Install app" in Chrome; iPhone: Safari, iOS 16.4+, Share, "Add to Home Screen"). Push notifications cover a partner adding a memory, capsules opening, special dates and milestones, and a daily check-in nudge at 9am local time. Setup:

1. Generate keys with `npx web-push generate-vapid-keys`.
2. Put the public key in `.env` and in Vercel as `VITE_VAPID_PUBLIC_KEY`.
3. In Supabase, set the function secrets `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` and `PUSH_WEBHOOK_SECRET`.
4. Run `supabase/migrations/2026-10-push.sql` in the SQL editor.
5. Run the two commented-out snippets at the bottom of that migration: the `push_config` insert and the `cron.schedule` call.
6. Deploy the functions:
   ```
   supabase functions deploy send-push daily-notify --no-verify-jwt
   ```

## Run

```
npm run dev
```

The app will be available at `http://localhost:5173`.

## Build

```
npm run build
```

## Project structure

- `src/lib` — Supabase client and helper utilities
- `src/hooks` — shared React hooks (auth, space, memories)
- `src/components` — layout, memory, capsule, and UI components
- `src/pages` — route-level page components
- `src/design/tokens.css` — design tokens (colors, spacing, radius, fonts)
- `supabase/schema.sql` — database schema
- `supabase/migrations` — incremental SQL for existing databases
- `supabase/functions/delete-account` — Edge Function that permanently deletes an account
- `supabase/functions/send-push`, `supabase/functions/daily-notify` — Edge Functions that send push notifications
- `supabase/migrations/2026-10-push.sql` — push subscription tables, memory trigger and config
- `supabase/migrations/2026-10-delete-connected.sql` — partner pass and keep-or-wipe deletion while connected
