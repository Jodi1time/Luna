import { useState, useEffect, useMemo } from 'react'
import { T } from '../data/theme'
import { Screen, SourceLine } from '../components/shared'
import { PHASES, getReflectionPrompt } from '../data/lunaData'
import { adaptiveLessonFor } from '../data/bodyLiteracy'
import { getCondition } from '../data/conditions'
import { dailyThought } from '../lib/lunaChat'
import LunaChat from '../components/LunaChat'
import QuickNote from '../components/QuickNote'
import { PhaseFlourish } from '../components/phaseFlourishes'
import { useCycle, isOnHormonalBC, detectSymptomPatterns, buildPatternSummary } from '../hooks/useCycle'
import { getBcCycleModel } from '../lib/bcCycle'
import { useCountUp } from '../hooks/useCountUp'
import { resurfaceNote } from '../lib/noteResurface'
import { moodIdsOf } from '../lib/moods'
import StickyNote from '../components/StickyNote'
import JournalCard from '../components/JournalCard'
import Backdrop, { useBackdropKind } from '../components/Backdrop'
import { usePregnancy } from '../hooks/usePregnancy'
import useLuna from '../store/useLuna'
import { sectionColors, sectionPaper } from '../data/sectionPalette'
import { schoolForPhase } from '../data/cycleSchools'
import { choreoOnce } from '../lib/choreo'
import { getFirstWeekMoment } from '../lib/firstWeek'
import { todayKey, toDateKey } from '../lib/dateOnly'

const MS_PER_DAY = 86400000
const RITUAL_IMAGE = '/luna-ritual-still-life.webp'

