import React, { useEffect, useMemo, useState } from 'react';
import { db } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Home, Plus, BedDouble, Users, Building2, UserPlus, ArrowRight, ClipboardList, HeartPulse } from 'lucide-react';
import IntakePacket from '@/components/residences/IntakePacket';
import { buildCarryOver } from '@/components/residences/intakeTemplates';

const MOOD_EMOJI = { struggling: '😔', tired: '😟', 'a little': '😟', steady: '😐', hopeful: '🙂', good: '😊', great: '😊' };
const moodIcon = (m) => MOOD_EMOJI[(m || '').toLowerCase()] || (m ? '🙂' : '·');

/**
 * Recovery Residence Portal — "Grace For Addictions Recovery Residences".
 * Grace House and EJWRH are two separate residences under the portal. Each
 * shows its beds, residents, and each resident's latest VRCC check-in.
 */
export default function RecoveryResidences() {
  const qc = useQueryClient();
  const [newResOpen, setNewResOpen] = useState(false);
  const [admit, setAdmit] = useState(null); // { residence, bedNumber }
  const [intakeResident, setIntakeResident] = useState(null);
  const [carryOver, setCarryOver] = useState(null);

  // The portal org (umbrella). Auto-used; created if missing.
  const { data: orgs = [] } = useQuery({
    queryKey: ['rr_portal_org'],
    queryFn: () => db.entities.RecoveryResidence.list('created_date'),
  });
  const org = orgs[0] || null;

  const ensureOrg = useMutation({
    mutationFn: () =>
      db.entities.RecoveryResidence.create({
        org_name: 'Grace For Addictions Recovery Residences',
        contact_name: 'Thomas D.', email: 'thomas@graceforaddictions.org',
        phone: '515-336-0006', city: 'Des Moines', state: 'IA', created_by: 'app',
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rr_portal_org'] }),
  });
  useEffect(() => {
    if (orgs.length === 0 && !ensureOrg.isPending) ensureOrg.mutate();
  }, [orgs.length]); // eslint-disable-line

  // Residences (Grace House, EJWRH) live in rr_houses under the portal org.
  const { data: residences = [] } = useQuery({
    queryKey: ['rr_residences', org?.id],
    queryFn: () => db.entities.RrHouse.filter({ residence_id: org.id }, 'created_date'),
    enabled: Boolean(org?.id),
  });
  const { data: residents = [] } = useQuery({
    queryKey: ['rr_residents', org?.id],
    queryFn: () => db.entities.RrResident.filter({ residence_id: org.id }),
    enabled: Boolean(org?.id),
  });
  const { data: participants = [] } = useQuery({
    queryKey: ['participants'],
    queryFn: () => db.entities.Participant.list('-created_date'),
  });
  const { data: checkins = [] } = useQuery({
    queryKey: ['checkins_all'],
    queryFn: () => db.entities.CheckIn.list('-date'),
  });

  // latest VRCC check-in per participant
  const lastCheckIn = useMemo(() => {
    const m = {};
    checkins.forEach((c) => { if (c.participant_id && !m[c.participant_id]) m[c.participant_id] = c; });
    return m;
  }, [checkins]);

  const residentsByResidence = useMemo(() => {
    const m = {};
    residents.forEach((r) => { (m[r.house_id] = m[r.house_id] || []).push(r); });
    return m;
  }, [residents]);

  const totals = useMemo(() => {
    const beds = residences.reduce((s, h) => s + (h.total_beds || 0), 0);
    const filled = residents.filter((r) => r.status === 'resident').length;
    return { residences: residences.length, beds, filled, open: Math.max(0, beds - filled) };
  }, [residences, residents]);

  const createResidence = useMutation({
    mutationFn: (form) =>
      db.entities.RrHouse.create({
        ...form, total_beds: Number(form.total_beds) || 0,
        monthly_fee: form.monthly_fee ? Number(form.monthly_fee) : null,
        residence_id: org.id, created_by: 'app',
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rr_residences', org?.id] }); setNewResOpen(false); },
  });

  const admitResident = useMutation({
    mutationFn: async ({ residence, bedNumber, participantId }) => {
      const p = participants.find((x) => x.id === participantId);
      const rc = (await db.entities.RecoveryCapital.filter({ participant_id: participantId }, '-assessment_date'))[0];
      const resident = await db.entities.RrResident.create({
        house_id: residence.id, residence_id: org.id, participant_id: participantId,
        participant_name: p?.full_name || 'Resident', bed_number: bedNumber,
        status: 'applicant', intake_complete: false, created_by: 'app',
      });
      return { resident, carry: buildCarryOver({ participant: p, recoveryCapital: rc, house: residence }) };
    },
    onSuccess: ({ resident, carry }) => {
      qc.invalidateQueries({ queryKey: ['rr_residents', org?.id] });
      setAdmit(null); setCarryOver(carry); setIntakeResident(resident);
    },
  });

  const completeIntake = useMutation({
    mutationFn: () => db.entities.RrResident.update(intakeResident.id, {
      status: 'resident', intake_complete: true, move_in_date: format(new Date(), 'yyyy-MM-dd'),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rr_residents', org?.id] }); setIntakeResident(null); setCarryOver(null); },
  });

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-teal-700 font-semibold text-xs tracking-widest uppercase">
            <Building2 className="w-4 h-4" /> Recovery Residence Portal
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mt-1">Grace For Addictions Recovery Residences</h1>
          <p className="text-slate-500 mt-1">
            Each residence manages its beds and residents — and sees each resident's VRCC check-ins as they happen.
          </p>
        </div>
        <ResidenceDialog open={newResOpen} setOpen={setNewResOpen} onSubmit={(f) => createResidence.mutate(f)} pending={createResidence.isPending} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat icon={<Home />} label="Residences" value={totals.residences} />
        <Stat icon={<BedDouble />} label="Total beds" value={totals.beds} />
        <Stat icon={<Users />} label="Residents" value={totals.filled} tone="teal" />
        <Stat icon={<BedDouble />} label="Open beds" value={totals.open} tone="amber" />
      </div>

      {residences.length === 0 ? (
        <EmptyState
          title="No residences yet"
          body="Add a recovery residence (e.g., Grace House or EJWRH) and set how many beds it has."
          action={<Button className="bg-teal-600 hover:bg-teal-700" onClick={() => setNewResOpen(true)}><Plus className="w-4 h-4 mr-1" /> Add residence</Button>}
        />
      ) : (
        <div className="flex flex-col gap-5">
          {residences.map((res) => (
            <ResidenceCard
              key={res.id}
              residence={res}
              residents={residentsByResidence[res.id] || []}
              lastCheckIn={lastCheckIn}
              onAdmit={(bedNumber) => setAdmit({ residence: res, bedNumber })}
            />
          ))}
        </div>
      )}

      <AdmitDialog
        state={admit}
        onClose={() => setAdmit(null)}
        participants={participants}
        existingResidentIds={residents.map((r) => r.participant_id)}
        pending={admitResident.isPending}
        onAdmit={(participantId) => admitResident.mutate({ residence: admit.residence, bedNumber: admit.bedNumber, participantId })}
      />

      {intakeResident && (
        <IntakePacket
          open={Boolean(intakeResident)}
          onOpenChange={(v) => { if (!v) { setIntakeResident(null); setCarryOver(null); } }}
          resident={intakeResident}
          carryOver={carryOver}
          onComplete={() => completeIntake.mutate()}
        />
      )}
    </div>
  );
}

function Stat({ icon, label, value, tone }) {
  const tones = { teal: 'text-teal-600', amber: 'text-amber-600', default: 'text-slate-700' };
  return (
    <Card><CardContent className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-slate-400 font-semibold">{label}</span>
        <span className="text-slate-300">{icon}</span>
      </div>
      <div className={`text-2xl font-bold mt-1 ${tones[tone] || tones.default}`}>{value}</div>
    </CardContent></Card>
  );
}

function ResidenceCard({ residence, residents, lastCheckIn, onAdmit }) {
  const placed = residents.filter((r) => r.status === 'resident' || r.status === 'applicant');
  const byBed = Object.fromEntries(placed.map((r) => [r.bed_number, r]));
  const beds = Array.from({ length: residence.total_beds || 0 }, (_, i) => i + 1);
  const openBeds = beds.filter((b) => !byBed[b]);
  const current = placed.filter((r) => r.status === 'resident');
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Home className="w-5 h-5 text-teal-600" /> {residence.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{residence.house_type}</Badge>
            <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100">
              {current.length}/{residence.total_beds} filled
            </Badge>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          {[residence.city, residence.state].filter(Boolean).join(', ')}{residence.monthly_fee ? ` · $${residence.monthly_fee}/wk` : ''}
        </p>
      </CardHeader>
      <CardContent>
        {/* bed grid */}
        <div className="grid grid-cols-5 sm:grid-cols-8 gap-2 mb-4">
          {beds.map((b) => {
            const r = byBed[b];
            return (
              <div key={b}
                className={`rounded-lg border p-2 text-center text-xs min-h-[52px] flex flex-col items-center justify-center ${
                  r ? (r.status === 'resident' ? 'border-teal-200 bg-teal-50 text-teal-800' : 'border-amber-200 bg-amber-50 text-amber-800')
                    : 'border-dashed border-slate-200 text-slate-400 hover:border-teal-400 hover:text-teal-600 cursor-pointer'}`}
                onClick={() => !r && onAdmit(b)} role={!r ? 'button' : undefined}>
                <BedDouble className="w-3.5 h-3.5 mb-0.5" />
                {r ? <span className="leading-tight font-medium truncate w-full">{r.participant_name?.split(' ')[0]}</span> : <span>Bed {b}</span>}
              </div>
            );
          })}
          {beds.length === 0 && <p className="col-span-full text-xs text-slate-400">No beds set for this residence.</p>}
        </div>

        {/* residents + their latest VRCC check-in */}
        {placed.length > 0 && (
          <div className="rounded-xl border border-slate-100 divide-y divide-slate-100">
            <div className="px-3 py-2 text-[11px] uppercase tracking-wide text-slate-400 font-semibold flex items-center gap-1">
              <HeartPulse className="w-3.5 h-3.5" /> Residents & VRCC check-ins
            </div>
            {placed.map((r) => {
              const ci = lastCheckIn[r.participant_id];
              return (
                <div key={r.id} className="px-3 py-2.5 flex items-center gap-3 text-sm">
                  <span className="w-6 text-center text-slate-400">{r.bed_number ? `#${r.bed_number}` : ''}</span>
                  <span className="font-medium text-slate-700 flex-1">{r.participant_name}</span>
                  {r.status === 'applicant'
                    ? <Badge variant="outline" className="text-amber-600 border-amber-300">applicant</Badge>
                    : <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100">resident</Badge>}
                  <span className="text-slate-500 flex items-center gap-1.5 w-40 justify-end">
                    <span className="text-base">{moodIcon(ci?.mood)}</span>
                    {ci ? <span className="text-xs">{ci.mood || 'checked in'} · {ci.date ? format(new Date(ci.date), 'MMM d') : ''}</span>
                        : <span className="text-xs text-slate-300">no check-in yet</span>}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {openBeds.length > 0 && (
          <Button variant="outline" className="w-full mt-3 text-teal-700 border-teal-200 hover:bg-teal-50" onClick={() => onAdmit(openBeds[0])}>
            <UserPlus className="w-4 h-4 mr-1" /> Admit resident to {residence.name}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ title, body, action }) {
  return (
    <Card className="border-dashed"><CardContent className="py-14 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-500 flex items-center justify-center mb-3"><Home className="w-8 h-8" /></div>
      <h3 className="font-semibold text-slate-700">{title}</h3>
      <p className="text-sm text-slate-500 mt-1 max-w-sm">{body}</p>
      <div className="mt-4">{action}</div>
    </CardContent></Card>
  );
}

function Field({ label, ...props }) {
  return (<div><Label className="text-xs text-slate-500">{label}</Label><Input className="mt-1" {...props} /></div>);
}

function ResidenceDialog({ open, setOpen, onSubmit, pending }) {
  const [f, setF] = useState({ name: '', city: 'Des Moines', state: 'IA', house_type: 'Women’s', total_beds: 10, manager_name: '', monthly_fee: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="bg-teal-600 hover:bg-teal-700"><Plus className="w-4 h-4 mr-1" /> Add residence</Button></DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Home className="w-5 h-5 text-teal-600" /> Add a recovery residence</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Field label="Residence name *" value={f.name} onChange={set('name')} placeholder="e.g. Grace House or EJWRH" /></div>
          <div>
            <Label className="text-xs text-slate-500">Type</Label>
            <Select value={f.house_type} onValueChange={(v) => setF({ ...f, house_type: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{['Women’s', 'Men’s', 'Co-ed'].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Field label="Total beds *" type="number" min="0" value={f.total_beds} onChange={set('total_beds')} />
          <Field label="City" value={f.city} onChange={set('city')} />
          <Field label="Weekly fee ($)" type="number" value={f.monthly_fee} onChange={set('monthly_fee')} />
          <div className="col-span-2"><Field label="House manager" value={f.manager_name} onChange={set('manager_name')} /></div>
        </div>
        <Button className="w-full mt-2 bg-teal-600 hover:bg-teal-700" disabled={!f.name || pending} onClick={() => onSubmit(f)}>
          {pending ? 'Adding…' : 'Add residence'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function AdmitDialog({ state, onClose, participants, existingResidentIds, onAdmit, pending }) {
  const [pid, setPid] = useState('');
  const available = participants.filter((p) => !existingResidentIds.includes(p.id));
  return (
    <Dialog open={Boolean(state)} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5 text-teal-600" /> Admit resident</DialogTitle></DialogHeader>
        <p className="text-sm text-slate-500 -mt-1">
          {state?.residence?.name} · Bed {state?.bedNumber}. Pick a VRCC participant — their intake pre-fills from their record.
        </p>
        <div className="mt-2">
          <Label className="text-xs text-slate-500">Participant</Label>
          <Select value={pid} onValueChange={setPid}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select participant" /></SelectTrigger>
            <SelectContent>
              {available.length === 0 && <div className="p-3 text-sm text-slate-400">All participants are already placed.</div>}
              {available.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-lg bg-teal-50 border border-teal-100 p-3 text-xs text-teal-700 mt-2 flex items-start gap-2">
          <ClipboardList className="w-4 h-4 mt-0.5 shrink-0" />
          Starts the intake packet — screening, rights, house rules, Participation Agreement, and release — each read, agreed, and signed before move-in.
        </div>
        <Button className="w-full mt-2 bg-teal-600 hover:bg-teal-700" disabled={!pid || pending} onClick={() => onAdmit(pid)}>
          {pending ? 'Starting intake…' : <>Start admission <ArrowRight className="w-4 h-4 ml-1" /></>}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
