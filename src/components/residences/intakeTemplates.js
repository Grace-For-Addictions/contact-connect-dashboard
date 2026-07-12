/**
 * Grace For Addictions · Grace House / EJWRH intake packet.
 * Authoritative content from the GFA Intake Forms Package & Participation
 * Agreement (v1.0). NARR Level II aligned · Trauma-Informed · Peer-Led · 501(c)(3).
 *
 * Each document is read, agreed to, and signed before move-in. `fields[].from`
 * names a carry-over key, so anything already on the applicant's VRCC record is
 * pre-filled and never entered twice.
 */
export const INTAKE_DOCS = [
  {
    type: 'application',
    title: 'Initial Inquiry & Screening',
    intro:
      'Welcome. This is Form 1 of your intake. Anything already on your VRCC record is filled in for you — please review and complete the rest.',
    terms: [
      'Grace House is a grace-based, peer-supported recovery residence operated by Grace For Addictions, a 501(c)(3) nonprofit. It is a JUST GRACE initiative.',
      'This is a Participation Agreement program, not a landlord-tenant arrangement. Residents are program participants, not tenants.',
      'We are MOUD-supportive and honor multiple recovery pathways. There is no automatic expulsion for a return to use — we work with you.',
      'If you are in crisis right now, call or text 988. If you are unsafe in your current living situation, tell us — we will help.',
    ],
    fields: [
      { key: 'full_name', label: 'Full legal name', from: 'full_name', required: true },
      { key: 'preferred_name', label: 'Preferred name / pronouns', from: 'preferred_name' },
      { key: 'date_of_birth', label: 'Date of birth', type: 'date', from: 'date_of_birth' },
      { key: 'phone', label: 'Phone', from: 'phone' },
      { key: 'email', label: 'Email', from: 'email' },
      { key: 'current_location', label: 'Current address / location', from: 'current_location' },
      { key: 'how_heard', label: 'How did you hear about Grace House?', from: 'how_heard' },
      { key: 'history_substance_use', label: 'History of substance use? (yes/no)', from: 'history_substance_use' },
      { key: 'seeking_recovery', label: 'Currently seeking recovery? (yes/no)', from: 'seeking_recovery' },
      { key: 'willing_sober_living', label: 'Willing to live substance-free? (yes/no)', from: 'willing_sober_living' },
      { key: 'housing_urgency', label: 'How urgent is your housing need?', from: 'housing_urgency' },
      { key: 'can_afford_fee', label: 'Able to afford the weekly program fee? (yes/no/need help)', from: 'can_afford_fee' },
      { key: 'on_moud', label: 'On Medication for Opioid Use Disorder (MOUD)? (yes/no)', from: 'on_mat' },
      { key: 'current_medications', label: 'Current prescribed medications', type: 'area', from: 'current_medications' },
      { key: 'justice_involved', label: 'On probation/parole or justice-involved? (yes/no)', from: 'justice_involved' },
      { key: 'recovery_start_date', label: 'Recovery start / sobriety date', type: 'date', from: 'recovery_start_date' },
      { key: 'recovery_pathway', label: 'Recovery pathway(s) you use', from: 'recovery_pathway' },
      { key: 'emergency_contact', label: 'Emergency contact name', from: 'emergency_contact' },
      { key: 'emergency_phone', label: 'Emergency contact phone', from: 'emergency_phone' },
      { key: 'emergency_relationship', label: 'Relationship to emergency contact', from: 'emergency_relationship' },
    ],
  },
  {
    type: 'rights',
    title: 'Your Rights as a Resident',
    intro: 'These rights are non-negotiable and may not be waived as a condition of residency. They are yours.',
    terms: [
      'DIGNITY: To be treated with dignity and respect, addressed by your preferred name and pronouns, and to privacy in your personal communications and mail.',
      'YOUR AFFAIRS: To manage your own finances, employment, and personal affairs, and to keep and access your own ID documents at all times.',
      'RECOVERY & MEDICATION: To pursue the recovery pathway of your choice and to take any FDA-approved medication — including MOUD (methadone, buprenorphine, naltrexone) — without discrimination; and to choose your own providers.',
      'RESIDENCE: To a clean, safe, habitable home; to understand all policies before agreeing; to advance written notice before any change in residency status (except immediate safety); and to a fair grievance process.',
      'CONFIDENTIALITY: To confidentiality of your participation, to know what is shared and with whom, and to give or withhold consent for release of information.',
      'FAIR TREATMENT: To be free from discrimination, harassment, intimidation, and retaliation, and to access legal counsel or advocacy without interference.',
      'To file a grievance, or contact the Iowa Civil Rights Commission (1-800-457-4416), Iowa Protection & Advocacy (1-800-779-2502), or HUD Fair Housing (1-800-669-9777). No retaliation for asserting your rights.',
    ],
    fields: [],
  },
  {
    type: 'house_rules',
    title: 'House Rules & Community Expectations',
    intro: 'These keep the home safe and healing for everyone — not to restrict you, but to protect the community we build together.',
    terms: [
      'SUBSTANCE-FREE HOME: No alcohol, illegal drugs, or non-prescribed medications on the property at any time, on or off site. Residents on MOUD are fully supported under the house medication policy.',
      'DRUG SCREENS: Random screens may be requested at any time; refusal is treated the same as a positive. Struggling with cravings is NOT a violation — tell someone; that is using your community as designed.',
      'QUIET HOURS: 10:00 PM–7:00 AM Sun–Thu, 11:00 PM–7:00 AM Fri–Sat. Keep voices, music, and devices low; take calls in private spaces.',
      'COMMON AREAS: Clean up after every use. Wash dishes within 2 hours. No shoes on furniture. Don’t leave laundry more than 30 minutes after it finishes.',
      'PERSONAL SPACE: Your room is yours; keep it clean. Rooms aren’t locked at night while others are home. Wellness checks occur with 24-hour notice, except emergencies.',
      'CURFEW & VISITORS: Honor curfew unless prior approval is granted; follow the visitors policy. No overnight guests without approval.',
      'RESPECT: No violence, harassment, or intimidation. Honor others’ privacy and belongings. Smoking/vaping only in designated outdoor areas, 20+ feet from entrances.',
      'RESTORATIVE ACCOUNTABILITY: When someone falls short, the first question is “what happened, and how do we move forward together?” Consequences are proportionate, transparent, and aimed at restoration.',
    ],
    fields: [],
  },
  {
    type: 'agreement',
    title: 'Grace House Participation Agreement',
    intro: 'This is a Participation Agreement, not a lease — you are a program participant, not a tenant. Please read it fully before you sign.',
    terms: [
      'WHAT GRACE HOUSE IS: A peer-supported, sober-living community; a grace-based bridge between treatment and independent living; MOUD-supportive.',
      'WHAT IT IS NOT: Not a clinical treatment program, not a licensed medical facility, not a substitute for professional treatment, and not a landlord-tenant arrangement.',
      'OUR COMMITMENT TO YOU: A safe, clean, sober environment; peer-based coaching; trauma-informed, person-first care; respect for your autonomy; support for your unique path; and no automatic expulsion for a return to use — we work with you.',
      'FREEDOM OF CHOICE: You may seek clinical treatment from any provider; take any FDA-approved medication including MOUD; attend spiritual services of your choice; and follow any recovery pathway (12-step, SMART, faith-based, secular).',
      'YOUR COMMITMENTS: Maintain a substance-free environment on and off property; pay your weekly program fee on time (and talk to the House Manager BEFORE it is due if money is tight — Grace House does not hold your money); complete your weekly chore; attend required house meetings; comply with drug screening; and honor quiet hours, curfew, visitors, and medication policies.',
      'ENGAGEMENT: Engage actively in your own recovery plan, and notify the House Manager if you are struggling or feel at risk — you will not be punished for being honest.',
      'LENGTH OF STAY: Recommended minimum stay is 90 days; average stay is 6–12 months. Program phases: Stabilization (first 30 days), Integration (days 31–90), and Independence.',
      'I confirm I have received and reviewed my Resident Rights and the House Rules, that I have had the opportunity to ask questions, and that I am entering Grace House voluntarily.',
    ],
    fields: [
      { key: 'monthly_fee', label: 'Weekly program fee ($)', type: 'number', from: 'monthly_fee' },
      { key: 'move_in_date', label: 'Planned start / move-in date', type: 'date', from: 'move_in_date' },
    ],
  },
  {
    type: 'roi',
    title: 'Release of Information',
    intro: 'Optional — authorization to coordinate your care between the residence and your VRCC recovery coach.',
    terms: [
      'I authorize the residence and Grace For Addictions (VRCC) to share information relevant to my recovery, housing, and coordination of support.',
      'This authorization is my choice, remains in effect for the duration of my residency, and may be revoked in writing at any time.',
      'I have the right to know what information is shared, with whom, and why.',
    ],
    fields: [
      { key: 'authorize_share_with', label: 'Authorized to coordinate with (coach/agency)', from: 'coach' },
    ],
  },
];

