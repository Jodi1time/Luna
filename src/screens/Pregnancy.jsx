import { useState, useMemo } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, CTAButton, Icons, Screen, SourceLine } from '../components/shared'
import { PHASES } from '../data/lunaData'
import useLuna from '../store/useLuna'
import { usePregnancy } from '../hooks/usePregnancy'

const MS_PER_DAY = 86400000

// Trimester accent colours reuse the phase palette so the editorial palette
// stays coherent across the app. First trimester = ovulation, second =
// follicular, third = luteal.
function trimesterColor(num) {
  if (num === 1) return PHASES.ovulation.color
  if (num === 2) return PHASES.follicular.color
  if (num === 3) return PHASES.luteal.color
  return T.accent
}

function formatLongDate(iso) {
  if (!iso) return ''
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function lmpToDue(iso) {
  if (!iso) return null
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + 280)
  return d.toISOString().slice(0, 10)
}

function weeksFromToday(iso) {
  if (!iso) return null
  const d = new Date(iso + 'T00:00:00')
  const now = new Date(); now.setHours(0, 0, 0, 0)
  return Math.round((d - now) / MS_PER_DAY / 7)
}

function CalendarBlock({ year, month, selectedISO, onPick, minISO, maxISO }) {
  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const days = ['M','T','W','T','F','S','S']
  const first = new Date(year, month, 1).getDay()
  const adj = first === 0 ? 6 : first - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()

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
          const outOfRange = (minISO && iso < minISO) || (maxISO && iso > maxISO)
          const isSelected = iso === selectedISO
          return (
            <button key={d} onClick={() => !outOfRange && onPick(iso)} disabled={outOfRange}
              style={{
                aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontFamily: T.sans, fontWeight: isSelected ? 600 : 400,
                cursor: outOfRange ? 'default' : 'pointer', border: 'none',
                background: isSelected ? T.accent : 'transparent',
                color: isSelected ? '#fff' : (outOfRange ? T.hair : T.text),
                borderRadius: T.r,
                opacity: outOfRange ? 0.4 : 1,
              }}>
              {d}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function NotPregnantState() {
  const { back, startPregnancy } = useLuna()
  const [selected, setSelected] = useState(null)

  // LMP date range — within the past 280 days, and not in the future.
  // Per spec: "no more, no less than -10" — allow a 10-day forward window
  // to accommodate users who just discovered they were pregnant and are
  // logging slightly before what would be the canonical LMP date.
  const { minISO, maxISO } = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const min = new Date(today.getTime() - 280 * MS_PER_DAY)
    const max = new Date(today.getTime() + 10 * MS_PER_DAY)
    return { minISO: min.toISOString().slice(0, 10), maxISO: max.toISOString().slice(0, 10) }
  }, [])

  const due = selected ? lmpToDue(selected) : null
  const wks = due ? weeksFromToday(due) : null

  const inRange = selected && selected >= minISO && selected <= maxISO
  const outOfRangeMessage = selected && !inRange
    ? selected < minISO
      ? 'That date is more than 40 weeks ago. If your pregnancy is past 40 weeks, please reach out to your provider.'
      : 'That date is in the future. Pick a date on or near today.'
    : null

  const now = new Date()
  const months = [
    new Date(now.getFullYear(), now.getMonth() - 2, 1),
    new Date(now.getFullYear(), now.getMonth() - 1, 1),
    new Date(now.getFullYear(), now.getMonth(), 1),
  ]

  const activate = () => {
    if (!inRange) return
    startPregnancy({ lmp: selected })
  }

  return (
    <Screen padBottom={40}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="Pregnancy" onBack={back} />
        <Eyebrow>PREGNANCY MODE · OFF</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 10 }}>
          Are you <em>pregnant?</em>
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 15, color: T.muted, lineHeight: 1.55, marginBottom: 24 }}>
          Pregnancy mode swaps cycle tracking for week-by-week guidance through the 40 weeks. Switch back any time.
        </div>

        <div style={{ fontFamily: T.sans, fontSize: 11, letterSpacing: 1.5, fontWeight: 700, color: T.muted, marginBottom: 10, textTransform: 'uppercase' }}>
          When did your last period start?
        </div>

        {months.map((m) => (
          <CalendarBlock key={`${m.getFullYear()}-${m.getMonth()}`}
            year={m.getFullYear()} month={m.getMonth()}
            selectedISO={selected} onPick={setSelected}
            minISO={minISO} maxISO={maxISO}
          />
        ))}

        {selected && inRange && due && (
          <div style={{ background: T.subtle, padding: '14px 16px', border: `1px solid ${T.hair}`, borderRadius: T.r, marginBottom: 14 }}>
            <div style={{ fontFamily: T.sans, fontSize: 10, letterSpacing: 1.5, fontWeight: 700, color: T.accent, marginBottom: 6, textTransform: 'uppercase' }}>
              Estimated due date
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 500, lineHeight: 1.3 }}>
              {formatLongDate(due)}
            </div>
            <div style={{ fontFamily: T.sans, fontSize: 12, color: T.muted, marginTop: 4 }}>
              {wks > 0 ? `${wks} week${wks === 1 ? '' : 's'} from today` : wks === 0 ? 'Right around today' : `${Math.abs(wks)} week${Math.abs(wks) === 1 ? '' : 's'} past`}
            </div>
          </div>
        )}

        {outOfRangeMessage && (
          <div style={{ padding: '10px 14px', border: `1px solid ${T.accent}`, background: T.accent + '0F', borderRadius: T.r, fontFamily: T.sans, fontSize: 12, lineHeight: 1.45, color: T.text, marginBottom: 14 }}>
            {outOfRangeMessage}
          </div>
        )}

        <CTAButton full onClick={activate} style={{ opacity: inRange ? 1 : 0.45, pointerEvents: inRange ? 'auto' : 'none' }}>
          ACTIVATE PREGNANCY MODE {Icons.arrow}
        </CTAButton>

        <div style={{ marginTop: 18, fontFamily: T.mono, fontSize: 10, color: T.muted, lineHeight: 1.6, letterSpacing: 0.4 }}>
          NAEGELE'S RULE — due date = last period + 280 days. Most deliveries happen between 37–42 weeks.
        </div>
      </div>
    </Screen>
  )
}

