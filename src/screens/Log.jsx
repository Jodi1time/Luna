import { useState, useEffect } from 'react'
import { T } from '../data/theme'
import { Eyebrow, Icons } from '../components/shared'
import { SymptomIcon, MOOD_IDS, MOOD_LABELS, MOOD_COLORS, MOOD_TINTS } from '../components/symptomIcons'
import { SYMPTOMS, SYMPTOM_INSIGHTS } from '../data/lunaData'
import { FLOW_LESSONS, MUCUS_LESSONS, SLEEP_LESSONS, SEX_LESSONS, BBT_LESSONS } from '../data/bodyLiteracy'
import { useCycle, detectPeriodStarts } from '../hooks/useCycle'
import { PhaseFlourish } from '../components/phaseFlourishes'
import { sectionColors, sectionPaper } from '../data/sectionPalette'
import useLuna from '../store/useLuna'
import { validateBBT } from '../lib/validation'
import { chime, bloomSound } from '../lib/sounds'
import { todayKey, toDateKey } from '../lib/dateOnly'

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
    <div key={keyId} className="frost-card" title={lesson.source ? `Source · ${lesson.source}` : undefined}
      style={{
        padding: '12px 14px',
        background: `linear-gradient(160deg, ${color}0d, rgba(253,250,245,0.45))`,
        border: `1px solid ${color}1f`,
        borderRadius: 16,
        animation: 'fadeUp 0.32s ease-out both',
      }}>
      <div style={{ fontFamily: T.serif, fontSize: 14, fontStyle: 'italic', lineHeight: 1.55, color: T.text, letterSpacing: -0.1 }}>
        {lesson.body || lesson.title}
      </div>
    </div>
  )
}