/**
 * Build the carry-over object from a participant's existing VRCC data so the
 * intake never asks for information the person already gave.
 */
export function buildCarryOver({ participant, recoveryCapital, house } = {}) {
  const p = participant || {};
  const rc = recoveryCapital || {};
  return {
    full_name: p.full_name || '',
    preferred_name: p.preferred_name || '',
    phone: p.phone || '',
    email: p.email || '',
    date_of_birth: p.date_of_birth || p.dob || '',
    current_location: p.current_location || p.address || '',
    how_heard: p.how_heard || '',
    history_substance_use: p.history_substance_use || '',
    seeking_recovery: p.seeking_recovery || '',
    willing_sober_living: p.willing_sober_living || '',
    housing_urgency: p.housing_urgency || '',
    can_afford_fee: p.can_afford_fee || '',
    on_mat: p.on_mat || '',
    current_medications: p.current_medications || '',
    justice_involved: p.justice_involved || '',
    emergency_contact: p.emergency_contact || '',
    emergency_phone: p.emergency_phone || '',
    emergency_relationship: p.emergency_relationship || '',
    recovery_start_date: p.recovery_start_date || p.sobriety_date || '',
    recovery_pathway: p.recovery_pathway || '',
    coach: p.coach || rc.coach || '',
    monthly_fee: house?.monthly_fee ?? '',
    move_in_date: '',
  };
}
