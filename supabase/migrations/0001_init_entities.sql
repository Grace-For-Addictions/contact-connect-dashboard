-- =============================================================================
-- VRCC Contact Connect — initial schema
-- =============================================================================
-- Generic Base44-compatible entity model. Every entity is one table with a
-- fixed shape; entity-specific fields live in the `data` jsonb column. This
-- mirrors the adapter in src/api/base44Client.js.
--
-- SECURITY NOTE (v1 / open-access): policies below grant the `anon` role full
-- access so the dashboard works without a login page. When Supabase Auth is
-- turned on (VITE_OPEN_ACCESS=false), replace these with role-scoped policies.
-- =============================================================================

-- Reusable table factory ------------------------------------------------------
do $$
declare
  t text;
  tables text[] := array[
    'affirmation',
    'check_in',
    'coach_training',
    'community_resource',
    'goal',
    'group_session',
    'interaction',
    'milestone',
    'participant',
    'progress_review',
    'query',
    'recovery_capital',
    'referral',
    'resource_match',
    'strength_assessment',
    'survey',
    'app_user'
  ];
begin
  foreach t in array tables loop
    execute format($f$
      create table if not exists public.%1$I (
        id uuid primary key default gen_random_uuid(),
        created_date timestamptz not null default now(),
        updated_date timestamptz not null default now(),
        created_by text,
        data jsonb not null default '{}'::jsonb
      );
    $f$, t);

    -- Index the created_date for the very common '-created_date' sort.
    execute format(
      'create index if not exists %1$I on public.%2$I (created_date desc);',
      t || '_created_date_idx', t
    );

    -- GIN index over data for jsonb equality filters (participant_id, etc.).
    execute format(
      'create index if not exists %1$I on public.%2$I using gin (data);',
      t || '_data_gin_idx', t
    );

    execute format('alter table public.%1$I enable row level security;', t);

    -- Drop-and-recreate so the migration is idempotent.
    execute format('drop policy if exists %1$I on public.%2$I;', t || '_anon_all', t);
    execute format($p$
      create policy %1$I on public.%2$I
        for all to anon, authenticated
        using (true) with check (true);
    $p$, t || '_anon_all', t);
  end loop;
end $$;

-- Keep updated_date fresh on UPDATE -------------------------------------------
create or replace function public.set_updated_date()
returns trigger language plpgsql as $$
begin
  new.updated_date = now();
  return new;
end $$;

do $$
declare
  t text;
  tables text[] := array[
    'affirmation','check_in','coach_training','community_resource','goal',
    'group_session','interaction','milestone','participant','progress_review',
    'query','recovery_capital','referral','resource_match','strength_assessment',
    'survey','app_user'
  ];
begin
  foreach t in array tables loop
    execute format('drop trigger if exists %1$I on public.%2$I;', t || '_set_updated', t);
    execute format($tg$
      create trigger %1$I before update on public.%2$I
      for each row execute function public.set_updated_date();
    $tg$, t || '_set_updated', t);
  end loop;
end $$;

-- Storage bucket for file uploads and forms -----------------------------------
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

drop policy if exists "uploads_public_read" on storage.objects;
create policy "uploads_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'uploads');

drop policy if exists "uploads_anon_write" on storage.objects;
create policy "uploads_anon_write" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'uploads');

drop policy if exists "uploads_anon_update" on storage.objects;
create policy "uploads_anon_update" on storage.objects
  for update to anon, authenticated
  using (bucket_id = 'uploads');
