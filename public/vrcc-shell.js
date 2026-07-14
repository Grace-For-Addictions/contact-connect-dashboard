/* ============================================================
   VRCC IMMERSIVE — spatial navigation engine (classic script)
   Shares global scope with vrcc-modes.js. Bridges to React via
   window CustomEvents: 'vrcc:enter-room' / 'vrcc:exit-room'.
   ============================================================ */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];

/* ---------- DATA ----------
   Each ROOM maps to a live React page (`page`) mounted behind its door. */
const ROOMS=[
 {id:'welcome',name:'Welcome & Orientation',ico:'🌅',accent:'#c99145',side:'L',page:'Dashboard',
  tag:'Start here',desc:'What the VRCC is, how it works, and how to get started — at your own pace.',
  peek:'A soft landing. Learn how this place works and what belongs to you here.',
  inside:['What is the VRCC?','Getting started','Community agreements'],
  quote:'“Every person who walks in carries strengths they haven’t met yet.”',
  cards:[
   {i:'🏛️',t:'What is the VRCC?',d:'A virtual community center built by peers, for people in or seeking recovery.'},
   {i:'🧭',t:'How it works',d:'Rooms, not menus. Move through the building the way you would in person.'},
   {i:'🤝',t:'Community agreements',d:'Respect, confidentiality, and person-first language — everywhere, always.'},
   {i:'🚪',t:'Take the tour',d:'A gentle guided walk through every room so nothing feels unfamiliar.'}]},
 {id:'coaching',name:'Coaching Room',ico:'🧑‍🤝‍🧑',accent:'#3f7d78',side:'L',page:'CoachTraining',
  tag:'Peer coaching',desc:'Meet your peer recovery coach, book sessions, and keep momentum between them.',
  peek:'Two comfortable chairs and someone who has been where you are.',
  inside:['Book a session','Meet your coach','Action steps'],
  quote:'“A coach doesn’t walk ahead of you or behind you — beside you.”',
  cards:[
   {i:'📅',t:'Book a session',d:'Find a time with a volunteer peer coach that fits your life.'},
   {i:'👋',t:'Meet your coach',d:'Read their story, their approach, and what a first meeting is like.'},
   {i:'✅',t:'Action steps',d:'Small, doable next steps you and your coach chose together.'},
   {i:'💬',t:'Follow-up support',d:'Check in between sessions when something comes up.'}]},
 {id:'circles',name:'Recovery Circles',ico:'⭕',accent:'#6b4f8a',side:'L',page:'GroupSessions',
  tag:'Meetings & circles',desc:'Live support circles, meetings, and rooms where nobody recovers alone.',
  peek:'Chairs in a circle, warm light, a schedule on the wall.',
  inside:['Live circles','Upcoming schedule','Join a room'],
  quote:'“Connection is the opposite of addiction — and the heart of this room.”',
  cards:[
   {i:'🗓️',t:'Upcoming circles',d:'See what’s meeting today and this week, in-person and virtual.'},
   {i:'🎙️',t:'Join a live room',d:'Step into a facilitated GFARC peer circle happening now.'},
   {i:'✋',t:'Check in / attend',d:'Mark your attendance privately for your own record.'},
   {i:'🌱',t:'Start attending',d:'New to circles? A facilitator will welcome you personally.'}]},
 {id:'residences',name:'Recovery Residences',ico:'🏘️',accent:'#c07a3e',side:'L',page:'RecoveryResidences',
  tag:'Housing network',desc:'Recovery residence partners manage houses and beds, and admit VRCC participants as residents — with intake carried over automatically.',
  peek:'Porch lights on a row of recovery houses; a bed board on the wall.',
  inside:['Houses & beds','Admit residents','Intake packet'],
  quote:'“A safe place to sleep is where recovery gets its footing.”',
  cards:[
   {i:'🏘️',t:'Houses & beds',d:'Each residence adds houses and sets how many beds each one has.'},
   {i:'🛏️',t:'Admit a resident',d:'Place a VRCC participant in an open bed with one click.'},
   {i:'📋',t:'Intake packet',d:'Application, agreement, house rules, ROI & relapse policy — read, agree, sign.'},
   {i:'♻️',t:'Carry-over',d:'Prior VRCC intake data pre-fills the residence forms automatically.'}]},
 {id:'resources',name:'Resource Navigation',ico:'🧭',accent:'#4d7fa8',side:'L',page:'CommunityResources',
  tag:'Navigation',desc:'Food, housing, transportation, ID & legal, work, healthcare, benefits — all in one room.',
  peek:'A wall of maps and doorways to real-world help.',
  inside:['Food & housing','Employment','Referrals'],
  quote:'“Recovery grows fastest where basic needs are already met.”',
  cards:[
   {i:'🍲',t:'Food & essentials',d:'Pantries, meals, and everyday essentials across the metro.'},
   {i:'🏠',t:'Housing & shelter',d:'Emergency shelter through recovery housing pathways.'},
   {i:'💼',t:'Work & benefits',d:'Employment support, workforce programs, and benefit navigation.'},
   {i:'🔗',t:'Warm referrals',d:'We connect you person-to-person — never just a phone number.'}]},
 {id:'journey',name:'My Journey Room',ico:'🌿',accent:'#6a8a4f',side:'R',page:'RecoveryTracker',
  tag:'Your space',desc:'Your goals, strengths, check-ins, and recovery capital — a room that belongs only to you.',
  peek:'A desk with your name on it. Your goals on the wall. Yours alone.',
  inside:['Goals','Recovery capital','Reflections'],
  quote:'“Progress isn’t a straight line. It’s a garden — and it’s yours.”',
  cards:[
   {i:'🎯',t:'My goals',d:'What you’re building toward, broken into steps you chose.'},
   {i:'💪',t:'My strengths',d:'Recovery capital across home, health, purpose, and community.'},
   {i:'📈',t:'My progress',d:'Your check-in history and reflections over time — visible only to you.'},
   {i:'📓',t:'Reflections',d:'A private journal that stays private.'}]},
 {id:'lounge',name:'Community Lounge',ico:'☕',accent:'#b06a45',side:'R',page:'Affirmations',
  tag:'Belonging',desc:'Messages, encouragement, and the everyday connection that makes recovery stick.',
  peek:'Couches, coffee, laughter you can almost hear through the glass.',
  inside:['Messages','Encouragement wall','Community'],
  quote:'“Belonging isn’t earned here. It’s the starting point.”',
  cards:[
   {i:'💌',t:'Messages',d:'Connect with peers and coaches inside a moderated, safe space.'},
   {i:'🧡',t:'Encouragement wall',d:'Leave a word of hope. Take one when you need it.'},
   {i:'🎉',t:'Milestones',d:'Celebrate days, months, and years — every one counts.'},
   {i:'🙋',t:'Volunteer',d:'Give back when you’re ready. Service is recovery too.'}]},
 {id:'checkin',name:'Session & Check-In',ico:'🪞',accent:'#b85c6e',side:'R',page:'CheckIns',
  tag:'Check in',desc:'Daily and weekly check-ins, quick pulses, and honest reflection — no judgment, ever.',
  peek:'A quiet booth, a mirror, a simple question: how are you, really?',
  inside:['Daily check-in','Weekly pulse','Reflections'],
  quote:'“You can’t heal what you don’t name — and naming it here is safe.”',
  cards:[
   {i:'☀️',t:'Daily check-in',d:'Thirty seconds, once a day. How are you arriving today?'},
   {i:'📊',t:'Weekly pulse',d:'A short weekly reflection that helps you see your own patterns.'},
   {i:'🧘',t:'Grounding minute',d:'A guided breath before or after anything heavy.'},
   {i:'🤲',t:'Ask for support',d:'One tap to let a peer coach know you’d like a conversation.'}]},
 {id:'assessment',name:'Recovery Capital Room',ico:'🌱',accent:'#7c3aed',side:'R',page:'BARC10',
  tag:'BARC-10',desc:'A two-minute strengths check-in (BARC-10) that shows where your recovery capital is already strong and where a little support would help.',
  peek:'A quiet room with soil and seedlings — a mirror for your strengths, not a test.',
  inside:['BARC-10','Soil type','Next step'],
  quote:'“Name your strengths and they grow. Community rewires the brain.”',
  cards:[
   {i:'🌱',t:'BARC-10 check-in',d:'Ten short statements, scored 10–60 — your recovery capital.'},
   {i:'🪴',t:'Soil type',d:'Path, rocky, thorny, or good soil — a gentle strengths framing.'},
   {i:'➡️',t:'Next step',d:'A personalized, non-punitive next action based on your score.'}]},
 {id:'honor',name:'Walls of Honor',ico:'🌟',accent:'#c8972a',side:'R',page:'WallsOfHonor',
  tag:'Celebrate',desc:'Kudos, memorials, and gratitude — a dignity-centered wall where the community celebrates milestones and honors those we carry with us.',
  peek:'A softly lit gallery of milestones, memories, and thank-yous.',
  inside:['Kudos','Memorial','Gratitude'],
  quote:'“What we honor, we remember. What we celebrate, we repeat.”',
  cards:[
   {i:'⭐',t:'Kudos',d:'Celebrate a milestone — 30, 90, 365 days, or any win.'},
   {i:'🕊️',t:'Memorial',d:'Honor someone we lost, with dignity.'},
   {i:'💚',t:'Gratitude',d:'Share what you are grateful for today.'}]},
 {id:'rooms',name:'Safe Chat Rooms',ico:'💬',accent:'#3f7d78',side:'R',page:'CommunityRooms',
  tag:'Connect',desc:'Ten safe spaces to talk — Open Circle, Justice Journeys, Women’s and Men’s spaces, and more. Anonymous by default, moderated for safety, always.',
  peek:'A hallway of warm doorways, each a different circle of people who get it.',
  inside:['10 rooms','Anonymous','Quick-exit'],
  quote:'“You are not as alone as it feels. Come sit with us.”',
  cards:[
   {i:'⭕',t:'Open Circle',d:'Everyone welcome — come as you are.'},
   {i:'⚖️',t:'Justice Journeys',d:'Reentry, court, and starting over.'},
   {i:'🌙',t:'Late Night',d:'When the hard hours hit, someone is here.'},
   {i:'🛡️',t:'Always safe',d:'Crisis-aware moderation and a one-tap quick exit.'}]},
 {id:'events',name:'Events Wall',ico:'📅',accent:'#4d7fa8',side:'R',page:'EventsWall',
  tag:'What’s on',desc:'Workshops, meetings, jobs, and community gatherings — post an event or RSVP in a tap.',
  peek:'A community bulletin board, full of what’s coming up.',
  inside:['Workshops','Jobs','RSVP'],
  quote:'“Showing up together is where recovery becomes a life.”',
  cards:[
   {i:'📅',t:'Upcoming',d:'See what’s happening across the community.'},
   {i:'💼',t:'Jobs & workshops',d:'Career, skills, and learning opportunities.'},
   {i:'✅',t:'RSVP',d:'Count yourself in with one tap.'}]},
 {id:'staff',name:'Staff & Volunteer Area',ico:'🗝️',accent:'#5c6b7a',side:'R',page:'StaffOperations',
  tag:'Staff',desc:'For coaches, volunteers, and operators — house operations behind the scenes.',
  peek:'Coach & volunteer workspace — alerts, screens, incidents, and coordination.',
  inside:['Alerts','Drug screens','Incidents','House meetings'],
  quote:'“Behind every open door is someone quietly holding it.”',
  cards:[
   {i:'🔐',t:'Coach sign-in',d:'Volunteer peer coaches sign in to access coordination tools.'},
   {i:'📋',t:'Program operations',d:'Attendance, engagement, and outcome views for operators.'},
   {i:'🛡️',t:'Privacy governance',d:'Board-adopted Participant Data Privacy Framework applies to everything here.'},
   {i:'🤍',t:'Volunteer with GFA',d:'Interested in becoming a peer coach? Start the conversation.'}]}
];
const POINTS=[
 {n:1,t:'The Foundations of Recovery',m:'My life has value. Today matters. I am not fixed.',ic:'Identify'},
 {n:2,t:'The Main Practice — Building Inner Freedom',m:'I can relate to cravings, thoughts, and triggers without obeying them.',ic:'Assess'},
 {n:3,t:'Transforming Struggles into Growth',m:'Difficulty can become fuel, not failure.',ic:'Respond'},
 {n:4,t:'Living Recovery Every Day',m:'Recovery becomes rhythm.',ic:'Respond'},
 {n:5,t:'Measuring Progress',m:'Progress is transformation, not perfection.',ic:'Assess'},
 {n:6,t:'Recovery Disciplines',m:'Boundaries, integrity, and community protect recovery.',ic:'Respond'},
 {n:7,t:'Recovery Guidelines',m:'Recovery becomes purpose, service, and freedom.',ic:'Empower'}
];
const RTM=[
{n:1,t:'First, embrace the four foundations',p:1,ic:'Identify',d:'Spiritual',th:'Foundations',i:'gentle',
 r:'Your life has value, today matters, change is possible, and help is real — recovery stands on these four stones.',
 pr:'Say each foundation out loud once this morning, slowly, like laying stones.',
 nu:'Repeating core truths strengthens the neural pathways that carry identity and hope.',
 g:'Grace laid the foundation before you arrived — you build on love, not on shame.',
 sr:'Matthew 7:24',sl:'Build the house on rock, not sand.'},
{n:2,t:'Treat cravings and triggers as passing thoughts, not solid realities',p:2,ic:'Assess',d:'Intellectual',th:'Craving response',i:'moderate',
 r:'A craving is weather moving through, not a command; watch it rise, crest, and pass.',
 pr:'Next urge, set a ten-minute timer and simply observe it like a wave.',
 nu:'Urges peak and fall within minutes; riding the wave weakens the habit loop that feeds them.',
 g:'You are not what passes through your mind; grace holds you while the wave breaks.',
 sr:'Psalm 107:29',sl:'The storm is stilled; the waves grow quiet.'},
{n:3,t:'Notice the awareness that exists before the craving hits',p:2,ic:'Assess',d:'Intellectual',th:'Awareness',i:'moderate',
 r:'Behind every thought is the one noticing it — and the noticer is already free.',
 pr:'Once today, pause mid-thought and ask: who is watching this thought?',
 nu:'Naming inner states activates regulation circuits and loosens automatic reactions.',
 g:'The stillness underneath the noise is where grace has always been waiting for you.',
 sr:'1 Kings 19:12',sl:'The still, small voice beneath the storm.'},
{n:4,t:'Don’t become addicted to recovery itself — even the tools can become crutches',p:2,ic:'Assess',d:'Purpose',th:'Balance',i:'moderate',
 r:'Even good tools become crutches when gripped in fear; hold your practices with open hands.',
 pr:'Notice one recovery habit you do rigidly, and try doing it gently instead.',
 nu:'Flexible routines build broader neural networks than rigid rituals ever can.',
 g:'Grace is the ground; the tools are scaffolding. Don’t worship the scaffolding.',
 sr:'Mark 2:27',sl:'Practices were made for people, not people for practices.'},
{n:5,t:'Rest in the present moment, not in past regrets or future fears',p:2,ic:'Assess',d:'Emotional',th:'Presence',i:'gentle',
 r:'Notice when the mind is living in shame or worry, and come back to this breath, this body, this moment.',
 pr:'Three times today, pause and name five things you can sense right now.',
 nu:'Presence quiets the brain’s threat loops and helps bring the prefrontal cortex back online.',
 g:'Grace meets you in the present moment. Yesterday cannot trap you; tomorrow does not define you.',
 sr:'Matthew 6:34',sl:'Today has enough in it; you are invited back into now.'},
{n:6,t:'After meditation or meetings, carry that clarity into daily life',p:2,ic:'Respond',d:'Physical',th:'Integration',i:'gentle',
 r:'The circle is practice; the parking lot is the exam. Carry the calm into ordinary moments.',
 pr:'After your next meeting or quiet time, keep its pace for the first hour that follows.',
 nu:'Transferring a calm state into daily settings generalizes the learning across contexts.',
 g:'What you receive in the quiet is meant to walk out the door with you.',
 sr:'James 1:22',sl:'Be doers of the word, not hearers only.'},
{n:7,t:'Practice give and take — receive support, offer support',p:2,ic:'Connect',d:'Social',th:'Mutuality',i:'gentle',
 r:'Recovery breathes in and out: let yourself receive help, and let yourself give it.',
 pr:'Today, ask for one small thing and offer one small thing.',
 nu:'Both giving and receiving support release bonding chemistry that steadies a stressed brain.',
 g:'Grace flows through open hands — the ones that receive and the ones that give.',
 sr:'Acts 20:35',sl:'There is blessing in giving as well as receiving.'},
{n:8,t:'Work with three types of people, three challenges, and three remedies',p:2,ic:'Connect',d:'Social',th:'Relationships',i:'moderate',
 r:'Some people soothe you, some stretch you, some sting you — each one is practice material.',
 pr:'Name one person in each category and one kind response you could bring them.',
 nu:'Rehearsing responses ahead of time gives the reasoning brain a head start on reactivity.',
 g:'Every difficult person is also carrying something; grace sees the load, not just the behavior.',
 sr:'Luke 6:31',sl:'Treat others the way you hope to be treated.'},
{n:9,t:'Use recovery principles in all situations',p:2,ic:'Respond',d:'Purpose',th:'Whole-life practice',i:'moderate',
 r:'There is no room in your life where recovery doesn’t apply — bring it to work, home, traffic, and grief.',
 pr:'Pick the one situation where you usually leave recovery at the door, and bring it there today.',
 nu:'Practicing a skill across many settings wires it as identity rather than routine.',
 g:'Grace doesn’t stay in the meeting room; it goes everywhere you go.',
 sr:'Colossians 3:17',sl:'Whatever you do, do it all in that spirit.'},
{n:10,t:'Begin recovery work with yourself before trying to fix others',p:2,ic:'Identify',d:'Emotional',th:'Humility',i:'moderate',
 r:'The person you can actually change is the one reading this sentence.',
 pr:'When the urge to fix someone rises today, redirect one honest look inward instead.',
 nu:'Self-directed attention builds insight circuits; outward blame just rehearses stress.',
 g:'Grace starts its renovation at your address first — kindly, room by room.',
 sr:'Matthew 7:5',sl:'Tend your own eye before your neighbor’s.'},
{n:11,t:'When the world is full of harm, transform every difficulty into the path of recovery',p:3,ic:'Respond',d:'Spiritual',th:'Transformation',i:'deep',
 r:'Difficulty can become fuel rather than failure; the obstacle itself becomes the practice.',
 pr:'Take today’s hardest moment and ask: what is this teaching me to strengthen?',
 nu:'Reframing stress as challenge shifts the body’s response from threat toward growth.',
 g:'Nothing is wasted with grace — even the broken pieces get built with.',
 sr:'Romans 8:28',sl:'All things can be worked toward good.'},
{n:12,t:'Bring every blame to one place — the self-protective ego',p:3,ic:'Assess',d:'Emotional',th:'Ownership',i:'deep',
 r:'Trace resentment far enough and you find the frightened self-protector; meet it with honesty, not shame.',
 pr:'Next blame that rises, ask quietly: what is my part, and what am I protecting?',
 nu:'Owning your part engages learning circuits; blame keeps the alarm system running the show.',
 g:'You can afford honesty, because grace already decided you are worth keeping.',
 sr:'Psalm 139:23',sl:'Search me and know my heart.'},
{n:13,t:'Be grateful to everyone who helps reveal your patterns',p:3,ic:'Connect',d:'Social',th:'Gratitude',i:'moderate',
 r:'The people who irritate you are showing you exactly where the work is — thank them silently.',
 pr:'Write one sentence of silent gratitude for someone who triggered you this week.',
 nu:'Gratitude practice measurably shifts attention networks away from constant threat-scanning.',
 g:'Grace sends teachers in strange packaging.',
 sr:'1 Thessalonians 5:18',sl:'Give thanks in all circumstances.'},
{n:14,t:'See confusion itself as workable — it is not the enemy',p:3,ic:'Assess',d:'Intellectual',th:'Acceptance',i:'moderate',
 r:'Not knowing is a doorway, not a defect; confusion means something new is being learned.',
 pr:'Say once today: “I don’t know yet — and that’s workable.”',
 nu:'Tolerating uncertainty calms the brain’s craving for premature certainty and quick escape.',
 g:'Grace is comfortable in the fog; you are allowed to be mid-process.',
 sr:'Proverbs 3:5',sl:'Trust beyond your own understanding.'},
{n:15,t:'Use four practices: accumulate support, purify harm, feed what protects recovery, and make peace with what disrupts it',p:3,ic:'Respond',d:'Spiritual',th:'Four practices',i:'deep',
 r:'Gather support, clean up harm, feed what protects your recovery, and make peace with what disrupts it.',
 pr:'Choose one of the four practices and give it fifteen honest minutes today.',
 nu:'Approach-and-repair behaviors retrain avoidance loops better than willpower alone.',
 g:'Grace supplies all four: companions, forgiveness, nourishment, and peace.',
 sr:'Micah 6:8',sl:'Act justly, love mercy, walk humbly.'},
{n:16,t:'Whatever happens, use it immediately in recovery practice',p:3,ic:'Respond',d:'Purpose',th:'Immediacy',i:'moderate',
 r:'Don’t file the moment away for later; the situation in front of you is the curriculum.',
 pr:'At the next surprise today, respond within one breath with one recovery principle.',
 nu:'Immediate practice binds learning to real context, where the brain stores it deepest.',
 g:'Grace works in real time — this moment is not a rehearsal.',
 sr:'Psalm 118:24',sl:'This is the day; practice within it.'},
{n:17,t:'Practice the five strengths — intention, familiarity, seed of goodness, accountability, and aspiration',p:4,ic:'Respond',d:'Spiritual',th:'Five strengths',i:'moderate',
 r:'Intention, familiarity, the seed of goodness, accountability, and aspiration — five muscles of a durable recovery.',
 pr:'Rate each strength one to five tonight, and pick the weakest to feed tomorrow.',
 nu:'Repetition — familiarity — is the engine of neuroplasticity; the reps are the rewiring.',
 g:'The seed of goodness was planted in you long before the struggle; strengthen what is already there.',
 sr:'Philippians 4:13',sl:'Strength flows in for everything faced.'},
{n:18,t:'At the moment of death, practice the five strengths again',p:4,ic:'Respond',d:'Spiritual',th:'Endings',i:'deep',cs:false,
 r:'Endings — of days, seasons, and life itself — are met the same way: with intention, practice, goodness, accountability, and hope.',
 pr:'At tonight’s end, close the day with one written line of intention for tomorrow.',
 nu:'How we frame endings shapes the memory the brain consolidates overnight.',
 g:'Nothing about you is unfinished to grace — beginnings and endings are both held.',
 sr:'Psalm 23:4',sl:'Even that valley is walked accompanied.'},
{n:19,t:'All recovery teachings point to one thing — reducing self-centeredness',p:5,ic:'Assess',d:'Spiritual',th:'Center',i:'deep',
 r:'Every practice loosens the same knot: the exhausting project of defending the self.',
 pr:'Do one anonymous kindness today and tell no one.',
 nu:'Self-referential rumination quiets when attention turns genuinely outward.',
 g:'Losing the smaller self is how the truer one, made in love, gets room to breathe.',
 sr:'Matthew 16:25',sl:'Release the small life to find the real one.'},
{n:20,t:'Of the two witnesses, trust the one who sees your heart',p:5,ic:'Assess',d:'Emotional',th:'Integrity',i:'moderate',
 r:'Others see your performance; you see your heart. Let the inner witness be the one you answer to.',
 pr:'Tonight ask: did I live honestly today, by my own account?',
 nu:'Internal standards sustain motivation long after external approval fades.',
 g:'The One who sees the heart is gentler with it than you are.',
 sr:'1 Samuel 16:7',sl:'People see the surface; the heart is what is seen truly.'},
{n:21,t:'Always maintain a joyful mind',p:5,ic:'Assess',d:'Emotional',th:'Joy',i:'gentle',
 r:'Joy is not denial — it is the trained ability to find what is still good, even mid-struggle.',
 pr:'Collect three small good things today and name them out loud tonight.',
 nu:'Savoring a good moment for ten full seconds helps the brain actually keep it.',
 g:'Joy is grace’s evidence — it grows in soil shame said was ruined.',
 sr:'Nehemiah 8:10',sl:'Joy itself is the strength.'},
{n:22,t:'If you can practice even when distracted, you are well trained',p:5,ic:'Assess',d:'Intellectual',th:'Resilience',i:'moderate',
 r:'The test isn’t the quiet morning; it’s the chaotic afternoon. Practice inside the noise.',
 pr:'In your most scattered hour today, take three deliberate breaths without leaving the room.',
 nu:'Skills practiced under load transfer to real life far better than skills practiced only in calm.',
 g:'Grace doesn’t need ideal conditions — it specializes in the middle of the mess.',
 sr:'Isaiah 43:2',sl:'Through the waters — accompanied.'},
{n:23,t:'Always train in three basic principles',p:6,ic:'Respond',d:'Purpose',th:'Commitments',i:'moderate',
 r:'Keep your commitments, stay humble in practice, and be patient with the process — three rails that hold.',
 pr:'Write your three commitments where you will see them tomorrow morning.',
 nu:'Clear, visible commitments reduce decision fatigue when willpower runs low.',
 g:'Grace keeps covenant even when you wobble — that is what makes yours possible.',
 sr:'Psalm 15:4',sl:'Keeping your word, even when it costs.'},
{n:24,t:'Change your attitude, but remain natural',p:6,ic:'Respond',d:'Emotional',th:'Authenticity',i:'gentle',
 r:'Transformation isn’t performance; let the change be real and let yourself stay human.',
 pr:'Practice one attitude shift today without announcing it to anyone.',
 nu:'Authentic change consolidates; performed change collapses under stress.',
 g:'Grace renews you into more yourself — not into somebody else’s costume.',
 sr:'Psalm 51:6',sl:'Truth in the inward being.'},
{n:25,t:'Don’t talk about injured limbs — don’t define people by their wounds',p:6,ic:'Connect',d:'Social',th:'Dignity',i:'moderate',
 r:'Person-first is a discipline: nobody here is their worst season or their diagnosis.',
 pr:'Catch one label today — about anyone, including you — and restate it person-first.',
 nu:'The labels we rehearse shape how the brain predicts people, including ourselves.',
 g:'Grace calls people by name, never by wound.',
 sr:'Isaiah 43:1',sl:'Called by name, not by history.'},
{n:26,t:'Don’t dwell on other people’s faults',p:6,ic:'Connect',d:'Social',th:'Focus',i:'gentle',
 r:'Cataloguing others’ failures is a full-time job with no benefits; resign today.',
 pr:'For each fault you notice in someone today, notice one strength to match it.',
 nu:'Attention is training: what you scan for becomes what you see everywhere.',
 g:'Grace covers their faults the same way it covers yours — generously.',
 sr:'1 Peter 4:8',sl:'Love covers a multitude.'},
{n:27,t:'Work with your strongest reactions first',p:6,ic:'Respond',d:'Emotional',th:'Priority',i:'deep',
 r:'Your biggest reaction marks your deepest wound — start the work where the charge is strongest.',
 pr:'Name your single strongest trigger, and plan one kinder response to it.',
 nu:'High-emotion patterns are the most deeply wired — and change fastest with direct, repeated attention.',
 g:'Grace isn’t afraid of your biggest feeling; bring the loud one first.',
 sr:'Psalm 34:18',sl:'Near to the brokenhearted.'},
{n:28,t:'Give up hoping for applause',p:6,ic:'Respond',d:'Purpose',th:'Motive',i:'moderate',
 r:'Do the right thing when nobody claps; recovery built on applause collapses in silence.',
 pr:'Do something good today and deliberately let it go unseen.',
 nu:'Intrinsic motivation outlasts reward-seeking — and rewires deeper.',
 g:'You are already fully seen and fully loved; applause is redundant.',
 sr:'Matthew 6:4',sl:'Done in secret, seen in full.'},
{n:29,t:'Give up poisonous thinking',p:6,ic:'Respond',d:'Intellectual',th:'Thought hygiene',i:'moderate',
 r:'Resentment, envy, and contempt are poisons you drink yourself — set the cup down.',
 pr:'When a poisonous thought loops today, interrupt it once with a written kinder sentence.',
 nu:'Interrupting rumination even briefly weakens the loop’s automatic replay.',
 g:'Grace offers clean water for old poison — trade up.',
 sr:'Philippians 4:8',sl:'Think on what is true and good.'},
{n:30,t:'Don’t be so predictable in your ego reactions',p:6,ic:'Assess',d:'Emotional',th:'Pattern-breaking',i:'moderate',
 r:'Your ego runs the same three plays; surprise it with a fourth.',
 pr:'In one familiar conflict today, deliberately respond differently than you always do.',
 nu:'Novel responses force new pathways; predictable ones just deepen the rut.',
 g:'Grace makes new responses possible where old ones felt inevitable.',
 sr:'Ezekiel 36:26',sl:'A new heart, a new responsiveness.'},
{n:31,t:'Don’t attack others’ sore spots',p:6,ic:'Connect',d:'Social',th:'Gentleness',i:'moderate',
 r:'You know where people are tender — knowing is a trust, not a weapon.',
 pr:'Hold back one cutting remark today, even a justified one.',
 nu:'Restraint under provocation is strength-training for the whole regulation system.',
 g:'Grace handles tender places with clean hands — go and do likewise.',
 sr:'Ephesians 4:29',sl:'Words that build, not wound.'},
{n:32,t:'Don’t transfer your burdens onto others',p:6,ic:'Connect',d:'Social',th:'Responsibility',i:'moderate',
 r:'Share your load honestly — but don’t strap it to someone else’s back and call it sharing.',
 pr:'Before venting today, ask permission first: “Do you have room for something heavy?”',
 nu:'Consent transforms venting from contagion into co-regulation.',
 g:'There is One built to carry the full weight; people help hold, not haul.',
 sr:'Galatians 6:2,5',sl:'Help carry each other — and carry your own pack.'},
{n:33,t:'Don’t make recovery a competition',p:6,ic:'Connect',d:'Social',th:'Non-comparison',i:'gentle',
 r:'Their day count is not your scoreboard; the only lane that matters is yours.',
 pr:'Celebrate someone else’s milestone today without measuring yours against it.',
 nu:'Comparison hijacks the same reward circuits your recovery needs for its own wins.',
 g:'Grace isn’t rationed; their portion doesn’t shrink yours.',
 sr:'Galatians 6:4',sl:'Test your own work; carry your own joy.'},
{n:34,t:'Don’t twist recovery practice into self-protection',p:6,ic:'Assess',d:'Spiritual',th:'Openness',i:'deep',
 r:'Boundaries protect recovery; walls just relocate the isolation. Learn the difference.',
 pr:'Find one place you’ve used recovery language to avoid people, and open it one inch.',
 nu:'Avoidance shrinks the world the brain will tolerate; gentle approach re-expands it.',
 g:'Grace is a door, not a bunker.',
 sr:'2 Timothy 1:7',sl:'Not a spirit of fear.'},
{n:35,t:'Don’t turn compassion into a weapon',p:6,ic:'Connect',d:'Social',th:'Clean motive',i:'moderate',
 r:'Help that keeps score isn’t help; give without invoices attached.',
 pr:'Do one act of care today and release all rights to bring it up later.',
 nu:'Strings-attached giving triggers threat responses in both people; clean giving bonds.',
 g:'Grace gave first and gave freely; that is the pattern.',
 sr:'1 Corinthians 13:5',sl:'Love keeps no record.'},
{n:36,t:'Don’t use others’ suffering for your own gain',p:6,ic:'Connect',d:'Social',th:'Integrity',i:'deep',
 r:'Other people’s pain is holy ground, not raw material — take your shoes off.',
 pr:'Notice today if a story you tell uses someone’s pain to make you look good — and stop telling it.',
 nu:'Exploiting others corrodes the trust circuits that community healing depends on.',
 g:'Grace never monetizes a wound — it dresses one.',
 sr:'Proverbs 17:5',sl:'Never make sport of another’s hardship.'},
{n:37,t:'Practice all slogans with one intention',p:7,ic:'Empower',d:'Spiritual',th:'Unity',i:'moderate',
 r:'Fifty-nine practices, one aim: a free mind and an open heart.',
 pr:'Write your one-sentence intention for recovery and read it before each practice.',
 nu:'A single organizing intention helps consolidate many skills into one identity.',
 g:'The one intention underneath everything: live loved, and love back.',
 sr:'Matthew 22:37–39',sl:'Everything hangs on love.'},
{n:38,t:'Correct all wrongs with one intention',p:7,ic:'Empower',d:'Spiritual',th:'Repair',i:'deep',
 r:'When you get it wrong — and you will — repair with the same single intention: restore, don’t perform.',
 pr:'Make one small, unprompted repair today: a text, an apology, a returned call.',
 nu:'Repair completes the stress cycle that unresolved conflict keeps looping.',
 g:'Grace never asks for groveling — only truth and turning.',
 sr:'1 John 1:9',sl:'Honest confession, faithful mercy.'},
{n:39,t:'Two things to do: begin and end with intention',p:7,ic:'Empower',d:'Spiritual',th:'Bookends',i:'gentle',
 r:'Bookend the day: set the mind on waking, review the heart on sleeping — the middle takes care of itself better.',
 pr:'Tomorrow, speak one sentence of intention before your feet hit the floor.',
 nu:'Morning intention primes attention networks; evening review lets sleep consolidate the learning.',
 g:'Begin held, end held — grace on both bookends.',
 sr:'Psalm 92:2',sl:'Love in the morning, faithfulness at night.'},
{n:40,t:'Be patient whether one or both occur',p:7,ic:'Empower',d:'Emotional',th:'Patience',i:'moderate',
 r:'Some days both bookends happen, some days neither; patience with the practice is the practice.',
 pr:'If you miss a practice today, note it without one word of self-attack — and simply resume.',
 nu:'Self-criticism after lapses predicts quitting; self-kindness predicts resuming.',
 g:'Grace has no stopwatch on your growth.',
 sr:'2 Peter 3:9',sl:'Patient beyond all timelines.'},
{n:41,t:'Two practices matter most — morning intention setting, evening reflection',p:7,ic:'Empower',d:'Spiritual',th:'Daily rhythm',i:'gentle',
 r:'Recovery becomes rhythm: aim the morning, harvest the evening — every single day.',
 pr:'Tonight, answer two lines: What went well? What will I do differently tomorrow?',
 nu:'Daily reflection turns experience into wiring; sleep does the filing.',
 g:'Morning mercy, evening review — the oldest rhythm there is.',
 sr:'Lamentations 3:22–23',sl:'Mercies new every morning.'},
{n:42,t:'Whether things go well or badly, stay steady',p:7,ic:'Empower',d:'Emotional',th:'Equanimity',i:'moderate',
 r:'Good news and bad news are both weather; keep the same practice in both.',
 pr:'Whatever today brings, keep one anchor habit exactly the same.',
 nu:'Consistent routines give the nervous system a stable floor when events don’t.',
 g:'Grace is the constant in both forecasts.',
 sr:'Hebrews 13:8',sl:'The same yesterday, today, and forever.'},
{n:43,t:'Protect two things at the cost of everything else — recovery and integrity',p:7,ic:'Empower',d:'Purpose',th:'Non-negotiables',i:'deep',
 r:'Many things are negotiable; these two are not. Every decision passes through them first.',
 pr:'Name one current situation leaning on your integrity, and decide what protecting it costs.',
 nu:'Pre-decided values shortcut the exhausted brain’s worst late-night bargains.',
 g:'What grace rebuilt in you is worth guarding like treasure.',
 sr:'Proverbs 4:23',sl:'Guard the heart above all.'},
{n:44,t:'Train in three difficulties — catching triggers early, knowing what to do when triggered, and preventing return-to-use patterns',p:7,ic:'Empower',d:'Intellectual',th:'Early warning',i:'deep',
 r:'Catch the trigger early, know your response, and interrupt the old pattern before it completes.',
 pr:'Write your top three early warning signs and one response for each — tonight.',
 nu:'Recognizing a pattern early recruits the reasoning brain before the habit loop closes.',
 g:'Grace meets you at step one of the spiral, not just at the bottom.',
 sr:'1 Corinthians 10:13',sl:'There is always a way through.'},
{n:45,t:'Rely on three supports — mentors and sponsors, recovery principles, and community',p:7,ic:'Connect',d:'Social',th:'Support',i:'gentle',
 r:'A three-legged stool stands: someone ahead of you, something true, and people around you.',
 pr:'Check each leg today: contact a mentor, reread a principle, show up to community.',
 nu:'Layered support builds redundancy — when one system is down, another holds.',
 g:'Grace usually arrives wearing other people’s faces.',
 sr:'Ecclesiastes 4:12',sl:'The three-strand cord holds.'},
{n:46,t:'Don’t let three things weaken — gratitude for support, commitment to practice, and ethical conduct',p:7,ic:'Empower',d:'Purpose',th:'Maintenance',i:'moderate',
 r:'Gratitude, commitment, and ethics — check the bolts before they rattle loose.',
 pr:'Give each of the three a one-word status check tonight: strong, slipping, or missing.',
 nu:'Small maintenance prevents the drift that big collapses are made of.',
 g:'Grace maintains what it builds — join the maintenance crew.',
 sr:'Galatians 6:9',sl:'Do not grow weary in doing good.'},
{n:47,t:'Keep three things inseparable — body, speech, and mind aligned with recovery',p:7,ic:'Empower',d:'Physical',th:'Alignment',i:'moderate',
 r:'Say what you mean, do what you say, think what you live — alignment is peace.',
 pr:'Find one place today where your words and actions disagree, and close the gap.',
 nu:'Congruence lowers the background stress of self-monitoring a divided life.',
 g:'Whole-hearted is how grace intends you — undivided.',
 sr:'Psalm 86:11',sl:'An undivided heart.'},
{n:48,t:'Train without bias in all areas — make recovery whole-life practice',p:7,ic:'Empower',d:'Purpose',th:'Wholeness',i:'moderate',
 r:'No favorite arenas and no exempt ones: money, family, work, body — recovery covers the map.',
 pr:'Pick your most neglected life area and give it one recovery-shaped action this week.',
 nu:'Broad practice builds broad networks; narrow practice leaves blind spots wired old.',
 g:'Grace claims the whole property, not just the front room.',
 sr:'1 Corinthians 10:31',sl:'Whatever you do, do it all this way.'},
{n:49,t:'Always practice with what feels most difficult',p:7,ic:'Empower',d:'Emotional',th:'Courage',i:'deep',
 r:'The practice you are avoiding is probably the one that matters most right now.',
 pr:'Name the thing you least want to face this week, and take its first smallest step.',
 nu:'Approaching the avoided thing is the fastest known route to rewiring fear.',
 g:'Grace goes into the hard room first and holds the door.',
 sr:'Joshua 1:9',sl:'Courage — for you are accompanied.'},
{n:50,t:'Stay committed regardless of external circumstances',p:7,ic:'Empower',d:'Purpose',th:'Constancy',i:'deep',
 r:'Weather changes, funding changes, people change — the commitment doesn’t.',
 pr:'Write the sentence “My recovery is not contingent on ______” and fill the blank honestly.',
 nu:'Identity-level commitments survive the conditions that break motivation-level ones.',
 g:'Grace’s commitment to you never depended on circumstances either.',
 sr:'Romans 8:38–39',sl:'Nothing can separate.'},
{n:51,t:'Focus on three essentials — helping others, spiritual practice, and developing compassion',p:7,ic:'Connect',d:'Purpose',th:'Essentials',i:'moderate',
 r:'When life narrows, keep three things: serve someone, tend your spirit, grow compassion.',
 pr:'Do the smallest version of all three today — one text, one quiet minute, one kind thought.',
 nu:'Service and compassion practices reliably lift mood and steady the stress system.',
 g:'The essentials are grace’s own habits — borrowed daily.',
 sr:'Micah 6:8',sl:'Justly, mercy, humbly.'},
{n:52,t:'Don’t misinterpret recovery — watch for six common distortions',p:7,ic:'Assess',d:'Intellectual',th:'Discernment',i:'deep',
 r:'Recovery can be twisted into avoidance, superiority, rigidity, performance, isolation, or excuse — inspect yours honestly.',
 pr:'Consider the six distortions and circle the one you’re closest to this month.',
 nu:'Naming a distortion moves it from invisible operating system to visible object.',
 g:'Grace corrects gently — discernment is kindness with its eyes open.',
 sr:'John 8:32',sl:'The truth frees.'},
{n:53,t:'Be consistent in your recovery practice',p:7,ic:'Empower',d:'Purpose',th:'Consistency',i:'gentle',
 r:'Small and daily beats big and occasional, every time.',
 pr:'Shrink one practice until it is too small to skip, then do it daily.',
 nu:'Frequency, not intensity, is what carves lasting neural pathways.',
 g:'Grace shows up daily; match its schedule.',
 sr:'Luke 9:23',sl:'Daily is the word.'},
{n:54,t:'Commit fully to recovery — no half measures',p:7,ic:'Empower',d:'Purpose',th:'Wholeheartedness',i:'deep',
 r:'Half measures ask you to fight with one hand tied; bring the whole self.',
 pr:'Identify one hedge you’re keeping “just in case,” and tell one trusted person about it.',
 nu:'Ambivalence keeps competing circuits alive; full commitment lets the new pathway win.',
 g:'You were loved with everything; respond in kind.',
 sr:'Deuteronomy 6:5',sl:'With all your heart, soul, and strength.'},
{n:55,t:'Free yourself through honest self-examination — know yourself without fear',p:7,ic:'Assess',d:'Emotional',th:'Self-knowledge',i:'deep',
 r:'Know yourself without fear: the inventory isn’t a trial, it’s a map out.',
 pr:'Write for five unedited minutes tonight: “What I don’t want to admit is…”',
 nu:'Putting inner states into words measurably lowers their grip on the alarm system.',
 g:'You can look at anything, because nothing you find changes how you are held.',
 sr:'Psalm 139:23–24',sl:'Search me, know me, lead me.'},
{n:56,t:'Don’t wallow in self-pity',p:7,ic:'Respond',d:'Emotional',th:'Forward motion',i:'moderate',
 r:'Grieve honestly — then stand up; self-pity is grief that stopped moving.',
 pr:'Set a timer for feeling it fully, and when it rings, take one concrete action.',
 nu:'Action, however small, breaks rumination’s loop faster than analysis does.',
 g:'Grace sits with you in the ashes — and then offers a hand up.',
 sr:'Isaiah 61:3',sl:'Beauty instead of ashes.'},
{n:57,t:'Don’t be jealous of others’ recovery or success',p:7,ic:'Respond',d:'Social',th:'Contentment',i:'moderate',
 r:'Their chapter twelve is not your chapter three’s failure; stories run on different clocks.',
 pr:'When envy pings today, immediately name one thing growing in your own life.',
 nu:'Redirecting comparison toward self-progress re-engages your own reward system.',
 g:'Grace writes each story custom; yours isn’t behind — it’s yours.',
 sr:'John 21:22',sl:'What is that to you? You follow.'},
{n:58,t:'Take recovery seriously — don’t be flippant about it',p:7,ic:'Empower',d:'Purpose',th:'Reverence',i:'moderate',
 r:'This work is life and death dressed in daily clothes — honor it accordingly.',
 pr:'Give your next practice your full attention: phone away, door closed, all in.',
 nu:'Focused attention releases the chemistry that stamps learning in.',
 g:'Holy ground doesn’t always look dramatic; treat the ordinary work as sacred.',
 sr:'Exodus 3:5',sl:'The ground you stand on is holy.'},
{n:59,t:'Don’t expect praise for staying in recovery — it’s its own reward',p:7,ic:'Empower',d:'Purpose',th:'Intrinsic reward',i:'moderate',
 r:'The reward is the life itself: the clear morning, the kept promise, the honest mirror.',
 pr:'Tonight, list what recovery gave you today that nobody applauded.',
 nu:'Noticing intrinsic rewards trains the brain to want the life, not just the credit.',
 g:'The quiet well-done in your heart outweighs any crowd.',
 sr:'Matthew 25:21',sl:'Well done, faithful one.'}
];

