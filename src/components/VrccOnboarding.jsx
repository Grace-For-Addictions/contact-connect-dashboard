import React, { useEffect, useState } from 'react';
import { db } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isSuperAdmin, setIdentity, getIdentity, isPending } from '@/lib/identity';
import { UserRound, HeartHandshake, Building2, Users, ArrowLeft, CheckCircle2, Clock, Sparkles, ShieldCheck } from 'lucide-react';

/**
 * VrccOnboarding — the "who are you here as?" gate.
 *
 * Appears once, just after the visitor walks through the front door, unless this
 * device is already recognized (localStorage identity). Everyone picks a reason
 * for being here; the form collected depends on the reason. Coaches and orgs are
 * created as pending and see the app as participants until a super admin
 * approves them. A participant who is also a resident has their details carried
 * straight into the recovery-residence portal.
 */
const ROLES = [
  { key: 'participant', icon: UserRound, color: '#0f766e', title: 'Participant', blurb: "I'm here for my own recovery, support, and community." },
  { key: 'coach', icon: HeartHandshake, color: '#7c3aed', title: 'Peer Coach', blurb: "I support others as a peer coach or navigator." },
  { key: 'organization', icon: Building2, color: '#c8972a', title: 'Organization', blurb: "We're a recovery residence, RCC, church, or provider." },
  { key: 'supporter', icon: Users, color: '#2563eb', title: 'Recovery Supporter', blurb: "I'm family, a loved one, a sponsor, or a mentor." },
];
const ORG_TYPES = [
  ['recovery_residence', 'Sober living / Recovery residence'],
  ['rcc', 'Recovery Community Center'],
  ['church', 'Church / Faith-based'],
  ['treatment', 'Treatment provider'],
  ['other', 'Other'],
];

