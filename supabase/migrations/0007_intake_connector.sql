-- VRCC — Contact Connect intake + The Connector directory.
--
-- Adds a full participant intake (person-first, mostly optional) and a
-- searchable community directory of recovery residences, recovery community
-- centers, support services, wellness centers, faith communities, and allies.
-- Also gives accounts a volunteer skill set.

create extension if not exists "pgcrypto";

-- volunteer gifts / skills on the account
alter table public.accounts add column if not exists skills text[];

-- ---- full participant intake (Contact Connect) ---------------------------
create table if not exists public.participant_intakes (
  id                             uuid primary key default gen_random_uuid(),
  participant_id                 uuid,
  account_id                     uuid,
  first_name                     text,
  middle_name                    text,
  last_name                      text,
  preferred_name                 text,
  pronouns                       text,
  date_of_birth                  date,
  age                            integer,
  gender_identity                text,
  race                           text,
  sexual_orientation             text,
  phone                          text,
  email                          text,
  address1                       text,
  address2                       text,
  city                           text,
  county                         text,
  state                          text,
  zipcode                        text,
  country                        text,
  intake_date                    date default now(),
  referral_source                text,
  active_status                  text,
  drug_of_choice                 text,
  housing_status                 text,
  transportation_access          text,
  custody_status                 text,
  assigned_coach                 text,
  emergency_contact_name         text,
  emergency_contact_relationship text,
  emergency_contact_phone        text,
  intake_notes                   text,
  dua_consent                    text,          -- Yes / No (anonymized data-use)
  created_by                     text,
  created_date                   timestamptz default now()
);

-- ---- The Connector directory ---------------------------------------------
create table if not exists public.directory_entries (
  id            uuid primary key default gen_random_uuid(),
  entry_type    text,                            -- rss / res / rcc / well / church / member
  name          text,
  city          text,
  availability  text default 'open',             -- open (accepting) / wait (waitlist)
  blurb         text,
  tags          text[],
  beds          integer,                         -- open beds, for residences
  phone         text,
  email         text,
  url           text,
  created_by    text,
  created_date  timestamptz default now()
);

-- warm-connection requests made from the directory
create table if not exists public.connection_requests (
  id               uuid primary key default gen_random_uuid(),
  entry_id         uuid,
  entry_name       text,
  requester_name   text,
  requester_email  text,
  participant_id   uuid,
  note             text,
  status           text default 'new',           -- new / contacted / connected
  created_by       text,
  created_date     timestamptz default now()
);

-- ---- permissive prototype RLS (consistent with earlier migrations) -------
do $$
declare t text;
begin
  foreach t in array array['participant_intakes','directory_entries','connection_requests'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "vrcc_all_read" on public.%I;', t);
    execute format('drop policy if exists "vrcc_all_write" on public.%I;', t);
    execute format('create policy "vrcc_all_read"  on public.%I for select using (true);', t);
    execute format('create policy "vrcc_all_write" on public.%I for all using (true) with check (true);', t);
  end loop;
end $$;
