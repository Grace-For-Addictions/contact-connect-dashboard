/**
 * Recovery-residence intake packet templates.
 *
 * Each document is something a resident reads, fills, agrees to, and signs
 * before admission. `fields[].from` names a carry-over key: when a participant
 * already has VRCC data, that field is pre-filled so they never re-enter it.
 */
export const INTAKE_DOCS = [
  {
    type: 'application',
    title: 'Residency Application',
    intro:
      'Basic information for your stay. Anything we already have from your VRCC record is filled in for you — please review and correct as needed.',
    terms: [
      'This application does not guarantee placement. Admission is subject to bed availability, house fit, and completion of this intake packet.',
      'The information you provide is kept confidential and shared only as authorized below.',
    ],
    fields: [
      { key: 'full_name', label: 'Full legal name', from: 'full_name', required: true },
      { key: 'date_of_birth', label: 'Date of birth', type: 'date', from: 'date_of_birth' },
      { key: 'phone', label: 'Phone', from: 'phone' },
      { key: 'email', label: 'Email', from: 'email' },
      { key: 'emergency_contact', label: 'Emergency contact name', from: 'emergency_contact' },
      { key: 'emergency_phone', label: 'Emergency contact phone', from: 'emergency_phone' },
      { key: 'recovery_start_date', label: 'Recovery start / sobriety date', type: 'date', from: 'recovery_start_date' },
      { key: 'referred_by', label: 'Referred by', from: 'coach' },
      { key: 'current_medications', label: 'Current medications', type: 'area', from: 'current_medications' },
      { key: 'allergies', label: 'Allergies', from: 'allergies' },
    ],
  },
  {
    type: 'agreement',
    title: 'Residency Agreement',
    intro: 'The terms of your stay in the house.',
    terms: [
      'I agree to pay the monthly program fee shown below, due on the 1st of each month.',
      'I understand this is a recovery residence, not a treatment facility, and that residency is voluntary.',
      'I agree to maintain abstinence from alcohol and non-prescribed drugs for the duration of my stay.',
      'I agree to give reasonable notice before moving out and to leave my space clean.',
    ],
    fields: [
      { key: 'monthly_fee', label: 'Monthly program fee ($)', type: 'number', from: 'monthly_fee' },
      { key: 'move_in_date', label: 'Planned move-in date', type: 'date', from: 'move_in_date' },
    ],
  },
  {
    type: 'house_rules',
    title: 'House Rules & Expectations',
    intro: 'Shared expectations that keep the house safe and supportive for everyone.',
    terms: [
      'Curfew is 10:00 PM Sunday–Thursday and 12:00 AM Friday–Saturday unless prior arrangements are made.',
      'Attend a minimum of three recovery meetings per week and complete assigned house chores.',
      'No overnight guests without house-manager approval. Common areas are kept clean.',
      'Random drug and alcohol screening may be requested at any time.',
      'Violence, theft, and intimidation result in immediate discharge.',
    ],
    fields: [],
  },
  {
    type: 'roi',
    title: 'Release of Information',
    intro:
      'Authorization to coordinate your care between the recovery residence and your VRCC recovery coach.',
    terms: [
      'I authorize the recovery residence and Grace For Addictions (VRCC) to share information relevant to my recovery, housing, and coordination of support.',
      'This authorization remains in effect for the duration of my residency and may be revoked in writing at any time.',
    ],
    fields: [
      { key: 'authorize_share_with', label: 'Authorized to coordinate with (coach/agency)', from: 'coach' },
    ],
  },
  {
    type: 'relapse_policy',
    title: 'Relapse & Discharge Policy',
    intro: 'What happens if a return to use occurs — clarity now protects you later.',
    terms: [
      'A return to use is treated as a health event, not a moral failing. The house will work with you and your coach on next steps.',
      'Depending on circumstances, next steps may include a safety plan, increased support, a higher level of care, or discharge.',
      'If discharge is necessary, the house will help connect you with alternative safe options where possible.',
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
    phone: p.phone || '',
    email: p.email || '',
    date_of_birth: p.date_of_birth || p.dob || '',
    emergency_contact: p.emergency_contact || '',
    emergency_phone: p.emergency_phone || '',
    recovery_start_date: p.recovery_start_date || p.sobriety_date || '',
    coach: p.coach || rc.coach || '',
    current_medications: p.current_medications || '',
    allergies: p.allergies || '',
    monthly_fee: house?.monthly_fee ?? '',
    move_in_date: '',
  };
}
