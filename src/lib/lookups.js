/**
 * lookups.js — canonical option lists for the Contact Connect intake and the
 * Grace & Company directory. Person-first, inclusive, and consistent across the
 * app. Confirm against Supabase lookup tables if/when those are formalized.
 */
export const LK = {
  active_status: ['Active', 'Inactive', 'On Hold', 'Waitlist', 'Alumni'],
  referral_source: ['Self', 'Friend or Family', 'Recovery Community Center', 'Recovery Residence', 'Faith Community', 'Healthcare Provider', 'Hospital / ER', 'Treatment Center', 'Court / Legal System', 'Probation / Parole', 'Jail / Prison Re-entry', 'Social Services', 'Employer', 'Peer Coach', 'Other'],
  gender_identity: ['Woman', 'Man', 'Transgender Woman', 'Transgender Man', 'Non-binary', 'Two-Spirit', 'Genderqueer', 'Questioning', 'Prefer to self-describe', 'Prefer not to say'],
  pronouns: ['she/her', 'he/him', 'they/them', 'she/they', 'he/they', 'ze/zir', 'Prefer to self-describe', 'Prefer not to say'],
  race: ['American Indian or Alaska Native', 'Asian', 'Black or African American', 'Hispanic or Latino/a/e', 'Middle Eastern or North African', 'Native Hawaiian or Pacific Islander', 'White', 'Multiracial', 'Prefer to self-describe', 'Prefer not to say'],
  sexual_orientation: ['Straight / Heterosexual', 'Gay', 'Lesbian', 'Bisexual', 'Queer', 'Pansexual', 'Asexual', 'Questioning', 'Prefer to self-describe', 'Prefer not to say'],
  housing_status: ['Stable housing', 'Recovery residence', 'Temporary / transitional', 'Staying with family or friends', 'Shelter', 'Unhoused / unsheltered', 'Incarcerated / re-entry', 'Other'],
  custody_status: ['No current justice involvement', 'On probation', 'On parole', 'Pending charges', 'Court-ordered treatment', 'Drug court', 'Recently released', 'Other'],
  transportation_access: ['Reliable access', 'Limited access', 'Public transit only', 'No access — needs assistance'],
  assigned_coach: ['Unassigned — route to Intake Coordinator', 'Dani Rivera (CPRC)', 'Marcus Hill (CPRC)', 'Sofia Nguyen (CPRC)'],
};

// Grace & Company directory entity types.
export const ENTRY_TYPES = {
  rss: { label: 'Recovery Support Services', color: '#5fb3c4' },
  res: { label: 'Recovery Residence', color: '#82b58f' },
  rcc: { label: 'Recovery Community Center', color: '#d4a853' },
  well: { label: 'Wellness Center', color: '#a98ad9' },
  church: { label: 'Faith Community', color: '#d98ea4' },
  member: { label: 'Community Member', color: '#9bb0c4' },
};

// Volunteer gifts, offered on the account.
export const VOLUNTEER_SKILLS = ['Transportation', 'Hospitality', 'Meals', 'Event Setup', 'Mentoring', 'Childcare', 'Administrative', 'Outreach'];
