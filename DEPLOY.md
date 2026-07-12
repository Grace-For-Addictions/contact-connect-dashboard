# Deploying VRCC Contact Connect (Supabase + Cloudflare)

This app was migrated off the Base44 hosted platform. The backend is now
**Supabase** (Postgres + Auth + Storage + Edge Functions) and the frontend is a
static **Vite** build hosted on **Cloudflare Pages**. There is no more
`@base44` dependency — `src/api/base44Client.js` is a thin adapter that exposes
the same API surface (`base44.entities.*`, `base44.auth`,
`base44.integrations.Core.*`) on top of Supabase.

## 1. Supabase project

Create (or reuse) a Supabase project, then apply the schema:

```bash
# migration lives at supabase/migrations/0001_init_entities.sql
supabase link --project-ref <ref>
supabase db push
```

Or paste `supabase/migrations/0001_init_entities.sql` into the SQL editor.

This creates one table per entity (`participant`, `check_in`, `interaction`,
`goal`, `milestone`, `progress_review`, `recovery_capital`, `referral`,
`resource_match`, `strength_assessment`, `survey`, `affirmation`,
`coach_training`, `community_resource`, `group_session`, `query`, `app_user`)
plus a public `uploads` storage bucket.

> **Security:** v1 policies grant the `anon` role full access so the app works
> without a login page (open-access mode). Tighten these when you enable auth.

## 2. Edge Function (AI features)

The `InvokeLLM` calls (AI writing suggestions, progress-review summaries, coach
training, resource matching) run through the `invoke-llm` Edge Function.

```bash
supabase functions deploy invoke-llm
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
# optional: supabase secrets set LLM_MODEL=claude-sonnet-5
```

Until `ANTHROPIC_API_KEY` is set, the app runs fine but AI buttons return an
error. `send-email`, `send-sms`, `generate-image`, and
`extract-data` are referenced by the adapter but not yet needed by any screen —
add functions with those names when a feature requires them.

## 3. Frontend (Cloudflare Pages)

Set these environment variables in **Cloudflare Pages → Settings → Environment
variables** (and in a local `.env`, see `.env.example`):

| Var | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | project anon key |
| `VITE_OPEN_ACCESS` | `true` for no-login v1 |

Deploy:

```bash
npm install
npm run build            # outputs to dist/
npx wrangler pages deploy dist
```

Or connect the GitHub repo in the Cloudflare dashboard with build command
`npm run build` and output directory `dist`. SPA routing is handled by
`public/_redirects` (`/* /index.html 200`).

## Architecture notes

- **Entity model:** every table is `id, created_date, updated_date, created_by,
  data jsonb`. All entity fields live in `data`; the adapter flattens it on read
  and filters via `data->>key`. No per-field schema needed.
- **Auth:** `VITE_OPEN_ACCESS=true` returns a built-in guest coach from
  `auth.me()`. Set it to `false` and add a login screen to require Supabase Auth.
- **Uploads/forms:** `UploadFile` writes to the `uploads` bucket and returns a
  public URL.
