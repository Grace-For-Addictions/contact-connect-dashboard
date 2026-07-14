import React, { useMemo, useState } from 'react';
import { db } from '@/api/client';
import { useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { HeartHandshake, CheckCircle2, Sparkles } from 'lucide-react';
import { LK } from '@/lib/lookups';
import { getIdentity } from '@/lib/identity';

/**
 * Intake — Contact Connect participant intake.
 * A person-first, mostly-optional intake. Only name, county, date of birth,
 * intake date, and a consent choice are required. Prefills from the signed-in
 * identity. Saves a participant (find-or-create) and a participant_intakes row.
 */
const today = () => format(new Date(), 'yyyy-MM-dd');

export default function Intake() {
  const acct = getIdentity();
  const [f, setF] = useState(() => ({
    first_name: acct?.first_name || '', middle_name: '', last_name: acct?.last_name || '', preferred_name: '',
    pronouns: '', date_of_birth: acct?.dob || '', gender_identity: '', race: '', sexual_orientation: '',
    phone: '', email: acct?.email || '', address1: '', address2: '', city: '', county: '', state: 'IA', zipcode: '', country: 'United States',
    intake_date: today(), referral_source: '', active_status: 'Active', drug_of_choice: '',
    housing_status: '', transportation_access: '', custody_status: '', assigned_coach: '',
    emergency_contact_name: '', emergency_contact_relationship: '', emergency_contact_phone: '',
    intake_notes: '', dua_consent: '',
  }));
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const age = useMemo(() => {
    if (!f.date_of_birth) return '';
    const d = new Date(f.date_of_birth), n = new Date();
    let a = n.getFullYear() - d.getFullYear();
    if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a--;
    return a >= 0 && a < 130 ? a : '';
  }, [f.date_of_birth]);

  const submit = useMutation({
    mutationFn: async () => {
      const email = (f.email || '').trim().toLowerCase();
      const name = [f.preferred_name || f.first_name, f.last_name].filter(Boolean).join(' ').trim();
      let p = null;
      if (email) p = (await db.entities.Participant.filter({ email }))?.[0] || null;
      if (!p) p = await db.entities.Participant.create({ full_name: name, email, status: f.active_status || 'Active', county: f.county, created_by: 'intake' });
      await db.entities.ParticipantIntake.create({
        ...f, email, age: age || null, participant_id: p?.id || null, account_id: acct?.id || null, created_by: 'intake',
      });
      return p;
    },
    onSuccess: () => { setDone(true); window.scrollTo?.({ top: 0, behavior: 'smooth' }); },
  });

  function validate() {
    const e = {};
    ['first_name', 'last_name', 'county', 'date_of_birth', 'intake_date'].forEach((k) => { if (!String(f[k] || '').trim()) e[k] = 'Required'; });
    if (!f.dua_consent) e.dua_consent = 'Please choose an option';
    if (f.phone && !/^[\d\s().+-]{7,}$/.test(f.phone.trim())) e.phone = 'Enter a valid phone number';
    setErrors(e);
    return Object.keys(e).length === 0;
  }
  function onSubmit() { if (validate()) submit.mutate(); }

  if (done) {
    const name = (f.preferred_name || f.first_name || 'friend').trim();
    return (
      <div className="min-h-full bg-gradient-to-b from-amber-50 to-slate-50">
        <div className="max-w-xl mx-auto px-5 py-16 text-center">
          <div className="w-20 h-20 rounded-full border-2 border-amber-400 text-amber-500 flex items-center justify-center mx-auto mb-6 text-3xl"><Sparkles /></div>
          <h2 className="text-3xl font-bold text-slate-800">Welcome, {name}.</h2>
          <div className="text-xs tracking-widest uppercase text-amber-600 font-semibold mt-2">You're part of Grace &amp; Company now</div>
          <p className="text-slate-600 mt-4 leading-relaxed">Your intake has been received. An Intake Coordinator will make warm contact within 48 hours to connect you with a peer coach and any support you asked for. No pressure, no judgment — just grace.</p>
          <Button className="mt-8 bg-amber-600 hover:bg-amber-700" onClick={() => window.location.reload()}>Done</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-amber-50/60 to-slate-50">
      <div className="max-w-3xl mx-auto px-5 py-8">
        <div className="flex items-center gap-2 text-amber-600 font-semibold text-xs tracking-widest uppercase"><HeartHandshake className="w-4 h-4" /> Contact Connect · Participant Intake</div>
        <h1 className="text-3xl font-bold text-slate-800 mt-1">Begin with grace</h1>
        <p className="text-slate-500 mt-1">There's no wrong way to start. Share what you're comfortable sharing — only a few fields are required.</p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 md:p-8 space-y-8">
          <Section n="1" title="Who you are" sub="Your name and identity, in your words.">
            <Grid cols="3">
              <F label="First name" req v={f.first_name} on={(x) => set('first_name', x)} err={errors.first_name} />
              <F label="Middle name" v={f.middle_name} on={(x) => set('middle_name', x)} />
              <F label="Last name" req v={f.last_name} on={(x) => set('last_name', x)} err={errors.last_name} />
              <F label="Preferred name" ph="What you like to be called" v={f.preferred_name} on={(x) => set('preferred_name', x)} />
              <S label="Pronouns" opts={LK.pronouns} v={f.pronouns} on={(x) => set('pronouns', x)} />
              <F label="Date of birth" req type="date" v={f.date_of_birth} on={(x) => set('date_of_birth', x)} err={errors.date_of_birth} />
              <F label="Age" v={age === '' ? '' : String(age)} readOnly />
              <S label="Gender identity" opts={LK.gender_identity} v={f.gender_identity} on={(x) => set('gender_identity', x)} />
              <S label="Race" opts={LK.race} v={f.race} on={(x) => set('race', x)} />
              <S label="Sexual orientation" opts={LK.sexual_orientation} v={f.sexual_orientation} on={(x) => set('sexual_orientation', x)} />
            </Grid>
          </Section>

          <Section n="2" title="How to reach you" sub="So a coordinator can make warm contact.">
            <Grid cols="2">
              <F label="Phone" type="tel" ph="(555) 555-5555" v={f.phone} on={(x) => set('phone', x)} err={errors.phone} />
              <F label="Email" type="email" ph="you@example.com" v={f.email} on={(x) => set('email', x)} />
              <F label="Address line 1" span v={f.address1} on={(x) => set('address1', x)} />
              <F label="Address line 2" span v={f.address2} on={(x) => set('address2', x)} />
              <F label="City" v={f.city} on={(x) => set('city', x)} />
              <F label="County" req v={f.county} on={(x) => set('county', x)} err={errors.county} />
              <F label="State" ph="IA" v={f.state} on={(x) => set('state', x)} />
              <F label="ZIP code" ph="50309" v={f.zipcode} on={(x) => set('zipcode', x)} />
            </Grid>
          </Section>

          <Section n="3" title="Your recovery & support" sub="Strengths first. Share only what you're ready to share.">
            <Grid cols="3">
              <F label="Intake date" req type="date" v={f.intake_date} on={(x) => set('intake_date', x)} err={errors.intake_date} />
              <S label="How did you hear about us?" opts={LK.referral_source} v={f.referral_source} on={(x) => set('referral_source', x)} />
              <S label="Status" opts={LK.active_status} v={f.active_status} on={(x) => set('active_status', x)} first="" />
              <F label="Substance(s) of focus" ph="Optional" v={f.drug_of_choice} on={(x) => set('drug_of_choice', x)} />
              <S label="Housing situation" opts={LK.housing_status} v={f.housing_status} on={(x) => set('housing_status', x)} />
              <S label="Transportation access" opts={LK.transportation_access} v={f.transportation_access} on={(x) => set('transportation_access', x)} />
              <S label="Justice involvement" opts={LK.custody_status} v={f.custody_status} on={(x) => set('custody_status', x)} />
              <S label="Assigned peer coach" opts={LK.assigned_coach} v={f.assigned_coach} on={(x) => set('assigned_coach', x)} first="" />
            </Grid>
          </Section>

          <Section n="4" title="Someone in your corner" sub="An emergency contact — only used in a safety situation, with your consent.">
            <Grid cols="3">
              <F label="Contact name" v={f.emergency_contact_name} on={(x) => set('emergency_contact_name', x)} />
              <F label="Relationship" ph="e.g. sister, friend, sponsor" v={f.emergency_contact_relationship} on={(x) => set('emergency_contact_relationship', x)} />
              <F label="Contact phone" type="tel" ph="(555) 555-5555" v={f.emergency_contact_phone} on={(x) => set('emergency_contact_phone', x)} />
            </Grid>
          </Section>

          <Section n="5" title="Anything else" sub="Your story matters. Tell us whatever feels important.">
            <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1">Intake notes</label>
            <textarea className="w-full rounded-lg border border-slate-200 p-3 text-sm" rows={4}
              placeholder="What brings you here today? What kind of support are you hoping for?" value={f.intake_notes} onChange={(e) => set('intake_notes', e.target.value)} />
          </Section>

          <Section n="6" title="Consent" sub="Your choice, always. This does not affect the support you receive.">
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-5">
              <p className="text-sm text-slate-700 italic leading-relaxed">I consent to allow my anonymized data to be used to help develop better policies and practices, and to better understand outcomes and experiences.</p>
              <div className="flex gap-6 mt-3">
                {['Yes', 'No'].map((o) => (
                  <label key={o} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input type="radio" name="dua" checked={f.dua_consent === o} onChange={() => set('dua_consent', o)} className="accent-amber-600 w-4 h-4" />
                    {o === 'Yes' ? 'Yes, I consent' : 'No, not at this time'}
                  </label>
                ))}
              </div>
              {errors.dua_consent && <div className="text-xs text-rose-600 mt-2">{errors.dua_consent}</div>}
            </div>
          </Section>

          <div className="flex items-center gap-3 flex-wrap pt-2">
            <Button className="bg-amber-600 hover:bg-amber-700 h-11 px-6" disabled={submit.isPending} onClick={onSubmit}>
              {submit.isPending ? 'Submitting…' : 'Submit intake'}
            </Button>
            <span className="text-xs text-slate-400">Fields marked <span className="text-rose-500">*</span> are required</span>
          </div>
        </div>
        <p className="text-center text-xs text-slate-400 mt-6">Person-first · trauma-informed · stigma-free. In crisis? Call or text 988.</p>
      </div>
    </div>
  );
}

const Section = ({ n, title, sub, children }) => (
  <div>
    <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-amber-600 font-semibold">
      <span className="w-6 h-6 rounded-full border border-amber-400 text-amber-600 flex items-center justify-center text-[11px]">{n}</span> {title}
    </div>
    <div className="text-xs text-slate-400 italic mt-1 mb-4">{sub}</div>
    {children}
  </div>
);
const Grid = ({ cols, children }) => (
  <div className={`grid gap-4 ${cols === '3' ? 'md:grid-cols-3' : 'md:grid-cols-2'} grid-cols-1`}>{children}</div>
);
const F = ({ label, req, type = 'text', ph = '', v, on, err, readOnly, span }) => (
  <div className={span ? 'md:col-span-2' : ''}>
    <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1">{label}{req && <span className="text-rose-500 ml-0.5">*</span>}</label>
    <input type={type} value={v} readOnly={readOnly} placeholder={ph} onChange={(e) => on?.(e.target.value)}
      className={`w-full rounded-lg border p-2.5 text-sm ${readOnly ? 'bg-amber-50 text-amber-700 border-amber-200' : 'border-slate-200'} ${err ? 'border-rose-400' : ''}`} />
    {err && <div className="text-[11px] text-rose-600 mt-1">{err}</div>}
  </div>
);
const S = ({ label, opts, v, on, first = 'Select…' }) => (
  <div>
    <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1">{label}</label>
    <select value={v} onChange={(e) => on?.(e.target.value)} className="w-full rounded-lg border border-slate-200 p-2.5 text-sm bg-white">
      {first !== undefined && <option value="">{first}</option>}
      {opts.map((o) => <option key={o}>{o}</option>)}
    </select>
  </div>
);
