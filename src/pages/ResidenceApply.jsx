import React, { useMemo, useState } from 'react';
import { db } from '@/api/client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Home, HeartHandshake, CheckCircle2, ArrowRight, BedDouble, ShieldCheck } from 'lucide-react';
import IntakePacket from '@/components/residences/IntakePacket';

/**
 * ResidenceApply — public, self-service applicant flow (no staff needed).
 * 1) Create your account (a VRCC participant record).
 * 2) Choose the house you're applying to.
 * 3) Read the rules & agreements and sign — the application info you entered
 *    carries straight into the documents so nothing is typed twice.
 *
 * Reached at /?apply=1 so it can be shared as a direct link.
 */
export default function ResidenceApply() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', date_of_birth: '',
    recovery_start_date: '', emergency_contact: '', emergency_phone: '',
  });
  const [participant, setParticipant] = useState(null);
  const [houseId, setHouseId] = useState('');
  const [resident, setResident] = useState(null);
  const [packetOpen, setPacketOpen] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const { data: houses = [] } = useQuery({
    queryKey: ['apply_houses'],
    queryFn: () => db.entities.RrHouse.list('created_date'),
  });
  const { data: residents = [] } = useQuery({
    queryKey: ['apply_residents'],
    queryFn: () => db.entities.RrResident.list(),
  });
  const filledByHouse = useMemo(() => {
    const m = {};
    residents.forEach((r) => { if (r.status === 'resident') m[r.house_id] = (m[r.house_id] || 0) + 1; });
    return m;
  }, [residents]);

  const carryOver = useMemo(() => {
    const house = houses.find((h) => h.id === houseId);
    return {
      full_name: form.full_name, phone: form.phone, email: form.email,
      date_of_birth: form.date_of_birth, emergency_contact: form.emergency_contact,
      emergency_phone: form.emergency_phone, recovery_start_date: form.recovery_start_date,
      coach: '', current_medications: '', allergies: '',
      monthly_fee: house?.monthly_fee ?? '', move_in_date: '',
    };
  }, [form, houseId, houses]);

  // Step 1 → create the participant "account" (only columns that exist on participants)
  const createAccount = useMutation({
    mutationFn: () =>
      db.entities.Participant.create({
        full_name: form.full_name, email: form.email, phone: form.phone,
        status: 'Active', created_by: 'self-apply',
      }),
    onSuccess: (p) => { setParticipant(p); setStep(2); },
  });

  // Step 2 → create the resident application row, open the packet
  const startPacket = useMutation({
    mutationFn: () => {
      const house = houses.find((h) => h.id === houseId);
      return db.entities.RrResident.create({
        house_id: houseId || null,
        residence_id: house?.residence_id || null,
        participant_id: participant?.id || null,
        participant_name: form.full_name,
        status: 'applicant',
        intake_complete: false,
        created_by: 'self-apply',
      });
    },
    onSuccess: (r) => { setResident(r); setPacketOpen(true); },
  });

  const submitApplication = useMutation({
    mutationFn: () =>
      resident ? db.entities.RrResident.update(resident.id, { intake_complete: true }) : Promise.resolve(),
    onSuccess: () => { setPacketOpen(false); setDone(true); },
  });

  return (
    <div className="min-h-full bg-gradient-to-b from-teal-50 to-slate-50">
      <div className="max-w-xl mx-auto px-5 py-8">
        {/* brand */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold">G</div>
          <div>
            <div className="font-bold text-slate-800 leading-tight">Grace For Addictions</div>
            <div className="text-xs text-slate-500">Recovery Residence Application</div>
          </div>
        </div>

        {!done && <Steps step={step} />}

        {done ? (
          <Card className="mt-4">
            <CardContent className="py-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Application submitted</h2>
              <p className="text-slate-500 mt-2 max-w-sm">
                Thank you, {form.full_name.split(' ')[0]}. Your application and signed agreements are on file.
                A recovery coach will follow up with you about a bed. Welcome — you belong here.
              </p>
              <Button className="mt-6 bg-teal-600 hover:bg-teal-700" onClick={() => window.location.reload()}>
                Start another application
              </Button>
            </CardContent>
          </Card>
        ) : step === 1 ? (
          <Card className="mt-4">
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-teal-600" /> Create your account
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                This is your VRCC account. What you enter here fills in your housing application automatically.
              </p>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <F full label="Full name *" value={form.full_name} onChange={set('full_name')} placeholder="First and last name" />
                <F label="Phone" value={form.phone} onChange={set('phone')} />
                <F label="Email" value={form.email} onChange={set('email')} type="email" />
                <F label="Date of birth" type="date" value={form.date_of_birth} onChange={set('date_of_birth')} />
                <F label="Recovery / sobriety date" type="date" value={form.recovery_start_date} onChange={set('recovery_start_date')} />
                <F label="Emergency contact" value={form.emergency_contact} onChange={set('emergency_contact')} />
                <F label="Emergency phone" value={form.emergency_phone} onChange={set('emergency_phone')} />
              </div>
              <Button
                className="w-full mt-5 bg-teal-600 hover:bg-teal-700 h-11"
                disabled={!form.full_name.trim() || createAccount.isPending}
                onClick={() => createAccount.mutate()}
              >
                {createAccount.isPending ? 'Creating…' : <>Create account &amp; continue <ArrowRight className="w-4 h-4 ml-1" /></>}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="mt-4">
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Home className="w-5 h-5 text-teal-600" /> Which house are you applying to?
              </h2>
              <p className="text-sm text-slate-500 mt-1">Pick a house, or choose “not sure yet.”</p>
              <div className="flex flex-col gap-2 mt-4">
                {houses.map((h) => {
                  const open = Math.max(0, (h.total_beds || 0) - (filledByHouse[h.id] || 0));
                  const sel = houseId === h.id;
                  return (
                    <button
                      key={h.id}
                      onClick={() => setHouseId(h.id)}
                      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                        sel ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-teal-300'
                      }`}
                    >
                      <Home className="w-5 h-5 text-teal-600 shrink-0" />
                      <div className="flex-1">
                        <div className="font-medium text-slate-800">{h.name}</div>
                        <div className="text-xs text-slate-500">
                          {[h.house_type, h.city].filter(Boolean).join(' · ')}{h.monthly_fee ? ` · $${h.monthly_fee}/mo` : ''}
                        </div>
                      </div>
                      <span className="text-xs text-slate-500 flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" />{open} open</span>
                    </button>
                  );
                })}
                <button
                  onClick={() => setHouseId('')}
                  className={`rounded-xl border p-3 text-left text-sm ${houseId === '' ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-teal-300'}`}
                >
                  I’m not sure yet — general application
                </button>
              </div>
              <div className="rounded-lg bg-teal-50 border border-teal-100 p-3 text-xs text-teal-700 mt-4 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
                Next you’ll review the house rules and agreements, and sign — everything you entered is carried over for you.
              </div>
              <Button
                className="w-full mt-4 bg-teal-600 hover:bg-teal-700 h-11"
                disabled={startPacket.isPending}
                onClick={() => startPacket.mutate()}
              >
                {startPacket.isPending ? 'Preparing your packet…' : <>Review rules &amp; sign <ArrowRight className="w-4 h-4 ml-1" /></>}
              </Button>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-slate-400 mt-6">
          Peer-based recovery support · not medical or mental-health treatment. In crisis? Call or text 988.
        </p>
      </div>

      {resident && (
        <IntakePacket
          open={packetOpen}
          onOpenChange={setPacketOpen}
          resident={resident}
          carryOver={carryOver}
          onComplete={() => submitApplication.mutate()}
        />
      )}
    </div>
  );
}

function F({ label, full, ...props }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <Label className="text-xs text-slate-500">{label}</Label>
      <Input className="mt-1" {...props} />
    </div>
  );
}

function Steps({ step }) {
  const items = ['Account', 'House', 'Review & sign'];
  return (
    <div className="flex items-center gap-2">
      {items.map((label, i) => {
        const n = i + 1;
        const active = step === n, doneStep = step > n;
        return (
          <React.Fragment key={label}>
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                doneStep ? 'bg-teal-600 text-white' : active ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>{doneStep ? '✓' : n}</div>
              <span className={`text-xs ${active ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>{label}</span>
            </div>
            {i < items.length - 1 && <div className="flex-1 h-px bg-slate-200" />}
          </React.Fragment>
        );
      })}
    </div>
  );
}
