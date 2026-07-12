-- VRCC — Recovery Residence network.
-- A recovery residence org has an account, runs one or more houses (each with
-- a bed count), admits VRCC participants as residents, and runs them through an
-- intake packet of documents that must be read, agreed, and signed.

create extension if not exists "pgcrypto";

-- ---- the residence org "account" -----------------------------------------
create table if not exists public.recovery_residences (
  id             uuid primary key default gen_random_uuid(),
  org_name       text not null,
  contact_name   text,
  email          text,
  phone          text,
  address        text,
  city           text,
  state          text default 'IA',
  license_number text,
  level          text,            -- NARR level I–IV, optional
  notes          text,
  account_uid    uuid,            -- supabase auth user, once login is wired
  created_by     text,
  created_date   timestamptz default now()
);

-- ---- houses (each has beds) ----------------------------------------------
create table if not exists public.rr_houses (
  id             uuid primary key default gen_random_uuid(),
  residence_id   uuid references public.recovery_residences(id) on delete cascade,
  name           text not null,
  address        text,
  city           text,
  state          text default 'IA',
  zip            text,
  house_type     text default 'Co-ed',     -- Men's / Women's / Co-ed
  total_beds     integer not null default 0,
  manager_name   text,
  manager_phone  text,
  monthly_fee    numeric,
  house_rules    text,
  created_by     text,
  created_date   timestamptz default now()
);

-- ---- residents (a participant placed in a house bed) ----------------------
create table if not exists public.rr_residents (
  id               uuid primary key default gen_random_uuid(),
  house_id         uuid references public.rr_houses(id) on delete set null,
  residence_id     uuid references public.recovery_residences(id) on delete set null,
  participant_id   uuid references public.participants(id) on delete set null,
  participant_name text,
  bed_number       integer,
  status           text default 'applicant',  -- applicant / resident / alumni / discharged
  move_in_date     date,
  move_out_date    date,
  intake_complete  boolean default false,
  created_by       text,
  created_date     timestamptz default now()
);

-- ---- intake documents (read → agree → sign) -------------------------------
create table if not exists public.rr_intake_documents (
  id             uuid primary key default gen_random_uuid(),
  resident_id    uuid references public.rr_residents(id) on delete cascade,
  participant_id uuid references public.participants(id) on delete set null,
  house_id       uuid references public.rr_houses(id) on delete set null,
  doc_type       text not null,   -- application / agreement / house_rules / roi / relapse_policy
  title          text,
  status         text default 'pending',   -- pending / signed
  data           jsonb default '{}'::jsonb, -- carried-over + entered fields
  agreed         boolean default false,
  signed_name    text,
  signed_date    date,
  created_by     text,
  created_date   timestamptz default now()
);

-- ---- RLS: permissive prototype policies (consistent with 0001) ------------
do $$
declare t text;
begin
  foreach t in array array[
    'recovery_residences','rr_houses','rr_residents','rr_intake_documents'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "vrcc_all_read" on public.%I;', t);
    execute format('drop policy if exists "vrcc_all_write" on public.%I;', t);
    execute format('create policy "vrcc_all_read"  on public.%I for select using (true);', t);
    execute format('create policy "vrcc_all_write" on public.%I for all using (true) with check (true);', t);
  end loop;
end $$;
