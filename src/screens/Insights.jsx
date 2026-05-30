import { T } from '../data/theme'
import { Masthead, Eyebrow, Rule, SourceLine, Screen } from '../components/shared'
import { PHASES, SYMPTOMS } from '../data/lunaData'
import { useCycle, detectSymptomPatterns, detectBBTShift, isOnHormonalBC, getPhaseForDay } from '../hooks/useCycle'
import { SymptomIcon, MOOD_LABELS } from '../components/symptomIcons'
import useLuna from '../store/useLuna'

// Cycle wheel — a circular visualization of the cycle, divided into
// segments per day, phase-colored. A small marker shows where the user
// is today. Distinctly Luna: cycles are circles, not lists.
function CycleWheel({ cycleDay, cycleLength, periodLength }) {
  if (!cycleDay || !cycleLength) return null
  const size = 240
  const r = 100
  const cx = size / 2
  const cy = size / 2
  // Build per-day arc segments around the circle. Each segment is
  // 360/cycleLength degrees wide and colored by phase.
  const segmentAngle = 360 / cycleLength
  const segments = []
  for (let d = 1; d <= cycleLength; d++) {
    const phase = getPhaseForDay(d, cycleLength, periodLength)
    const startAngle = (d - 1) * segmentAngle - 90 // start at top
    const endAngle = d * segmentAngle - 90
    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180
    const x1 = cx + r * Math.cos(startRad)
    const y1 = cy + r * Math.sin(startRad)
    const x2 = cx + r * Math.cos(endRad)
    const y2 = cy + r * Math.sin(endRad)
    const innerR = r - 18
    const x3 = cx + innerR * Math.cos(endRad)
    const y3 = cy + innerR * Math.sin(endRad)
    const x4 = cx + innerR * Math.cos(startRad)
    const y4 = cy + innerR * Math.sin(startRad)
    const path = `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 0 0 ${x4} ${y4} Z`
    segments.push({ d, path, color: phase.color, isToday: d === cycleDay })
  }
  // Marker position for "today" — at the centroid of today's segment.
  const todayMidAngle = (cycleDay - 0.5) * segmentAngle - 90
  const markerRad = (todayMidAngle * Math.PI) / 180
  const markerR = r - 9
  const mx = cx + markerR * Math.cos(markerRad)
  const my = cy + markerR * Math.sin(markerRad)
  const todayPhase = getPhaseForDay(cycleDay, cycleLength, periodLength)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 6 }}>
      <svg width={size} height={size} style={{ overflow: 'visible' }}>
        {segments.map((s) => (
          <path key={s.d} d={s.path} fill={s.color} opacity={s.isToday ? 0.95 : 0.32}
            style={{ transition: 'opacity 0.4s' }} />
        ))}
        {/* Today marker — small filled circle on top of the ring */}
        <circle cx={mx} cy={my} r={6} fill="#fff" stroke={todayPhase.color} strokeWidth={2} />
        {/* Center label */}
        <text x={cx} y={cy - 4} textAnchor="middle"
          style={{ fontFamily: T.serif, fontSize: 40, fontWeight: 400, fill: todayPhase.color, fontStyle: 'italic' }}>
          {cycleDay}
        </text>
        <text x={cx} y={cy + 18} textAnchor="middle"
          style={{ fontFamily: T.sans, fontSize: 10, letterSpacing: 1, fill: T.muted, fontWeight: 600 }}>
          DAY OF {cycleLength}
        </text>
      </svg>
      <div style={{ fontFamily: T.serif, fontSize: 15, color: T.muted, marginTop: 14, fontStyle: 'italic' }}>
        You're in your <em style={{ color: todayPhase.color, fontStyle: 'normal', fontWeight: 500 }}>{todayPhase.name.toLowerCase()}</em> phase.
      </div>
    </div>
  )
}

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
  const birthControl = useLuna((s) => s.birthControl)
  const onHormonalBC = isOnHormonalBC(birthControl)
  const patterns = detectSymptomPatterns(logs, periodHistory, cycle.cycleLength, cycle.periodLength)
  const cyclesLogged = periodHistory ? periodHistory.length : 0
  const bbtShift = !onHormonalBC ? detectBBTShift(logs, periodHistory, cycle.cycleLength) : null
  const cycleDay = cycle.cycleDay

  const blobColor = (phase?.color) || T.accent

  return (
    <div className="home-stage">
      {!onHormonalBC && (
        <div className="blob-stage subtle" aria-hidden="true">
          <div className="breathing-blob" style={{ '--phase-color': blobColor }} />
        </div>
      )}
      <Screen>
        <div style={{ position: 'relative', zIndex: 1, padding: '20px 22px 0', color: T.text }}>
        <div style={{ fontFamily: T.serif, fontSize: 40, fontWeight: 500, letterSpacing: -1, lineHeight: 1, marginTop: 6, marginBottom: 10 }}>
          What we've noticed.
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 14, lineHeight: 1.55, color: T.muted, marginBottom: 18, fontStyle: 'italic' }}>
          Patterns Luna sees across your cycles, gathered gently.
        </div>

        {/* Cycle wheel — circular visualization of where you are. Now
            always renders so it's visible regardless of BC method or
            whether the user has logged anything yet. */}
        <div style={{ marginBottom: 22 }}>
          {cycleDay ? (
            <>
              <CycleWheel cycleDay={cycleDay} cycleLength={cycle.cycleLength} periodLength={cycle.periodLength} />
              {onHormonalBC && (
                <div style={{ fontFamily: T.serif, fontSize: 13, color: T.muted, marginTop: 8, fontStyle: 'italic', textAlign: 'center', maxWidth: 280, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.55 }}>
                  Your method softens the natural phase pattern — this is the underlying cycle Luna still tracks for you.
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
              <CycleWheel cycleDay={1} cycleLength={cycle.cycleLength || 28} periodLength={cycle.periodLength || 5} />
              <div style={{ fontFamily: T.serif, fontSize: 14, color: T.muted, marginTop: 8, fontStyle: 'italic', textAlign: 'center', maxWidth: 260, lineHeight: 1.5 }}>
                Log your first period and Luna will mark where you are on the wheel.
              </div>
            </div>
          )}
        </div>

        <Eyebrow>Where you are now</Eyebrow>
        {onHormonalBC ? (
          <>
            <div style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 500, letterSpacing: -0.5, lineHeight: 1.15, marginBottom: 14 }}>
              Your cycle is shaped by your method, <em style={{ color: T.accent }}>but symptoms still tell a story.</em>
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 15.5, lineHeight: 1.6, marginBottom: 12 }}>
              Hormonal contraception softens the natural phase pattern. Moods, headaches, and other symptoms can still cluster — sometimes around your method's hormone schedule, sometimes around your own rhythms. Keep logging and Luna will surface what repeats.
            </div>
            <SourceLine>Pattern detection from your logs</SourceLine>
          </>
        ) : (
          <>
            <div style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 500, letterSpacing: -0.5, lineHeight: 1.15, marginBottom: 14 }}>
              {phase
                ? <>You're in your <em style={{ color: T.accent }}>{phase.name.toLowerCase()} phase.</em></>
                : <>Start logging — your patterns will appear here.</>}
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 15.5, lineHeight: 1.6, marginBottom: 12 }}>
              {phase ? phase.whatsHappening : 'The more you log, the more Luna learns about your body specifically.'}
            </div>
            {phase && (
              <div style={{ fontFamily: T.serif, fontSize: 15, lineHeight: 1.55, color: T.muted, fontStyle: 'italic' }}>
                {phase.bodyMood}
              </div>
            )}
            <SourceLine>{phase ? phase.sourceBody : 'A full cycle of logs is enough to start spotting patterns'}</SourceLine>
          </>
        )}

        <Rule />

        {bbtShift && (
          <div style={{ marginBottom: 22 }}>
            <Eyebrow>Your ovulation marker</Eyebrow>
            <div className="glass-card" style={{ padding: 14, borderLeft: `3px solid ${PHASES.ovulation.color}`, borderRadius: T.r, marginTop: 4 }}>
              <div style={{ fontFamily: T.serif, fontSize: 19, fontWeight: 500, marginBottom: 8, lineHeight: 1.3 }}>
                You ovulate around <em style={{ color: T.accent }}>day {bbtShift.shiftDayMedian}.</em>
              </div>
              <div style={{ fontFamily: T.sans, fontSize: 13, color: T.muted, lineHeight: 1.55, marginBottom: 10 }}>
                Your post-ovulation temperatures run about {bbtShift.shiftDelta}°{bbtShift.unit} higher than your follicular phase — the biological signature of ovulation.
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 10, color: T.muted, letterSpacing: 0.5, paddingTop: 8, borderTop: `1px solid ${T.hair}` }}>
                {bbtShift.follicularAvg}°{bbtShift.unit} → {bbtShift.lutealAvg}°{bbtShift.unit} · {bbtShift.samples} reading{bbtShift.samples === 1 ? '' : 's'}
              </div>
            </div>
          </div>
        )}

        <Eyebrow>What's repeating in your cycle</Eyebrow>
        {patterns.length === 0 ? (
          <div style={{ fontFamily: T.serif, fontSize: 15, color: T.muted, fontStyle: 'italic', marginTop: 8, lineHeight: 1.55 }}>
            {cyclesLogged < 2
              ? <>Patterns surface after about a full cycle of logging. Keep going.</>
              : <>No strong patterns yet. Keep logging — they'll surface here as they emerge.</>}
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
                : `You often feel '${display}' in your ${p.phase} phase — ${dayLabel}`
              const concentration = Math.round((p.concentration || 0) * 100)
              return (
                <div key={p.id} className="glass-card" style={{ padding: 14, borderLeft: `3px solid ${color}`, borderRadius: T.r }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flexShrink: 0, color: T.accent, marginTop: 2 }}>
                      <SymptomIcon id={iconId} size={28} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, letterSpacing: 1.2, fontWeight: 600, color: color, fontFamily: T.sans, marginBottom: 4 }}>
                        {p.type === 'symptom' ? 'Symptom' : 'Mood'} · days {min}{min === max ? '' : `–${max}`}
                      </div>
                      <div style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 500, marginBottom: 4, lineHeight: 1.25 }}>
                        {p.type === 'symptom' ? `Your ${display.toLowerCase()}` : `Your '${display}' moods`}
                      </div>
                      <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.5, fontFamily: T.sans }}>
                        {sentence}.
                      </div>
                      <div style={{ marginTop: 8, fontSize: 10, fontFamily: T.mono, color: T.muted, letterSpacing: 0.3 }}>
                        {p.occurrences} occurrence{p.occurrences === 1 ? '' : 's'} across {p.cycles} cycle{p.cycles === 1 ? '' : 's'} · {concentration}% concentration
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
    </div>
  )
}
