import { useState, useEffect } from 'react'
import { T } from '../data/theme'
import { Screen, SourceLine } from '../components/shared'
import { SymptomIcon } from '../components/symptomIcons'
import { PHASES, ARTICLES, MOOD_INSIGHTS } from '../data/lunaData'
import { useCycle, isOnHormonalBC } from '../hooks/useCycle'
import { usePregnancy } from '../hooks/usePregnancy'
import { BC_LABELS } from '../data/birthControl'
import useLuna from '../store/useLuna'

const MS_PER_DAY = 86400000

// Warm, embodied phase line — no optimisation-coded copy.
const phasePresence = {
  menstrual:  'Rest is the work this week.',
  follicular: 'A gentle re-opening. Move when it feels right.',
  ovulation:  'Notice what feels easier today — words, wanting, warmth.',
  luteal:     'Be a little softer with yourself. Cravings are signal, not weakness.',
}

// Pick one short article that matches the current phase mood. Manual
// curation so the suggestion never feels random.
const phaseArticle = {
  menstrual:  'iron',
  follicular: 'basics',
  ovulation:  'basics',
  luteal:     'cravings',
}

// A "what's next" sentence that gives the eye an answer Flo-style
// without the optimisation framing. Returns null if there's nothing
// confident to say (no period start logged yet).
function contextualLine({ phase, cycleDay, cycleLength, periodLength }) {
  if (!phase || cycleDay == null) return null
  if (phase.id === 'menstrual') {
    const total = periodLength || 5
    if (cycleDay > total) return 'Your period is winding down.'
    return `Day ${cycleDay} of your period.`
  }
  if (phase.id === 'follicular') {
    const ovMid = Math.round(cycleLength / 2)
    const days = ovMid - cycleDay
    if (days <= 1) return 'Ovulation begins tomorrow.'
    return `${days} days until ovulation.`
  }
  if (phase.id === 'ovulation') {
    return 'You are in your fertile window.'
  }
  if (phase.id === 'luteal') {
    const days = cycleLength - cycleDay + 1
    if (days <= 1) return 'Your period is expected tomorrow.'
    if (days <= 0) return 'Your period is a little late.'
    return `Period expected in ${days} days.`
  }
  return null
}

const trimesterColor = (n) => {
  if (n === 1) return PHASES.ovulation.color
  if (n === 2) return PHASES.follicular.color
  if (n === 3) return PHASES.luteal.color
  return T.accent
}