export default function VrccOnboarding() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState('role');
  const [busy, setBusy] = useState(false);
  const [acct, setAcct] = useState(null);
  const [f, setF] = useState(blank());

  const { data: houses = [] } = useQuery({
    queryKey: ['onb_houses'], queryFn: () => db.entities.RrHouse.list('created_date'), enabled: open,
  });

  useEffect(() => {
    const onEntered = () => { if (!getIdentity()) { reset(); setOpen(true); } };
    const onOpen = () => { reset(); setOpen(true); };
    window.addEventListener('vrcc:entered-building', onEntered);
    window.addEventListener('vrcc:open-onboarding', onOpen);
    window.vrccOpenOnboarding = onOpen;
    return () => {
      window.removeEventListener('vrcc:entered-building', onEntered);
      window.removeEventListener('vrcc:open-onboarding', onOpen);
    };
  }, []);

  function reset() { setStep('role'); setF(blank()); setAcct(null); setBusy(false); }
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  async function ensureParticipant(email, name) {
    let p = null;
    if (email) { const q = await db.entities.Participant.filter({ email }); p = q?.[0] || null; }
    if (!p) p = await db.entities.Participant.create({ full_name: name, email, status: 'Active', created_by: 'onboarding' });
    return p;
  }

  async function submit(role) {
    setBusy(true);
    try {
      const email = (f.email || '').trim().toLowerCase();
      // Recognized returning user? Adopt the existing account, skip creation.
      if (email) {
        const existing = (await db.entities.Account.filter({ email }))?.[0];
        if (existing) return finalize(existing);
      }
      const superA = isSuperAdmin(email);
      const name = [f.first_name, f.last_name].filter(Boolean).join(' ').trim();
      const base = { email, created_by: 'onboarding' };
      let created;

      if (role === 'participant') {
        const p = await ensureParticipant(email, name || 'Participant');
        created = await db.entities.Account.create({
          ...base, first_name: f.first_name, last_name: f.last_name, dob: f.dob || null,
          role: 'participant', is_resident: !!f.resident, residence_id: f.resident ? f.house_id || null : null,
          participant_id: p.id, approval_status: 'approved',
        });
        if (f.resident && f.house_id) {
          const house = houses.find((h) => h.id === f.house_id);
          await db.entities.RrResident.create({
            house_id: f.house_id, residence_id: house?.residence_id || null,
            participant_id: p.id, participant_name: name, status: 'applicant',
            intake_complete: false, created_by: 'self-onboard',
          });
        }
      } else if (role === 'coach') {
        const p = await ensureParticipant(email, name || 'Coach');
        created = await db.entities.Account.create({
          ...base, first_name: f.first_name, last_name: f.last_name, dob: f.dob || null,
          role: 'coach', is_navigator: !!f.navigator, participant_id: p.id,
          approval_status: superA ? 'approved' : 'pending', is_super_admin: superA,
        });
      } else if (role === 'organization') {
        created = await db.entities.Account.create({
          ...base, org_name: f.org_name, first_name: f.first_name, last_name: f.last_name,
          org_types: f.org_types, role: 'organization',
          approval_status: superA ? 'approved' : 'pending', is_super_admin: superA,
        });
      } else { // supporter
        created = await db.entities.Account.create({
          ...base, first_name: f.first_name, last_name: f.last_name, role: 'supporter',
          relationship: f.relationship, invited_by: (f.supporting || '').trim().toLowerCase() || null,
          approval_status: 'approved',
        });
      }
      finalize(created);
    } catch (e) {
      window.vrccToast?.('Something went wrong saving your info. Please try again.');
      setBusy(false);
    }
  }

  function finalize(a) {
    setAcct(a);
    setIdentity(a); // persists + syncs window + fires vrcc:identity so doors re-lock
    setBusy(false);
    setStep(isPending(a) ? 'pending' : 'welcome');
    window.vrccToast?.(`Welcome${a.first_name ? ', ' + a.first_name : ''}. You're in.`);
  }

  function done() { setOpen(false); }
  function skip() { setIdentity(null); setOpen(false); } // explore as a guest (public rooms only)

  if (!open) return null;

  return (
    <div style={overlay}>
      <div style={sheet}>
        {step !== 'role' && step !== 'welcome' && step !== 'pending' && (
          <button onClick={() => setStep('role')} style={backBtn}><ArrowLeft className="w-4 h-4" /> Back</button>
        )}

        {step === 'role' && (
          <>
            <Header eyebrow="Welcome to the VRCC" title="Who are you here as?" sub="Pick what fits best. You can always change this later — there's no wrong answer." />
            <div className="grid sm:grid-cols-2 gap-3 mt-5">
              {ROLES.map((r) => {
                const Icon = r.icon;
                return (
                  <button key={r.key} onClick={() => setStep(r.key)}
                    className="text-left rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition p-4 bg-white">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ background: r.color + '22', color: r.color }}><Icon className="w-5 h-5" /></div>
                    <div className="font-semibold text-slate-800">{r.title}</div>
                    <div className="text-sm text-slate-500 mt-0.5">{r.blurb}</div>
                  </button>
                );
              })}
            </div>
            <button onClick={skip} className="mt-5 text-sm text-slate-400 hover:text-slate-600 mx-auto block">I'm just exploring for now →</button>
          </>
        )}

        {step === 'participant' && (
          <RoleForm title="Create your participant account" color="#0f766e" busy={busy}
            onSubmit={() => submit('participant')} valid={f.first_name && f.last_name && f.email}>
            <NameDobEmail f={f} set={set} />
            <Toggle checked={!!f.resident} onChange={(v) => set('resident', v)}
              label="I'm also a resident at a recovery residence"
              desc="Turn this on and your details carry straight into the residence portal — no re-typing." />
            {f.resident && (
              <div className="mt-1">
                <Label className="text-xs text-slate-500">Which residence?</Label>
                <select className="w-full mt-1 rounded-md border border-slate-200 p-2 text-sm" value={f.house_id} onChange={(e) => set('house_id', e.target.value)}>
                  <option value="">Select a residence…</option>
                  {houses.map((h) => <option key={h.id} value={h.id}>{h.name}{h.house_type ? ` · ${h.house_type}` : ''}</option>)}
                </select>
                <p className="text-xs text-slate-400 mt-1">Staff will confirm your bed and start your intake packet.</p>
              </div>
            )}
          </RoleForm>
        )}

        {step === 'coach' && (
          <RoleForm title="Create your peer coach account" color="#7c3aed" busy={busy}
            onSubmit={() => submit('coach')} valid={f.first_name && f.last_name && f.email}>
            <NameDobEmail f={f} set={set} />
            <Toggle checked={!!f.navigator} onChange={(v) => set('navigator', v)}
              label="I'm also a Navigator"
              desc="Navigators are coaches with added navigation access. Every navigator is a coach; not every coach is a navigator." />
            <PendingNote email={f.email} />
          </RoleForm>
        )}

        {step === 'organization' && (
          <RoleForm title="Create your organization account" color="#c8972a" busy={busy}
            onSubmit={() => submit('organization')} valid={f.org_name && f.email && (f.org_types || []).length}>
            <div><Label className="text-xs text-slate-500">Organization name *</Label>
              <Input className="mt-1" value={f.org_name} onChange={(e) => set('org_name', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs text-slate-500">Contact first name</Label><Input className="mt-1" value={f.first_name} onChange={(e) => set('first_name', e.target.value)} /></div>
              <div><Label className="text-xs text-slate-500">Contact last name</Label><Input className="mt-1" value={f.last_name} onChange={(e) => set('last_name', e.target.value)} /></div>
            </div>
            <div><Label className="text-xs text-slate-500">Contact email *</Label><Input className="mt-1" type="email" value={f.email} onChange={(e) => set('email', e.target.value)} /></div>
            <div>
              <Label className="text-xs text-slate-500">What kind of organization? (choose all that apply) *</Label>
              <div className="flex flex-col gap-1.5 mt-1.5">
                {ORG_TYPES.map(([k, label]) => {
                  const on = (f.org_types || []).includes(k);
                  return (
                    <button key={k} type="button" onClick={() => set('org_types', on ? f.org_types.filter((x) => x !== k) : [...(f.org_types || []), k])}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-left transition ${on ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-slate-200 text-slate-600'}`}>
                      <span className={`w-4 h-4 rounded border flex items-center justify-center ${on ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-300'}`}>{on && '✓'}</span>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <PendingNote email={f.email} org />
          </RoleForm>
        )}

        {step === 'supporter' && (
          <RoleForm title="Create your supporter account" color="#2563eb" busy={busy}
            onSubmit={() => submit('supporter')} valid={f.first_name && f.last_name && f.email}>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs text-slate-500">First name *</Label><Input className="mt-1" value={f.first_name} onChange={(e) => set('first_name', e.target.value)} /></div>
              <div><Label className="text-xs text-slate-500">Last name *</Label><Input className="mt-1" value={f.last_name} onChange={(e) => set('last_name', e.target.value)} /></div>
            </div>
            <div><Label className="text-xs text-slate-500">Email *</Label><Input className="mt-1" type="email" value={f.email} onChange={(e) => set('email', e.target.value)} /></div>
            <div><Label className="text-xs text-slate-500">Your relationship</Label>
              <select className="w-full mt-1 rounded-md border border-slate-200 p-2 text-sm" value={f.relationship} onChange={(e) => set('relationship', e.target.value)}>
                <option value="">Select…</option>
                <option>Family member</option><option>Loved one / friend</option><option>Sponsor</option><option>Mentor</option>
              </select></div>
            <div><Label className="text-xs text-slate-500">Who are you supporting? (their email, optional)</Label>
              <Input className="mt-1" type="email" value={f.supporting} onChange={(e) => set('supporting', e.target.value)} placeholder="Links you to your person's circle" /></div>
          </RoleForm>
        )}

        {step === 'welcome' && (
          <Confirm icon={CheckCircle2} color="#0f766e" title={`You're all set${acct?.first_name ? ', ' + acct.first_name : ''}.`}
            body="Your account is ready and this device will remember you. The whole building is open — come on in." cta="Enter the VRCC" onDone={done} />
        )}

        {step === 'pending' && (
          <Confirm icon={Clock} color="#c8972a" title="Account created — pending approval"
            body={`Thanks${acct?.first_name ? ', ' + acct.first_name : ''}. For now you'll explore the VRCC as a participant. A GFA super admin will review and approve your ${acct?.role === 'organization' ? 'organization' : 'coach/navigator'} access, and the staff areas will unlock automatically once approved.`}
            cta="Continue as participant" onDone={done} />
        )}
      </div>
    </div>
  );
}

function blank() {
  return { first_name: '', last_name: '', dob: '', email: '', resident: false, house_id: '', navigator: false, org_name: '', org_types: [], relationship: '', supporting: '' };
}

const Header = ({ eyebrow, title, sub }) => (
  <div>
    <div className="flex items-center gap-2 text-teal-600 font-semibold text-xs tracking-widest uppercase"><Sparkles className="w-4 h-4" /> {eyebrow}</div>
    <h2 className="text-2xl font-bold text-slate-800 mt-1">{title}</h2>
    {sub && <p className="text-slate-500 mt-1 text-sm">{sub}</p>}
  </div>
);

const NameDobEmail = ({ f, set }) => (
  <>
    <div className="grid grid-cols-2 gap-3">
      <div><Label className="text-xs text-slate-500">First name *</Label><Input className="mt-1" value={f.first_name} onChange={(e) => set('first_name', e.target.value)} /></div>
      <div><Label className="text-xs text-slate-500">Last name *</Label><Input className="mt-1" value={f.last_name} onChange={(e) => set('last_name', e.target.value)} /></div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div><Label className="text-xs text-slate-500">Date of birth</Label><Input className="mt-1" type="date" value={f.dob} onChange={(e) => set('dob', e.target.value)} /></div>
      <div><Label className="text-xs text-slate-500">Email *</Label><Input className="mt-1" type="email" value={f.email} onChange={(e) => set('email', e.target.value)} /></div>
    </div>
  </>
);

function RoleForm({ title, color, children, onSubmit, valid, busy }) {
  return (
    <>
      <Header eyebrow="Almost there" title={title} />
      <div className="flex flex-col gap-3 mt-4">{children}</div>
      <Button className="w-full mt-5 h-11" style={{ background: color }} disabled={!valid || busy} onClick={onSubmit}>
        {busy ? 'Saving…' : 'Create my account'}
      </Button>
      <p className="text-xs text-slate-400 mt-2 text-center">By continuing you agree to be treated with dignity and to keep this a safe, person-first space.</p>
    </>
  );
}

function Toggle({ checked, onChange, label, desc }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`w-full flex items-start gap-3 rounded-xl border p-3 text-left transition ${checked ? 'border-teal-400 bg-teal-50' : 'border-slate-200'}`}>
      <span className={`mt-0.5 w-11 h-6 rounded-full p-0.5 flex-shrink-0 transition ${checked ? 'bg-teal-600' : 'bg-slate-300'}`}>
        <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </span>
      <span><span className="font-medium text-slate-700 text-sm">{label}</span><span className="block text-xs text-slate-500 mt-0.5">{desc}</span></span>
    </button>
  );
}

function PendingNote({ email, org }) {
  const superA = isSuperAdmin((email || '').trim().toLowerCase());
  if (superA) return (
    <div className="flex items-start gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">
      <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" /> This email is a GFA super admin — you'll be approved instantly with full access.
    </div>
  );
  return (
    <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
      <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" /> You'll use the VRCC as a participant until a GFA super admin approves your {org ? 'organization' : 'coach/navigator'} access. Staff areas unlock automatically after approval.
    </div>
  );
}

function Confirm({ icon: Icon, color, title, body, cta, onDone }) {
  return (
    <div className="flex flex-col items-center text-center py-6">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: color + '22', color }}><Icon className="w-9 h-9" /></div>
      <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
      <p className="text-slate-500 mt-2 max-w-sm">{body}</p>
      <Button className="mt-6 h-11 px-8" style={{ background: color }} onClick={onDone}>{cta}</Button>
    </div>
  );
}

const overlay = { position: 'fixed', inset: 0, zIndex: 100001, background: 'rgba(6,5,18,.72)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' };
const sheet = { background: '#fff', borderRadius: 22, boxShadow: '0 30px 80px rgba(0,0,0,.4)', width: 'min(520px,100%)', maxHeight: '92vh', overflowY: 'auto', padding: '28px 26px', position: 'relative', fontFamily: 'system-ui,sans-serif' };
const backBtn = { display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer', marginBottom: 8, padding: 0 };
