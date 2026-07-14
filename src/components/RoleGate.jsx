import React from 'react';
import { getIdentity, canEnter, effectiveRole } from '@/lib/identity';
import { Lock } from 'lucide-react';

/**
 * RoleGate — page-level access enforcement (defense in depth).
 *
 * The hallway already refuses to open a door the current identity can't enter,
 * but sensitive pages guard themselves too so a role can never be reached by a
 * direct link or a stale cache. If the current identity lacks the required
 * `access` level, the page content is replaced with a friendly notice instead
 * of the real data.
 */
export default function RoleGate({ access = 'staff', children, area = 'This area' }) {
  const acct = getIdentity();
  if (canEnter(access, acct)) return children;

  const role = effectiveRole(acct);
  const msg = access === 'admin'
    ? `${area} is for approved organization admins and GFA super admins.`
    : `${area} is for approved coaches and navigators.`;
  const pendingHint = acct && (acct.role === 'coach' || acct.role === 'organization')
    ? " Your account is pending approval — it'll unlock automatically once a super admin approves you."
    : '';

  return (
    <div className="p-8 max-w-lg mx-auto">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4"><Lock className="w-7 h-7" /></div>
        <h2 className="text-xl font-bold text-slate-800">Staff area</h2>
        <p className="text-slate-500 mt-2">{msg}{pendingHint}</p>
        <p className="text-xs text-slate-400 mt-4">You're signed in as <b>{role}</b>. Everything else in the VRCC is open to you.</p>
      </div>
    </div>
  );
}
