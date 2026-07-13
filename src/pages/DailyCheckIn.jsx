import React, { useState } from 'react';
import { db } from '@/api/client';
import { useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HeartHandshake, CheckCircle2, ArrowRight, Phone } from 'lucide-react';

/**
 * DailyCheckIn — public, self-service resident check-in (reached at /?checkin).
 * Identify → mood + optional reflection → saved to check_ins for that
 * participant, so it appears in their residence's portal view. No login: the
 * resident enters their name (matched to their VRCC record, or created).
 * Mood values align with the residence portal's emoji map.
 */
const MOODS = [
  { score: 1, value: 'struggling', emoji: '😔', label: 'Struggling' },
  { score: 2, value: 'tired', emoji: '😟', label: 'Hard day' },
  { score: 3, value: 'steady', emoji: '😐', label: 'Getting by' },
  { score: 4, value: 'hopeful', emoji: '🙂', label: 'Doing well' },
  { score: 5, value: 'good', emoji: '😊', label: 'Feeling good' },
];

export default function DailyCheckIn() {
  const [step, setStep] = useState('who'); // who | feel | done
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [participant, setParticipant] = useState(null);
  const [mood, setMood] = useState(null);
  const [note, setNote] = useState('');
  const [cravings, setCravings] = useState(null);
  const [support, setSupport] = useState(null);
  const [gratitude, setGratitude] = useState('');

  const identify = useMutation({
    mutationFn: async () => {
      const q = email
        ? await db.entities.Participant.filter({ email })
        : await db.entities.Participant.filter({ full_name: name });
      if (q && q[0]) return q[0];
      return db.entities.Participant.create({ full_name: name, email, status: 'Active', created_by: 'self-checkin' });
    },
    onSuccess: (p) => { setParticipant(p); setStep('feel'); },
  });

  const submit = useMutation({
    mutationFn: () => {
      const m = MOODS.find((x) => x.score === mood);
      const notes = [
        note && `Reflection: ${note}`,
        cravings && `Cravings: ${cravings}`,
        support ? 'Asked to talk to someone.' : null,
        gratitude && `Grateful for: ${gratitude}`,
      ].filter(Boolean).join(' · ');
      return db.entities.CheckIn.create({
        participant_id: participant?.id || null,
        participant_name: name,
        date: format(new Date(), 'yyyy-MM-dd'),
        mood: m?.value || 'steady',
        score: mood,
        notes,
        created_by: 'self-checkin',
      });
    },
    onSuccess: () => setStep('done'),
  });

  const needsSupport = mood != null && (mood <= 2 || support);

  return (
    <div className="min-h-full bg-gradient-to-b from-teal-50 to-slate-50">
      <div className="max-w-md mx-auto px-5 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold">G</div>
          <div>
            <div className="font-bold text-slate-800 leading-tight">Grace For Addictions</div>
            <div className="text-xs text-slate-500">Daily Check-In · you belong here</div>
          </div>
        </div>

        {step === 'who' && (
          <Card><CardContent className="pt-6">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-teal-600" /> Let's check in
            </h2>
            <p className="text-sm text-slate-500 mt-1">A minute for yourself. No wrong answers.</p>
            <div className="mt-4">
              <Label className="text-xs text-slate-500">Your name *</Label>
              <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="First and last name" />
            </div>
            <div className="mt-3">
              <Label className="text-xs text-slate-500">Email (optional — helps match your record)</Label>
              <Input className="mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button className="w-full mt-5 h-11 bg-teal-600 hover:bg-teal-700" disabled={!name.trim() || identify.isPending}
              onClick={() => identify.mutate()}>
              {identify.isPending ? 'One sec…' : <>Continue <ArrowRight className="w-4 h-4 ml-1" /></>}
            </Button>
          </CardContent></Card>
        )}

        {step === 'feel' && (
          <div className="flex flex-col gap-4">
            <Card><CardContent className="pt-6">
              <h3 className="font-semibold text-slate-800">How are you feeling today, {name.split(' ')[0]}?</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">Be honest with yourself.</p>
              <div className="flex justify-between gap-1.5">
                {MOODS.map((m) => (
                  <button key={m.score} onClick={() => setMood(m.score)}
                    className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 flex-1 transition ${
                      mood === m.score ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-teal-300'}`}>
                    <span className="text-2xl">{m.emoji}</span>
                    <span className={`text-[10px] font-semibold ${mood === m.score ? 'text-teal-700' : 'text-slate-400'}`}>{m.label}</span>
                  </button>
                ))}
              </div>
            </CardContent></Card>

            {mood != null && (
              <>
                <Card><CardContent className="pt-5">
                  <Label className="text-xs text-slate-500">Anything on your mind? (optional)</Label>
                  <textarea className="mt-1 w-full rounded-md border border-slate-200 p-2 text-sm" rows={2}
                    value={note} onChange={(e) => setNote(e.target.value)} placeholder="Today feels like…" />
                  <div className="mt-4">
                    <Label className="text-xs text-slate-500">Any cravings or urges today?</Label>
                    <div className="flex gap-2 mt-1.5 flex-wrap">
                      {['yes', 'a little', 'not really', 'no'].map((o) => (
                        <button key={o} onClick={() => setCravings(o)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-medium capitalize transition ${
                            cravings === o ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-500'}`}>{o}</button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label className="text-xs text-slate-500">Do you want to talk to someone today?</Label>
                    <div className="flex gap-2 mt-1.5">
                      {[{ v: true, l: 'Yes, please' }, { v: false, l: "I'm ok for now" }].map((o) => (
                        <button key={String(o.v)} onClick={() => setSupport(o.v)}
                          className={`px-4 py-1.5 rounded-lg border text-xs font-medium transition ${
                            support === o.v ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-500'}`}>{o.l}</button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label className="text-xs text-slate-500">One thing you're grateful for (optional)</Label>
                    <Input className="mt-1" value={gratitude} onChange={(e) => setGratitude(e.target.value)} placeholder="Even something small…" />
                  </div>
                </CardContent></Card>
                <Button className="h-11 bg-teal-600 hover:bg-teal-700" disabled={submit.isPending} onClick={() => submit.mutate()}>
                  {submit.isPending ? 'Saving…' : 'Submit check-in'}
                </Button>
              </>
            )}
          </div>
        )}

        {step === 'done' && (
          <Card><CardContent className="py-12 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mb-4"><CheckCircle2 className="w-9 h-9" /></div>
            <h2 className="text-xl font-bold text-slate-800">Check-in complete</h2>
            <p className="text-slate-500 mt-2">
              {mood >= 4 ? "You're showing up for yourself. That matters."
                : mood <= 2 ? "Thank you for being honest. You don't have to carry today alone — your team can see this."
                : 'Every day you check in is a day you stayed connected. That’s the work.'}
            </p>
            {needsSupport && (
              <div className="mt-5 w-full rounded-xl bg-teal-50 border border-teal-100 p-4 text-left text-sm text-teal-800">
                <div className="font-semibold flex items-center gap-1.5 mb-1"><Phone className="w-4 h-4" /> Support, any time</div>
                Iowa Crisis Line <b>1-844-775-5837</b> · Call or text <b>988</b>. Your coach has been notified.
              </div>
            )}
            <Button className="mt-6 bg-teal-600 hover:bg-teal-700" onClick={() => window.location.reload()}>Done</Button>
          </CardContent></Card>
        )}

        <p className="text-center text-xs text-slate-400 mt-6">
          Peer-based recovery support · not medical or mental-health treatment. In crisis? Call or text 988.
        </p>
      </div>
    </div>
  );
}
