import { useMemo, useState } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, Rule, Screen } from '../components/shared'
import { PHASES } from '../data/lunaData'
import { useCycle, isOnHormonalBC, getPhaseForDay } from '../hooks/useCycle'
import useLuna from '../store/useLuna'

const MS_PER_DAY = 86400000

// Build a date-keyed map of period days from saved logs. A logged flow
// other than 'Spotting' counts as a period day for visualization.
function buildLoggedPeriodSet(logs) {
  const s = new Set()
  for (const [iso, log] of Object.entries(logs || {})) {
    if (log?.flow && log.flow !== 'Spotting') s.add(iso)
  }
  return s
}

export default function Calendar() {
  const store = useLuna()
  const cycle = useCycle(store)
  const onHormonalBC = isOnHormonalBC(store.birthControl)
  const { go, setActiveLogDate } = store
  const openLogFor = (iso) => {
    setActiveLogDate(iso)
    go('log')
  }
  const filteredPredictions = cycle.predictions
    ? (onHormonalBC ? cycle.predictions.filter((p) => p.label !== 'Fertile window') : cycle.predictions)
    : null

  const now = new Date()
  const todayISO = now.toISOString().slice(0, 10)

  // viewed = the first day of the month currently on screen.
  const [viewed, setViewed] = useState(new Date(now.getFullYear(), now.getMonth(), 1))
  const stepMonth = (delta) => setViewed((v) => new Date(v.getFullYear(), v.getMonth() + delta, 1))
  const goToday = () => setViewed(new Date(now.getFullYear(), now.getMonth(), 1))

  const dayLetters = ['M','T','W','T','F','S','S']
  const firstDay   = viewed.getDay()
  const offset     = firstDay === 0 ? 6 : firstDay - 1
  const daysInMonth = new Date(viewed.getFullYear(), viewed.getMonth() + 1, 0).getDate()

  // Build the grid of (date, phase, future, isPeriodDay) for the viewed
  // month. Phase comes from the cycle math anchored to lastPeriodStart;
  // period days are union of logged flow days and predicted period days.
  const loggedPeriods = useMemo(() => buildLoggedPeriodSet(store.logs), [store.logs])
  const nextPeriodStart = useMemo(() => {
    if (!cycle.lastPeriodStart) return null
    const start = new Date(cycle.lastPeriodStart + 'T00:00:00')
    return new Date(start.getTime() + cycle.cycleLength * MS_PER_DAY)
  }, [cycle.lastPeriodStart, cycle.cycleLength])

  const isPredictedPeriod = (iso) => {
    if (!nextPeriodStart) return false
    const d = new Date(iso + 'T00:00:00')
    const diff = Math.round((d - nextPeriodStart) / MS_PER_DAY)
    return diff >= 0 && diff < cycle.periodLength
  }

  const monthCells = useMemo(() => {
    const cells = []
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = new Date(viewed.getFullYear(), viewed.getMonth(), d).toISOString().slice(0, 10)
      const isFuture = iso > todayISO
      let phase = null
      if (cycle.lastPeriodStart) {
        const anchor = new Date(cycle.lastPeriodStart + 'T00:00:00')
        const cur = new Date(iso + 'T00:00:00')
        const diff = Math.floor((cur - anchor) / MS_PER_DAY)
        if (diff >= 0) {
          const dayInCycle = (diff % cycle.cycleLength) + 1
          phase = getPhaseForDay(dayInCycle, cycle.cycleLength, cycle.periodLength)
        }
      }
      const isPeriodDay = loggedPeriods.has(iso) || (isFuture && isPredictedPeriod(iso))
      cells.push({ date: iso, day: d, phase, future: isFuture, isPeriodDay, isLoggedPeriod: loggedPeriods.has(iso) })
    }
    return cells
  }, [viewed, daysInMonth, todayISO, loggedPeriods, cycle.lastPeriodStart, cycle.cycleLength, cycle.periodLength])

  const monthLabel = viewed.toLocaleDateString('en-US', { month: 'long' })
  const yearLabel = viewed.getFullYear()
  const isCurrentMonth = viewed.getFullYear() === now.getFullYear() && viewed.getMonth() === now.getMonth()

  const blobColor = (cycle.phase?.color) || T.accent
  return (
    <div className="home-stage">
      {!onHormonalBC && (
        <div className="blob-stage subtle" aria-hidden="true">
          <div className="breathing-blob" style={{ '--phase-color': blobColor }} />
        </div>
      )}
      <Screen>
        <div style={{ position: 'relative', zIndex: 1, padding: '20px 22px 0', color: T.text }}>
        <div style={{ fontFamily: T.serif, fontSize: 40, fontWeight: 500, letterSpacing: -1, lineHeight: 1, marginBottom: 6 }}>
          Your cycle, mapped.
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 14, color: T.muted, marginBottom: 22, fontStyle: 'italic' }}>
          Logged days are filled; predicted days are outlined.
        </div>

        {/* Month header with arrow nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <button onClick={() => stepMonth(-1)} aria-label="Previous month"
            style={{ background: 'transparent', border: `1px solid ${T.hair}`, color: T.text, fontFamily: T.sans, fontSize: 14, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: T.r }}>
            ‹
          </button>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1 }}>
              {monthLabel}.
            </div>
            <div style={{ fontFamily: T.sans, fontSize: 11, color: T.muted, marginTop: 2, letterSpacing: 1 }}>
              {yearLabel}
            </div>
          </div>
          <button onClick={() => stepMonth(1)} aria-label="Next month"
            style={{ background: 'transparent', border: `1px solid ${T.hair}`, color: T.text, fontFamily: T.sans, fontSize: 14, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: T.r }}>
            ›
          </button>
        </div>
        {!isCurrentMonth && (
          <button onClick={goToday}
            style={{ background: 'transparent', border: 'none', color: T.accent, fontFamily: T.sans, fontSize: 11, fontWeight: 700, letterSpacing: 1.2, cursor: 'pointer', padding: '4px 0', marginBottom: 10 }}>
            ← back to this month
          </button>
        )}

        {/* Phase + period legend */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 16, fontSize: 10, fontFamily: T.sans, color: T.muted }}>
          {Object.values(PHASES).map((p) => (
            <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, background: p.color, borderRadius: 1 }} />{p.name}
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 6, height: 6, background: T.accent, borderRadius: '50%' }} />Period day
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 6, height: 6, border: `1.2px solid ${T.accent}`, borderRadius: '50%', background: 'transparent' }} />Predicted period
          </div>
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
          {monthCells.map(({ date, day, phase, future, isPeriodDay, isLoggedPeriod }) => {
            const isToday = date === todayISO
            const showLoggedDot = isLoggedPeriod
            const showPredictedDot = !isLoggedPeriod && isPeriodDay && future
            // Past and today are tappable → open Log for that date.
            // Future days are non-interactive (no log to make yet).
            const tappable = !future
            return (
              <button key={date}
                onClick={tappable ? () => openLogFor(date) : undefined}
                disabled={!tappable}
                aria-label={tappable ? `Log for ${date}` : `Future day ${date}`}
                style={{
                position: 'relative',
                aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontFamily: T.serif, fontWeight: isToday ? 600 : 400,
                background: phase && !future ? phase.color + (isToday ? '' : '28') : 'transparent',
                color: isToday && phase ? '#fff' : T.text,
                border: future && phase ? `1px dashed ${phase.color}88` : 'none',
                borderRadius: T.r,
                cursor: tappable ? 'pointer' : 'default',
                padding: 0,
                fontFamily: T.serif,
              }}>
                {day}
                {showLoggedDot && (
                  <div style={{ position: 'absolute', top: 3, right: 3, width: 5, height: 5, background: T.accent, borderRadius: '50%' }} />
                )}
                {showPredictedDot && (
                  <div style={{ position: 'absolute', top: 3, right: 3, width: 5, height: 5, border: `1px solid ${T.accent}`, borderRadius: '50%', background: 'transparent' }} />
                )}
              </button>
            )
          })}
        </div>

        <Rule />

        {/* Predictions — written like a friend, not a dashboard */}
        <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, letterSpacing: -0.3, marginBottom: 4 }}>
          Looking ahead.
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 14, color: T.muted, marginBottom: 14, fontStyle: 'italic' }}>
          What's likely coming up, with how steady the call is.
        </div>
        {filteredPredictions ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredPredictions.map((p, i) => {
              // Conversational title + soft confidence wording per row.
              const title =
                p.label === 'Next period'    ? 'Your next period' :
                p.label === 'Fertile window' ? 'Your fertile window' :
                p.label === 'PMS window'     ? 'When PMS may show up' :
                p.label
              const accentColor =
                p.label === 'Next period'    ? PHASES.menstrual.color :
                p.label === 'Fertile window' ? PHASES.ovulation.color :
                p.label === 'PMS window'     ? PHASES.luteal.color :
                T.accent
              const certaintyLabel =
                p.conf === 'high'   ? 'Pretty sure'   :
                p.conf === 'medium' ? 'Likely'        :
                                      'Best guess'
              const rangeLabel = p.range
                ? p.range.replace('±', 'give or take').replace(/(\d+) days?/, (_, n) => `${n} day${n === '1' ? '' : 's'}`)
                : null
              return (
                <div key={i} className="glass-card" style={{ padding: 16, borderLeft: `3px solid ${accentColor}`, borderRadius: T.r }}>
                  <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.2, color: accentColor, fontWeight: 600, marginBottom: 6 }}>
                    {certaintyLabel}
                  </div>
                  <div style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 500, lineHeight: 1.3, marginBottom: 6 }}>
                    {title} — <em style={{ color: accentColor }}>{p.date}</em>
                    {rangeLabel && (
                      <span style={{ fontFamily: T.sans, fontSize: 13, fontStyle: 'normal', color: T.muted, fontWeight: 400 }}>
                        {' '}({rangeLabel})
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily: T.serif, fontSize: 13.5, color: T.muted, lineHeight: 1.55, fontStyle: 'italic' }}>
                    {p.why}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ fontFamily: T.serif, fontSize: 15, color: T.muted, fontStyle: 'italic', marginTop: 8, lineHeight: 1.55 }}>
            Log your first period and Luna will start learning your rhythm from there.
          </div>
        )}
        <div style={{ height: 16 }} />
      </div>
      </Screen>
    </div>
  )
}
