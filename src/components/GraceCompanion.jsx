import React, { useState, useRef, useEffect } from 'react';
import { db, Core } from '@/api/client';
import { Sparkles, X, Send, Phone, UserRound, ShieldAlert } from 'lucide-react';
import { detectCrisis, CRISIS_RESOURCES } from '@/lib/crisis';

/**
 * GraceCompanion — the platform's companion, available on every screen.
 *
 * Grace is ALWAYS labeled as AI and ALWAYS offers a human hand-off. Safety is
 * deterministic and runs before anything else: crisis language surfaces the 988
 * / Your Life Iowa resources instantly and logs a flagged support request, with
 * no dependency on a language model.
 *
 * Conversational replies use a warm, person-first scripted engine today. When an
 * LLM backend is connected (Core.InvokeLLM), Grace uses it for richer replies
 * and falls back to the scripts if it's unavailable — the connect-point is the
 * only thing standing between this and full conversational AI.
 */
const GREETING = "Hi, I'm Grace. I'm an AI companion here with you — not a person, and never a replacement for one. I'm here to listen, point you to support, or just keep you company. What's on your mind?";

function scriptedReply(text) {
  const t = text.toLowerCase();
  if (/\b(crav|urge|want to use|tempted|trigger)\b/.test(t))
    return "Cravings are your brain remembering, not a decision you have to obey. They peak and pass — often in under 20 minutes. Can you name one thing to do right now: a glass of water, a walk, texting your coach? You don't have to white-knuckle this alone.";
  if (/\b(lonely|alone|isolat|no one|nobody)\b/.test(t))
    return "Feeling alone is heavy, and reaching out here took something. You're not as alone as it feels right now. Would a Safe Chat room or a peer coach help? I can also just stay here with you.";
  if (/\b(grateful|thank|good day|proud|better)\b/.test(t))
    return "That's worth holding onto. Naming what's going well is real recovery work — it rewires the brain toward it. Want to put it on the Walls of Honor so it lands for someone else too?";
  if (/\b(resource|help me find|housing|food|job|treatment|detox)\b/.test(t))
    return "Let's find the right support. The Living Resource Hub has verified Iowa options by county — housing, food, treatment, legal, transport. Tell me your county and what you need, and I'll point you there.";
  if (/\b(meeting|coach|talk to)\b/.test(t))
    return "You can connect with a peer coach who's walked this road. Tap 'Talk to a human' below any time and someone from the team will reach out — that's always here, no matter what.";
  if (/\b(hi|hello|hey|good morning|good evening)\b/.test(t))
    return "Hi there. I'm glad you're here. How are you arriving today — honestly?";
  return "I hear you, and I'm still here. However today is going, showing up counts. Would it help to talk it through, find a resource, or connect with a real person on the team?";
}

