import { useState } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, BrickList, SourceLine, Screen } from '../components/shared'
import { PHASES } from '../data/lunaData'
import { useCycle } from '../hooks/useCycle'
import { PhaseFlourish } from '../components/phaseFlourishes'
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
        <Masthead issue="to nourish" onBack={back} />
        <div className="insight-stagger" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8, animationDelay: '0ms' }}>
          <div style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, flex: 1, minWidth: 0 }}>
            What helps you<br /><em>right now.</em>
          </div>
          <div aria-hidden="true" style={{ color: current.color, opacity: 0.55, paddingTop: 4 }}>
            <PhaseFlourish phaseId={current.id} size={24} />
          </div>
        </div>
        <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 15, color: T.muted, lineHeight: 1.6, marginBottom: 24, fontStyle: 'italic', animationDelay: '60ms' }}>
          What your body wants shifts across the month. Doctor-grounded, by phase.
        </div>
      </div>

      <div className="glass-card insight-stagger" style={{ margin: '0 16px 24px', padding: 20, borderLeft: `3px solid ${current.color}`, borderRadius: T.r, animationDelay: '120ms' }}>
        <div style={{ fontSize: 10, letterSpacing: 1.2, fontWeight: 600, fontFamily: T.sans, color: current.color, marginBottom: 4 }}>
          You're in {current.name.toLowerCase()} now
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
          style={{ marginTop: 14, background: 'transparent', border: `1px solid ${T.hair}`, padding: '9px 14px', cursor: 'pointer', fontFamily: T.sans, fontSize: 11, letterSpacing: 0.6, fontWeight: 600, color: T.text, borderRadius: T.r }}>
          More about this phase →
        </button>
      </div>

      <div className="insight-stagger" style={{ padding: '0 22px 10px', animationDelay: '180ms' }}>
        <Eyebrow color={current.color}>The whole month</Eyebrow>
      </div>

      <div className="glass-card insight-stagger" style={{ margin: '0 16px', borderRadius: T.r, overflow: 'hidden', animationDelay: '220ms' }}>
        {PHASE_ORDER.filter((id) => id !== current.id).map((id, idx, arr) => {
          const p = PHASES[id]
          const isOpen = open === id
          return (
            <div key={id} style={{ borderBottom: idx < arr.length - 1 ? `1px solid ${T.hair}` : 'none' }}>
              <button onClick={() => setOpen(isOpen ? null : id)}
                style={{ width: '100%', padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'inherit', color: T.text, textAlign: 'left' }}>
                <div>
                  <div style={{ fontFamily: T.sans, fontSize: 10, letterSpacing: 1.2, fontWeight: 600, color: p.color, marginBottom: 3 }}>{p.name.toLowerCase()} · days {p.days}</div>
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
