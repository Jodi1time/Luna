// A soft, brief moment of acknowledgment for cycle milestones —
// period day one, ovulation confirmed by BBT, etc. Fades up + away
// over ~3 seconds. Auto-dismissed by parent.

import { T } from '../data/theme'
import { PHASES } from '../data/lunaData'
import { PhaseFlourish } from './phaseFlourishes'

// A small petal silhouette for the falling-petal animation. Same
// shape as the menstrual flourish but solid-filled and smaller, so
// a handful of them drifting down feels like one quiet shower.
function PetalSilhouette({ color, size = 14 }) {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 32 38" aria-hidden="true">
      <path
        d="M16 4 C 11 8, 9 18, 13 28 Q 16 32, 19 28 C 23 18, 21 8, 16 4 Z"
        fill={color} opacity={0.7}
      />
    </svg>
  )
}

// Five petals at varied horizontal positions, drift offsets, spins,
// and delays. Each uses the .petal-fall keyframe.
function FallingPetals({ color }) {
  const petals = [
    { left: '10%',  delay: 0.0, drift: 18,  spin: 60, size: 14 },
    { left: '32%',  delay: 0.4, drift: -22, spin: -90, size: 18 },
    { left: '54%',  delay: 0.8, drift: 14,  spin: 120, size: 12 },
    { left: '70%',  delay: 1.2, drift: -10, spin: -50, size: 16 },
    { left: '88%',  delay: 1.6, drift: 24,  spin: 80,  size: 13 },
  ]
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }} aria-hidden="true">
      {petals.map((p, i) => (
        <span key={i} className="petal-fall"
          style={{
            left: p.left,
            top: -22,
            animationDelay: `${p.delay}s`,
            '--drift': `${p.drift}px`,
            '--spin': `${p.spin}deg`,
          }}>
          <PetalSilhouette color={color} size={p.size} />
        </span>
      ))}
    </div>
  )
}

const COPY = {
  'day-one': {
    eyebrow: 'Day one',
    line: 'Be soft with yourself this week.',
    flourish: 'menstrual',
  },
  'ovulation-confirmed': {
    eyebrow: 'Your body just confirmed it',
    line: 'You ovulated this cycle.',
    flourish: 'ovulation',
  },
  'email-confirmed': {
    eyebrow: 'Your email is in',
    line: "We're all set. Welcome home.",
    flourish: 'ovulation',
  },
}

export default function Celebration({ kind, onClose }) {
  if (!kind) return null
  const c = COPY[kind]
  if (!c) return null
  const color = PHASES[c.flourish]?.color || T.accent
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 220,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
        animation: 'fadeIn 0.4s ease-out both',
      }}
      aria-live="polite"
    >
      {/* Falling petal shower — only on day-one moment. Sits behind
          the card and quietly drifts down through the viewport. */}
      {kind === 'day-one' && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <FallingPetals color={color} />
        </div>
      )}
      <div className="glass-card"
        style={{
          padding: '22px 28px',
          borderRadius: 14,
          textAlign: 'center',
          maxWidth: 320,
          borderLeft: `3px solid ${color}`,
          animation: 'celebrationBloom 3.2s ease-out both',
          pointerEvents: 'auto',
          position: 'relative',
          zIndex: 1,
        }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color }}>
          <PhaseFlourish phaseId={c.flourish} size={44} color={color} />
        </div>
        <div style={{ fontFamily: T.serif, fontVariant: 'small-caps', fontSize: 11, letterSpacing: 1.5, color: T.muted, marginBottom: 6 }}>
          {c.eyebrow}
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 22, fontStyle: 'italic', color: T.text, lineHeight: 1.35, letterSpacing: -0.3 }}>
          {c.line}
        </div>
      </div>
    </div>
  )
}
