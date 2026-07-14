-- VRCC — Accounts & role-based access control.
--
-- One identity record per person or organization that enters the VRCC. Roles:
--   participant  — the default; full participant access, no approval needed
--   coach        — peer coach; may also be a navigator (is_navigator)
--   organization — sober-living / recovery-residence provider, RCC, church, etc.
--   supporter    — family / loved one / sponsor / mentor, invited by a participant
--
-- Coaches and organizations get PARTICIPANT-level access until a super admin
-- approves them (approval_status = 'approved'). Two emails are auto-approved
-- super admins (see is_super_admin, set at insert time by the app).
--
-- Identity is currently keyed by email + client-side session (localStorage).
-- Supabase Auth magic-link is the connect-point that hardens this later;
-- account_uid is reserved for the auth user id at that point.

create extension if not exists "pgcrypto";

create table if not exists public.accounts (
  id              uuid primary key default gen_random_uuid(),
  email           text,
  first_name      text,
  last_name       text,
  dob             date,
  role            text default 'participant',   -- participant / coach / organization / supporter
  is_navigator    boolean default false,        -- coach who is also a navigator
  is_resident     boolean default false,        -- participant who is also a residence resident
  org_name        text,
  org_types       text[],                        -- recovery_residence / rcc / church / treatment / other
  residence_id    uuid,                          -- rr_houses.id chosen when is_resident / provider
  participant_id  uuid,                          -- linked participants row (humans)
  approval_status text default 'approved',       -- approved / pending  (coach & org default to pending in app)
  is_super_admin  boolean default false,
  invited_by      text,                          -- email of the participant who invited a supporter
  relationship    text,                          -- supporter relationship (family / sponsor / mentor…)
  account_uid     uuid,                          -- supabase auth user id, once login is wired
  created_by      text,
  created_date    timestamptz default now()
);

create index if not exists accounts_email_idx on public.accounts (lower(email));

-- Permissive prototype RLS (consistent with earlier migrations). Harden with
-- authenticated-scoped policies once Supabase Auth is wired.
do $$
declare t text;
begin
  foreach t in array array['accounts'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "vrcc_all_read" on public.%I;', t);
    execute format('drop policy if exists "vrcc_all_write" on public.%I;', t);
    execute format('create policy "vrcc_all_read"  on public.%I for select using (true);', t);
    execute format('create policy "vrcc_all_write" on public.%I for all using (true) with check (true);', t);
  end loop;
end $$;
