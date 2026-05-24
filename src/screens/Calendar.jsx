import { T } from '../data/theme'
import { Masthead, Eyebrow, Rule, Screen } from '../components/shared'
import { PHASES } from '../data/lunaData'
import { useCycle } from '../hooks/useCycle'
import useLuna from '../store/useLuna'

export default function Calendar() {
  const store = useLuna()
  const { monthGrid, predictions } = useCycle(store)
  const now = new Date()
  const todayISO = now.toISOString().slice(0, 10)
  const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const dayLetters = ['M','T','W','T','F','S','S']
  const firstDay   = new Date(now.getFullYear(), now.getMonth(), 1).getDay()
  const offset     = firstDay === 0 ? 6 : firstDay - 1

  return (
    <Screen>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="The Calendar" />
        <Eyebrow>{ now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase() }</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 40, fontWeight: 500, letterSpacing: -1, lineHeight: 1, marginBottom: 14 }}>
          {now.toLocaleDateString('en-US', { month: 'long' })}.
        </div>

        {/* Phase legend */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 16, fontSize: 10, fontFamily: T.sans, color: T.muted }}>
          {Object.values(PHASES).map((p) => (
            <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, background: p.color, borderRadius: 1 }} />{p.name}
            </div>
          ))}
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
          {dayLetters.map((d, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: 9, color: T.muted, fontFamily: T.mono, fontWeight: 600, letterSpacing: 1 }}>{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {Array.from({ length: offset }).map((_, i) => <div key={`pad${i}`} />)}
          {monthGrid.map(({ date, phase, future }) => {
            const isToday = date === todayISO
            return (
              <div key={date} style={{
                aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontFamily: T.serif, fontWeight: isToday ? 600 : 400,
                background: phase && !future ? phase.color + (isToday ? '' : '28') : 'transparent',
                color: isToday && phase ? '#fff' : T.text,
                border: future && phase ? `1px dashed ${phase.color}88` : 'none',
                borderRadius: T.r,
              }}>
                {new Date(date + 'T12:00:00').getDate()}
              </div>
            )
          })}
        </div>

        <Rule />

        {/* Predictions */}
        <Eyebrow>PREDICTIONS · WITH REASONING</Eyebrow>
        {predictions ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
            {predictions.map((p, i) => (
              <div key={i} style={{ padding: 14, background: T.card, border: `1px solid ${T.hair}`, borderRadius: T.r }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 10, letterSpacing: 1.5, color: T.muted, fontWeight: 700, fontFamily: T.sans }}>{p.label.toUpperCase()}</span>
                  <span style={{ fontSize: 10, fontFamily: T.mono, color: T.accent }}>{p.conf}</span>
                </div>
                <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, marginTop: 4 }}>{p.date}</div>
                <div style={{ fontFamily: T.sans, fontSize: 11.5, color: T.muted, marginTop: 6, lineHeight: 1.4 }}>
                  <em>Why:</em> {p.why}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontFamily: T.serif, fontSize: 15, color: T.muted, fontStyle: 'italic', marginTop: 8 }}>
            Complete onboarding to unlock phase predictions.
          </div>
        )}
        <div style={{ height: 16 }} />
      </div>
    </Screen>
  )
}
