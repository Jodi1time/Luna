import { useState, useEffect } from 'react'
import { T } from '../data/theme'
import { Eyebrow, SourceLine, Icons } from '../components/shared'
import { SymptomIcon, MOOD_IDS, MOOD_LABELS, MOOD_COLORS, MOOD_TINTS } from '../components/symptomIcons'
import { SYMPTOMS, SYMPTOM_INSIGHTS } from '../data/lunaData'
import { FLOW_LESSONS, MUCUS_LESSONS, SLEEP_LESSONS, SEX_LESSONS, BBT_LESSONS } from '../data/bodyLiteracy'
import { useCycle, detectPeriodStarts } from '../hooks/useCycle'
import { PhaseFlourish } from '../components/phaseFlourishes'
import { sectionColors } from '../data/sectionPalette'
import useLuna from '../store/useLuna'
import { moodIdsOf } from '../lib/moods'
import { validateBBT } from '../lib/validation'
import { chime, bloomSound } from '../lib/sounds'
import { hapticSoft, hapticSuccess } from '../lib/haptics'

const MS_PER_DAY = 86400000

// Bleeding intensity colors — soft Luna palette, not stoplight red.
// Each step deepens slightly so the row reads as a gradient of
// intensity, not four identical chips.
const FLOW_COLORS = {
  Spotting: '#E6B5A8',
  Light:    '#D88B5A',
  Medium:   '#C84E2E',
  Heavy:    '#9A2F1A',
}

const MUCUS_OPTIONS = [
  { id: 'dry',      label: 'Dry',       sub: 'Low fertility' },
  { id: 'sticky',   label: 'Sticky',    sub: 'Low fertility' },
  { id: 'creamy',   label: 'Creamy',    sub: 'Moderate' },
  { id: 'eggwhite', label: 'Egg-white', sub: 'Peak fertility' },
  { id: 'watery',   label: 'Watery',    sub: 'High fertility' },
]

const SEX_OPTIONS = [
  { id: 'protected',   label: 'Protected' },
  { id: 'unprotected', label: 'Unprotected' },
  { id: 'none',        label: 'None' },
]

// Quiet inline lesson — replaces the labeled "Body literacy" /
// "Source:" school-card pattern. One italic-serif sentence, soft
// phase-tinted background, source available on long-press as a
// native tooltip (title attribute). Reads like a doula's aside,
// not a textbook callout.
function QuietLesson({ lesson, color, keyId }) {
  if (!lesson) return null
  return (
    <div key={keyId} title={lesson.source ? `Source · ${lesson.source}` : undefined}
      style={{
        padding: '2px 0 2px 14px',
        background: 'transparent',
        borderLeft: `2px solid ${color}70`,
        animation: 'fadeUp 0.32s ease-out both',
      }}>
      <div style={{ fontFamily: T.serif, fontSize: 14, fontStyle: 'italic', lineHeight: 1.58, color: T.text, letterSpacing: -0.08 }}>
        {lesson.body || lesson.title}
      </div>
    </div>
  )
}

