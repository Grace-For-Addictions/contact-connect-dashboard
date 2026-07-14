import React, { useMemo, useState } from 'react';
import { db } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pill, Plus, ShieldCheck, HeartPulse, Package, Download } from 'lucide-react';
import RoleGate from '@/components/RoleGate';

/**
 * Narcan Distribution Tracking — logs kits distributed, training provided, and
 * overdose reversals for GPRA HR-001, Iowa HF 1038, and opioid-settlement
 * Exhibit E reporting. A CSV export gives operators a one-click compliance pull.
 */
export default function NarcanTracking() {
  return <RoleGate access="staff" area="Narcan tracking"><NarcanTrackingInner /></RoleGate>;
}

function NarcanTrackingInner() {
  const qc = useQueryClient();
  const [dialog, setDialog] = useState(false);
  const { data: logs = [] } = useQuery({ queryKey: ['narcan'], queryFn: () => db.entities.NarcanLog.list('-date') });

  const save = useMutation({
    mutationFn: (row) => db.entities.NarcanLog.create({ ...row, created_by: 'staff' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['narcan'] }); setDialog(false); },
  });

  const stats = useMemo(() => ({
    kits: logs.length,
    trained: logs.filter((l) => l.training_provided).length,
    reversals: logs.filter((l) => l.reversal_reported).length,
  }), [logs]);

  const exportCsv = () => {
    const cols = ['date', 'kit_id', 'distributed_by', 'distributed_to', 'county', 'training_provided', 'reversal_reported', 'reversal_date', 'notes'];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [cols.join(','), ...logs.map((l) => cols.map((c) => esc(l[c])).join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = `narcan-exhibit-e-${format(new Date(), 'yyyy-MM-dd')}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 text-rose-600 font-semibold text-xs tracking-widest uppercase"><Pill className="w-4 h-4" /> Harm Reduction</div>
          <h1 className="text-3xl font-bold text-slate-800 mt-1">Narcan Distribution</h1>
          <p className="text-slate-500 mt-1">Kits, training, and reversals — GPRA HR-001 · Iowa HF 1038 · Exhibit E ready.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv} disabled={!logs.length}><Download className="w-4 h-4 mr-1" /> Export CSV</Button>
          <Button className="bg-rose-600 hover:bg-rose-700" onClick={() => setDialog(true)}><Plus className="w-4 h-4 mr-1" /> Log distribution</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat icon={Package} color="#0f766e" n={stats.kits} label="Kits distributed" />
        <Stat icon={ShieldCheck} color="#7c3aed" n={stats.trained} label="With training" />
        <Stat icon={HeartPulse} color="#b91c1c" n={stats.reversals} label="Reversals reported" />
      </div>

      {logs.length === 0 ? (
        <Card className="border-dashed"><CardContent className="py-16 text-center text-slate-500">No distributions logged yet.</CardContent></Card>
      ) : (
        <div className="rounded-xl border border-slate-100 divide-y divide-slate-100 bg-white">
          {logs.map((l) => (
            <div key={l.id} className="px-4 py-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="font-mono text-xs text-slate-400 w-24">{l.kit_id || '—'}</span>
              <b className="text-slate-800">{l.distributed_to || 'Community'}</b>
              <span className="text-slate-500">{l.county || '—'} · {l.date} · by {l.distributed_by || '—'}</span>
              {l.training_provided && <Badge className="bg-violet-100 text-violet-700">Trained</Badge>}
              {l.reversal_reported && <Badge className="bg-rose-100 text-rose-700">Reversal {l.reversal_date || ''}</Badge>}
            </div>
          ))}
        </div>
      )}

      {dialog && <LogDialog onClose={() => setDialog(false)} onSave={(r) => save.mutate(r)} pending={save.isPending} />}
    </div>
  );
}

const Stat = ({ icon: Icon, color, n, label }) => (
  <Card><CardContent className="py-5 flex items-center gap-3">
    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: color + '22', color }}><Icon className="w-6 h-6" /></div>
    <div><div className="text-2xl font-bold text-slate-800">{n}</div><div className="text-xs text-slate-500">{label}</div></div>
  </CardContent></Card>
);

function LogDialog({ onClose, onSave, pending }) {
  const [f, setF] = useState({ kit_id: '', distributed_by: '', distributed_to: '', county: '', training_provided: false, reversal_reported: false, reversal_date: '', notes: '' });
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}><DialogContent className="max-w-md">
      <DialogHeader><DialogTitle>Log Narcan distribution</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-slate-500">Kit ID</Label><Input className="mt-1" value={f.kit_id} onChange={(e) => setF({ ...f, kit_id: e.target.value })} placeholder="Inventory #" /></div>
        <div><Label className="text-xs text-slate-500">County</Label><Input className="mt-1" value={f.county} onChange={(e) => setF({ ...f, county: e.target.value })} placeholder="Iowa county" /></div>
        <div><Label className="text-xs text-slate-500">Distributed by</Label><Input className="mt-1" value={f.distributed_by} onChange={(e) => setF({ ...f, distributed_by: e.target.value })} /></div>
        <div><Label className="text-xs text-slate-500">Recipient (optional)</Label><Input className="mt-1" value={f.distributed_to} onChange={(e) => setF({ ...f, distributed_to: e.target.value })} /></div>
      </div>
      <div className="flex gap-4 mt-3">
        <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={f.training_provided} onChange={(e) => setF({ ...f, training_provided: e.target.checked })} /> Training provided</label>
        <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={f.reversal_reported} onChange={(e) => setF({ ...f, reversal_reported: e.target.checked })} /> Reversal reported</label>
      </div>
      {f.reversal_reported && (
        <div className="mt-2"><Label className="text-xs text-slate-500">Reversal date</Label><Input type="date" className="mt-1" value={f.reversal_date} onChange={(e) => setF({ ...f, reversal_date: e.target.value })} /></div>
      )}
      <Label className="text-xs text-slate-500 mt-2">Notes</Label>
      <textarea className="w-full rounded-md border border-slate-200 p-2 text-sm mt-1" rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
      <Button className="w-full mt-4 bg-rose-600 hover:bg-rose-700" disabled={pending}
        onClick={() => onSave({ ...f, reversal_date: f.reversal_date || null, date: format(new Date(), 'yyyy-MM-dd') })}>
        {pending ? 'Saving…' : 'Save distribution'}
      </Button>
    </DialogContent></Dialog>
  );
}
