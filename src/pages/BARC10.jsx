import React, { useMemo, useState } from 'react';
import { db } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sprout, TrendingUp, RotateCcw, CheckCircle2 } from 'lucide-react';

/**
 * BARC-10 — Brief Assessment of Recovery Capital.
 * Ten statements, agreement 1 (strongly disagree) .. 6 (strongly agree).
 * Total 10–60 maps to a "soil type" (GFA's Parable-of-the-Sower framing) and a
 * strengths-based insight + next action. Saved to barc10_assessments and the
 * participant's latest barc10_score. Person-first, no punitive framing.
 */
const QUESTIONS = [
  'I have the support I need from people who believe in my recovery.',
  'I get emotional support from my family or people close to me.',
  'There are people in my life who understand what recovery takes.',
  'I am proud of the community I belong to and it supports my recovery.',
  'I have things in my life I can look forward to.',
  'In general I am happy with my life today.',
  'I have enough energy to do the things I need to do.',
  'I take full responsibility for my actions and my recovery.',
  'I have a home and a stable place to live.',
  'I have meaningful ways to spend my time (work, study, purpose).',
];

// Score bands → soil type (Parable of the Sower) → strengths framing.
function soil(total) {
  if (total <= 25) return { key: 'path', label: 'Path Soil', color: '#b45309', tag: 'Foundational support',
    insight: 'Recovery capital is early and worth protecting. Priority: connection and stability — a peer coach, a daily check-in, and one concrete support this week.' };
  if (total <= 38) return { key: 'rocky', label: 'Rocky Soil', color: '#b91c1c', tag: 'Building roots',
    insight: 'Roots are forming. Focus on deepening support and routine — consistent check-ins, a recovery circle, and naming one goal to build momentum.' };
  if (total <= 50) return { key: 'thorny', label: 'Thorny Soil', color: '#7c3aed', tag: 'Active transformation',
    insight: 'Strong, active recovery capital. Clear the thorns: protect time and boundaries, and consider a leadership or service role that reinforces your own growth.' };
  return { key: 'good', label: 'Good Soil', color: '#15803d', tag: 'Flourishing · mentor-ready',
    insight: 'Flourishing recovery capital. You are mentor-ready — giving back through peer coaching or a Walls of Honor story strengthens the whole community and your own roots.' };
}