const DESK_OPTS=[
 {i:'🧭',t:'Help me figure out where to go',d:'A quick, friendly orientation — we’ll walk you to the right room.',act:'orient'},
 {i:'💬',t:'I’d like to talk to someone',d:'Connect with a volunteer peer coach — a real person with lived experience.',act:'talk'},
 {i:'📞',t:'Warmline & support options',d:'Non-crisis peer support lines and community connection options.',act:'warm'},
 {i:'🆘',t:'I need urgent help right now',d:'If you’re in crisis, call or text 988 (Suicide & Crisis Lifeline) — 24/7. You matter.',act:'crisis'},
 {i:'👋',t:'I’m brand new here',d:'Welcome! Let’s start in the Welcome & Orientation Room together.',act:'new'}
];
const KIOSK_TABS={
 'Directory':ROOMS.map(r=>({b:r.ico+' '+r.name,s:r.tag,go:r.locked?null:r.id,label:r.locked?'Staff only':'Walk there →'})),
 'Check-in':[
  {b:'🌅 Today’s Practice',s:'Recovering the Mind · chosen for today',go:null,label:'Basement →',scene:'basement'},
  {b:'☀️ Daily check-in',s:'30 seconds · private to you',go:'checkin',label:'Open →'},
  {b:'✋ Circle attendance',s:'Mark yourself present',go:'circles',label:'Open →'},
  {b:'🪞 Weekly pulse',s:'A short honest reflection',go:'checkin',label:'Open →'}],
 'Schedule':[
  {b:'⭕ GFARC Peer Circle',s:'Tonight · 7:00 PM · Recovery Circles Room',go:'circles',label:'View →'},
  {b:'🧑‍🤝‍🧑 Coaching hours',s:'Mon–Sat · by appointment',go:'coaching',label:'Book →'},
  {b:'🌿 Garden gathering',s:'Saturday · 10:00 AM · Community Garden',go:null,label:'Garden →',scene:'garden'}],
 'Resources':[
  {b:'🍲 Food & essentials',s:'Pantries & meals near you',go:'resources',label:'Open →'},
  {b:'🏠 Housing & shelter',s:'Emergency through recovery housing',go:'resources',label:'Open →'},
  {b:'🗺️ Full Des Moines map',s:'Every anchor in the registry',go:null,label:'City →',scene:'city'}]
};
const CITY_RES=[
 {n:'Grace For Addictions (VRCC)',c:'Recovery community',d:'Peer-led recovery community organization — you are here.',x:38,y:34,col:'#ffd9a0',home:true,i:'🏛️'},
 {n:'United Way 211 Central Iowa',c:'Navigation',d:'One call connects you to help across the metro, 24/7.',x:30,y:22,col:'#4d7fa8',i:'☎️'},
 {n:'Broadlawns Medical Center',c:'Healthcare',d:'Public hospital with behavioral health and community clinics.',x:24,y:40,col:'#b85c6e',i:'🏥'},
 {n:'Primary Health Care',c:'Healthcare',d:'Community health centers serving everyone, regardless of ability to pay.',x:46,y:52,col:'#b85c6e',i:'🩺'},
 {n:'DMARC Food Pantry Network',c:'Food',d:'A network of pantries across greater Des Moines.',x:58,y:28,col:'#6a8a4f',i:'🍲'},
 {n:'Central Iowa Shelter & Services',c:'Housing',d:'Emergency shelter and housing support downtown.',x:50,y:64,col:'#c99145',i:'🏠'},
 {n:'Hope Ministries',c:'Housing & recovery',d:'Shelter, meals, and long-term recovery programs.',x:42,y:74,col:'#c99145',i:'🕊️'},
 {n:'House of Mercy',c:'Family recovery',d:'Housing and support for parents in recovery with children.',x:20,y:58,col:'#6b4f8a',i:'👨‍👩‍👧'},
 {n:'Employee & Family Resources',c:'Wellbeing',d:'Counseling access, prevention, and family support services.',x:66,y:44,col:'#3f7d78',i:'🤝'},
 {n:'Iowa Workforce Development',c:'Employment',d:'Job search, training, and re-entry employment support.',x:72,y:60,col:'#b06a45',i:'💼'},
 {n:'Urban Dreams',c:'Community',d:'Neighborhood-based advocacy, workforce, and family services.',x:14,y:30,col:'#5c6b7a',i:'🌆'},
 {n:'YSS (Youth & Shelter Services)',c:'Young people',d:'Support, housing, and recovery services for young Iowans.',x:62,y:76,col:'#4d7fa8',i:'🌟'}
];
const SCENE_META={
 arrival:{label:'Outside the VRCC · dusk',hint:'Click the <b>front door</b> to come in — or press <kbd>Enter</kbd>'},
 lobby:{label:'The Lobby',hint:'<kbd>D</kbd> Front Desk · <kbd>K</kbd> Kiosk · <kbd>H</kbd> Hallway · <kbd>Esc</kbd> back'},
 hallway:{label:'Main Hallway',hint:'Hover a door to <b>peek through the window</b> · click to enter · <kbd>Esc</kbd> lobby'},
 room:{label:'Room',hint:'<kbd>Esc</kbd> back to the hallway'},
 basement:{label:'Recovering the Mind',hint:'Pick a <b>movement</b> · flip the card · switch <b>reflection modes</b> · <kbd>Esc</kbd> upstairs'},
 garden:{label:'Community Garden',hint:'Walk through the <b>gates</b> to reach the Des Moines map · <kbd>Esc</kbd> inside'},
 city:{label:'Des Moines · Digital Twin',hint:'Tap a light on the map · <kbd>Esc</kbd> back to the garden'}
};
let current='arrival', history=[], currentRoom=null, hintTimer;