export default function GraceCompanion() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ from: 'grace', text: GREETING }]);
  const [input, setInput] = useState('');
  const [crisis, setCrisis] = useState(false);
  const [thinking, setThinking] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, crisis, thinking]);

  const push = (from, text) => setMsgs((m) => [...m, { from, text }]);

  async function reply(userText) {
    setThinking(true);
    let text;
    try {
      const res = await Core.InvokeLLM({ prompt: userText, system: 'You are Grace, a warm, person-first AI recovery companion for Grace For Addictions. Never impersonate a human. Keep replies short and supportive.' });
      text = res && res.ok && res.text ? res.text : scriptedReply(userText); // falls back until the LLM connect-point is wired
    } catch {
      text = scriptedReply(userText);
    }
    setThinking(false);
    push('grace', text);
  }

  async function onSend() {
    const text = input.trim();
    if (!text) return;
    push('user', text);
    setInput('');
    if (detectCrisis(text)) {
      setCrisis(true);
      push('grace', "I'm really glad you told me. Your safety matters more than anything else right now, and you deserve support from a person immediately — please reach out to one of these. I'm staying right here.");
      db.entities.Interaction?.create?.({ type: 'crisis_flag', notes: `Grace companion crisis flag: "${text}"`, date: new Date().toISOString().slice(0, 10), created_by: 'grace-companion' });
      return;
    }
    reply(text);
  }

  function talkToHuman() {
    push('grace', "I've let the team know you'd like to talk to a real person. A peer coach will follow up. If it's urgent, please use one of the crisis lines below — you don't have to wait.");
    setCrisis(true);
    db.entities.Interaction?.create?.({ type: 'support_request', notes: 'Requested a human via Grace companion.', date: new Date().toISOString().slice(0, 10), created_by: 'grace-companion' });
  }

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} aria-label="Open Grace, your AI companion"
          style={btnStyle}>
          <Sparkles style={{ width: 22, height: 22 }} />
        </button>
      )}
      {open && (
        <div style={panelStyle} role="dialog" aria-label="Grace AI companion">
          <div style={headerStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles style={{ width: 16, height: 16 }} /></div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1 }}>Grace</div>
                <div style={{ fontSize: 10, opacity: .8 }}>AI companion · always here</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X style={{ width: 18, height: 18 }} /></button>
          </div>

          <div style={bodyStyle}>
            <div style={{ fontSize: 10, textAlign: 'center', color: '#94a3b8', marginBottom: 8 }}>🤖 Grace is an AI — not a human, not medical advice.</div>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                <div style={m.from === 'user' ? userBubble : graceBubble}>{m.text}</div>
              </div>
            ))}
            {thinking && <div style={{ ...graceBubble, opacity: .6 }}>Grace is typing…</div>}
            {crisis && (
              <div style={crisisBox}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#b91c1c', fontSize: 12, marginBottom: 6 }}><ShieldAlert style={{ width: 14, height: 14 }} /> Reach a person now</div>
                {CRISIS_RESOURCES.map((r) => (
                  <a key={r.label} href={r.href} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#991b1b', textDecoration: 'none', padding: '2px 0' }}>
                    <Phone style={{ width: 12, height: 12 }} /> <b>{r.label}:</b> {r.value}
                  </a>
                ))}
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div style={{ padding: 10, borderTop: '1px solid #e2e8f0' }}>
            <button onClick={talkToHuman} style={humanBtn}><UserRound style={{ width: 13, height: 13 }} /> Talk to a human</button>
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onSend()}
                placeholder="Tell Grace what's going on…" style={inputStyle} />
              <button onClick={onSend} disabled={!input.trim()} style={sendBtn} aria-label="Send"><Send style={{ width: 16, height: 16 }} /></button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const btnStyle = { position: 'fixed', bottom: 20, right: 20, zIndex: 100000, width: 56, height: 56, borderRadius: 18, border: 'none', cursor: 'pointer', color: '#fff', background: 'linear-gradient(135deg,#7B3FF2,#1FB6B6)', boxShadow: '0 8px 24px rgba(123,63,242,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const panelStyle = { position: 'fixed', bottom: 20, right: 20, zIndex: 100000, width: 'min(380px,calc(100vw - 32px))', height: 'min(560px,calc(100vh - 40px))', background: '#fff', borderRadius: 18, boxShadow: '0 20px 60px rgba(0,0,0,.3)', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'system-ui,sans-serif' };
const headerStyle = { background: 'linear-gradient(135deg,#7B3FF2,#1FB6B6)', color: '#fff', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
const bodyStyle = { flex: 1, overflowY: 'auto', padding: 14, background: '#f8fafc' };
const graceBubble = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px 14px 14px 4px', padding: '9px 12px', fontSize: 13, color: '#334155', maxWidth: '85%', lineHeight: 1.5 };
const userBubble = { background: '#0f766e', color: '#fff', borderRadius: '14px 14px 4px 14px', padding: '9px 12px', fontSize: 13, maxWidth: '85%', lineHeight: 1.5 };
const crisisBox = { background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 12, padding: 10, marginTop: 4 };
const humanBtn = { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 10, padding: '7px', fontSize: 12, fontWeight: 600, color: '#475569', cursor: 'pointer', marginBottom: 8 };
const inputStyle = { flex: 1, border: '1px solid #e2e8f0', borderRadius: 10, padding: '9px 11px', fontSize: 13, outline: 'none' };
const sendBtn = { background: 'linear-gradient(135deg,#7B3FF2,#1FB6B6)', color: '#fff', border: 'none', borderRadius: 10, width: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
