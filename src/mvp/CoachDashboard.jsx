import React, { useState } from 'react';
import { db } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, UserPlus, MessageSquare, CalendarClock, CalendarPlus, ArrowLeft, CheckCircle2, Clock, Inbox } from 'lucide-react';
import Messaging from '@/mvp/Messaging';

/**
 * CoachDashboard — the coach side of the MVP.
 * See participants who aren't matched with a coach yet and claim them; work a
 * caseload (message, view intake/BARC-10, schedule the sessions they request);
 * and see all upcoming sessions. Only the coach sets a session's day and time.
 */
export default function CoachDashboard({ me }) {
  const qc = useQueryClient();
  const [openParticipant, setOpenParticipant] = useState(null);

  const { data: participants = [] } = useQuery({ queryKey: ['mvp_all_participants'], queryFn: () => db.entities.Participant.list('-created_date'), refetchInterval: 6000 });
  const { data: requests = [] } = useQuery({ queryKey: ['mvp_coach_reqs', me.email], queryFn: () => db.entities.MvpSessionRequest.filter({ coach_email: me.email }, '-created_date'), refetchInterval: 6000 });
  const { data: sessions = [] } = useQuery({ queryKey: ['mvp_coach_sessions', me.email], queryFn: () => db.entities.MvpSession.filter({ coach_email: me.email }, 'scheduled_at'), refetchInterval: 6000 });

  const ready = participants.filter((p) => p.intake_complete && p.barc10_complete);
  const unassigned = ready.filter((p) => !p.assigned_coach_email);
  const mine = participants.filter((p) => (p.assigned_coach_email || '').toLowerCase() === me.email.toLowerCase());
  const pendingReq = requests.filter((r) => r.status === 'requested');
  const upcoming = sessions.filter((s) => s.status === 'scheduled' && s.scheduled_at && new Date(s.scheduled_at) >= new Date());

  const claim = useMutation({
    mutationFn: (p) => db.entities.Participant.update(p.id, { assigned_coach_email: me.email, assigned_coach_name: me.name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mvp_all_participants'] }),
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Coach dashboard</h1>
          <p className="text-slate-500 text-sm">Walk beside the people you serve.</p>
        </div>
        <div className="flex gap-2">
          <Stat n={mine.length} label="My participants" />
          <Stat n={unassigned.length} label="Unassigned" amber={unassigned.length > 0} />
          <Stat n={pendingReq.length} label="Session requests" amber={pendingReq.length > 0} />
        </div>
      </div>

      <Tabs defaultValue="unassigned">
        <TabsList className="mb-4">
          <TabsTrigger value="unassigned"><UserPlus className="w-4 h-4 mr-1" /> Unassigned {unassigned.length > 0 && <span className="ml-1 text-xs bg-amber-500 text-white rounded-full px-1.5">{unassigned.length}</span>}</TabsTrigger>
          <TabsTrigger value="mine"><Users className="w-4 h-4 mr-1" /> My participants</TabsTrigger>
          <TabsTrigger value="requests"><Inbox className="w-4 h-4 mr-1" /> Requests {pendingReq.length > 0 && <span className="ml-1 text-xs bg-rose-500 text-white rounded-full px-1.5">{pendingReq.length}</span>}</TabsTrigger>
          <TabsTrigger value="sessions"><CalendarClock className="w-4 h-4 mr-1" /> Upcoming</TabsTrigger>
        </TabsList>

        <TabsContent value="unassigned">
          {unassigned.length === 0 ? <Empty text="No unmatched participants right now. Nicely done." /> : (
            <div className="grid sm:grid-cols-2 gap-3">
              {unassigned.map((p) => (
                <Card key={p.id}><CardContent className="p-4 flex items-center gap-3">
                  <Avatar name={p.full_name} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 truncate">{p.full_name}</div>
                    <div className="text-xs text-slate-500">Intake ✓ · BARC-10 ✓{p.barc10_score ? ` · score ${p.barc10_score}` : ''}{p.county ? ` · ${p.county}` : ''}</div>
                  </div>
                  <Button size="sm" className="bg-teal-600 hover:bg-teal-700" disabled={claim.isPending} onClick={() => claim.mutate(p)}>Assign to me</Button>
                </CardContent></Card>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-400 mt-3">Only participants who've completed intake and the BARC-10 appear here.</p>
        </TabsContent>

        <TabsContent value="mine">
          {mine.length === 0 ? <Empty text="No participants yet. Claim someone from the Unassigned tab." /> : (
            <div className="grid sm:grid-cols-2 gap-3">
              {mine.map((p) => (
                <button key={p.id} onClick={() => setOpenParticipant(p)} className="text-left">
                  <Card className="hover:border-teal-300 transition"><CardContent className="p-4 flex items-center gap-3">
                    <Avatar name={p.full_name} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 truncate">{p.full_name}</div>
                      <div className="text-xs text-slate-500">{p.email}{p.barc10_score ? ` · BARC-10 ${p.barc10_score}` : ''}</div>
                    </div>
                    <MessageSquare className="w-4 h-4 text-slate-400" />
                  </CardContent></Card>
                </button>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests">
          {pendingReq.length === 0 ? <Empty text="No session requests waiting." /> : (
            <div className="space-y-2">
              {pendingReq.map((r) => <RequestRow key={r.id} req={r} me={me} onDone={() => { qc.invalidateQueries({ queryKey: ['mvp_coach_reqs', me.email] }); qc.invalidateQueries({ queryKey: ['mvp_coach_sessions', me.email] }); }} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sessions">
          {upcoming.length === 0 ? <Empty text="No upcoming sessions scheduled." /> : (
            <div className="space-y-2">
              {upcoming.map((s) => (
                <Card key={s.id}><CardContent className="p-3.5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center"><CheckCircle2 className="w-5 h-5" /></div>
                  <div className="flex-1"><div className="font-semibold text-slate-800">{format(new Date(s.scheduled_at), 'EEEE, MMM d · h:mm a')}</div><div className="text-xs text-slate-500">with {s.participant_name}</div></div>
                  <Badge className="bg-teal-100 text-teal-700">Scheduled</Badge>
                </CardContent></Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {openParticipant && <ParticipantPanel participant={openParticipant} me={me} onClose={() => setOpenParticipant(null)} />}
    </div>
  );
}

const Stat = ({ n, label, amber }) => (
  <div className={`rounded-xl border px-3.5 py-2 text-center ${amber ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'}`}>
    <div className={`text-xl font-bold ${amber ? 'text-amber-600' : 'text-slate-800'}`}>{n}</div>
    <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
  </div>
);
const Avatar = ({ name }) => (
  <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-semibold flex-shrink-0">
    {(name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
  </div>
);
const Empty = ({ text }) => <Card className="border-dashed"><CardContent className="py-14 text-center text-slate-500">{text}</CardContent></Card>;

function RequestRow({ req, me, onDone }) {
  const [when, setWhen] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const schedule = useMutation({
    mutationFn: async () => {
      await db.entities.MvpSession.create({
        request_id: req.id, participant_id: req.participant_id, participant_email: req.participant_email, participant_name: req.participant_name,
        coach_email: me.email, coach_name: me.name, scheduled_at: new Date(when).toISOString(), status: 'scheduled',
      });
      await db.entities.MvpSessionRequest.update(req.id, { status: 'scheduled' });
    },
    onSuccess: onDone,
  });
  const decline = useMutation({ mutationFn: () => db.entities.MvpSessionRequest.update(req.id, { status: 'declined' }), onSuccess: onDone });

  return (
    <Card><CardContent className="p-4">
      <div className="flex items-center gap-3">
        <Avatar name={req.participant_name} />
        <div className="flex-1"><div className="font-semibold text-slate-800">{req.participant_name}</div><div className="text-xs text-slate-500">Requested a session{req.note ? ` · "${req.note}"` : ''}</div></div>
        {!scheduling && <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={() => setScheduling(true)}><CalendarPlus className="w-4 h-4 mr-1" /> Schedule</Button>}
      </div>
      {scheduling && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input type="datetime-local" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" value={when} onChange={(e) => setWhen(e.target.value)} />
          <Button size="sm" className="bg-teal-600 hover:bg-teal-700" disabled={!when || schedule.isPending} onClick={() => schedule.mutate()}>{schedule.isPending ? 'Saving…' : 'Confirm time'}</Button>
          <Button size="sm" variant="ghost" className="text-slate-400" onClick={() => setScheduling(false)}>Cancel</Button>
          <Button size="sm" variant="ghost" className="text-rose-500 ml-auto" onClick={() => decline.mutate()}>Decline</Button>
        </div>
      )}
    </CardContent></Card>
  );
}

function ParticipantPanel({ participant, me, onClose }) {
  const email = (participant.email || '').toLowerCase();
  const { data: intakes = [] } = useQuery({ queryKey: ['mvp_intake', email], queryFn: () => db.entities.ParticipantIntake.filter({ email }) });
  const { data: barc = [] } = useQuery({ queryKey: ['mvp_barc', email], queryFn: () => db.entities.Barc10Assessment.filter({ participant_id: participant.id }, '-date') });
  const intake = intakes[0]; const b = barc[0];

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}><DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle className="flex items-center gap-2"><Avatar name={participant.full_name} /> {participant.full_name}</DialogTitle></DialogHeader>
      <div className="grid md:grid-cols-2 gap-4 mt-2">
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Snapshot</div>
          <div className="rounded-xl border border-slate-100 p-3 text-sm space-y-1">
            <div><span className="text-slate-400">Email:</span> {participant.email || '—'}</div>
            {b && <div><span className="text-slate-400">BARC-10:</span> <b className="text-teal-700">{b.total}/60</b> · {b.soil_type}</div>}
            {intake?.county && <div><span className="text-slate-400">County:</span> {intake.county}</div>}
            {intake?.housing_status && <div><span className="text-slate-400">Housing:</span> {intake.housing_status}</div>}
            {intake?.referral_source && <div><span className="text-slate-400">Referred by:</span> {intake.referral_source}</div>}
            {intake?.intake_notes && <div className="pt-1 text-slate-600 italic">“{intake.intake_notes}”</div>}
          </div>
          {b?.insight && <div className="mt-3 rounded-xl bg-teal-50 border border-teal-100 p-3 text-sm text-teal-800">{b.insight}</div>}
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Messages</div>
          <Messaging participantEmail={email} participantId={participant.id} participantName={participant.full_name} me={me} height={300} />
        </div>
      </div>
    </DialogContent></Dialog>
  );
}
