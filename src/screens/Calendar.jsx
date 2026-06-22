import { useMemo, useState } from 'react'
import { T } from '../data/theme'
import { Rule, Screen } from '../components/shared'
import { PHASES } from '../data/lunaData'
import { useCycle, isOnHormonalBC, getPhaseForDay } from '../hooks/useCycle'
import { PhaseFlourish } from '../components/phaseFlourishes'
import Backdrop from '../components/Backdrop'
import useLuna from '../store/useLuna'
import { WhyChip } from '../components/Sourced'
import { toDateKey } from '../lib/dateOnly'

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
  const todayISO = toDateKey(now)

  // viewed = the first day of the month currently on screen.
  const [viewed, setViewed] = useState(new Date(now.getFullYear(), now.getMonth(), 1))
  const stepMonth = (delta) => setViewed((v) => new Date(v.getFullYear(), v.getMonth() + delta, 1))
  const goToday = () => setViewed(new Date(now.getFullYear(), now.getMonth(), 1))

  const dayLetters = ['M','T','W','T','F','S','S']
  const firstDay   = viewed.getDay()
  const offset     = firstDay === 0 ? 6 : firstDay - 1
  const daysInMonth = new Date(viewed.getFullYear(), viewed.getMonth() + 1, 0).getDate()

  const loggedPeriods = useMemo(() => buildLoggedPeriodSet(store.logs), [store.logs])
  const nextPeriodStart = useMemo(() => {
    const periodPrediction = cycle.predictions?.find((p) => p.label === 'Next period')
    return periodPrediction?.iso ? new Date(periodPrediction.iso + 'T00:00:00') : null
  }, [cycle.predictions])

  const isPredictedPeriod = (iso) => {
    if (!nextPeriodStart) return false
    const d = new Date(iso + 'T00:00:00')
    const diff = Math.round((d - nextPeriodStart) / MS_PER_DAY)
    return diff >= 0 && diff < cycle.periodLength
  }

  const monthCells = (() => {
    const cells = []
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = toDateKey(new Date(viewed.getFullYear(), viewed.getMonth(), d))
      const isFuture = iso > todayISO
      let phase = null
      let dayInCycle = null
      if (cycle.lastPeriodStart) {
        const anchor = new Date(cycle.lastPeriodStart + 'T00:00:00')
        const cur = new Date(iso + 'T00:00:00')
        const diff = Math.round((cur - anchor) / MS_PER_DAY)
        if (diff >= 0) {
          dayInCycle = (diff % cycle.cycleLength) + 1
          phase = getPhaseForDay(dayInCycle, cycle.cycleLength, cycle.periodLength)
        }
      }
      const isPeriodDay = loggedPeriods.has(iso) || (isFuture && isPredictedPeriod(iso))
      cells.push({ date: iso, day: d, phase, future: isFuture, isPeriodDay, isLoggedPeriod: loggedPeriods.has(iso), dayInCycle })
    }
    return cells
  })()

  // Mark phase boundaries — the first day of a new phase gets a small
  // visual cue (left edge accent) so the eye can see "this is where
  // follicular becomes ovulation" without reading copy. Computed
  // per-cell by comparing each cell's phase id to the previous cell's.
  const cellsWithBoundary = (() => {
    let prevPhaseId = null
    return monthCells.map((c) => {
      const startsPhase = c.phase && c.phase.id !== prevPhaseId
      prevPhaseId = c.phase?.id ?? prevPhaseId
      return { ...c, startsPhase }
    })
  })()

  const monthLabel = viewed.toLocaleDateString('en-US', { month: 'long' })
  const yearLabel = viewed.getFullYear()
  const isCurrentMonth = viewed.getFullYear() === now.getFullYear() && viewed.getMonth() === now.getMonth()

  const blobColor = (cycle.phase?.color) || T.accent
  const flourishPhase = cycle.phase?.id || 'follicular'
  const flourishColor = (cycle.phase?.color) || T.accent

  return (
    <div className="home-stage">
      {!onHormonalBC && <Backdrop accent={blobColor} subtle />}
      <Screen>
        <div style={{ position: 'relative', zIndex: 1, padding: '20px 22px 0', color: T.text }}>
        <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 40, fontWeight: 500, letterSpacing: -1, lineHeight: 1, marginBottom: 6, animationDelay: '0ms' }}>
          Your cycle, mapped.
        </div>
        <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 14, color: T.muted, marginBottom: 22, fontStyle: 'italic', animationDelay: '60ms' }}>
          Logged days are filled; predicted days are outlined.
        </div>

        {/* Month header with arrow nav + flourish next to month name */}
        <div className="insight-stagger" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, animationDelay: '100ms' }}>
          <button onClick={() => stepMonth(-1)} aria-label="Previous month"
            style={{ background: 'transparent', border: `1px solid ${T.hair}`, color: T.text, fontFamily: T.sans, fontSize: 14, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: T.r }}>
            ‹
          </button>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              {monthLabel}.
              {isCurrentMonth && (
                <span style={{ color: flourishColor, opacity: 0.7, display: 'inline-flex', transform: 'translateY(-2px)' }} aria-hidden="true">
                  <PhaseFlourish phaseId={flourishPhase} size={20} />
                </span>
              )}
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
        <div className="insight-stagger" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 16, fontSize: 10, fontFamily: T.sans, color: T.muted, animationDelay: '140ms' }}>
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
        <div className="insight-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6, animationDelay: '160ms' }}>
          {dayLetters.map((d, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: 9, color: T.muted, fontFamily: T.mono, fontWeight: 600, letterSpacing: 1 }}>{d}</div>
          ))}
        </div>

        {/* Days grid — each cell fades in with a diagonal sweep delay
            so the month assembles itself top-left → bottom-right
            instead of arriving as one slab. Stagger of 18ms per
            position keeps total reveal under ~750ms. */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {Array.from({ length: offset }).map((_, i) => <div key={`pad${i}`} />)}
          {cellsWithBoundary.map(({ date, day, phase, future, isPeriodDay, isLoggedPeriod, startsPhase }, cellIdx) => {
            const isToday = date === todayISO
            const showLoggedDot = isLoggedPeriod
            const showPredictedDot = !isLoggedPeriod && isPeriodDay && future
            const tappable = !future
            // Diagonal-sweep delay — based on grid row + col so the
            // reveal feels like a wave across the month, not a slab.
            const gridIdx = offset + cellIdx
            const row = Math.floor(gridIdx / 7)
            const col = gridIdx % 7
            const cellDelay = 200 + (row + col) * 18
            return (
              <button key={date}
                onClick={tappable ? () => openLogFor(date) : undefined}
                disabled={!tappable}
                aria-label={tappable ? `Log for ${date}` : `Future day ${date}`}
                className="insight-stagger"
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
                  animationDelay: `${cellDelay}ms`,
                  // Phase-start cells get a thin accent line on the left
                  // edge — visual cue for "phase begins here" without copy.
                  boxShadow: startsPhase && !future && phase ? `inset 3px 0 0 0 ${phase.color}` : 'none',
                }}>
                {/* Today cell pulse ring — quiet "you are here" anchor */}
                {isToday && phase && (
                  <div className="pulse-ring" aria-hidden="true"
                    style={{
                      position: 'absolute', inset: -3,
                      border: `1.5px solid ${phase.color}`,
                      borderRadius: T.r,
                      pointerEvents: 'none',
                    }} />
                )}
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

        {/* One quiet prediction surface. Dates stay scannable; the reasoning
            lives behind a single disclosure instead of three repeated cards. */}
        <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, letterSpacing: -0.3, marginBottom: 4, animationDelay: '600ms' }}>
          Looking ahead.
        </div>
        <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 14, color: T.muted, marginBottom: 14, fontStyle: 'italic', animationDelay: '640ms' }}>
          A useful window, never a promise.
        </div>
        {filteredPredictions ? (
          <div className="insight-stagger frost-card" style={{
            background: 'rgba(253,250,245,0.66)',
            border: `1px solid ${T.accent}20`,
            borderRadius: 18,
            overflow: 'hidden',
            boxShadow: `0 14px 32px -26px ${T.accent}55`,
            animationDelay: '680ms',
          }}>
            <div style={{ padding: '15px 16px 13px', borderBottom: `1px solid ${T.hair}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', background: T.accent, boxShadow: `0 0 0 4px ${T.accent}12` }} />
                <span style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.1, color: T.accent, fontWeight: 700, textTransform: 'uppercase' }}>
                  {cycle.variance?.label || 'Still learning'}
                </span>
              </div>
              <div style={{ fontFamily: T.serif, fontSize: 13, color: T.muted, lineHeight: 1.45, fontStyle: 'italic' }}>
                {cycle.variance?.why}
              </div>
            </div>
            {filteredPredictions.map((p, i) => {
              const title =
                p.label === 'Next period'    ? 'Next period' :
                p.label === 'Fertile window' ? 'Fertile window' :
                p.label === 'PMS window'     ? 'PMS may gather' :
                p.label
              const accentColor =
                p.label === 'Next period'    ? PHASES.menstrual.color :
                p.label === 'Fertile window' ? PHASES.ovulation.color :
                p.label === 'PMS window'     ? PHASES.luteal.color :
                T.accent
              const rangeLabel = p.range
                ? p.range.replace('±', 'give or take').replace(/(\d+) days?/, (_, n) => `${n} day${n === '1' ? '' : 's'}`)
                : null
              return (
                <div key={i} style={{
                  display: 'grid',
                  gridTemplateColumns: '8px minmax(0, 1fr)',
                  gap: 10,
                  padding: '13px 16px',
                  borderBottom: `1px solid ${T.hair}`,
                }}>
                  <span aria-hidden="true" style={{ width: 3, height: 26, borderRadius: 3, background: accentColor, opacity: 0.75, marginTop: 2 }} />
                  <div>
                    <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: 1, color: T.muted, fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>
                      {title}
                    </div>
                    <div style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 500, lineHeight: 1.3, color: accentColor }}>
                      {p.date}
                    </div>
                    {rangeLabel && (
                      <div style={{ fontFamily: T.serif, fontSize: 12.5, color: T.muted, fontStyle: 'italic', marginTop: 2 }}>
                        {rangeLabel}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            <div style={{ padding: '3px 16px 12px' }}>
              <WhyChip label="How Luna estimated this" source="Your cycle starts and optional body signals">
                Your next period uses {cycle.cyclesLogged > 0 ? `${cycle.cyclesLogged} completed cycle${cycle.cyclesLogged === 1 ? '' : 's'}` : `the ${cycle.cycleLength}-day starting estimate you entered`}.
                {' '}The fertile window {cycle.ovulation ? `also reflects ${cycle.ovulation.signals.length} body signal${cycle.ovulation.signals.length === 1 ? '' : 's'}` : 'uses a calendar estimate until you log repeat BBT or cervical-mucus patterns'}.
                {' '}PMS is shown as the final five days before the next expected period. These windows are for awareness, not birth control.
              </WhyChip>
            </div>
          </div>
        ) : (
          <div className="alive-card frost-card" style={{
            padding: 22,
            background: `linear-gradient(160deg, ${T.accent}0c, rgba(253,250,245,0.55))`,
            border: `1px solid ${T.accent}1f`,
            borderRadius: 22,
            boxShadow: `0 14px 30px -22px ${T.accent}38`,
          }}>
            {/* Three soft phase-dots forming a small arc — visualises
                "your rhythm" without literal cycle data yet. */}
            <svg width="56" height="20" viewBox="0 0 56 20" style={{ marginBottom: 12, opacity: 0.85 }} aria-hidden="true">
              <path d="M4 14 Q 28 -2 52 14" stroke={T.accent} strokeWidth="1" fill="none" opacity="0.4" strokeLinecap="round"/>
              <circle cx="4" cy="14" r="2.5" fill={PHASES.menstrual.color}/>
              <circle cx="28" cy="3" r="2.5" fill={PHASES.ovulation.color}/>
              <circle cx="52" cy="14" r="2.5" fill={PHASES.luteal.color}/>
            </svg>
            <div style={{ fontFamily: T.serif, fontSize: 19, fontWeight: 500, letterSpacing: -0.3, lineHeight: 1.25, marginBottom: 8 }}>
              Your rhythm starts here.
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 14, fontStyle: 'italic', color: T.muted, lineHeight: 1.55 }}>
              Log your first period and Luna begins learning. Three or four cycles in, predictions sharpen — you'll feel the difference.
            </div>
          </div>
        )}
        <div style={{ height: 16 }} />
      </div>
      </Screen>
    </div>
  )
}
