// Custom stroke icons replacing the previous emoji glyphs.
// Designed to match the existing tab-bar icon style: 20×20 viewBox,
// 1.6 stroke width, round caps/joins, currentColor stroke.

const PATHS = {
  // ── Moods (Home quick log + Log screen) ──────────────────
  calm: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M7.5 11.5c0.6 0.9 1.5 1.4 2.5 1.4s1.9-0.5 2.5-1.4" />
      <circle cx="7.5" cy="8.5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="12.5" cy="8.5" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  energy: (
    <path d="M11.2 2.5L4.5 11.5h3.7L7.5 17.5l7-9h-3.7z" />
  ),
  tired: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M6.5 8.7l2.2 0.9M13.5 8.7l-2.2 0.9" />
      <path d="M7.4 12.8c0.6-0.4 1.5-0.6 2.6-0.6s2 0.2 2.6 0.6" />
    </>
  ),
  cramps: (
    <>
      <path d="M3 9c1.3-1.8 2.7-1.8 4 0s2.7 1.8 4 0 2.7-1.8 4 0 2.7 1.8 4 0" />
      <path d="M3 13.5c1.3-1.8 2.7-1.8 4 0s2.7 1.8 4 0 2.7-1.8 4 0 2.7 1.8 4 0" />
    </>
  ),
  low: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M7.4 13.6c0.6-1 1.6-1.5 2.6-1.5s2 0.5 2.6 1.5" />
      <circle cx="7.5" cy="8.5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="12.5" cy="8.5" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  hopeful: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M7 11.4c0.6 1.5 1.7 2.3 3 2.3s2.4-0.8 3-2.3" />
      <circle cx="7.5" cy="8.5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="12.5" cy="8.5" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  frustrated: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M6.5 7.8l2.3 0.9M13.5 7.8l-2.3 0.9" />
      <path d="M7 13.2h6" />
    </>
  ),

  // ── Symptoms (Log + SymptomDetail) ───────────────────────
  headache: (
    <>
      <circle cx="10" cy="11.5" r="3.8" />
      <path d="M10 2v2.4M4.3 6.5l1.7 1.7M15.7 6.5l-1.7 1.7M6.5 3.6l0.9 1.6M13.5 3.6l-0.9 1.6" />
    </>
  ),
  bloat: (
    <>
      <ellipse cx="10" cy="11" rx="6" ry="5" />
      <path d="M7.5 12h5" />
      <circle cx="8.5" cy="9.8" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="11.5" cy="9.8" r="0.5" fill="currentColor" stroke="none" />
    </>
  ),
  mood: (
    <path d="M2 11c1.5-2.5 3-2.5 4.5 0S9 13.5 10.5 11 13.5 8.5 15 11s3 2.5 4.5 0" />
  ),
  tender: (
    <>
      <circle cx="7" cy="11" r="3.4" />
      <circle cx="13" cy="11" r="3.4" />
      <circle cx="7" cy="11" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="13" cy="11" r="0.8" fill="currentColor" stroke="none" />
    </>
  ),
  fatigue: (
    <>
      <rect x="2.5" y="7.5" width="13" height="5" rx="0.8" />
      <rect x="15.5" y="9" width="1.5" height="2" rx="0.3" fill="currentColor" stroke="none" />
      <line x1="4.5" y1="10" x2="7" y2="10" strokeWidth="2.2" />
    </>
  ),
  acne: (
    <>
      <circle cx="10" cy="10" r="7" />
      <circle cx="7" cy="8" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="13" cy="9" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="13" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="13" cy="13" r="0.5" fill="currentColor" stroke="none" />
    </>
  ),
  crave: (
    <>
      <rect x="4" y="5" width="12" height="10" rx="0.8" />
      <line x1="8" y1="5" x2="8" y2="15" />
      <line x1="12" y1="5" x2="12" y2="15" />
      <line x1="4" y1="10" x2="16" y2="10" />
    </>
  ),
  sleep: (
    <path d="M16 12a6 6 0 1 1-8-8 5 5 0 0 0 8 8z" />
  ),
  back: (
    <>
      <path d="M10 3v14" />
      <path d="M7 5.5h6M7 8.5h6M7 11.5h6M7 14.5h6" />
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
