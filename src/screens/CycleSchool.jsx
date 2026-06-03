import { useEffect, useState } from 'react'
import { T } from '../data/theme'
import { Masthead, Screen, SourceLine } from '../components/shared'
import { PhaseFlourish } from '../components/phaseFlourishes'
import { getSchool } from '../data/cycleSchools'
import { sectionColors, sectionPaper } from '../data/sectionPalette'
import useLuna from '../store/useLuna'

export default function CycleSchool() {
  const { back, activeSchoolId, settings, updateSetting } = useLuna()
  const school = getSchool(activeSchoolId)
  const colors = sectionColors(school?.category || 'reflect')
  const accent = colors.accent

  const state = settings?.schools?.[activeSchoolId] || {}
  const completedDays = state.completedDays || []
  const startedAt = state.startedAt

  // Day cursor: open at the lowest incomplete day if any progress
  // exists, otherwise day 1. The user can swipe forward / backward.
  const initialDay = (() => {
    if (!school) return 1
    const nextUndone = Array.from({ length: school.duration }, (_, i) => i + 1)
      .find((n) => !completedDays.includes(n))
    return nextUndone || 1
  })()
  const [dayN, setDayN] = useState(initialDay)

  // On first open, mark the school as started so the list view shows
  // "Continue" instead of "Begin."
  useEffect(() => {
    if (!school) return
    if (startedAt) return
    const next = { ...(settings?.schools || {}) }
    next[school.id] = { ...(next[school.id] || {}), startedAt: new Date().toISOString() }
    updateSetting('schools', next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [school?.id])

  if (!school) {
    return (
      <Screen>
        <div style={{ padding: 22, color: T.muted, fontFamily: T.serif, fontStyle: 'italic' }}>
          Program not found.
        </div>
      </Screen>
    )
  }

  const day = school.days.find((d) => d.n === dayN) || school.days[0]
  const isDone = completedDays.includes(dayN)
  const canPrev = dayN > 1
  const canNext = dayN < school.duration

  // Mark-complete celebration moment — when the user transitions
  // from undone → done, fire a phase-tinted save-bloom on the button
  // briefly so the action feels earned. Auto-clears after 0.9s.
  const [justCompleted, setJustCompleted] = useState(false)
  useEffect(() => {
    if (!justCompleted) return
    const t = setTimeout(() => setJustCompleted(false), 900)
    return () => clearTimeout(t)
  }, [justCompleted])

  const markDay = (n, done) => {
    const next = { ...(settings?.schools || {}) }
    const cur = next[school.id] || { startedAt: new Date().toISOString() }
    const nextDays = done
      ? Array.from(new Set([...(cur.completedDays || []), n])).sort((a, b) => a - b)
      : (cur.completedDays || []).filter((x) => x !== n)
    next[school.id] = { ...cur, completedDays: nextDays, lastDay: n }
    updateSetting('schools', next)
  }

  const toggleDone = () => {
    const willBeDone = !isDone
    markDay(dayN, willBeDone)
    if (willBeDone) setJustCompleted(true)
  }
  const goPrev = () => canPrev && setDayN(dayN - 1)
  const goNext = () => {
    // Mark current day done when advancing — feels intuitive: "I read this, move on."
    if (!isDone) markDay(dayN, true)
    if (canNext) setDayN(dayN + 1)
  }

  return (
    <Screen padBottom={140}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue={school.title.toLowerCase()} onBack={back} />

        {/* Program intro (only on day 1) — light editorial setup */}
        {dayN === 1 && (
          <div className="insight-stagger" style={{ animationDelay: '0ms', marginBottom: 18 }}>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, color: accent, fontWeight: 500, letterSpacing: -0.1, marginBottom: 8 }}>
              {school.phase} phase · 5 days
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 500, lineHeight: 1.1, letterSpacing: -0.6, marginBottom: 10 }}>
              {school.title}
            </div>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 14.5, lineHeight: 1.65, color: T.muted, marginBottom: 22, maxWidth: 360 }}>
              {school.intro}
            </div>
          </div>
        )}

        {/* Day dots — clickable navigation across the 5 days */}
        <div className="insight-stagger" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22, animationDelay: '60ms' }}>
          {school.days.map((d) => {
            const isCurrent = d.n === dayN
            const isDoneDot = completedDays.includes(d.n)
            return (
              <button key={d.n} onClick={() => setDayN(d.n)}
                aria-label={`Day ${d.n}`}
                className="alive-card"
                style={{
                  flex: 1,
                  background: isCurrent ? accent : (isDoneDot ? accent + '40' : 'rgba(253,250,245,0.55)'),
                  border: `1px solid ${isCurrent ? accent : 'rgba(26,19,16,0.06)'}`,
                  borderRadius: 999,
                  padding: '8px 4px',
                  cursor: 'pointer',
                  fontFamily: T.serif, fontStyle: 'italic', fontSize: 12,
                  fontWeight: isCurrent ? 600 : 500,
                  color: isCurrent ? '#fff' : (isDoneDot ? accent : T.muted),
                  letterSpacing: -0.1,
                  transition: 'all .22s var(--ease-out)',
                }}>
                day {d.n}
              </button>
            )
          })}
        </div>

        {/* Day hero — flourish + day title */}
        <div key={`hero-${dayN}`} className="insight-stagger" style={{ animationDelay: '120ms', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div aria-hidden="true" style={{ color: accent, opacity: 0.7 }}>
              <PhaseFlourish phaseId={school.phase} size={22} />
            </div>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: accent, fontWeight: 500, letterSpacing: -0.1 }}>
              day {dayN}
            </div>
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 500, lineHeight: 1.15, letterSpacing: -0.5, color: T.text }}>
            {day.title}
          </div>
        </div>

        {/* Body — the editorial paragraph(s) */}
        <div key={`body-${dayN}`} className="insight-stagger" style={{ animationDelay: '180ms', marginBottom: 22 }}>
          <div style={{ fontFamily: T.serif, fontSize: 17, lineHeight: 1.65, color: T.text, letterSpacing: -0.1 }}>
            {day.body}
          </div>
        </div>

        {/* Practice card — soft tinted, the one small thing to do today */}
        <div key={`prac-${dayN}`} className="insight-stagger alive-card frost-card" style={{
          padding: 22,
          background: sectionPaper(school.category),
          border: `1px solid ${accent}28`,
          borderLeft: `3px solid ${accent}`,
          borderRadius: 22,
          boxShadow: `0 14px 30px -22px ${accent}50`,
          marginBottom: 22,
          animationDelay: '240ms',
        }}>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: accent, fontWeight: 500, letterSpacing: -0.1, marginBottom: 10 }}>
            today's practice
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 16, fontStyle: 'italic', lineHeight: 1.6, color: T.text, letterSpacing: -0.1 }}>
            {day.practice}
          </div>
        </div>

        {/* Source */}
        <SourceLine>{day.source}</SourceLine>

        {/* Day actions: mark complete + navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
          <button onClick={toggleDone}
            className={`alive-card frost-card${justCompleted ? ' save-bloom' : ''}`}
            style={{
              background: isDone ? accent : 'rgba(253,250,245,0.55)',
              color: isDone ? '#fff' : T.text,
              border: `1px solid ${isDone ? accent : 'rgba(26,19,16,0.10)'}`,
              padding: '14px 18px',
              borderRadius: 999,
              cursor: 'pointer',
              fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, letterSpacing: 0.3,
              boxShadow: isDone ? `0 12px 24px -14px ${accent}aa` : '0 10px 22px -22px rgba(26,19,16,0.18)',
              transition: 'all .22s var(--ease-out)',
              // Phase-tinted bloom ring — same vocabulary as the
              // Log save button, so completing a day reads as a
              // small but earned moment.
              '--save-bloom-color': `${accent}80`,
            }}>
            {isDone ? '✓  Marked complete' : 'Mark today complete'}
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={goPrev} disabled={!canPrev}
              className="alive-card frost-card"
              style={{
                flex: 1,
                background: 'rgba(253,250,245,0.55)',
                color: canPrev ? T.text : 'rgba(26,19,16,0.25)',
                border: '1px solid rgba(26,19,16,0.08)',
                padding: '13px 16px',
                borderRadius: 999,
                cursor: canPrev ? 'pointer' : 'default',
                fontFamily: T.sans, fontSize: 12, fontWeight: 600, letterSpacing: 0.3,
              }}>
              ← Previous
            </button>
            <button onClick={goNext} disabled={!canNext}
              className="alive-card"
              style={{
                flex: 1,
                background: canNext ? accent : 'rgba(26,19,16,0.06)',
                color: canNext ? '#fff' : 'rgba(26,19,16,0.25)',
                border: 'none',
                padding: '13px 16px',
                borderRadius: 999,
                cursor: canNext ? 'pointer' : 'default',
                fontFamily: T.sans, fontSize: 12, fontWeight: 600, letterSpacing: 0.3,
                boxShadow: canNext ? `0 12px 24px -14px ${accent}aa` : 'none',
              }}>
              {dayN === school.duration ? 'You did it' : 'Next day →'}
            </button>
          </div>
        </div>

        {/* Closing chip when all days done */}
        {completedDays.length === school.duration && (
          <div className="alive-card frost-card" style={{
            marginTop: 22, padding: 20,
            background: sectionPaper(school.category),
            border: `1px solid ${accent}28`,
            borderLeft: `3px solid ${accent}`,
            borderRadius: 22,
            boxShadow: `0 14px 30px -22px ${accent}50`,
            textAlign: 'center',
          }}>
            <div style={{ fontFamily: T.serif, fontSize: 18, fontStyle: 'italic', color: T.text, letterSpacing: -0.2, lineHeight: 1.4 }}>
              You walked the whole week with your body.
            </div>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: T.muted, marginTop: 8, lineHeight: 1.55 }}>
              The program stays open. Come back when this phase comes back.
            </div>
          </div>
        )}

        <div style={{ height: 24 }} />
      </div>
    </Screen>
  )
}
