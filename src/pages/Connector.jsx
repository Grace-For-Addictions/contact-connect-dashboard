import React, { useMemo, useState } from 'react';
import { db } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Network, Search, MapPin, Plus, BedDouble, ArrowRight, Check } from 'lucide-react';
import { ENTRY_TYPES } from '@/lib/lookups';
import { getIdentity, canEnter } from '@/lib/identity';

/**
 * Connector — the Grace & Company recovery network directory.
 * Combines user-managed directory_entries with the live recovery residences
 * (rr_houses) so partners, participants, and coaches can search everything
 * recovery — residences, RCCs, support services, wellness centers, faith
 * communities, allies — and request a warm connection. Staff can add entries.
 */
export default function Connector() {
  const qc = useQueryClient();
  const acct = getIdentity();
  const isStaff = canEnter('staff', acct);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [detail, setDetail] = useState(null);
  const [addOpen, setAddOpen] = useState(false);

  const { data: entries = [] } = useQuery({ queryKey: ['directory'], queryFn: () => db.entities.DirectoryEntry.list('-created_date') });
  const { data: houses = [] } = useQuery({ queryKey: ['dir_houses'], queryFn: () => db.entities.RrHouse.list('created_date') });

  // Fold live residences into the directory (read-only entries).
  const all = useMemo(() => {
    const mappedHouses = houses.map((h) => ({
      id: 'house_' + h.id, entry_type: 'res', name: h.name, city: h.city || 'Iowa',
      availability: (h.total_beds || 0) > 0 ? 'open' : 'wait',
      blurb: `${h.house_type || 'Recovery'} recovery residence operated within the GFA network.`,
      tags: [h.house_type, h.total_beds ? `${h.total_beds} beds` : null, 'GFA network'].filter(Boolean),
      beds: h.total_beds, live: true,
    }));
    return [...entries, ...mappedHouses];
  }, [entries, houses]);

  const shown = all.filter((e) =>
    (filter === 'all' || e.entry_type === filter) &&
    `${e.name} ${e.city} ${e.blurb} ${(e.tags || []).join(' ')}`.toLowerCase().includes(q.toLowerCase())
  );

  const addEntry = useMutation({
    mutationFn: (row) => db.entities.DirectoryEntry.create({ ...row, created_by: 'staff' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['directory'] }); setAddOpen(false); },
  });

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 text-teal-600 font-semibold text-xs tracking-widest uppercase"><Network className="w-4 h-4" /> The Connector · Community Directory</div>
          <h1 className="text-3xl font-bold text-slate-800 mt-1">Everything recovery, in one network</h1>
          <p className="text-slate-500 mt-1">Residences, recovery community centers, support services, wellness centers, faith communities, and allies — searchable and accepting in real time.</p>
        </div>
        {isStaff && <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => setAddOpen(true)}><Plus className="w-4 h-4 mr-1" /> Add to directory</Button>}
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
        <Input className="pl-9 h-11" placeholder="Search by name, service, city, or need…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        <Chip on={filter === 'all'} onClick={() => setFilter('all')}>All</Chip>
        {Object.entries(ENTRY_TYPES).map(([k, v]) => (
          <Chip key={k} on={filter === k} onClick={() => setFilter(k)} color={v.color}>{v.label}</Chip>
        ))}
      </div>

      {shown.length === 0 ? (
        <Card className="border-dashed mt-6"><CardContent className="py-16 text-center text-slate-500">No matches yet — try a different need or city.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {shown.map((e) => {
            const ty = ENTRY_TYPES[e.entry_type] || ENTRY_TYPES.member;
            return (
              <button key={e.id} onClick={() => setDetail(e)} className="text-left">
                <Card className="h-full hover:border-teal-300 transition"><CardContent className="p-5">
                  <span className="text-[10px] font-mono uppercase tracking-wide px-2.5 py-1 rounded-full" style={{ background: ty.color + '1a', color: ty.color, border: `1px solid ${ty.color}55` }}>{ty.label}</span>
                  <h3 className="font-semibold text-slate-800 text-lg mt-3">{e.name}</h3>
                  <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {e.city}</div>
                  <p className="text-sm text-slate-500 mt-2 leading-snug line-clamp-3">{e.blurb}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">{(e.tags || []).slice(0, 4).map((t) => <span key={t} className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{t}</span>)}</div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                    <Avail a={e.availability} />
                    <span className="text-xs text-teal-600 font-medium flex items-center gap-1">View <ArrowRight className="w-3 h-3" /></span>
                  </div>
                </CardContent></Card>
              </button>
            );
          })}
        </div>
      )}

      {detail && <DetailDialog entry={detail} acct={acct} onClose={() => setDetail(null)} />}
      {addOpen && <AddDialog onClose={() => setAddOpen(false)} onSave={(r) => addEntry.mutate(r)} pending={addEntry.isPending} />}
    </div>
  );
}

const Chip = ({ on, onClick, color, children }) => (
  <button onClick={onClick} className={`text-xs font-mono uppercase tracking-wide px-3.5 py-2 rounded-full border transition flex items-center gap-2 ${on ? 'bg-teal-50 border-teal-400 text-teal-700' : 'border-slate-200 text-slate-500 hover:border-teal-300'}`}>
    {color && <span className="w-2 h-2 rounded-sm" style={{ background: color }} />}{children}
  </button>
);
const Avail = ({ a }) => a === 'open'
  ? <span className="text-xs font-mono flex items-center gap-1.5 text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Accepting</span>
  : <span className="text-xs font-mono flex items-center gap-1.5 text-amber-600"><span className="w-2 h-2 rounded-full bg-amber-500" /> Waitlist</span>;

