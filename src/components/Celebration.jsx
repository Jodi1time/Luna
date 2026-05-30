// A soft, brief moment of acknowledgment for cycle milestones —
// period day one, ovulation confirmed by BBT, etc. Fades up + away
// over ~3 seconds. Auto-dismissed by parent.

import { T } from '../data/theme'
import { PHASES } from '../data/lunaData'
import { PhaseFlourish } from './phaseFlourishes'

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
      <div className="glass-card"
        style={{
          padding: '22px 28px',
          borderRadius: 14,
          textAlign: 'center',
          maxWidth: 320,
          borderLeft: `3px solid ${color}`,
          animation: 'celebrationBloom 3.2s ease-out both',
          pointerEvents: 'auto',
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
