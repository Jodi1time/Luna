// Hand-drawn-feeling SVG flourishes — one per cycle phase. These are
// the single biggest visual character upgrade the app has had: a tiny
// editorial mark that signals the *feeling* of each phase without
// language. Drawn as stroke-only line work for an editorial feel.
//
// Pass `color` to tint; defaults to the phase color via currentColor.
// Pass `size` for square dimensions (default 28).

import { PHASES } from '../data/lunaData'

const COMMON_STROKE = {
  fill: 'none',
  strokeWidth: 1.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

// Menstrual — a single falling petal. Curved, organic, weighty.
function MenstrualPetal({ size = 28, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" stroke={color || 'currentColor'} {...COMMON_STROKE}>
      <path d="M16 4 C 11 8, 9 16, 13 24 Q 16 27, 19 24 C 23 16, 21 8, 16 4 Z" />
      <path d="M16 8 Q 16 16, 16 22" strokeWidth={0.8} opacity={0.5} />
    </svg>
  )
}

// Follicular — a budding branch. Slight curve, a small swelling at the
// tip suggesting new growth.
function FollicularBranch({ size = 28, color }) {
  const c = color || 'currentColor'
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" stroke={c} {...COMMON_STROKE}>
      <path d="M14 28 Q 14 18, 18 8" />
      <path d="M14 22 Q 12 21, 9 22" strokeWidth={0.9} opacity={0.65} />
      <path d="M15 16 Q 17 15, 20 16" strokeWidth={0.9} opacity={0.65} />
      <circle cx={18} cy={8} r={2.2} fill={c} opacity={0.32} stroke={c} />
    </svg>
  )
}

// Ovulation — a small ember / sun. Soft round core with quiet rays
// suggesting warmth without being a literal sun icon.
function OvulationEmber({ size = 28, color }) {
  const c = color || 'currentColor'
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" stroke={c} {...COMMON_STROKE}>
      <circle cx={16} cy={16} r={5} fill={c} opacity={0.18} />
      <circle cx={16} cy={16} r={5} />
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const rad = (deg * Math.PI) / 180
        const r1 = 7.5
        const r2 = 10
        return (
          <line key={deg}
            x1={16 + r1 * Math.cos(rad)} y1={16 + r1 * Math.sin(rad)}
            x2={16 + r2 * Math.cos(rad)} y2={16 + r2 * Math.sin(rad)}
            opacity={0.7} />
        )
      })}
    </svg>
  )
}

// Luteal — a tide / wave. Three-crest swell suggesting the heavier,
// slower water of late cycle.
function LutealTide({ size = 28, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" stroke={color || 'currentColor'} {...COMMON_STROKE}>
      <path d="M2 18 Q 7 12, 12 18 T 22 18 T 30 18" />
      <path d="M4 23 Q 9 19, 14 23 T 24 23" opacity={0.55} />
    </svg>
  )
}

const FLOURISHES = {
  menstrual:  MenstrualPetal,
  follicular: FollicularBranch,
  ovulation:  OvulationEmber,
  luteal:     LutealTide,
}

// Phase flourish picker. Returns the right SVG component for the given
// phase id; falls back to null if not a known phase.
export function PhaseFlourish({ phaseId, size, color }) {
  const Comp = FLOURISHES[phaseId]
  if (!Comp) return null
  const c = color || (PHASES[phaseId]?.color)
  return <Comp size={size} color={c} />
}
