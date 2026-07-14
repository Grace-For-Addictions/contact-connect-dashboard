/**
 * identity.js — VRCC identity + role-based access control (single source of truth).
 *
 * There is no hardened auth yet (Supabase Auth magic-link is the connect-point).
 * Until then a person's identity is an `accounts` row, remembered on this device
 * in localStorage. That record drives EVERY access decision in the app — the
 * hallway doors, the sensitive pages, and the admin surfaces all ask this module
 * "can this identity go here?" so the rules live in exactly one place.
 *
 * Effective access is deliberately conservative:
 *   • Coaches and organizations get PARTICIPANT-level access until a super admin
 *     approves them. An unapproved coach literally cannot open a staff door.
 *   • Navigators are always coaches; not every coach is a navigator.
 *   • Approved organizations act as admins over their own area.
 *   • Two emails are permanent super admins.
 */

export const SUPER_ADMIN_EMAILS = [
  'connect@graceforaddictions.org',
  'connect@graceforaddictions.com',
  'degarmeaux@rcoiowa.org',
];

const LS_KEY = 'vrcc_identity';

export function isSuperAdmin(email) {
  return !!email && SUPER_ADMIN_EMAILS.includes(String(email).trim().toLowerCase());
}

/* ---- effective role: what this account can actually do right now ---- */
// Ranks gate access. A room/page declares the minimum rank it needs.
export const RANK = { guest: 0, participant: 0, supporter: 0, coach: 1, navigator: 2, admin: 3, super: 5 };
export const ACCESS_MIN = { all: 0, participant: 0, staff: 1, navigator: 2, admin: 3, super: 5 };

export function effectiveRole(acct) {
  if (!acct) return 'guest';
  if (acct.is_super_admin || isSuperAdmin(acct.email)) return 'super';
  const approved = acct.approval_status === 'approved';
  switch (acct.role) {
    case 'organization': return approved ? 'admin' : 'participant';   // participant view until approved
    case 'coach':        return approved ? (acct.is_navigator ? 'navigator' : 'coach') : 'participant';
    case 'supporter':    return 'supporter';
    default:             return 'participant';
  }
}

export function rank(acct) {
  return RANK[effectiveRole(acct)] ?? 0;
}

// Can this account enter something that requires `access` (e.g. 'staff', 'admin')?
export function canEnter(access, acct) {
  return rank(acct) >= (ACCESS_MIN[access || 'all'] ?? 0);
}

// Is this account still waiting on super-admin approval for its stated role?
export function isPending(acct) {
  return !!acct && (acct.role === 'coach' || acct.role === 'organization')
    && acct.approval_status !== 'approved' && !acct.is_super_admin && !isSuperAdmin(acct.email);
}

/* ---- persistence (per-device recognition) ---- */
export function getIdentity() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch { return null; }
}

export function setIdentity(acct) {
  try {
    if (acct) localStorage.setItem(LS_KEY, JSON.stringify(acct));
    else localStorage.removeItem(LS_KEY);
  } catch { /* ignore storage errors */ }
  syncWindow(acct);
  return acct;
}

export function clearIdentity() {
  return setIdentity(null);
}

/* ---- bridge to the vanilla VRCC shell ---- */
// The shell (public/vrcc-shell.js) is plain JS and can't import this module, so
// we publish a compact snapshot on window and fire an event it listens for to
// re-lock the hallway doors the moment identity changes.
export function snapshot(acct) {
  return {
    role: effectiveRole(acct),
    rank: rank(acct),
    email: acct?.email || null,
    name: acct ? [acct.first_name, acct.last_name].filter(Boolean).join(' ') || acct.org_name || 'Guest' : null,
    baseRole: acct?.role || 'guest',
    pending: isPending(acct),
    identified: !!acct,
  };
}

export function syncWindow(acct) {
  if (typeof window === 'undefined') return;
  window.vrccIdentity = snapshot(acct);
  window.dispatchEvent(new CustomEvent('vrcc:identity', { detail: window.vrccIdentity }));
}
