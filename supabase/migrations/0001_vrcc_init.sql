-- VRCC — initial schema for the core recovery-program entities.
-- Table names match the entity→table map in src/api/client.js.
-- RLS is enabled; the starter policies below are permissive for a prototype
-- (anon = the publishable key). Tighten these before production: scope reads
-- and writes to the authenticated peer/coach and their participants.

create extension if not exists "pgcrypto";

-- ---- participants ---------------------------------------------------------
create table if not exists public.participants (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null,
  status        text default 'Active',
  email         text,
  phone         text,
  enrolled_date date default now(),
  coach         text,
  notes         text,
  created_by    text,
  created_date  timestamptz default now()
);

-- ---- interactions ---------------------------------------------------------
create table if not exists public.interactions (
  id             uuid primary key default gen_random_uuid(),
  participant_id uuid references public.participants(id) on delete set null,
  type           text,
  date           date default now(),
  duration_hours numeric default 0,
  outcome        text,
  notes          text,
  coach          text,
  created_by     text,
  created_date   timestamptz default now()
);

-- ---- check_ins ------------------------------------------------------------
create table if not exists public.check_ins (
  id             uuid primary key default gen_random_uuid(),
  participant_id uuid references public.participants(id) on delete set null,
  date           date default now(),
  mood           text,
  score          numeric,
  notes          text,
  created_by     text,
  created_date   timestamptz default now()
);

-- ---- goals ----------------------------------------------------------------
create table if not exists public.goals (
  id             uuid primary key default gen_random_uuid(),
  participant_id uuid references public.participants(id) on delete set null,
  title          text not null,
  description    text,
  status         text default 'in_progress',
  target_date    date,
  created_by     text,
  created_date   timestamptz default now()
);

-- ---- milestones -----------------------------------------------------------
create table if not exists public.milestones (
  id             uuid primary key default gen_random_uuid(),
  participant_id uuid references public.participants(id) on delete set null,
  title          text not null,
  date_achieved  date default now(),
  created_by     text,
  created_date   timestamptz default now()
);

-- ---- recovery_capital -----------------------------------------------------
create table if not exists public.recovery_capital (
  id              uuid primary key default gen_random_uuid(),
  participant_id  uuid references public.participants(id) on delete set null,
  assessment_date date default now(),
  total_score     numeric default 0,
  personal_score  numeric,
  social_score    numeric,
  community_score  numeric,
  notes           text,
  created_by      text,
  created_date    timestamptz default now()
);

-- ---- RLS: enable + permissive prototype policies --------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'participants','interactions','check_ins','goals','milestones','recovery_capital'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format($p$
      create policy "vrcc_all_read"  on public.%I for select using (true);
    $p$, t);
    execute format($p$
      create policy "vrcc_all_write" on public.%I for all using (true) with check (true);
    $p$, t);
  end loop;
end $$;
