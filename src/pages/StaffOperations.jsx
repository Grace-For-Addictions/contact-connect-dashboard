import React, { useMemo, useState } from 'react';
import { db } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ShieldAlert, TestTube, FileWarning, Users2, Plus, Bell } from 'lucide-react';

const LEVEL = { 1: ['Minor', '#15803d'], 2: ['Moderate', '#b45309'], 3: ['Serious', '#b91c1c'], 4: ['Emergency', '#7f1d1d'] };

export default function StaffOperations() {
  const qc = useQueryClient();
  const [resFilter, setResFilter] = useState('all');
  const [dialog, setDialog] = useState(null); // 'screen' | 'incident' | 'meeting'

  const { data: residences = [] } = useQuery({ queryKey: ['so_res'], queryFn: () => db.entities.RrHouse.list('created_date') });
  const { data: residents = [] } = useQuery({ queryKey: ['so_residents'], queryFn: () => db.entities.RrResident.list() });
  const { data: checkins = [] } = useQuery({ queryKey: ['so_checkins'], queryFn: () => db.entities.CheckIn.list('-date') });
  const { data: screens = [] } = useQuery({ queryKey: ['so_screens'], queryFn: () => db.entities.DrugScreen.list('-date') });
  const { data: incidents = [] } = useQuery({ queryKey: ['so_incidents'], queryFn: () => db.entities.Incident.list('-date') });
  const { data: meetings = [] } = useQuery({ queryKey: ['so_meetings'], queryFn: () => db.entities.HouseMeeting.list('-date') });

  const inScope = (residenceId) => resFilter === 'all' || residenceId === resFilter;
  const resName = (id) => residences.find((r) => r.id === id)?.name || '—';

  const lastCheckIn = useMemo(() => {
    const m = {};
    checkins.forEach((c) => { if (c.participant_id && !m[c.participant_id]) m[c.participant_id] = c; });
    return m;
  }, [checkins]);

  const scopedResidents = residents.filter((r) => inScope(r.residence_id) || inScope(r.house_id));

  // Derived alerts
  const alerts = useMemo(() => {
    const out = [];
    screens.filter((s) => s.result === 'POS' && inScope(s.residence_id)).forEach((s) =>
      out.push({ level: 'high', icon: '🧪', text: `Positive screen — ${s.participant_name} (${resName(s.residence_id)})`, when: s.date }));
    incidents.filter((i) => i.status === 'open' && i.level >= 2 && inScope(i.residence_id)).forEach((i) =>
      out.push({ level: i.level >= 3 ? 'high' : 'med', icon: '📝', text: `Open Level ${i.level} incident — ${i.participant_name} (${i.incident_type || 'incident'})`, when: i.date }));
    residents.filter((r) => (r.status === 'resident') && (inScope(r.residence_id) || inScope(r.house_id))).forEach((r) => {
      const ci = lastCheckIn[r.participant_id];
      if (ci && ci.score <= 2) out.push({ level: 'high', icon: '💙', text: `Low mood — ${r.participant_name} checked in "${ci.mood}"`, when: ci.date });
    });
    residents.filter((r) => r.status === 'applicant' && (inScope(r.residence_id) || inScope(r.house_id))).forEach((r) =>
      out.push({ level: 'low', icon: '📋', text: `Intake in progress — ${r.participant_name} (${resName(r.house_id)})`, when: r.created_date?.slice(0, 10) }));
    const rank = { high: 0, med: 1, low: 2 };
    return out.sort((a, b) => rank[a.level] - rank[b.level]);
  }, [screens, incidents, residents, lastCheckIn, resFilter]); // eslint-disable-line

  const scopedScreens = screens.filter((s) => inScope(s.residence_id));
  const scopedIncidents = incidents.filter((i) => inScope(i.residence_id));
  const scopedMeetings = meetings.filter((m) => inScope(m.residence_id));

  const save = (table, key) => useMutation({
    mutationFn: (row) => db.entities[table].create({ ...row, created_by: 'staff' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [key] }); setDialog(null); },
  });
  const saveScreen = save('DrugScreen', 'so_screens');
  const saveIncident = save('Incident', 'so_incidents');
  const saveMeeting = save('HouseMeeting', 'so_meetings');

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 text-teal-700 font-semibold text-xs tracking-widest uppercase">
            <ShieldAlert className="w-4 h-4" /> Staff Operations
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mt-1">House Operations</h1>
          <p className="text-slate-500 mt-1">Alerts, drug screens, incidents, and house meetings across your residences.</p>
        </div>
        <Select value={resFilter} onValueChange={setResFilter}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All residences</SelectItem>
            {residences.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="alerts">
        <TabsList className="mb-4">
          <TabsTrigger value="alerts"><Bell className="w-4 h-4 mr-1" /> Alerts {alerts.length > 0 && <span className="ml-1 text-xs bg-rose-500 text-white rounded-full px-1.5">{alerts.length}</span>}</TabsTrigger>
          <TabsTrigger value="screens"><TestTube className="w-4 h-4 mr-1" /> Drug Screens</TabsTrigger>
          <TabsTrigger value="incidents"><FileWarning className="w-4 h-4 mr-1" /> Incidents</TabsTrigger>
          <TabsTrigger value="meetings"><Users2 className="w-4 h-4 mr-1" /> Meetings</TabsTrigger>
        </TabsList>

        {/* ALERTS */}
        <TabsContent value="alerts">
          {alerts.length === 0 ? <Empty text="No active alerts. All clear." /> : (
            <div className="flex flex-col gap-2">
              {alerts.map((a, i) => (
                <Card key={i}><CardContent className="p-3.5 flex items-center gap-3"
                  style={{ borderLeft: `4px solid ${a.level === 'high' ? '#b91c1c' : a.level === 'med' ? '#b45309' : '#0f766e'}` }}>
                  <span className="text-xl">{a.icon}</span>
                  <span className="flex-1 text-sm text-slate-700 font-medium">{a.text}</span>
                  <Badge variant="outline" className={a.level === 'high' ? 'text-rose-600 border-rose-300' : a.level === 'med' ? 'text-amber-600 border-amber-300' : 'text-teal-600 border-teal-300'}>
                    {a.level === 'high' ? 'High' : a.level === 'med' ? 'Med' : 'Info'}
                  </Badge>
                  <span className="text-xs text-slate-400 w-20 text-right">{a.when}</span>
                </CardContent></Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* DRUG SCREENS */}
        <TabsContent value="screens">
          <Toolbar label="Log drug screen" onClick={() => setDialog('screen')} />
          <LogList rows={scopedScreens} empty="No screens logged yet." render={(s) => (
            <>
              <b className="text-slate-800">{s.participant_name}</b>
              <span className="text-slate-500">{resName(s.residence_id)} · {s.screen_type} · {s.date}</span>
              <Badge className={s.result === 'NEG' ? 'bg-teal-100 text-teal-700' : s.result === 'POS' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}>{s.result}</Badge>
            </>
          )} />
        </TabsContent>

        {/* INCIDENTS */}
        <TabsContent value="incidents">
          <Toolbar label="New incident report" onClick={() => setDialog('incident')} />
          <LogList rows={scopedIncidents} empty="No incidents logged." render={(i) => (
            <>
              <b className="text-slate-800">{i.participant_name || '—'}</b>
              <span className="text-slate-500">{resName(i.residence_id)} · {i.incident_type} · {i.date}</span>
              <Badge style={{ background: (LEVEL[i.level]?.[1] || '#64748b') + '22', color: LEVEL[i.level]?.[1] }}>Lvl {i.level} · {LEVEL[i.level]?.[0]}</Badge>
              <Badge variant="outline" className={i.status === 'open' ? 'text-amber-600 border-amber-300' : 'text-teal-600 border-teal-300'}>{i.status}</Badge>
            </>
          )} />
        </TabsContent>

        {/* MEETINGS */}
        <TabsContent value="meetings">
          <Toolbar label="Log house meeting" onClick={() => setDialog('meeting')} />
          <LogList rows={scopedMeetings} empty="No meetings logged." render={(m) => (
            <>
              <b className="text-slate-800">{resName(m.residence_id)}</b>
              <span className="text-slate-500">{m.date} · {m.facilitator || 'facilitator TBD'} · {m.attendees_count} attended</span>
              <span className="text-slate-400 text-xs truncate max-w-xs">{m.agenda}</span>
            </>
          )} />
        </TabsContent>
      </Tabs>

      {dialog === 'screen' && <ScreenDialog residents={scopedResidents} residences={residences} onClose={() => setDialog(null)} onSave={(r) => saveScreen.mutate(r)} pending={saveScreen.isPending} />}
      {dialog === 'incident' && <IncidentDialog residents={scopedResidents} residences={residences} onClose={() => setDialog(null)} onSave={(r) => saveIncident.mutate(r)} pending={saveIncident.isPending} />}
      {dialog === 'meeting' && <MeetingDialog residences={residences} onClose={() => setDialog(null)} onSave={(r) => saveMeeting.mutate(r)} pending={saveMeeting.isPending} />}
    </div>
  );
}

const Toolbar = ({ label, onClick }) => (
  <div className="flex justify-end mb-3"><Button className="bg-teal-600 hover:bg-teal-700" onClick={onClick}><Plus className="w-4 h-4 mr-1" /> {label}</Button></div>
);
const Empty = ({ text }) => (
  <Card className="border-dashed"><CardContent className="py-12 text-center text-slate-500">{text}</CardContent></Card>
);
const LogList = ({ rows, render, empty }) => rows.length === 0 ? <Empty text={empty} /> : (
  <div className="rounded-xl border border-slate-100 divide-y divide-slate-100 bg-white">
    {rows.map((r) => <div key={r.id} className="px-4 py-3 flex flex-wrap items-center gap-3 text-sm">{render(r)}</div>)}
  </div>
);

function residentPicker(residents) {
  return residents.map((r) => ({ id: r.id, name: r.participant_name, pid: r.participant_id, residence_id: r.residence_id || r.house_id }));
}
const F = ({ label, ...p }) => (<div><Label className="text-xs text-slate-500">{label}</Label><Input className="mt-1" {...p} /></div>);
const TA = ({ label, value, onChange, rows = 3 }) => (
  <div className="col-span-2"><Label className="text-xs text-slate-500">{label}</Label>
    <textarea className="mt-1 w-full rounded-md border border-slate-200 p-2 text-sm" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} /></div>
);

function ScreenDialog({ residents, residences, onClose, onSave, pending }) {
  const opts = residentPicker(residents);
  const [f, setF] = useState({ resident: '', screen_type: 'standard', result: 'NEG', administered_by: '', notes: '' });
  const submit = () => {
    const r = opts.find((o) => o.id === f.resident);
    onSave({ resident_id: r?.id, participant_id: r?.pid, participant_name: r?.name, residence_id: r?.residence_id,
      screen_type: f.screen_type, result: f.result, administered_by: f.administered_by, notes: f.notes,
      date: format(new Date(), 'yyyy-MM-dd') });
  };
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}><DialogContent className="max-w-md">
      <DialogHeader><DialogTitle>Log drug screen</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Label className="text-xs text-slate-500">Resident</Label>
          <Select value={f.resident} onValueChange={(v) => setF({ ...f, resident: v })}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select resident" /></SelectTrigger>
            <SelectContent>{opts.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
          </Select></div>
        <div><Label className="text-xs text-slate-500">Type</Label>
          <Select value={f.screen_type} onValueChange={(v) => setF({ ...f, screen_type: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{['standard', 'random', 'follow-up'].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
        <div><Label className="text-xs text-slate-500">Result</Label>
          <Select value={f.result} onValueChange={(v) => setF({ ...f, result: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{['NEG', 'POS', 'REF', 'INV'].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
        <div className="col-span-2"><F label="Administered by" value={f.administered_by} onChange={(e) => setF({ ...f, administered_by: e.target.value })} /></div>
        <TA label="Notes (required for positive results — per RTU protocol)" value={f.notes} onChange={(v) => setF({ ...f, notes: v })} rows={2} />
      </div>
      <Button className="w-full mt-2 bg-teal-600 hover:bg-teal-700" disabled={!f.resident || pending} onClick={submit}>{pending ? 'Saving…' : 'Save screen'}</Button>
    </DialogContent></Dialog>
  );
}

function IncidentDialog({ residents, residences, onClose, onSave, pending }) {
  const opts = residentPicker(residents);
  const [f, setF] = useState({ resident: '', level: '1', incident_type: '', description: '', action_taken: '', followup: '' });
  const submit = () => {
    const r = opts.find((o) => o.id === f.resident);
    onSave({ resident_id: r?.id, participant_id: r?.pid, participant_name: r?.name, residence_id: r?.residence_id,
      level: Number(f.level), incident_type: f.incident_type, description: f.description, action_taken: f.action_taken,
      followup: f.followup, status: 'open', date: format(new Date(), 'yyyy-MM-dd') });
  };
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}><DialogContent className="max-w-lg max-h-[88vh] overflow-y-auto">
      <DialogHeader><DialogTitle>New incident report</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-slate-500">Resident</Label>
          <Select value={f.resident} onValueChange={(v) => setF({ ...f, resident: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{opts.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent></Select></div>
        <div><Label className="text-xs text-slate-500">Level</Label>
          <Select value={f.level} onValueChange={(v) => setF({ ...f, level: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{[1, 2, 3, 4].map((l) => <SelectItem key={l} value={String(l)}>Level {l} — {LEVEL[l][0]}</SelectItem>)}</SelectContent></Select></div>
        <div className="col-span-2"><F label="Incident type" value={f.incident_type} onChange={(e) => setF({ ...f, incident_type: e.target.value })} placeholder="e.g. Curfew, Positive screen, Altercation" /></div>
        <TA label="Description (observable facts only, person-first language)" value={f.description} onChange={(v) => setF({ ...f, description: v })} rows={3} />
        <TA label="Immediate actions taken" value={f.action_taken} onChange={(v) => setF({ ...f, action_taken: v })} rows={2} />
        <TA label="Follow-up plan" value={f.followup} onChange={(v) => setF({ ...f, followup: v })} rows={2} />
      </div>
      <Button className="w-full mt-2 bg-teal-600 hover:bg-teal-700" disabled={!f.resident || pending} onClick={submit}>{pending ? 'Saving…' : 'Submit report'}</Button>
    </DialogContent></Dialog>
  );
}

function MeetingDialog({ residences, onClose, onSave, pending }) {
  const [f, setF] = useState({ residence_id: residences[0]?.id || '', date: format(new Date(), 'yyyy-MM-dd'), facilitator: '', attendees_count: '', agenda: '', notes: '' });
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}><DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>Log house meeting</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-slate-500">Residence</Label>
          <Select value={f.residence_id} onValueChange={(v) => setF({ ...f, residence_id: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{residences.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent></Select></div>
        <F label="Date" type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
        <F label="Facilitator" value={f.facilitator} onChange={(e) => setF({ ...f, facilitator: e.target.value })} />
        <F label="Attendees" type="number" value={f.attendees_count} onChange={(e) => setF({ ...f, attendees_count: e.target.value })} />
        <TA label="Agenda / highlights" value={f.agenda} onChange={(v) => setF({ ...f, agenda: v })} rows={2} />
        <TA label="Notes" value={f.notes} onChange={(v) => setF({ ...f, notes: v })} rows={2} />
      </div>
      <Button className="w-full mt-2 bg-teal-600 hover:bg-teal-700" disabled={!f.residence_id || pending}
        onClick={() => onSave({ ...f, attendees_count: Number(f.attendees_count) || 0 })}>{pending ? 'Saving…' : 'Save meeting'}</Button>
    </DialogContent></Dialog>
  );
}
