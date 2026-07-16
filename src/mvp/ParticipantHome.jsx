import React, { useState } from 'react';
import { db } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HeartHandshake, CalendarClock, MessageSquare, CheckCircle2, Send, Clock } from 'lucide-react';
import Intake from '@/pages/Intake';
import BARC10 from '@/pages/BARC10';
import Messaging from '@/mvp/Messaging';

/**
 * ParticipantHome — the participant side of the MVP.
 * Requires intake, then the BARC-10, before the home unlocks. Then: see your
 * coach (or "being matched"), message them, request a session, and see your
 * upcoming sessions.
 */
export default function ParticipantHome({ acct }) {
  const qc = useQueryClient();
  const email = (acct.email || '').toLowerCase();

  const { data: pRows = [], isLoading } = useQuery({
    queryKey: ['mvp_participant', email], queryFn: () => db.entities.Participant.filter({ email }), refetchInterval: 8000,
  });
  const participant = pRows[0];

  const mark = useMutation({
    mutationFn: (patch) => db.entities.Participant.update(participant.id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mvp_participant', email] }),
  });

  if (isLoading || !participant) {
    return <div className="text-center text-slate-400 py-20">Loading your space…</div>;
  }

  // Required steps
  if (!participant.intake_complete) {
    return (
      <StepFrame step={1} title="First, a short intake" sub="Tell us a little about you. Most of it is optional.">
        <Intake prefill={acct} onComplete={() => mark.mutate({ intake_complete: true })} />
      </StepFrame>
    );
  }
  if (!participant.barc10_complete) {
    return (
      <StepFrame step={2} title="Now a quick strengths check-in" sub="The BARC-10 — ten short statements. There are no wrong answers.">
        <BARC10 prefill={acct} onComplete={() => mark.mutate({ barc10_complete: true })} />
      </StepFrame>
    );
  }
  return <Dashboard participant={participant} acct={acct} />;
}

function StepFrame({ step, title, sub, children }) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        {[1, 2].map((n) => <div key={n} className={`h-1.5 flex-1 rounded-full ${n <= step ? 'bg-teal-500' : 'bg-slate-200'}`} />)}
      </div>
      <div className="text-xs uppercase tracking-widest text-teal-600 font-semibold">Step {step} of 2</div>
      <h1 className="text-2xl font-bold text-slate-800 mt-1">{title}</h1>
      <p className="text-slate-500 text-sm mb-4">{sub}</p>
      {children}
    </div>
  );
}

function Dashboard({ participant, acct }) {
  const qc = useQueryClient();
  const email = (acct.email || '').toLowerCase();
  const meName = [acct.first_name, acct.last_name].filter(Boolean).join(' ').trim() || participant.full_name;
  const assigned = !!participant.assigned_coach_email;
  const [note, setNote] = useState('');

  const { data: requests = [] } = useQuery({ queryKey: ['mvp_myreqs', email], queryFn: () => db.entities.MvpSessionRequest.filter({ participant_email: email }, '-created_date'), refetchInterval: 6000 });
  const { data: sessions = [] } = useQuery({ queryKey: ['mvp_mysessions', email], queryFn: () => db.entities.MvpSession.filter({ participant_email: email }, 'scheduled_at'), refetchInterval: 6000 });
  const upcoming = sessions.filter((s) => s.status === 'scheduled' && s.scheduled_at && new Date(s.scheduled_at) >= new Date());
  const pendingReq = requests.filter((r) => r.status === 'requested');

  const requestSession = useMutation({
    mutationFn: () => db.entities.MvpSessionRequest.create({
      participant_id: participant.id, participant_email: email, participant_name: meName,
      coach_email: participant.assigned_coach_email, coach_name: participant.assigned_coach_name,
      note: note.trim(), status: 'requested',
    }),
    onSuccess: () => { setNote(''); qc.invalidateQueries({ queryKey: ['mvp_myreqs', email] }); },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Welcome back, {acct.first_name || meName}.</h1>
      <p className="text-slate-500 text-sm">Your recovery, your way — your coach is here with you.</p>

      <Card className="mt-4" style={{ borderLeft: '4px solid #0f766e' }}>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center"><HeartHandshake className="w-5 h-5" /></div>
          <div className="flex-1">
            {assigned
              ? <><div className="text-xs text-slate-400 uppercase tracking-wide">Your coach</div><div className="font-semibold text-slate-800">{participant.assigned_coach_name}</div></>
              : <><div className="font-semibold text-slate-800">We're matching you with a coach</div><div className="text-sm text-slate-500">A GFA coach will connect with you soon. You'll be able to message and request sessions once matched.</div></>}
          </div>
          {assigned && <Badge className="bg-teal-100 text-teal-700">Matched</Badge>}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2"><MessageSquare className="w-4 h-4 text-teal-600" /> Messages{assigned ? ` with ${participant.assigned_coach_name}` : ''}</div>
          {assigned
            ? <Messaging participantEmail={email} participantId={participant.id} participantName={meName} me={{ role: 'participant', email, name: meName }} height={360} />
            : <Card><CardContent className="py-12 text-center text-slate-400 text-sm">Messaging opens once a coach is matched with you.</CardContent></Card>}
        </div>

        <div className="space-y-4">
          <Card><CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2"><CalendarClock className="w-4 h-4 text-teal-600" /> Request a session</div>
            {assigned ? (
              <>
                <textarea className="w-full rounded-lg border border-slate-200 p-2.5 text-sm" rows={2} placeholder="Anything you'd like to focus on? (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
                <Button className="w-full mt-2 bg-teal-600 hover:bg-teal-700" disabled={requestSession.isPending} onClick={() => requestSession.mutate()}>
                  {requestSession.isPending ? 'Sending…' : <><Send className="w-4 h-4 mr-1" /> Request a session</>}
                </Button>
                <p className="text-[11px] text-slate-400 mt-2">Your coach will pick a day and time and you'll see it below.</p>
              </>
            ) : <div className="text-sm text-slate-400 py-2">Available once you're matched with a coach.</div>}
            {pendingReq.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {pendingReq.map((r) => <div key={r.id} className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5"><Clock className="w-3.5 h-3.5" /> Requested — waiting for your coach to schedule{r.note ? ` · "${r.note}"` : ''}</div>)}
              </div>
            )}
          </CardContent></Card>

          <Card><CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2"><CalendarClock className="w-4 h-4 text-teal-600" /> Upcoming sessions</div>
            {upcoming.length === 0 ? <div className="text-sm text-slate-400 py-2">No sessions scheduled yet.</div> : (
              <div className="space-y-2">
                {upcoming.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 rounded-lg border border-slate-100 p-2.5">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center"><CheckCircle2 className="w-5 h-5" /></div>
                    <div><div className="font-semibold text-slate-800 text-sm">{format(new Date(s.scheduled_at), 'EEEE, MMM d · h:mm a')}</div><div className="text-xs text-slate-500">with {s.coach_name}</div></div>
                  </div>
                ))}
              </div>
            )}
          </CardContent></Card>
        </div>
      </div>
    </div>
  );
}
