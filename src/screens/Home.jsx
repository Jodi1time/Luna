import { useState, useEffect } from 'react'
import { T } from '../data/theme'
import { Screen, SourceLine } from '../components/shared'
import { SymptomIcon } from '../components/symptomIcons'
import { PHASES, ARTICLES, MOOD_INSIGHTS, getReflectionPrompt } from '../data/lunaData'
import { dailyThought } from '../lib/lunaChat'
import LunaChat from '../components/LunaChat'
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

// A "what's next" sentence under the cover. Now confidence-aware:
// adds a small reassurance / honesty tag based on how steady the
// user's cycles have been. The peace-of-mind sale is the line that
// follows: "You don't have to keep track."
function contextualLine({ phase, cycleDay, cycleLength, periodLength, variance, bbtShift }) {
  if (!phase || cycleDay == null) return null
  const conf = variance?.conf ?? 'low'

  if (phase.id === 'menstrual') {
    const total = periodLength || 5
    if (cycleDay > total) return { text: 'Your period is winding down.', sub: null }
    return { text: `Day ${cycleDay} of your period.`, sub: null }
  }

  if (phase.id === 'follicular') {
    // Prefer BBT-detected ovulation day if we have it (more accurate than
    // calendar math), otherwise fall back to midpoint.
    const ovDay = bbtShift?.shiftDayMedian ?? Math.round(cycleLength / 2)
    const days = ovDay - cycleDay
    const sub = bbtShift ? 'Anchored to your BBT shift.' : null
    if (days <= 1) return { text: 'Ovulation begins tomorrow.', sub }
    return { text: `${days} days until ovulation.`, sub }
  }

  if (phase.id === 'ovulation') {
    return { text: 'You\'re in your fertile window.', sub: bbtShift ? 'Confirmed by your BBT shift.' : null }
  }

  if (phase.id === 'luteal') {
    const days = cycleLength - cycleDay + 1
    if (days <= 0) {
      return { text: 'Your period is a little late.', sub: 'Stress, sleep, and travel can shift a cycle by a few days. Try not to read it as a verdict.' }
    }
    if (days <= 1) {
      return { text: 'Your period is expected tomorrow.', sub: null }
    }
    // Confidence-aware framing — the peace-of-mind line.
    if (conf === 'high') {
      return { text: `Your period is due in about ${days} days.`, sub: `${variance?.why} You don't have to keep track.` }
    }
    if (conf === 'medium') {
      return { text: `Your period is likely in ${days} days (give it a day or two).`, sub: variance?.why }
    }
    return { text: `Your period might arrive in ${days} days.`, sub: variance?.why }
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
function WeekStrip({ go, setActiveLogDate, cycle, logs }) {
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
        <button key={iso} onClick={() => {
          // Past or today → open Log for that day. Future → just go to Calendar.
          if (iso <= todayISO) { setActiveLogDate(iso); go('log') } else { go('calendar') }
        }}
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

// Birth-control reminder for methods that need a daily action (pills).
// Single tap to mark taken today. Disappears once marked.
function BCReminder({ bcMethod, wellness, markWellness }) {
  const dailyMethods = ['combined-pill', 'mini-pill']
  if (!dailyMethods.includes(bcMethod)) return null
  const todayISO = new Date().toISOString().slice(0, 10)
  const taken = wellness?.bcTakenToday === todayISO
  if (taken) return null
  return (
    <div className="glass-card" style={{ marginTop: 22, padding: '14px 16px', borderLeft: `3px solid ${T.accent}`, borderRadius: T.r, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: T.serif, fontSize: 15, fontWeight: 500, lineHeight: 1.3, marginBottom: 3 }}>
          Have you taken your pill today?
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 12.5, color: T.muted, lineHeight: 1.45, fontStyle: 'italic' }}>
          A small daily thing. Tap when it's done.
        </div>
      </div>
      <button onClick={() => markWellness('bcTakenToday', todayISO)}
        style={{ background: T.accent, color: '#fff', border: 'none', padding: '8px 14px', cursor: 'pointer', fontFamily: T.sans, fontSize: 12, fontWeight: 600, letterSpacing: 0.3, borderRadius: T.r, flexShrink: 0 }}>
        Done
      </button>
    </div>
  )
}

// Monthly recap — a quiet narrative summary on the 1st of the month
// (or for the first 3 days of the month), looking back at the prior
// 30 days of logs. "What we noticed."
function buildMonthlyRecap(logs) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const cutoff = new Date(today.getTime() - 30 * 86400000)
  const recentLogs = Object.entries(logs || {})
    .filter(([d]) => new Date(d + 'T00:00:00') >= cutoff)
    .map(([d, l]) => ({ date: d, ...l }))
  if (recentLogs.length < 5) return null
  const moods = recentLogs.filter((l) => l.mood)
  const moodCount = {}
  moods.forEach((l) => { moodCount[l.mood] = (moodCount[l.mood] || 0) + 1 })
  const topMood = Object.entries(moodCount).sort((a, b) => b[1] - a[1])[0]
  const symptomCount = {}
  recentLogs.forEach((l) => (l.symptoms || []).forEach((s) => {
    symptomCount[s] = (symptomCount[s] || 0) + 1
  }))
  const topSymptom = Object.entries(symptomCount).sort((a, b) => b[1] - a[1])[0]
  const periodDays = recentLogs.filter((l) => l.flow && l.flow !== 'Spotting').length
  const loggedDays = recentLogs.length
  // Compose a short narrative.
  const bits = []
  bits.push(`You showed up ${loggedDays} day${loggedDays === 1 ? '' : 's'} this month`)
  if (topMood && topMood[1] >= 3) {
    bits.push(`${topMood[0].toLowerCase()} came up most often`)
  }
  if (topSymptom && topSymptom[1] >= 3) {
    bits.push(`${topSymptom[0]} repeated`)
  }
  if (periodDays > 0) {
    bits.push(`${periodDays} period day${periodDays === 1 ? '' : 's'}`)
  }
  return { logged: loggedDays, sentence: bits.join(' · ') + '.' }
}