export default function BARC10() {
  const qc = useQueryClient();
  const [step, setStep] = useState('who'); // who | quiz | done
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [participant, setParticipant] = useState(null);
  const [answers, setAnswers] = useState(Array(10).fill(null));
  const [result, setResult] = useState(null);

  const { data: history = [] } = useQuery({ queryKey: ['barc10'], queryFn: () => db.entities.Barc10Assessment.list('-date') });

  const total = useMemo(() => answers.reduce((s, a) => s + (a || 0), 0), [answers]);
  const complete = answers.every((a) => a != null);

  const identify = useMutation({
    mutationFn: async () => {
      const q = email ? await db.entities.Participant.filter({ email }) : await db.entities.Participant.filter({ full_name: name });
      if (q && q[0]) return q[0];
      return db.entities.Participant.create({ full_name: name, email, status: 'Active', created_by: 'self-barc10' });
    },
    onSuccess: (p) => { setParticipant(p); setStep('quiz'); },
  });

  const submit = useMutation({
    mutationFn: async () => {
      const s = soil(total);
      const row = await db.entities.Barc10Assessment.create({
        participant_id: participant?.id || null,
        participant_name: name,
        answers: QUESTIONS.map((q, i) => ({ q, score: answers[i] })),
        total, soil_type: s.key, insight: s.insight,
        date: format(new Date(), 'yyyy-MM-dd'), created_by: 'self-barc10',
      });
      if (participant?.id) await db.entities.Participant.update(participant.id, { barc10_score: total });
      return { row, s };
    },
    onSuccess: ({ s }) => { setResult(s); setStep('done'); qc.invalidateQueries({ queryKey: ['barc10'] }); },
  });

  const reset = () => { setStep('who'); setName(''); setEmail(''); setParticipant(null); setAnswers(Array(10).fill(null)); setResult(null); };

  return (
    <div className="min-h-full bg-gradient-to-b from-violet-50 to-slate-50">
      <div className="max-w-2xl mx-auto px-5 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-violet-600 text-white flex items-center justify-center"><Sprout className="w-6 h-6" /></div>
          <div>
            <div className="font-bold text-slate-800 leading-tight">BARC-10 · Recovery Capital</div>
            <div className="text-xs text-slate-500">A strengths check-in — not a test. There are no wrong answers.</div>
          </div>
        </div>

        {step === 'who' && (
          <Card><CardContent className="pt-6">
            <p className="text-sm text-slate-600 mb-4">Ten short statements about the supports and strengths in your life right now. It takes about two minutes and helps your team see where you're already strong and where a little more support would help.</p>
            <Label className="text-xs text-slate-500">Your name *</Label>
            <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="First and last name" />
            <Label className="text-xs text-slate-500 mt-3 block">Email (optional — helps match your record)</Label>
            <Input className="mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button className="w-full mt-5 h-11 bg-violet-600 hover:bg-violet-700" disabled={!name.trim() || identify.isPending} onClick={() => identify.mutate()}>
              {identify.isPending ? 'One sec…' : 'Begin'}
            </Button>
            {history.length > 0 && <p className="text-center text-xs text-slate-400 mt-4">{history.length} assessment{history.length === 1 ? '' : 's'} recorded across the community.</p>}
          </CardContent></Card>
        )}

        {step === 'quiz' && (
          <div className="flex flex-col gap-3">
            <Card><CardContent className="py-4 flex items-center justify-between">
              <span className="text-sm text-slate-500">Progress</span>
              <span className="font-semibold text-violet-700">{answers.filter((a) => a != null).length} / 10</span>
            </CardContent></Card>
            {QUESTIONS.map((q, i) => (
              <Card key={i}><CardContent className="pt-4">
                <div className="text-sm font-medium text-slate-700 mb-3"><span className="text-violet-500 mr-1">{i + 1}.</span>{q}</div>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5, 6].map((v) => (
                    <button key={v} onClick={() => setAnswers((a) => a.map((x, j) => (j === i ? v : x)))}
                      className={`flex-1 h-10 rounded-lg border text-sm font-semibold transition ${answers[i] === v ? 'border-violet-500 bg-violet-600 text-white' : 'border-slate-200 text-slate-500 hover:border-violet-300'}`}>{v}</button>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-1"><span>Strongly disagree</span><span>Strongly agree</span></div>
              </CardContent></Card>
            ))}
            <Button className="h-11 bg-violet-600 hover:bg-violet-700 sticky bottom-3" disabled={!complete || submit.isPending} onClick={() => submit.mutate()}>
              {submit.isPending ? 'Scoring…' : `See my recovery capital (${total}/60)`}
            </Button>
          </div>
        )}

        {step === 'done' && result && (
          <Card><CardContent className="py-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: result.color + '22', color: result.color }}><CheckCircle2 className="w-9 h-9" /></div>
            <div className="text-4xl font-bold text-slate-800">{total}<span className="text-lg text-slate-400"> / 60</span></div>
            <Badge className="mt-2" style={{ background: result.color + '22', color: result.color }}>{result.label} · {result.tag}</Badge>
            <p className="text-slate-600 mt-4 max-w-md text-sm leading-relaxed">{result.insight}</p>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" onClick={reset}><RotateCcw className="w-4 h-4 mr-1" /> New assessment</Button>
            </div>
            <p className="text-xs text-slate-400 mt-5 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Saved to your record — your coach can see your progress over time.</p>
          </CardContent></Card>
        )}

        <p className="text-center text-xs text-slate-400 mt-6">Peer-based recovery support · not medical or mental-health treatment. In crisis? Call or text 988.</p>
      </div>
    </div>
  );
}
