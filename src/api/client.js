/**
 * client.js — data + auth + integrations layer (Supabase-backed).
 *
 * This replaces the former Base44 SDK. It exposes a small `db` object whose
 * shape mirrors the old `base44` client (db.entities.X.list/filter/create/…,
 * db.auth.me/logout, db.integrations.Core.*, db.appLogs) so existing pages
 * keep working, but every call is served by Supabase.
 *
 * Config comes from Vite env (see .env.example), with built-in fallbacks so a
 * plain `npm run build` deploys anywhere with zero env config:
 *   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
 *
 * The fallback anon key below is a Supabase *publishable* key — it is designed
 * to be public and already ships in the client bundle, so committing it is
 * expected. Access is governed by Row Level Security, NOT by hiding this key:
 * the current RLS is permissive (prototype). Apply
 * supabase/migrations/0002_harden_rls.sql and a login flow before real data.
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://yqonwnzqtgmnoiymkefk.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_FFANoT7uKT8KWdumUeTsMw_ets7uvgE';

export const isConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

if (!isConfigured && typeof console !== 'undefined') {
  console.warn(
    '[client] VITE_SUPABASE_ANON_KEY is not set — data calls return empty results. ' +
      'Add it to .env.local to connect the VRCC Supabase project.'
  );
}

// A no-network stub used until the anon key is provided, so the UI renders
// its empty states instead of throwing.
const stub = {
  from() {
    const res = Promise.resolve({ data: [], error: null });
    const chain = {
      select: () => chain,
      insert: () => chain,
      update: () => chain,
      delete: () => chain,
      upsert: () => chain,
      eq: () => chain,
      match: () => chain,
      order: () => chain,
      limit: () => chain,
      single: () => Promise.resolve({ data: null, error: null }),
      then: (resolve, reject) => res.then(resolve, reject),
    };
    return chain;
  },
  auth: {
    async getUser() {
      return { data: { user: null }, error: null };
    },
    async signInWithPassword() {
      return { data: { user: null }, error: new Error('Auth not configured') };
    },
    async signOut() {
      return { error: null };
    },
    onAuthStateChange() {
      return { data: { subscription: { unsubscribe() {} } } };
    },
  },
};

export const supabase = isConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : stub;

/* ---- entity name → table name (snake_case, pluralized) ---- */
const TABLE = {
  Participant: 'participants',
  CheckIn: 'check_ins',
  Milestone: 'milestones',
  Interaction: 'interactions',
  RecoveryCapital: 'recovery_capital',
  ProgressReview: 'progress_reviews',
  StrengthAssessment: 'strength_assessments',
  Goal: 'goals',
  GroupSession: 'group_sessions',
  Affirmation: 'affirmations',
  CommunityResource: 'community_resources',
  Referral: 'referrals',
  ResourceMatch: 'resource_matches',
  Survey: 'surveys',
  CoachTraining: 'coach_trainings',
  User: 'users',
  RecoveryResidence: 'recovery_residences',
  RrHouse: 'rr_houses',
  RrResident: 'rr_residents',
  RrIntakeDocument: 'rr_intake_documents',
  DrugScreen: 'drug_screens',
  Incident: 'incidents',
  HouseMeeting: 'house_meetings',
  Barc10Assessment: 'barc10_assessments',
  HonorPost: 'honor_posts',
  NarcanLog: 'narcan_logs',
  CommunityEvent: 'community_events',
  EventRsvp: 'event_rsvps',
  RoomMessage: 'room_messages',
  Account: 'accounts',
  ParticipantIntake: 'participant_intakes',
  DirectoryEntry: 'directory_entries',
  ConnectionRequest: 'connection_requests',
  MvpMessage: 'mvp_messages',
  MvpSessionRequest: 'mvp_session_requests',
  MvpSession: 'mvp_sessions',
};

// Base44 sort strings: 'field' (asc) or '-field' (desc).
function parseSort(sort) {
  if (!sort || typeof sort !== 'string') return null;
  const desc = sort.startsWith('-');
  return { col: desc ? sort.slice(1) : sort, ascending: !desc };
}

async function run(builder, table) {
  try {
    const { data, error } = await builder;
    if (error) throw error;
    return data ?? [];
  } catch (e) {
    console.warn(`[client] ${table}: ${e.message || e}`);
    return [];
  }
}

function makeEntity(name) {
  const table = TABLE[name] || name.replace(/([A-Z])/g, '_$1').replace(/^_/, '').toLowerCase() + 's';
  const from = () => supabase.from(table);

  return {
    table,
    async list(sort) {
      let q = from().select('*');
      const s = parseSort(sort);
      if (s) q = q.order(s.col, { ascending: s.ascending });
      return run(q, table);
    },
    async filter(criteria = {}, sort) {
      let q = from().select('*').match(criteria);
      const s = parseSort(sort);
      if (s) q = q.order(s.col, { ascending: s.ascending });
      return run(q, table);
    },
    async get(id) {
      const rows = await run(from().select('*').eq('id', id).limit(1), table);
      return rows[0] ?? null;
    },
    async create(data) {
      const rows = await run(from().insert(data).select(), table);
      return rows[0] ?? null;
    },
    async bulkCreate(rows) {
      return run(from().insert(rows).select(), table);
    },
    async update(id, data) {
      const rows = await run(from().update(data).eq('id', id).select(), table);
      return rows[0] ?? null;
    },
    async delete(id) {
      await run(from().delete().eq('id', id), table);
      return { success: true };
    },
  };
}

// Lazily build (and cache) an entity accessor for any name touched by the app.
const entityCache = {};
export const entities = new Proxy(
  {},
  {
    get(_, name) {
      const key = String(name);
      if (key === 'Query') return {}; // legacy Base44 handle — unused
      if (!entityCache[key]) entityCache[key] = makeEntity(key);
      return entityCache[key];
    },
  }
);

/* ---- auth (Supabase) ---- */
export const auth = {
  async me() {
    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) {
      const err = new Error('Not authenticated');
      err.status = 401;
      throw err;
    }
    return {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email,
      role: user.user_metadata?.role || 'staff',
      ...user.user_metadata,
    };
  },
  async login(email, password) {
    return supabase.auth.signInWithPassword({ email, password });
  },
  async logout() {
    await supabase.auth.signOut();
  },
  redirectToLogin() {
    // No hosted login page in this build; peers/coaches sign in from the
    // Staff room in the full build. Kept for API compatibility.
  },
};

/* ---- integrations: graceful stubs for former Base44 Core functions.
   Wire these to Supabase Edge Functions when the AI/comms backend lands. ---- */
async function notWired(label) {
  console.info(`[client] ${label} is not wired to a backend yet.`);
  return { ok: false, pending: true, message: `${label} is not available in this build.` };
}
export const Core = {
  InvokeLLM: () => notWired('InvokeLLM'),
  SendEmail: () => notWired('SendEmail'),
  SendSMS: () => notWired('SendSMS'),
  UploadFile: () => notWired('UploadFile'),
  GenerateImage: () => notWired('GenerateImage'),
  ExtractDataFromUploadedFile: () => notWired('ExtractDataFromUploadedFile'),
};

/* ---- appLogs: no-op (formerly Base44 in-app logging) ---- */
export const appLogs = {
  async logUserInApp() {
    /* intentionally empty */
  },
};

export const db = {
  entities,
  auth,
  integrations: { Core },
  appLogs,
};

export default db;