function MonthlyRecap({ recap }) {
  if (!recap) return null
  return (
    <div className="glass-card" style={{ marginTop: 22, padding: 16, borderLeft: `3px solid ${T.accent}`, borderRadius: T.r }}>
      <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.2, fontWeight: 600, color: T.muted, marginBottom: 6 }}>
        The last 30 days
      </div>
      <div style={{ fontFamily: T.serif, fontSize: 16, lineHeight: 1.5, color: T.text, fontStyle: 'italic' }}>
        {recap.sentence}
      </div>
    </div>
  )
}

// Hydration micro-tracker — eight quiet glass icons in a row. Tap to
// add a glass; tap again to remove. Resets daily. Lives on Home as a
// small habit, not a goal.
function Hydration({ wellness, markWellness }) {
  const todayISO = new Date().toISOString().slice(0, 10)
  const today = wellness?.hydration
  const glasses = (today && today.date === todayISO) ? (today.glasses || 0) : 0
  const set = (n) => markWellness('hydration', { date: todayISO, glasses: n })
  return (
    <div style={{ marginTop: 26 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontFamily: T.serif, fontSize: 16, fontStyle: 'italic', letterSpacing: -0.2 }}>
          A glass of water.
        </div>
        <div style={{ fontFamily: T.sans, fontSize: 11, color: T.muted, letterSpacing: 0.3 }}>
          {glasses} / 8 today
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
        {Array.from({ length: 8 }, (_, i) => {
          const filled = i < glasses
          return (
            <button key={i}
              onClick={() => set(filled ? i : i + 1)}
              aria-label={`${i + 1} glasses`}
              style={{
                flex: 1, aspectRatio: '1 / 1.4', maxWidth: 28,
                background: filled ? T.accent + '88' : 'transparent',
                border: `1.5px solid ${filled ? T.accent : 'rgba(26,19,16,0.18)'}`,
                borderRadius: '4px 4px 8px 8px',
                cursor: 'pointer', padding: 0,
                transition: 'background .2s, border-color .2s',
              }} />
          )
        })}
      </div>
    </div>
  )
}

// Compute the wellness habit nudges that should surface on Home —
// only when overdue, so they don't always clutter the screen.
function dueWellnessNudges(wellness) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const daysSince = (iso) => iso ? Math.floor((today - new Date(iso + 'T00:00:00')) / 86400000) : Infinity
  const nudges = []
  // BSE — monthly. Show only when it's been ≥30 days (or never).
  if (daysSince(wellness?.bse) >= 30) {
    nudges.push({
      key: 'bse',
      label: 'Check your breasts',
      sub: 'Once a month, in the shower. Looking for new lumps, dimpling, or changes.',
      cta: 'Done this month',
    })
  }
  // Pelvic floor — weekly. Show when ≥7 days since last.
  if (daysSince(wellness?.pelvicFloor) >= 7) {
    nudges.push({
      key: 'pelvicFloor',
      label: 'Pelvic floor, a moment',
      sub: 'Three sets of ten gentle squeezes. Two minutes, anywhere.',
      cta: 'Done this week',
    })
  }
  return nudges
}

