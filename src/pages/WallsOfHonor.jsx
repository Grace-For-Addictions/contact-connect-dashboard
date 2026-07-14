import React, { useState } from 'react';
import { db } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Heart, Star, Flower2, Plus, Sparkles } from 'lucide-react';

/**
 * Walls of Honor — Kudos, Memorial, and Gratitude. A dignity-centered community
 * wall: celebrate milestones, honor those lost, share gratitude. Posts persist
 * to honor_posts; likes increment live. Person-first, AI celebrates milestones.
 */
const TYPES = {
  kudos:     { label: 'Kudos',     icon: Star,    color: '#c8972a', blurb: 'Celebrate a milestone or a win.' },
  memorial:  { label: 'Memorial',  icon: Flower2, color: '#6b7280', blurb: 'Honor someone we lost, with dignity.' },
  gratitude: { label: 'Gratitude', icon: Heart,   color: '#0f766e', blurb: 'Share what you are grateful for.' },
};

function celebrate(days) {
  if (!days) return null;
  if (days >= 365) return `${Math.floor(days / 365)} year${days >= 730 ? 's' : ''} — extraordinary. 🌟`;
  if (days >= 90) return `${days} days strong. The roots are deep. 💜`;
  if (days >= 30) return `${days} days! Every single one mattered. 🎉`;
  return `${days} days in — showing up is the work. 👏`;
}

export default function WallsOfHonor() {
  const qc = useQueryClient();
  const [dialog, setDialog] = useState(false);
  const [tab, setTab] = useState('all');
  const { data: posts = [] } = useQuery({ queryKey: ['honor'], queryFn: () => db.entities.HonorPost.list('-created_date') });

  const like = useMutation({
    mutationFn: (p) => db.entities.HonorPost.update(p.id, { likes: (p.likes || 0) + 1 }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['honor'] }),
  });
  const create = useMutation({
    mutationFn: (row) => db.entities.HonorPost.create({ ...row, likes: 0, created_by: 'community' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['honor'] }); setDialog(false); },
  });

  const shown = tab === 'all' ? posts : posts.filter((p) => p.post_type === tab);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-600 font-semibold text-xs tracking-widest uppercase"><Sparkles className="w-4 h-4" /> Community</div>
          <h1 className="text-3xl font-bold text-slate-800 mt-1">Walls of Honor</h1>
          <p className="text-slate-500 mt-1">Kudos, memorials, and gratitude — celebrated together, with dignity.</p>
        </div>
        <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => setDialog(true)}><Plus className="w-4 h-4 mr-1" /> Add to the wall</Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-5">
          <TabsTrigger value="all">All</TabsTrigger>
          {Object.entries(TYPES).map(([k, t]) => <TabsTrigger key={k} value={k}>{t.label}</TabsTrigger>)}
        </TabsList>
        <TabsContent value={tab}>
          {shown.length === 0 ? (
            <Card className="border-dashed"><CardContent className="py-16 text-center text-slate-500">
              Nothing here yet. Be the first to celebrate someone. 💜
            </CardContent></Card>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
              {shown.map((p) => {
                const t = TYPES[p.post_type] || TYPES.kudos; const Icon = t.icon;
                return (
                  <Card key={p.id} className="mb-4 break-inside-avoid" style={{ borderTop: `3px solid ${t.color}` }}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge style={{ background: t.color + '22', color: t.color }} className="gap-1"><Icon className="w-3 h-3" /> {t.label}</Badge>
                        {p.milestone_days ? <span className="text-xs font-semibold" style={{ color: t.color }}>{p.milestone_days}d</span> : null}
                      </div>
                      {p.title && <div className="font-semibold text-slate-800">{p.title}</div>}
                      {p.body && <p className="text-sm text-slate-600 mt-1 leading-relaxed">{p.body}</p>}
                      {p.post_type === 'kudos' && celebrate(p.milestone_days) && (
                        <div className="mt-2 text-xs rounded-lg bg-amber-50 text-amber-700 px-2.5 py-1.5 flex items-center gap-1"><Sparkles className="w-3 h-3" /> {celebrate(p.milestone_days)}</div>
                      )}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                        <span className="text-xs text-slate-400">{p.author_name || 'Anonymous'}</span>
                        <button onClick={() => like.mutate(p)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-500 transition">
                          <Heart className="w-3.5 h-3.5" /> {p.likes || 0}
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {dialog && <PostDialog onClose={() => setDialog(false)} onSave={(r) => create.mutate(r)} pending={create.isPending} />}
    </div>
  );
}

function PostDialog({ onClose, onSave, pending }) {
  const [f, setF] = useState({ post_type: 'kudos', author_name: '', title: '', body: '', milestone_days: '' });
  const t = TYPES[f.post_type];
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}><DialogContent className="max-w-md">
      <DialogHeader><DialogTitle>Add to the wall</DialogTitle></DialogHeader>
      <div className="flex gap-2 mb-1">
        {Object.entries(TYPES).map(([k, tt]) => (
          <button key={k} onClick={() => setF({ ...f, post_type: k })}
            className={`flex-1 rounded-lg border px-2 py-2 text-xs font-semibold transition ${f.post_type === k ? 'text-white' : 'text-slate-500 border-slate-200'}`}
            style={f.post_type === k ? { background: tt.color, borderColor: tt.color } : {}}>{tt.label}</button>
        ))}
      </div>
      <p className="text-xs text-slate-400 mb-1">{t.blurb}</p>
      <Label className="text-xs text-slate-500">Your name (optional)</Label>
      <Input value={f.author_name} onChange={(e) => setF({ ...f, author_name: e.target.value })} placeholder="Leave blank to post anonymously" />
      <Label className="text-xs text-slate-500 mt-2">Title</Label>
      <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder={f.post_type === 'memorial' ? 'In memory of…' : f.post_type === 'gratitude' ? 'Grateful for…' : 'Celebrating…'} />
      <Label className="text-xs text-slate-500 mt-2">Message</Label>
      <textarea className="w-full rounded-md border border-slate-200 p-2 text-sm mt-1" rows={3} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
      {f.post_type === 'kudos' && (
        <><Label className="text-xs text-slate-500 mt-2">Milestone (days, optional)</Label>
        <Input type="number" value={f.milestone_days} onChange={(e) => setF({ ...f, milestone_days: e.target.value })} placeholder="e.g. 30, 90, 365" /></>
      )}
      <Button className="w-full mt-4" style={{ background: t.color }} disabled={pending || (!f.title && !f.body)}
        onClick={() => onSave({ ...f, milestone_days: f.milestone_days ? Number(f.milestone_days) : null })}>
        {pending ? 'Posting…' : 'Post to the wall'}
      </Button>
    </DialogContent></Dialog>
  );
}
