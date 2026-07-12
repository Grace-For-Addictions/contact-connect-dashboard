import { supabase, OPEN_ACCESS } from '@/lib/supabaseClient';

// -----------------------------------------------------------------------------
// Base44 -> Supabase compatibility adapter
// -----------------------------------------------------------------------------
// The app was written against the Base44 SDK (`base44.entities.*`, `base44.auth`,
// `base44.integrations.Core.*`). Rather than rewrite ~20 page files, this module
// re-implements that exact surface on top of Supabase.
//
// Data model: every entity maps to a Postgres table with a fixed shape
//   id uuid, created_date timestamptz, updated_date timestamptz,
//   created_by text, data jsonb
// All entity-specific fields live inside `data`, so the same generic table
// definition and adapter code works for every entity with zero per-field config.
// Reads flatten `data` back up to the top level so callers see plain records.
// -----------------------------------------------------------------------------

const RESERVED = ['id', 'created_date', 'updated_date', 'created_by'];

const GUEST_USER = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'coach@graceforaddictions.org',
  full_name: 'Grace Coach',
  role: 'admin',
};

function requireSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
    );
  }
  return supabase;
}

// PascalCase entity name -> snake_case table name. `User` is special-cased to
// avoid the reserved Postgres keyword `user`.
function toTable(name) {
  if (name === 'User') return 'app_user';
  return name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}

function rowToRecord(row) {
  if (!row) return row;
  const { data, ...meta } = row;
  return { ...(data || {}), ...meta };
}

function recordToData(obj = {}) {
  const data = { ...obj };
  RESERVED.forEach((k) => delete data[k]);
  return data;
}

function applySort(query, sort) {
  if (!sort) return query.order('created_date', { ascending: false });
  const descending = sort.startsWith('-');
  const field = descending ? sort.slice(1) : sort;
  const ascending = !descending;
  if (RESERVED.includes(field)) return query.order(field, { ascending });
  return query.order(`data->>${field}`, { ascending });
}

async function currentUserEmail() {
  try {
    const u = await auth.me();
    return u?.email || u?.full_name || null;
  } catch {
    return null;
  }
}

function makeEntity(name) {
  const table = toTable(name);

  return {
    async list(sort, limit) {
      const db = requireSupabase();
      let query = db.from(table).select('*');
      query = applySort(query, sort);
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(rowToRecord);
    },

    async filter(criteria = {}, sort, limit) {
      const db = requireSupabase();
      let query = db.from(table).select('*');
      for (const [key, value] of Object.entries(criteria)) {
        if (value === undefined) continue;
        if (RESERVED.includes(key)) query = query.eq(key, value);
        else query = query.eq(`data->>${key}`, value);
      }
      query = applySort(query, sort);
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(rowToRecord);
    },

    async get(id) {
      const db = requireSupabase();
      const { data, error } = await db.from(table).select('*').eq('id', id).single();
      if (error) throw error;
      return rowToRecord(data);
    },

    async create(values = {}) {
      const db = requireSupabase();
      const created_by = await currentUserEmail();
      const { data, error } = await db
        .from(table)
        .insert({ data: recordToData(values), created_by })
        .select()
        .single();
      if (error) throw error;
      return rowToRecord(data);
    },

    async update(id, patch = {}) {
      const db = requireSupabase();
      const { data: existing, error: readErr } = await db
        .from(table)
        .select('data')
        .eq('id', id)
        .single();
      if (readErr) throw readErr;
      const merged = { ...(existing?.data || {}), ...recordToData(patch) };
      const { data, error } = await db
        .from(table)
        .update({ data: merged, updated_date: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return rowToRecord(data);
    },

    async delete(id) {
      const db = requireSupabase();
      const { error } = await db.from(table).delete().eq('id', id);
      if (error) throw error;
      return { id };
    },
  };
}

const ENTITY_NAMES = [
  'Affirmation',
  'CheckIn',
  'CoachTraining',
  'CommunityResource',
  'Goal',
  'GroupSession',
  'Interaction',
  'Milestone',
  'Participant',
  'ProgressReview',
  'Query',
  'RecoveryCapital',
  'Referral',
  'ResourceMatch',
  'StrengthAssessment',
  'Survey',
  'User',
];

const entities = Object.fromEntries(
  ENTITY_NAMES.map((name) => [name, makeEntity(name)])
);

// -----------------------------------------------------------------------------
// Auth
// -----------------------------------------------------------------------------
const userEntity = makeEntity('User');

const auth = {
  async me() {
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        return {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email,
          role: user.user_metadata?.role || 'coach',
        };
      }
    }
    if (OPEN_ACCESS) return { ...GUEST_USER };
    const err = new Error('Not authenticated');
    err.status = 401;
    throw err;
  },

  async list() {
    try {
      const users = await userEntity.list();
      if (users && users.length) return users;
    } catch {
      // app_user table may not exist yet; fall through to guest.
    }
    return OPEN_ACCESS ? [{ ...GUEST_USER }] : [];
  },

  async logout() {
    if (supabase) await supabase.auth.signOut();
  },

  redirectToLogin() {
    if (typeof window !== 'undefined') window.location.href = '/';
  },
};

// -----------------------------------------------------------------------------
// Integrations (Core) — backed by Supabase Edge Functions / Storage.
// Only InvokeLLM and UploadFile are exercised by the app today; the rest are
// provided so imports resolve and are ready when features need them.
// -----------------------------------------------------------------------------
async function invokeFunction(name, body) {
  const db = requireSupabase();
  const { data, error } = await db.functions.invoke(name, { body });
  if (error) throw error;
  return data;
}

const Core = {
  async InvokeLLM({ prompt, response_json_schema, add_context_from_internet } = {}) {
    return invokeFunction('invoke-llm', {
      prompt,
      response_json_schema,
      add_context_from_internet,
    });
  },

  async UploadFile({ file } = {}) {
    const db = requireSupabase();
    const safeName = (file?.name || 'upload').replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${Date.now()}-${safeName}`;
    const { error } = await db.storage.from('uploads').upload(path, file);
    if (error) throw error;
    const {
      data: { publicUrl },
    } = db.storage.from('uploads').getPublicUrl(path);
    return { file_url: publicUrl };
  },

  async SendEmail(args) {
    return invokeFunction('send-email', args);
  },

  async SendSMS(args) {
    return invokeFunction('send-sms', args);
  },

  async GenerateImage(args) {
    return invokeFunction('generate-image', args);
  },

  async ExtractDataFromUploadedFile(args) {
    return invokeFunction('extract-data', args);
  },
};

// -----------------------------------------------------------------------------
// Misc Base44 surface used by the app (no-op logging).
// -----------------------------------------------------------------------------
const appLogs = {
  async logUserInApp() {
    return { ok: true };
  },
};

export const base44 = {
  entities,
  auth,
  integrations: { Core },
  appLogs,
};

export default base44;
