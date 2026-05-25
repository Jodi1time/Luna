import { useState } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, CTAButton, Icons, Screen } from '../components/shared'
import useLuna from '../store/useLuna'

// Compact date editor for the "Update last period start" Settings row.
// Shows the previous + current month; tap any past day to set it as the
// new lastPeriodStart. NEVER runs the full onboarding flow (which would
// re-create the vault and lose data).

function CalendarBlock({ year, month, selectedISO, onPick }) {
  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const days = ['M','T','W','T','F','S','S']
  const first = new Date(year, month, 1).getDay()
  const adj = first === 0 ? 6 : first - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayISO = new Date().toISOString().slice(0, 10)

  return (
    <div style={{ background: T.card, padding: 16, border: `1px solid ${T.hair}`, borderRadius: T.r, marginBottom: 14 }}>
      <div style={{ fontWeight: 600, fontSize: 13, fontFamily: T.sans, marginBottom: 12, color: T.text }}>{monthLabel}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
        {days.map((d, i) => <div key={i} style={{ textAlign: 'center', fontSize: 9, color: T.muted, fontFamily: T.mono, fontWeight: 600, letterSpacing: 1 }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {Array.from({ length: adj }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
          const iso = new Date(year, month, d).toISOString().slice(0, 10)
          const isFuture = iso > todayISO
          const isSelected = iso === selectedISO
          return (
            <button key={d} onClick={() => !isFuture && onPick(iso)} disabled={isFuture}
              style={{
                aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontFamily: T.sans, fontWeight: isSelected ? 600 : 400,
                cursor: isFuture ? 'default' : 'pointer', border: 'none',
                background: isSelected ? T.accent : 'transparent',
                color: isSelected ? '#fff' : (isFuture ? T.hair : T.text),
                borderRadius: T.r,
                opacity: isFuture ? 0.4 : 1,
              }}>
              {d}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function EditPeriodStart() {
  const { back, lastPeriodStart, setLastPeriodStart } = useLuna()
  const [selected, setSelected] = useState(lastPeriodStart)

  const now = new Date()
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const handleSave = () => {
    if (selected) setLastPeriodStart(selected)
    back()
  }

  return (
    <Screen padBottom={40}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="Update period start" onBack={back} />
        <Eyebrow>CYCLE · ADJUST ANCHOR</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 500, letterSpacing: -0.6, lineHeight: 1.1, marginBottom: 10 }}>
          When did your <em>last period</em> start?
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 14, color: T.muted, lineHeight: 1.55, marginBottom: 22 }}>
          Tap a day to update. Predictions, cycle math, and phase guidance will reanchor from this date.
        </div>

        <CalendarBlock year={prevMonth.getFullYear()} month={prevMonth.getMonth()} selectedISO={selected} onPick={setSelected} />
        <CalendarBlock year={now.getFullYear()} month={now.getMonth()} selectedISO={selected} onPick={setSelected} />

        {selected && (
          <div style={{ fontFamily: T.sans, fontSize: 12, color: T.muted, marginBottom: 14, textAlign: 'center' }}>
            Selected: <span style={{ color: T.text, fontWeight: 600 }}>{new Date(selected + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <button onClick={back}
            style={{ border: `1px solid ${T.hair}`, background: 'transparent', color: T.text, padding: '15px 18px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans, fontSize: 12, letterSpacing: 0.4, fontWeight: 700 }}>
            CANCEL
          </button>
          <CTAButton full onClick={handleSave} style={{ opacity: selected ? 1 : 0.5 }}>
            SAVE {Icons.arrow}
          </CTAButton>
        </div>
      </div>
    </Screen>
  )
}
