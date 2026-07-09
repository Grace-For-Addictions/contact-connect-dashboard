# VRCC — Virtual Recovery Community Center

A place, not an app. The immersive shell (`index.html` + `public/vrcc*.{css,js}`)
is a spatial "building" for **Grace For Addictions**: you arrive outside, walk
into the lobby, down the hallway, and open doors into rooms. Each door mounts a
live React page inside the room; the basement holds the *Recovering the Mind*
engine (59 practices, 7 movements, 4 reflection modes), and there's a community
garden and a Des Moines resource map.

## Stack
- **Shell:** vanilla HTML/CSS/JS (spatial navigation, Cosmos & Renew modes)
- **Rooms:** React 18 + Vite 6, mounted behind doors via `src/shell/RoomHost.jsx`
- **Data/auth:** Supabase (`@supabase/supabase-js`) through `src/api/client.js`

## Room → page map
| Door | Page | Door | Page |
|---|---|---|---|
| Welcome | Dashboard | Journey | RecoveryTracker |
| Coaching | CoachTraining | Lounge | Affirmations |
| Circles | GroupSessions | Check-In | CheckIns |
| Resources | CommunityResources | Staff 🔒 | Reports |

## Setup
1. Install: `npm install`
2. Copy env: `cp .env.example .env.local` and fill in:
   ```
   VITE_SUPABASE_URL=https://yqonwnzqtgmnoiymkefk.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_...
   ```
   (Publishable keys are safe client-side. `.env.local` is gitignored.)
3. Provision the database — apply the migrations to your Supabase project via
   the SQL editor or CLI:
   ```
   supabase db push          # or paste supabase/migrations/*.sql in the editor
   psql "$DATABASE_URL" -f supabase/seed.sql   # optional demo data
   ```
4. Run: `npm run dev` — build: `npm run build` — preview: `npm run preview`

## Migrations
- `supabase/migrations/0001_vrcc_init.sql` — all tables + **permissive** RLS
  (the app currently uses the anon key with no login).
- `supabase/migrations/0002_harden_rls.sql` — authenticated-scoped RLS. Apply
  **after** wiring a real login flow in `src/lib/AuthContext.jsx`, or
  participant data will read as empty under the anon key.
- `supabase/seed.sql` — optional demo rows so the rooms show life immediately.

## Data layer
`src/api/client.js` exposes a Supabase-backed `db` mirroring the old entity API
(`db.entities.<Name>.list/filter/create/update/get/delete`, `db.auth`,
`db.integrations`, `db.appLogs`). Reads return `[]` gracefully when a table or
key is missing, so the UI renders empty states rather than throwing.

## Deploy
The app is a static Vite build that talks to Supabase from the browser, so any
static host works. The Supabase URL and publishable key are baked in as
fallbacks, so **no environment variables are required** for a basic deploy.

**Cloudflare Pages (recommended)** — Pages → *Create* → *Connect to Git* → this
repo. Settings:
- Framework preset: **Vite**
- Build command: `npm run build`
- Build output directory: `dist`
- (Optional) override `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` in the
  project's environment variables to point at a different project.

Vercel and Netlify work identically (build `npm run build`, output `dist`);
`public/_redirects` provides SPA fallback.

**Security before real data:** the deployed publishable key + permissive RLS
means anyone can read/write the demo tables. That's fine for prototype testing.
Before real participant data, apply `supabase/migrations/0002_harden_rls.sql`
and wire a login flow in `src/lib/AuthContext.jsx`.
