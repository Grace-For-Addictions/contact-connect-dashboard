-- VRCC — optional demo seed so the rooms show life immediately.
-- Safe to skip. Run after 0001. Idempotent-ish: clears its own demo rows first.
delete from public.affirmations where created_by = 'seed';
insert into public.affirmations (text, category, created_by) values
 ('You are not your worst day.', 'identity', 'seed'),
 ('Progress, not perfection.', 'process', 'seed'),
 ('Connection is the opposite of addiction.', 'community', 'seed'),
 ('Today matters. You matter.', 'hope', 'seed');

delete from public.community_resources where created_by = 'seed';
insert into public.community_resources (resource_name, categories, description, city, state, phone, created_by) values
 ('DMARC Food Pantry Network', array['food'], 'A network of pantries across greater Des Moines.', 'Des Moines', 'IA', '515-277-6969', 'seed'),
 ('Central Iowa Shelter & Services', array['housing'], 'Emergency shelter and housing support downtown.', 'Des Moines', 'IA', '515-284-5719', 'seed'),
 ('Broadlawns Medical Center', array['healthcare'], 'Public hospital with behavioral health clinics.', 'Des Moines', 'IA', '515-282-2200', 'seed');

delete from public.participants where created_by = 'seed';
with p as (
  insert into public.participants (full_name, status, days_in_recovery, coach, created_by) values
   ('Alex Rivera', 'Active', 92, 'Jordan P.', 'seed'),
   ('Sam Taylor', 'Active', 210, 'Jordan P.', 'seed'),
   ('Casey Morgan', 'Active', 34, 'Dana L.', 'seed')
  returning id, full_name
)
insert into public.check_ins (participant_id, participant_name, date, mood, score, created_by)
select id, full_name, now()::date, 'steady', 4, 'seed' from p;

delete from public.group_sessions where created_by = 'seed';
insert into public.group_sessions (title, session_type, date, duration_minutes, facilitator_name, location, attendance_count, created_by) values
 ('GFARC Peer Circle', 'peer_support', now()::date, 60, 'Jordan P.', 'Recovery Circles Room', 8, 'seed');
