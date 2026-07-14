import React, { useState } from 'react';
import { db } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessagesSquare, Send, ArrowLeft, ShieldAlert, LogOut } from 'lucide-react';
import { detectCrisis, CRISIS_RESOURCES } from '@/lib/crisis';

/**
 * Community Safe Chat Rooms — 10 named spaces. Messages persist to
 * room_messages and refresh on a short poll (real-time websocket transport is a
 * connect-point). Every message runs through always-on crisis detection: a
 * flagged message surfaces resources to the author and is marked for a human
 * moderator. Anonymous by default. Quick-exit clears and leaves the room.
 */
const ROOMS = [
  { key: 'open-circle', name: 'Open Circle', emoji: '⭕', blurb: 'Everyone welcome. Come as you are.' },
  { key: 'justice', name: 'Justice Journeys', emoji: '⚖️', blurb: 'Reentry, court, and starting over.' },
  { key: 'womens', name: "Women's Space", emoji: '🌸', blurb: 'A space for women in recovery.' },
  { key: 'mens', name: "Men's Space", emoji: '🌲', blurb: 'A space for men in recovery.' },
  { key: 'family', name: 'Family & Allies', emoji: '👨‍👩‍👧', blurb: 'For loved ones supporting recovery.' },
  { key: 'youth', name: 'Young in Recovery', emoji: '🌱', blurb: 'For youth and young adults.' },
  { key: 'lgbtq', name: 'LGBTQ+ Circle', emoji: '🏳️‍🌈', blurb: 'Affirming space, no exceptions.' },
  { key: 'grief', name: 'Grief & Memorial', emoji: '🕊️', blurb: 'Holding loss together, gently.' },
  { key: 'wins', name: 'Daily Wins', emoji: '🎉', blurb: 'Celebrate the small and the big.' },
  { key: 'latenight', name: 'Late Night', emoji: '🌙', blurb: 'When the hard hours hit, we are here.' },
];

export default function CommunityRooms() {
  const [room, setRoom] = useState(null);
  if (room) return <Room room={room} onBack={() => setRoom(null)} />;
  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-teal-600 font-semibold text-xs tracking-widest uppercase"><MessagesSquare className="w-4 h-4" /> Community</div>
        <h1 className="text-3xl font-bold text-slate-800 mt-1">Safe Chat Rooms</h1>
        <p className="text-slate-500 mt-1">Ten spaces to connect. Anonymous by default. Moderated for safety, always.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ROOMS.map((r) => (
          <button key={r.key} onClick={() => setRoom(r)} className="text-left">
            <Card className="hover:border-teal-300 transition h-full"><CardContent className="p-4 flex items-start gap-3">
              <span className="text-2xl">{r.emoji}</span>
              <div><div className="font-semibold text-slate-800">{r.name}</div><div className="text-sm text-slate-500">{r.blurb}</div></div>
            </CardContent></Card>
          </button>
        ))}
      </div>
      <p className="text-center text-xs text-slate-400 mt-6">Peer support · not treatment. In crisis, call or text 988. Use Quick-Exit any time.</p>
    </div>
  );
}

function Room({ room, onBack }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [showCrisis, setShowCrisis] = useState(false);
  const { data: messages = [] } = useQuery({
    queryKey: ['room', room.key],
    queryFn: () => db.entities.RoomMessage.filter({ room_key: room.key }, 'created_date'),
    refetchInterval: 5000,
  });

  const send = useMutation({
    mutationFn: () => {
      const flagged = detectCrisis(body);
      if (flagged) setShowCrisis(true);
      return db.entities.RoomMessage.create({
        room_key: room.key, author_name: name.trim() || 'Anonymous', body: body.trim(), flagged, created_by: 'community',
      });
    },
    onSuccess: () => { setBody(''); qc.invalidateQueries({ queryKey: ['room', room.key] }); },
  });

  const quickExit = () => { window.location.href = 'https://www.google.com'; };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"><ArrowLeft className="w-4 h-4" /> All rooms</button>
        <button onClick={quickExit} className="flex items-center gap-1 text-xs font-semibold text-rose-600 border border-rose-200 rounded-lg px-2.5 py-1 hover:bg-rose-50"><LogOut className="w-3.5 h-3.5" /> Quick exit</button>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{room.emoji}</span>
        <div><div className="font-bold text-slate-800">{room.name}</div><div className="text-xs text-slate-500">{room.blurb}</div></div>
      </div>

      {showCrisis && (
        <Card className="mb-3 border-rose-200 bg-rose-50"><CardContent className="p-3.5">
          <div className="flex items-center gap-1.5 font-semibold text-rose-700 text-sm mb-1"><ShieldAlert className="w-4 h-4" /> You don't have to carry this alone</div>
          <div className="text-xs text-rose-800 space-y-0.5">
            {CRISIS_RESOURCES.map((r) => <div key={r.label}><b>{r.label}:</b> {r.value}</div>)}
          </div>
          <button onClick={() => setShowCrisis(false)} className="text-xs text-rose-500 underline mt-2">Close</button>
        </CardContent></Card>
      )}

      <Card className="flex-1 min-h-[300px] mb-3"><CardContent className="p-4 flex flex-col gap-3">
        {messages.length === 0 && <div className="text-center text-slate-400 text-sm py-10">No messages yet. Say hello. 💜</div>}
        {messages.map((m) => (
          <div key={m.id} className="text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">{m.author_name}</span>
              <span className="text-[10px] text-slate-400">{m.created_date ? formatDistanceToNow(new Date(m.created_date), { addSuffix: true }) : ''}</span>
              {m.flagged && <Badge className="bg-rose-100 text-rose-600 text-[9px]">flagged for support</Badge>}
            </div>
            <div className="text-slate-600">{m.body}</div>
          </div>
        ))}
      </CardContent></Card>

      <div className="flex gap-2">
        <Input className="w-32" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (opt.)" />
        <Input className="flex-1" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Share something…"
          onKeyDown={(e) => { if (e.key === 'Enter' && body.trim()) send.mutate(); }} />
        <Button className="bg-teal-600 hover:bg-teal-700" disabled={!body.trim() || send.isPending} onClick={() => send.mutate()}><Send className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}