function go(id,dir='forward',push=true){
  if(id===current)return;
  if(current==='room'){ document.body.classList.remove('react-room');
    window.dispatchEvent(new CustomEvent('vrcc:exit-room')); }
  const from=$('#scene-'+current), to=$('#scene-'+id);
  if(push)history.push(current);
  from.classList.remove('active');
  from.classList.add(dir==='forward'?'exit-forward':'exit-back');
  to.classList.add(dir==='forward'?'enter-forward':'enter-back');
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    to.classList.add('active');
    to.classList.remove('enter-forward','enter-back');
  }));
  setTimeout(()=>from.classList.remove('exit-forward','exit-back'),950);
  current=id; syncHUD(); hidePeek();
}
function goBack(){ if(!history.length)return; const prev=history.pop(); go(prev,'back',false); }
function syncHUD(){
  const meta=SCENE_META[current];
  $('#whereLabel').textContent=current==='room'&&currentRoom?currentRoom.name:meta.label;
  $('#backBtn').classList.toggle('show',history.length>0);
  $$('#minimap li').forEach(li=>li.classList.toggle('here',li.dataset.mm===current));
  const h=$('#hint'); clearTimeout(hintTimer);
  h.innerHTML=meta.hint; h.classList.add('show');
  hintTimer=setTimeout(()=>h.classList.remove('show'),6500);
}
function toast(msg){
  const t=$('#toast'); t.innerHTML=msg; t.classList.add('show');
  clearTimeout(t._x); t._x=setTimeout(()=>t.classList.remove('show'),4200);
}
window.goBack=goBack; window.vrccGo=go; window.vrccToast=toast;

