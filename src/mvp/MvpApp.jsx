import React, { useState } from 'react';
import { db } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getIdentity, setIdentity, clearIdentity, isSuperAdmin, isPending, canEnter } from '@/lib/identity';
import { UserRound, HeartHandshake, LogIn, LogOut, Clock, Sparkles } from 'lucide-react';
import ParticipantHome from '@/mvp/ParticipantHome';
import CoachDashboard from '@/mvp/CoachDashboard';

/**
 * MvpApp — the working coach↔participant app.
 * Sign in (by email) or sign up (participant or coach), then route:
 *  • participant → ParticipantHome (intake + BARC-10 required, then coach,
 *    messaging, session requests, upcoming sessions)
 *  • approved coach → CoachDashboard (unassigned participants, claim, messaging,
 *    schedule sessions, upcoming sessions)
 *  • coach pending approval → holding screen (participant-level meanwhile)
 */
export default function MvpApp() {
  const [acct, setAcct] = useState(() => getIdentity());
  const adopt = (a) => { setIdentity(a); setAcct(a); };
  const signOut = () => { clearIdentity(); setAcct(null); };

  if (!acct) return <Auth onDone={adopt} />;
  if (acct.role === 'coach' && isPending(acct)) return <Pending acct={acct} onSignOut={signOut} />;

  const isCoach = canEnter('staff', acct);
  return (
    <Shell acct={acct} onSignOut={signOut} role={isCoach ? 'Coach' : 'Participant'}>
      {isCoach
        ? <CoachDashboard me={{ role: 'coach', email: acct.email, name: name(acct) }} />
        : <ParticipantHome acct={acct} />}
    </Shell>
  );
}

const name = (a) => [a.first_name, a.last_name].filter(Boolean).join(' ').trim() || a.email;

function Shell({ acct, role, onSignOut, children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 text-white flex items-center justify-center font-bold">G</div>
            <div>
              <div className="font-bold text-slate-800 leading-tight text-sm">Grace For Addictions</div>
              <div className="text-[11px] text-slate-500">{role} · {name(acct)}</div>
            </div>
          </div>
          <Button variant="ghost" className="text-slate-500" onClick={onSignOut}><LogOut className="w-4 h-4 mr-1" /> Sign out</Button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

function Pending({ acct, onSignOut }) {
  return (
    <Shell acct={acct} role="Coach" onSignOut={onSignOut}>
      <div className="max-w-md mx-auto mt-16 rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4"><Clock className="w-7 h-7" /></div>
        <h2 className="text-xl font-bold text-slate-800">Coach access pending</h2>
        <p className="text-slate-600 mt-2 text-sm">Thanks, {acct.first_name}. A GFA admin will approve your coach account shortly. You'll be able to see and claim participants once approved.</p>
      </div>
    </Shell>
  );
}

async function ensureParticipant(email, fullName) {
  let p = email ? (await db.entities.Participant.filter({ email }))?.[0] : null;
  if (!p) p = await db.entities.Participant.create({ full_name: fullName, email, status: 'Active', created_by: 'mvp' });
  return p;
}

function Auth({ onDone }) {
  const [mode, setMode] = useState('signin'); // signin | signup
  const [role, setRole] = useState('participant');
  const [f, setF] = useState({ first_name: '', last_name: '', email: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  async function signIn() {
    setErr(''); setBusy(true);
    try {
      const email = f.email.trim().toLowerCase();
      const acct = (await db.entities.Account.filter({ email }))?.[0];
      if (acct) return onDone(acct);
      setBusy(false); setErr("We couldn't find an account for that email. Create one below.");
      setMode('signup');
    } catch { setBusy(false); setErr('Something went wrong. Please try again.'); }
  }

  async function signUp() {
    setErr(''); setBusy(true);
    try {
      const email = f.email.trim().toLowerCase();
      const existing = (await db.entities.Account.filter({ email }))?.[0];
      if (existing) return onDone(existing);
      const fullName = [f.first_name, f.last_name].filter(Boolean).join(' ').trim();
      const superA = isSuperAdmin(email);
      let participant_id = null;
      if (role === 'participant') { const p = await ensureParticipant(email, fullName || 'Participant'); participant_id = p?.id || null; }
      const acct = (await db.entities.Account.create({
        email, first_name: f.first_name, last_name: f.last_name, role,
        participant_id, is_super_admin: superA,
        approval_status: role === 'coach' && !superA ? 'pending' : 'approved',
        created_by: 'mvp',
      })) || { email, first_name: f.first_name, last_name: f.last_name, role, participant_id, is_super_admin: superA, approval_status: role === 'coach' && !superA ? 'pending' : 'approved' };
      onDone(acct);
    } catch { setBusy(false); setErr('Something went wrong creating your account.'); }
  }

  const valid = mode === 'signin' ? f.email.trim() : (f.first_name.trim() && f.last_name.trim() && f.email.trim());

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-700 text-white flex items-center justify-center font-bold text-lg">G</div>
          <div>
            <div className="font-bold text-slate-800 leading-tight">Grace For Addictions</div>
            <div className="text-xs text-slate-500">No Shame. No Stigma. Just Grace.</div>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mt-5">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="text-sm text-slate-500 mt-1">{mode === 'signin' ? 'Sign in to continue.' : 'Join as a participant or a coach.'}</p>

        {mode === 'signup' && (
          <div className="grid grid-cols-2 gap-2 mt-5">
            {[{ k: 'participant', icon: UserRound, t: 'Participant', d: "I'm here for support" }, { k: 'coach', icon: HeartHandshake, t: 'Coach', d: 'I support others' }].map((r) => {
              const Icon = r.icon; const on = role === r.k;
              return (
                <button key={r.k} onClick={() => setRole(r.k)} className={`rounded-xl border p-3 text-left transition ${on ? 'border-teal-500 bg-teal-50' : 'border-slate-200'}`}>
                  <Icon className={`w-5 h-5 mb-1 ${on ? 'text-teal-600' : 'text-slate-400'}`} />
                  <div className="font-semibold text-slate-800 text-sm">{r.t}</div>
                  <div className="text-[11px] text-slate-500">{r.d}</div>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-4 space-y-3">
          {mode === 'signup' && (
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs text-slate-500">First name</Label><Input className="mt-1" value={f.first_name} onChange={(e) => set('first_name', e.target.value)} /></div>
              <div><Label className="text-xs text-slate-500">Last name</Label><Input className="mt-1" value={f.last_name} onChange={(e) => set('last_name', e.target.value)} /></div>
            </div>
          )}
          <div><Label className="text-xs text-slate-500">Email</Label>
            <Input className="mt-1" type="email" value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com"
              onKeyDown={(e) => { if (e.key === 'Enter' && valid) (mode === 'signin' ? signIn() : signUp()); }} /></div>
        </div>

        {err && <div className="text-xs text-rose-600 mt-2">{err}</div>}

        <Button className="w-full mt-5 h-11 bg-teal-600 hover:bg-teal-700" disabled={!valid || busy} onClick={mode === 'signin' ? signIn : signUp}>
          {busy ? 'One sec…' : mode === 'signin' ? <><LogIn className="w-4 h-4 mr-1" /> Sign in</> : <><Sparkles className="w-4 h-4 mr-1" /> Create account</>}
        </Button>
        <button className="w-full text-center text-sm text-slate-500 hover:text-slate-700 mt-4" onClick={() => { setErr(''); setMode(mode === 'signin' ? 'signup' : 'signin'); }}>
          {mode === 'signin' ? "New here? Create an account →" : 'Already have an account? Sign in →'}
        </button>
      </div>
    </div>
  );
}
