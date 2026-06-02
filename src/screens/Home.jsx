import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { T } from '../data/theme'
import { Screen, SourceLine } from '../components/shared'
import { SymptomIcon } from '../components/symptomIcons'
import { PHASES, ARTICLES, MOOD_INSIGHTS, RED_FLAGS, getReflectionPrompt } from '../data/lunaData'
import { dailyThought } from '../lib/lunaChat'
import LunaChat from '../components/LunaChat'
import QuickNote from '../components/QuickNote'
import { PhaseFlourish } from '../components/phaseFlourishes'
import Celebration from '../components/Celebration'
import { useCycle, isOnHormonalBC } from '../hooks/useCycle'
import { useCountUp } from '../hooks/useCountUp'
import { resurfaceNote } from '../lib/noteResurface'
import StickyNote from '../components/StickyNote'
import JournalCard from '../components/JournalCard'
import Backdrop, { useBackdropKind } from '../components/Backdrop'
import Tutorial from '../components/Tutorial'
import { usePregnancy } from '../hooks/usePregnancy'
import { BC_LABELS } from '../data/birthControl'
import useLuna from '../store/useLuna'
import { sectionColors, sectionPaper } from '../data/sectionPalette'

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
    // Don't return a context line on menstrual days — the eyebrow
    // ("day X · your menstrual phase") and the giant centered number
    // already say "this is day X of your period". A separate line
    // is redundancy, not signal.
    return null
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
  // content scrolls past a fixed blob.
  //
  // The visible "moving" sense comes from the idle morph animation
  // (in CSS) — alive while still.
  //
  // An effect can override the ripple/bloom color via effect.color,
  // which lets mood-taps tint the feedback bloom in that mood's
  // emotional color without changing the resting blob.
  const effectColor = effect?.color || color
  // Backdrop reads the user's chosen kind from settings. For the
  // default 'blob' kind it renders the existing breathing-blob and
  // we layer ripple/bloom effects on top (mood-tap feedback). For
  // alternative atmospheres (moons, aurora, petals, constellation)
  // the effects don't apply — the new backdrop is just visual.
  return (
    <Backdrop accent={color}>
      {effect?.name === 'ripple' && (
        <div key={effect.id} className="blob-ripple" style={{ '--phase-color': effectColor }} />
      )}
      {effect?.name === 'bloom' && (
        <div key={effect.id} className="blob-bloom" style={{ '--phase-color': effectColor }} />
      )}
    </Backdrop>
  )
}

// Phase-aware tonal opener — the same time of day reads slightly
// different depending on where the user is in her cycle.
const PHASE_GREETING = {
  menstrual:  'Quiet',
  follicular: 'Bright',
  ovulation:  'Warm',
  luteal:     'Soft',
}

