// Custom stroke icons drawn for Luna's editorial voice.
//
// Design notes:
// - 20×20 viewBox so they scale cleanly from 22px (Quick Log) to 44px (SymptomDetail).
// - 1.6 stroke matches the existing tab-bar/back/check glyphs in shared/index.jsx.
// - currentColor + opacity tint with selected/hover state changes.
// - Moods deliberately avoid the "face on a circle" emoji pattern —
//   each is a more abstract mark so the set feels like editorial illustration
//   rather than another emoji rendering.
// - Symptoms stay semi-representational so they're recognizable from the label.

const PATHS = {
  // ── Moods ─────────────────────────────────────────────────
  // calm — settled horizon under a still moon
  calm: (
    <>
      <path d="M3 13.5c2-0.6 4-0.6 7 0s5 0.6 7 0" />
      <circle cx="10" cy="6.5" r="2" />
    </>
  ),

  // energy — lightning, sharp
  energy: (
    <path d="M11.5 2L4 12h4l-1 6 7-10h-4z" />
  ),

  // tired — heavy, drooping waves
  tired: (
    <>
      <path d="M3 7c2 3 5 3 7 0M11 7c1 2 4 3 6 0" />
      <path d="M3 13c2 3 5 3 7 0M11 13c1 2 4 3 6 0" />
    </>
  ),

  // cramps — tight, knotted pull
  cramps: (
    <>
      <path d="M4 6c0 3 4 1 4 4s-4 1-4 4" />
      <path d="M16 6c0 3-4 1-4 4s4 1 4 4" />
      <circle cx="10" cy="10" r="1" fill="currentColor" stroke="none" />
    </>
  ),

  // low — downward droplet
  low: (
    <>
      <path d="M10 3v11" />
      <path d="M6 10l4 4 4-4" />
    </>
  ),

  // hopeful — small sprout reaching up
  hopeful: (
    <>
      <path d="M10 17V8" />
      <path d="M10 9c0-3 2.5-4 5-3-0.5 3-2.5 4-5 3z" />
      <path d="M10 12c0-2-2-3-4-2 0.5 2.5 2 3 4 2z" />
    </>
  ),

  // frustrated — tense zigzag
  frustrated: (
    <path d="M3 7l3 3-3 3 3 3M11 4l-3 3 3 3-3 3 3 3M17 7l-3 3 3 3-3 3" />
  ),

  // ── Symptoms ──────────────────────────────────────────────
  // headache — head silhouette with radiating rays
  headache: (
    <>
      <path d="M6 11.5a4 4 0 0 1 8 0v3.2A1.5 1.5 0 0 1 12.5 16.2h-5A1.5 1.5 0 0 1 6 14.7z" />
      <path d="M10 3v2M6 4.2l1 1.6M14 4.2l-1 1.6M3 8.5l2 0.5M17 8.5l-2 0.5" />
    </>
  ),

  // bloat — distended rounded form
  bloat: (
    <>
      <path d="M5 8.5c0-2 2-3 5-3s5 1 5 3v3c0 3-2 5-5 5s-5-2-5-5z" />
      <path d="M8 11.2v2M12 11.2v2" />
    </>
  ),

  // mood swings — dramatic wave
  mood: (
    <path d="M2 12c1.5-3.5 3-3.5 4.5 0S9 15.5 10.5 12 13.5 8.5 15 12s3 3.5 4.5 0" />
  ),

  // tender — two soft circles, centers marked
  tender: (
    <>
      <circle cx="7" cy="11" r="3.5" />
      <circle cx="13" cy="11" r="3.5" />
      <circle cx="7" cy="11" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="13" cy="11" r="0.8" fill="currentColor" stroke="none" />
    </>
  ),

  // fatigue — depleting dots
  fatigue: (
    <>
      <circle cx="4" cy="10" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="10" r="1.2" fill="currentColor" stroke="none" opacity="0.7" />
      <circle cx="12.5" cy="10" r="0.9" fill="currentColor" stroke="none" opacity="0.45" />
      <circle cx="16" cy="10" r="0.6" fill="currentColor" stroke="none" opacity="0.22" />
    </>
  ),

  // acne — constellation of small marks
  acne: (
    <>
      <circle cx="5" cy="6" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="11" cy="4.5" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="15" cy="8.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="7.5" cy="11" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="13" cy="13" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="9" cy="15" r="0.7" fill="currentColor" stroke="none" />
    </>
  ),

  // crave — small flame, hungry
  crave: (
    <path d="M10 3c0.5 2.5-2.5 3-2.5 6.5C7.5 12 8.7 14 10 15s2.5-1.5 2.5-4c0-2-1.5-2.5-2-4.5-0.3-1.3-0.5-2.3-0.5-3.5z" />
  ),

  // sleep — crescent moon with a small star
  sleep: (
    <>
      <path d="M15 13a5.5 5.5 0 1 1-7-7 4.5 4.5 0 0 0 7 7z" />
      <path d="M16 4l0.4 1.2L17.6 5.6 16.4 6l-0.4 1.2L15.6 6 14.4 5.6 15.6 5.2z" />
    </>
  ),

  // back — gently curved spine with vertebrae
  back: (
    <>
      <path d="M10 3c-1.5 4-1.5 10 0 14" />
      <path d="M8 5h4.5M7.5 8h5M7.5 11h5M8 14h4.5" />
    </>
  ),
}

export function SymptomIcon({ id, size = 20, color }) {
  const path = PATHS[id]
  if (!path) return null
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {path}
    </svg>
  )
}

// Mood ids used in Quick Log + the Log screen mood row.
export const MOOD_IDS = ['calm', 'energy', 'tired', 'cramps', 'low', 'hopeful', 'frustrated']
export const MOOD_LABELS = {
  calm: 'Calm',
  energy: 'Energy',
  tired: 'Tired',
  cramps: 'Cramps',
  low: 'Low',
  hopeful: 'Hopeful',
  frustrated: 'Tense',
}
