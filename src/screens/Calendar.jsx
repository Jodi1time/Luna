import { useMemo, useState } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, Rule, Screen } from '../components/shared'
import { PHASES } from '../data/lunaData'
import { useCycle, isOnHormonalBC, getPhaseForDay } from '../hooks/useCycle'
import { PhaseFlourish } from '../components/phaseFlourishes'
import Backdrop from '../components/Backdrop'
import useLuna from '../store/useLuna'
import { sectionPaper, sectionColors } from '../data/sectionPalette'
import { getBcCycleModel, packDayForDate, addDaysToISO } from '../lib/bcCycle'
import { WhyChip, SourceTag } from '../components/Sourced'
import ContextualTip from '../components/ContextualTip'

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

// Spotting days get their own set — on hormonal BC, spotting IS the
// pattern worth seeing, so the method-aware calendar marks it.
function buildSpottingSet(logs) {
  const s = new Set()
  for (const [iso, log] of Object.entries(logs || {})) {
    if (log?.flow === 'Spotting') s.add(iso)
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
  // Method-aware mode — when hormonal BC suppresses the natural phase
  // arc, the calendar stops painting phase math (which would be wrong
  // for her body) and paints the method's rhythm instead.
  const bcModel = getBcCycleModel(store.birthControl)
  const bcMode = onHormonalBC && !bcModel.showNaturalPhases
  const bcStart = store.birthControl?.startDate || null
  const shotDueISO = bcMode && bcModel.kind === 'injection' && bcStart ? addDaysToISO(bcStart, 84) : null
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

  const loggedPeriods = useMemo(() => buildLoggedPeriodSet(store.logs), [store.logs])
  const loggedSpotting = useMemo(() => buildSpottingSet(store.logs), [store.logs])
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
      let dayInCycle = null
      if (!bcMode && cycle.lastPeriodStart) {
        const anchor = new Date(cycle.lastPeriodStart + 'T00:00:00')
        const cur = new Date(iso + 'T00:00:00')
        const diff = Math.floor((cur - anchor) / MS_PER_DAY)
        if (diff >= 0) {
          dayInCycle = (diff % cycle.cycleLength) + 1
          phase = getPhaseForDay(dayInCycle, cycle.cycleLength, cycle.periodLength)
        }
      }
      // BC rhythm — placebo-week tint for pill/patch/ring, shot
      // markers for Depo. Other methods stay unpainted: logged
      // bleeding + spotting are the only honest marks.
      let isPlacebo = false
      let isPackStart = false
      if (bcMode && bcModel.kind === 'pillPack' && bcStart) {
        const pd = packDayForDate(bcStart, iso)
        isPlacebo = pd > 21
        isPackStart = pd === 1
      }
      const isShotDay = bcMode && bcModel.kind === 'injection' && iso === bcStart
      const isShotDue = bcMode && shotDueISO != null && iso === shotDueISO
      const isPeriodDay = loggedPeriods.has(iso) || (!bcMode && isFuture && isPredictedPeriod(iso))
      cells.push({ date: iso, day: d, phase, future: isFuture, isPeriodDay, isLoggedPeriod: loggedPeriods.has(iso), isSpotting: loggedSpotting.has(iso), isPlacebo, isPackStart, isShotDay, isShotDue, dayInCycle })
    }
    return cells
  }, [viewed, daysInMonth, todayISO, loggedPeriods, loggedSpotting, cycle.lastPeriodStart, cycle.cycleLength, cycle.periodLength, bcMode, bcModel.kind, bcStart, shotDueISO])

  // Mark phase boundaries — the first day of a new phase gets a small
  // visual cue (left edge accent) so the eye can see "this is where
  // follicular becomes ovulation" without reading copy. Computed
  // per-cell by comparing each cell's phase id to the previous cell's.
  const cellsWithBoundary = useMemo(() => {
    let prevPhaseId = null
    return monthCells.map((c) => {
      const startsPhase = c.phase && c.phase.id !== prevPhaseId
      prevPhaseId = c.phase?.id ?? prevPhaseId
      return { ...c, startsPhase }
    })
  }, [monthCells])

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
          {bcMode
            ? (bcModel.kind === 'pillPack' && bcStart
                ? 'Bleeding you log is filled. The tinted week is where a withdrawal bleed is expected.'
                : bcModel.kind === 'injection' && bcStart
                  ? 'Bleeding you log is filled. Your last shot and the next due date are marked.'
                  : 'Bleeding you log is filled. No predictions here — your pattern is yours to map.')
            : 'Logged days are filled; predicted days are outlined.'}
        </div>

        <ContextualTip tipId="calendar-tap">
          Tap any past day to log what happened, or change what you wrote. Future days are predictions you can soften by logging.
        </ContextualTip>

        {/* Month header with arrow nav + flourish next to month name */}
        <div className="insight-stagger" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, animationDelay: '100ms' }}>
          <button onClick={() => stepMonth(-1)} aria-label="Previous month"
            style={{ background: 'transparent', border: `1px solid ${T.hair}`, color: T.text, fontFamily: T.sans, fontSize: 14, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: T.r }}>
            ‹
          </button>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              {monthLabel}.
              {isCurrentMonth && !bcMode && (
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

        {/* Legend — phases for natural cycles; the method's own marks
            for hormonal BC users (phase math isn't true for them). */}
        <div className="insight-stagger" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 16, fontSize: 10, fontFamily: T.sans, color: T.muted, animationDelay: '140ms' }}>
          {bcMode ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 8, height: 8, background: T.accent + '30', borderRadius: 1 }} />Bleeding logged
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 6, height: 6, border: `1.2px solid ${T.accent}88`, borderRadius: '50%', background: 'transparent' }} />Spotting
              </div>
              {bcModel.kind === 'pillPack' && bcStart && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 8, height: 8, background: PHASES.menstrual.color + '40', borderRadius: 1 }} />Expected withdrawal bleed
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 3, height: 9, background: T.accent, borderRadius: 1 }} />Pack starts
                  </div>
                </>
              )}
              {bcModel.kind === 'injection' && bcStart && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 8, height: 8, border: `1.5px solid ${T.accent}`, borderRadius: 2 }} />Last shot
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 8, height: 8, border: `1.5px dashed ${T.accent}`, borderRadius: 2 }} />Next shot due
                  </div>
                </>
              )}
            </>
          ) : (
            <>
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
            </>
          )}
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
          {cellsWithBoundary.map(({ date, day, phase, future, isPeriodDay, isLoggedPeriod, isSpotting, isPlacebo, isPackStart, isShotDay, isShotDue, startsPhase }, cellIdx) => {
            const isToday = date === todayISO
            const showLoggedDot = isLoggedPeriod && !bcMode
            const showPredictedDot = !isLoggedPeriod && isPeriodDay && future
            const tappable = !future
            // Diagonal-sweep delay — based on grid row + col so the
            // reveal feels like a wave across the month, not a slab.
            const gridIdx = offset + cellIdx
            const row = Math.floor(gridIdx / 7)
            const col = gridIdx % 7
            const cellDelay = 200 + (row + col) * 18
            // BC-mode paint: logged bleeding fills the cell; placebo
            // week gets a soft tint (filled past, dashed future);
            // shot day + shot-due day get rings. Natural mode keeps
            // the phase paint untouched.
            const cellBg = bcMode
              ? (isLoggedPeriod ? T.accent + '30'
                : isPlacebo && !future ? PHASES.menstrual.color + '22'
                : 'transparent')
              : (phase && !future ? phase.color + (isToday ? '' : '28') : 'transparent')
            const cellBorder = bcMode
              ? (isShotDay ? `1.5px solid ${T.accent}`
                : isShotDue ? `1.5px dashed ${T.accent}`
                : isPlacebo && future ? `1px dashed ${PHASES.menstrual.color}88`
                : 'none')
              : (future && phase ? `1px dashed ${phase.color}88` : 'none')
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
                  background: cellBg,
                  color: isToday && phase && !bcMode ? '#fff' : T.text,
                  border: cellBorder,
                  borderRadius: T.r,
                  cursor: tappable ? 'pointer' : 'default',
                  padding: 0,
                  animationDelay: `${cellDelay}ms`,
                  // Phase-start cells (natural) / pack-start cells (BC)
                  // get a thin accent line on the left edge — "something
                  // begins here" without copy.
                  boxShadow: bcMode
                    ? (isPackStart ? `inset 3px 0 0 0 ${T.accent}` : 'none')
                    : (startsPhase && !future && phase ? `inset 3px 0 0 0 ${phase.color}` : 'none'),
                }}>
                {/* Today cell pulse ring — quiet "you are here" anchor */}
                {isToday && (phase || bcMode) && (
                  <div className="pulse-ring" aria-hidden="true"
                    style={{
                      position: 'absolute', inset: -3,
                      border: `1.5px solid ${bcMode ? T.accent : phase.color}`,
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
                {bcMode && isSpotting && (
                  <div style={{ position: 'absolute', top: 3, right: 3, width: 5, height: 5, border: `1px solid ${T.accent}88`, borderRadius: '50%', background: 'transparent' }} />
                )}
              </button>
            )
          })}
        </div>

        <Rule />

        {/* Predictions — written like a friend, not a dashboard */}
        <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, letterSpacing: -0.3, marginBottom: 4, animationDelay: '600ms' }}>
          Looking ahead.
        </div>
        <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 14, color: T.muted, marginBottom: 14, fontStyle: 'italic', animationDelay: '640ms' }}>
          {bcMode ? 'What your method has coming up.' : "What's likely coming up, with how steady the call is."}
        </div>
        {bcMode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {bcModel.missingStartDate ? (
              <button onClick={() => go('birthControl')}
                className="insight-stagger alive-card"
                style={{ padding: 18, background: T.accent + '10', border: `1px solid ${T.accent}38`, borderRadius: T.r, textAlign: 'left', cursor: 'pointer', width: '100%', color: T.text, fontFamily: 'inherit', animationDelay: '680ms' }}>
                <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, fontWeight: 500, color: T.accent, letterSpacing: -0.1, marginBottom: 6 }}>
                  a small thing to set
                </div>
                <div style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 500, lineHeight: 1.35, marginBottom: 6 }}>
                  {bcModel.startDateLabel}
                </div>
                <div style={{ fontFamily: T.serif, fontSize: 13.5, fontStyle: 'italic', color: T.muted, lineHeight: 1.55 }}>
                  Once Luna knows, this calendar starts working for your method — the rhythm, the next thing, all of it.
                </div>
              </button>
            ) : bcModel.nextThing && (() => {
              const nt = bcModel.nextThing
              const ntCategory = nt.urgent ? 'urgent' : nt.kind === 'next-shot' ? 'care' : nt.kind === 'pattern-discovery' ? 'reflect' : 'urgent'
              const ntAccent = sectionColors(ntCategory).accent
              const todayPackDay = bcModel.kind === 'pillPack' && bcStart ? packDayForDate(bcStart, todayISO) : null
              return (
                <div className="insight-stagger alive-card" style={{
                  padding: 16,
                  background: sectionPaper(ntCategory),
                  border: `1px solid ${ntAccent}22`,
                  boxShadow: `0 1px 0 ${ntAccent}10, 0 10px 22px -18px ${ntAccent}30`,
                  borderRadius: T.r,
                  animationDelay: '680ms',
                }}>
                  <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.2, color: ntAccent, fontWeight: 600, marginBottom: 6 }}>
                    {nt.eyebrow}
                  </div>
                  <div style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 500, lineHeight: 1.3, marginBottom: 6 }}>
                    {nt.title}
                  </div>
                  <div style={{ fontFamily: T.serif, fontSize: 13.5, color: T.muted, lineHeight: 1.55, fontStyle: 'italic' }}>
                    {nt.body}
                  </div>
                  {bcModel.kind === 'pillPack' && todayPackDay != null && (
                    <WhyChip label="learn more" color={ntAccent} source="ACOG Practice Bulletin 110">
                      A 28-day pack runs 21 active days, then 7 placebo days. You're on pack day <strong>{todayPackDay}</strong>. The bleed during placebo week is a withdrawal bleed — your body responding to the hormone drop — not a true period.
                    </WhyChip>
                  )}
                  {bcModel.kind === 'injection' && (
                    <WhyChip label="learn more" color={ntAccent} source="Depo-Provera prescribing information">
                      The shot is re-dosed every <strong>12 weeks</strong>. Protection holds to about 13 weeks; most providers allow up to 15 before asking for a pregnancy test first. Luna counts from the injection date you gave her.
                    </WhyChip>
                  )}
                </div>
              )
            })()}
            <button onClick={() => go('bcMethod')}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.accent, fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, padding: '4px 0', textAlign: 'left', letterSpacing: -0.1 }}>
              A deeper read on your method →
            </button>
          </div>
        ) : filteredPredictions ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredPredictions.map((p, i) => {
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
              // Map each prediction kind to a section category for the
              // soft background tint. Period predictions → urgent (rose),
              // fertile window → care (gold — preciousness), PMS → plan
              // (moonlight, the "luteal anticipating" feel).
              const category =
                p.label === 'Next period'    ? 'urgent' :
                p.label === 'Fertile window' ? 'care' :
                p.label === 'PMS window'     ? 'plan' :
                'default'
              return (
                <div key={i} className="insight-stagger alive-card" style={{
                  padding: 16,
                  background: sectionPaper(category),
                  border: `1px solid ${accentColor}22`,
                  boxShadow: `0 1px 0 ${accentColor}10, 0 10px 22px -18px ${accentColor}30`,
                  borderRadius: T.r,
                  animationDelay: `${680 + i * 80}ms`,
                }}>
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
                  {/* Show your work — expandable underlying math. The
                      transparency Flo never offers. */}
                  <WhyChip
                    label="learn more"
                    color={accentColor}
                    source={
                      p.label === 'Next period' ? 'Computed from your logged cycle starts' :
                      p.label === 'Fertile window' ? 'BBT + mucus + libido fusion' :
                      'Late luteal — late-cycle hormone drop'
                    }
                  >
                    {p.label === 'Next period' && (
                      <>
                        Cycle length averages <strong>{cycle.cycleLength} days</strong> across your last {Math.min(6, cycle.cyclesLogged)} logged cycle{cycle.cyclesLogged === 1 ? '' : 's'}{cycle.variance?.stdDev != null ? `, varying by ±${cycle.variance.stdDev.toFixed(1)} days` : ''}.
                        {' '}Today is day <strong>{cycle.cycleDay}</strong>. Add {cycle.cycleLength - cycle.cycleDay + 1} days from today → predicted start.
                      </>
                    )}
                    {p.label === 'Fertile window' && (
                      <>
                        {cycle.ovulation
                          ? <>Your fertile window centers on day <strong>{cycle.ovulation.day}</strong> — triangulated from {cycle.ovulation.signals.length} signal{cycle.ovulation.signals.length === 1 ? '' : 's'} ({cycle.ovulation.signals.map((s) => s.type === 'bbt' ? 'BBT shift' : s.type === 'mucus' ? 'egg-white mucus' : 'libido peak').join(', ')}). Sperm survives 3-5 days, so the window stretches before ovulation, not after.</>
                          : <>Without logged BBT or mucus, this is anchored to the calendar midpoint of your <strong>{cycle.cycleLength}-day</strong> cycle. Logging mucus and BBT tightens this materially.</>}
                      </>
                    )}
                    {p.label === 'PMS window' && (
                      <>
                        PMS-pattern symptoms cluster in the final ~5 days of luteal — estrogen and progesterone both drop sharply, serotonin follows. With a {cycle.cycleLength}-day cycle, that's days <strong>{cycle.cycleLength - cycle.periodLength - 4}–{cycle.cycleLength - 1}</strong>.
                      </>
                    )}
                  </WhyChip>
                </div>
              )
            })}
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
