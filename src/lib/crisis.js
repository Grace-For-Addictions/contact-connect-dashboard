/**
 * crisis.js — lightweight, always-on crisis keyword detection.
 *
 * This is a deterministic safety net (not a clinical tool and not an LLM): it
 * scans free text for high-risk language so the UI can surface crisis
 * resources immediately and flag the message for a human. When the Grace LLM
 * connect-point is wired, this still runs first — safety never depends on a
 * model being available.
 */
const PATTERNS = [
  /\bkill myself\b/i, /\bkilling myself\b/i, /\bend (my|it) (life|all)\b/i,
  /\bsuicid/i, /\bwant to die\b/i, /\bdon'?t want to (live|be here|wake up)\b/i,
  /\bhurt myself\b/i, /\bharm myself\b/i, /\bself[- ]harm/i,
  /\boverdos/i, /\bod('?d| ?ing)?\b/i, /\brelaps/i,
  /\bno reason to (live|go on)\b/i, /\bbetter off (dead|without me)\b/i,
  /\bcan'?t (do this|go on) anymore\b/i, /\bnot safe\b/i,
];

export function detectCrisis(text = '') {
  return PATTERNS.some((re) => re.test(text));
}

export const CRISIS_RESOURCES = [
  { label: '988 Suicide & Crisis Lifeline', value: 'Call or text 988', href: 'tel:988' },
  { label: 'Your Life Iowa', value: '855-581-8111 · text 855-895-8398', href: 'tel:8555818111' },
  { label: 'Iowa Crisis Line', value: '1-844-775-5837', href: 'tel:18447755837' },
  { label: 'Emergency', value: 'Call 911 if you are in immediate danger', href: 'tel:911' },
];
