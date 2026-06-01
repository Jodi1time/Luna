import { T } from '../data/theme'
import { Masthead, Eyebrow, Rule, SourceLine, Screen } from '../components/shared'
import { PHASES, SYMPTOMS } from '../data/lunaData'
import { useCycle, detectSymptomPatterns, detectBBTShift, isOnHormonalBC, getPhaseForDay } from '../hooks/useCycle'
import { SymptomIcon, MOOD_LABELS } from '../components/symptomIcons'
import { PhaseFlourish } from '../components/phaseFlourishes'
import { useCountUp } from '../hooks/useCountUp'
import useLuna from '../store/useLuna'

// SVG arc path between two angles on a ring of given inner / outer radius.
// Returns the d attribute for a <path>. Used for both the per-day cycle
// segments and the fertile-window outer halo.
function arcPath(cx, cy, innerR, outerR, startAngle, endAngle) {
  const startRad = (startAngle * Math.PI) / 180
  const endRad   = (endAngle   * Math.PI) / 180
  const x1 = cx + outerR * Math.cos(startRad)
  const y1 = cy + outerR * Math.sin(startRad)
  const x2 = cx + outerR * Math.cos(endRad)
  const y2 = cy + outerR * Math.sin(endRad)
  const x3 = cx + innerR * Math.cos(endRad)
  const y3 = cy + innerR * Math.sin(endRad)
  const x4 = cx + innerR * Math.cos(startRad)
  const y4 = cy + innerR * Math.sin(startRad)
  const largeArc = (endAngle - startAngle) > 180 ? 1 : 0
  return `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`
}

// Cycle wheel — a circular visualization of the cycle, divided into
// segments per day, phase-colored. A small marker shows where the user
// is today (with a slow pulsing ring so it reads as alive). When the
// user is in or approaching the fertile window, a soft outer halo
// surrounds the fertile days. Distinctly Luna: cycles are circles.
function CycleWheel({ cycleDay, cycleLength, periodLength, bbtShift }) {
  if (!cycleDay || !cycleLength) return null
  const animatedCenter = useCountUp(cycleDay, 1100)
  const size = 240
  const r = 100
  const cx = size / 2
  const cy = size / 2
  const segmentAngle = 360 / cycleLength
  const innerR = r - 18
  const segments = []
  for (let d = 1; d <= cycleLength; d++) {
    const phase = getPhaseForDay(d, cycleLength, periodLength)
    const startAngle = (d - 1) * segmentAngle - 90
    const endAngle   = d       * segmentAngle - 90
    segments.push({
      d,
      path: arcPath(cx, cy, innerR, r, startAngle, endAngle),
      color: phase.color,
      isToday: d === cycleDay,
    })
  }

  // Today marker — placed at the centroid of today's segment.
  const todayMidAngle = (cycleDay - 0.5) * segmentAngle - 90
  const markerRad = (todayMidAngle * Math.PI) / 180
  const markerR = r - 9
  const mx = cx + markerR * Math.cos(markerRad)
  const my = cy + markerR * Math.sin(markerRad)
  const todayPhase = getPhaseForDay(cycleDay, cycleLength, periodLength)

  // Fertile window — derived from the detected BBT shift when we have
  // one (accurate), otherwise from the calendar midpoint. We show a
  // soft outer halo over those days so the eye lands on the fertile
  // arc when the user is in or near it.
  const ovDay = bbtShift?.shiftDayMedian ?? Math.round(cycleLength / 2)
  const fertileStart = Math.max(1, ovDay - 5)
  const fertileEnd   = Math.min(cycleLength, ovDay + 1)
  const inOrNearFertile = cycleDay >= fertileStart - 3 && cycleDay <= fertileEnd + 3
  const fertileStartAngle = (fertileStart - 1) * segmentAngle - 90
  const fertileEndAngle   = fertileEnd       * segmentAngle - 90
  const fertileHaloPath = inOrNearFertile
    ? arcPath(cx, cy, r + 6, r + 14, fertileStartAngle, fertileEndAngle)
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 6 }}>
      <svg width={size} height={size} style={{ overflow: 'visible' }}>
        {/* Outer fertile-window halo — only when in or near fertile days */}
        {fertileHaloPath && (
          <path d={fertileHaloPath} fill={PHASES.ovulation.color}
            className="fertile-glow"
            style={{ filter: 'blur(4px)' }} />
        )}
        {/* Per-day arc segments, draw-in staggered */}
        {segments.map((s, idx) => (
          <path key={s.d} d={s.path} fill={s.color}
            className="arc-draw"
            style={{
              animationDelay: `${idx * 22}ms`,
              '--final-opacity': s.isToday ? 0.95 : 0.32,
            }} />
        ))}
        {/* Soft glow under the marker — quiet phase-color halo */}
        <circle cx={mx} cy={my} r={14} fill={todayPhase.color} opacity={0.18}
          style={{ filter: 'blur(3px)' }} />
        {/* Outer pulsing ring — the heartbeat of "you are here" */}
        <circle cx={mx} cy={my} r={6} fill={todayPhase.color}
          className="wheel-today-pulse" />
        {/* Today marker — solid disc on top of the ring */}
        <circle cx={mx} cy={my} r={6} fill="#fff" stroke={todayPhase.color} strokeWidth={2} />
        {/* Center — big italic day number + small serif "of X" */}
        <text x={cx} y={cy + 4} textAnchor="middle"
          style={{ fontFamily: T.serif, fontSize: 56, fontWeight: 400, fill: todayPhase.color, fontStyle: 'italic', letterSpacing: -2 }}>
          {animatedCenter}
        </text>
        <text x={cx} y={cy + 24} textAnchor="middle"
          style={{ fontFamily: T.serif, fontSize: 11.5, fill: T.muted, fontStyle: 'italic', letterSpacing: 0.2 }}>
          of {cycleLength}
        </text>
      </svg>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 14 }}>
        <div style={{ fontFamily: T.serif, fontSize: 17, color: T.text, fontStyle: 'italic', letterSpacing: -0.2 }}>
          You're in your <em style={{ color: todayPhase.color, fontStyle: 'normal', fontWeight: 500 }}>{todayPhase.name.toLowerCase()}</em> phase.
        </div>
        <span style={{ color: todayPhase.color, opacity: 0.78, display: 'inline-flex' }} aria-hidden="true">
          <PhaseFlourish phaseId={todayPhase.id} size={22} />
        </span>
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

