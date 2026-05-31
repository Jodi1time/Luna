// Crisis keyword detection — extremely conservative pattern matching
// for messages that suggest imminent self-harm or suicidal ideation.
// When a hit lands, the chat surfaces a resource card BEFORE Luna's
// response so the user sees professional help options first.
//
// This is intentionally not a comprehensive screener — it's a tripwire.
// The model itself is also instructed to handle crisis carefully via
// the Edge Function's system prompt; this client-side check is the
// belt that goes with that pair of suspenders.

// Phrases are matched case-insensitively as whole words / fragments.
// Keep the list tight to minimise false positives ("dying to see you"
// or "kill it at work" should not trip the wire).
const CRISIS_PATTERNS = [
  /\bkill (myself|my self|me)\b/i,
  /\bsuicid(e|al)\b/i,
  /\bend (it all|my life|things)\b/i,
  /\bwant to die\b/i,
  /\bdon'?t want to (live|be here|wake up)\b/i,
  /\b(harm|hurt|cut) (myself|my self)\b/i,
  /\bself[- ]harm\b/i,
  /\bcan'?t (go on|do this anymore|keep going)\b/i,
  /\bbetter off (dead|without me)\b/i,
  /\boverdose\b/i,
]

export function detectCrisis(text) {
  if (!text || typeof text !== 'string') return false
  return CRISIS_PATTERNS.some((p) => p.test(text))
}

// Resource lines surfaced when crisis is detected. Kept short, country-
// agnostic where possible (988 is US/Canada; we name Samaritans/Crisis
// Text Line as alternatives). Localising further is post-launch work.
export const CRISIS_RESOURCES = [
  { label: 'US & Canada', detail: 'Call or text 988 — Suicide & Crisis Lifeline' },
  { label: 'UK & Ireland', detail: 'Call 116 123 — Samaritans, free and 24/7' },
  { label: 'Text-based', detail: 'Text HOME to 741741 — Crisis Text Line' },
  { label: 'International', detail: 'findahelpline.com — global directory' },
]
