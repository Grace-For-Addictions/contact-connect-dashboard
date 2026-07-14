-- VRCC — Platform expansion (Master Build Reference v2.0).
-- Adds the data model for the participant-facing VRCC modules that run on our
-- own stack: BARC-10 recovery-capital assessment, Walls of Honor, Narcan
-- distribution tracking, Events wall + RSVPs, and community-room messages.
--
-- Consistent with earlier migrations: UUID PKs, permissive prototype RLS.
-- Harden with 0002-style policies + auth before real PHI.

create extension if not exists "pgcrypto";

-- ---- participant profile fields (readiness continuum / ICARE / geography) --
alter table public.participants add column if not exists readiness_level text;   -- exploring / engaging / transforming
alter table public.participants add column if not exists icare_phase    text;    -- identify / connect / assess / respond / empower
alter table public.participants add column if not exists county         text;    -- Iowa county — drives resource filtering
alter table public.participants add column if not exists barc10_score   integer; -- 10–60, latest assessment total

-- ---- BARC-10 assessment (Brief Assessment of Recovery Capital) -------------
create table if not exists public.barc10_assessments (
  id               uuid primary key default gen_random_uuid(),
  participant_id   uuid,
  participant_name text,
  answers          jsonb,                 -- [{q, score 1-6}]
  total            integer,               -- 10–60
  soil_type        text,                  -- path / rocky / thorny / good
  insight          text,                  -- generated summary + next action
  date             date default now(),
  created_by       text,
  created_date     timestamptz default now()
);

-- ---- Walls of Honor / Kudos / Memorial / Gratitude ------------------------
create table if not exists public.honor_posts (
  id               uuid primary key default gen_random_uuid(),
  post_type        text default 'kudos',  -- kudos / memorial / gratitude
  author_name      text,
  participant_id   uuid,
  title            text,
  body             text,
  milestone_days   integer,               -- e.g. 30, 90, 365 (kudos)
  likes            integer default 0,
  created_by       text,
  created_date     timestamptz default now()
);

-- ---- Narcan distribution tracking (GPRA HR-001 / Iowa HF 1038 / Exhibit E) -
create table if not exists public.narcan_logs (
  id                uuid primary key default gen_random_uuid(),
  kit_id            text,
  distributed_by    text,
  distributed_to    text,                 -- recipient name (optional)
  participant_id    uuid,
  county            text,
  training_provided boolean default false,
  reversal_reported boolean default false,
  reversal_date     date,
  notes             text,
  date              date default now(),
  created_by        text,
  created_date      timestamptz default now()
);

-- ---- Community events + RSVPs ---------------------------------------------
create table if not exists public.community_events (
  id            uuid primary key default gen_random_uuid(),
  title         text,
  description   text,
  category      text,                     -- job / workshop / gathering / meeting
  event_date    timestamptz,
  location      text,
  host          text,
  county        text,
  rsvp_count    integer default 0,
  created_by    text,
  created_date  timestamptz default now()
);

create table if not exists public.event_rsvps (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid,
  participant_id   uuid,
  participant_name text,
  created_by       text,
  created_date     timestamptz default now()
);

-- ---- Community-room messages (10 named rooms; room_key from client) --------
create table if not exists public.room_messages (
  id               uuid primary key default gen_random_uuid(),
  room_key         text,                  -- open-circle / justice / womens / etc.
  author_name      text,
  participant_id   uuid,
  body             text,
  flagged          boolean default false, -- crisis / stigma keyword flag
  created_by       text,
  created_date     timestamptz default now()
);

-- ---- RLS: permissive prototype policies (consistent with 0001/0004) -------
do $$
declare t text;
begin
  foreach t in array array[
    'barc10_assessments','honor_posts','narcan_logs',
    'community_events','event_rsvps','room_messages'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "vrcc_all_read" on public.%I;', t);
    execute format('drop policy if exists "vrcc_all_write" on public.%I;', t);
    execute format('create policy "vrcc_all_read"  on public.%I for select using (true);', t);
    execute format('create policy "vrcc_all_write" on public.%I for all using (true) with check (true);', t);
  end loop;
end $$;