// Plain-language tags for cycle/period length + variance. The numbers
// alone are anxiety-inducing ("am I weird?"); pairing them with a
// doula-toned "within typical range" / "on the shorter side" lets the
// summary card actually reassure.
function cycleLengthTag(n) {
  if (n == null) return null
  if (n < 21) return 'on the shorter side'
  if (n > 35) return 'on the longer side'
  return 'within typical range'
}
function periodLengthTag(n) {
  if (n == null) return null
  if (n < 3) return 'on the lighter side'
  if (n > 7) return 'on the longer side'
  return 'typical'
}
function varianceTag(conf) {
  if (conf === 'high') return 'Steady'
  if (conf === 'medium') return 'Some variation'
  return 'Variable'
}

// Cycle summary card — pulls together what the engine already knows
// (cycle length, period length, variance + reason) into one quiet
// glass card the user can recognise themselves in. The cycle length,
// period length, and cycles-logged numbers count up on mount so the
// card reads as a small live dashboard, not a static fact sheet.
function CycleSummaryCard({ cycleLength, periodLength, variance, cyclesLogged }) {
  if (!cycleLength) return null
  const animCL = useCountUp(cycleLength, 1200)
  const animPL = useCountUp(periodLength || 0, 1200)
  const animCY = useCountUp(cyclesLogged || 0, 1400)
  const clTag = cycleLengthTag(cycleLength)
  const plTag = periodLengthTag(periodLength)
  const vTag  = varianceTag(variance?.conf)
  return (
    <div className="glass-card insight-stagger" style={{ padding: 16, borderLeft: `3px solid ${T.accent}`, borderRadius: T.r, marginBottom: 22, animationDelay: '120ms' }}>
      <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.2, fontWeight: 600, color: T.muted, marginBottom: 8 }}>
        Your cycles
      </div>
      <div style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 400, lineHeight: 1.45, color: T.text, letterSpacing: -0.2 }}>
        About <em style={{ color: T.accent, fontStyle: 'normal', fontWeight: 500 }}>{animCL} days</em>, end to end — {clTag}. Your bleed runs about <em style={{ color: T.accent, fontStyle: 'normal', fontWeight: 500 }}>{animPL} day{animPL === 1 ? '' : 's'}</em> — {plTag}.
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 10, borderTop: `1px solid ${T.hair}` }}>
        <span style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1, color: T.muted, fontWeight: 600 }}>RHYTHM</span>
        <span style={{ fontFamily: T.serif, fontSize: 13.5, fontStyle: 'italic', color: T.text, fontWeight: 500 }}>
          {vTag}
        </span>
        {cyclesLogged > 0 && (
          <span style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 0.5, color: T.muted, marginLeft: 'auto' }}>
            {animCY} CYCLE{animCY === 1 ? '' : 'S'} LOGGED
          </span>
        )}
      </div>
      {variance?.why && (
        <div style={{ fontFamily: T.serif, fontSize: 13, color: T.muted, fontStyle: 'italic', lineHeight: 1.55, marginTop: 8 }}>
          {variance.why}
        </div>
      )}
    </div>
  )
}