export default function Log() {
  const store = useLuna()
  const { back, goArticle, goSymptom, saveLog, removeLog, getLog, activeLogDate, setActiveLogDate } = store
  const cycle = useCycle(store)
  const phase = cycle.phase
  const todayISO = todayKey()
  // The user can land on Log with an explicit past date (Calendar tap)
  // — otherwise default to today. Never go past today.
  const initialISO = activeLogDate && activeLogDate <= todayISO ? activeLogDate : todayISO
  const [editingISO, setEditingISO] = useState(initialISO)
  const existing = getLog(editingISO) || {}
  const [mood,     setMood]     = useState(existing.mood || null)
  const [symptoms, setSymptoms] = useState(existing.symptoms || [])
  const [flow,     setFlow]     = useState(existing.flow || null)
  const [bbt,      setBbt]      = useState(existing.bbt?.value ?? '')
  const [bbtUnit,  setBbtUnit]  = useState(existing.bbt?.unit || 'F')
  const [mucus,    setMucus]    = useState(existing.mucus || null)
  const [sex,      setSex]      = useState(existing.sex || null)
  const [sleep,    setSleep]    = useState(existing.sleep || null)
  const [note,     setNote]     = useState(existing.note || '')
  const [bbtError, setBbtError] = useState('')
  const [savedJustNow, setSavedJustNow] = useState(false)
  const [showPredictionSignals, setShowPredictionSignals] = useState(Boolean(
    existing.bbt || existing.mucus || existing.sleep || existing.sex
  ))
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
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const log = getLog(editingISO) || {}
    setMood(log.mood || null)
    setSymptoms(log.symptoms || [])
    setFlow(log.flow || null)
    setBbt(log.bbt?.value ?? '')
    setBbtUnit(log.bbt?.unit || 'F')
    setMucus(log.mucus || null)
    setSex(log.sex || null)
    setSleep(log.sleep || null)
    setNote(log.note || '')
    setBbtError('')
    setShowPredictionSignals(Boolean(log.bbt || log.mucus || log.sleep || log.sex))
    setActiveSym(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingISO])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Date navigation — bound to <= today.
  const shiftDate = (delta) => {
    const d = new Date(editingISO + 'T12:00:00')
    d.setDate(d.getDate() + delta)
    const next = toDateKey(d)
    if (next > todayISO) return
    setEditingISO(next)
  }
  const canGoNext = editingISO < todayISO

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
      setShowPredictionSignals(true)
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
    saveLog(editingISO, { mood, symptoms, flow, bbt: bbtPayload, mucus, sex, sleep, note })
    // Sounds — gated on the user's settings.sounds toggle.
    const soundsOn = Boolean(useLuna.getState().settings?.sounds)
    if (wasNewPeriodStart) bloomSound(soundsOn)
    else chime(soundsOn)
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
      has_mood: Boolean(mood),
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
  // Phase-aware accent — when Luna knows the user's phase, the form
  // tints itself to that color. Today's phase becomes the Log's
  // visual key (selection borders, save button, dividers, flourishes).
  // Falls back to the brand accent when no phase is known yet.
  const acc = phase?.color || T.accent
  const predictionSignalCount = [bbt, mucus, sleep, sex].filter(Boolean).length

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
        <div className="insight-stagger" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, margin: '16px 0 6px', animationDelay: '40ms' }}>
          <div style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, flex: 1, minWidth: 0 }}>
            {isToday ? <>Tell me about<br /><em>your day.</em></> : <>How was<br /><em>that day?</em></>}
          </div>
          {phase && (
            <div aria-hidden="true" style={{ color: acc, opacity: 0.55, paddingTop: 4 }}>
              <PhaseFlourish phaseId={phase.id} size={26} />
            </div>
          )}
        </div>
        <div className="insight-stagger" style={{ fontSize: 14, color: T.muted, marginBottom: 24, fontFamily: T.serif, lineHeight: 1.55, fontStyle: 'italic', animationDelay: '90ms' }}>
          {isToday
            ? <>Whatever you noticed. None of these are required.</>
            : <>You can fill in what you remember — or change what you'd logged. Use the arrows above to move to another day.</>}
        </div>

        {/* Mood — frosted soft pills with each mood's own color tint */}
        <div className="insight-stagger" style={{ animationDelay: '140ms' }}>
        <Eyebrow color={acc}>How you're feeling</Eyebrow>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, gap: 6 }}>
          {MOOD_IDS.map((id) => {
            const moodAccent = MOOD_COLORS[id] || acc
            const moodTint   = MOOD_TINTS[id]
            const on = mood === id
            return (
              <button key={id} onClick={() => setMood(on ? null : id)} aria-pressed={on}
                className={`alive-card frost-card${on ? ' tap-bloom' : ''}`}
                style={{
                  flex: 1,
                  border: `1px solid ${on ? moodAccent + '55' : 'rgba(26,19,16,0.06)'}`,
                  cursor: 'pointer',
                  padding: '12px 4px 10px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
                  background: on ? moodTint : 'rgba(253,250,245,0.55)',
                  color: on ? moodAccent : T.text,
                  borderRadius: 18, fontFamily: 'inherit',
                  boxShadow: on ? `0 12px 22px -16px ${moodAccent}80` : '0 10px 22px -22px rgba(26,19,16,0.18)',
                  transition: 'background 0.2s var(--ease-out), color 0.2s var(--ease-out), border-color 0.2s var(--ease-out), box-shadow 0.2s var(--ease-out)',
                }}>
                <span style={{
                  width: 30, height: 30, borderRadius: 999,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: on ? `${moodAccent}24` : `${moodAccent}12`,
                  color: moodAccent,
                }}>
                  <SymptomIcon id={id} size={18} />
                </span>
                <span style={{ fontSize: 9.5, fontWeight: 500, letterSpacing: 0.2 }}>{MOOD_LABELS[id]}</span>
              </button>
            )
          })}
        </div>
        </div>

        {/* Symptoms — frosted body-tinted cards */}
        <div className="insight-stagger" style={{ animationDelay: '180ms' }}>
        <Eyebrow color={acc}>What your body's telling you</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 24 }}>
          {Object.entries(SYMPTOMS).slice(0, 8).map(([id, s]) => {
            const on = symptoms.includes(id)
            const bodyColors = sectionColors('body')
            return (
              <div key={`${id}-${on ? 'on' : 'off'}`}
                className={`alive-card frost-card${on && activeSym === id ? ' tap-bloom' : ''}`}
                style={{
                  border: `1px solid ${on ? acc + '55' : 'rgba(26,19,16,0.06)'}`,
                  background: on ? acc + '15' : sectionPaper('body'),
                  padding: '14px 4px 10px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  position: 'relative',
                  borderRadius: 18,
                  boxShadow: on ? `0 12px 22px -16px ${acc}70` : `0 10px 22px -22px ${bodyColors.accent}40`,
                  transition: 'all 0.2s var(--ease-out)',
                }}>
                <button onClick={() => toggleSym(id)} aria-pressed={on}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, fontFamily: 'inherit', color: on ? acc : T.text, padding: 0, width: '100%' }}>
                  <span style={{
                    width: 30, height: 30, borderRadius: 999,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    background: on ? `${acc}24` : `${bodyColors.accent}14`,
                    color: on ? acc : bodyColors.accent,
                  }}>
                    <SymptomIcon id={id} size={18} />
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 500, lineHeight: 1.2 }}>{s.label}</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); goSymptom(id) }}
                  aria-label={`Learn about ${s.label}`}
                  style={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, padding: 0, background: 'rgba(253,250,245,0.6)', border: '1px solid rgba(26,19,16,0.06)', borderRadius: 999, cursor: 'pointer', color: T.muted, fontSize: 11, fontFamily: T.serif, fontStyle: 'italic', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ?
                </button>
              </div>
            )
          })}
        </div>
        </div>

        {/* Phase-aware insight for the last-tapped symptom — same pattern
            as the mood-tap insights on Home. */}
        {symInsight && (
          <div key={`${phase?.id}-${activeSym}`}
            className="frost-card"
            style={{ marginTop: -10, marginBottom: 24, padding: 16, background: acc + '12', border: `1px solid ${acc}28`, borderLeft: `3px solid ${acc}`, borderRadius: 18, boxShadow: `0 14px 30px -22px ${acc}50`, animation: 'fadeUp 0.35s ease-out both' }}>
            <div style={{ fontFamily: T.serif, fontSize: 14.5, lineHeight: 1.55, color: T.text, fontStyle: 'italic' }}>
              {symInsight.text}
            </div>
            {symInsight.read && (
              <button onClick={() => goArticle(symInsight.read)}
                style={{ marginTop: 10, background: 'transparent', border: 'none', cursor: 'pointer', color: acc, fontSize: 12, fontWeight: 600, letterSpacing: 0.3, fontFamily: T.sans, padding: 0 }}>
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
              <button key={f} aria-pressed={on} onClick={() => {
                setFlow(on ? null : f)
                setTeachField(on ? null : 'flow')
              }}
                className="alive-card frost-card"
                style={{
                  flex: 1,
                  border: `1px solid ${on ? fc : 'rgba(26,19,16,0.06)'}`,
                  background: on ? fc : `linear-gradient(160deg, ${fc}10, rgba(253,250,245,0.5))`,
                  color: on ? '#fff' : T.text,
                  padding: '14px 4px',
                  cursor: 'pointer',
                  fontFamily: T.sans, fontSize: 12, letterSpacing: 0.2, fontWeight: 500,
                  borderRadius: 18,
                  boxShadow: on ? `0 12px 24px -16px ${fc}90` : `0 10px 22px -22px ${fc}40`,
                  transition: 'all 0.2s var(--ease-out)',
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

        <button
          type="button"
          onClick={() => setShowPredictionSignals((open) => !open)}
          aria-expanded={showPredictionSignals}
          className="insight-stagger alive-card frost-card"
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
            margin: '2px 0 22px', padding: '16px 16px 17px',
            background: `linear-gradient(145deg, ${acc}10, rgba(253,250,245,0.58))`,
            border: `1px solid ${acc}28`, borderRadius: 20,
            boxShadow: `0 14px 30px -24px ${acc}50`,
            textAlign: 'left', cursor: 'pointer', color: T.text, fontFamily: 'inherit',
            animationDelay: '260ms',
          }}>
          <span aria-hidden="true" style={{
            width: 34, height: 34, flexShrink: 0, borderRadius: 999,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: `${acc}14`, color: acc,
          }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 2v10" />
              <path d="M6.5 9.5a5 5 0 1 0 7 0" />
              <path d="M7.5 5h2.5" />
            </svg>
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontFamily: T.serif, fontSize: 17, fontWeight: 500, lineHeight: 1.25, marginBottom: 3 }}>
              Sharpen predictions
            </span>
            <span style={{ display: 'block', fontFamily: T.serif, fontSize: 12.5, fontStyle: 'italic', color: T.muted, lineHeight: 1.45 }}>
              {predictionSignalCount
                ? `${predictionSignalCount} optional signal${predictionSignalCount === 1 ? '' : 's'} logged`
                : 'Temperature, discharge, sleep, and sex — all optional'}
            </span>
          </span>
          <span aria-hidden="true" style={{
            color: acc, fontFamily: T.sans, fontSize: 18,
            transform: `rotate(${showPredictionSignals ? 180 : 0}deg)`,
            transition: 'transform 0.22s var(--ease-out)',
          }}>⌄</span>
        </button>

        {showPredictionSignals && (
        <div className="prediction-signals" style={{ animation: 'fadeUp 0.28s ease-out both' }}>
        <div style={{ fontFamily: T.serif, fontSize: 12.5, color: T.muted, fontStyle: 'italic', lineHeight: 1.55, margin: '-8px 2px 20px' }}>
          Temperature and discharge can help estimate ovulation timing. The rest adds context to patterns Luna sees over time.
        </div>

        {/* Temperature (BBT) — frosted input + segmented unit toggle */}
        <div className="insight-stagger" style={{ animationDelay: '260ms' }}>
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
              <button key={u} aria-pressed={bbtUnit === u} onClick={() => { setBbtUnit(u); if (bbtError) setBbtError('') }}
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
          Take it first thing in the morning, before sitting up. A sustained rise can signal that ovulation has passed.
        </div>
        {teachField === 'bbt' && teachLesson && (
          <div style={{ marginBottom: 24 }}>
            <QuietLesson lesson={teachLesson} color={acc} keyId={`bbt-${bbt}-${phaseId}`} />
          </div>
        )}
        </div>

        {/* Discharge — frosted soft cards with care tint */}
        <div className="insight-stagger" style={{ animationDelay: '300ms' }}>
        <Eyebrow color={acc}>Discharge</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 24 }}>
          {MUCUS_OPTIONS.map((m) => {
            const on = mucus === m.id
            const careColors = sectionColors('care')
            return (
              <button key={m.id} aria-pressed={on} onClick={() => {
                setMucus(on ? null : m.id)
                setTeachField(on ? null : 'mucus')
              }}
                className="alive-card frost-card"
                style={{
                  border: `1px solid ${on ? acc + '55' : 'rgba(26,19,16,0.06)'}`,
                  background: on ? acc + '14' : sectionPaper('care'),
                  color: on ? acc : T.text,
                  padding: '12px 4px',
                  cursor: 'pointer', fontFamily: T.sans, fontSize: 10, fontWeight: 600,
                  borderRadius: 16,
                  boxShadow: on ? `0 12px 22px -16px ${acc}70` : `0 10px 22px -22px ${careColors.accent}40`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  transition: 'all 0.2s var(--ease-out)',
                }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, fontFamily: T.serif, letterSpacing: -0.1 }}>{m.label}</span>
                <span style={{ fontSize: 9, color: T.muted, fontStyle: 'italic', fontFamily: T.serif, lineHeight: 1.2 }}>{m.sub}</span>
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

        {/* Sleep — frosted pill cards */}
        <div className="insight-stagger" style={{ animationDelay: '340ms' }}>
        <Eyebrow color={acc}>How you slept</Eyebrow>
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {['Great','Okay','Restless','Poor'].map((s) => {
            const on = sleep === s
            return (
              <button key={s} aria-pressed={on} onClick={() => {
                setSleep(on ? null : s)
                setTeachField(on ? null : 'sleep')
              }}
                className="alive-card frost-card"
                style={{ flex: 1, border: `1px solid ${on ? acc : 'rgba(26,19,16,0.06)'}`, background: on ? acc : 'rgba(253,250,245,0.55)', color: on ? '#fff' : T.text, padding: '14px 4px', cursor: 'pointer', fontFamily: T.sans, fontSize: 12, letterSpacing: 0.2, fontWeight: 500, borderRadius: 18, boxShadow: on ? `0 12px 24px -16px ${acc}80` : '0 10px 22px -22px rgba(26,19,16,0.18)', transition: 'all 0.2s var(--ease-out)' }}>
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

        {/* Sex — frosted pill cards */}
        <div className="insight-stagger" style={{ animationDelay: '380ms' }}>
        <Eyebrow color={acc}>Sex</Eyebrow>
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {SEX_OPTIONS.map((s) => {
            const on = sex === s.id
            return (
              <button key={s.id} aria-pressed={on} onClick={() => {
                setSex(on ? null : s.id)
                setTeachField(on ? null : 'sex')
              }}
                className="alive-card frost-card"
                style={{ flex: 1, border: `1px solid ${on ? acc : 'rgba(26,19,16,0.06)'}`, background: on ? acc : 'rgba(253,250,245,0.55)', color: on ? '#fff' : T.text, padding: '14px 4px', cursor: 'pointer', fontFamily: T.sans, fontSize: 11, letterSpacing: 0.3, fontWeight: 500, borderRadius: 18, boxShadow: on ? `0 12px 24px -16px ${acc}80` : '0 10px 22px -22px rgba(26,19,16,0.18)', transition: 'all 0.2s var(--ease-out)' }}>
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

        </div>
        )}

        {/* Note — frosted glass textarea */}
        <div className="insight-stagger" style={{ animationDelay: '420ms' }}>
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

        <div style={{ marginTop: 20, fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, color: T.muted, lineHeight: 1.6, paddingTop: 14, borderTop: '1px solid rgba(26,19,16,0.05)' }}>
          Tracked over time, this is what gives a doctor something concrete to work with.
        </div>

        {/* Quiet undo path — if the user logged something on the wrong
            day, or wants to start fresh, let them empty this day's
            entry entirely. Confirmation prompt so it's not accidental. */}
        <div style={{ marginTop: 22, paddingTop: 18 }}>
          <div style={{ fontFamily: T.serif, fontSize: 13, color: T.muted, fontStyle: 'italic', lineHeight: 1.55, marginBottom: 12 }}>
            Tapped the wrong thing? Take it back — your future self won't mind.
          </div>
          <button
            className="alive-card frost-card"
            onClick={() => {
              const friendly = isToday ? 'today' : dateLabel
              if (!window.confirm(`Clear everything you have logged for ${friendly}? This removes the whole entry.`)) return
              removeLog(editingISO)
              setActiveLogDate(null)
              back()
            }}
            style={{ width: '100%', background: 'rgba(253,250,245,0.55)', border: `1px solid ${T.accent}40`, color: T.accent, padding: '13px 16px', borderRadius: 18, cursor: 'pointer', fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, letterSpacing: 0.3, boxShadow: `0 10px 22px -22px ${T.accent}60` }}>
            Clear this day's entry
          </button>
        </div>
      </div>
    </div>
  )
}
