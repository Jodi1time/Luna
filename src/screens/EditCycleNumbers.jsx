import { useState } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, CTAButton, Icons, Screen } from '../components/shared'
import useLuna from '../store/useLuna'

// Tunes the two numbers that shape Luna's cycle math: average cycle
// length (21–45 days, ACOG range for medically normal cycles) and
// average period length (2–9 days). Both are user-revisable from
// Settings — bodies change.

function NumberRow({ label, value, min, max, unit, onChange }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: 700, fontFamily: T.sans, color: T.muted, textTransform: 'uppercase', marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <span key={value} style={{ fontFamily: T.serif, fontSize: 84, fontWeight: 300, color: T.accent, lineHeight: 1, display: 'inline-block', animation: 'numberPop 0.35s ease-out both' }}>
          {value}
        </span>
        <span style={{ fontFamily: T.sans, fontSize: 13, color: T.muted, marginLeft: 8 }}>{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(+e.target.value)} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.muted, marginTop: 6, fontFamily: T.sans }}>
        <span>{min}</span><span>{Math.round((min + max) / 2)}</span><span>{max}</span>
      </div>
    </div>
  )
}

export default function EditCycleNumbers() {
  const { back, cycleLength, periodLength, setCycleLength, setPeriodLength } = useLuna()
  const [c, setC] = useState(cycleLength || 28)
  const [p, setP] = useState(periodLength || 5)

  const save = () => {
    if (c !== cycleLength) setCycleLength(c)
    if (p !== periodLength) setPeriodLength(p)
    back()
  }

  return (
    <Screen padBottom={40}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="Your cycle" onBack={back} />
        <div style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 500, letterSpacing: -0.6, lineHeight: 1.1, marginBottom: 10 }}>
          Tune your <em>cycle numbers.</em>
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 14, color: T.muted, lineHeight: 1.55, marginBottom: 28 }}>
          Bodies change. Update these whenever yours has shifted — predictions and phase guidance will follow.
        </div>

        <NumberRow label="Average cycle length" value={c} min={21} max={45} unit="days" onChange={setC} />
        <NumberRow label="Average period length" value={p} min={2} max={9} unit="days" onChange={setP} />

        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <button onClick={back}
            style={{ border: `1px solid ${T.hair}`, background: 'transparent', color: T.text, padding: '15px 18px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans, fontSize: 12, letterSpacing: 0.4, fontWeight: 700 }}>
            CANCEL
          </button>
          <CTAButton full onClick={save}>
            SAVE {Icons.arrow}
          </CTAButton>
        </div>
      </div>
    </Screen>
  )
}
