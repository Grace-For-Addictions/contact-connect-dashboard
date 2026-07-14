import React, { useState } from 'react';
import { db } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isAfter, parseISO } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarDays, Plus, MapPin, Users, Check } from 'lucide-react';

/**
 * Events Wall — community events (jobs, workshops, gatherings, meetings).
 * Post events, RSVP (increments rsvp_count + records an event_rsvps row).
 * Google Calendar / Twilio reminders are connect-points for later.
 */
const CATS = {
  meeting:   { label: 'Meeting',    color: '#0f766e' },
  workshop:  { label: 'Workshop',   color: '#7c3aed' },
  job:       { label: 'Job / Career', color: '#c8972a' },
  gathering: { label: 'Gathering',  color: '#2563eb' },
};

export default function EventsWall() {
  const qc = useQueryClient();
  const [dialog, setDialog] = useState(false);
  const [rsvpFor, setRsvpFor] = useState(null);
  const { data: events = [] } = useQuery({ queryKey: ['events'], queryFn: () => db.entities.CommunityEvent.list('event_date') });

  const create = useMutation({
    mutationFn: (row) => db.entities.CommunityEvent.create({ ...row, rsvp_count: 0, created_by: 'community' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); setDialog(false); },
  });
  const rsvp = useMutation({
    mutationFn: async ({ event, name }) => {
      await db.entities.EventRsvp.create({ event_id: event.id, participant_name: name, created_by: 'community' });
      return db.entities.CommunityEvent.update(event.id, { rsvp_count: (event.rsvp_count || 0) + 1 });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); setRsvpFor(null); },
  });

  const upcoming = events.filter((e) => !e.event_date || isAfter(parseISO(e.event_date), new Date()));
  const past = events.filter((e) => e.event_date && !isAfter(parseISO(e.event_date), new Date()));

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 text-teal-600 font-semibold text-xs tracking-widest uppercase"><CalendarDays className="w-4 h-4" /> Community</div>
          <h1 className="text-3xl font-bold text-slate-800 mt-1">Events Wall</h1>
          <p className="text-slate-500 mt-1">Workshops, meetings, jobs, and gatherings across the community.</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => setDialog(true)}><Plus className="w-4 h-4 mr-1" /> Post an event</Button>
      </div>

      {events.length === 0 && <Card className="border-dashed"><CardContent className="py-16 text-center text-slate-500">No events posted yet. Be the first.</CardContent></Card>}

      {upcoming.length > 0 && <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Upcoming</h2>}
      <div className="flex flex-col gap-3">
        {upcoming.map((e) => <EventCard key={e.id} e={e} onRsvp={() => setRsvpFor(e)} />)}
      </div>

      {past.length > 0 && <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3 mt-8">Past</h2>}
      <div className="flex flex-col gap-3 opacity-60">
        {past.map((e) => <EventCard key={e.id} e={e} past />)}
      </div>

      {dialog && <EventDialog onClose={() => setDialog(false)} onSave={(r) => create.mutate(r)} pending={create.isPending} />}
      {rsvpFor && <RsvpDialog event={rsvpFor} onClose={() => setRsvpFor(null)} onSave={(name) => rsvp.mutate({ event: rsvpFor, name })} pending={rsvp.isPending} />}
    </div>
  );
}

function EventCard({ e, onRsvp, past }) {
  const c = CATS[e.category] || CATS.gathering;
  return (
    <Card style={{ borderLeft: `4px solid ${c.color}` }}><CardContent className="p-4 flex flex-wrap items-center gap-4">
      <div className="flex-1 min-w-[200px]">
        <div className="flex items-center gap-2 mb-1">
          <Badge style={{ background: c.color + '22', color: c.color }}>{c.label}</Badge>
          {e.event_date && <span className="text-xs text-slate-500">{format(parseISO(e.event_date), 'EEE, MMM d · h:mm a')}</span>}
        </div>
        <div className="font-semibold text-slate-800">{e.title}</div>
        {e.description && <p className="text-sm text-slate-500 mt-0.5">{e.description}</p>}
        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1.5">
          {e.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {e.location}</span>}
          {e.host && <span>Hosted by {e.host}</span>}
          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {e.rsvp_count || 0} going</span>
        </div>
      </div>
      {!past && <Button size="sm" variant="outline" onClick={onRsvp}>RSVP</Button>}
    </CardContent></Card>
  );
}

function EventDialog({ onClose, onSave, pending }) {
  const [f, setF] = useState({ title: '', description: '', category: 'workshop', event_date: '', location: '', host: '', county: '' });
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}><DialogContent className="max-w-md">
      <DialogHeader><DialogTitle>Post an event</DialogTitle></DialogHeader>
      <Label className="text-xs text-slate-500">Title</Label>
      <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      <Label className="text-xs text-slate-500 mt-2">Description</Label>
      <textarea className="w-full rounded-md border border-slate-200 p-2 text-sm mt-1" rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
      <div className="grid grid-cols-2 gap-3 mt-2">
        <div><Label className="text-xs text-slate-500">Category</Label>
          <select className="w-full mt-1 rounded-md border border-slate-200 p-2 text-sm" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
            {Object.entries(CATS).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
          </select></div>
        <div><Label className="text-xs text-slate-500">Date &amp; time</Label><Input type="datetime-local" className="mt-1" value={f.event_date} onChange={(e) => setF({ ...f, event_date: e.target.value })} /></div>
        <div><Label className="text-xs text-slate-500">Location</Label><Input className="mt-1" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} placeholder="Online / address" /></div>
        <div><Label className="text-xs text-slate-500">Host</Label><Input className="mt-1" value={f.host} onChange={(e) => setF({ ...f, host: e.target.value })} /></div>
      </div>
      <Button className="w-full mt-4 bg-teal-600 hover:bg-teal-700" disabled={pending || !f.title}
        onClick={() => onSave({ ...f, event_date: f.event_date ? new Date(f.event_date).toISOString() : null })}>
        {pending ? 'Posting…' : 'Post event'}
      </Button>
    </DialogContent></Dialog>
  );
}

function RsvpDialog({ event, onClose, onSave, pending }) {
  const [name, setName] = useState('');
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}><DialogContent className="max-w-sm">
      <DialogHeader><DialogTitle>RSVP — {event.title}</DialogTitle></DialogHeader>
      <Label className="text-xs text-slate-500">Your name</Label>
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="First and last name" />
      <Button className="w-full mt-4 bg-teal-600 hover:bg-teal-700" disabled={pending || !name.trim()} onClick={() => onSave(name)}>
        {pending ? 'Saving…' : <><Check className="w-4 h-4 mr-1" /> Count me in</>}
      </Button>
    </DialogContent></Dialog>
  );
}
