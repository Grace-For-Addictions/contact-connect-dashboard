import React from 'react';
import { ArrowRight, HeartHandshake, Building2, Phone } from 'lucide-react';

/**
 * Landing — the branded front door of vrcc.app.
 * Two clear pathways: "Get started" into the working app (intake, coach,
 * messaging, sessions) and "Explore the VRCC" into the immersive community.
 * The emotional welcome, with an unmistakable next step for everyone.
 */
const FR = "'Fraunces', 'Cinzel', Georgia, serif";

export default function Landing() {
  const go = (q) => { window.location.href = `${window.location.pathname}?${q}`; };
  return (
    <div style={wrap}>
      <div style={glow} aria-hidden="true" />
      <div style={container}>
        <div style={brand}>
          <div style={seal}>G</div>
          <div>
            <div style={{ fontFamily: FR, fontWeight: 600, letterSpacing: '.02em', color: '#f4ecdd' }}>Grace For Addictions</div>
            <div style={{ fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(244,236,221,.5)' }}>Virtual Recovery Community Center</div>
          </div>
        </div>

        <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
          <div style={eyebrow}>No Shame · No Stigma · Just Grace</div>
          <h1 style={h1}>Recovery is a place you can <em style={{ fontStyle: 'italic', color: '#e8c37e' }}>walk into</em>.</h1>
          <p style={lede}>A community, not a system. Come as you are — we'll meet you where you are and help you find your next step, together.</p>
        </div>

        <div style={cards}>
          <button onClick={() => go('app')} style={{ ...card, ...cardPrimary }} className="vrcc-card">
            <div style={{ ...cardIcon, background: 'rgba(232,195,126,.16)', color: '#e8c37e' }}><HeartHandshake style={{ width: 26, height: 26 }} /></div>
            <div style={cardTitle}>Get started</div>
            <div style={cardDesc}>Sign in or create an account. Do your intake, connect with a coach, message, and schedule sessions — everything to work your recovery.</div>
            <div style={cardCta}>Enter the app <ArrowRight style={{ width: 16, height: 16 }} /></div>
          </button>

          <button onClick={() => go('explore')} style={card} className="vrcc-card">
            <div style={{ ...cardIcon, background: 'rgba(95,179,196,.16)', color: '#7fc9d6' }}><Building2 style={{ width: 26, height: 26 }} /></div>
            <div style={cardTitle}>Explore the VRCC</div>
            <div style={cardDesc}>Step into the virtual recovery community — walk the building, open rooms, find resources, and take in a place made just to belong.</div>
            <div style={{ ...cardCta, color: '#7fc9d6' }}>Take a look <ArrowRight style={{ width: 16, height: 16 }} /></div>
          </button>
        </div>

        <div style={values}>
          {['No fees', 'Peer-led', 'Trauma-informed', 'Available 24/7'].map((v) => <span key={v} style={pill}>{v}</span>)}
        </div>

        <div style={footer}>
          <span style={{ fontFamily: FR, fontStyle: 'italic', color: 'rgba(244,236,221,.6)' }}>"Connection prevents crisis."</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Phone style={{ width: 12, height: 12 }} /> In crisis? Call or text <b style={{ color: '#e8c37e' }}>988</b></span>
        </div>
      </div>
      <style>{`.vrcc-card{cursor:pointer;transition:transform .2s ease, border-color .2s ease, box-shadow .2s ease}
        .vrcc-card:hover{transform:translateY(-4px);border-color:rgba(232,195,126,.5);box-shadow:0 20px 50px rgba(0,0,0,.4)}`}</style>
    </div>
  );
}

const wrap = { minHeight: '100vh', position: 'relative', overflow: 'auto', background: 'linear-gradient(180deg,#06141a 0%,#0a2028 45%,#071319 100%)', color: '#f4ecdd', fontFamily: 'system-ui, -apple-system, sans-serif' };
const glow = { position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(900px 500px at 50% -10%, rgba(95,179,196,.18), transparent 60%), radial-gradient(700px 500px at 85% 20%, rgba(232,195,126,.12), transparent 60%)' };
const container = { position: 'relative', zIndex: 1, maxWidth: 1000, margin: '0 auto', padding: '32px 24px 60px', display: 'flex', flexDirection: 'column', minHeight: '100vh' };
const brand = { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'clamp(32px,8vh,90px)' };
const seal = { width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#5fb3c4,#3d7a7a)', display: 'grid', placeItems: 'center', fontFamily: FR, fontWeight: 700, fontSize: 20, color: '#06141a', boxShadow: '0 0 24px rgba(95,179,196,.35)' };
const eyebrow = { fontSize: 11, letterSpacing: '.32em', textTransform: 'uppercase', color: 'rgba(232,195,126,.85)', marginBottom: 22 };
const h1 = { fontFamily: FR, fontWeight: 600, fontSize: 'clamp(2.2rem,6vw,4rem)', lineHeight: 1.08, margin: '0 auto 22px', maxWidth: '15ch' };
const lede = { fontSize: 'clamp(1.05rem,2vw,1.3rem)', lineHeight: 1.65, color: 'rgba(244,236,221,.78)', maxWidth: 600, margin: '0 auto' };
const cards = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 18, margin: 'clamp(36px,7vh,64px) auto 0', width: '100%', maxWidth: 780 };
const card = { textAlign: 'left', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 20, padding: 26, color: '#f4ecdd' };
const cardPrimary = { background: 'rgba(232,195,126,.06)', borderColor: 'rgba(232,195,126,.28)' };
const cardIcon = { width: 52, height: 52, borderRadius: 15, display: 'grid', placeItems: 'center', marginBottom: 16 };
const cardTitle = { fontFamily: FR, fontWeight: 600, fontSize: '1.5rem', marginBottom: 8 };
const cardDesc = { fontSize: '.95rem', lineHeight: 1.6, color: 'rgba(244,236,221,.68)', marginBottom: 18 };
const cardCta = { display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: '#e8c37e' };
const values = { display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', margin: '36px 0 0' };
const pill = { fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(244,236,221,.65)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 999, padding: '6px 15px' };
const footer = { marginTop: 'auto', paddingTop: 40, display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', fontSize: 12, color: 'rgba(244,236,221,.45)' };