function DetailDialog({ entry, acct, onClose }) {
  const qc = useQueryClient();
  const ty = ENTRY_TYPES[entry.entry_type] || ENTRY_TYPES.member;
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: [acct?.first_name, acct?.last_name].filter(Boolean).join(' '), email: acct?.email || '', note: '' });
  const request = useMutation({
    mutationFn: () => db.entities.ConnectionRequest.create({
      entry_id: String(entry.id), entry_name: entry.name, requester_name: form.name, requester_email: form.email,
      note: form.note, status: 'new', created_by: 'connector',
    }),
    onSuccess: () => { setSent(true); qc.invalidateQueries({ queryKey: ['directory'] }); },
  });

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}><DialogContent className="max-w-md max-h-[88vh] overflow-y-auto">
      <DialogHeader>
        <span className="text-[10px] font-mono uppercase tracking-wide px-2.5 py-1 rounded-full self-start" style={{ background: ty.color + '1a', color: ty.color, border: `1px solid ${ty.color}55` }}>{ty.label}</span>
        <DialogTitle className="text-xl mt-2">{entry.name}</DialogTitle>
      </DialogHeader>
      <div className="text-xs text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> {entry.city}</div>
      <p className="text-sm text-slate-600 mt-3 leading-relaxed">{entry.blurb}</p>
      <div className="mt-3"><Avail a={entry.availability} /></div>
      {entry.beds !== undefined && entry.beds !== null && (
        <div className="mt-3 rounded-lg bg-slate-50 border border-slate-100 p-3 flex items-center gap-2 text-sm text-slate-700"><BedDouble className="w-4 h-4 text-teal-600" /> <b>{entry.beds}</b> beds</div>
      )}
      {(entry.tags || []).length > 0 && <div className="flex flex-wrap gap-1.5 mt-3">{entry.tags.map((t) => <span key={t} className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{t}</span>)}</div>}
      {(entry.phone || entry.email || entry.url) && (
        <div className="text-xs text-slate-500 mt-3 space-y-0.5">
          {entry.phone && <div>📞 {entry.phone}</div>}{entry.email && <div>✉️ {entry.email}</div>}{entry.url && <div>🔗 {entry.url}</div>}
        </div>
      )}

      {sent ? (
        <div className="mt-5 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center text-sm text-emerald-800">
          <Check className="w-5 h-5 mx-auto mb-1" /> Request sent. A coordinator will reach out — person-first, no pressure, no judgment.
        </div>
      ) : (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <div className="font-semibold text-slate-700 text-sm mb-2">Request a warm connection</div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs text-slate-500">Your name</Label><Input className="mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label className="text-xs text-slate-500">Email or phone</Label><Input className="mt-1" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          </div>
          <textarea className="w-full mt-2 rounded-md border border-slate-200 p-2 text-sm" rows={2} placeholder="Anything you'd like them to know? (optional)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <Button className="w-full mt-3 bg-teal-600 hover:bg-teal-700" disabled={request.isPending || !form.name.trim()} onClick={() => request.mutate()}>
            {request.isPending ? 'Sending…' : 'Request a warm connection'}
          </Button>
        </div>
      )}
    </DialogContent></Dialog>
  );
}

function AddDialog({ onClose, onSave, pending }) {
  const [f, setF] = useState({ entry_type: 'rss', name: '', city: '', availability: 'open', blurb: '', tags: '', beds: '', phone: '', email: '', url: '' });
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}><DialogContent className="max-w-md max-h-[88vh] overflow-y-auto">
      <DialogHeader><DialogTitle>Add to the directory</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-slate-500">Type</Label>
          <select className="w-full mt-1 rounded-md border border-slate-200 p-2 text-sm" value={f.entry_type} onChange={(e) => setF({ ...f, entry_type: e.target.value })}>
            {Object.entries(ENTRY_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select></div>
        <div><Label className="text-xs text-slate-500">Availability</Label>
          <select className="w-full mt-1 rounded-md border border-slate-200 p-2 text-sm" value={f.availability} onChange={(e) => setF({ ...f, availability: e.target.value })}>
            <option value="open">Accepting</option><option value="wait">Waitlist</option>
          </select></div>
        <div className="col-span-2"><Label className="text-xs text-slate-500">Name</Label><Input className="mt-1" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div><Label className="text-xs text-slate-500">City</Label><Input className="mt-1" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} /></div>
        <div><Label className="text-xs text-slate-500">Open beds (optional)</Label><Input className="mt-1" type="number" value={f.beds} onChange={(e) => setF({ ...f, beds: e.target.value })} /></div>
        <div className="col-span-2"><Label className="text-xs text-slate-500">Description</Label>
          <textarea className="w-full mt-1 rounded-md border border-slate-200 p-2 text-sm" rows={2} value={f.blurb} onChange={(e) => setF({ ...f, blurb: e.target.value })} /></div>
        <div className="col-span-2"><Label className="text-xs text-slate-500">Tags (comma separated)</Label><Input className="mt-1" value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} placeholder="Peer Coaching, Narcan, All Pathways" /></div>
        <div><Label className="text-xs text-slate-500">Phone</Label><Input className="mt-1" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
        <div><Label className="text-xs text-slate-500">Email</Label><Input className="mt-1" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
        <div className="col-span-2"><Label className="text-xs text-slate-500">Website</Label><Input className="mt-1" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} /></div>
      </div>
      <Button className="w-full mt-4 bg-teal-600 hover:bg-teal-700" disabled={pending || !f.name.trim()}
        onClick={() => onSave({ ...f, beds: f.beds ? Number(f.beds) : null, tags: f.tags.split(',').map((t) => t.trim()).filter(Boolean) })}>
        {pending ? 'Saving…' : 'Add to directory'}
      </Button>
    </DialogContent></Dialog>
  );
}