function openPanel(id){$('#scrim').classList.add('show');$(id).classList.add('show');}
function closePanels(){$('#scrim').classList.remove('show');$$('.panel').forEach(p=>p.classList.remove('show'));}
$('#scrim').addEventListener('click',closePanels);
$$('[data-close]').forEach(b=>b.addEventListener('click',closePanels));

/* build: arrival */
(function(){
  const stars=$('#stars');
  for(let i=0;i<90;i++){const s=document.createElement('i');s.className='star';
    const sz=Math.random()*2.2+.8;
    s.style.cssText=`left:${Math.random()*100}%;top:${Math.random()*100}%;width:${sz}px;height:${sz}px;--tw:${2+Math.random()*4}s;--o:${.3+Math.random()*.7};animation-delay:${Math.random()*4}s`;
    stars.appendChild(s);}
  const clouds=$('#clouds');
  for(let i=0;i<5;i++){const c=document.createElement('i');c.className='cloud';
    c.style.cssText=`top:${Math.random()*80}%;width:${120+Math.random()*220}px;--d:${70+Math.random()*80}s;animation-delay:-${Math.random()*80}s`;
    clouds.appendChild(c);}
  const sky=$('#skyline'), widths=[6,9,5,11,7,4,13,8,6,10,5,9,7,12,6,8];
  widths.forEach((w,i)=>{const b=document.createElement('div');b.className='bldg';
    const h=26+Math.random()*66; b.style.cssText=`width:${w}%;height:${h}%`;
    if(i===6)b.classList.add('principal'),b.style.height='96%';
    if(i===11)b.classList.add('dome'),b.style.height='40%';
    for(let k=0;k<Math.floor(h/8);k++){const win=document.createElement('i');win.className='win';
      win.style.cssText=`left:${8+Math.random()*80}%;top:${8+Math.random()*84}%;opacity:${Math.random()>.4?.65:0}`;
      b.appendChild(win);}
    sky.appendChild(b);});
  const ff=$('#fireflies');
  for(let i=0;i<14;i++){const f=document.createElement('i');f.className='ff';
    f.style.cssText=`left:${Math.random()*100}%;top:${Math.random()*100}%;--fd:${8+Math.random()*10}s;--fx:${-60+Math.random()*120}px;--fy:${-90+Math.random()*60}px;animation-delay:-${Math.random()*10}s`;
    ff.appendChild(f);}
  const wins=$('#vbWindows');
  for(let i=0;i<12;i++){const w=document.createElement('div');w.className='vb-win';w.style.setProperty('--wd',(Math.random()*5)+'s');
    if(Math.random()>.55){const s=document.createElement('i');s.className='sil';
      s.style.cssText=`left:${15+Math.random()*45}%;width:${22+Math.random()*14}%;height:${34+Math.random()*22}%`;
      w.appendChild(s);}
    wins.appendChild(w);}
})();