function naturalList(items = []) {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
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

function daysBetweenISO(fromISO, toISO) {
  if (!fromISO || !toISO) return null
  const from = new Date(fromISO + 'T00:00:00')
  const to = new Date(toISO + 'T00:00:00')
  return Math.max(0, Math.floor((to - from) / MS_PER_DAY))
}

export default function Log() {
  const store = useLuna()
  const { back, goArticle, goSymptom, saveLog, removeLog, getLog, activeLogDate, setActiveLogDate, logs = {} } = store
  const cycle = useCycle(store)
  const phase = cycle.phase
  const todayISO = new Date().toISOString().slice(0, 10)
  // The user can land on Log with an explicit past date (Calendar tap)
  // — otherwise default to today. Never go past today.
  const initialISO = activeLogDate && activeLogDate <= todayISO ? activeLogDate : todayISO
  const [editingISO, setEditingISO] = useState(initialISO)
  const existing = getLog(editingISO) || {}
  const [moods,    setMoods]    = useState(() => {
    if (Array.isArray(existing.moods)) return existing.moods
    if (existing.mood) return [existing.mood]
    return []
  })
  const [symptoms, setSymptoms] = useState(existing.symptoms || [])
  const [flow,     setFlow]     = useState(existing.flow || null)
  const [bbt,      setBbt]      = useState(existing.bbt?.value ?? '')
  const [bbtUnit,  setBbtUnit]  = useState(existing.bbt?.unit || 'F')
  const [mucus,    setMucus]    = useState(existing.mucus || null)
  const [sex,      setSex]      = useState(existing.sex || null)
  const [sleep,    setSleep]    = useState(existing.sleep || null)
  const [note,     setNote]     = useState(existing.note || '')
  const [bbtError, setBbtError] = useState('')
  const [showOptionalDetails, setShowOptionalDetails] = useState(() => Boolean(existing.bbt?.value || existing.mucus || existing.sleep || existing.sex))
  const [savedJustNow, setSavedJustNow] = useState(false)
  // Last-tapped symptom (for the inline insight). Cleared when the
  // user untaps the same symptom or taps a different one.
  const [activeSym, setActiveSym] = useState(null)
  // Which field surfaces its body-literacy micro-teach right now.
  // Set to flow / mucus / sleep / sex / bbt when the user taps that
  // section. Cleared when they tap the same value again (deselection)
  // or pick something different in another section.
  const [teachField, setTeachField] = useState(null)

  const toggleSym = (id) => {
    setSymptoms((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id])
    setActiveSym(id)
  }

  const symInsight = (activeSym && phase) ? SYMPTOM_INSIGHTS[activeSym]?.[phase.id] : null

  // Phase-aware fertile-window detector for the sex teach lookup
  const phaseIsFertile = phase?.id === 'ovulation' || (phase?.id === 'follicular' && cycle.cycleDay >= cycle.cycleLength / 2 - 3)
  const phaseId = phase?.id || 'follicular'

  // Resolve which lesson to show, based on the field that was just tapped
  const teachLesson = (() => {
    if (!teachField) return null
    if (teachField === 'flow') {
      if (!flow) return null
      const m = FLOW_LESSONS[flow] || {}
      return m[phaseId] || m.any || null
    }
    if (teachField === 'mucus') return mucus ? MUCUS_LESSONS[mucus] || null : null
    if (teachField === 'sleep') {
      if (!sleep) return null
      const m = SLEEP_LESSONS[sleep] || {}
      return m[phaseId] || m.any || null
    }
    if (teachField === 'sex') {
      if (!sex) return null
      const m = SEX_LESSONS[sex] || {}
      return phaseIsFertile && m.fertile ? m.fertile : (m.any || null)
    }
    if (teachField === 'bbt') {
      const v = parseFloat(bbt)
      if (!v) return null
      // C → F for the threshold check
      const vF = bbtUnit === 'C' ? v * 9/5 + 32 : v
      if (vF >= 98.6) return BBT_LESSONS.high
      if (phaseId === 'luteal' || phaseId === 'ovulation') return BBT_LESSONS.post
      return BBT_LESSONS.pre
    }
    return null
  })()

  // When the user navigates to a different date in-screen, re-load
  // that date's existing log into the form state so it shows as the
  // user actually saved it (rather than carrying the previous day's
  // values over).
  useEffect(() => {
    const log = getLog(editingISO) || {}
    setMoods(Array.isArray(log.moods) ? log.moods : (log.mood ? [log.mood] : []))
    setSymptoms(log.symptoms || [])
    setFlow(log.flow || null)
    setBbt(log.bbt?.value ?? '')
    setBbtUnit(log.bbt?.unit || 'F')
    setMucus(log.mucus || null)
    setSex(log.sex || null)
    setSleep(log.sleep || null)
    setNote(log.note || '')
    setBbtError('')
    setShowOptionalDetails(Boolean(log.bbt?.value || log.mucus || log.sleep || log.sex))
    setActiveSym(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingISO])

  // Date navigation — bound to <= today.
  const shiftDate = (delta) => {
    const d = new Date(editingISO + 'T12:00:00')
    d.setDate(d.getDate() + delta)
    const next = d.toISOString().slice(0, 10)
    if (next > todayISO) return
    setEditingISO(next)
  }
  const canGoNext = editingISO < todayISO
  const optionalDetailsChosen = [
    sleep ? 'sleep' : null,
    sex ? 'sex' : null,
    bbt ? 'temperature' : null,
    mucus ? 'discharge' : null,
  ].filter(Boolean)
  const toggleOptionalDetails = () => {
    if (showOptionalDetails && ['bbt', 'mucus', 'sleep', 'sex'].includes(teachField)) setTeachField(null)
    setShowOptionalDetails((open) => !open)
  }

  // Clear the explicit-date intent when leaving Log so the next visit
  // defaults to today (unless the user picks a date again).
  const handleBack = () => {
    setActiveLogDate(null)
    back()
  }

  const save = () => {
    const bbtErr = validateBBT(bbt, bbtUnit)
    if (bbtErr) {
      setBbtError(bbtErr)
      setShowOptionalDetails(true)
      return
    }
    setBbtError('')
    const bbtNum = parseFloat(bbt)
    const bbtPayload = !isNaN(bbtNum) && bbt !== '' ? { value: bbtNum, unit: bbtUnit } : null
    // Before saving, check whether this save will be a new period
    // start (so we can fire the celebration). A new start = flow is
    // set (not Spotting), wasn't a flow day before, and is the first
    // day of a 1-day flow stretch that's >7 days after the previous.
    const wasNewPeriodStart = (() => {
      if (!flow || flow === 'Spotting') return false
      if (existing.flow && existing.flow !== 'Spotting') return false
      const allLogs = useLuna.getState().logs
      const prevStarts = detectPeriodStarts(allLogs)
      const latestStart = prevStarts[prevStarts.length - 1]
      if (!latestStart) return true
      const days = (new Date(editingISO + 'T00:00:00') - new Date(latestStart + 'T00:00:00')) / 86400000
      return days > 7
    })()
    saveLog(editingISO, { moods, mood: moods[0] || null, symptoms, flow, bbt: bbtPayload, mucus, sex, sleep, note })
    // Sounds — gated on the user's settings.sounds toggle.
    const soundsOn = Boolean(useLuna.getState().settings?.sounds)
    if (wasNewPeriodStart) bloomSound(soundsOn)
    else chime(soundsOn)
    // Haptics — soft tap for an ordinary save, success notification
    // for a first-of-period save. No-op on web.
    if (wasNewPeriodStart) hapticSuccess()
    else hapticSoft()
    // Celebration — period day one only fires this overlay.
    if (wasNewPeriodStart) {
      useLuna.setState({ celebration: 'day-one' })
    }
    // Visual save-success pulse on the Save button briefly.
    setSavedJustNow(true)
    setTimeout(() => setSavedJustNow(false), 600)
    // Analytics: which CATEGORIES of fields were filled, not contents.
    // Fire-and-forget — never block navigation on analytics.
    import('../lib/posthog').then(({ capture }) => capture('log_saved', {
      has_mood: moods.length > 0,
      mood_count: moods.length,
      symptom_count: (symptoms || []).length,
      has_flow: Boolean(flow),
      has_bbt: Boolean(bbtPayload),
      has_mucus: Boolean(mucus),
      has_sex: Boolean(sex),
      has_sleep: Boolean(sleep),
      has_note: Boolean((note || '').trim().length),
    })).catch(() => {})
    // Brief delay so the save-pulse animation has time to play
    // before we leave the screen.
    setTimeout(() => {
      setActiveLogDate(null)
      back()
    }, 480)
  }

  const dateLabel = new Date(editingISO + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })
  const isToday = editingISO === todayISO
  const returnContext = (() => {
    if (!isToday || logHasContent(existing)) return null
    const loggedDates = Object.keys(logs)
      .filter((iso) => iso < todayISO && logHasContent(logs[iso]))
      .sort()
    const lastLoggedISO = loggedDates[loggedDates.length - 1]
    const daysAway = daysBetweenISO(lastLoggedISO, todayISO)
    if (!daysAway || daysAway < 3) return null
    if (daysAway >= 14) {
      return {
        tone: 'long',
        title: <>Start with <em>today.</em></>,
        body: 'No need to rebuild the missing weeks. One honest detail gives Luna a new anchor.',
        note: 'If your period dates changed, mark those separately when you feel ready.',
      }
    }
    return {
      tone: 'soft',
      title: <>Just <em>today</em> is enough.</>,
      body: 'The quiet days can stay quiet. Add whatever feels useful right now.',
      note: 'Even one tap helps Luna understand the shape of this week.',
    }
  })()
  // Phase-aware accent — when Luna knows the user's phase, the form
  // tints itself to that color. Today's phase becomes the Log's
  // visual key (selection borders, save button, dividers, flourishes).
  // Falls back to the brand accent when no phase is known yet.
  const acc = phase?.color || T.accent
  const topSummary = (() => {
    const parts = [
      moods.length ? 'mood' : null,
      symptoms.length ? 'symptoms' : null,
      flow ? 'bleeding' : null,
      note.trim() ? 'a note' : null,
      optionalDetailsChosen.length ? 'more detail' : null,
    ].filter(Boolean)
    if (parts.length === 0) return returnContext ? '' : 'Start with what felt obvious. Leave the rest alone.'
    return `So far: ${naturalList(parts)}.`
  })()

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: T.bg, color: T.text, animation: 'fadeUp .3s ease-out both', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 22px 30px' }}>
        {/* Header — soft date stepper. Date is a glass chip in the
            center, navigation chevrons are circular tap targets,
            close + save sit on the outer edges. */}
        <div className="insight-stagger" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0 0', fontFamily: T.sans, animationDelay: '0ms' }}>
          <button onClick={handleBack} aria-label="Close" className="alive-card"
            style={{ background: 'rgba(253,250,245,0.5)', border: '1px solid rgba(26,19,16,0.06)', borderRadius: 999, cursor: 'pointer', color: T.muted, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}>{Icons.close}</button>
          <div className="frost-card" style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(253,250,245,0.55)', border: '1px solid rgba(26,19,16,0.06)', borderRadius: 999, padding: '2px 4px' }}>
            <button onClick={() => shiftDate(-1)} aria-label="Previous day"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.text, fontSize: 16, padding: '4px 10px', fontFamily: T.serif, borderRadius: 999 }}>‹</button>
            <div style={{ fontSize: 13, color: isToday ? T.text : acc, fontFamily: T.serif, fontStyle: 'italic', minWidth: 130, textAlign: 'center', letterSpacing: -0.1, padding: '4px 0' }}>
              {isToday ? 'today' : dateLabel.toLowerCase()}
            </div>
            <button onClick={() => shiftDate(1)} disabled={!canGoNext} aria-label="Next day"
              style={{ background: 'transparent', border: 'none', cursor: canGoNext ? 'pointer' : 'default', color: canGoNext ? T.text : 'rgba(26,19,16,0.18)', fontSize: 16, padding: '4px 10px', fontFamily: T.serif, borderRadius: 999 }}>›</button>
          </div>
          <button onClick={save} className={`alive-card${savedJustNow ? ' save-bloom' : ''}`}
            style={{
              background: acc, border: 'none', cursor: 'pointer', color: '#fff',
              padding: '8px 16px', fontWeight: 600, fontSize: 12.5,
              letterSpacing: 0.3, fontFamily: T.sans, borderRadius: 999,
              boxShadow: `0 10px 22px -10px ${acc}80`,
              // Phase-tinted bloom — the ring that emanates outward
              // on save picks up today's phase colour at ~50% alpha.
              '--save-bloom-color': `${acc}80`,
            }}>
            {savedJustNow ? '✓  Saved' : 'Save'}
          </button>
        </div>

        {/* Title row + phase flourish so the page opens with a sign
            of life, matched to the day's phase color. */}
        <div className="insight-stagger" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, margin: '18px 0 6px', animationDelay: '40ms' }}>
          <div style={{ fontFamily: T.serif, fontSize: 31, fontWeight: 500, letterSpacing: -0.65, lineHeight: 1.08, flex: 1, minWidth: 0, textWrap: 'balance' }}>
            {returnContext ? returnContext.title : (isToday ? <>What stood out <em>today?</em></> : <>What stood out <em>that day?</em></>)}
          </div>
          {phase && (
            <div aria-hidden="true" style={{ color: acc, opacity: 0.55, paddingTop: 4 }}>
              <PhaseFlourish phaseId={phase.id} size={26} />
            </div>
          )}
        </div>
        <div className="insight-stagger" style={{ fontSize: 14, color: T.muted, marginBottom: 24, fontFamily: T.serif, lineHeight: 1.55, fontStyle: 'italic', animationDelay: '90ms' }}>
          {isToday
            ? <>{returnContext ? returnContext.body : 'Whatever you noticed. None of this needs to be complete.'}</>
            : <>You can fill in what you remember — or change what you'd logged. Use the arrows above to move to another day.</>}
          {topSummary && (
            <div style={{ marginTop: 8, color: T.muted, fontSize: 13.5 }}>
              {topSummary}
            </div>
          )}
        </div>

        {returnContext && (
          <div className="insight-stagger"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              margin: '-8px 0 24px',
              padding: '13px 14px',
              background: 'rgba(253,250,245,0.5)',
              border: `1px solid ${acc}22`,
              borderRadius: 18,
              boxShadow: '0 14px 34px -30px rgba(88,56,38,0.45)',
              animationDelay: '112ms',
            }}>
            <span aria-hidden="true"
              style={{
                width: 30,
                height: 30,
                borderRadius: 13,
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `${acc}14`,
                color: acc,
                fontFamily: T.serif,
                fontSize: 17,
                lineHeight: 1,
              }}>
              {returnContext.tone === 'long' ? '·' : '◦'}
            </span>
            <div style={{ minWidth: 0, fontFamily: T.serif, fontStyle: 'italic', fontSize: 13.5, lineHeight: 1.5, color: T.text }}>
              {returnContext.note}
            </div>
          </div>
        )}

        {/* Mood — flat one-tap choices with each mood's own color tint */}
        <div className="insight-stagger" style={{ animationDelay: '140ms' }}>
        <Eyebrow color={acc}>How you're feeling</Eyebrow>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, gap: 6 }}>
          {MOOD_IDS.map((id) => {
            const moodAccent = MOOD_COLORS[id] || acc
            const moodTint   = MOOD_TINTS[id]
            const on = moods.includes(id)
            return (
              <button key={id} onClick={() => setMoods((m) => m.includes(id) ? m.filter((x) => x !== id) : [...m, id])}
                className={`alive-card${on ? ' tap-bloom' : ''}`}
                style={{
                  flex: 1,
                  minHeight: 74,
                  border: `1px solid ${on ? moodAccent + '42' : 'transparent'}`,
                  cursor: 'pointer',
                  padding: '10px 4px 9px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
                  background: on ? moodTint : 'transparent',
                  color: on ? moodAccent : T.text,
                  borderRadius: 16, fontFamily: 'inherit',
                  boxShadow: 'none',
                  transition: 'background 0.2s var(--ease-out), color 0.2s var(--ease-out), border-color 0.2s var(--ease-out)',
                }}>
                <span style={{
                  width: 30, height: 30, borderRadius: 13,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: on ? `${moodAccent}20` : 'rgba(26,19,16,0.035)',
                  color: on ? moodAccent : T.muted,
                }}>
                  <SymptomIcon id={id} size={18} />
                </span>
                <span style={{ fontSize: 11, fontWeight: on ? 650 : 500, letterSpacing: 0.15 }}>{MOOD_LABELS[id]}</span>
              </button>
            )
          })}
        </div>
        </div>

        {/* Symptoms — compact body signals without card-heavy chrome */}
        <div className="insight-stagger" style={{ animationDelay: '180ms' }}>
        <Eyebrow color={acc}>What your body's telling you</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 24 }}>
          {Object.entries(SYMPTOMS).slice(0, 8).map(([id, s]) => {
            const on = symptoms.includes(id)
            const bodyColors = sectionColors('body')
            return (
              <div key={`${id}-${on ? 'on' : 'off'}`}
                className={`alive-card${on && activeSym === id ? ' tap-bloom' : ''}`}
                style={{
                  border: `1px solid ${on ? acc + '42' : 'transparent'}`,
                  background: on ? acc + '10' : 'transparent',
                  padding: '12px 4px 9px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  position: 'relative',
                  borderRadius: 16,
                  boxShadow: 'none',
                  transition: 'background 0.2s var(--ease-out), border-color 0.2s var(--ease-out), color 0.2s var(--ease-out)',
                }}>
                <button onClick={() => toggleSym(id)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, fontFamily: 'inherit', color: on ? acc : T.text, padding: 0, width: '100%' }}>
                  <span style={{
                    width: 30, height: 30, borderRadius: 13,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    background: on ? `${acc}18` : `${bodyColors.accent}10`,
                    color: on ? acc : T.muted,
                  }}>
                    <SymptomIcon id={id} size={18} />
                  </span>
                  <span style={{ fontSize: 11, fontWeight: on ? 650 : 500, lineHeight: 1.2 }}>{s.label}</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); goSymptom(id) }}
                  aria-label={`Learn about ${s.label}`}
                  style={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, padding: 0, background: 'transparent', border: 'none', borderRadius: 999, cursor: 'pointer', color: T.muted, fontSize: 11, fontFamily: T.serif, fontStyle: 'italic', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.72 }}>
                  ?
                </button>
              </div>
            )
          })}
        </div>
        </div>

        {/* PCOS-relevant symptom row — only mounts when user said
            in onboarding they're managing PCOS. PCOS-specific signals
            (hirsutism, scalp thinning, acanthosis, sugar cravings,
            post-meal energy crashes) don't fit the universal 8-grid
            but are load-bearing for PCOS users. Same tap-to-toggle +
            ? for literacy as the main row. */}
        {(useLuna.getState().settings?.conditions || []).includes('pcos') && (
          <div className="insight-stagger" style={{ animationDelay: '195ms', marginTop: -8, marginBottom: 24 }}>
            <Eyebrow color={acc}>For your PCOS</Eyebrow>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {['hirsutism', 'scalpThinning', 'acanthosis', 'sugarCraving', 'energyCrash'].map((id) => {
                const s = SYMPTOMS[id]
                if (!s) return null
                const on = symptoms.includes(id)
                const planColors = sectionColors('plan')
                return (
                  <div key={`${id}-${on ? 'on' : 'off'}`}
                    className={`alive-card${on && activeSym === id ? ' tap-bloom' : ''}`}
                    style={{
                      border: `1px solid ${on ? planColors.accent + '42' : 'transparent'}`,
                      background: on ? planColors.accent + '10' : 'transparent',
                      padding: '10px 4px 8px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                      position: 'relative',
                      borderRadius: 14,
                      boxShadow: 'none',
                      transition: 'background 0.2s var(--ease-out), border-color 0.2s var(--ease-out), color 0.2s var(--ease-out)',
                    }}>
                    <button onClick={() => toggleSym(id)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, fontFamily: 'inherit', color: on ? planColors.accent : T.text, padding: 0, width: '100%' }}>
                      <span style={{
                        width: 26, height: 26, borderRadius: 11,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        background: on ? `${planColors.accent}18` : `${planColors.accent}10`,
                        color: on ? planColors.accent : T.muted,
                      }}>
                        <SymptomIcon id={id} size={16} />
                      </span>
                      <span style={{ fontSize: 11, fontWeight: on ? 650 : 500, lineHeight: 1.15, textAlign: 'center', padding: '0 2px' }}>{s.label}</span>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Phase-aware insight for the last-tapped symptom — same pattern
            as the mood-tap insights on Home. */}
        {symInsight && (
          <div key={`${phase?.id}-${activeSym}`}
            style={{
              marginTop: -8,
              marginBottom: 24,
              padding: '2px 0 2px 14px',
              background: 'transparent',
              borderLeft: `2px solid ${acc}70`,
              animation: 'fadeUp 0.35s ease-out both',
            }}>
            <div style={{ fontFamily: T.serif, fontSize: 14.5, lineHeight: 1.58, color: T.text, fontStyle: 'italic', letterSpacing: -0.05 }}>
              {symInsight.text}
            </div>
            {symInsight.read && (
              <button onClick={() => goArticle(symInsight.read)}
                style={{ marginTop: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: acc, fontSize: 12, fontWeight: 600, letterSpacing: 0.25, fontFamily: T.sans, padding: 0 }}>
                Read more →
              </button>
            )}
          </div>
        )}

        {/* Flow — intensity gradient. Spotting is soft peach, Heavy
            is deep terracotta. The row reads as a scale, not four
            identical buttons. Selected = filled with that intensity. */}
        <div className="insight-stagger" style={{ animationDelay: '220ms' }}>
        <Eyebrow color={acc}>Bleeding</Eyebrow>
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {['Spotting','Light','Medium','Heavy'].map((f) => {
            const on = flow === f
            const fc = FLOW_COLORS[f]
            return (
              <button key={f} onClick={() => {
                setFlow(on ? null : f)
                setTeachField(on ? null : 'flow')
              }}
                className="alive-card"
                style={{
                  flex: 1,
                  border: `1px solid ${on ? fc : `${fc}28`}`,
                  background: on ? fc : `${fc}09`,
                  color: on ? '#fff' : T.text,
                  padding: '14px 4px',
                  cursor: 'pointer',
                  fontFamily: T.sans, fontSize: 12, letterSpacing: 0.2, fontWeight: 500,
                  borderRadius: 14,
                  boxShadow: 'none',
                  transition: 'background 0.2s var(--ease-out), color 0.2s var(--ease-out), border-color 0.2s var(--ease-out)',
                }}>
                {f}
              </button>
            )
          })}
        </div>
        {teachField === 'flow' && teachLesson && (
          <div style={{ marginTop: -10, marginBottom: 24 }}>
            <QuietLesson lesson={teachLesson} color={acc} keyId={`flow-${flow}-${phaseId}`} />
          </div>
        )}
        </div>

        <div className="insight-stagger" style={{ animationDelay: '250ms' }}>
        <Eyebrow color={acc}>Anything else on your mind</Eyebrow>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="A line, a sentence — whatever you want to remember."
          maxLength={2000}
          className="frost-card"
          style={{ width: '100%', background: 'rgba(253,250,245,0.55)', border: `1px solid rgba(26,19,16,0.08)`, padding: 16, fontSize: 14.5, lineHeight: 1.6, color: T.text, minHeight: 96, borderRadius: 18, fontFamily: T.serif, fontStyle: 'italic', outline: 'none', resize: 'vertical' }}
          onFocus={(e) => { e.target.style.borderColor = acc; e.target.style.boxShadow = `0 0 0 3px ${acc}18` }}
          onBlur={(e)  => { e.target.style.borderColor = 'rgba(26,19,16,0.08)'; e.target.style.boxShadow = 'none' }} />
        {note.length > 1900 && (
          <div style={{ fontSize: 11, fontFamily: T.serif, fontStyle: 'italic', color: T.muted, textAlign: 'right', marginTop: 6 }}>
            {note.length} / 2000
          </div>
        )}
        </div>

        <div className="insight-stagger" style={{ animationDelay: '260ms', marginBottom: showOptionalDetails ? 22 : 24, marginTop: 24 }}>
          <button
            type="button"
            onClick={toggleOptionalDetails}
            aria-expanded={showOptionalDetails}
            className="alive-card"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '15px 0',
              background: 'transparent',
              border: 'none',
              borderTop: '1px solid rgba(26,19,16,0.07)',
              borderBottom: '1px solid rgba(26,19,16,0.07)',
              borderRadius: 0,
              cursor: 'pointer',
              color: T.text,
              fontFamily: T.sans,
              boxShadow: 'none',
            }}>
            <span style={{ minWidth: 0, textAlign: 'left' }}>
              <span style={{ display: 'block', fontFamily: T.serif, fontSize: 16, fontStyle: 'italic', color: T.text, lineHeight: 1.2 }}>
                More detail, if you want it
              </span>
              <span style={{ display: 'block', marginTop: 3, color: T.muted, fontSize: 12.5, lineHeight: 1.35 }}>
                {showOptionalDetails
                  ? 'Sleep, sex, temperature, and discharge are open.'
                  : optionalDetailsChosen.length
                    ? `You've added ${naturalList(optionalDetailsChosen)}.`
                    : 'Sleep, sex, temperature, and discharge only if useful.'}
              </span>
            </span>
            <span aria-hidden="true" style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 13, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: showOptionalDetails ? `${acc}14` : 'rgba(26,19,16,0.04)', color: showOptionalDetails ? acc : T.text, fontSize: 18, lineHeight: 1 }}>
              {showOptionalDetails ? '−' : '+'}
            </span>
          </button>
        </div>

        {showOptionalDetails && (
          <>
            <div className="insight-stagger" style={{ animationDelay: '272ms' }}>
            <Eyebrow color={acc}>How you slept</Eyebrow>
            <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
              {['Great','Okay','Restless','Poor'].map((s) => {
                const on = sleep === s
                return (
                  <button key={s} onClick={() => {
                    setSleep(on ? null : s)
                    setTeachField(on ? null : 'sleep')
                  }}
                    className="alive-card"
                    style={{ flex: 1, border: `1px solid ${on ? acc : 'transparent'}`, background: on ? acc : 'transparent', color: on ? '#fff' : T.text, padding: '14px 4px', cursor: 'pointer', fontFamily: T.sans, fontSize: 12, letterSpacing: 0.2, fontWeight: on ? 650 : 500, borderRadius: 14, boxShadow: 'none', transition: 'background 0.2s var(--ease-out), color 0.2s var(--ease-out), border-color 0.2s var(--ease-out)' }}>
                    {s}
                  </button>
                )
              })}
            </div>
            {teachField === 'sleep' && teachLesson && (
              <div style={{ marginTop: -10, marginBottom: 24 }}>
                <QuietLesson lesson={teachLesson} color={acc} keyId={`sleep-${sleep}-${phaseId}`} />
              </div>
            )}
            </div>

            <div className="insight-stagger" style={{ animationDelay: '280ms' }}>
            <Eyebrow color={acc}>Sex</Eyebrow>
            <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
              {SEX_OPTIONS.map((s) => {
                const on = sex === s.id
                return (
                  <button key={s.id} onClick={() => {
                    setSex(on ? null : s.id)
                    setTeachField(on ? null : 'sex')
                  }}
                    className="alive-card"
                    style={{ flex: 1, border: `1px solid ${on ? acc : 'transparent'}`, background: on ? acc : 'transparent', color: on ? '#fff' : T.text, padding: '14px 4px', cursor: 'pointer', fontFamily: T.sans, fontSize: 11, letterSpacing: 0.3, fontWeight: on ? 650 : 500, borderRadius: 14, boxShadow: 'none', transition: 'background 0.2s var(--ease-out), color 0.2s var(--ease-out), border-color 0.2s var(--ease-out)' }}>
                    {s.label}
                  </button>
                )
              })}
            </div>
            {teachField === 'sex' && teachLesson && (
              <div style={{ marginTop: -10, marginBottom: 24 }}>
                <QuietLesson lesson={teachLesson} color={acc} keyId={`sex-${sex}-${phaseId}`} />
              </div>
            )}
            </div>

            {/* Temperature (BBT) — frosted input + segmented unit toggle */}
            <div className="insight-stagger" style={{ animationDelay: '290ms' }}>
            <Eyebrow color={acc}>Your morning temperature</Eyebrow>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={bbt}
                onChange={(e) => { setBbt(e.target.value); if (bbtError) setBbtError(''); setTeachField(e.target.value ? 'bbt' : null) }}
                placeholder={bbtUnit === 'F' ? '97.8' : '36.5'}
                style={{ flex: 1, background: 'rgba(253,250,245,0.55)', border: `1px solid ${bbtError ? T.accent : 'rgba(26,19,16,0.08)'}`, borderRadius: 16, padding: '14px 16px', fontSize: 16, fontFamily: T.sans, color: T.text, outline: 'none', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
                onFocus={(e) => { e.target.style.borderColor = acc; e.target.style.boxShadow = `0 0 0 3px ${acc}18` }}
                onBlur={(e)  => { e.target.style.borderColor = bbtError ? T.accent : 'rgba(26,19,16,0.08)'; e.target.style.boxShadow = 'none' }}
              />
              <div className="frost-card" style={{ display: 'flex', background: 'rgba(253,250,245,0.55)', border: '1px solid rgba(26,19,16,0.06)', borderRadius: 999, padding: 3 }}>
                {['F','C'].map((u) => (
                  <button key={u} onClick={() => { setBbtUnit(u); if (bbtError) setBbtError('') }}
                    style={{ background: bbtUnit === u ? T.text : 'transparent', color: bbtUnit === u ? T.bg : T.text, border: 'none', padding: '9px 14px', cursor: 'pointer', fontFamily: T.sans, fontSize: 11, fontWeight: 600, letterSpacing: 0.3, borderRadius: 999, transition: 'all 0.2s var(--ease-out)' }}>
                    °{u}
                  </button>
                ))}
              </div>
            </div>
            {bbtError && (
              <div className="frost-card" style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: T.accent, lineHeight: 1.5, padding: '12px 14px', background: T.accent + '14', border: `1px solid ${T.accent}40`, borderRadius: 14, marginTop: 8, marginBottom: 8 }}>
                {bbtError}
              </div>
            )}
            <div style={{ fontSize: 12.5, color: T.muted, fontFamily: T.serif, lineHeight: 1.6, marginBottom: 12, fontStyle: 'italic' }}>
              Take it first thing in the morning, before sitting up. It rises about 0.5°F after ovulation. That's how Luna learns your pattern.
            </div>
            {teachField === 'bbt' && teachLesson && (
              <div style={{ marginBottom: 24 }}>
                <QuietLesson lesson={teachLesson} color={acc} keyId={`bbt-${bbt}-${phaseId}`} />
              </div>
            )}
            </div>

            {/* Discharge — frosted soft cards with care tint */}
            <div className="insight-stagger" style={{ animationDelay: '310ms' }}>
            <Eyebrow color={acc}>Discharge</Eyebrow>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 24 }}>
              {MUCUS_OPTIONS.map((m) => {
                const on = mucus === m.id
                return (
                  <button key={m.id} onClick={() => {
                    setMucus(on ? null : m.id)
                    setTeachField(on ? null : 'mucus')
                  }}
                    className="alive-card"
                    style={{
                      border: `1px solid ${on ? acc + '42' : 'transparent'}`,
                      background: on ? acc + '10' : 'transparent',
                      color: on ? acc : T.text,
                      padding: '12px 4px',
                      cursor: 'pointer', fontFamily: T.sans, fontSize: 11, fontWeight: 600,
                      borderRadius: 14,
                      boxShadow: 'none',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                      transition: 'background 0.2s var(--ease-out), color 0.2s var(--ease-out), border-color 0.2s var(--ease-out)',
                    }}>
                    <span style={{ fontSize: 11.5, fontWeight: 600, fontFamily: T.serif, letterSpacing: -0.1 }}>{m.label}</span>
                    <span style={{ fontSize: 11, color: T.muted, fontStyle: 'italic', fontFamily: T.serif, lineHeight: 1.2 }}>{m.sub}</span>
                  </button>
                )
              })}
            </div>
            {teachField === 'mucus' && teachLesson && (
              <div style={{ marginTop: -10, marginBottom: 24 }}>
                <QuietLesson lesson={teachLesson} color={acc} keyId={`mucus-${mucus}`} />
              </div>
            )}
            </div>
          </>
        )}

        <div style={{ marginTop: 20, fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, color: T.muted, lineHeight: 1.6, paddingTop: 14, borderTop: '1px solid rgba(26,19,16,0.05)' }}>
          Tracked over time, this is what gives a doctor something concrete to work with.
        </div>

        {/* Quiet undo path — if the user logged something on the wrong
            day, or wants to start fresh, let them empty this day's
            entry entirely. Confirmation prompt so it's not accidental. */}
        <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid rgba(26,19,16,0.06)' }}>
          <div style={{ fontFamily: T.serif, fontSize: 13, color: T.muted, fontStyle: 'italic', lineHeight: 1.55, marginBottom: 12 }}>
            Tapped the wrong thing? Take it back — your future self won't mind.
          </div>
          <button
            className="alive-card"
            onClick={() => {
              const friendly = isToday ? 'today' : dateLabel
              if (!window.confirm(`Clear everything you have logged for ${friendly}? This removes the whole entry.`)) return
              removeLog(editingISO)
              setActiveLogDate(null)
              back()
            }}
            style={{ width: '100%', background: 'transparent', border: `1px solid ${T.accent}30`, color: T.accent, padding: '13px 16px', borderRadius: 14, cursor: 'pointer', fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, letterSpacing: 0.25, boxShadow: 'none' }}>
            Clear this day's entry
          </button>
        </div>
      </div>
    </div>
  )
}