// A "what's next" sentence under the cover. Now confidence-aware:
// adds a small reassurance / honesty tag based on how steady the
// user's cycles have been. The peace-of-mind sale is the line that
// follows: "You don't have to keep track."
function contextualLine({ phase, cycleDay, cycleLength, periodLength, variance, bbtShift, ovulation }) {
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
    // Prefer the fused ovulation day (BBT + mucus + libido) when
    // available — it's typically tighter than BBT alone. Fall back
    // to BBT, then to cycle-length midpoint.
    const ovDay = ovulation?.day ?? bbtShift?.shiftDayMedian ?? Math.round(cycleLength / 2)
    const days = ovDay - cycleDay
    const sub = ovulation && ovulation.signals.length >= 2
      ? `Triangulated from ${ovulation.signals.length} signals.`
      : bbtShift ? 'Anchored to your BBT shift.' : null
    if (days <= 1) return { text: 'Ovulation begins tomorrow.', sub }
    return { text: `${days} days until ovulation.`, sub }
  }

  if (phase.id === 'ovulation') {
    const sub = ovulation && ovulation.signals.length >= 2
      ? `Confirmed by ${ovulation.signals.length} signals.`
      : bbtShift ? 'Confirmed by your BBT shift.' : null
    return { text: 'You\'re in your fertile window.', sub }
  }

  if (phase.id === 'luteal') {
    const days = cycleLength - cycleDay + 1
    if (days <= 0) {
      return { text: 'Your period is a little late.', sub: 'Stress, sleep, and travel can shift a cycle by a few days. Try not to read it as a verdict.' }
    }
    if (days <= 1) {
      return { text: 'Your period is expected tomorrow.', sub: null }
    }
    // Keep the cover calm. Detailed confidence reasoning lives in Insights.
    if (conf === 'high') {
      return { text: `Your period is due in about ${days} days.`, sub: 'Your recent cycles give us a steady signal.' }
    }
    if (conf === 'medium') {
      return { text: `Your period is likely in ${days} days.`, sub: 'The timing is getting clearer as Luna learns your rhythm.' }
    }
    return { text: `Your period might arrive in ${days} days.`, sub: 'Still learning your rhythm.' }
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

const TODAY_RITUAL = {
  menstrual: {
    eyebrow: 'today, gently',
    headline: 'Rest can be the most useful thing today.',
    body: 'Your body is doing quiet, demanding work. Keep the day smaller where you can.',
    energy: 'Low',
    care: 'Warmth',
    food: 'Iron',
    noticeTitle: 'You may also notice',
    notices: ['cramps or heaviness', 'a slower morning', 'wanting softer plans'],
  },
  follicular: {
    eyebrow: 'the rising stretch',
    headline: 'Your energy may naturally come back online.',
    body: 'Estrogen is beginning to rise. This can be a good window for momentum without forcing it.',
    energy: 'Rising',
    care: 'Build',
    food: 'Protein',
    noticeTitle: 'You may also notice',
    notices: ['clearer focus', 'lighter mood', 'more patience for plans'],
  },
  ovulation: {
    eyebrow: 'outward-facing',
    headline: 'Today may feel a little easier to meet.',
    body: 'Connection, confidence, words, and movement can feel more available in this part of your cycle.',
    energy: 'High',
    care: 'Move',
    food: 'Color',
    noticeTitle: 'You may also notice',
    notices: ['brighter mood', 'increased confidence', 'clearer skin'],
  },
  luteal: {
    eyebrow: 'the quiet edit',
    headline: 'Your body may want steadier choices today.',
    body: 'Progesterone changes the tempo. Cravings, tenderness, and lower patience are signals, not flaws.',
    energy: 'Steady',
    care: 'Soften',
    food: 'Magnesium',
    noticeTitle: 'You may also notice',
    notices: ['more sensitivity', 'stronger cravings', 'needing extra sleep'],
  },
}

const MOOD_WORDS = {
  calm: 'Calm',
  bright: 'Bright',
  energy: 'Energized',
  tired: 'Tired',
  cramps: 'Sore',
  sore: 'Sore',
  low: 'Low',
  hopeful: 'Hopeful',
  tense: 'Tense',
  frustrated: 'Tender',
}

function firstNameOf(name) {
  return (name || '').trim().split(/\s+/)[0] || null
}

function moodLabelFor(log) {
  const [first] = moodIdsOf(log)
  return first ? (MOOD_WORDS[first] || first.replace(/-/g, ' ')) : 'Open'
}

function cycleStatusText(phase, contextLine) {
  if (contextLine?.text) return contextLine.text
  if (phase?.id === 'menstrual') return 'Your period is here.'
  if (phase?.id === 'follicular') return 'Your body is rebuilding.'
  if (phase?.id === 'ovulation') return 'Your fertile window is near.'
  if (phase?.id === 'luteal') return 'Your body is winding inward.'
  return 'Your rhythm is taking shape.'
}

function TodayRitualHero({ phase, cycleDay, cycleLength, todayLog, contextLine, displayName, onTapPhase }) {
  if (!phase) return null
  const copy = TODAY_RITUAL[phase.id] || TODAY_RITUAL.follicular
  const name = firstNameOf(displayName)
  const highlights = [
    { label: 'Energy', value: copy.energy },
    { label: 'Mood', value: moodLabelFor(todayLog) },
    { label: 'Care', value: copy.care },
    { label: 'Nourish', value: copy.food },
  ]
  const statusText = cycleStatusText(phase, contextLine)
  return (
    <section className="today-ritual-shell" style={{ marginTop: 8 }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 14,
        marginBottom: 11,
      }}>
        <div>
          <div style={{ fontFamily: T.serif, fontSize: 29, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.02, color: T.text }}>
            {name ? `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, ${name}.` : 'Today.'}
          </div>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13.5, color: T.muted, marginTop: 5, lineHeight: 1.35 }}>
            Here is where your body is today.
          </div>
        </div>
        <button
          type="button"
          onClick={onTapPhase}
          className="alive-card"
          style={{
            flexShrink: 0,
            width: 42,
            height: 42,
            borderRadius: 16,
            border: `1px solid ${phase.color}26`,
            background: 'rgba(255,253,248,0.58)',
            color: phase.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          aria-label={`Read about your ${phase.name.toLowerCase()} phase`}
        >
          <PhaseFlourish phaseId={phase.id} size={20} />
        </button>
      </div>

      <button
        type="button"
        onClick={onTapPhase}
        className="alive-card frost-card"
        style={{
          width: '100%',
          marginBottom: 12,
          padding: '14px 16px 15px',
          borderRadius: 26,
          border: `1px solid ${phase.color}30`,
          background: `linear-gradient(135deg, rgba(255,253,248,0.76), color-mix(in srgb, ${phase.color}, #fff 94%))`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.62), 0 20px 46px -38px ${phase.color}`,
          color: T.text,
          fontFamily: 'inherit',
          cursor: 'pointer',
          textAlign: 'left',
          display: 'grid',
          gridTemplateColumns: '116px minmax(0, 1fr)',
          gap: 14,
          alignItems: 'center',
        }}
        aria-label={`Cycle day ${cycleDay || ''}, ${phase.name} phase`}
      >
        <div style={{
          minHeight: 96,
          borderRadius: 22,
          background: 'rgba(255,253,248,0.54)',
          border: '1px solid rgba(43,33,28,0.055)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55)',
        }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.5, fontWeight: 700, color: `color-mix(in srgb, ${phase.color}, ${T.ink} 30%)`, textTransform: 'uppercase', marginBottom: 1 }}>
            day
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 62, fontWeight: 300, fontStyle: 'italic', lineHeight: 0.9, letterSpacing: -3.2, color: `color-mix(in srgb, ${phase.color}, ${T.ink} 14%)`, fontVariantNumeric: 'tabular-nums' }}>
            {cycleDay || '—'}
          </div>
          {cycleLength && (
            <div style={{ fontFamily: T.serif, fontSize: 12, fontStyle: 'italic', color: T.muted, marginTop: 5 }}>
              of {cycleLength}
            </div>
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: phase.color, marginBottom: 8 }}>
            <PhaseFlourish phaseId={phase.id} size={18} />
            <span style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 500, letterSpacing: -0.35, color: T.text, lineHeight: 1.1 }}>
              {phase.name} phase
            </span>
          </div>
          <div style={{ fontFamily: T.sans, fontSize: 12.5, lineHeight: 1.45, color: T.text, fontWeight: 600 }}>
            {statusText}
          </div>
          {contextLine?.sub && (
            <div style={{ fontFamily: T.sans, fontSize: 11.5, lineHeight: 1.45, color: T.muted, marginTop: 5 }}>
              {contextLine.sub}
            </div>
          )}
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, color: `color-mix(in srgb, ${phase.color}, ${T.ink} 24%)`, marginTop: 9 }}>
            Tap for the deeper read →
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={onTapPhase}
        className="today-ritual-card alive-card"
        style={{
          position: 'relative',
          width: '100%',
          border: `1px solid ${phase.color}22`,
          borderRadius: 28,
          padding: 0,
          background: `linear-gradient(145deg, rgba(255,253,248,0.88), color-mix(in srgb, ${phase.color}, #fff 92%))`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.70), 0 28px 58px -42px ${phase.color}`,
          overflow: 'hidden',
          textAlign: 'left',
          color: T.text,
          fontFamily: 'inherit',
          cursor: 'pointer',
        }}
      >
        <div aria-hidden="true" style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 18% 10%, rgba(255,255,255,0.92), transparent 36%), radial-gradient(circle at 82% 28%, rgba(255,255,255,0.38), transparent 34%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 92px',
          gap: 16,
          padding: '20px 18px 0 20px',
          alignItems: 'stretch',
        }}>
          <div>
            <div style={{ fontFamily: T.mono, fontSize: 10.5, letterSpacing: 1.6, fontWeight: 700, textTransform: 'uppercase', color: `color-mix(in srgb, ${phase.color}, ${T.ink} 24%)`, marginBottom: 10 }}>
              {copy.eyebrow}
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 500, letterSpacing: -0.85, lineHeight: 1.04, color: T.text, textWrap: 'balance' }}>
              {copy.headline}
            </div>
            <div style={{ fontFamily: T.sans, fontSize: 12.5, lineHeight: 1.5, color: T.muted, marginTop: 10, maxWidth: 232 }}>
              {copy.body}
            </div>
          </div>
          <div style={{
            minHeight: 148,
            borderRadius: 22,
            backgroundImage: `linear-gradient(180deg, rgba(255,253,248,0.08), rgba(43,33,28,0.12)), url(${RITUAL_IMAGE})`,
            backgroundSize: 'cover',
            backgroundPosition: '59% 70%',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.48), 0 16px 32px -24px rgba(26,19,16,0.34)',
          }} />
        </div>

        <div style={{ position: 'relative', padding: '16px 18px 18px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 7, marginBottom: 16 }}>
            {highlights.map((item) => (
              <div key={item.label} style={{
                minWidth: 0,
                padding: '10px 7px',
                borderRadius: 16,
                background: 'rgba(255,253,248,0.54)',
                border: '1px solid rgba(43,33,28,0.055)',
                textAlign: 'center',
              }}>
                <div style={{ fontFamily: T.mono, fontSize: 8.5, letterSpacing: 0.85, textTransform: 'uppercase', color: T.muted, marginBottom: 5, whiteSpace: 'nowrap' }}>
                  {item.label}
                </div>
                <div style={{ fontFamily: T.serif, fontSize: 13.5, fontWeight: 500, letterSpacing: -0.15, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid rgba(43,33,28,0.075)', paddingTop: 14 }}>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13.5, color: `color-mix(in srgb, ${phase.color}, ${T.ink} 25%)`, marginBottom: 9 }}>
              {copy.noticeTitle}
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              {copy.notices.map((notice) => (
                <div key={notice} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: T.sans, fontSize: 12.5, color: T.text, lineHeight: 1.35 }}>
                  <span aria-hidden="true" style={{ width: 5, height: 5, borderRadius: 999, background: phase.color, opacity: 0.58, flexShrink: 0 }} />
                  <span>{notice}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </button>
    </section>
  )
}

function logHasContent(log) {
  if (!log) return false
  return Boolean(
    moodIdsOf(log).length ||
    (Array.isArray(log.symptoms) && log.symptoms.length) ||
    log.flow ||
    log.bbt?.value ||
    log.mucus ||
    log.sex ||
    log.sleep ||
    (typeof log.note === 'string' && log.note.trim()) ||
    log.intimate
  )
}

function daysSinceISO(iso, todayISO) {
  if (!iso) return null
  const a = new Date(iso + 'T00:00:00')
  const b = new Date(todayISO + 'T00:00:00')
  return Math.max(0, Math.floor((b - a) / MS_PER_DAY))
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
  const todayISO = toDateKey(today)
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
    const iso = toDateKey(d)
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
          <div style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, letterSpacing: 1, fontWeight: 600 }}>{label}</div>
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
  const todayISO = todayKey()
  const taken = wellness?.bcTakenToday === todayISO
  if (taken) return null
  return (
    <div className="glass-card alive-card frost-card" style={{ marginTop: 22, padding: 18, borderRadius: 22, boxShadow: `0 14px 30px -20px ${T.accent}40`, display: 'flex', alignItems: 'center', gap: 12 }}>
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

// Quiet invitations under the phase cover. Talk to Luna has its own
// hero card below; this row stays focused on sharing and lookup.
function QuickActions({ go }) {
  // Each action still carries its route and category. Category gives
  // the icon a quiet accent, but the card backgrounds now stay close
  // to Luna's paper so the row feels like invitations, not a menu.
  const items = [
    // "Check in" QuickAction was a direct duplicate of the center
    // [+] button in the TabBar. Cut to enforce the "one canonical
    // home per job" rule — the [+] button is the canonical entry.
    { key: 'share', category: 'plan', tier: 'primary', label: 'Share with someone', sub: 'A partner, your mother, a friend',
      icon: (
        <svg className="icon-anim-share" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          {/* Two soft rings — a Venn meeting. The right ring drifts
              inward, the left drifts outward (reversed direction), so
              they pulse toward each other and back. A tiny heart fades
              in at the overlap at the moment of closest meeting —
              kept abstract, never literal. */}
          <circle className="ring-a" cx="7.5" cy="10" r="4.5"/>
          <circle className="ring-b" cx="12.5" cy="10" r="4.5"/>
          <path className="heart" d="M10 11.5l-1.4-1.4a1 1 0 0 1 1.4-1.4l0 0a1 1 0 0 1 1.4 1.4z" fill="currentColor" stroke="none"/>
        </svg>
      ),
      onTap: () => go('shareWith') },
    { key: 'lookup', category: 'read', tier: 'primary', label: 'Look it up', sub: 'Search the library, sourced',
      icon: (
        <svg className="icon-anim-ask" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          {/* The whole glass-and-handle tilts around the end of the
              handle (17,17) — like a hand holding it and tilting
              to look at different spots. The handle stays "in the
              user's hand" while the glass sweeps. */}
          <g className="glass">
            <circle cx="9" cy="9" r="5.5"/>
            <path d="M13 13l4 4"/>
          </g>
        </svg>
      ),
      onTap: () => go('askLuna') },
    { key: 'conditions', category: 'urgent', tier: 'secondary', label: 'Conditions', sub: 'PCOS, endo, PMDD',
      icon: (
        <svg className="icon-anim-conditions" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle className="ring" cx="10" cy="10" r="7" pathLength="100"/>
          <path className="cv" pathLength="100" d="M10 5v10"/>
          <path className="ch" pathLength="100" d="M5 10h10"/>
        </svg>
      ),
      onTap: () => go('conditions') },
    // Insights moved to the tab bar (fourth slot) — this chip now
    // carries the Library, which gave up that slot. Browse entry;
    // "Look it up" above stays the search entry.
    { key: 'library', category: 'read', tier: 'secondary', label: 'Library', sub: 'Doctor-grounded reads',
      icon: (
        <svg className="icon-anim-insights" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 3.5h5a1.8 1.8 0 011.8 1.8V17a1.6 1.6 0 00-1.6-1.4H4z"/>
          <path d="M16 3.5h-5a1.8 1.8 0 00-1.8 1.8V17a1.6 1.6 0 011.6-1.4H16z"/>
        </svg>
      ),
      onTap: () => go('library') },
    { key: 'cheatsheet', category: 'care', tier: 'secondary', label: 'Visit notes', sub: 'Talking points',
      icon: (
        <svg className="icon-anim-cheatsheet" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="3" width="12" height="14" rx="1.5"/>
          <path className="ln ln-1" pathLength="100" d="M7 7h6"/>
          <path className="ln ln-2" pathLength="100" d="M7 10h6"/>
          <path className="ln ln-3" pathLength="100" d="M7 13h4"/>
        </svg>
      ),
      onTap: () => go('cheatsheet') },
  ]
  const primaryItems = items.filter((it) => it.tier === 'primary')
  const secondaryItems = items.filter((it) => it.tier === 'secondary')
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 10,
        padding: '2px 0',
      }}>
      {primaryItems.map((it, idx) => {
        const colors = sectionColors(it.category)
        return (
          <button key={it.key} onClick={it.onTap} className="stagger-card alive-card frost-card"
            style={{
              position: 'relative',
              minHeight: 124,
              textAlign: 'left',
              borderRadius: 24,
              padding: 16,
              overflow: 'hidden',
              cursor: 'pointer',
              color: T.text,
              fontFamily: 'inherit',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              background: 'rgba(253,250,245,0.54)',
              border: '1px solid rgba(26,19,16,0.065)',
              boxShadow: '0 10px 22px -28px rgba(26,19,16,0.18)',
              animationDelay: `${idx * 50}ms`,
            }}>
            <span style={{
              width: 38, height: 38, borderRadius: 16,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: colors.accent,
              background: `${colors.accent}12`,
              border: `1px solid ${colors.accent}1f`,
            }}>
              {it.icon}
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 5, position: 'relative', zIndex: 1 }}>
              <span style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 500, lineHeight: 1.16, letterSpacing: -0.25, color: T.text }}>
                {it.label}
              </span>
              <span style={{ fontFamily: T.sans, fontSize: 11.5, color: T.muted, lineHeight: 1.42, letterSpacing: 0.05 }}>
                {it.sub}
              </span>
            </span>
          </button>
        )
      })}
      </div>
      <div className="frost-card" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        overflow: 'hidden',
        marginTop: 10,
        background: 'rgba(253,250,245,0.42)',
        border: '1px solid rgba(26,19,16,0.055)',
        borderRadius: 18,
        boxShadow: 'none',
      }}>
        {secondaryItems.map((it, idx) => {
          const colors = sectionColors(it.category)
          return (
            <button key={it.key} onClick={it.onTap} className="alive-card"
              style={{
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 7,
                border: 'none',
                borderRight: idx < secondaryItems.length - 1 ? '1px solid rgba(26,19,16,0.055)' : 'none',
                background: 'transparent',
                padding: '13px 10px 12px',
                cursor: 'pointer',
                textAlign: 'left',
                color: T.text,
                fontFamily: 'inherit',
              }}>
              <span style={{
                width: 28, height: 28, borderRadius: 12,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                color: colors.accent,
                background: `${colors.accent}12`,
              }}>
                {it.icon}
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontFamily: T.serif, fontSize: 13.5, fontWeight: 500, lineHeight: 1.1, letterSpacing: -0.12, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {it.label}
                </span>
                <span style={{ display: 'block', marginTop: 3, fontFamily: T.sans, fontSize: 10.5, lineHeight: 1.25, color: T.muted }}>
                  {it.sub}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function LunaHeroCard({ phase, text, fwMoment, go, onOpenChat }) {
  if (!phase || (!fwMoment && !text)) return null
  const opensWheel = fwMoment?.cta === 'wheel'
  const body = fwMoment ? fwMoment.text : text
  return (
    <button
      onClick={() => {
        if (opensWheel) {
          go('insights')
          return
        }
        onOpenChat?.(body)
      }}
      className="luna-voice-card alive-card frost-card"
      style={{
        '--voice-accent': phase.color,
        position: 'relative',
        marginTop: 18,
        padding: 20,
        width: '100%',
        border: `1px solid color-mix(in srgb, ${phase.color}, transparent 72%)`,
        borderRadius: 28,
        background: `linear-gradient(145deg, rgba(253,250,245,0.70), color-mix(in srgb, ${phase.color}, #fff 91%))`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.64), 0 24px 46px -34px ${phase.color}`,
        color: T.text,
        cursor: 'pointer',
        overflow: 'hidden',
        textAlign: 'left',
        fontFamily: 'inherit',
      }}
    >
      <div aria-hidden="true" style={{
        position: 'absolute',
        top: -38,
        right: -28,
        width: 122,
        height: 122,
        borderRadius: '50%',
        background: `radial-gradient(circle, color-mix(in srgb, ${phase.color}, transparent 56%), transparent 68%)`,
        opacity: 0.72,
      }} />
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: `color-mix(in srgb, ${phase.color}, ${T.ink} 30%)`, fontWeight: 500, letterSpacing: -0.1 }}>
            {fwMoment ? fwMoment.eyebrow : 'a thought, today'}
          </div>
          <div style={{ fontFamily: T.sans, fontSize: 11, color: T.muted, marginTop: 3 }}>
            {opensWheel ? 'See the pattern' : 'Open a real conversation'}
          </div>
        </div>
        <span aria-hidden="true" className="luna-voice-mark" style={{
          flexShrink: 0,
          width: 42,
          height: 42,
          borderRadius: 18,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: phase.color,
          background: 'rgba(255,255,255,0.38)',
          border: '1px solid rgba(255,255,255,0.55)',
        }}>
          {opensWheel ? (
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <circle cx="10" cy="10" r="6.8" strokeDasharray="3 2.3" />
              <circle cx="10" cy="10" r="1.5" fill="currentColor" stroke="none" />
            </svg>
          ) : (
            <svg className="icon-anim-talk" width="19" height="19" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H8l-4 3v-3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
              <circle className="dot dot-1" cx="7" cy="9.5" r="1" fill="currentColor" stroke="none"/>
              <circle className="dot dot-2" cx="10" cy="9.5" r="1" fill="currentColor" stroke="none"/>
              <circle className="dot dot-3" cx="13" cy="9.5" r="1" fill="currentColor" stroke="none"/>
            </svg>
          )}
        </span>
      </div>
      <div style={{ position: 'relative', fontFamily: T.serif, fontSize: 20, fontStyle: 'italic', lineHeight: 1.42, letterSpacing: -0.35, color: T.text }}>
        {body}
      </div>
      <div style={{ position: 'relative', marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: T.sans, fontSize: 12, fontWeight: 700, letterSpacing: 0.2, color: phase.color }}>
        {opensWheel ? 'See your wheel' : 'Talk to Luna'}
        <span aria-hidden="true">→</span>
      </div>
    </button>
  )
}

function NourishTodayCard({ phase, onTap }) {
  if (!phase?.nutrition) return null
  return (
    <button
      onClick={onTap}
      className="alive-card"
      style={{
        position: 'relative',
        marginTop: 16,
        width: '100%',
        padding: 0,
        display: 'grid',
        gridTemplateColumns: '1fr 104px',
        minHeight: 132,
        border: `1px solid ${T.hair}`,
        borderRadius: 26,
        background: 'rgba(255,253,248,0.68)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.58), 0 22px 42px -34px rgba(43,33,28,0.34)',
        overflow: 'hidden',
        cursor: 'pointer',
        textAlign: 'left',
        color: T.text,
        fontFamily: 'inherit',
      }}
    >
      <div style={{ padding: '18px 16px 17px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14 }}>
        <div>
          <div style={{ fontFamily: T.mono, fontSize: 10.5, letterSpacing: 1.5, fontWeight: 700, textTransform: 'uppercase', color: `color-mix(in srgb, ${phase.color}, ${T.ink} 24%)`, marginBottom: 8 }}>
            nourish today
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 19, fontWeight: 500, lineHeight: 1.18, letterSpacing: -0.35, color: T.text }}>
            Food as care, not a chore.
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 13.5, lineHeight: 1.45, color: T.muted, fontStyle: 'italic', marginTop: 7 }}>
            {phase.nutrition.headline}
          </div>
        </div>
        <div style={{ fontFamily: T.sans, fontSize: 11.5, fontWeight: 700, letterSpacing: 0.2, color: `color-mix(in srgb, ${phase.color}, ${T.ink} 20%)` }}>
          See phase guidance →
        </div>
      </div>
      <div aria-hidden="true" style={{
        minHeight: '100%',
        backgroundImage: `linear-gradient(180deg, rgba(255,253,248,0.10), rgba(43,33,28,0.10)), url(${RITUAL_IMAGE})`,
        backgroundSize: 'cover',
        backgroundPosition: '61% 70%',
        borderLeft: `1px solid ${T.hair}`,
      }} />
    </button>
  )
}

// Smart helper card — reusable Home surface for any of the "what now"
// helpers. Only mounted when a relevant signal is in today's log.
function SmartHelperCard({ onTap, eyebrow, line, category = 'urgent' }) {
  // smart-arrival glows the border with a one-shot accent halo on mount.
  // Category drives the soft tint + accent — physical-acute helpers
  // (cramps, UTI) wear 'urgent' rose, emotional surfaces wear reflect
  // clay, sleep wears taupe, morning intention wears reflect too.
  // Tells the user at a glance what KIND of nudge this is.
  const colors = sectionColors(category)
  return (
    <button onClick={onTap} className="smart-arrival alive-card frost-card sheen-once"
      style={{
        position: 'relative',
        marginTop: 14, padding: 18,
        background: sectionPaper(category),
        border: `1px solid ${colors.accent}33`,
        boxShadow: `0 1px 0 ${colors.accent}10, 0 14px 30px -20px ${colors.accent}50`,
        borderRadius: 22, textAlign: 'left', cursor: 'pointer', width: '100%',
        color: T.text, fontFamily: 'inherit', display: 'block',
        overflow: 'hidden',
      }}>
      <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 1.2, fontWeight: 600, color: colors.accent, marginBottom: 6 }}>
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

// Three horizontally-scrollable cards: a nourish hint, a short read,
// a movement hint — all phase-tuned. Soft borders, no images, intentionally
// quiet so they texture the screen without dominating it.
// CycleSchoolCard — phase-matched 5-day program. Surfaces the school
// whose phase matches the user's current phase, shows progress dots,
// and tap-resumes from the lowest incomplete day. Renders nothing
// when the matching school is fully complete OR no school matches.
function CycleSchoolCard({ phase, settings, go }) {
  if (!phase) return null
  const school = schoolForPhase(phase.id)
  if (!school) return null
  const state = settings?.schools?.[school.id] || {}
  const completedDays = state.completedDays || []
  const allDone = completedDays.length === school.duration
  if (allDone) return null  // quiet when finished — re-appears next cycle
  const colors = sectionColors(school.category)
  const started = completedDays.length > 0 || state.startedAt
  return (
    <button onClick={() => go('cycleSchool', { activeSchoolId: school.id })}
      className="alive-card frost-card sheen-once"
      style={{
        position: 'relative',
        marginTop: 22, padding: 20,
        background: sectionPaper(school.category),
        border: `1px solid ${colors.accent}28`,
        borderRadius: 22,
        boxShadow: `0 14px 30px -22px ${colors.accent}55`,
        textAlign: 'left', cursor: 'pointer', width: '100%',
        color: T.text, fontFamily: 'inherit', display: 'block',
        overflow: 'hidden',
      }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, color: colors.accent, fontWeight: 500, letterSpacing: -0.1 }}>
          a school for your {school.phase} week
        </div>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, color: colors.accent, fontWeight: 500 }}>
          {started ? `day ${completedDays.length + 1} →` : 'begin →'}
        </div>
      </div>
      <div style={{ fontFamily: T.serif, fontSize: 19, fontWeight: 500, lineHeight: 1.3, letterSpacing: -0.2, marginBottom: 6 }}>
        {school.title}
      </div>
      <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13.5, color: T.muted, lineHeight: 1.55, marginBottom: 14 }}>
        {school.subtitle}
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {Array.from({ length: school.duration }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 999,
            background: i < completedDays.length ? colors.accent : 'rgba(26,19,16,0.10)',
            transition: 'background .25s ease-out',
          }} />
        ))}
      </div>
    </button>
  )
}

// Pinned condition card — surfaces on Home for users who said in
// onboarding that they're managing a specific condition. Opens straight
// into that condition's Conditions Atlas detail page. Sits in the
// differentiator tier above the AI thought because for someone with
// PCOS / endo / PMDD, this is the surface they came here for. Quiet
// editorial card, never alarmist.
function PinnedConditionCard({ conditionId, go }) {
  const condition = getCondition(conditionId)
  if (!condition) return null
  const colors = sectionColors('urgent')
  // PCOS users land on the PCOS Deep Mode dashboard, not the generic
  // Atlas detail — that's where their ongoing cycle pattern, signal
  // summary, next-thing surface, and (soon) bloodwork + meds live.
  // Other conditions still route to the Atlas detail for now.
  const open = () => {
    if (conditionId === 'pcos') {
      go('pcos')
      return
    }
    useLuna.setState({ activeConditionId: conditionId })
    go('conditions')
  }
  return (
    <button onClick={open} className="alive-card frost-card sheen-once"
      style={{
        position: 'relative',
        marginTop: 22, padding: 20,
        background: sectionPaper('urgent'),
        border: `1px solid ${colors.accent}28`,
        borderRadius: 22,
        boxShadow: `0 14px 30px -22px ${colors.accent}55`,
        textAlign: 'left', cursor: 'pointer', width: '100%',
        color: T.text, fontFamily: 'inherit', display: 'block',
        overflow: 'hidden',
      }}>
      <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, color: colors.accent, fontWeight: 500, letterSpacing: -0.1, marginBottom: 8 }}>
        your condition
      </div>
      <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, lineHeight: 1.2, letterSpacing: -0.3, marginBottom: 6 }}>
        {condition.name}
      </div>
      <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13.5, color: T.muted, lineHeight: 1.55, marginBottom: 6 }}>
        {condition.summary}
      </div>
      <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: colors.accent, fontWeight: 500, marginTop: 6 }}>
        read deeper →
      </div>
    </button>
  )
}

// Phase-tuned + milestone-aware "invite someone in" card. The strategic
// purpose: surface Luna's Share with someone Pro feature in the editorial
// register, not the surveillance-coded "Partner tab" register that Flo
// uses. Copy is doula-toned, phase-resonant, and gender-neutral about the
// recipient (user = she/you, recipient = someone/them — never assumed to
// be male partner OR female friend). First-cycle milestone overrides
// phase copy as a one-time moment of pride.
//
// Dismissal: tapping × writes today's ISO to settings.circleDismissedISO
// so the card hides for the rest of today. Re-surfaces tomorrow with
// (possibly) different copy as the phase rolls. Persistence is light on
// purpose — we don't want a permanent dismiss because the right moment
// might come next week.
function CircleCard({ phase, settings, updateSetting, cycle, go }) {
  if (!phase) return null  // hides during pregnancy / hormonal BC
  const todayISO = todayKey()
  if (settings?.circleDismissedISO === todayISO) return null

  // First-cycle milestone — one-time, overrides phase copy. Treats the
  // moment "Luna has watched you through one full cycle" as the right
  // gentle prompt to consider inviting someone else into the rhythm.
  const isFirstCycleMoment =
    !settings?.circleSeenFirstCycle &&
    (cycle?.cyclesLogged ?? 0) >= 1

  const phaseCopy = {
    menstrual:  { eyebrow: 'days that ask for softness',     title: 'Want someone with you this week?' },
    follicular: { eyebrow: 'the rising stretch',             title: 'Let someone meet you while you’re climbing.' },
    ovulation:  { eyebrow: 'the week you’re most yourself',  title: 'You’re easiest to find this week. Hand someone the map.' },
    luteal:     { eyebrow: 'the quiet stretch',              title: 'Tomorrow could be a hard day. Someone you trust could already know.' },
  }
  const copy = isFirstCycleMoment
    ? { eyebrow: 'a small milestone', title: 'You have a rhythm worth sharing now.' }
    : (phaseCopy[phase.id] || phaseCopy.follicular)

  const colors = sectionColors('plan')
  const onOpen = () => {
    if (isFirstCycleMoment) updateSetting('circleSeenFirstCycle', true)
    go('shareWith')
  }
  const onDismiss = (e) => {
    e.stopPropagation()
    updateSetting('circleDismissedISO', todayISO)
    if (isFirstCycleMoment) updateSetting('circleSeenFirstCycle', true)
  }
  const onCardKeyDown = (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    onOpen()
  }
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={onCardKeyDown}
      className="alive-card frost-card sheen-once"
      style={{
        position: 'relative',
        marginTop: 22, padding: 20,
        background: sectionPaper('plan'),
        border: `1px solid ${colors.accent}28`,
        borderRadius: 22,
        boxShadow: `0 14px 30px -22px ${colors.accent}55`,
        textAlign: 'left', cursor: 'pointer', width: '100%',
        color: T.text, fontFamily: 'inherit', display: 'block',
        overflow: 'hidden',
      }}>
      {/* Dismiss × — quiet, top-right. Tap propagation stopped so the
          card body doesn't route to ShareWith when the user dismisses. */}
      <button onClick={onDismiss} aria-label="Not right now"
        style={{
          position: 'absolute', top: 10, right: 12,
          width: 28, height: 28, borderRadius: 999,
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: T.muted, fontSize: 18, lineHeight: 1, opacity: 0.6,
          fontFamily: T.serif, padding: 0,
        }}>×</button>
      <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, color: colors.accent, fontWeight: 500, letterSpacing: -0.1, marginBottom: 8 }}>
        {copy.eyebrow}
      </div>
      <div style={{ fontFamily: T.serif, fontSize: 19, fontWeight: 500, lineHeight: 1.3, letterSpacing: -0.2, marginBottom: 8, paddingRight: 28 }}>
        {copy.title}
      </div>
      <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13.5, color: T.muted, lineHeight: 1.55, marginBottom: 6 }}>
        A partner, your mother, a doula, a friend. You pick what they see — diary stays yours.
      </div>
      <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: colors.accent, fontWeight: 500, marginTop: 6 }}>
        invite someone in →
      </div>
    </div>
  )
}

// ForTodayRow removed (Keep/Merge/Cut pass 1): "read" card was a
// dupe of Daily Insight; Nourish + Move sub-cards are still covered
// inline by PhaseDetail. See the deletion site in the render tree
// for the full rationale.

export default function Home() {
  const store = useLuna()
  const { go, goPhase, goArticle, saveLog, setLastPeriodStart, setActiveLogDate, markWellness, logs, birthControl, displayName, settings, updateSetting, setActiveReflectPractice } = store
  const wellness = settings?.wellness || {}
  const cycle = useCycle(store)
  const { cycleDay, phase, cycleLength, periodLength } = cycle
  const preg = usePregnancy(store)
  const isPreg = preg.active
  const trimColor = isPreg ? trimesterColor(preg.trimester?.number) : null
  // Entrance choreography plays once per session; re-visits render settled.
  const [animateIn] = useState(() => choreoOnce('home'))
  const animatedDay = useCountUp(isPreg ? preg.week : cycleDay, animateIn ? 900 : 0)
  const onHormonalBC = isOnHormonalBC(birthControl)
  // Per-method cycle model — drives the cover and the BC-aware "next
  // thing" surface (shot countdown, pack-week tracker, etc.). For
  // 'none' and 'copper-iud' this returns kind: 'natural' and the rest
  // of Home renders unchanged.
  const bcModel = useMemo(() => getBcCycleModel(birthControl), [birthControl])
  const bcUsesCover = onHormonalBC && bcModel?.cover

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

  const todayISO = todayKey()
  const todayLog = logs?.[todayISO]
  const todayHasContent = logHasContent(todayLog)
  const lastMeaningfulLogISO = useMemo(() => {
    return Object.entries(logs || {})
      .filter(([iso, log]) => iso <= todayISO && logHasContent(log))
      .map(([iso]) => iso)
      .sort()
      .pop() || null
  }, [logs, todayISO])
  const daysSinceLastLog = daysSinceISO(lastMeaningfulLogISO, todayISO)
  const showQuietReturn = !todayHasContent && daysSinceLastLog != null && daysSinceLastLog >= 3 && daysSinceLastLog < 14

  // ─── Adaptive Home flags ─────────────────────────────────────
  // Drive section ordering + visibility from onboarding answers
  // (settings.intent + settings.priorities). The home feed feels
  // tailored when these decide what leads + what's hidden; it
  // feels cluttered when it doesn't. Defaults from intent keep
  // behaviour sensible if priorities was never visited.
  const userIntent = settings?.intent
  const userPriorities = (settings?.priorities && settings.priorities.length > 0)
    ? settings.priorities
    : null  // null means "fall back to defaults / show universal stack"
  const pinnedConditionId = (userIntent === 'managing-condition' && settings?.conditions?.[0]) || null
  const reflectFirst = userPriorities ? userPriorities.includes('reflect') : false
  const hideEducational = userIntent === 'just-tracking'
  // Circle (Share with someone) feels off-key when the user said
  // "just tracking, simply" — they didn't sign up for a haven, they
  // signed up for utility. Quiet by default for that intent.
  const hideCircleCard = userIntent === 'just-tracking'
  // Share already lives in the primary invitation row. Keep the larger
  // Share surface only for the first-cycle milestone so it feels like
  // an occasion, not a repeated menu item.
  const showCircleMilestoneCard = !hideCircleCard && !settings?.circleSeenFirstCycle && (cycle?.cyclesLogged ?? 0) >= 1
  const hasFlowToday = todayLog?.flow && todayLog.flow !== 'Spotting'
  // Smart cramps surface: if today's log has cramps as a mood OR as a
  // symptom, surface a "Sit with me" card pointing to the Cramps Helper.
  // She doesn't have to dig for help when she already told us it hurts.
  const todayMoods = moodIdsOf(todayLog)
  const hasCrampsToday = todayMoods.includes('cramps') || (todayLog?.symptoms || []).includes('cramps')
  // Other smart helper surfaces — only show when she's already told us
  // something is happening. Quiet by default; act when relevant.
  const hasAnxietyToday = todayMoods.includes('low') || todayMoods.includes('frustrated')
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
  const daysSinceLastPeriod = cycle.daysSinceLastPeriod
  const expectedPeriodWindow = daysSinceLastPeriod != null &&
    daysSinceLastPeriod >= cycleLength - 3 &&
    daysSinceLastPeriod <= cycleLength + 9
  const showPeriodCTA = !isPreg && !onHormonalBC && !hasFlowToday && expectedPeriodWindow

  // Catch-up state — predictions degrade silently when a user stops
  // logging. Detect two flavours of "Luna has gone stale" so we can
  // proactively ask the user to re-anchor without pestering everyone.
  //
  //   stalePeriod: predicted period was 10+ days ago AND no flow
  //                logged since — the anchor is almost certainly
  //                wrong, predictions are way off.
  //   staleLogs:  the user hasn't logged anything meaningful in
  //                14+ days — they've drifted away from Luna, gently
  //                invite them back without scolding.
  //
  // Suppressed when the regular period CTA is already showing, when
  // the user is on hormonal BC (no cycle to predict), and during
  // pregnancy. Only one stale state surfaces at a time.
  const showCatchUp = (() => {
    if (isPreg || onHormonalBC) return null
    if (showPeriodCTA) return null
    // Use raw anchor age, not modulo cycle day, to detect a missed cycle.
    if (daysSinceLastPeriod != null && daysSinceLastPeriod > cycleLength + 10) {
      return { kind: 'stalePeriod', daysOver: daysSinceLastPeriod - cycleLength }
    }
    if (daysSinceLastLog != null && daysSinceLastLog >= 14) return { kind: 'staleLogs', daysSince: daysSinceLastLog }
    return null
  })()

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
  // Derive a privacy-safe pattern summary the AI can root in. Pure
  // qualitative — "tends toward low mood and cramps in late luteal;
  // cycles steady" — no raw logs, no dates, no identifiers. Includes
  // the variance label so first-cycle users still get the rhythm
  // signal even before patterns emerge.
  const patternSummary = useMemo(() => {
    if (!cycle.cycleLength || !cycle.periodLength) return ''
    const patterns = detectSymptomPatterns(logs, cycle.periodHistory, cycle.cycleLength, cycle.periodLength)
    return buildPatternSummary(patterns, cycle.variance, cycle.cycleLength, cycle.periodLength)
  }, [logs, cycle.periodHistory, cycle.cycleLength, cycle.periodLength, cycle.variance])

  useEffect(() => {
    if (!phase || !session?.user?.id) return
    let cancelled = false
    dailyThought({
      userId: session.user.id,
      phaseId: phase.id,
      phaseName: phase.name,
      cycleDay: cycle.cycleDay,
      cycleLength: cycle.cycleLength,
      patternSummary,
    }).then((text) => { if (!cancelled && text) setAiThought(text) })
    return () => { cancelled = true }
  }, [phase, cycle.cycleDay, cycle.cycleLength, session?.user?.id, patternSummary])
  // Use the AI thought if we have one, otherwise the local static prompt.
  const thoughtText = aiThought || (phase ? getReflectionPrompt(phase.id) : null)

  // First-week arc — for brand-new users, three quiet moments take
  // over this slot on days 2-3 / 4-5 / 7-9 (see lib/firstWeek.js).
  // Each shows for one full day; the seen-map write below pins the
  // date so reopening the app the same day keeps the moment.
  const fwSeen = settings?.firstWeekSeen || {}
  const fwMoment = !isPreg
    ? getFirstWeekMoment({ joinedAt: settings?.joinedAt, todayISO, logs, cycleDay, cycleLength, seen: fwSeen })
    : null
  useEffect(() => {
    if (fwMoment && fwSeen[fwMoment.id] !== todayISO) {
      updateSetting('firstWeekSeen', { ...fwSeen, [fwMoment.id]: todayISO })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fwMoment?.id])
  const logPeriodStart = () => {
    // Explicit user confirmation that today is day 1 — log the flow
    // AND directly anchor lastPeriodStart so detection is immediate
    // (the new 2+ flow days rule in detectPeriodStarts otherwise
    // delays auto-detection until day 2).
    const today = new Date()
    saveLog(today, { ...(todayLog || {}), flow: 'Medium' })
    setLastPeriodStart(today)
    // Soft milestone moment + bloom sound + success haptic.
    useLuna.getState().setCelebration('day-one')
    // Lazy-load sounds to avoid pulling AudioContext into the eager path.
    import('../lib/sounds').then(({ bloomSound }) => bloomSound(Boolean(settings?.sounds)))
    import('../lib/haptics').then(({ hapticSuccess }) => hapticSuccess())
  }
  const contextLine = !isPreg ? contextualLine({ phase, cycleDay, cycleLength, periodLength, variance: cycle.variance, bbtShift: cycle.bbtShift, ovulation: cycle.ovulation }) : null
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
    <div className={`home-stage${animateIn ? '' : ' choreo-done'}`}>
      {/* Blob layer — pinned to .home-stage, doesn't scroll. */}
      <BackgroundBlob color={blobColor} effect={effect} />
      {/* Content layer — scrolls past the stationary blob. */}
      <Screen>
        <div onClick={handleContentTap} style={{ position: 'relative', padding: '12px 22px 0', color: T.text, zIndex: 1 }}>
          {!isPreg && phase && (
            <TodayRitualHero
              phase={phase}
              cycleDay={cycleDay}
              cycleLength={cycleLength}
              todayLog={todayLog}
              contextLine={contextLine}
              displayName={displayName}
              onTapPhase={() => goPhase(phase.id)}
            />
          )}

          {!isPreg && (
            <div style={{ marginTop: 14 }}>
              <WeekStrip go={go} setActiveLogDate={setActiveLogDate} cycle={cycle} logs={logs} />
            </div>
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
                <div className="alive-card frost-card" style={{ marginTop: 22, padding: 20, background: T.card, border: `1px solid ${T.hair}`, borderRadius: 22, boxShadow: `0 14px 30px -20px ${trimColor}40`, textAlign: 'left' }}>
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

          {/* The one dominant action — the screen's answer to "what
              now?". Filled accent when today isn't logged (clearly THE
              thing to do), a quiet "noted" state once she has. Sits
              above the secondary quick-action row. Suppressed when a
              stronger nudge (period CTA / catch-up) owns the day. */}
          {!isPreg && !showCatchUp && !showPeriodCTA && (
            <button onClick={() => { setActiveLogDate(todayISO); go('log') }}
              className="alive-card"
              style={{
                marginTop: 18, width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                padding: '17px 18px 17px 20px', borderRadius: 18,
                background: todayHasContent ? 'rgba(253,250,245,0.58)' : T.accent,
                border: todayHasContent ? `1px solid ${T.accent}2e` : `1px solid ${T.accent}`,
                color: todayHasContent ? T.text : '#fff',
                boxShadow: todayHasContent
                  ? 'none'
                  : `0 12px 22px -18px ${T.accent}85`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
              }}>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontFamily: T.serif, fontSize: 19, fontWeight: 500, letterSpacing: -0.3 }}>
                  {todayHasContent ? 'Today’s check-in is saved.' : showQuietReturn ? 'Welcome back. Start with today.' : 'How is your body today?'}
                </span>
                <span style={{ fontFamily: T.sans, fontSize: 12.5, lineHeight: 1.4, color: todayHasContent ? T.muted : 'rgba(255,250,245,0.88)' }}>
                  {todayHasContent
                    ? 'Add more anytime: a mood, symptom, sleep note, or thought.'
                    : showQuietReturn
                      ? 'The quiet days can stay quiet. A few taps is enough.'
                      : 'Mood, energy, symptoms, sleep, or anything you noticed.'}
                </span>
              </span>
              <span aria-hidden="true" style={{
                flexShrink: 0, width: 38, height: 38, borderRadius: 999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: todayHasContent ? `${T.accent}14` : 'rgba(255,255,255,0.22)',
                color: todayHasContent ? T.accent : '#fff',
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h9M8 3l5 5-5 5"/></svg>
              </span>
            </button>
          )}

          {!isPreg && (
            <LunaHeroCard
              phase={phase}
              text={thoughtText}
              fwMoment={fwMoment}
              go={go}
              onOpenChat={(opener) => {
                setChatOpener(opener || null)
                setChatOpen(true)
              }}
            />
          )}

          {!isPreg && phase && !hideEducational && (
            <NourishTodayCard
              phase={phase}
              onTap={() => goPhase(phase.id)}
            />
          )}

          {/* BC missing-date prompt — when she's on a method that
              needs a start date (shot, IUD, implant, pill/patch/ring)
              and we don't have it yet. Single tap into BirthControl
              to set it; the cover starts working the moment she does. */}
          {bcUsesCover && bcModel.missingStartDate && (
            <button onClick={() => go('birthControl')}
              className="alive-card frost-card"
              style={{ marginTop: 18, padding: 18, background: T.accent + '10', border: `1px solid ${T.accent}38`, borderRadius: 22, textAlign: 'left', cursor: 'pointer', width: '100%', color: T.text, fontFamily: 'inherit', display: 'block' }}>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, fontWeight: 500, color: T.accent, letterSpacing: -0.1, marginBottom: 6 }}>
                a small thing to set
              </div>
              <div style={{ fontFamily: T.serif, fontSize: 16, fontWeight: 500, lineHeight: 1.35, marginBottom: 6 }}>
                {bcModel.startDateLabel}
              </div>
              <div style={{ fontFamily: T.serif, fontSize: 13, fontStyle: 'italic', color: T.muted, lineHeight: 1.55 }}>
                Once Luna knows, the cover starts working — countdown, pack-week, the right next thing. Takes one tap.
              </div>
            </button>
          )}

          {/* BC next-thing — shot countdown, pack-week withdrawal
              bleed prediction, IUD pattern-discovery, etc. Replaces
              the natural-cycle period-prediction surfaces for hormonal
              BC users. Urgent flag (overdue shot) gets accent border. */}
          {bcUsesCover && bcModel.nextThing && !bcModel.missingStartDate && (
            <div className="alive-card frost-card" style={{
              marginTop: 18, padding: 18,
              background: bcModel.nextThing.urgent ? T.accent + '12' : 'rgba(253,250,245,0.55)',
              border: `1px solid ${bcModel.nextThing.urgent ? T.accent + '55' : 'rgba(26,19,16,0.06)'}`,
              borderRadius: 22,
              boxShadow: bcModel.nextThing.urgent ? `0 14px 30px -20px ${T.accent}55` : `0 14px 30px -22px rgba(26,19,16,0.18)`,
              textAlign: 'left',
            }}>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, fontWeight: 500, color: bcModel.nextThing.urgent ? T.accent : T.muted, letterSpacing: -0.1, marginBottom: 6 }}>
                {bcModel.nextThing.eyebrow}
              </div>
              <div style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 500, lineHeight: 1.35, marginBottom: 6 }}>
                {bcModel.nextThing.title}
              </div>
              <div style={{ fontFamily: T.serif, fontSize: 13.5, color: T.muted, lineHeight: 1.55, fontStyle: 'italic' }}>
                {bcModel.nextThing.body}
              </div>
            </div>
          )}

          {/* Catch-up nudge — surfaces when Luna's anchor is almost
              certainly stale (predicted period was 10+ days ago) or
              the user has been away for two quiet weeks. The actions
              match the problem: period selection for a stale anchor,
              today's Log for a gentle return. */}
          {showCatchUp && (
            <div className="alive-card frost-card" style={{ marginTop: 18, padding: 20, background: T.accent + '12', border: `1px solid ${T.accent}40`, borderRadius: 22, boxShadow: `0 14px 30px -20px ${T.accent}50`, textAlign: 'left' }}>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, fontWeight: 500, color: T.accent, letterSpacing: -0.1, marginBottom: 8 }}>
                {showCatchUp.kind === 'stalePeriod' ? 'a quick catch-up' : "it's been a minute"}
              </div>
              <div style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 500, marginBottom: 8, lineHeight: 1.35 }}>
                {showCatchUp.kind === 'stalePeriod'
                  ? 'Help Luna catch up on your last period.'
                  : 'Anything to log from the past few weeks?'}
              </div>
              <div style={{ fontFamily: T.sans, fontSize: 12.5, color: T.muted, lineHeight: 1.5, marginBottom: 14 }}>
                {showCatchUp.kind === 'stalePeriod'
                  ? `Luna's been working off a guess for the last ${showCatchUp.daysOver} days. A quick update sharpens every prediction from here.`
                  : `It's been ${showCatchUp.daysSince} days since you last checked in. You can start with today; only backfill what actually matters.`}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {showCatchUp.kind === 'staleLogs' && (
                  <button onClick={() => { setActiveLogDate(todayISO); go('log') }}
                    style={{ background: T.accent, color: '#fff', border: 'none', padding: '11px 18px', cursor: 'pointer', fontFamily: T.sans, fontSize: 11.5, fontWeight: 600, letterSpacing: 0.6, borderRadius: 999 }}>
                    Check in
                  </button>
                )}
                <button onClick={() => go('periodDays')}
                  style={{
                    background: showCatchUp.kind === 'stalePeriod' ? T.accent : 'transparent',
                    color: showCatchUp.kind === 'stalePeriod' ? '#fff' : T.accent,
                    border: showCatchUp.kind === 'stalePeriod' ? 'none' : `1px solid ${T.accent}40`,
                    padding: '11px 18px',
                    cursor: 'pointer',
                    fontFamily: T.sans,
                    fontSize: 11.5,
                    fontWeight: 600,
                    letterSpacing: 0.6,
                    borderRadius: 999,
                  }}>
                  {showCatchUp.kind === 'stalePeriod' ? 'Select days' : 'Mark period days'}
                </button>
              </div>
            </div>
          )}

          {/* Period-start nudge — stays as its own card so the action
              is reachable even when the Today story sits above it. */}
          {!isPreg && showPeriodCTA && (
            <div className="alive-card frost-card" style={{ marginTop: 18, padding: 20, background: T.accent + '12', border: `1px solid ${T.accent}40`, borderRadius: 22, boxShadow: `0 14px 30px -20px ${T.accent}50`, textAlign: 'left' }}>
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

          {/* Quick actions — a horizontal scroll wheel of the most
              common entries (Check in, Edit period) plus the four
              navigation cards that used to live in AlwaysHere
              (intimate / watch / cheatsheet / care). "A note" used to
              be here but is now covered by the sticky note in the
              corner, so removed to avoid redundancy. */}
          {!isPreg && (
            <QuickActions
              go={go}
            />
          )}

          {stickyNote && (
            <div style={{ marginTop: 20 }}>
              <StickyNote
                body={stickyNote.body}
                eyebrow={stickyNote.eyebrow}
                signature={stickyNote.signature}
                tapeColor={phase?.color || T.accent}
                seed={stickyNote.seed}
                isEmpty={stickyNote.isEmpty}
                onTap={stickyNote.onTap}
              />
            </div>
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
                onTap={() => go('anxiety')}
                eyebrow="A heavy day"
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
              style={{ marginTop: 14, padding: 18, borderRadius: 22, boxShadow: `0 14px 30px -20px ${T.accent}40`, textAlign: 'left', cursor: 'pointer', width: '100%', color: T.text, fontFamily: 'inherit', display: 'block' }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 1.2, fontWeight: 600, color: T.accent, marginBottom: 6 }}>
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

          {/* ─── WHAT MAKES LUNA, LUNA ────────────────────────────────
              Differentiators come FIRST after the Today story + triggered
              helpers.

              Order (intentional): Luna's voice FIRST (the morning
              thought + talk-it-through is the core differentiator
              against Flo/Clue — nobody else gives women a
              conversational companion this warm). Diary second
              (loved gimmick, but private to the user). Cycle School
              when active. Daily insight after that. */}

          {/* Adaptive: pinned condition card. Only mounts for users who
              said in onboarding that they're managing a specific
              condition AND named at least one. Leads the differentiator
              tier for them because for someone with PCOS / endo / PMDD,
              this is what they came here for. */}
          {!isPreg && pinnedConditionId && (
            <PinnedConditionCard conditionId={pinnedConditionId} go={go} />
          )}

          {/* Adaptive: reflect-first variant. When she picked "A
              private space to reflect" as a priority, the diary leads
              the differentiator tier instead of the AI thought. Her
              writing is what she came here for. */}
          {!isPreg && reflectFirst && (
            <JournalCard
              entries={store.journalEntries}
              journalTheme={settings?.journalTheme}
              phaseColor={phase?.color}
              onTap={() => go('journal')}
            />
          )}

          {/* Circle card — only for the first-cycle milestone now.
              The daily Share entry lives in the primary invitation
              row, so this larger surface appears only when there is
              an actual moment worth marking. */}
          {!isPreg && showCircleMilestoneCard && (
            <CircleCard
              phase={phase}
              settings={settings}
              updateSetting={updateSetting}
              cycle={cycle}
              go={go}
            />
          )}

          {/* The diary — multi-entry writing with photos + voice +
              customisable paper. Skipped here when reflectFirst is set
              (it already led the tier above). */}
          {!isPreg && !reflectFirst && (
            <JournalCard
              entries={store.journalEntries}
              journalTheme={settings?.journalTheme}
              phaseColor={phase?.color}
              onTap={() => go('journal')}
            />
          )}

          {/* Cycle School card — appears only when the user's current
              phase matches an enrolled school AND it's not completed.
              When it appears, it's the rarest and most distinctive
              thing on the page, so it leads. Hidden when intent is
              just-tracking — schools are body-literacy depth, not what
              that user came for. */}
          {!isPreg && phase && !hideEducational && (
            <CycleSchoolCard phase={phase} settings={settings} go={go} />
          )}

          {/* Daily body-literacy moment — Luna's "today's insights"
              equivalent, dialled back from a sourced lesson card into
              a doula quote. The title is the thing Luna would say to
              you over coffee — sourced still, but the source lives
              behind a tap, not stamped on the card. Adapts to today's
              log; rotates by cycle day. Hidden when intent is
              just-tracking — they explicitly opted out of teach moments. */}
          {!isPreg && phase && !hideEducational && (() => {
            const lesson = adaptiveLessonFor({
              phaseId: phase.id,
              cycleDay: cycle.cycleDay,
              todayLog,
              recentLogs: logs,
            })
            if (!lesson) return null
            return (
              <button onClick={() => lesson.readId ? goArticle(lesson.readId) : null}
                disabled={!lesson.readId}
                className="alive-card"
                title={lesson.source}
                style={{
                  position: 'relative',
                  marginTop: 26, padding: '16px 0 18px',
                  background: 'transparent',
                  border: 'none',
                  borderTop: '1px solid rgba(26,19,16,0.07)',
                  borderBottom: '1px solid rgba(26,19,16,0.07)',
                  borderRadius: 0,
                  boxShadow: 'none',
                  textAlign: 'left', cursor: lesson.readId ? 'pointer' : 'default',
                  width: '100%', display: 'block',
                  color: T.text, fontFamily: 'inherit',
                  overflow: 'hidden',
                }}>
                <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, fontWeight: 500, color: `color-mix(in srgb, ${phase.color}, ${T.ink} 30%)`, letterSpacing: -0.1, marginBottom: 8 }}>
                  a small thing to know
                </div>
                <div style={{ fontFamily: T.serif, fontSize: 17.5, fontStyle: 'italic', lineHeight: 1.44, color: T.text, letterSpacing: -0.25 }}>
                  {lesson.title}
                </div>
              </button>
            )
          })()}

          {/* For-Today row removed (Keep/Merge/Cut pass 1).
              The "{read time} read" card duplicated Daily Insight
              ("today's phase-curated article"); cutting it eliminates
              the dupe. Nourish + Move sub-cards are still reachable
              via PhaseDetail (which contains both as inline sections).
              The Move card also wrongly routed to Care (preventive
              checkups) — that mismatch is gone with the cut. */}

          {/* Celebration moments now live at the app level (App.jsx
              GlobalCelebration) so they show wherever the user lands. */}

          {/* The 4-slide first-run Tutorial wall was removed. Tutorials
              get skipped; in-context tips get read. Each feature now
              carries its own one-line ContextualTip the first time the
              user opens it. See src/components/ContextualTip.jsx. */}

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
              patternSummary,
            } : {}}
          />

          {/* Daily BC pill reminder, when applicable */}
          {!isPreg && <BCReminder bcMethod={birthControl?.method} wellness={wellness} markWellness={markWellness} />}

          {/* Hydration tracker removed (Keep/Merge/Cut pass 1).
              Generic-wellness off-thesis for Luna's cycle-first
              positioning — same critique as the Hydration cut in the
              landing review. The `markWellness('hydration', ...)`
              store action is still defined; future feature can reuse
              if we ever bring it back as a phase-specific surface. */}

          <div style={{ height: 16 }} />
        </div>
      </Screen>
    </div>
  )
}