/* build: lobby */
(function(){
  const dw=$('#dirWall');
  ROOMS.forEach(r=>{const li=document.createElement('li');
    li.innerHTML=`<i style="background:${r.accent}"></i>${r.name}${r.locked?' 🔒':''}`;dw.appendChild(li);});
  [['#dust',22],['#dustRoom',16]].forEach(([sel,n])=>{const d=$(sel);if(!d)return;
    for(let i=0;i<n;i++){const m=document.createElement('i');m.className='mote';
      m.style.cssText=`left:${Math.random()*100}%;top:${Math.random()*70}%;--md:${10+Math.random()*12}s;--mx:${-40+Math.random()*80}px;--my:${40+Math.random()*90}px;animation-delay:-${Math.random()*12}s`;
      d.appendChild(m);}});
})();

/* build: hallway doors */
(function(){
  const L=$('#hallLeft'),R=$('#hallRight');
  ROOMS.forEach(r=>{
    const d=document.createElement('div');
    d.className='hdoor'+(r.locked?' locked':'');d.tabIndex=0;d.setAttribute('role','button');
    d.setAttribute('aria-label',(r.locked?'Restricted: ':'Enter ')+r.name+'. '+r.peek);
    d.style.setProperty('--rc',r.accent);d.dataset.room=r.id;
    d.innerHTML=`<div class="slab">
      <div class="window"><div class="warm"></div>
        <i class="obj" style="left:16%;bottom:0;width:20%;height:34%"></i>
        <i class="obj" style="right:18%;bottom:0;width:16%;height:26%;border-radius:50% 50% 0 0"></i>
      </div>
      <div class="plaque"><span class="ico">${r.ico}</span><b>${r.name}</b></div>
    </div>`;
    (r.side==='L'?L:R).appendChild(d);
    d.addEventListener('mouseenter',()=>showPeek(r,d));
    d.addEventListener('focus',()=>showPeek(r,d));
    d.addEventListener('mouseleave',hidePeek);
    d.addEventListener('blur',hidePeek);
    d.addEventListener('click',()=>enterRoom(r));
    d.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();enterRoom(r);}});
  });
})();