function PregnantState() {
  const store = useLuna()
  const { back, endPregnancy } = store
  const preg = usePregnancy(store)

  const week = preg.week
  const trim = preg.trimester
  const accent = trimesterColor(trim?.number)
  const content = preg.content

  const daysToDue = preg.daysToDue
  const dueLine = daysToDue > 0
    ? `${daysToDue} day${daysToDue === 1 ? '' : 's'} until due date`
    : daysToDue === 0
      ? 'Today is your due date'
      : `${Math.abs(daysToDue)} day${Math.abs(daysToDue) === 1 ? '' : 's'} past due date`

  const handleEnd = () => {
    const ok = window.confirm('End pregnancy mode? Your data stays — Luna will return to cycle tracking.')
    if (ok) {
      endPregnancy()
      back()
    }
  }

  return (
    <Screen padBottom={40}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="Pregnancy" onBack={back} />
        <Eyebrow color={accent}>WEEK {week} · {trim?.name?.toUpperCase()}</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 44, fontWeight: 500, letterSpacing: -1, lineHeight: 1.02, marginBottom: 4 }}>
          Week {week} <span style={{ color: T.muted, fontWeight: 400 }}>of 40</span>
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 17, fontStyle: 'italic', color: T.muted, marginBottom: 22, lineHeight: 1.4 }}>
          {dueLine}.
        </div>

        <div style={{ background: T.card, padding: 14, border: `1px solid ${T.hair}`, borderLeft: `3px solid ${accent}`, borderRadius: T.r, marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <div style={{ fontFamily: T.sans, fontSize: 10, letterSpacing: 1.5, fontWeight: 700, color: T.muted, textTransform: 'uppercase' }}>Due date</div>
            <div style={{ fontFamily: T.mono, fontSize: 10, color: T.muted, letterSpacing: 0.5 }}>LMP + 280</div>
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 500, lineHeight: 1.3 }}>
            {formatLongDate(preg.dueDate)}
          </div>
        </div>

        {content && (
          <div style={{ background: T.card, padding: 16, border: `1px solid ${T.hair}`, borderLeft: `3px solid ${accent}`, borderRadius: T.r, marginBottom: 18 }}>
            <div style={{ fontFamily: T.sans, fontSize: 10, letterSpacing: 1.5, fontWeight: 700, color: accent, marginBottom: 8, textTransform: 'uppercase' }}>
              This week
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.25, marginBottom: 14, letterSpacing: -0.3 }}>
              About the size of {content.size}.
            </div>
            <div style={{ fontFamily: T.sans, fontSize: 10, letterSpacing: 1.5, fontWeight: 700, color: T.muted, marginBottom: 6, textTransform: 'uppercase' }}>
              Baby
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 15, lineHeight: 1.55, color: T.text, marginBottom: 14 }}>
              {content.baby}
            </div>
            <div style={{ fontFamily: T.sans, fontSize: 10, letterSpacing: 1.5, fontWeight: 700, color: T.muted, marginBottom: 6, textTransform: 'uppercase' }}>
              You
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 15, lineHeight: 1.55, color: T.text }}>
              {content.body}
            </div>
            <SourceLine>{content.source}</SourceLine>
          </div>
        )}

        <div style={{ height: 1, background: T.hair, margin: '18px 0' }} />

        <button onClick={handleEnd}
          style={{
            width: '100%', textAlign: 'left',
            background: 'transparent', border: `1px solid ${T.accent}`,
            padding: '14px 16px', borderRadius: T.r, cursor: 'pointer',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            color: T.accent, fontFamily: T.sans, fontSize: 13, fontWeight: 600,
          }}>
          <span>End pregnancy</span>
          <span style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1, opacity: 0.7 }}>RETURN TO CYCLE</span>
        </button>
        <div style={{ marginTop: 10, fontFamily: T.sans, fontSize: 11, color: T.muted, lineHeight: 1.5 }}>
          Your logs are preserved. Use this after birth, or if circumstances change.
        </div>
      </div>
    </Screen>
  )
}

export default function Pregnancy() {
  const pregnancy = useLuna((s) => s.pregnancy)
  if (pregnancy?.active && pregnancy?.lmp) return <PregnantState />
  return <NotPregnantState />
}
