import React, { useMemo, useState } from 'react';
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
import { Home, Plus, BedDouble, Users, Building2, UserPlus, ArrowRight, MapPin, ClipboardList } from 'lucide-react';
import IntakePacket from '@/components/residences/IntakePacket';
import { buildCarryOver } from '@/components/residences/intakeTemplates';

export default function RecoveryResidences() {
  const qc = useQueryClient();
  const [residenceId, setResidenceId] = useState(null);
  const [newResOpen, setNewResOpen] = useState(false);
  const [newHouseOpen, setNewHouseOpen] = useState(false);
  const [admit, setAdmit] = useState(null); // { house } during admit
  const [intakeResident, setIntakeResident] = useState(null);
  const [carryOver, setCarryOver] = useState(null);

  const { data: residences = [] } = useQuery({
    queryKey: ['rr_residences'],
    queryFn: () => db.entities.RecoveryResidence.list('-created_date'),
  });
  const residence = residences.find((r) => r.id === residenceId) || residences[0] || null;
  const activeResId = residence?.id;

  const { data: houses = [] } = useQuery({
    queryKey: ['rr_houses', activeResId],
    queryFn: () => db.entities.RrHouse.filter({ residence_id: activeResId }, 'created_date'),
    enabled: Boolean(activeResId),
  });
  const { data: residents = [] } = useQuery({
    queryKey: ['rr_residents', activeResId],
    queryFn: () => db.entities.RrResident.filter({ residence_id: activeResId }),
    enabled: Boolean(activeResId),
  });
  const { data: participants = [] } = useQuery({
    queryKey: ['participants'],
    queryFn: () => db.entities.Participant.list('-created_date'),
  });

  const residentsByHouse = useMemo(() => {
    const m = {};
    residents.forEach((r) => {
      (m[r.house_id] = m[r.house_id] || []).push(r);
    });
    return m;
  }, [residents]);

  const totals = useMemo(() => {
    const beds = houses.reduce((s, h) => s + (h.total_beds || 0), 0);
    const filled = residents.filter((r) => r.status === 'resident').length;
    return { beds, filled, houses: houses.length, open: Math.max(0, beds - filled) };
  }, [houses, residents]);

  /* ---- mutations ---- */
  const createResidence = useMutation({
    mutationFn: (form) => db.entities.RecoveryResidence.create({ ...form, created_by: 'app' }),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ['rr_residences'] });
      if (row?.id) setResidenceId(row.id);
      setNewResOpen(false);
    },
  });
  const createHouse = useMutation({
    mutationFn: (form) =>
      db.entities.RrHouse.create({
        ...form,
        total_beds: Number(form.total_beds) || 0,
        monthly_fee: form.monthly_fee ? Number(form.monthly_fee) : null,
        residence_id: activeResId,
        created_by: 'app',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rr_houses', activeResId] });
      setNewHouseOpen(false);
    },
  });

  // One-click admit: create the resident, build carry-over from their VRCC
  // record, and drop straight into the intake packet.
  const admitResident = useMutation({
    mutationFn: async ({ house, bedNumber, participantId }) => {
      const p = participants.find((x) => x.id === participantId);
      const rc = (await db.entities.RecoveryCapital.filter({ participant_id: participantId }, '-assessment_date'))[0];
      const resident = await db.entities.RrResident.create({
        house_id: house.id,
        residence_id: activeResId,
        participant_id: participantId,
        participant_name: p?.full_name || 'Resident',
        bed_number: bedNumber,
        status: 'applicant',
        intake_complete: false,
        created_by: 'app',
      });
      return { resident, carry: buildCarryOver({ participant: p, recoveryCapital: rc, house }) };
    },
    onSuccess: ({ resident, carry }) => {
      qc.invalidateQueries({ queryKey: ['rr_residents', activeResId] });
      setAdmit(null);
      setCarryOver(carry);
      setIntakeResident(resident);
    },
  });

  const completeIntake = useMutation({
    mutationFn: () =>
      db.entities.RrResident.update(intakeResident.id, {
        status: 'resident',
        intake_complete: true,
        move_in_date: format(new Date(), 'yyyy-MM-dd'),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rr_residents', activeResId] });
      setIntakeResident(null);
      setCarryOver(null);
    },
  });

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-teal-700 font-semibold text-xs tracking-widest uppercase">
            <Building2 className="w-4 h-4" /> Recovery Residence Network
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mt-1">Recovery Residences</h1>
          <p className="text-slate-500 mt-1">
            Residence partners manage their houses, beds, and residents — and admit VRCC participants with intake carried over automatically.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {residences.length > 0 && (
            <Select value={activeResId || ''} onValueChange={setResidenceId}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Select residence" /></SelectTrigger>
              <SelectContent>
                {residences.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.org_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <ResidenceDialog open={newResOpen} setOpen={setNewResOpen} onSubmit={(f) => createResidence.mutate(f)} pending={createResidence.isPending} />
        </div>
      </div>

      {!residence ? (
        <EmptyState
          icon={<Building2 className="w-8 h-8" />}
          title="No recovery residences yet"
          body="Create a residence account to start adding houses, setting bed counts, and admitting residents."
          action={<Button className="bg-teal-600 hover:bg-teal-700" onClick={() => setNewResOpen(true)}><Plus className="w-4 h-4 mr-1" /> Create residence account</Button>}
        />
      ) : (
        <>
          {/* summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Stat icon={<Home />} label="Houses" value={totals.houses} />
            <Stat icon={<BedDouble />} label="Total beds" value={totals.beds} />
            <Stat icon={<Users />} label="Residents" value={totals.filled} tone="teal" />
            <Stat icon={<BedDouble />} label="Open beds" value={totals.open} tone="amber" />
          </div>

          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" /> {residence.org_name} · Houses
            </h2>
            <HouseDialog open={newHouseOpen} setOpen={setNewHouseOpen} onSubmit={(f) => createHouse.mutate(f)} pending={createHouse.isPending} />
          </div>

          {houses.length === 0 ? (
            <EmptyState
              icon={<Home className="w-8 h-8" />}
              title="No houses yet"
              body="Add a house and set how many beds it has."
              action={<Button className="bg-teal-600 hover:bg-teal-700" onClick={() => setNewHouseOpen(true)}><Plus className="w-4 h-4 mr-1" /> Add house</Button>}
            />
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {houses.map((h) => (
                <HouseCard
                  key={h.id}
                  house={h}
                  residents={residentsByHouse[h.id] || []}
                  onAdmit={(bedNumber) => setAdmit({ house: h, bedNumber })}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Admit dialog */}
      <AdmitDialog
        state={admit}
        onClose={() => setAdmit(null)}
        participants={participants}
        existingResidentIds={residents.map((r) => r.participant_id)}
        pending={admitResident.isPending}
        onAdmit={(participantId) => admitResident.mutate({ house: admit.house, bedNumber: admit.bedNumber, participantId })}
      />

      {/* Intake packet */}
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

/* ---------------- pieces ---------------- */
function Stat({ icon, label, value, tone }) {
  const tones = { teal: 'text-teal-600', amber: 'text-amber-600', default: 'text-slate-700' };
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-slate-400 font-semibold">{label}</span>
          <span className="text-slate-300">{icon}</span>
        </div>
        <div className={`text-2xl font-bold mt-1 ${tones[tone] || tones.default}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function HouseCard({ house, residents, onAdmit }) {
  const filled = residents.filter((r) => r.status === 'resident' || r.status === 'applicant');
  const byBed = Object.fromEntries(filled.map((r) => [r.bed_number, r]));
  const beds = Array.from({ length: house.total_beds || 0 }, (_, i) => i + 1);
  const openBeds = beds.filter((b) => !byBed[b]);
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Home className="w-4 h-4 text-teal-600" /> {house.name}
          </CardTitle>
          <Badge variant="outline">{house.house_type}</Badge>
        </div>
        <p className="text-xs text-slate-500">
          {[house.city, house.state].filter(Boolean).join(', ')}
          {house.monthly_fee ? ` · $${house.monthly_fee}/mo` : ''}
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span>{filled.filter((r) => r.status === 'resident').length} / {house.total_beds} beds filled</span>
          <span>{openBeds.length} open</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {beds.map((b) => {
            const r = byBed[b];
            return (
              <div
                key={b}
                className={`rounded-lg border p-2 text-center text-xs min-h-[52px] flex flex-col items-center justify-center ${
                  r
                    ? r.status === 'resident'
                      ? 'border-teal-200 bg-teal-50 text-teal-800'
                      : 'border-amber-200 bg-amber-50 text-amber-800'
                    : 'border-dashed border-slate-200 text-slate-400 hover:border-teal-400 hover:text-teal-600 cursor-pointer'
                }`}
                onClick={() => !r && onAdmit(b)}
                role={!r ? 'button' : undefined}
              >
                <BedDouble className="w-3.5 h-3.5 mb-0.5" />
                {r ? (
                  <span className="leading-tight font-medium truncate w-full">{r.participant_name?.split(' ')[0]}</span>
                ) : (
                  <span>Bed {b}</span>
                )}
              </div>
            );
          })}
          {beds.length === 0 && <p className="col-span-4 text-xs text-slate-400">No beds set for this house.</p>}
        </div>
        {openBeds.length > 0 && (
          <Button variant="outline" className="w-full mt-3 text-teal-700 border-teal-200 hover:bg-teal-50" onClick={() => onAdmit(openBeds[0])}>
            <UserPlus className="w-4 h-4 mr-1" /> Admit resident to open bed
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon, title, body, action }) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-14 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-500 flex items-center justify-center mb-3">{icon}</div>
        <h3 className="font-semibold text-slate-700">{title}</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">{body}</p>
        <div className="mt-4">{action}</div>
      </CardContent>
    </Card>
  );
}

function Field({ label, ...props }) {
  return (
    <div>
      <Label className="text-xs text-slate-500">{label}</Label>
      <Input className="mt-1" {...props} />
    </div>
  );
}

function ResidenceDialog({ open, setOpen, onSubmit, pending }) {
  const [f, setF] = useState({ org_name: '', contact_name: '', email: '', phone: '', city: '', state: 'IA' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-teal-600 hover:bg-teal-700"><Plus className="w-4 h-4 mr-1" /> New residence</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-teal-600" /> Create residence account</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Field label="Organization name *" value={f.org_name} onChange={set('org_name')} placeholder="e.g. Grace House Recovery Residences" /></div>
          <Field label="Primary contact" value={f.contact_name} onChange={set('contact_name')} />
          <Field label="Phone" value={f.phone} onChange={set('phone')} />
          <Field label="Email" value={f.email} onChange={set('email')} />
          <Field label="City" value={f.city} onChange={set('city')} />
        </div>
        <Button className="w-full mt-2 bg-teal-600 hover:bg-teal-700" disabled={!f.org_name || pending} onClick={() => onSubmit(f)}>
          {pending ? 'Creating…' : 'Create account'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function HouseDialog({ open, setOpen, onSubmit, pending }) {
  const [f, setF] = useState({ name: '', city: '', state: 'IA', house_type: 'Co-ed', total_beds: 6, manager_name: '', monthly_fee: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-teal-600 hover:bg-teal-700"><Plus className="w-4 h-4 mr-1" /> Add house</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Home className="w-5 h-5 text-teal-600" /> Add a house</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Field label="House name *" value={f.name} onChange={set('name')} placeholder="e.g. Serenity House" /></div>
          <Field label="City" value={f.city} onChange={set('city')} />
          <div>
            <Label className="text-xs text-slate-500">House type</Label>
            <Select value={f.house_type} onValueChange={(v) => setF({ ...f, house_type: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Men’s', 'Women’s', 'Co-ed'].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Field label="Total beds *" type="number" min="0" value={f.total_beds} onChange={set('total_beds')} />
          <Field label="Monthly fee ($)" type="number" value={f.monthly_fee} onChange={set('monthly_fee')} />
          <div className="col-span-2"><Field label="House manager" value={f.manager_name} onChange={set('manager_name')} /></div>
        </div>
        <Button className="w-full mt-2 bg-teal-600 hover:bg-teal-700" disabled={!f.name || pending} onClick={() => onSubmit(f)}>
          {pending ? 'Adding…' : 'Add house'}
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
          {state?.house?.name} · Bed {state?.bedNumber}. Pick a VRCC participant — their intake will be pre-filled from their record.
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
          One click starts the intake packet — application, agreement, house rules, release of info, and relapse policy — each read, agreed, and signed before move-in.
        </div>
        <Button className="w-full mt-2 bg-teal-600 hover:bg-teal-700" disabled={!pid || pending} onClick={() => onAdmit(pid)}>
          {pending ? 'Starting intake…' : <>Start admission <ArrowRight className="w-4 h-4 ml-1" /></>}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