const peek=$('#peek');
function showPeek(r,el){
  peek.innerHTML=`<div class="p-eyebrow">${r.tag} ${r.locked?'· 🔒 restricted':''}</div>
    <h4>${r.ico} ${r.name}</h4><p>${r.peek}</p>
    <div class="p-inside">${r.inside.map(x=>`<span>${x}</span>`).join('')}</div>
    <div class="p-cta">${r.locked?'Sign-in required':'Click the door to enter →'}</div>`;
  const b=el.getBoundingClientRect();
  let x=Math.min(Math.max(b.left+b.width/2-142,12),innerWidth-296);
  let y=b.top-14-peek.offsetHeight; if(y<70)y=b.bottom+14;
  peek.style.left=x+'px'; peek.style.top=Math.max(70,y)+'px';
  peek.classList.add('show'); peek.setAttribute('aria-hidden','false');
}
function hidePeek(){peek.classList.remove('show');peek.setAttribute('aria-hidden','true');}

/* rooms — bridges to the live React page via a window event */
function enterRoom(r){
  if(r.locked){toast('🗝️ The <em>Staff & Volunteer Area</em> is restricted. Coaches and volunteers sign in here — everyone else, the whole rest of the building is yours.');return;}
  currentRoom=r;
  const sc=$('#scene-room');
  sc.style.setProperty('--room-accent',r.accent);
  $('#roomEyebrow').textContent=r.tag;
  $('#roomTitle').textContent=r.ico+'  '+r.name;
  $('#roomDesc').textContent=r.desc;
  $('#roomQuote').textContent=r.quote;
  const rc=$('#roomCards');rc.innerHTML='';
  r.cards.forEach((c,i)=>{const el=document.createElement('button');el.className='rcard';
    el.style.transitionDelay=(i*40)+'ms';
    el.innerHTML=`<span class="r-ico">${c.i}</span><b>${c.t}</b><span>${c.d}</span>`;
    el.addEventListener('click',()=>toast(`<em>${c.t}</em> — this doorway connects to the live VRCC module in the full build.`));
    rc.appendChild(el);});
  document.body.classList.toggle('react-room', !!r.page);
  window.dispatchEvent(new CustomEvent('vrcc:enter-room',{detail:{id:r.id,page:r.page||null,name:r.name,ico:r.ico,accent:r.accent,tag:r.tag}}));
  go('room','forward');
}
window.vrccEnterRoom=id=>{const r=ROOMS.find(x=>x.id===id);if(r)enterRoom(r);};

