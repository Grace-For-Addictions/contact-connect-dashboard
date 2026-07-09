-- VRCC — RLS hardening. Apply this ONLY after a real auth flow is live
-- (Supabase login wired in AuthContext). It replaces the permissive
-- prototype policies with authenticated-scoped ones:
--   • anyone (anon) may still READ the two public catalogs
--     (affirmations, community_resources) — they're public content;
--   • everything else requires an authenticated session (peer/coach).
-- Writes everywhere require authentication.
--
-- NOTE: while the app still uses only the anon key with no login, applying
-- this will make participant data read as empty. Wire login first.

do $$
declare t text;
begin
  -- participant/clinical data: authenticated only
  foreach t in array array[
    'participants','interactions','check_ins','goals','milestones','recovery_capital',
    'resource_matches','group_sessions','coach_trainings','referrals',
    'strength_assessments','progress_reviews','surveys'
  ] loop
    execute format('drop policy if exists "vrcc_all_read"  on public.%I;', t);
    execute format('drop policy if exists "vrcc_all_write" on public.%I;', t);
    execute format($p$create policy "auth_read"  on public.%I for select to authenticated using (true);$p$, t);
    execute format($p$create policy "auth_write" on public.%I for all to authenticated using (true) with check (true);$p$, t);
  end loop;

  -- public catalogs: anon read, authenticated write
  foreach t in array array['affirmations','community_resources'] loop
    execute format('drop policy if exists "vrcc_all_read"  on public.%I;', t);
    execute format('drop policy if exists "vrcc_all_write" on public.%I;', t);
    execute format($p$create policy "public_read" on public.%I for select using (true);$p$, t);
    execute format($p$create policy "auth_write"  on public.%I for all to authenticated using (true) with check (true);$p$, t);
  end loop;
end $$;
