-- VRCC — schema for every entity behind the wired rooms.
-- Table names match the entity→table map in src/api/client.js.
-- Columns are modeled from the fields the React pages actually read.
-- RLS is enabled with permissive prototype policies (the app uses the anon
-- publishable key and has no login yet). Apply 0002_harden_rls.sql once a
-- real auth flow is in place.

create extension if not exists "pgcrypto";

create table if not exists public.participants (
  id                uuid primary key default gen_random_uuid(),
  full_name         text not null,
  status            text default 'Active',
  email             text,
  phone             text,
  enrolled_date     date default now(),
  days_in_recovery  integer default 0,
  coach             text,
  notes             text,
  created_by        text,
  created_date      timestamptz default now()
);

create table if not exists public.interactions (
  id               uuid primary key default gen_random_uuid(),
  participant_id   uuid references public.participants(id) on delete set null,
  participant_name text,
  type             text,
  date             date default now(),
  duration_hours   numeric default 0,
  outcome          text,
  notes            text,
  coach            text,
  created_by       text,
  created_date     timestamptz default now()
);

create table if not exists public.check_ins (
  id               uuid primary key default gen_random_uuid(),
  participant_id   uuid references public.participants(id) on delete set null,
  participant_name text,
  date             date default now(),
  mood             text,
  score            numeric,
  notes            text,
  created_by       text,
  created_date     timestamptz default now()
);

create table if not exists public.goals (
  id                   uuid primary key default gen_random_uuid(),
  participant_id       uuid references public.participants(id) on delete set null,
  participant_name     text,
  title                text not null,
  description          text,
  category             text,
  status               text default 'in_progress',
  progress_percentage  numeric default 0,
  target_date          date,
  created_by           text,
  created_date         timestamptz default now()
);

create table if not exists public.milestones (
  id                uuid primary key default gen_random_uuid(),
  participant_id    uuid references public.participants(id) on delete set null,
  participant_name  text,
  title             text not null,
  description       text,
  milestone_type    text,
  days_in_recovery  integer,
  date_achieved     date default now(),
  created_by        text,
  created_date      timestamptz default now()
);

create table if not exists public.recovery_capital (
  id               uuid primary key default gen_random_uuid(),
  participant_id   uuid references public.participants(id) on delete set null,
  participant_name text,
  assessment_date  date default now(),
  total_score      numeric default 0,
  personal_score   numeric,
  social_score     numeric,
  community_score  numeric,
  notes            text,
  created_by       text,
  created_date     timestamptz default now()
);

create table if not exists public.affirmations (
  id           uuid primary key default gen_random_uuid(),
  text         text not null,
  category     text,
  is_active    boolean default true,
  created_by   text,
  created_date timestamptz default now()
);

create table if not exists public.community_resources (
  id                uuid primary key default gen_random_uuid(),
  resource_name     text not null,
  categories        text[],
  description       text,
  address           text,
  city              text,
  state             text,
  zip_code          text,
  phone             text,
  email             text,
  website           text,
  utilization_count integer default 0,
  created_by        text,
  created_date      timestamptz default now()
);

create table if not exists public.resource_matches (
  id             uuid primary key default gen_random_uuid(),
  participant_id uuid references public.participants(id) on delete set null,
  resource_id    uuid references public.community_resources(id) on delete set null,
  match_date     date default now(),
  status         text default 'suggested',
  created_by     text,
  created_date   timestamptz default now()
);

create table if not exists public.group_sessions (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  session_type      text,
  date              date default now(),
  duration_minutes  integer default 60,
  facilitator_name  text,
  location          text,
  attendance_count  integer default 0,
  session_notes     text,
  created_by        text,
  created_date      timestamptz default now()
);

create table if not exists public.coach_trainings (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  category     text,
  description  text,
  content      text,
  duration     text,
  status       text default 'available',
  created_by   text,
  created_date timestamptz default now()
);

create table if not exists public.referrals (
  id                       uuid primary key default gen_random_uuid(),
  participant_id           uuid references public.participants(id) on delete set null,
  participant_name         text,
  referral_type            text,
  service_type             text,
  source_organization      text,
  destination_organization text,
  referral_date            date default now(),
  status                   text default 'pending',
  created_by               text,
  created_date             timestamptz default now()
);

create table if not exists public.strength_assessments (
  id               uuid primary key default gen_random_uuid(),
  participant_id   uuid references public.participants(id) on delete set null,
  participant_name text,
  assessment_date  date default now(),
  total_score      numeric default 0,
  scores           jsonb,
  created_by       text,
  created_date     timestamptz default now()
);

create table if not exists public.progress_reviews (
  id                     uuid primary key default gen_random_uuid(),
  participant_id         uuid references public.participants(id) on delete set null,
  participant_name       text,
  review_period_start    date,
  review_period_end      date,
  status                 text default 'draft',
  summary                text,
  goal_completion_rate   numeric,
  check_in_consistency   numeric,
  recovery_capital_trend text,
  areas_of_excellence    text,
  areas_needing_support  text,
  generated_by           text,
  created_by             text,
  created_date           timestamptz default now()
);

create table if not exists public.surveys (
  id                  uuid primary key default gen_random_uuid(),
  participant_id      uuid references public.participants(id) on delete set null,
  participant_name    text,
  date_completed      date default now(),
  overall_satisfaction numeric,
  service_quality     numeric,
  coach_rating        numeric,
  life_quality_before numeric,
  life_quality_after  numeric,
  most_helpful_service text,
  created_by          text,
  created_date        timestamptz default now()
);

-- ---- RLS: enable + permissive prototype policies (anon key, no login) -----
do $$
declare t text;
begin
  foreach t in array array[
    'participants','interactions','check_ins','goals','milestones','recovery_capital',
    'affirmations','community_resources','resource_matches','group_sessions',
    'coach_trainings','referrals','strength_assessments','progress_reviews','surveys'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "vrcc_all_read" on public.%I;', t);
    execute format('drop policy if exists "vrcc_all_write" on public.%I;', t);
    execute format('create policy "vrcc_all_read"  on public.%I for select using (true);', t);
    execute format('create policy "vrcc_all_write" on public.%I for all using (true) with check (true);', t);
  end loop;
end $$;