/* RECOVERING THE MIND ENGINE */
const rtmCard=$('#sloganCard');
let rtmCur=0, rtmMode='recovery', rtmMv=0;
const MODE_LABEL={recovery:'Sit with it',neuro:'The brain science',grace:'Grace-inclusive',scripture:'Scripture-connected'};
const PT_WORDS=['','One','Two','Three','Four','Five','Six','Seven'];
function rtmList(){return rtmMv?RTM.filter(s=>s.p===rtmMv):RTM;}
function rtmRender(idx,flipBack=true){
  rtmCur=idx; const s=RTM[rtmCur], pt=POINTS[s.p-1];
  if(flipBack)rtmCard.classList.remove('flipped');
  setTimeout(()=>{
    $('#sloganNum').textContent='Slogan '+s.n+' · Point '+PT_WORDS[s.p];
    $('#sloganText').textContent=s.t;
    $('#modeLabel').textContent=MODE_LABEL[rtmMode];
    $('#sloganPrompt').textContent=rtmMode==='neuro'?s.nu:rtmMode==='grace'?s.g:rtmMode==='scripture'?s.sl:s.r;
    $('#sloganRef').textContent=rtmMode==='scripture'?('— '+s.sr):'';
    $('#sloganPractice').innerHTML='<b>Practice:</b> '+s.pr;
    $('#metaChips').innerHTML=
      `<span class="mc gold">Point ${PT_WORDS[s.p]} · ${pt.t}</span>`+
      `<span class="mc">ICARE · ${s.ic}</span><span class="mc">${s.d}</span>`+
      `<span class="mc">${s.th}</span><span class="mc dim">${s.i}</span>`;
    $('#ptMeaning').textContent='“'+pt.m+'”';
  },flipBack?250:0);
}
function rtmNav(dir){
  const L=rtmList(); let i=L.findIndex(s=>s.n===RTM[rtmCur].n);
  if(i<0)i=0; else i=(i+dir+L.length)%L.length;
  rtmRender(RTM.indexOf(L[i]));
}
function setMode(m,announce){
  rtmMode=m;
  $$('.mode-chip').forEach(c=>c.classList.toggle('on',c.dataset.mode===m));
  rtmRender(rtmCur,false); rtmCard.classList.add('flipped');
  if(announce)toast({recovery:'🧠 <em>Recovery reflection</em> — the practice, plain and person-first.',
    neuro:'🔬 <em>Neuroscience lens</em> — attention, repetition, and connection reshape pathways. No hype, just practice.',
    grace:'🕊️ <em>Grace-inclusive lens</em> — always your choice, never required. Every path is honored here.',
    scripture:'📖 <em>Scripture-connected lens</em> — each practice beside a verse. Opt-in, reversible, yours.'}[m]);
}
function setMovement(p){
  rtmMv=p;
  $$('.mv-chip').forEach(c=>c.classList.toggle('on',+c.dataset.mv===p));
  const L=rtmList(); if(!L.some(s=>s.n===RTM[rtmCur].n))rtmRender(RTM.indexOf(L[0]));
  if(p)toast(`✦ <em>Point ${PT_WORDS[p]} — ${POINTS[p-1].t}</em>: “${POINTS[p-1].m}”`);
}
function todaysPick(){
  const now=new Date(), h=now.getHours();
  const seed=now.getFullYear()*10000+(now.getMonth()+1)*100+now.getDate();
  let pool,why;
  if(h<12){pool=[39,41,1,5,21,23,17];why='Morning rhythm · intention';}
  else if(h>=17){pool=[41,20,55,13,42,59,6];why='Evening rhythm · reflection';}
  else{pool=RTM.filter(s=>s.cs!==false&&s.i!=='deep').map(s=>s.n);why='Midday steadiness';}
  const n=pool[seed%pool.length];
  return {n,why};
}
function renderToday(){
  const {n,why}=todaysPick(), s=RTM[n-1];
  $('#todayTitle').textContent=s.t;
  $('#todayWhy').innerHTML=`<span class="mc gold">${why}</span><span class="mc">Point ${PT_WORDS[s.p]}</span><span class="mc">ICARE · ${s.ic}</span>`;
  $('#todayBtn').onclick=()=>{setMovement(0);rtmRender(n-1);
    toast('🌅 <em>Today’s Practice</em> — chosen for where the day is right now. In the full build this listens to your check-ins, recovery capital, and coach plan.');};
}
function rhythmGo(kind){
  setMovement(0);
  rtmRender(kind==='am'?38:40);
  rtmCard.classList.add('flipped');
  toast(kind==='am'
    ?'🌄 <em>Morning intention</em> — one sentence before the day begins. Aim the mind; the day follows.'
    :'🌙 <em>Evening reflection</em> — What went well? What will you do differently tomorrow? Sleep does the filing.');
}
(function(){
  const mv=$('#mvChips');
  const all=document.createElement('button');all.className='mv-chip on';all.dataset.mv=0;all.textContent='All 59';
  all.addEventListener('click',()=>setMovement(0));mv.appendChild(all);
  POINTS.forEach(p=>{const b=document.createElement('button');b.className='mv-chip';b.dataset.mv=p.n;
    b.textContent=PT_WORDS[p.n];b.title=p.t;
    b.addEventListener('click',()=>setMovement(p.n));mv.appendChild(b);});
  $$('.mode-chip').forEach(c=>c.addEventListener('click',()=>setMode(c.dataset.mode,true)));
  rtmCard.addEventListener('click',()=>rtmCard.classList.toggle('flipped'));
  rtmCard.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();rtmCard.classList.toggle('flipped');}});
  $('#sloganNext').addEventListener('click',()=>rtmNav(1));
  $('#sloganPrev').addEventListener('click',()=>rtmNav(-1));
  $('#amBtn').addEventListener('click',()=>rhythmGo('am'));
  $('#pmBtn').addEventListener('click',()=>rhythmGo('pm'));
  const h=new Date().getHours();
  (h<12?$('#amBtn'):h>=17?$('#pmBtn'):null)?.classList.add('now');
  renderToday();
  rtmRender(todaysPick().n-1,false);
})();
function rtmApplyRenew(){
  if(renewOn){setMode('grace',false);}
  else if(rtmMode==='grace'||rtmMode==='scripture'){setMode('recovery',false);}
}

