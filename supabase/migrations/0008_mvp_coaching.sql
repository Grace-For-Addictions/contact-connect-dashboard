-- VRCC — Coaching MVP: participant↔coach messaging, assignment, and sessions.
-- The minimum a coach needs to legitimately work with participants: required
-- intake + BARC-10, claim an unmatched participant, message back and forth,
-- and sessions the participant requests but only the coach schedules.

create extension if not exists "pgcrypto";

-- participant assignment + onboarding completion flags
alter table public.participants add column if not exists assigned_coach_email text;
alter table public.participants add column if not exists assigned_coach_name  text;
alter table public.participants add column if not exists intake_complete       boolean default false;
alter table public.participants add column if not exists barc10_complete       boolean default false;

-- messages (one thread per participant; coach ↔ participant)
create table if not exists public.mvp_messages (
  id                uuid primary key default gen_random_uuid(),
  participant_id    uuid,
  participant_email text,
  sender_role       text,          -- participant / coach
  sender_email      text,
  sender_name       text,
  body              text,
  read              boolean default false,
  created_date      timestamptz default now()
);

-- session requests: participant asks; coach decides day/time
create table if not exists public.mvp_session_requests (
  id                uuid primary key default gen_random_uuid(),
  participant_id    uuid,
  participant_email text,
  participant_name  text,
  coach_email       text,
  coach_name        text,
  note              text,
  status            text default 'requested',   -- requested / scheduled / declined
  created_date      timestamptz default now()
);

-- sessions: created when a coach schedules (only coaches set scheduled_at)
create table if not exists public.mvp_sessions (
  id                uuid primary key default gen_random_uuid(),
  request_id        uuid,
  participant_id    uuid,
  participant_email text,
  participant_name  text,
  coach_email       text,
  coach_name        text,
  scheduled_at      timestamptz,
  status            text default 'scheduled',    -- scheduled / completed / cancelled
  notes             text,
  created_date      timestamptz default now()
);

-- permissive prototype RLS (consistent with earlier migrations)
do $$
declare t text;
begin
  foreach t in array array['mvp_messages','mvp_session_requests','mvp_sessions'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "vrcc_all_read" on public.%I;', t);
    execute format('drop policy if exists "vrcc_all_write" on public.%I;', t);
    execute format('create policy "vrcc_all_read"  on public.%I for select using (true);', t);
    execute format('create policy "vrcc_all_write" on public.%I for all using (true) with check (true);', t);
  end loop;
end $$;