function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (target == null) { setValue(0); return }
    let raf
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 4)
      setValue(Math.round(target * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

// Living blob centered behind the Home screen. Wrapped in an animated
// container whose vertical position is driven by a react-spring that
// follows scrollY with physics — gives soft, lagged motion rather
// than the on-rails CSS-transform feel of the previous attempt.
// The blob layer sits behind the content layer; both are children of
// the same main stage container so depth reads correctly.
function BackgroundBlob({ color, effect }) {
  // Truly stationary: NO scroll-driven transform. The blob is locked
  // to the phone frame at top:34%, so it doesn't move at all as the
  // user scrolls. The parallax illusion is purely relative motion:
  // content scrolls past a fixed blob. That's what gives "blob is a
  // separate entity behind the screen" feel.
  //
  // The visible "moving" sense comes from the idle morph animation
  // (in CSS, dramatic now) — alive while still.
  return (
    <div className="blob-stage" aria-hidden="true">
      <div className="breathing-blob" style={{ '--phase-color': color }} />
      {effect?.name === 'ripple' && (
        <div key={effect.id} className="blob-ripple" style={{ '--phase-color': color }} />
      )}
      {effect?.name === 'bloom' && (
        <div key={effect.id} className="blob-bloom" style={{ '--phase-color': color }} />
      )}
    </div>
  )
}

function Greeting({ name }) {
  const hour = new Date().getHours()
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  const first = (name || '').split(' ')[0]
  return (
    <div style={{ paddingTop: 6, marginBottom: 14 }}>
      <div style={{ fontFamily: T.serif, fontSize: 24, fontWeight: 400, letterSpacing: -0.4, color: T.text, fontStyle: 'italic' }}>
        Good {timeOfDay}{first ? ', ' : ''}<span style={{ fontStyle: 'normal' }}>{first}</span>.
      </div>
    </div>
  )
}

// Compact 7-day strip — Mon–Sun of the current week. Today is shown
// with a soft pulsing accent ring and a filled disc; period days
// (logged or predicted) get a small dot below the number.
function WeekStrip({ go, cycle, logs }) {
  const today = new Date()
  const dayOfWeek = (today.getDay() + 6) % 7  // 0 = Monday
  const monday = new Date(today)
  monday.setDate(today.getDate() - dayOfWeek)
  monday.setHours(0, 0, 0, 0)
  const todayISO = today.toISOString().slice(0, 10)
  const labels = ['M','T','W','T','F','S','S']

  const nextPeriodStart = (cycle.lastPeriodStart)
    ? new Date(new Date(cycle.lastPeriodStart + 'T00:00:00').getTime() + cycle.cycleLength * MS_PER_DAY)
    : null
  const isPredictedPeriod = (date) => {
    if (!nextPeriodStart) return false
    const diff = Math.round((date - nextPeriodStart) / MS_PER_DAY)
    return diff >= 0 && diff < (cycle.periodLength || 5)
  }
  const isLoggedPeriod = (iso) => {
    const log = logs?.[iso]
    return log?.flow && log.flow !== 'Spotting'
  }

  const cells = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const iso = d.toISOString().slice(0, 10)
    return {
      iso,
      day: d.getDate(),
      label: labels[i],
      isToday: iso === todayISO,
      hasLogged: isLoggedPeriod(iso),
      hasPredicted: !isLoggedPeriod(iso) && isPredictedPeriod(d),
    }
  })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 18 }}>
      {cells.map(({ iso, day, label, isToday, hasLogged, hasPredicted }) => (
        <button key={iso} onClick={() => go('calendar')}
          style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontFamily: 'inherit', color: 'inherit' }}>
          <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.muted, letterSpacing: 1.2, fontWeight: 600 }}>{label}</div>
          <div style={{ position: 'relative', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isToday && (
              <div className="today-disc" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: T.accent }} />
            )}
            <span style={{
              position: 'relative',
              fontFamily: T.serif,
              fontSize: 16,
              fontWeight: isToday ? 600 : 400,
              color: isToday ? '#fff' : T.text,
            }}>
              {day}
            </span>
          </div>
          <div style={{ height: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {hasLogged && (
              <div style={{ width: 5, height: 5, background: T.accent, borderRadius: '50%' }} />
            )}
            {hasPredicted && (
              <div style={{ width: 5, height: 5, border: `1px solid ${T.accent}`, borderRadius: '50%', background: 'transparent' }} />
            )}
          </div>
        </button>
      ))}
    </div>
  )
}

