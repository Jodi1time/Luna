import { T } from '../data/theme'
import { Masthead, Eyebrow, Rule, SourceLine, Screen } from '../components/shared'
import { PHASES, SYMPTOMS } from '../data/lunaData'
import { useCycle, detectSymptomPatterns } from '../hooks/useCycle'
import { SymptomIcon, MOOD_LABELS } from '../components/symptomIcons'
import useLuna from '../store/useLuna'

const PHASE_COLOR = {
  menstrual:  PHASES.menstrual.color,
  follicular: PHASES.follicular.color,
  ovulation:  PHASES.ovulation.color,
  luteal:     PHASES.luteal.color,
}

// Resolve a pattern's icon id + human label from the raw key the store records.
// Moods are stored as their id ('calm', 'energy', …) — looked up in MOOD_LABELS
// for display, and used directly as the SymptomIcon path key. Symptoms are
// stored as the SYMPTOMS dict id ('cramps', 'headache', …).
function resolvePattern(p) {
  if (p.type === 'mood') {
    const lower = String(p.label).toLowerCase()
    const display = MOOD_LABELS[lower] || MOOD_LABELS[p.label] || p.label
    return { iconId: MOOD_LABELS[p.label] ? p.label : lower, display }
  }
  const dict = SYMPTOMS[p.label]
  return { iconId: p.label, display: dict?.label || p.label }
}

export default function Insights() {
  const store = useLuna()
  const cycle = useCycle(store)
  const { phase, periodHistory } = cycle
  const logs = useLuna((s) => s.logs)
  const patterns = detectSymptomPatterns(logs, periodHistory, cycle.cycleLength, cycle.periodLength)
  const cyclesLogged = periodHistory ? periodHistory.length : 0

  return (
    <Screen>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue={`The Editorial · Week ${new Date().getWeek?.() || 1}`} />

        <Eyebrow>LEAD INSIGHT</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 500, letterSpacing: -0.6, lineHeight: 1.1, marginBottom: 14 }}>
          {phase
            ? <>You are in <em style={{ color: T.accent }}>{phase.name} phase.</em> Here's what that means.</>
            : <>Start logging to unlock <em style={{ color: T.accent }}>personalised insights.</em></>}
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 15.5, lineHeight: 1.6, marginBottom: 12 }}>
          {phase ? phase.whatsHappening : 'Your insights will be generated from your logs and cycle data. The more you log, the more precise they become.'}
        </div>
        {phase && (
          <div style={{ fontFamily: T.serif, fontSize: 15, lineHeight: 1.55, color: T.muted, fontStyle: 'italic' }}>
            {phase.bodyMood}
          </div>
        )}
        <SourceLine>{phase ? phase.sourceBody : 'Log at least 7 days to see pattern analysis'}</SourceLine>

        <Rule />

        <Eyebrow>PATTERNS WE'RE WATCHING</Eyebrow>
        {patterns.length === 0 ? (
          <div style={{ fontFamily: T.serif, fontSize: 15, color: T.muted, fontStyle: 'italic', marginTop: 8, lineHeight: 1.5 }}>
            {cyclesLogged < 2
              ? <>We need at least one full cycle to spot patterns. Keep logging.</>
              : <>No strong patterns yet — keep logging and they'll surface here.</>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
            {patterns.map((p) => {
              const { iconId, display } = resolvePattern(p)
              const color = PHASE_COLOR[p.phase] || T.accent
              const [min, max] = p.days
              const dayLabel = min === max ? `day ${min}` : `days ${min}–${max}`
              const sentence = p.type === 'symptom'
                ? `Your ${display.toLowerCase()} tend to land in your ${p.phase} phase — ${dayLabel}`
                : `You tend to log '${display}' in your ${p.phase} phase — ${dayLabel}`
              const concentration = Math.round((p.concentration || 0) * 100)
              return (
                <div key={p.id} style={{ padding: 14, background: T.card, border: `1px solid ${T.hair}`, borderLeft: `3px solid ${color}`, borderRadius: T.r }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flexShrink: 0, color: T.accent, marginTop: 2 }}>
                      <SymptomIcon id={iconId} size={28} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 9.5, letterSpacing: 1.5, fontWeight: 700, color: color, fontFamily: T.sans, marginBottom: 4 }}>
                        {p.type.toUpperCase()} · DAYS {min}{min === max ? '' : `–${max}`}
                      </div>
                      <div style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 500, marginBottom: 4, lineHeight: 1.2 }}>
                        {p.type === 'symptom' ? `Your ${display.toLowerCase()}` : `Your '${display}' moods`}
                      </div>
                      <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.45, fontFamily: T.sans }}>
                        {sentence}.
                      </div>
                      <div style={{ marginTop: 8, fontSize: 9.5, fontFamily: T.mono, color: T.muted, letterSpacing: 0.5 }}>
                        {p.occurrences} OCCURRENCE{p.occurrences === 1 ? '' : 'S'} ACROSS {p.cycles} CYCLE{p.cycles === 1 ? '' : 'S'} · {concentration}% CONCENTRATION
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <div style={{ height: 16 }} />
      </div>
    </Screen>
  )
}
