import { useState } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, BrickList, SourceLine, Screen } from '../components/shared'
import { PHASES } from '../data/lunaData'
import { useCycle } from '../hooks/useCycle'
import useLuna from '../store/useLuna'

const PHASE_ORDER = ['menstrual', 'follicular', 'ovulation', 'luteal']

export default function Nourish() {
  const store = useLuna()
  const { back, goPhase } = store
  const { phase } = useCycle(store)
  const [open, setOpen] = useState(null)

  const current = phase || PHASES.follicular

  return (
    <Screen padBottom={30}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="Nourish" onBack={back} />
        <Eyebrow>NUTRITION · CYCLE-AWARE</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 8 }}>
          What to eat <em>right now.</em>
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 15, color: T.muted, lineHeight: 1.55, marginBottom: 24 }}>
          What your body wants shifts across the month. Evidence-based by phase.
        </div>
      </div>

      <div style={{ margin: '0 16px 24px', padding: 20, background: T.card, border: `1px solid ${T.hair}`, borderLeft: `3px solid ${current.color}`, borderRadius: T.r }}>
        <div style={{ fontSize: 10, letterSpacing: 2, fontWeight: 700, fontFamily: T.sans, color: current.color, marginBottom: 4 }}>
          YOUR PHASE NOW · {current.name.toUpperCase()}
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 500, marginBottom: 14 }}>{current.nutrition.headline}</div>
        <BrickList title="Eat more of" items={current.nutrition.do} positive />
        {current.nutrition.avoid?.length > 0 && <BrickList title="Ease off" items={current.nutrition.avoid} />}
        {current.nutrition.note && (
          <div style={{ marginTop: 12, padding: 12, borderLeft: `2px solid ${T.accent}`, fontFamily: T.serif, fontSize: 13.5, fontStyle: 'italic', lineHeight: 1.5, color: T.muted }}>
            {current.nutrition.note}
          </div>
        )}
        <SourceLine>{current.nutrition.source}</SourceLine>
        <button onClick={() => goPhase(current.id)}
          style={{ marginTop: 14, background: 'transparent', border: `1px solid ${T.hair}`, padding: '8px 12px', cursor: 'pointer', fontFamily: T.sans, fontSize: 10, letterSpacing: 1.5, fontWeight: 700, color: T.text, borderRadius: T.r }}>
          FULL PHASE BRIEF →
        </button>
      </div>

      <div style={{ padding: '0 22px 10px' }}>
        <Eyebrow>ALL PHASES</Eyebrow>
      </div>

      <div style={{ margin: '0 16px', border: `1px solid ${T.hair}`, borderRadius: T.r, overflow: 'hidden' }}>
        {PHASE_ORDER.filter((id) => id !== current.id).map((id, idx, arr) => {
          const p = PHASES[id]
          const isOpen = open === id
          return (
            <div key={id} style={{ borderBottom: idx < arr.length - 1 ? `1px solid ${T.hair}` : 'none' }}>
              <button onClick={() => setOpen(isOpen ? null : id)}
                style={{ width: '100%', padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'inherit', color: T.text, textAlign: 'left' }}>
                <div>
                  <div style={{ fontFamily: T.sans, fontSize: 10, letterSpacing: 1.5, fontWeight: 700, color: p.color, marginBottom: 3 }}>{p.name.toUpperCase()} · DAYS {p.days}</div>
                  <div style={{ fontFamily: T.serif, fontSize: 15, fontWeight: 500 }}>{p.nutrition.headline}</div>
                </div>
                <span style={{ color: T.muted, fontSize: 18, display: 'inline-block', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform .2s', marginLeft: 8 }}>›</span>
              </button>
              {isOpen && (
                <div style={{ padding: '0 16px 16px', animation: 'fadeUp .2s ease-out both' }}>
                  <BrickList title="Eat more of" items={p.nutrition.do} positive />
                  {p.nutrition.avoid?.length > 0 && <BrickList title="Ease off" items={p.nutrition.avoid} />}
                  <SourceLine>{p.nutrition.source}</SourceLine>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div style={{ height: 16 }} />
    </Screen>
  )
}
