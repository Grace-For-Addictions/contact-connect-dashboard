-- VRCC — Staff operations for recovery residences.
-- Drug screens, incident reports, and house meetings, tied to residences and
-- residents. Alerts are derived client-side from this data + check-ins.

create extension if not exists "pgcrypto";

-- ---- drug screens ---------------------------------------------------------
create table if not exists public.drug_screens (
  id               uuid primary key default gen_random_uuid(),
  residence_id     uuid,   -- rr_houses.id (the residence)
  resident_id      uuid,
  participant_id   uuid,
  participant_name text,
  date             date default now(),
  screen_type      text default 'standard',   -- standard / random / follow-up
  result           text,                        -- NEG / POS / REF / INV
  administered_by  text,
  notes            text,
  created_by       text,
  created_date     timestamptz default now()
);

-- ---- incident reports (Level 1–4) -----------------------------------------
create table if not exists public.incidents (
  id               uuid primary key default gen_random_uuid(),
  residence_id     uuid,
  resident_id      uuid,
  participant_id   uuid,
  participant_name text,
  date             date default now(),
  level            integer default 1,           -- 1 minor .. 4 emergency
  incident_type    text,
  description      text,
  action_taken     text,
  followup         text,
  status           text default 'open',         -- open / resolved
  created_by       text,
  created_date     timestamptz default now()
);

-- ---- house meetings -------------------------------------------------------
create table if not exists public.house_meetings (
  id              uuid primary key default gen_random_uuid(),
  residence_id    uuid,
  date            date default now(),
  facilitator     text,
  attendees_count integer default 0,
  agenda          text,
  notes           text,
  created_by      text,
  created_date    timestamptz default now()
);

-- ---- RLS: permissive prototype policies (consistent with 0001) ------------
do $$
declare t text;
begin
  foreach t in array array['drug_screens','incidents','house_meetings'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "vrcc_all_read" on public.%I;', t);
    execute format('drop policy if exists "vrcc_all_write" on public.%I;', t);
    execute format('create policy "vrcc_all_read"  on public.%I for select using (true);', t);
    execute format('create policy "vrcc_all_write" on public.%I for all using (true) with check (true);', t);
  end loop;
end $$;