// Mini BBT sparkline — visualises the biphasic shift the engine has
// detected. A flat low line (follicular average) steps up to a flat
// high line (luteal average) at shiftDayMedian. Stroke draws in over
// ~1s, then the two average dots pop. Tiny, but the second-read
// moment that says "Luna saw your ovulation" instead of just stating
// the day number.
function BBTSparkline({ bbtShift, cycleLength }) {
  if (!bbtShift) return null
  const w = 220
  const h = 56
  const padX = 12
  const padY = 8
  const innerW = w - padX * 2
  const innerH = h - padY * 2
  const shiftFrac = Math.min(1, Math.max(0, (bbtShift.shiftDayMedian - 1) / Math.max(1, cycleLength - 1)))
  const shiftX = padX + shiftFrac * innerW
  // Two horizontal levels — low (follicular) is closer to the bottom,
  // high (luteal) closer to the top. We don't use real temp values
  // for the y axis since the delta is small (~0.5°F); we map to
  // visually meaningful low / high zones.
  const yLow  = padY + innerH * 0.78
  const yHigh = padY + innerH * 0.28
  // The path: start at low-left, run to shift day, step up, then run to right.
  const points = [
    `M ${padX} ${yLow}`,
    `L ${shiftX - 4} ${yLow}`,
    `Q ${shiftX} ${yLow} ${shiftX} ${(yLow + yHigh) / 2}`,
    `Q ${shiftX} ${yHigh} ${shiftX + 4} ${yHigh}`,
    `L ${padX + innerW} ${yHigh}`,
  ].join(' ')
  // Approximate path length for stroke-dashoffset trick.
  const sparkLen = innerW + Math.abs(yLow - yHigh) + 40
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`}
      style={{ marginTop: 6, marginBottom: 4, display: 'block' }}>
      {/* Mid baseline — subtle anchor for the eye */}
      <line x1={padX} y1={(yLow + yHigh) / 2} x2={padX + innerW} y2={(yLow + yHigh) / 2}
        stroke={T.hair} strokeWidth={1} strokeDasharray="2 4" opacity={0.7} />
      {/* The step-up path itself */}
      <path d={points} fill="none" stroke={PHASES.ovulation.color} strokeWidth={2.4}
        strokeLinecap="round" strokeLinejoin="round"
        className="sparkline-draw"
        style={{ '--spark-len': sparkLen }} />
      {/* Day marker — vertical dashed line at the shift, appears after
          the sparkline draws. Anchors the visual story: "this is where
          your ovulation lives." */}
      <line x1={shiftX} y1={padY + 2} x2={shiftX} y2={yLow + 4}
        stroke={PHASES.ovulation.color} strokeWidth={1} strokeDasharray="2 2"
        className="spark-dot" style={{ animationDelay: '0.95s', opacity: 0.5, transformOrigin: `${shiftX}px ${(yLow + yHigh) / 2}px` }} />
      <text x={shiftX} y={padY - 2} textAnchor="middle"
        className="spark-dot" style={{ animationDelay: '1.05s', fontFamily: T.mono, fontSize: 8, letterSpacing: 0.6, fill: PHASES.ovulation.color, fontWeight: 600, transformOrigin: `${shiftX}px ${padY}px` }}>
        DAY {bbtShift.shiftDayMedian}
      </text>
      {/* Two reading dots — follicular avg + luteal avg */}
      <circle cx={padX + innerW * 0.18} cy={yLow}  r={3.2} fill={PHASES.follicular.color}
        className="spark-dot" style={{ animationDelay: '1.0s' }} />
      <circle cx={padX + innerW * 0.82} cy={yHigh} r={3.2} fill={PHASES.luteal.color}
        className="spark-dot" style={{ animationDelay: '1.15s' }} />
      {/* Tiny labels under the dots */}
      <text x={padX + innerW * 0.18} y={yLow + 14}
        textAnchor="middle" style={{ fontFamily: T.mono, fontSize: 8, letterSpacing: 0.5, fill: T.muted, fontWeight: 600, opacity: 0.85 }}>
        {bbtShift.follicularAvg}°
      </text>
      <text x={padX + innerW * 0.82} y={yHigh - 6}
        textAnchor="middle" style={{ fontFamily: T.mono, fontSize: 8, letterSpacing: 0.5, fill: T.muted, fontWeight: 600, opacity: 0.85 }}>
        {bbtShift.lutealAvg}°
      </text>
    </svg>
  )
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
  const go = useLuna((s) => s.go)
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
        <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 40, fontWeight: 500, letterSpacing: -1, lineHeight: 1, marginTop: 6, marginBottom: 10, animationDelay: '0ms' }}>
          What we've noticed.
        </div>
        <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 14, lineHeight: 1.55, color: T.muted, marginBottom: 18, fontStyle: 'italic', animationDelay: '60ms' }}>
          Patterns Luna sees across your cycles, gathered gently.
        </div>

        {/* Cycle wheel — circular visualization of where you are. Now
            always renders so it's visible regardless of BC method or
            whether the user has logged anything yet. */}
        <div className="insight-stagger" style={{ marginBottom: 22, animationDelay: '80ms' }}>
          {cycleDay ? (
            <>
              <CycleWheel cycleDay={cycleDay} cycleLength={cycle.cycleLength} periodLength={cycle.periodLength} bbtShift={bbtShift} />
              {onHormonalBC && (
                <div style={{ fontFamily: T.serif, fontSize: 13, color: T.muted, marginTop: 8, fontStyle: 'italic', textAlign: 'center', maxWidth: 280, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.55 }}>
                  Your method softens the natural phase pattern — this is the underlying cycle Luna still tracks for you.
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
              <CycleWheel cycleDay={1} cycleLength={cycle.cycleLength || 28} periodLength={cycle.periodLength || 5} bbtShift={null} />
              <div style={{ fontFamily: T.serif, fontSize: 14, color: T.muted, marginTop: 8, fontStyle: 'italic', textAlign: 'center', maxWidth: 260, lineHeight: 1.5 }}>
                Log your first period and Luna will mark where you are on the wheel.
              </div>
            </div>
          )}
        </div>

        {/* Cycle summary — the "you are normal" surface most apps don't do. */}
        <CycleSummaryCard
          cycleLength={cycle.cycleLength}
          periodLength={cycle.periodLength}
          variance={cycle.variance}
          cyclesLogged={cyclesLogged}
        />

        <div className="insight-stagger" style={{ animationDelay: '180ms' }}>
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
        </div>

        <Rule />

        {bbtShift && (
          <div className="insight-stagger" style={{ marginBottom: 22, animationDelay: '240ms' }}>
            <Eyebrow>Your ovulation marker</Eyebrow>
            <div className="glass-card" style={{ padding: 14, borderLeft: `3px solid ${PHASES.ovulation.color}`, borderRadius: T.r, marginTop: 4 }}>
              <div style={{ fontFamily: T.serif, fontSize: 19, fontWeight: 500, marginBottom: 8, lineHeight: 1.3 }}>
                You ovulate around <em style={{ color: T.accent }}>day {bbtShift.shiftDayMedian}.</em>
              </div>
              {/* Mini sparkline — visualises the biphasic step up */}
              <BBTSparkline bbtShift={bbtShift} cycleLength={cycle.cycleLength} />
              <div style={{ fontFamily: T.sans, fontSize: 13, color: T.muted, lineHeight: 1.55, marginBottom: 10, marginTop: 4 }}>
                Your post-ovulation temperatures run about {bbtShift.shiftDelta}°{bbtShift.unit} higher than your follicular phase — the biological signature of ovulation.
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 10, color: T.muted, letterSpacing: 0.5, paddingTop: 8, borderTop: `1px solid ${T.hair}` }}>
                {bbtShift.follicularAvg}°{bbtShift.unit} → {bbtShift.lutealAvg}°{bbtShift.unit} · {bbtShift.samples} reading{bbtShift.samples === 1 ? '' : 's'}
              </div>
            </div>
          </div>
        )}

        <div className="insight-stagger" style={{ animationDelay: '280ms' }}>
        <Eyebrow>What's repeating in your cycle</Eyebrow>
        {patterns.length === 0 ? (
          <div style={{ fontFamily: T.serif, fontSize: 15, color: T.muted, fontStyle: 'italic', marginTop: 8, lineHeight: 1.55 }}>
            {cyclesLogged < 2
              ? <>Patterns surface after about a full cycle of logging. Keep going.</>
              : <>No strong patterns yet. Keep logging — they'll surface here as they emerge.</>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
            {patterns.map((p, idx) => {
              const { iconId, display } = resolvePattern(p)
              const color = PHASE_COLOR[p.phase] || T.accent
              const [min, max] = p.days
              const dayLabel = min === max ? `day ${min}` : `days ${min}–${max}`
              const sentence = p.type === 'symptom'
                ? `Your ${display.toLowerCase()} tend to land in your ${p.phase} phase — ${dayLabel}`
                : `You often feel '${display}' in your ${p.phase} phase — ${dayLabel}`
              const concentration = Math.round((p.concentration || 0) * 100)
              return (
                <div key={p.id} className="glass-card insight-stagger" style={{ padding: 14, borderLeft: `3px solid ${color}`, borderRadius: T.r, animationDelay: `${320 + idx * 70}ms` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flexShrink: 0, color: color, marginTop: 2, opacity: 0.85 }}>
                      <SymptomIcon id={iconId} size={32} />
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
        </div>

        {/* Long-form reflection — only shown once there's something
            real to look back on. The gate lives in buildYearNarrative. */}
        {(cycle.cyclesLogged >= 2 || Object.keys(logs || {}).length >= 30) && (
          <button onClick={() => go('yourYear')}
            className="glass-card insight-stagger"
            style={{ marginTop: 22, padding: 18, borderLeft: `3px solid ${T.accent}`, borderRadius: T.r, textAlign: 'left', width: '100%', cursor: 'pointer', color: T.text, fontFamily: 'inherit', display: 'block', animationDelay: '420ms' }}>
            <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.2, fontWeight: 600, color: T.muted, marginBottom: 8 }}>
              A longer look back
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 19, fontWeight: 500, lineHeight: 1.3, letterSpacing: -0.2, marginBottom: 6 }}>
              Your year with Luna →
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 13.5, color: T.muted, fontStyle: 'italic', lineHeight: 1.55 }}>
              The narrative version — what your body taught Luna this year, in long form.
            </div>
          </button>
        )}

        <div style={{ height: 16 }} />
      </div>
      </Screen>
    </div>
  )
}
