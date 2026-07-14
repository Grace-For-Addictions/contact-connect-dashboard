import React from 'react';
import { db } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Check, X, Building2, HeartHandshake, Clock } from 'lucide-react';
import RoleGate from '@/components/RoleGate';
import { SUPER_ADMIN_EMAILS } from '@/lib/identity';

/**
 * AccountApprovals — the super admin / org admin surface for approving pending
 * coach, navigator, and organization accounts. Approving flips approval_status
 * to 'approved', which immediately lifts that account's access from participant
 * to its real role (staff areas unlock on their next identity sync).
 */
export default function AccountApprovals() {
  return <RoleGate access="admin" area="Account approvals"><Inner /></RoleGate>;
}

function Inner() {
  const qc = useQueryClient();
  const { data: accounts = [] } = useQuery({ queryKey: ['accounts'], queryFn: () => db.entities.Account.list('-created_date') });

  const decide = useMutation({
    mutationFn: ({ id, status }) => db.entities.Account.update(id, { approval_status: status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  });

  const pending = accounts.filter((a) => a.approval_status === 'pending' && (a.role === 'coach' || a.role === 'organization'));
  const approved = accounts.filter((a) => a.approval_status === 'approved' && (a.role === 'coach' || a.role === 'organization'));

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-teal-700 font-semibold text-xs tracking-widest uppercase"><ShieldCheck className="w-4 h-4" /> Super Admin</div>
        <h1 className="text-3xl font-bold text-slate-800 mt-1">Account Approvals</h1>
        <p className="text-slate-500 mt-1">Approve coach, navigator, and organization access. Until approved, these accounts use the VRCC as participants.</p>
      </div>

      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2"><Clock className="w-4 h-4" /> Pending ({pending.length})</h2>
      {pending.length === 0 ? (
        <Card className="border-dashed mb-8"><CardContent className="py-10 text-center text-slate-500">No accounts waiting on approval.</CardContent></Card>
      ) : (
        <div className="flex flex-col gap-2 mb-8">
          {pending.map((a) => (
            <Card key={a.id}><CardContent className="p-4 flex flex-wrap items-center gap-3">
              <RoleIcon a={a} />
              <div className="flex-1 min-w-[180px]">
                <div className="font-semibold text-slate-800">{label(a)}</div>
                <div className="text-xs text-slate-500">{a.email} · requested {a.role}{a.is_navigator ? ' + navigator' : ''}{a.org_types?.length ? ` · ${a.org_types.join(', ')}` : ''}</div>
              </div>
              <Button size="sm" variant="outline" className="text-rose-600 border-rose-200" onClick={() => decide.mutate({ id: a.id, status: 'declined' })}><X className="w-4 h-4 mr-1" /> Decline</Button>
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={() => decide.mutate({ id: a.id, status: 'approved' })}><Check className="w-4 h-4 mr-1" /> Approve</Button>
            </CardContent></Card>
          ))}
        </div>
      )}

      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Approved ({approved.length})</h2>
      {approved.length === 0 ? (
        <p className="text-sm text-slate-400">None yet.</p>
      ) : (
        <div className="rounded-xl border border-slate-100 divide-y divide-slate-100 bg-white">
          {approved.map((a) => (
            <div key={a.id} className="px-4 py-3 flex items-center gap-3 text-sm">
              <RoleIcon a={a} sm />
              <b className="text-slate-800">{label(a)}</b>
              <span className="text-slate-500 flex-1">{a.email}</span>
              <Badge className="bg-teal-100 text-teal-700">{a.is_navigator ? 'Navigator' : a.role}</Badge>
              <Button size="sm" variant="ghost" className="text-slate-400" onClick={() => decide.mutate({ id: a.id, status: 'pending' })}>Revoke</Button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-400 mt-8">Permanent super admins: {SUPER_ADMIN_EMAILS.join(' · ')}</p>
    </div>
  );
}

const label = (a) => a.role === 'organization' ? (a.org_name || 'Organization') : [a.first_name, a.last_name].filter(Boolean).join(' ') || a.email;
const RoleIcon = ({ a, sm }) => (
  <div className={`${sm ? 'w-8 h-8' : 'w-10 h-10'} rounded-xl flex items-center justify-center flex-shrink-0`}
    style={{ background: a.role === 'organization' ? '#c8972a22' : '#7c3aed22', color: a.role === 'organization' ? '#c8972a' : '#7c3aed' }}>
    {a.role === 'organization' ? <Building2 className="w-5 h-5" /> : <HeartHandshake className="w-5 h-5" />}
  </div>
);