// Always-here essentials at the bottom of Home — surfaces support
// features + any quiet wellness nudges that are due.
function AlwaysHere({ go, wellness, markWellness }) {
  const nudges = dueWellnessNudges(wellness)
  const todayISO = new Date().toISOString().slice(0, 10)
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
        {nudges.map((n) => (
          <div key={n.key} className="glass-card"
            style={{ padding: '14px 16px', borderLeft: `3px solid ${T.accent}`, borderRadius: T.r }}>
            <div style={{ fontFamily: T.serif, fontSize: 15.5, fontWeight: 500, lineHeight: 1.3, letterSpacing: -0.1, marginBottom: 4 }}>
              {n.label}
            </div>
            <div style={{ fontFamily: T.sans, fontSize: 11.5, color: T.muted, lineHeight: 1.5, marginBottom: 10 }}>
              {n.sub}
            </div>
            <button onClick={() => markWellness(n.key, todayISO)}
              style={{ background: 'transparent', border: `1px solid ${T.accent}`, color: T.accent, padding: '7px 12px', cursor: 'pointer', fontFamily: T.sans, fontSize: 11.5, fontWeight: 600, letterSpacing: 0.3, borderRadius: T.r }}>
              {n.cta}
            </button>
          </div>
        ))}
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
  const { go, goPhase, goArticle, saveLog, setLastPeriodStart, setActiveLogDate, markWellness, logs, birthControl, displayName, settings } = store
  const wellness = settings?.wellness || {}
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

  // Daily AI-generated reflection. Lives behind the Edge Function;
  // falls back to the local static prompts when the function isn't
  // deployed or the user is offline.
  const session = useLuna((s) => s.session)
  const [aiThought, setAiThought] = useState(null)
  const [chatOpen, setChatOpen] = useState(false)
  useEffect(() => {
    if (!phase || !session?.user?.id) return
    let cancelled = false
    dailyThought({
      userId: session.user.id,
      phaseId: phase.id,
      phaseName: phase.name,
      cycleDay: cycle.cycleDay,
      cycleLength: cycle.cycleLength,
    }).then((text) => { if (!cancelled && text) setAiThought(text) })
    return () => { cancelled = true }
  }, [phase?.id, cycle.cycleDay, cycle.cycleLength, session?.user?.id])
  // Use the AI thought if we have one, otherwise the local static prompt.
  const thoughtText = aiThought || (phase ? getReflectionPrompt(phase.id) : null)
  const logPeriodStart = () => {
    // Explicit user confirmation that today is day 1 — log the flow
    // AND directly anchor lastPeriodStart so detection is immediate
    // (the new 2+ flow days rule in detectPeriodStarts otherwise
    // delays auto-detection until day 2).
    const today = new Date()
    saveLog(today, { ...(todayLog || {}), flow: 'Medium' })
    setLastPeriodStart(today)
  }

  const contextLine = !isPreg ? contextualLine({ phase, cycleDay, cycleLength, periodLength, variance: cycle.variance, bbtShift: cycle.bbtShift }) : null
  const blobColor = isPreg ? trimColor : (phase?.color || T.accent)

  return (
    <div className="home-stage">
      {/* Blob layer — pinned to .home-stage, doesn't scroll. */}
      <BackgroundBlob color={blobColor} effect={effect} />
      {/* Content layer — scrolls past the stationary blob. */}
      <Screen>
        <div onClick={handleContentTap} style={{ position: 'relative', padding: '12px 22px 0', color: T.text, zIndex: 1 }}>
          <Greeting name={displayName} />

          {!isPreg && <WeekStrip go={go} setActiveLogDate={setActiveLogDate} cycle={cycle} logs={logs} />}

          {/* Cover — Pregnancy variant */}
          {isPreg && (
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.5, fontWeight: 600, color: trimColor ? `color-mix(in srgb, ${trimColor}, ${T.ink} 45%)` : T.muted, marginBottom: 6 }}>
                Week {preg.week} · {preg.trimester?.name}
              </div>
              <div className="ambient-breath" style={{ fontFamily: T.serif, fontSize: 150, fontWeight: 300, color: trimColor ? `color-mix(in srgb, ${trimColor}, ${T.ink} 15%)` : T.accent, lineHeight: 1, letterSpacing: -7, marginTop: 12, transition: 'color 0.6s ease-out' }}>
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
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.5, fontWeight: 600, color: phase ? `color-mix(in srgb, ${phase.color}, ${T.ink} 45%)` : T.muted, marginBottom: 6 }}>
              {onHormonalBC
                ? `Day ${cycleDay || '—'} · ${bcLabel.toLowerCase()}`
                : (phase ? `Day ${cycleDay || '—'} · ${phase.name.toLowerCase()}` : 'Day —')}
            </div>
            <div className="ambient-breath" style={{ fontFamily: T.serif, fontSize: 150, fontWeight: 300, color: phase ? `color-mix(in srgb, ${phase.color}, ${T.ink} 15%)` : T.accent, lineHeight: 1, letterSpacing: -7, marginTop: 12, transition: 'color 0.6s ease-out' }}>
              {cycleDay ? animatedDay : '—'}
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 400, fontStyle: 'italic', letterSpacing: -0.6, marginTop: 6, lineHeight: 1.05 }}>
              {phase?.name || 'Just getting started'}.
            </div>

            {contextLine && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontFamily: T.serif, fontSize: 15, color: T.muted, letterSpacing: -0.1 }}>
                  {contextLine.text}
                </div>
                {contextLine.sub && (
                  <div style={{ fontFamily: T.serif, fontSize: 13.5, color: T.muted, fontStyle: 'italic', marginTop: 4, lineHeight: 1.5, opacity: 0.85 }}>
                    {contextLine.sub}
                  </div>
                )}
              </div>
            )}

            {phase && !onHormonalBC && (
              <div style={{ fontFamily: T.serif, fontSize: 16, lineHeight: 1.55, marginTop: 12, color: T.text }}>
                {phase.bodyMood}
              </div>
            )}
            {phase && !onHormonalBC && (
              <div style={{ fontFamily: T.serif, fontSize: 15, fontStyle: 'italic', lineHeight: 1.55, marginTop: 8, color: `color-mix(in srgb, ${phase.color}, ${T.ink} 45%)` }}>
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

          {/* A small reflection — phase-aware, changes day to day, soft.
              Tap to open a brief conversation with Luna. */}
          {!isPreg && phase && thoughtText && (
            <button onClick={() => setChatOpen(true)}
              style={{ marginTop: 26, padding: '14px 16px', background: 'rgba(200,78,46,0.05)', borderLeft: `2px solid ${phase.color}`, borderRadius: T.r, textAlign: 'left', border: 'none', borderLeftWidth: 2, borderLeftStyle: 'solid', borderLeftColor: phase.color, cursor: 'pointer', display: 'block', width: '100%', fontFamily: 'inherit', color: 'inherit' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.2, fontWeight: 600, color: T.muted }}>
                  A thought for today
                </div>
                <div style={{ fontFamily: T.sans, fontSize: 10, color: T.accent, fontWeight: 600, letterSpacing: 0.3 }}>
                  Talk it through →
                </div>
              </div>
              <div style={{ fontFamily: T.serif, fontSize: 17, fontStyle: 'italic', lineHeight: 1.45, color: T.text, letterSpacing: -0.2 }}>
                {thoughtText}
              </div>
            </button>
          )}

          {/* Chat overlay — opens when the thought is tapped */}
          {phase && thoughtText && (
            <LunaChat
              open={chatOpen}
              onClose={() => setChatOpen(false)}
              opener={thoughtText}
              context={{
                phaseId: phase.id,
                phaseName: phase.name,
                cycleDay: cycle.cycleDay,
                cycleLength: cycle.cycleLength,
              }}
            />
          )}

          {/* For today — horizontal scroll of curated phase-tuned cards */}
          {!isPreg && phase && (
            <div style={{ marginTop: 26 }}>
              <ForTodayRow phase={phase} go={go} goArticle={goArticle} />
            </div>
          )}

          {/* Daily BC pill reminder, when applicable */}
          {!isPreg && <BCReminder bcMethod={birthControl?.method} wellness={wellness} markWellness={markWellness} />}

          {/* Hydration micro-tracker — daily small habit */}
          {!isPreg && <Hydration wellness={wellness} markWellness={markWellness} />}

          {/* Monthly recap — quiet narrative summary of the last 30 days */}
          {!isPreg && <MonthlyRecap recap={buildMonthlyRecap(logs)} />}

          {/* Always here — essentials + due wellness nudges */}
          {!isPreg && <AlwaysHere go={go} wellness={wellness} markWellness={markWellness} />}

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
