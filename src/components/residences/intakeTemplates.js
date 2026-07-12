/**
 * Grace House · Recovery Residence intake packet.
 * NARR Level II aligned · Trauma-Informed · Peer-Led.
 * 1311 9th Street, Des Moines, IA 50314 · Grace For Addictions.
 *
 * Each document is read, agreed to, and signed before admission. `fields[].from`
 * names a carry-over key, so anything already on the applicant's VRCC record is
 * pre-filled and never entered twice.
 */
export const INTAKE_DOCS = [
  {
    type: 'application',
    title: 'Residency Application',
    intro:
      'Welcome. Anything already on your VRCC record is filled in for you — please review and correct as needed.',
    terms: [
      'This application does not guarantee placement. Admission is subject to bed availability, house fit, and completion of this intake packet.',
      'Your information is kept confidential and shared only as you authorize, subject to mandatory reporting obligations under Iowa law.',
      'You may pursue any evidence-based recovery pathway — 12-Step, SMART, MAT, faith-based, or others. You will never be required to identify with a particular program.',
    ],
    fields: [
      { key: 'full_name', label: 'Full legal name', from: 'full_name', required: true },
      { key: 'preferred_name', label: 'Preferred name / pronouns', from: 'preferred_name' },
      { key: 'date_of_birth', label: 'Date of birth', type: 'date', from: 'date_of_birth' },
      { key: 'phone', label: 'Phone', from: 'phone' },
      { key: 'email', label: 'Email', from: 'email' },
      { key: 'emergency_contact', label: 'Emergency contact name', from: 'emergency_contact' },
      { key: 'emergency_phone', label: 'Emergency contact phone', from: 'emergency_phone' },
      { key: 'recovery_start_date', label: 'Recovery start / sobriety date', type: 'date', from: 'recovery_start_date' },
      { key: 'recovery_pathway', label: 'Recovery pathway(s) you use', from: 'recovery_pathway' },
      { key: 'referred_by', label: 'Referred by', from: 'coach' },
      { key: 'on_mat', label: 'On Medication-Assisted Treatment (MAT)? (yes/no)', from: 'on_mat' },
      { key: 'current_medications', label: 'Current medications', type: 'area', from: 'current_medications' },
      { key: 'allergies', label: 'Allergies', from: 'allergies' },
    ],
  },
  {
    type: 'rights',
    title: 'Your Rights as a Resident',
    intro: 'These rights are non-negotiable and may not be waived as a condition of residency. Please read them — they are yours.',
    terms: [
      'DIGNITY: You have the right to be treated with dignity and respect, addressed by your preferred name and pronouns, and to privacy in your personal communications and mail.',
      'YOUR AFFAIRS: You have the right to manage your own finances, employment, and personal affairs, and to keep and access your own ID documents at all times.',
      'RECOVERY & MAT: You have the right to pursue the recovery pathway of your choice — including Medication-Assisted Treatment — without discrimination, and to choose your own healthcare providers.',
      'RESIDENCE: You have the right to a clean, safe, habitable home; to understand all policies before agreeing; to advance written notice before any change in residency status (except immediate safety concerns); and to a fair grievance process.',
      'CONFIDENTIALITY: You have the right to confidentiality of your participation, to know what is shared and with whom, and to give or withhold consent for release of your information.',
      'FAIR TREATMENT: You have the right to be free from discrimination, harassment, intimidation, and retaliation, and to access legal counsel or advocacy without interference.',
      'If you believe your rights were violated you may file a grievance, or contact the Iowa Civil Rights Commission (1-800-457-4416), Iowa Protection & Advocacy (1-800-779-2502), or HUD Fair Housing (1-800-669-9777). No retaliation will be taken for asserting your rights.',
    ],
    fields: [],
  },
  {
    type: 'house_rules',
    title: 'House Rules & Community Expectations',
    intro: 'These exist to keep Grace House safe and healing for everyone — not to restrict you, but to protect the community we build together.',
    terms: [
      'SUBSTANCE-FREE HOME: No alcohol, illegal drugs, or non-prescribed medications on the property at any time, on or off site. Residents on MAT are fully supported under the house medication policy.',
      'DRUG SCREENS: Random drug screens may be requested at any time. Refusal to test is treated the same as a positive result. Struggling with cravings is NOT a violation — talk to someone; that is using your community as designed.',
      'QUIET HOURS: 10:00 PM–7:00 AM Sun–Thu, 11:00 PM–7:00 AM Fri–Sat. Keep voices, music, and devices low; take calls in private spaces.',
      'COMMON AREAS: Clean up after every use. Wash dishes within 2 hours. No shoes on furniture. Don’t leave laundry in machines more than 30 minutes after it finishes.',
      'PERSONAL SPACE: Your bedroom is yours; keep it clean. Rooms may not be locked at night while others are home. Wellness checks occur with 24-hour notice, except emergencies.',
      'CURFEW & VISITORS: Honor your curfew unless prior approval is granted. Follow the visitors policy; no overnight guests without house-manager approval.',
      'ELECTRONICS: Devices are allowed. Social media that compromises another resident’s privacy or reputation is a serious violation of community trust.',
      'SMOKING/VAPING: Permitted only in designated outdoor areas, at least 20 feet from any entrance or window. Dispose of waste responsibly.',
      'PETS: Not permitted unless approved in advance as a disability-related accommodation with current vaccination records on file.',
      'ACCOUNTABILITY IS RESTORATIVE: When someone falls short, the first question is “what happened, and how do we move forward together?” Consequences are proportionate, transparent, and aimed at restoration — not punishment.',
    ],
    fields: [],
  },
  {
    type: 'agreement',
    title: 'Grace House Participant Agreement',
    intro: 'This is the agreement for your stay at Grace House. Please read it fully before you sign.',
    terms: [
      'I am entering Grace House voluntarily as a peer-led, NARR Level II recovery residence — a home, not a treatment facility.',
      'I agree to maintain a substance-free environment and to abstain from alcohol and non-prescribed drugs while I am a resident, on or off the property. If I am on MAT, I will follow the house medication policy.',
      'I agree to pay my weekly program fee on time, and to speak with the House Manager BEFORE a payment is due if I am experiencing financial difficulty. Grace House does not hold or manage my money.',
      'I agree to comply with drug-screening requirements, complete my weekly chore assignment, attend required house meetings, and honor quiet hours, curfew, and the visitors and medication policies.',
      'I agree to treat every resident, guest, and community member with respect — no violence, harassment, intimidation, or sharing another resident’s private information outside the house.',
      'I agree to engage actively in my own recovery plan (my pathway is my choice), and to notify the House Manager if I am struggling or feel at risk. I understand I will not be punished for being honest.',
      'I understand that residency may end with advance written notice except in cases of immediate safety, and that I have the right to a fair and transparent grievance process at any time.',
      'I confirm I have received and reviewed my Resident Rights and the House Rules, and I have had the opportunity to ask questions.',
    ],
    fields: [
      { key: 'monthly_fee', label: 'Weekly program fee ($)', type: 'number', from: 'monthly_fee' },
      { key: 'move_in_date', label: 'Planned move-in date', type: 'date', from: 'move_in_date' },
    ],
  },
  {
    type: 'roi',
    title: 'Release of Information',
    intro: 'Optional — authorization to coordinate your care between Grace House and your VRCC recovery coach.',
    terms: [
      'I authorize Grace House and Grace For Addictions (VRCC) to share information relevant to my recovery, housing, and coordination of support.',
      'This authorization is my choice, remains in effect for the duration of my residency, and may be revoked in writing at any time.',
      'I have the right to know what information is shared, with whom, and why.',
    ],
    fields: [
      { key: 'authorize_share_with', label: 'Authorized to coordinate with (coach/agency)', from: 'coach' },
    ],
  },
  {
    type: 'relapse_policy',
    title: 'Return-to-Use Policy',
    intro: 'What happens if a return to use occurs — clarity now protects you later.',
    terms: [
      'A return to use is treated as a health event, not a moral failing. Grace House will work with you and your coach on next steps.',
      'Next steps are individualized and may include a safety plan, increased support, a referral to a higher level of care, or, when necessary, discharge — always handled with dignity.',
      'If discharge is necessary, the house will help connect you with alternative safe options where possible. Honesty about struggling is encouraged and never punished.',
    ],
    fields: [],
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
    emergency_contact: p.emergency_contact || '',
    emergency_phone: p.emergency_phone || '',
    recovery_start_date: p.recovery_start_date || p.sobriety_date || '',
    recovery_pathway: p.recovery_pathway || '',
    on_mat: p.on_mat || '',
    coach: p.coach || rc.coach || '',
    current_medications: p.current_medications || '',
    allergies: p.allergies || '',
    monthly_fee: house?.monthly_fee ?? '',
    move_in_date: '',
  };
}
