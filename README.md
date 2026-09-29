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
3. Apply the database schema in `supabase/schema.sql` to your Supabase project.

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
