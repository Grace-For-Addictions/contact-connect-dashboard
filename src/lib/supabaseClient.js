import { createClient } from '@supabase/supabase-js';

// Supabase connection details are injected at build time via Vite env vars.
// See .env.example. When they are absent (e.g. a preview build before the
// backend is provisioned) `supabase` is null and the adapter surfaces a clear
// "not configured" error instead of crashing the whole app on load.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// When true, an unauthenticated visitor is treated as a built-in coach account
// so the dashboard is usable without a login page. Flip to false once real
// Supabase Auth + a login screen are wired up.
export const OPEN_ACCESS =
  String(import.meta.env.VITE_OPEN_ACCESS ?? 'true').toLowerCase() !== 'false';