/* garden */
(function(){
  const gp=$('#gardenPlants');
  const blooms=['#e8a4b8','#f4c66a','#a4c4e8','#e88a6a','#c9a4e8','#fff'];
  for(let i=0;i<16;i++){const p=document.createElement('div');p.className='gplant';
    const h=40+Math.random()*70, left=Math.random()*94;
    p.style.cssText=`left:${left}%;bottom:${6+Math.random()*30}%;width:30px;height:${h}px;animation-delay:-${Math.random()*5}s;--lr:${-4+Math.random()*8}deg`;
    p.innerHTML=`<i class="stem" style="height:${h-22}px"></i><i class="bloom" style="top:0;--bl:${blooms[i%blooms.length]}"></i>`;
    gp.appendChild(p);}
  const beds=[
   {i:'🌱',t:'Recovery capital',d:'See what’s growing across home, health, purpose, and community.'},
   {i:'🧘',t:'Wellness practices',d:'Gentle movement, rest, and grounding — tend yourself first.'},
   {i:'🤲',t:'Volunteer plots',d:'Give an hour. Service turns roots into forests.'},
   {i:'📖',t:'Hope & learning',d:'Short, encouraging reads on how people grow and heal.'}];
  const gb=$('#gardenBeds');
  beds.forEach(b=>{const el=document.createElement('button');el.className='gbed';
    el.innerHTML=`<span class="g-ico">${b.i}</span><b>${b.t}</b><span>${b.d}</span>`;
    el.addEventListener('click',()=>toast(`<em>${b.t}</em> — this bed connects to the live VRCC module in the full build.`));
    gb.appendChild(el);});
})();

/* city map */
(function(){
  const map=$('#cityMap'), list=$('#resList');
  CITY_RES.forEach(r=>{
    const m=document.createElement('button');m.className='marker'+(r.home?' home':'');
    m.style.cssText=`left:${r.x}%;top:${r.y}%;--mc:${r.col}`;
    m.setAttribute('aria-label',r.n+' — '+r.c);
    m.innerHTML=`<div class="pin"><i>${r.i}</i></div>`;
    map.appendChild(m);
    const li=document.createElement('button');li.className='res';li.style.setProperty('--mc',r.col);
    li.innerHTML=`<span class="r-dot"></span><div><b>${r.i} ${r.n}</b><span>${r.d}</span><span class="cat">${r.c}</span></div>`;
    list.appendChild(li);
    const sel=()=>{ $$('.marker,.res').forEach(e=>e.classList.remove('sel'));
      m.classList.add('sel');li.classList.add('sel');
      li.scrollIntoView({block:'nearest',behavior:'smooth'});
      toast(`📍 <em>${r.n}</em> — ${r.d}`);};
    m.addEventListener('click',sel); li.addEventListener('click',sel);
  });
})();

/* front desk & kiosk */
(function(){
  const dl=$('#deskOpts');
  DESK_OPTS.forEach(o=>{const el=document.createElement('button');el.className='opt';
    el.innerHTML=`<span class="o-ico">${o.i}</span><div><b>${o.t}</b><span>${o.d}</span></div>`;
    el.addEventListener('click',()=>{
      closePanels();
      if(o.act==='new'){enterRoom(ROOMS[0]);}
      else if(o.act==='talk'){enterRoom(ROOMS[1]);}
      else if(o.act==='orient'){go('hallway','forward');toast('🤝 Right this way — the hallway shows every room. <em>Peek through any window</em> before you enter.');}
      else if(o.act==='crisis'){toast('🆘 If you’re in crisis, please call or text <em>988</em> right now — the Suicide & Crisis Lifeline is free and available 24/7. You matter, and help is real.');}
      else{toast('📞 A volunteer peer will follow up through your preferred contact in the full build. <em>You’re never a bother here.</em>');}
    });
    dl.appendChild(el);});
  const tabs=$('#kioskTabs'), body=$('#kioskBody');
  Object.keys(KIOSK_TABS).forEach((k,i)=>{
    const t=document.createElement('button');t.className='ktab'+(i===0?' on':'');t.textContent=k;
    t.addEventListener('click',()=>{$$('.ktab').forEach(x=>x.classList.remove('on'));t.classList.add('on');renderKiosk(k);});
    tabs.appendChild(t);});
  function renderKiosk(k){
    body.innerHTML='';
    KIOSK_TABS[k].forEach(row=>{const el=document.createElement('button');el.className='kline';el.style.width='100%';
      el.innerHTML=`<div style="text-align:left"><b>${row.b}</b><br><span>${row.s}</span></div><span class="go">${row.label}</span>`;
      el.addEventListener('click',()=>{closePanels();
        if(row.scene)go(row.scene,'forward');
        else if(row.go){const r=ROOMS.find(x=>x.id===row.go);if(r)enterRoom(r);}
        else toast('Staff sign-in required.');});
      body.appendChild(el);});
  }
  renderKiosk('Directory');
})();

/* wiring */
$('#frontDoor').addEventListener('click',()=>{ $('#frontDoor').classList.add('opening');
  setTimeout(()=>{go('lobby','forward');setTimeout(()=>$('#frontDoor').classList.remove('opening'),1000);},420);});
$('#frontDoor').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('#frontDoor').click();}});
$$('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go,b.dataset.dir||'forward')));
const wire=(id,fn)=>{const el=$(id);el.addEventListener('click',fn);
  el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fn();}});};
wire('#frontDeskHS',()=>openPanel('#panelDesk'));
wire('#kioskHS',()=>openPanel('#panelKiosk'));
wire('#hallEntrance',()=>go('hallway','forward'));
wire('#exitLobby',()=>go('arrival','back'));
wire('#gardenGate',()=>go('city','forward'));
$('#backBtn').addEventListener('click',goBack);
$('#safeExit').addEventListener('click',()=>window.location.replace('https://weather.com'));

document.addEventListener('keydown',e=>{
  if(e.target.matches('input,textarea'))return;
  if(e.key==='Escape'){ if($('.panel.show')){closePanels();return;} goBack(); return;}
  if(current==='arrival'&&e.key==='Enter'&&document.activeElement===document.body)$('#frontDoor').click();
  if(current==='lobby'){
    if(e.key==='d'||e.key==='D')openPanel('#panelDesk');
    if(e.key==='k'||e.key==='K')openPanel('#panelKiosk');
    if(e.key==='h'||e.key==='H'||e.key==='ArrowUp')go('hallway','forward');
  }
  if(current==='hallway'&&e.key==='ArrowUp')go('garden','forward');
  if(current==='garden'&&e.key==='ArrowUp')go('city','forward');
  if(current==='basement'){if(e.key==='ArrowRight')rtmNav(1);if(e.key==='ArrowLeft')rtmNav(-1);}
});

let mx=0,my=0,tx=0,ty=0;
document.addEventListener('mousemove',e=>{mx=(e.clientX/innerWidth-.5);my=(e.clientY/innerHeight-.5);});
(function raf(){tx+=(mx-tx)*.05;ty+=(my-ty)*.05;
  if(!document.body.classList.contains('reduce-motion'))
    $$('.scene.active .layer').forEach(l=>{const d=parseFloat(l.dataset.depth||0);
      l.style.transform=`translate(${-tx*d*1000}px,${-ty*d*600}px)`;});
  requestAnimationFrame(raf);})();

$('#motionBtn').addEventListener('click',()=>{
  const on=document.body.classList.toggle('reduce-motion');
  $('#motionBtn').setAttribute('aria-pressed',on);
  $('#motionBtn').textContent=on?'✦ Motion off':'✦ Motion';
});

let ac=null,soundOn=false,nodes=[],masterGain=null;
function buildAmbience(){
  ac=new (window.AudioContext||window.webkitAudioContext)();
  const master=ac.createGain();master.gain.value=0;master.connect(ac.destination);
  [174,261.6].forEach((f,i)=>{
    const o=ac.createOscillator(),g=ac.createGain();
    o.type='sine';o.frequency.value=f;o.detune.value=i?4:-3;
    g.gain.value=.05;o.connect(g);g.connect(master);o.start();nodes.push(o);});
  const buf=ac.createBuffer(1,ac.sampleRate*4,ac.sampleRate),d=buf.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  const n=ac.createBufferSource();n.buffer=buf;n.loop=true;
  const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=340;
  const ng=ac.createGain();ng.gain.value=.045;
  n.connect(f);f.connect(ng);ng.connect(master);n.start();nodes.push(n);
  const lfo=ac.createOscillator(),lg=ac.createGain();
  lfo.frequency.value=.08;lg.gain.value=90;lfo.connect(lg);lg.connect(f.frequency);lfo.start();nodes.push(lfo);
  master.gain.linearRampToValueAtTime(1,ac.currentTime+3);
  return master;
}
$('#soundBtn').addEventListener('click',()=>{
  soundOn=!soundOn;
  $('#soundBtn').setAttribute('aria-pressed',soundOn);
  $('#soundBtn').textContent=soundOn?'🔊 Sound':'🔇 Sound';
  if(soundOn){ if(!ac)masterGain=buildAmbience(); else{ac.resume();masterGain.gain.linearRampToValueAtTime(1,ac.currentTime+1.5);} }
  else if(ac){masterGain.gain.linearRampToValueAtTime(0,ac.currentTime+1);setTimeout(()=>ac.suspend(),1100);}
});

syncHUD();
