/* ============================================================
   MODE ENGINE — Cosmic Grace & Renewing the Mind
   Both opt-in. Both reversible. Never imposed.
   Classic script — shares scope with vrcc-shell.js.
   ============================================================ */
let cosmicOn=false, renewOn=false;

const FQUOTES={
 welcome:'“Come to me, all who are weary, and I will give you rest.” — Matthew 11:28',
 coaching:'“Two are better than one… if either falls, one can help the other up.” — Ecclesiastes 4:9–10',
 circles:'“Where two or three gather, I am there among them.” — Matthew 18:20',
 resources:'“Give us this day our daily bread.” — Matthew 6:11',
 journey:'“He who began a good work in you will carry it to completion.” — Philippians 1:6',
 lounge:'“Encourage one another and build each other up.” — 1 Thessalonians 5:11',
 checkin:'“Search me, O God, and know my heart.” — Psalm 139:23',
 staff:'“Serve one another humbly in love.” — Galatians 5:13'
};
const BASE_QUOTES={}; ROOMS.forEach(r=>BASE_QUOTES[r.id]=r.quote);

const SEL=['.arrival-title .eyebrow','.arrival-title h1','.arrival-title p','.vb-sign .sub',
 '.lobby-title h2','.lobby-title p','.basement-head .b-eyebrow','.basement-head h2','.basement-head p',
 '.garden-head .g-eyebrow','.garden-head h2','.garden-head p','.city-title h2','.city-title p'];
const BASE={}; SEL.forEach(s=>{const el=document.querySelector(s); if(el)BASE[s]=el.innerHTML;});

const COSMIC={
 '.arrival-title .eyebrow':'Approach vector locked · welcome, traveler',
 '.arrival-title h1':'Welcome aboard the <em>VRCC Station</em><br>— a safe harbor among the stars',
 '.arrival-title p':'A waypoint on your mission through the cosmos. The docking lights are on, and this space was built for you.',
 '.vb-sign .sub':'Grace For Addictions · Waypoint — Des Moines, Iowa',
 '.lobby-title h2':'The Commons Deck',
 '.lobby-title p':'Breathe, traveler. Belonging holds — even in zero gravity.',
 '.basement-head .b-eyebrow':'Below Decks · Recovering the Mind',
 '.basement-head h2':'Fifty-nine practices, <em>seven constellations</em>',
 '.basement-head p':'The quietest chamber on the station. Fifty-nine practices for the long voyage — sit with one, turn it over, take what serves the mission.',
 '.garden-head .g-eyebrow':'Through the airlock',
 '.garden-head h2':'The Terrarium Dome',
 '.garden-head p':'Even out here, living things grow. Recovery capital is the cargo worth carrying across any galaxy.',
 '.city-title h2':'Des Moines · Home Planet',
 '.city-title p':'Your mission map — real anchors on real ground, wherever you land.'
};
const RENEW={
 '.arrival-title p':'Set your mind on things above (Colossians 3:2). The lights are on — and grace arrives with you.',
 '.basement-head .b-eyebrow':'The Basement · Renewing the Mind',
 '.basement-head h2':'Recovering the mind is <em>renewing the mind</em>',
 '.basement-head p':'What neuroscience calls neuroplasticity, scripture calls the renewing of the mind (Romans 12:2). Fifty-nine practices, each repetition a new path — and grace walks every one with you.',
 '.garden-head .g-eyebrow':'Planted & tended',
 '.garden-head p':'Like a tree planted by streams of water (Psalm 1:3) — growth comes from where you’re rooted, tended a little every day, in grace.'
};

const META_BASE={}, META_COSMIC={arrival:'Approaching the Station',lobby:'Commons Deck',
 hallway:'Corridor A · Habitat Ring',basement:'Below Decks · Wisdom Space',garden:'The Terrarium Dome',city:'Home Planet · Des Moines'};
Object.keys(SCENE_META).forEach(k=>META_BASE[k]=SCENE_META[k].label);

function applyModes(){
  document.body.classList.toggle('cosmic',cosmicOn);
  document.body.classList.toggle('renew',renewOn);
  SEL.forEach(s=>{let v=BASE[s];
    if(cosmicOn && COSMIC[s]!==undefined)v=COSMIC[s];
    if(renewOn && RENEW[s]!==undefined)v=RENEW[s];
    const el=document.querySelector(s); if(el)el.innerHTML=v;});
  Object.keys(META_BASE).forEach(k=>{
    SCENE_META[k].label=(cosmicOn&&META_COSMIC[k])?META_COSMIC[k]:META_BASE[k];});
  ROOMS.forEach(r=>{r.quote=(renewOn&&FQUOTES[r.id])?FQUOTES[r.id]:BASE_QUOTES[r.id];});
  if(current==='room'&&currentRoom){document.querySelector('#roomQuote').textContent=currentRoom.quote;}
  rtmApplyRenew();
  syncHUD();
}

const cosmosBtn=document.querySelector('#cosmosBtn'), renewBtn=document.querySelector('#renewBtn');
cosmosBtn.addEventListener('click',()=>{
  cosmicOn=!cosmicOn; applyModes();
  cosmosBtn.setAttribute('aria-pressed',cosmicOn);
  cosmosBtn.textContent=cosmicOn?'🌌 Planetside':'🌌 Cosmos';
  toast(cosmicOn
    ?'🌌 <em>Interstellar mode</em> — same building, now a station among the stars. A safe harbor for every traveler on the mission.'
    :'🌆 Back planetside — dusk in Des Moines. The lights are still on.');
});
renewBtn.addEventListener('click',()=>{
  renewOn=!renewOn; applyModes();
  renewBtn.setAttribute('aria-pressed',renewOn);
  renewBtn.textContent=renewOn?'🕊️ Renewing':'🕊️ Renew';
  toast(renewOn
    ?'🕊️ <em>Renewing the Mind</em> is on — each slogan now pairs with scripture, seen through the neuroscience of renewal (Romans 12:2). This lens is always your choice, never a requirement — switch back anytime. Every path is honored here.'
    :'🤍 Standard experience restored. Every path to recovery is honored here — this space remains yours either way.');
});
