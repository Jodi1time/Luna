import { useState, useEffect } from 'react'
import { T } from '../data/theme'
import { Screen, SourceLine } from '../components/shared'
import { SymptomIcon } from '../components/symptomIcons'
import { PHASES } from '../data/lunaData'
import { useCycle, isOnHormonalBC } from '../hooks/useCycle'
import { usePregnancy } from '../hooks/usePregnancy'
import { BC_LABELS } from '../data/birthControl'
import useLuna from '../store/useLuna'

// A warm, embodied phase line that runs after the body-state sentence.
// No optimisation talk — what's actually happening, not what to "use it for."
const phasePresence = {
  menstrual:  'Rest is the work this week.',
  follicular: 'A gentle re-opening. Move when it feels right.',
  ovulation:  'Notice what feels easier — words, wanting, warmth.',
  luteal:     'Be a little softer with yourself. Cravings are signal, not weakness.',
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

function Greeting({ name }) {
  const hour = new Date().getHours()
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  const first = (name || '').split(' ')[0]
  return (
    <div style={{ paddingTop: 6, marginBottom: 18 }}>
      <div style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 400, letterSpacing: -0.4, color: T.text, fontStyle: 'italic' }}>
        Good {timeOfDay}{first ? ', ' : ''}<span style={{ fontStyle: 'normal' }}>{first}</span>.
      </div>
    </div>
  )
}

export default function Home() {
  const store = useLuna()
  const { go, goPhase, saveLog, logs, birthControl, displayName } = store
  const cycle = useCycle(store)
  const { cycleDay, phase, cycleLength } = cycle
  const preg = usePregnancy(store)
  const isPreg = preg.active
  const trimColor = isPreg ? trimesterColor(preg.trimester?.number) : null
  const animatedDay = useCountUp(isPreg ? preg.week : cycleDay)
  const [quickMood, setQuickMood] = useState(null)
  const onHormonalBC = isOnHormonalBC(birthControl)
  const bcLabel = BC_LABELS[birthControl?.method] || 'None'

  const todayISO = new Date().toISOString().slice(0, 10)
  const todayLog = logs?.[todayISO]
  const hasFlowToday = todayLog?.flow && todayLog.flow !== 'Spotting'
  // Surface the period-start nudge only when relevant: within a few
  // days of expected, no flow logged today, not on hormonal BC.
  const showPeriodCTA = !isPreg && !onHormonalBC && !hasFlowToday && cycleDay != null && cycleDay >= cycleLength - 3

  const handleQuickMood = (m) => {
    setQuickMood(m)
    saveLog(new Date(), { mood: m })
  }

  const logPeriodStart = () => {
    saveLog(new Date(), { ...(todayLog || {}), flow: 'Medium' })
  }

  return (
    <Screen>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Greeting name={displayName} />

        {/* Cover — Pregnancy variant */}
        {isPreg && (
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.5, fontWeight: 600, color: trimColor, marginBottom: 6 }}>
              Week {preg.week} · {preg.trimester?.name}
            </div>
            <div className="ambient-breath" style={{ fontFamily: T.serif, fontSize: 150, fontWeight: 300, color: trimColor, lineHeight: 0.82, letterSpacing: -7, marginTop: 16, transition: 'color 0.6s ease-out' }}>
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
          <div className="ambient-breath" style={{ fontFamily: T.serif, fontSize: 150, fontWeight: 300, color: phase?.color || T.accent, lineHeight: 0.82, letterSpacing: -7, marginTop: 16, transition: 'color 0.6s ease-out' }}>
            {cycleDay ? animatedDay : '—'}
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 400, fontStyle: 'italic', letterSpacing: -0.6, marginTop: 6, lineHeight: 1.05 }}>
            {phase?.name || 'Just getting started'}.
          </div>
          {phase && !onHormonalBC && (
            <div style={{ fontFamily: T.serif, fontSize: 16, lineHeight: 1.55, marginTop: 14, color: T.text }}>
              {phase.bodyMood}
            </div>
          )}
          {phase && !onHormonalBC && (
            <div style={{ fontFamily: T.serif, fontSize: 15, fontStyle: 'italic', lineHeight: 1.55, marginTop: 8, color: T.accent }}>
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

        {/* Quick check-in */}
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
          <button onClick={() => go('log')}
            style={{ marginTop: 14, background: 'transparent', border: 'none', cursor: 'pointer', color: T.accent, fontSize: 12, fontWeight: 600, letterSpacing: 0.4, fontFamily: T.sans, padding: 0 }}>
            Log more →
          </button>
        </div>

        <div style={{ height: 16 }} />
      </div>
    </Screen>
  )
}