// Always-here essentials at the bottom of Home — surfaces support
// features so users don't have to dig into Settings to find them
// when something is off or needs attention.
function AlwaysHere({ go }) {
  const items = [
    {
      key: 'watch',
      label: 'When something feels off',
      sub: 'Spot the patterns. Take words to your doctor.',
      onTap: () => go('watch'),
    },
    {
      key: 'care',
      label: 'Stay on top of care',
      sub: 'Checkups, screenings, what’s due.',
      onTap: () => go('care'),
    },
  ]
  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ fontFamily: T.serif, fontSize: 16, fontStyle: 'italic', marginBottom: 12, letterSpacing: -0.2 }}>
        Always here.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((it) => (
          <button key={it.key} onClick={it.onTap} className="glass-card"
            style={{
              textAlign: 'left',
              borderRadius: T.r,
              padding: '14px 16px',
              cursor: 'pointer',
              color: T.text,
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}>
            <div>
              <div style={{ fontFamily: T.serif, fontSize: 15.5, fontWeight: 500, lineHeight: 1.3, letterSpacing: -0.1, marginBottom: 4 }}>
                {it.label}
              </div>
              <div style={{ fontFamily: T.sans, fontSize: 11.5, color: T.muted, lineHeight: 1.45 }}>
                {it.sub}
              </div>
            </div>
            <span style={{ fontFamily: T.sans, fontSize: 18, color: T.muted, lineHeight: 1, flexShrink: 0 }}>›</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// Three horizontally-scrollable cards: a nourish hint, a short read,
// a movement hint — all phase-tuned. Soft borders, no images, intentionally
// quiet so they texture the screen without dominating it.
function ForTodayRow({ phase, go, goArticle }) {
  if (!phase) return null
  const article = ARTICLES.find((a) => a.id === phaseArticle[phase.id]) || ARTICLES[0]
  const items = [
    {
      key: 'nourish',
      eyebrow: 'To nourish',
      title: phase.nutrition.headline,
      onTap: () => go('nourish'),
    },
    {
      key: 'read',
      eyebrow: `${article.read} read`,
      title: article.title,
      onTap: () => goArticle(article.id),
    },
    {
      key: 'move',
      eyebrow: 'To move',
      title: phase.exercise.headline,
      onTap: () => go('care'),
    },
  ]
  return (
    <div>
      <div style={{ fontFamily: T.serif, fontSize: 16, fontStyle: 'italic', marginBottom: 10, letterSpacing: -0.2 }}>
        For today.
      </div>
      <div style={{
        display: 'flex', gap: 10, overflowX: 'auto', overflowY: 'hidden',
        marginLeft: -22, marginRight: -22, padding: '4px 22px 6px',
        scrollSnapType: 'x mandatory',
      }}>
        {items.map((it, idx) => (
          <button key={it.key} onClick={it.onTap} className="stagger-card glass-card"
            style={{
              flex: '0 0 64%',
              maxWidth: 220,
              scrollSnapAlign: 'start',
              textAlign: 'left',
              borderLeft: `3px solid ${phase.color}`,
              borderRadius: T.r,
              padding: '14px 14px 16px',
              cursor: 'pointer',
              color: T.text,
              fontFamily: 'inherit',
              animationDelay: `${idx * 80}ms`,
            }}>
            <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.5, fontWeight: 600, color: T.accent, marginBottom: 8 }}>
              {it.eyebrow}
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 15.5, fontWeight: 500, lineHeight: 1.3, letterSpacing: -0.2 }}>
              {it.title}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Home() {
  const store = useLuna()
  const { go, goPhase, goArticle, saveLog, setLastPeriodStart, logs, birthControl, displayName } = store
  const cycle = useCycle(store)
  const { cycleDay, phase, cycleLength, periodLength } = cycle
  const preg = usePregnancy(store)
  const isPreg = preg.active
  const trimColor = isPreg ? trimesterColor(preg.trimester?.number) : null
  const animatedDay = useCountUp(isPreg ? preg.week : cycleDay)
  const [quickMood, setQuickMood] = useState(null)
  const onHormonalBC = isOnHormonalBC(birthControl)
  const bcLabel = BC_LABELS[birthControl?.method] || 'None'

  // Blob effect state — taps in the Home content fire one of two
  // one-shot effects (ripple / bloom) on the blob.
  const [effect, setEffect] = useState(null)
  useEffect(() => {
    if (!effect) return
    const t = setTimeout(() => setEffect(null), 1600)
    return () => clearTimeout(t)
  }, [effect])
  const triggerBlobEffect = () => {
    const options = ['ripple', 'bloom']
    const next = options[Math.floor(Math.random() * options.length)]
    setEffect({ id: Date.now(), name: next })
  }
  const handleContentTap = (e) => {
    if (e.target.closest('button, a, input, [role="button"]')) return
    triggerBlobEffect()
  }

  const todayISO = new Date().toISOString().slice(0, 10)
  const todayLog = logs?.[todayISO]
  const hasFlowToday = todayLog?.flow && todayLog.flow !== 'Spotting'
  const showPeriodCTA = !isPreg && !onHormonalBC && !hasFlowToday && cycleDay != null && cycleDay >= cycleLength - 3

  const handleQuickMood = (m) => {
    setQuickMood(m)
    saveLog(new Date(), { mood: m })
  }

  // Insight surfaced when a mood is tapped — text + (optional) article id,
  // varied by phase. Null when no phase is known yet.
  const moodInsight = (quickMood && phase) ? MOOD_INSIGHTS[phase.id]?.[quickMood] : null
  const logPeriodStart = () => {
    // Explicit user confirmation that today is day 1 — log the flow
    // AND directly anchor lastPeriodStart so detection is immediate
    // (the new 2+ flow days rule in detectPeriodStarts otherwise
    // delays auto-detection until day 2).
    const today = new Date()
    saveLog(today, { ...(todayLog || {}), flow: 'Medium' })
    setLastPeriodStart(today)
  }

  const contextLine = !isPreg ? contextualLine({ phase, cycleDay, cycleLength, periodLength }) : null
  const blobColor = isPreg ? trimColor : (phase?.color || T.accent)

  return (
    <div className="home-stage">
      {/* Blob layer — pinned to .home-stage, doesn't scroll. */}
      <BackgroundBlob color={blobColor} effect={effect} />
      {/* Content layer — scrolls past the stationary blob. */}
      <Screen>
        <div onClick={handleContentTap} style={{ position: 'relative', padding: '12px 22px 0', color: T.text, zIndex: 1 }}>
          <Greeting name={displayName} />

          {!isPreg && <WeekStrip go={go} cycle={cycle} logs={logs} />}

          {/* Cover — Pregnancy variant */}
          {isPreg && (
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.5, fontWeight: 600, color: trimColor, marginBottom: 6 }}>
                Week {preg.week} · {preg.trimester?.name}
              </div>
              <div className="ambient-breath" style={{ fontFamily: T.serif, fontSize: 150, fontWeight: 300, color: trimColor, lineHeight: 1, letterSpacing: -7, marginTop: 12, transition: 'color 0.6s ease-out' }}>
                {animatedDay || '—'}
              </div>
              <div style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 400, fontStyle: 'italic', letterSpacing: -0.6, marginTop: 6, lineHeight: 1.05 }}>
                {preg.daysToDue > 0
                  ? `${preg.daysToDue} days to go.`
                  : preg.daysToDue === 0
                    ? 'Today is your due date.'
                    : `${Math.abs(preg.daysToDue)} days past your due date.`}
              </div>
              {preg.content && (
                <div style={{ marginTop: 18, padding: 16, background: T.card, border: `1px solid ${T.hair}`, borderLeft: `3px solid ${trimColor}`, borderRadius: T.r }}>
                  <div style={{ fontFamily: T.serif, fontSize: 19, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.3, marginBottom: 12, letterSpacing: -0.2 }}>
                    About the size of {preg.content.size}.
                  </div>
                  <div style={{ fontFamily: T.serif, fontSize: 14.5, lineHeight: 1.6, color: T.text, marginBottom: 10 }}>
                    <strong style={{ fontWeight: 600 }}>Baby — </strong>{preg.content.baby}
                  </div>
                  <div style={{ fontFamily: T.serif, fontSize: 14.5, lineHeight: 1.6, color: T.text }}>
                    <strong style={{ fontWeight: 600 }}>You — </strong>{preg.content.body}
                  </div>
                  <SourceLine>{preg.content.source}</SourceLine>
                </div>
              )}
            </div>
          )}

          {/* Cover — Cycle variant */}
          {!isPreg && (
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.5, fontWeight: 600, color: phase?.color || T.muted, marginBottom: 6 }}>
              {onHormonalBC
                ? `Day ${cycleDay || '—'} · ${bcLabel.toLowerCase()}`
                : (phase ? `Day ${cycleDay || '—'} · ${phase.name.toLowerCase()}` : 'Day —')}
            </div>
            <div className="ambient-breath" style={{ fontFamily: T.serif, fontSize: 150, fontWeight: 300, color: phase?.color || T.accent, lineHeight: 1, letterSpacing: -7, marginTop: 12, transition: 'color 0.6s ease-out' }}>
              {cycleDay ? animatedDay : '—'}
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 400, fontStyle: 'italic', letterSpacing: -0.6, marginTop: 6, lineHeight: 1.05 }}>
              {phase?.name || 'Just getting started'}.
            </div>

            {contextLine && (
              <div style={{ fontFamily: T.serif, fontSize: 15, color: T.muted, marginTop: 8, letterSpacing: -0.1 }}>
                {contextLine}
              </div>
            )}

            {phase && !onHormonalBC && (
              <div style={{ fontFamily: T.serif, fontSize: 16, lineHeight: 1.55, marginTop: 12, color: T.text }}>
                {phase.bodyMood}
              </div>
            )}
            {phase && !onHormonalBC && (
              <div style={{ fontFamily: T.serif, fontSize: 15, fontStyle: 'italic', lineHeight: 1.55, marginTop: 8, color: phase.color }}>
                {phasePresence[phase.id]}
              </div>
            )}
            {phase && onHormonalBC && (
              <div style={{ fontFamily: T.serif, fontSize: 16, lineHeight: 1.55, marginTop: 14, color: T.text }}>
                Your hormones are steadied by your method — but patterns can still emerge. Keep noticing.
              </div>
            )}

            {phase && (
              <button onClick={() => goPhase(phase.id)}
                style={{ marginTop: 16, background: 'transparent', border: `1px solid ${T.text}`, padding: '10px 14px', cursor: 'pointer', fontFamily: T.sans, fontSize: 11, letterSpacing: 1.5, fontWeight: 600, color: T.text, borderRadius: T.r }}>
                More about this phase →
              </button>
            )}

            {/* Period-start nudge — only when relevant */}
            {showPeriodCTA && (
              <div style={{ marginTop: 18, padding: 16, background: T.accent + '12', border: `1px solid ${T.accent}40`, borderRadius: T.r }}>
                <div style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 500, marginBottom: 8, lineHeight: 1.35 }}>
                  {cycleDay > cycleLength
                    ? 'Wondering if your period has arrived.'
                    : 'Your period might be on its way.'}
                </div>
                <div style={{ fontFamily: T.sans, fontSize: 12.5, color: T.muted, lineHeight: 1.5, marginBottom: 14 }}>
                  Tap once if today is day one — it helps Luna learn your rhythm.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={logPeriodStart}
                    style={{ background: T.accent, color: '#fff', border: 'none', padding: '10px 14px', cursor: 'pointer', fontFamily: T.sans, fontSize: 11.5, fontWeight: 600, letterSpacing: 0.6, borderRadius: T.r }}>
                    Yes — today is day one
                  </button>
                  <button onClick={() => go('log')}
                    style={{ background: 'transparent', color: T.text, border: `1px solid ${T.hair}`, padding: '10px 14px', cursor: 'pointer', fontFamily: T.sans, fontSize: 11.5, fontWeight: 600, letterSpacing: 0.6, borderRadius: T.r }}>
                    Another day
                  </button>
                </div>
              </div>
            )}
          </div>
          )}

          {/* For today — horizontal scroll of curated phase-tuned cards */}
          {!isPreg && phase && (
            <div style={{ marginTop: 26 }}>
              <ForTodayRow phase={phase} go={go} goArticle={goArticle} />
            </div>
          )}

          {/* Always here — essentials surfaced from Settings */}
          {!isPreg && <AlwaysHere go={go} />}

          {/* How are you, today? */}
          <div style={{ borderTop: `1px solid ${T.hair}`, borderBottom: `1px solid ${T.hair}`, padding: '18px 0', marginTop: 24, marginBottom: 8 }}>
            <div style={{ fontFamily: T.serif, fontSize: 17, fontStyle: 'italic', marginBottom: 12, letterSpacing: -0.2 }}>
              How are you, today?
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {[['calm','Calm'],['energy','Bright'],['tired','Tired'],['cramps','Sore'],['low','Low']].map(([id, l]) => (
                <button key={l} onClick={() => handleQuickMood(l)}
                  style={{
                    border: 'none', cursor: 'pointer', background: quickMood === l ? T.accent + '22' : 'transparent',
                    outline: quickMood === l ? `1.5px solid ${T.accent}` : 'none',
                    padding: '10px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    minWidth: 56, borderRadius: T.r,
                    color: quickMood === l ? T.accent : T.text, fontFamily: T.sans,
                  }}>
                  <SymptomIcon id={id} size={26} />
                  <span style={{ fontSize: 11, fontWeight: 500 }}>{l}</span>
                </button>
              ))}
            </div>
            {moodInsight && (
              <div key={`${phase?.id}-${quickMood}`}
                style={{ marginTop: 14, padding: '12px 14px', background: 'rgba(200,78,46,0.06)', borderLeft: `3px solid ${T.accent}`, borderRadius: T.r, animation: 'fadeUp 0.35s ease-out both' }}>
                <div style={{ fontFamily: T.serif, fontSize: 14.5, lineHeight: 1.55, color: T.text }}>
                  {moodInsight.text}
                </div>
                {moodInsight.read && (
                  <button onClick={() => goArticle(moodInsight.read)}
                    style={{ marginTop: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: T.accent, fontSize: 12, fontWeight: 600, letterSpacing: 0.3, fontFamily: T.sans, padding: 0 }}>
                    Read more →
                  </button>
                )}
              </div>
            )}
            <button onClick={() => go('log')}
              style={{ marginTop: 14, background: 'transparent', border: 'none', cursor: 'pointer', color: T.accent, fontSize: 12, fontWeight: 600, letterSpacing: 0.4, fontFamily: T.sans, padding: 0 }}>
              Log more →
            </button>
          </div>

          <div style={{ height: 16 }} />
        </div>
      </Screen>
    </div>
  )
}
