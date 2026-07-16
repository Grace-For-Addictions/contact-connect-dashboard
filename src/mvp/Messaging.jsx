import React, { useState, useRef, useEffect } from 'react';
import { db } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

/**
 * Messaging — one message thread between a participant and their coach.
 * Keyed by the participant's email; both sides read/write the same thread and
 * it polls every few seconds. `me` is { role: 'participant'|'coach', email, name }.
 */
export default function Messaging({ participantEmail, participantId, participantName, me, height = 340 }) {
  const qc = useQueryClient();
  const [body, setBody] = useState('');
  const endRef = useRef(null);

  const { data: messages = [] } = useQuery({
    queryKey: ['mvp_thread', participantEmail],
    queryFn: () => db.entities.MvpMessage.filter({ participant_email: participantEmail }, 'created_date'),
    refetchInterval: 4000,
    enabled: !!participantEmail,
  });

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  const send = useMutation({
    mutationFn: () => db.entities.MvpMessage.create({
      participant_id: participantId || null, participant_email: participantEmail,
      sender_role: me.role, sender_email: me.email, sender_name: me.name, body: body.trim(),
    }),
    onSuccess: () => { setBody(''); qc.invalidateQueries({ queryKey: ['mvp_thread', participantEmail] }); },
  });

  return (
    <div className="flex flex-col border border-slate-200 rounded-xl bg-white overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50/60" style={{ height }}>
        {messages.length === 0 && (
          <div className="text-center text-slate-400 text-sm py-10">
            No messages yet. {me.role === 'coach' ? `Say hello to ${participantName || 'your participant'}.` : 'Say hello to your coach.'}
          </div>
        )}
        {messages.map((m) => {
          const mine = m.sender_role === me.role;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${mine ? 'bg-teal-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm'}`}>
                {!mine && <div className="text-[10px] font-semibold text-slate-400 mb-0.5">{m.sender_name || (m.sender_role === 'coach' ? 'Coach' : 'Participant')}</div>}
                {m.body}
                <div className={`text-[9px] mt-1 ${mine ? 'text-teal-100' : 'text-slate-400'}`}>{m.created_date ? formatDistanceToNow(new Date(m.created_date), { addSuffix: true }) : ''}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2 p-2.5 border-t border-slate-100">
        <input className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Type a message…"
          value={body} onChange={(e) => setBody(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && body.trim()) send.mutate(); }} />
        <Button className="bg-teal-600 hover:bg-teal-700" disabled={!body.trim() || send.isPending} onClick={() => send.mutate()}><Send className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}