function Greeting({ name, phaseId }) {
  const hour = new Date().getHours()
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  const first = (name || '').split(' ')[0]
  const opener = phaseId && PHASE_GREETING[phaseId] ? PHASE_GREETING[phaseId] : 'Good'
  // Build the greeting as discrete segments so each can fade in with
  // its own delay. We use a non-breaking space ( ) for trailing
  // gaps — `display: inline-block` collapses trailing whitespace from
  // text content, which made the greeting render as e.g. "Quietevening"
  // instead of "Quiet evening". NBSP is non-collapsible.
  const NBSP = ' '
  const segments = first
    ? [`${opener}${NBSP}`, `${timeOfDay},${NBSP}`, { text: first, italic: false }, '.']
    : [`${opener}${NBSP}`, timeOfDay, '.']
  return (
    <div style={{ paddingTop: 2, marginBottom: 10 }}>
      <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 400, letterSpacing: -0.4, color: T.text, fontStyle: 'italic' }}>
        {segments.map((seg, i) => {
          const text = typeof seg === 'string' ? seg : seg.text
          const italic = typeof seg === 'string' ? true : seg.italic !== false
          return (
            <span key={i} className="word-in"
              style={{
                animationDelay: `${i * 110}ms`,
                fontStyle: italic ? 'italic' : 'normal',
              }}>
              {text}
            </span>
          )
        })}
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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 12 }}>
      {cells.map(({ iso, day, label, isToday, hasLogged, hasPredicted }) => (
        <button key={iso} onClick={() => {
          if (iso <= todayISO) { setActiveLogDate(iso); go('log') } else { go('calendar') }
        }}
          style={{ background: 'transparent', border: 'none', padding: 2, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, fontFamily: 'inherit', color: 'inherit' }}>
          <div style={{ fontFamily: T.mono, fontSize: 9, color: T.muted, letterSpacing: 1, fontWeight: 600 }}>{label}</div>
          <div style={{ position: 'relative', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isToday && (
              <div className="today-disc" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: T.accent, boxShadow: `0 6px 14px -6px ${T.accent}60` }} />
            )}
            <span style={{
              position: 'relative',
              fontFamily: T.serif,
              fontSize: 14.5,
              fontWeight: isToday ? 600 : 400,
              color: isToday ? '#fff' : T.text,
            }}>
              {day}
            </span>
          </div>
          <div style={{ height: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {hasLogged && (
              <div style={{ width: 4, height: 4, background: T.accent, borderRadius: '50%' }} />
            )}
            {hasPredicted && (
              <div style={{ width: 4, height: 4, border: `1px solid ${T.accent}`, borderRadius: '50%', background: 'transparent' }} />
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
    <div className="glass-card alive-card frost-card" style={{ marginTop: 22, padding: 18, borderLeft: `3px solid ${T.accent}`, borderRadius: 22, boxShadow: `0 14px 30px -20px ${T.accent}40`, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: T.serif, fontSize: 15, fontWeight: 500, lineHeight: 1.3, marginBottom: 3 }}>
          Have you taken your pill today?
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 12.5, color: T.muted, lineHeight: 1.45, fontStyle: 'italic' }}>
          A small daily thing. Tap when it's done.
        </div>
      </div>
      <button onClick={() => markWellness('bcTakenToday', todayISO)}
        style={{ background: T.accent, color: '#fff', border: 'none', padding: '9px 18px', cursor: 'pointer', fontFamily: T.sans, fontSize: 12, fontWeight: 600, letterSpacing: 0.3, borderRadius: 999, flexShrink: 0 }}>
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
    <div className="glass-card alive-card frost-card" style={{ marginTop: 22, padding: 18, borderLeft: `3px solid ${T.accent}`, borderRadius: 22, boxShadow: `0 14px 30px -20px ${T.accent}40` }}>
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
  const colors = sectionColors('care')
  return (
    <div className="alive-card frost-card" style={{
      marginTop: 22, padding: 18,
      background: sectionPaper('care'),
      border: `1px solid ${colors.accent}22`,
      borderLeft: `3px solid ${colors.accent}`,
      borderRadius: 22,
      boxShadow: `0 14px 30px -22px ${colors.accent}50`,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontFamily: T.serif, fontSize: 16, fontStyle: 'italic', letterSpacing: -0.2 }}>
          A glass of water.
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 10, color: colors.accent, letterSpacing: 0.4, fontWeight: 600 }}>
          {glasses} / 8
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
                flex: 1, aspectRatio: '1 / 1.4', maxWidth: 30,
                position: 'relative',
                background: filled ? 'transparent' : 'rgba(253,250,245,0.55)',
                border: `1.5px solid ${filled ? colors.accent : 'rgba(26,19,16,0.12)'}`,
                borderRadius: '10px 10px 16px 16px',
                cursor: 'pointer', padding: 0, overflow: 'hidden',
                transition: 'border-color .25s, background .25s',
              }}>
              {filled && (
                <span key={`fill-${i}-${glasses}`} className="glass-fill"
                  style={{ background: colors.accent + 'aa' }} aria-hidden="true" />
              )}
            </button>
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

// Horizontal scroll wheel of quick entries under the phase cover.
// Two "log/edit" actions first, then the navigation cards that used
// to live in AlwaysHere. "A note" used to be here too — removed,
// because the sticky note in the corner of Home now covers that
// gimmick and a dedicated card became redundant.
function QuickActions({ go, setActiveLogDate }) {
  const todayISO = new Date().toISOString().slice(0, 10)
  const openLogToday = () => { setActiveLogDate(todayISO); go('log') }
  // Each card carries its functional category. Category drives the
  // card's soft tint + icon accent via SECTION_PALETTE — so the row
  // reads as chromatic variety instead of seven cream cards in a line.
  const items = [
    { key: 'log', category: 'body', label: 'Log today', sub: 'Mood, flow, anything',
      icon: (<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h14M3 10h14M3 15h9"/></svg>),
      onTap: openLogToday },
    { key: 'insights', category: 'reflect', label: 'What we’ve noticed', sub: 'Your cycle wheel and patterns',
      icon: (<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="6.5" strokeDasharray="2 1.8"/><circle cx="10" cy="10" r="1.4" fill="currentColor" stroke="none"/></svg>),
      onTap: () => go('insights') },
    { key: 'period', category: 'urgent', label: 'Edit period', sub: 'When it really started',
      icon: (<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2a6 6 0 0 1 5 9.5C13.5 14 10 18 10 18s-3.5-4-5-6.5A6 6 0 0 1 10 2z"/><circle cx="10" cy="8" r="1.5" fill="currentColor" stroke="none"/></svg>),
      onTap: () => go('editPeriodStart') },
    { key: 'intimate', category: 'intimate', label: 'Your sexual life', sub: 'Desire, lubrication, pleasure',
      icon: (<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10 4c-3 2-4 4-4 6a4 4 0 0 0 8 0c0-2-1-4-4-6z"/><circle cx="10" cy="11" r="1" fill="currentColor" stroke="none"/></svg>),
      onTap: () => go('intimate') },
    { key: 'watch', category: 'read', label: 'When something feels off', sub: 'Spot the patterns',
      icon: (<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="5"/><path d="M13 13l4 4"/></svg>),
      onTap: () => go('watch') },
    { key: 'cheatsheet', category: 'care', label: 'For your next visit', sub: 'Talking points ready',
      icon: (<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="12" height="14" rx="1.5"/><path d="M7 7h6M7 10h6M7 13h4"/></svg>),
      onTap: () => go('cheatsheet') },
    { key: 'care', category: 'care', label: 'Care checklist', sub: 'Checkups, screenings',
      icon: (<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="14" height="14" rx="2"/><path d="M3 8h14M6 12l2 2 4-4"/></svg>),
      onTap: () => go('care') },
  ]
  // One-shot scroll teaser — on mount, the row glides forward to a
  // peak then springs back with a small overshoot in the opposite
  // direction before settling. The overshoot is the magic move:
  // the eye sees "scroll forward, ease back, tiny tug back to start"
  // — reads as a physical motion, not a programmed slide. Apple's
  // App Store hero rows do this. Honors prefers-reduced-motion.
  const scrollerRef = useRef(null)
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const start = performance.now()
    const duration = 1650
    const peak = 64
    // Spring-tail offsets: the curve goes 0 → peak → 0 → -8 → 0
    // The "tug" reads as the row catching itself, not a robot.
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      let x = 0
      if (t < 0.42) {
        // Phase 1 — forward glide, ease-out cubic
        const p = t / 0.42
        x = peak * (1 - Math.pow(1 - p, 3))
      } else if (t < 0.78) {
        // Phase 2 — settle back to 0 with subtle overshoot to -8
        const p = (t - 0.42) / 0.36
        const eased = 1 - Math.pow(1 - p, 2.5)
        x = peak + (-peak - 8) * eased  // peak → -8
      } else {
        // Phase 3 — spring back from -8 to 0
        const p = (t - 0.78) / 0.22
        const eased = Math.sin((p * Math.PI) / 2)
        x = -8 + 8 * eased  // -8 → 0
      }
      el.scrollLeft = Math.max(0, x)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    const startTimer = setTimeout(() => { raf = requestAnimationFrame(tick) }, 650)
    return () => { clearTimeout(startTimer); cancelAnimationFrame(raf) }
  }, [])
  return (
    <div ref={scrollerRef} className="h-scroller" style={{
      display: 'flex', gap: 10, overflowX: 'auto', overflowY: 'hidden',
      marginLeft: -22, marginRight: -22, padding: '6px 22px 8px',
      marginTop: 16,
    }}>
      {items.map((it, idx) => {
        const colors = sectionColors(it.category)
        return (
          <button key={it.key} onClick={it.onTap} className="stagger-card alive-card frost-card"
            style={{
              flex: '0 0 36%',
              maxWidth: 152,
              scrollSnapAlign: 'start',
              textAlign: 'left',
              borderRadius: 22,
              padding: '14px 14px 14px',
              cursor: 'pointer',
              color: T.text,
              fontFamily: 'inherit',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 8,
              background: sectionPaper(it.category),
              border: `1px solid ${colors.accent}22`,
              boxShadow: `0 1px 0 ${colors.accent}10, 0 14px 30px -22px ${colors.accent}50`,
              animationDelay: `${idx * 50}ms`,
            }}>
            <span style={{
              width: 30, height: 30, borderRadius: 999, display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center',
              background: colors.tint, color: colors.accent,
            }}>{it.icon}</span>
            <span style={{ fontFamily: T.serif, fontSize: 14, fontWeight: 500, lineHeight: 1.2, letterSpacing: -0.1, color: T.text }}>
              {it.label}
            </span>
            <span style={{ fontFamily: T.sans, fontSize: 10, color: T.muted, lineHeight: 1.35, letterSpacing: 0.1 }}>
              {it.sub}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// Rotating Health Watch self-check — one RED_FLAGS prompt per week,
// surfaced as a soft "worth noticing" card. Brings Health Watch up
// from Settings burial into the daily surface, without becoming spammy.
// Selection is deterministic per-week so the user sees the same question
// for seven days, then it changes.
function weeklyHealthCheck(date = new Date()) {
  if (!RED_FLAGS?.length) return null
  const start = new Date(date.getFullYear(), 0, 1)
  const week = Math.floor((date - start) / (1000 * 60 * 60 * 24 * 7))
  return RED_FLAGS[((week % RED_FLAGS.length) + RED_FLAGS.length) % RED_FLAGS.length]
}

// Smart helper card — reusable Home surface for any of the "what now"
// helpers. Only mounted when a relevant signal is in today's log.
function SmartHelperCard({ onTap, eyebrow, line, category = 'urgent' }) {
  // smart-arrival glows the border with a one-shot accent halo on mount.
  // Category drives the soft tint + accent — physical-acute helpers
  // (cramps, UTI) wear 'urgent' rose, emotional (heavy mood) wears
  // lavender, sleep wears moonlight purple, morning intention wears
  // lavender too. Tells the user at a glance what KIND of nudge this is.
  const colors = sectionColors(category)
  return (
    <button onClick={onTap} className="smart-arrival alive-card frost-card sheen-once"
      style={{
        position: 'relative',
        marginTop: 14, padding: 18,
        background: sectionPaper(category),
        border: `1px solid ${colors.accent}33`,
        borderLeft: `3px solid ${colors.accent}`,
        boxShadow: `0 1px 0 ${colors.accent}10, 0 14px 30px -20px ${colors.accent}50`,
        borderRadius: 22, textAlign: 'left', cursor: 'pointer', width: '100%',
        color: T.text, fontFamily: 'inherit', display: 'block',
        overflow: 'hidden',
      }}>
      <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.2, fontWeight: 600, color: colors.accent, marginBottom: 6 }}>
        {eyebrow}
      </div>
      <div style={{ fontFamily: T.serif, fontSize: 17, fontStyle: 'italic', lineHeight: 1.35, color: T.text, letterSpacing: -0.2 }}>
        {line}
      </div>
      <div style={{ fontFamily: T.sans, fontSize: 11, color: T.muted, marginTop: 6, letterSpacing: 0.2 }}>
        Open the helper →
      </div>
    </button>
  )
}

// From-the-archive card — surfaces a meaningful old note when one fits
// (anniversary today, same cycle day previously, same phase). Quiet
// editorial register, never instructive. Tap goes to that day's Log.
function FromYourPastSelfCard({ surfaced, go, setActiveLogDate }) {
  if (!surfaced) return null
  const open = () => { setActiveLogDate(surfaced.dateISO); go('log') }
  // Trim very long notes so the card stays a card.
  const text = surfaced.note.length > 220 ? surfaced.note.slice(0, 217) + '…' : surfaced.note
  return (
    <button onClick={open} className="glass-card alive-card frost-card sheen-once"
      style={{
        position: 'relative',
        marginTop: 22,
        padding: 18,
        borderLeft: `3px solid ${T.accent}`,
        borderRadius: 22,
        boxShadow: `0 14px 30px -20px ${T.accent}40`,
        textAlign: 'left',
        cursor: 'pointer',
        width: '100%',
        color: T.text,
        fontFamily: 'inherit',
        display: 'block',
        overflow: 'hidden',
      }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, fontWeight: 500, color: T.muted, letterSpacing: -0.1 }}>
          from your past self
        </div>
        <div style={{ fontFamily: T.sans, fontSize: 10, color: T.accent, fontWeight: 600, letterSpacing: 0.3 }}>
          Open the day →
        </div>
      </div>
      <div style={{ fontFamily: T.serif, fontSize: 15.5, fontStyle: 'italic', lineHeight: 1.5, color: T.text, letterSpacing: -0.1, marginBottom: 8 }}>
        "{text}"
      </div>
      <div style={{ fontFamily: T.serif, fontSize: 12, color: T.muted, fontStyle: 'italic' }}>
        — {surfaced.label}
      </div>
    </button>
  )
}

function WeeklyHealthCheckCard({ go }) {
  const item = weeklyHealthCheck()
  if (!item) return null
  return (
    <button onClick={() => go('watch')} className="glass-card alive-card frost-card"
      style={{
        marginTop: 22,
        padding: 18,
        borderLeft: `3px solid ${T.accent}`,
        borderRadius: 22,
        boxShadow: `0 14px 30px -20px ${T.accent}40`,
        textAlign: 'left',
        cursor: 'pointer',
        width: '100%',
        color: T.text,
        fontFamily: 'inherit',
        display: 'block',
      }}>
      <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.2, fontWeight: 600, color: T.muted, marginBottom: 6 }}>
        Worth noticing this week
      </div>
      <div style={{ fontFamily: T.serif, fontSize: 15.5, fontWeight: 500, lineHeight: 1.35, letterSpacing: -0.1, marginBottom: 6 }}>
        {item.q}?
      </div>
      <div style={{ fontFamily: T.sans, fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>
        If it sounds familiar, Luna can help you gather the words for a visit.
      </div>
    </button>
  )
}

// Always-here surfaces only the wellness nudges that are due
// (monthly breast self-exam, weekly pelvic floor). The navigation
// cards that used to live here (intimate / watch / cheatsheet / care)
// are now part of the QuickActions horizontal scroll under the cover,
// so this section is for body-care nudges only. Renders nothing when
// nothing is due.
function AlwaysHere({ wellness, markWellness }) {
  const nudges = dueWellnessNudges(wellness)
  const todayISO = new Date().toISOString().slice(0, 10)
  if (nudges.length === 0) return null
  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ fontFamily: T.serif, fontSize: 16, fontStyle: 'italic', marginBottom: 12, letterSpacing: -0.2 }}>
        Always here.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {nudges.map((n) => (
          <div key={n.key} className="glass-card alive-card frost-card"
            style={{ padding: 18, borderLeft: `3px solid ${T.accent}`, borderRadius: 22, boxShadow: `0 14px 30px -20px ${T.accent}40` }}>
            <div style={{ fontFamily: T.serif, fontSize: 15.5, fontWeight: 500, lineHeight: 1.3, letterSpacing: -0.1, marginBottom: 4 }}>
              {n.label}
            </div>
            <div style={{ fontFamily: T.sans, fontSize: 11.5, color: T.muted, lineHeight: 1.5, marginBottom: 10 }}>
              {n.sub}
            </div>
            <button onClick={() => markWellness(n.key, todayISO)}
              style={{ background: 'transparent', border: `1px solid ${T.accent}`, color: T.accent, padding: '8px 16px', cursor: 'pointer', fontFamily: T.sans, fontSize: 11.5, fontWeight: 600, letterSpacing: 0.3, borderRadius: 999 }}>
              {n.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// Three horizontally-scrollable cards: a nourish hint, a short read,
// a movement hint — all phase-tuned. Soft borders, no images, intentionally
// quiet so they texture the screen without dominating it.
function ForTodayRow({ phase, go, goArticle }) {
  // Same spring-overshoot teaser as QuickActions, slightly delayed
  // and with a smaller peak so the two scrollers feel related but
  // independent — not a synchronized robot.
  const scrollerRef = useRef(null)
  useEffect(() => {
    const el = scrollerRef.current
    if (!el || !phase) return
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const start = performance.now()
    const duration = 1500
    const peak = 52
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      let x = 0
      if (t < 0.42) {
        const p = t / 0.42
        x = peak * (1 - Math.pow(1 - p, 3))
      } else if (t < 0.78) {
        const p = (t - 0.42) / 0.36
        const eased = 1 - Math.pow(1 - p, 2.5)
        x = peak + (-peak - 6) * eased
      } else {
        const p = (t - 0.78) / 0.22
        const eased = Math.sin((p * Math.PI) / 2)
        x = -6 + 6 * eased
      }
      el.scrollLeft = Math.max(0, x)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    const startTimer = setTimeout(() => { raf = requestAnimationFrame(tick) }, 1300)
    return () => { clearTimeout(startTimer); cancelAnimationFrame(raf) }
  }, [phase?.id])
  if (!phase) return null
  const article = ARTICLES.find((a) => a.id === phaseArticle[phase.id]) || ARTICLES[0]
  const items = [
    { key: 'nourish', category: 'care', eyebrow: 'To nourish', title: phase.nutrition.headline, onTap: () => go('nourish') },
    { key: 'read',    category: 'read', eyebrow: `${article.read} read`, title: article.title, onTap: () => goArticle(article.id) },
    { key: 'move',    category: 'plan', eyebrow: 'To move', title: phase.exercise.headline, onTap: () => go('care') },
  ]
  return (
    <div>
      <div style={{ fontFamily: T.serif, fontSize: 16, fontStyle: 'italic', marginBottom: 10, letterSpacing: -0.2 }}>
        For today.
      </div>
      <div ref={scrollerRef} className="h-scroller" style={{
        display: 'flex', gap: 10, overflowX: 'auto', overflowY: 'hidden',
        marginLeft: -22, marginRight: -22, padding: '4px 22px 6px',
      }}>
        {items.map((it, idx) => {
          const c = sectionColors(it.category)
          return (
            <button key={it.key} onClick={it.onTap} className="stagger-card alive-card frost-card"
              style={{
                flex: '0 0 64%',
                maxWidth: 220,
                scrollSnapAlign: 'start',
                textAlign: 'left',
                background: sectionPaper(it.category),
                border: `1px solid ${c.accent}22`,
                borderLeft: `3px solid ${phase.color}`,
                boxShadow: `0 1px 0 ${c.accent}10, 0 14px 30px -22px ${c.accent}50`,
                borderRadius: 22,
                padding: '16px 16px 18px',
                cursor: 'pointer',
                color: T.text,
                fontFamily: 'inherit',
                animationDelay: `${idx * 80}ms`,
              }}>
              <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.5, fontWeight: 600, color: c.accent, marginBottom: 8 }}>
                {it.eyebrow}
              </div>
              <div style={{ fontFamily: T.serif, fontSize: 15.5, fontWeight: 500, lineHeight: 1.3, letterSpacing: -0.2 }}>
                {it.title}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function Home() {
  const store = useLuna()
  const { go, goPhase, goArticle, saveLog, setLastPeriodStart, setActiveLogDate, markWellness, logs, birthControl, displayName, settings, updateSetting, setActiveReflectPractice } = store
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

  // Blob tap effects — ripple/bloom only fire when the user's
  // chosen backdrop IS the blob. Other backdrops (moons, aurora,
  // petals, stars) are visual atmospheres; they don't react to taps.
  const backdropKind = useBackdropKind()
  const [effect, setEffect] = useState(null)
  useEffect(() => {
    if (!effect) return
    const t = setTimeout(() => setEffect(null), 1600)
    return () => clearTimeout(t)
  }, [effect])
  const triggerBlobEffect = (override = {}) => {
    if (backdropKind !== 'blob') return
    const options = ['ripple', 'bloom']
    const next = override.name || options[Math.floor(Math.random() * options.length)]
    setEffect({ id: Date.now(), name: next, color: override.color || null })
  }
  const handleContentTap = (e) => {
    if (e.target.closest('button, a, input, [role="button"]')) return
    triggerBlobEffect()
  }

  // Collapse-in-place scroll behaviour. The cover does NOT slide
  // off the top — it physically COMPRESSES where it sits, freeing
  // real layout space below so cards-below rise up to fill the gap.
  //
  // Unified fade-into-collapse aesthetic — both sections do the
  // SAME thing (opacity fade + maxHeight shrink), just staged:
  //   • bodyRef     (p 0.00 → 0.42): body fades + collapses first
  //   • headlineRef (p 0.32 → 0.80): headline fades + collapses
  //   • overlap     (p 0.32 → 0.42): both collapse simultaneously —
  //     the seam reads as a single continuous gesture, not two
  //     separate animations
  //
  // No scale transform — the previous "headline scales 1→0.5" read
  // as a slide-out, breaking the gentle fade-collapse feel. Now
  // every element disappears the same way: it grows transparent
  // while its layout box shrinks proportionally.
  //
  // Natural heights are measured in a layout effect so the maxHeight
  // shrinks reference the actual rendered heights of each section,
  // re-measured whenever the cover content changes.
  //
  // rAF-throttled, written direct to DOM — no re-render on scroll.
  const screenRef = useRef(null)
  const coverRef = useRef(null)
  const headlineRef = useRef(null)
  const bodyRef = useRef(null)
  const bodyNatH = useRef(9999)
  const headNatH = useRef(9999)
  useEffect(() => {
    const el = screenRef.current
    if (!el) return
    let rafId = null
    let lastY = 0
    const COLLAPSE_DISTANCE = 360
    const clamp = (v) => Math.min(1, Math.max(0, v))
    const update = () => {
      rafId = null
      const cover = coverRef.current
      if (!cover) return
      const p = clamp(lastY / COLLAPSE_DISTANCE)
      const bodyProg = clamp(p / 0.42)
      const headProg = clamp((p - 0.32) / 0.48)

      if (bodyRef.current) {
        bodyRef.current.style.opacity = String(1 - bodyProg)
        bodyRef.current.style.maxHeight = `${bodyNatH.current * (1 - bodyProg)}px`
      }
      if (headlineRef.current) {
        headlineRef.current.style.opacity = String(1 - headProg)
        headlineRef.current.style.maxHeight = `${headNatH.current * (1 - headProg)}px`
      }
      cover.style.pointerEvents = headProg > 0.92 ? 'none' : 'auto'
    }
    const onScroll = () => {
      lastY = el.scrollTop
      if (rafId) return
      rafId = requestAnimationFrame(update)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  const todayISO = new Date().toISOString().slice(0, 10)
  const todayLog = logs?.[todayISO]
  const hasFlowToday = todayLog?.flow && todayLog.flow !== 'Spotting'
  // Smart cramps surface: if today's log has cramps as a mood OR as a
  // symptom, surface a "Sit with me" card pointing to the Cramps Helper.
  // She doesn't have to dig for help when she already told us it hurts.
  const hasCrampsToday = todayLog?.mood === 'cramps' || (todayLog?.symptoms || []).includes('cramps')
  // Other smart helper surfaces — only show when she's already told us
  // something is happening. Quiet by default; act when relevant.
  const hasAnxietyToday = todayLog?.mood === 'low' || todayLog?.mood === 'frustrated'
  const hasInsomniaToday = todayLog?.sleep === 'Poor' || todayLog?.sleep === 'Restless' || (todayLog?.symptoms || []).includes('insomnia') || (todayLog?.symptoms || []).includes('sleep')
  const hasUTIToday = (todayLog?.symptoms || []).includes('uti')
  const isTTC = settings?.lifecycle === 'ttc'
  // Morning intention surface: visible before noon, only if she
  // hasn't already set today's intention via Reflect.
  const reflectHistory = settings?.reflectHistory || []
  const hour = new Date().getHours()
  const beforeNoon = hour < 12
  const afterSix = hour >= 18
  const todayIntention = reflectHistory.find((e) => e.kind === 'intention' && e.dateISO === todayISO)
  const hasMorningIntentionToday = Boolean(todayIntention)
  const showMorningIntention = !isPreg && beforeNoon && !hasMorningIntentionToday
  // Evening callback — fulfill the promise Luna made this morning.
  // After 6pm, if she set an intention today, surface a check-in.
  const showEveningIntention = !isPreg && afterSix && hasMorningIntentionToday
  const showPeriodCTA = !isPreg && !onHormonalBC && !hasFlowToday && cycleDay != null && cycleDay >= cycleLength - 3

  // Measure natural heights of the headline + body sections AFTER
  // each render that may have changed their contents. scrollHeight
  // returns the unconstrained content height even when maxHeight
  // is applied — perfect for our collapse math which multiplies
  // the natural height by a progress fraction. Wrapping in rAF lets
  // the layout settle (font load, dynamic content) before measuring.
  useLayoutEffect(() => {
    const raf = requestAnimationFrame(() => {
      if (bodyRef.current) bodyNatH.current = bodyRef.current.scrollHeight
      if (headlineRef.current) headNatH.current = headlineRef.current.scrollHeight
    })
    return () => cancelAnimationFrame(raf)
  }, [phase?.id, cycleDay, showPeriodCTA, onHormonalBC, isPreg])

  // Mood → emotional color. Used to tint the blob ripple when she
  // taps a mood — Luna's quiet way of saying "I received that, in
  // your color." Soft Luna palette tones; never neon.
  const MOOD_COLORS = {
    Calm:   '#9D6F8C', // soft luteal purple — settled, internal
    Bright: '#E8B765', // ovulation gold — energy, outward
    Tired:  '#7D7269', // muted neutral — quiet
    Sore:   '#C84E2E', // accent terra cotta — pain
    Low:    '#5A4A72', // deep purple — heaviness
  }

  const handleQuickMood = (m) => {
    // Tap an already-selected mood to clear it — the same gesture that
    // sets a mood also takes it back, so a mistap is one tap away from
    // undone. Saves `null` so the day's mood field actually clears.
    const next = quickMood === m ? null : m
    setQuickMood(next)
    saveLog(new Date(), { mood: next })
    if (next) {
      // Light blob bloom in the mood's color — acknowledges the tap
      // visually without saying anything.
      triggerBlobEffect({ name: 'bloom', color: MOOD_COLORS[next] || null })
    }
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
  // Opener is set when chat is launched from the daily thought (seeded
  // first message); null when launched from "Talk something through"
  // so the user starts a fresh, unprompted conversation.
  const [chatOpener, setChatOpener] = useState(null)
  // Bottom-sheet for the "A note" quick action — focused textarea
  // that saves into today's log without opening the full Log form.
  const [quickNoteOpen, setQuickNoteOpen] = useState(false)
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
    // Soft milestone moment + bloom sound.
    useLuna.getState().setCelebration('day-one')
    // Lazy-load sounds to avoid pulling AudioContext into the eager path.
    import('../lib/sounds').then(({ bloomSound }) => bloomSound(Boolean(settings?.sounds)))
  }
  const celebration = useLuna((s) => s.celebration)
  const setCelebration = useLuna((s) => s.setCelebration)
  useEffect(() => {
    if (!celebration) return
    const t = setTimeout(() => setCelebration(null), 3200)
    return () => clearTimeout(t)
  }, [celebration, setCelebration])

  const contextLine = !isPreg ? contextualLine({ phase, cycleDay, cycleLength, periodLength, variance: cycle.variance, bbtShift: cycle.bbtShift }) : null
  const blobColor = isPreg ? trimColor : (phase?.color || T.accent)

  // Resurface a meaningful old note when one fits today.
  const surfacedNote = !isPreg
    ? resurfaceNote({ logs, cycle, todayPhaseId: phase?.id, todayISO })
    : null

  // Sticky note content — what the user wants to remember, made
  // visible. Priority: today's own note > resurfaced past note >
  // empty-state CTA ("Leave a note for your future self"). Always
  // present unless the user has disabled it in Settings, so Luna's
  // sticky-note gimmick is reliably on the wall.
  const stickyNoteEnabled = settings?.stickyNoteEnabled !== false
  const todayNoteText = todayLog?.note ? String(todayLog.note).trim() : null
  const todayMD = new Date(); todayMD.setHours(0,0,0,0)
  const stickyNote = (() => {
    if (isPreg || !stickyNoteEnabled) return null
    const cap = (s) => s.length > 110 ? s.slice(0, 107) + '…' : s
    if (todayNoteText && todayNoteText.length > 0) {
      return {
        body: cap(todayNoteText),
        eyebrow: 'For me, today',
        signature: 'me, today',
        seed: todayMD.getDate(),
        isEmpty: false,
        onTap: () => setQuickNoteOpen(true),
      }
    }
    if (surfacedNote) {
      return {
        body: cap(surfacedNote.note),
        eyebrow: surfacedNote.kind === 'anniversary' ? 'A year ago today' :
                 surfacedNote.kind === 'same-cycle-day' ? 'A previous cycle' :
                 'From past me',
        signature: surfacedNote.label,
        seed: new Date(surfacedNote.dateISO + 'T12:00:00').getDate(),
        isEmpty: false,
        onTap: () => setQuickNoteOpen(true),
      }
    }
    // Empty state — sticky note still shows, as a soft invitation.
    return {
      body: 'Leave a note for your future self.',
      eyebrow: 'A blank page',
      signature: null,
      seed: todayMD.getDate(),
      isEmpty: true,
      onTap: () => setQuickNoteOpen(true),
    }
  })()

  return (
    <div className="home-stage">
      {/* Blob layer — pinned to .home-stage, doesn't scroll. */}
      <BackgroundBlob color={blobColor} effect={effect} />
      {/* Content layer — scrolls past the stationary blob. */}
      <Screen ref={screenRef}>
        <div onClick={handleContentTap} style={{ position: 'relative', padding: '12px 22px 0', color: T.text, zIndex: 1 }}>
          <Greeting name={displayName} phaseId={phase?.id} />

          {!isPreg && <WeekStrip go={go} setActiveLogDate={setActiveLogDate} cycle={cycle} logs={logs} />}

          {/* Sticky note — tucked into the top-right corner just under
              the Sunday cell of the week strip. Always present (unless
              the user has disabled it in Settings), so the gimmick is
              reliable. Today's note > resurfaced past note > soft empty
              CTA with attention arrows. Tap → opens QuickNote. */}
          {stickyNote && (
            <StickyNote
              body={stickyNote.body}
              eyebrow={stickyNote.eyebrow}
              signature={stickyNote.signature}
              tapeColor={phase?.color || T.accent}
              seed={stickyNote.seed}
              isEmpty={stickyNote.isEmpty}
              onTap={stickyNote.onTap}
            />
          )}

          {/* Cover — Pregnancy variant. Centered like the mockup —
              week number lives in the middle of the screen, not the left. */}
          {isPreg && (
            <div style={{ marginBottom: 4, textAlign: 'center', padding: '8px 0 4px' }}>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, letterSpacing: 0.4, fontWeight: 500, color: trimColor ? `color-mix(in srgb, ${trimColor}, ${T.ink} 35%)` : T.muted, marginBottom: 10, opacity: 0.9 }}>
                week {preg.week} · {preg.trimester?.name?.toLowerCase()}
              </div>
              <div className="ambient-breath" style={{ fontFamily: T.serif, fontSize: 150, fontWeight: 300, fontStyle: 'italic', color: trimColor ? `color-mix(in srgb, ${trimColor}, ${T.ink} 15%)` : T.accent, lineHeight: 0.92, letterSpacing: -7, transition: 'color 0.6s ease-out' }}>
                {animatedDay || '—'}
              </div>
              <div style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 400, fontStyle: 'italic', letterSpacing: -0.5, marginTop: 14, lineHeight: 1.1, color: T.text }}>
                {preg.daysToDue > 0
                  ? `${preg.daysToDue} days to go.`
                  : preg.daysToDue === 0
                    ? 'Today is your due date.'
                    : `${Math.abs(preg.daysToDue)} days past your due date.`}
              </div>
              {preg.content && (
                <div className="alive-card frost-card" style={{ marginTop: 22, padding: 20, background: T.card, border: `1px solid ${T.hair}`, borderLeft: `3px solid ${trimColor}`, borderRadius: 22, boxShadow: `0 14px 30px -20px ${trimColor}40`, textAlign: 'left' }}>
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

          {/* Cover — Cycle variant. The cover is the magazine moment:
              eyebrow → flourish → giant italic day number → phase name
              → ONE narrative line (mood) → ONE italic presence line.
              The WHOLE cover is the affordance — tap anywhere to open
              the phase detail (Apple-style: the surface IS the button,
              no explicit "more →" CTA renting a row). Streamlined to
              get QuickActions visible above the fold. */}
          {!isPreg && (
          <div ref={coverRef}
            role={phase ? 'button' : undefined}
            tabIndex={phase ? 0 : undefined}
            onClick={(e) => {
              // Don't navigate when the user is tapping a button INSIDE the
              // cover (period CTA). Only the outer cover surface itself
              // navigates to phase detail.
              if (e.target.closest('button')) return
              if (phase) goPhase(phase.id)
            }}
            style={{
              marginBottom: 4,
              textAlign: 'center',
              cursor: phase ? 'pointer' : 'default',
            }}>
            <div ref={headlineRef} style={{
              willChange: 'opacity, max-height',
              overflow: 'hidden',
              padding: '4px 0 0',
            }}>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, letterSpacing: 0.4, fontWeight: 500, color: phase ? `color-mix(in srgb, ${phase.color}, ${T.ink} 35%)` : T.muted, marginBottom: 4, opacity: 0.9 }}>
                {onHormonalBC
                  ? `day ${cycleDay || '—'} · ${bcLabel.toLowerCase()}`
                  : (phase ? `day ${cycleDay || '—'} · your ${phase.name.toLowerCase()} phase` : 'day —')}
              </div>
              {phase && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 2, color: phase.color, opacity: 0.7 }} aria-hidden="true">
                  <PhaseFlourish phaseId={phase.id} size={22} />
                </div>
              )}
              <div key={cycleDay /* re-key on day change so the bloom replays on rollover */}
                className={`ambient-breath day-bloom${cycleDay && cycleLength - cycleDay <= 3 && cycleDay <= cycleLength ? ' countdown' : ''}`}
                style={{ fontFamily: T.serif, fontSize: 116, fontWeight: 300, fontStyle: 'italic', color: phase ? `color-mix(in srgb, ${phase.color}, ${T.ink} 15%)` : T.accent, lineHeight: 0.9, letterSpacing: -5.5, transition: 'color 0.6s ease-out' }}>
                {cycleDay ? animatedDay : '—'}
              </div>
              <div style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 400, fontStyle: 'italic', letterSpacing: -0.5, lineHeight: 1.1, marginTop: 4, color: T.text }}>
                {phase?.name || 'Just getting started'}.
              </div>
            </div>

            <div ref={bodyRef} style={{
              willChange: 'opacity, max-height',
              overflow: 'hidden',
            }}>
              {contextLine && (
                <div style={{ marginTop: 10, maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
                  <div style={{ fontFamily: T.serif, fontSize: 14.5, color: T.muted, letterSpacing: -0.1 }}>
                    {contextLine.text}
                  </div>
                  {contextLine.sub && (
                    <div style={{ fontFamily: T.serif, fontSize: 13, color: T.muted, fontStyle: 'italic', marginTop: 4, lineHeight: 1.5, opacity: 0.85 }}>
                      {contextLine.sub}
                    </div>
                  )}
                </div>
              )}

              {phase && !onHormonalBC && (
                <div style={{ fontFamily: T.serif, fontSize: 15, fontStyle: 'italic', lineHeight: 1.5, marginTop: 8, color: `color-mix(in srgb, ${phase.color}, ${T.ink} 45%)`, maxWidth: 300, marginLeft: 'auto', marginRight: 'auto', letterSpacing: -0.1 }}>
                  {phasePresence[phase.id]}
                </div>
              )}
              {phase && onHormonalBC && (
                <div style={{ fontFamily: T.serif, fontSize: 15, fontStyle: 'italic', lineHeight: 1.5, marginTop: 8, color: T.muted, maxWidth: 300, marginLeft: 'auto', marginRight: 'auto' }}>
                  Your method steadies your hormones — patterns still emerge.
                </div>
              )}
              {/* Affordance hint — tells the user the whole cover is
                  tappable. Soft italic serif so it reads as a quiet
                  invitation, not an instruction. Uses the phase color
                  so it ties to the rest of the cover. */}
              {phase && (
                <div className="cover-hint" style={{ fontFamily: T.sans, fontSize: 10, marginTop: 12, color: phase ? `color-mix(in srgb, ${phase.color}, ${T.ink} 30%)` : T.muted, letterSpacing: 1.4, fontWeight: 600, opacity: 0.7, textTransform: 'lowercase' }}>
                  tap to learn more
                </div>
              )}

              {/* Period-start nudge — only when relevant */}
              {showPeriodCTA && (
                <div className="alive-card frost-card" style={{ marginTop: 22, padding: 20, background: T.accent + '12', border: `1px solid ${T.accent}40`, borderRadius: 22, boxShadow: `0 14px 30px -20px ${T.accent}50`, textAlign: 'left' }}>
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
                      style={{ background: T.accent, color: '#fff', border: 'none', padding: '11px 18px', cursor: 'pointer', fontFamily: T.sans, fontSize: 11.5, fontWeight: 600, letterSpacing: 0.6, borderRadius: 999 }}>
                      Yes — today is day one
                    </button>
                    <button onClick={() => go('log')}
                      style={{ background: 'transparent', color: T.text, border: `1px solid ${T.hair}`, padding: '11px 18px', cursor: 'pointer', fontFamily: T.sans, fontSize: 11.5, fontWeight: 600, letterSpacing: 0.6, borderRadius: 999 }}>
                      Another day
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          )}

          {/* Quick actions — a horizontal scroll wheel of the most
              common entries (Log today, Edit period) plus the four
              navigation cards that used to live in AlwaysHere
              (intimate / watch / cheatsheet / care). "A note" used to
              be here but is now covered by the sticky note in the
              corner, so removed to avoid redundancy. */}
          {!isPreg && (
            <QuickActions
              go={go}
              setActiveLogDate={setActiveLogDate}
            />
          )}

          {/* Smart helper surfaces — only appear when she has told us
              something is happening today. Each gets its own eyebrow
              so the page reads as conversation, not a status bar.
              Single-surface rule: only the highest-priority active
              helper renders, so the user sees one quiet "this matters
              today" card instead of a stack. Priority is harshest-
              physical first (cramps, UTI) → emotional (heavy, sleep)
              → reflective (morning intention) → mode-context (TTC). */}
          {(() => {
            if (isPreg) return null
            if (hasCrampsToday) return (
              <SmartHelperCard
                category="urgent"
                onTap={() => go('cramps')}
                eyebrow="Cramping today"
                line="Sit with it — Luna has a few small things that help."
              />
            )
            if (hasUTIToday) return (
              <SmartHelperCard
                category="urgent"
                onTap={() => go('utiHelper')}
                eyebrow="UTI signs"
                line="Catch it early — here's the playbook for tonight."
              />
            )
            if (hasAnxietyToday) return (
              <SmartHelperCard
                category="reflect"
                onTap={() => go('heavy')}
                eyebrow="Heavy today"
                line="A few ways in — body, words, breath, or someone to talk to."
              />
            )
            if (hasInsomniaToday) return (
              <SmartHelperCard
                category="plan"
                onTap={() => go('insomnia')}
                eyebrow="Sleep was rough"
                line="Tonight, Luna will help you wind down sooner."
              />
            )
            if (showMorningIntention) return (
              <SmartHelperCard
                category="reflect"
                onTap={() => { setActiveReflectPractice('intention'); go('reflect') }}
                eyebrow="This morning"
                line="One sentence about what today is really about?"
              />
            )
            if (isTTC) return (
              <SmartHelperCard
                category="plan"
                onTap={() => go('ttc')}
                eyebrow="Trying to conceive"
                line="Your fertile-window read for today."
              />
            )
            return null
          })()}
          {showEveningIntention && todayIntention && (
            <button onClick={() => go('reflect')} className="glass-card alive-card frost-card"
              style={{ marginTop: 14, padding: 18, borderLeft: `3px solid ${T.accent}`, borderRadius: 22, boxShadow: `0 14px 30px -20px ${T.accent}40`, textAlign: 'left', cursor: 'pointer', width: '100%', color: T.text, fontFamily: 'inherit', display: 'block' }}>
              <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.2, fontWeight: 600, color: T.accent, marginBottom: 6 }}>
                You set this morning
              </div>
              <div style={{ fontFamily: T.serif, fontSize: 16, fontStyle: 'italic', lineHeight: 1.45, color: T.text, letterSpacing: -0.1, marginBottom: 6 }}>
                "{Array.isArray(todayIntention.content) ? todayIntention.content[0] : todayIntention.content}"
              </div>
              <div style={{ fontFamily: T.sans, fontSize: 11, color: T.muted, letterSpacing: 0.2 }}>
                How did the day land against it? →
              </div>
            </button>
          )}

          {/* The diary — separate from log.note (the sticky note is
              for a quick line to your future self; the diary is for
              freeform multi-entry writing). Tap opens the full
              journal where the user can write new pages, read past
              ones, and customise the paper / decorations. */}
          {!isPreg && (
            <JournalCard
              entries={settings?.journalEntries}
              journalTheme={settings?.journalTheme}
              phaseColor={phase?.color}
              onTap={() => go('journal')}
            />
          )}

          {/* "For your mind and heart" — soft inline entry to Reflect.
              Suppressed when the morning intention card is showing. */}
          {!isPreg && phase && !showMorningIntention && (
            <button onClick={() => go('reflect')} className="glass-card alive-card frost-card"
              style={{
                marginTop: 26, padding: 20,
                borderLeft: `3px solid ${phase.color}`, borderRadius: 22,
                boxShadow: `0 14px 30px -20px ${phase.color}50`,
                textAlign: 'left', cursor: 'pointer', width: '100%',
                color: T.text, fontFamily: 'inherit', display: 'block',
              }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, fontWeight: 500, color: `color-mix(in srgb, ${phase.color}, ${T.ink} 35%)`, letterSpacing: -0.1 }}>
                  for your mind and heart
                </div>
                <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, color: phase.color, fontWeight: 500 }}>
                  reflect →
                </div>
              </div>
              <div style={{ fontFamily: T.serif, fontSize: 16, fontStyle: 'italic', lineHeight: 1.45, color: T.text, letterSpacing: -0.1 }}>
                Write freely, sit with a practice, or talk it through with Luna.
              </div>
            </button>
          )}

          {/* Morning thought — the one moment of the day. Promoted to
              be the visual HERO of the reflective area. Large italic
              serif quote, soft phase-tinted glass, opening serif
              quotation mark as the visual signature. Tap → open a
              conversation with Luna using this thought as the
              opener. This is Luna's daily ritual. */}
          {!isPreg && phase && thoughtText && (
            <button onClick={() => { setChatOpener(thoughtText); setChatOpen(true) }}
              className="alive-card frost-card sheen-once"
              style={{
                position: 'relative',
                marginTop: 14, padding: '24px 22px 22px',
                background: `linear-gradient(160deg, ${phase.color}14, ${phase.color}06 60%, rgba(253,250,245,0.5))`,
                border: `1px solid ${phase.color}28`,
                borderRadius: 26,
                boxShadow: `0 18px 40px -22px ${phase.color}60`,
                textAlign: 'left', cursor: 'pointer', display: 'block', width: '100%',
                fontFamily: 'inherit', color: 'inherit',
                overflow: 'hidden',
              }}>
              {/* Opening serif quotation mark — large, soft, low alpha */}
              <div aria-hidden="true" style={{
                position: 'absolute', top: -10, left: 14,
                fontFamily: T.serif, fontSize: 90, lineHeight: 1, fontStyle: 'italic',
                color: phase.color, opacity: 0.18, fontWeight: 400,
                userSelect: 'none', pointerEvents: 'none',
              }}>"</div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12, position: 'relative' }}>
                <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, fontWeight: 500, color: `color-mix(in srgb, ${phase.color}, ${T.ink} 30%)`, letterSpacing: -0.1 }}>
                  a thought, today
                </div>
                <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, color: phase.color, fontWeight: 500 }}>
                  talk it through →
                </div>
              </div>
              <div style={{ fontFamily: T.serif, fontSize: 19, fontStyle: 'italic', lineHeight: 1.5, color: T.text, letterSpacing: -0.3, position: 'relative' }}>
                {thoughtText}
              </div>
            </button>
          )}

          {/* Soft milestone moment — period day one, etc. Auto-clears
              after ~3s via the useEffect above. */}
          <Celebration kind={celebration} onClose={() => setCelebration(null)} />

          {/* First-run tour — 4 cards explaining the cover, the diary,
              and the customisation. Shows once; persisted via
              settings.tutorialSeen. */}
          <Tutorial
            open={settings?.tutorialSeen === false}
            onClose={() => updateSetting('tutorialSeen', true)}
            accent={phase?.color}
          />

          {/* Quick-note bottom-sheet — opens from the "A note" quick
              action, focuses straight to a textarea, saves to today's
              log and closes. Distinct from the full Log form. */}
          {!isPreg && (
            <QuickNote
              open={quickNoteOpen}
              onClose={() => setQuickNoteOpen(false)}
            />
          )}

          {/* Chat overlay — mounted unconditionally so it can open from
              any button regardless of whether a phase has been computed.
              Phase context is passed when available, omitted otherwise. */}
          <LunaChat
            open={chatOpen}
            onClose={() => { setChatOpen(false); setChatOpener(null) }}
            opener={chatOpener}
            context={phase ? {
              phaseId: phase.id,
              phaseName: phase.name,
              cycleDay: cycle.cycleDay,
              cycleLength: cycle.cycleLength,
            } : {}}
          />

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


          {/* A rotating Health Watch prompt — one per week, doula-toned,
              promotes our existing screener out of Settings burial. */}
          {!isPreg && <WeeklyHealthCheckCard go={go} />}

          {/* Always here — wellness nudges only (BSE / pelvic floor when
              due). Navigation cards now live in the QuickActions scroll. */}
          {!isPreg && (
            <AlwaysHere
              wellness={wellness}
              markWellness={markWellness}
            />
          )}

          {/* How are you, today? — Soft frosted pill row. Each mood is
              a tinted circle (icon) above a tiny label. No top/bottom
              rules (newspaper register). The selected pill blooms with
              the mood's color; others stay quiet glass. */}
          <div style={{ padding: '20px 0 4px', marginTop: 16, marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontFamily: T.serif, fontSize: 17, fontStyle: 'italic', letterSpacing: -0.2 }}>
                How are you, today?
              </div>
              <button onClick={() => go('log')}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.accent, fontSize: 11, fontWeight: 600, letterSpacing: 0.4, fontFamily: T.sans, padding: 0 }}>
                Log more →
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              {[
                ['calm','Calm','#9D6F8C'],
                ['energy','Bright','#E8B765'],
                ['tired','Tired','#7D7269'],
                ['cramps','Sore','#C84E2E'],
                ['low','Low','#5A4A72'],
              ].map(([id, l, color]) => {
                const isSelected = quickMood === l
                return (
                  <button key={`${l}-${isSelected ? 'on' : 'off'}`} onClick={() => handleQuickMood(l)}
                    className={`alive-card frost-card${isSelected ? ' tap-bloom' : ''}`}
                    style={{
                      flex: 1,
                      border: `1px solid ${isSelected ? color + '55' : 'rgba(26,19,16,0.06)'}`,
                      cursor: 'pointer',
                      background: isSelected ? `${color}1f` : 'rgba(253,250,245,0.55)',
                      padding: '14px 6px 12px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                      borderRadius: 20,
                      color: isSelected ? color : T.text, fontFamily: T.sans,
                      boxShadow: isSelected
                        ? `0 14px 28px -18px ${color}60`
                        : '0 14px 26px -22px rgba(26,19,16,0.18)',
                      transition: 'background .25s ease, border-color .25s ease, box-shadow .25s ease',
                    }}>
                    <span style={{
                      width: 36, height: 36, borderRadius: 999,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      background: isSelected ? `${color}28` : `${color}14`,
                      color: color,
                      transition: 'background .25s ease',
                    }}>
                      <SymptomIcon id={id} size={22} />
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: 0.2 }}>{l}</span>
                  </button>
                )
              })}
            </div>
            {moodInsight && (
              <div key={`${phase?.id}-${quickMood}`}
                className="frost-card"
                style={{ marginTop: 14, padding: 18, background: `rgba(200,78,46,0.08)`, border: `1px solid ${T.accent}25`, borderRadius: 22, boxShadow: `0 14px 30px -22px ${T.accent}40`, animation: 'fadeUp 0.35s ease-out both' }}>
                <div style={{ fontFamily: T.serif, fontSize: 14.5, lineHeight: 1.55, color: T.text }}>
                  {moodInsight.text}
                </div>
                {moodInsight.read && (
                  <button onClick={() => goArticle(moodInsight.read)}
                    style={{ marginTop: 10, background: 'transparent', border: 'none', cursor: 'pointer', color: T.accent, fontSize: 12, fontWeight: 600, letterSpacing: 0.3, fontFamily: T.sans, padding: 0 }}>
                    Read more →
                  </button>
                )}
              </div>
            )}
          </div>

          <div style={{ height: 16 }} />
        </div>
      </Screen>
    </div>
  )
}
