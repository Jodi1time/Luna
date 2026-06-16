import { useState } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, Rule, SourceLine, Screen } from '../components/shared'
import { PHASES, SYMPTOMS } from '../data/lunaData'
import { useCycle, detectSymptomPatterns, detectBBTShift, isOnHormonalBC, getPhaseForDay } from '../hooks/useCycle'
import { matchConditions } from '../data/conditions'
import { SymptomIcon, MOOD_LABELS } from '../components/symptomIcons'
import { PhaseFlourish } from '../components/phaseFlourishes'
import { useCountUp } from '../hooks/useCountUp'
import { WhyChip, SourceTag } from '../components/Sourced'
import Backdrop from '../components/Backdrop'
import useLuna from '../store/useLuna'
import { sectionColors, sectionPaper } from '../data/sectionPalette'
import { getBcCycleModel } from '../lib/bcCycle'
import { choreoOnce } from '../lib/choreo'
import { Constellation, MoonMark } from '../components/Illustrations'

// Stroke-arc path between two angles at radius r — the building block
// of the wheel's phase bands. Stroked arcs with round linecaps read
// as drawn bands (premium, hand-set) where the old filled per-day
// segments read as a pie chart.
function ringArc(cx, cy, r, a0, a1) {
  const rad = (a) => (a * Math.PI) / 180
  const x0 = cx + r * Math.cos(rad(a0))
  const y0 = cy + r * Math.sin(rad(a0))
  const x1 = cx + r * Math.cos(rad(a1))
  const y1 = cy + r * Math.sin(rad(a1))
  const large = (a1 - a0) > 180 ? 1 : 0
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`
}

// Cycle wheel — four phase bands around the day number. Quiet base
// bands show the whole cycle's shape; a brighter overlay fills in the
// days already lived, ending exactly at the "you are here" marker, so
// the wheel reads as a journey in progress instead of a static chart.
// Each band is one large tap target into that phase's teaching surface.
function CycleWheel({ cycleDay, cycleLength, periodLength, bbtShift, onTapPhase, animate = true }) {
  if (!cycleDay || !cycleLength) return null
  const animatedCenter = useCountUp(cycleDay, animate ? 1100 : 0)
  const size = 260
  const r = 110
  const cx = size / 2
  const cy = size / 2
  const BAND = 13          // stroke width of the phase bands
  const GAP  = 3.2         // degrees of breathing room at each phase boundary
  const angleFor = (day) => ((day - 1) / cycleLength) * 360 - 90
  const todayAngle = angleFor(cycleDay + 0.5)

  // Phase ranges in days — mirrors getPhaseForDay's boundaries.
  const ovStart = Math.round(cycleLength / 2) - 1
  const ovEnd   = Math.round(cycleLength / 2) + 1
  const bands = [
    { id: 'menstrual',  from: 1,           to: periodLength },
    { id: 'follicular', from: periodLength + 1, to: ovStart - 1 },
    { id: 'ovulation',  from: ovStart,     to: ovEnd },
    { id: 'luteal',     from: ovEnd + 1,   to: cycleLength },
  ].filter((b) => b.to >= b.from).map((b) => {
    const a0 = angleFor(b.from) + GAP / 2
    const a1 = angleFor(b.to + 1) - GAP / 2
    // Lived overlay — the slice of this band already travelled,
    // ending at the marker so "bright" always means "behind you".
    const livedEnd = Math.min(a1, todayAngle)
    return {
      ...b,
      color: PHASES[b.id].color,
      path: ringArc(cx, cy, r, a0, Math.max(a1, a0 + 0.1)),
      livedPath: livedEnd > a0 ? ringArc(cx, cy, r, a0, livedEnd) : null,
    }
  })

  const todayPhase = getPhaseForDay(cycleDay, cycleLength, periodLength)

  // Today marker — sits on the band at today's angle.
  const markerRad = (todayAngle * Math.PI) / 180
  const mx = cx + r * Math.cos(markerRad)
  const my = cy + r * Math.sin(markerRad)

  // Fertile window — soft outer halo from the detected BBT shift when
  // we have one, otherwise the calendar midpoint. Only when in or near.
  const ovDay = bbtShift?.shiftDayMedian ?? Math.round(cycleLength / 2)
  const fertileStart = Math.max(1, ovDay - 5)
  const fertileEnd   = Math.min(cycleLength, ovDay + 1)
  const inOrNearFertile = cycleDay >= fertileStart - 3 && cycleDay <= fertileEnd + 3
  const fertileHaloPath = inOrNearFertile
    ? ringArc(cx, cy, r + 13, angleFor(fertileStart), angleFor(fertileEnd + 1))
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 18, marginBottom: 6 }}>
      <svg width={size} height={size} style={{ overflow: 'visible' }}>
        {/* Outer fertile-window halo — only when in or near fertile days */}
        {fertileHaloPath && (
          <path d={fertileHaloPath} fill="none" stroke={PHASES.ovulation.color}
            strokeWidth={5} strokeLinecap="round"
            className="fertile-glow"
            style={{ filter: 'blur(4px)' }} />
        )}
        {bands.map((b, idx) => (
          <g key={b.id}>
            {/* Base band — the cycle's whole shape, quiet */}
            <path d={b.path} fill="none" stroke={b.color}
              strokeWidth={BAND} strokeLinecap="round"
              className="arc-draw"
              style={{ animationDelay: `${idx * 110}ms`, '--final-opacity': 0.22 }} />
            {/* Lived overlay — days already travelled, bright */}
            {b.livedPath && (
              <path d={b.livedPath} fill="none" stroke={b.color}
                strokeWidth={BAND} strokeLinecap="round"
                className="arc-draw"
                style={{ animationDelay: `${260 + idx * 110}ms`, '--final-opacity': 0.9 }} />
            )}
            {/* Hit area — generous invisible stroke so each phase is
                one big tap target into its teaching surface */}
            {onTapPhase && (
              <path d={b.path} fill="none" stroke="#000" strokeOpacity={0}
                strokeWidth={30} strokeLinecap="round"
                role="button" aria-label={`Read about the ${b.id} phase`}
                onClick={() => onTapPhase(b.id)}
                style={{ cursor: 'pointer' }} />
            )}
          </g>
        ))}
        {/* Soft glow under the marker — quiet phase-color halo */}
        <circle cx={mx} cy={my} r={11} fill={todayPhase.color} opacity={0.25}
          style={{ filter: 'blur(3px)' }} />
        {/* Outer pulsing ring — the heartbeat of "you are here" */}
        <circle cx={mx} cy={my} r={5} fill={todayPhase.color}
          className="wheel-today-pulse" />
        {/* Today marker — solid disc on top of the band */}
        <circle cx={mx} cy={my} r={5} fill="#fff" stroke={todayPhase.color} strokeWidth={1.8} />
        {/* Center — huge italic day number + small serif "of X" */}
        <text x={cx} y={cy + 2} textAnchor="middle"
          style={{ fontFamily: T.serif, fontSize: 92, fontWeight: 300, fill: todayPhase.color, fontStyle: 'italic', letterSpacing: -3 }}>
          {animatedCenter}
        </text>
        <text x={cx} y={cy + 26} textAnchor="middle"
          style={{ fontFamily: T.serif, fontSize: 12, fill: T.muted, fontStyle: 'italic', letterSpacing: 0.3 }}>
          of {cycleLength}
        </text>
      </svg>
      <button
        type="button"
        onClick={onTapPhase ? () => onTapPhase(todayPhase.id) : undefined}
        disabled={!onTapPhase}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 18, background: 'transparent', border: 'none', padding: 0, cursor: onTapPhase ? 'pointer' : 'default', fontFamily: 'inherit' }}
      >
        <div style={{ fontFamily: T.serif, fontSize: 18, color: T.text, fontStyle: 'italic', letterSpacing: -0.2 }}>
          You're in your <em style={{ color: todayPhase.color, fontStyle: 'normal', fontWeight: 500 }}>{todayPhase.name.toLowerCase()}</em> phase.
        </div>
        <span style={{ color: todayPhase.color, opacity: 0.78, display: 'inline-flex' }} aria-hidden="true">
          <PhaseFlourish phaseId={todayPhase.id} size={22} />
        </span>
      </button>
      {onTapPhase && (
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12, color: T.muted, marginTop: 6, opacity: 0.75 }}>
          tap any phase to read about it
        </div>
      )}
    </div>
  )
}

// Method-true wheel — the cycle wheel is load-bearing ("cycles are
// circles"), so hormonal-BC users keep the circle, but the ring shows
// THEIR timeline instead of natural phases that aren't happening:
//   - pill / patch / ring → 28 pack-day segments (active accent,
//     placebo week in menstrual rose), center = pack day
//   - shot → 12 week segments filling as the weeks pass, center =
//     weeks since the last injection; the whole ring turns rose
//     when she's past the window
function BcWheel({ model, animate = true }) {
  const isPack = model.kind === 'pillPack'
  const total = isPack ? 28 : 12
  const big = model.cover?.bigNumber ?? 0
  const current = isPack ? big : Math.min(big + 1, total)
  const urgent = !isPack && !!model.nextThing?.urgent
  const animatedCenter = useCountUp(big, animate ? 1100 : 0)
  const size = 260
  const r = 110
  const cx = size / 2
  const cy = size / 2
  const BAND = 13
  const GAP = 3.2
  const angleFor = (unit) => ((unit - 1) / total) * 360 - 90
  const hereAngle = angleFor(Math.min(current, total) + 0.5)
  // Bands — same stroked-band + lived-overlay language as the natural
  // wheel. Pack wheel splits active days / placebo week; the shot
  // wheel is one continuous 12-week band (rose when she's past the
  // window), filling as the weeks pass.
  const rawBands = isPack
    ? [
        { id: 'active',  from: 1,  to: 21, color: T.accent },
        { id: 'placebo', from: 22, to: 28, color: PHASES.menstrual.color },
      ]
    : [
        { id: 'weeks', from: 1, to: 12, color: urgent ? PHASES.menstrual.color : T.accent },
      ]
  const bands = rawBands.map((b) => {
    const a0 = angleFor(b.from) + (isPack ? GAP / 2 : 0)
    const a1 = angleFor(b.to + 1) - (isPack ? GAP / 2 : 0)
    const livedEnd = Math.min(a1, hereAngle)
    return {
      ...b,
      path: ringArc(cx, cy, r, a0, Math.max(a1, a0 + 0.1)),
      livedPath: livedEnd > a0 ? ringArc(cx, cy, r, a0, livedEnd) : null,
    }
  })
  const markerRad = (hereAngle * Math.PI) / 180
  const mx = cx + r * Math.cos(markerRad)
  const my = cy + r * Math.sin(markerRad)
  const markerColor = urgent || (isPack && current > 21) ? PHASES.menstrual.color : T.accent
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 18, marginBottom: 6 }}>
      <svg width={size} height={size} style={{ overflow: 'visible' }}>
        {bands.map((b, idx) => (
          <g key={b.id}>
            <path d={b.path} fill="none" stroke={b.color}
              strokeWidth={BAND} strokeLinecap="round"
              className="arc-draw"
              style={{ animationDelay: `${idx * 110}ms`, '--final-opacity': urgent ? 0.3 : 0.22 }} />
            {b.livedPath && (
              <path d={b.livedPath} fill="none" stroke={b.color}
                strokeWidth={BAND} strokeLinecap="round"
                className="arc-draw"
                style={{ animationDelay: `${260 + idx * 110}ms`, '--final-opacity': 0.9 }} />
            )}
          </g>
        ))}
        <circle cx={mx} cy={my} r={11} fill={markerColor} opacity={0.25}
          style={{ filter: 'blur(3px)' }} />
        <circle cx={mx} cy={my} r={5} fill={markerColor}
          className="wheel-today-pulse" />
        <circle cx={mx} cy={my} r={5} fill="#fff" stroke={markerColor} strokeWidth={1.8} />
        <text x={cx} y={cy + 2} textAnchor="middle"
          style={{ fontFamily: T.serif, fontSize: 92, fontWeight: 300, fill: markerColor, fontStyle: 'italic', letterSpacing: -3 }}>
          {animatedCenter}
        </text>
        <text x={cx} y={cy + 26} textAnchor="middle"
          style={{ fontFamily: T.serif, fontSize: 12, fill: T.muted, fontStyle: 'italic', letterSpacing: 0.3 }}>
          {isPack ? 'of 28 · pack day' : 'of 12 weeks'}
        </text>
      </svg>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 18 }}>
        <div style={{ fontFamily: T.serif, fontSize: 18, color: T.text, fontStyle: 'italic', letterSpacing: -0.2 }}>
          {isPack
            ? <>You're in your <em style={{ color: markerColor, fontStyle: 'normal', fontWeight: 500 }}>{model.cover.headline.toLowerCase()}</em>.</>
            : <><em style={{ color: markerColor, fontStyle: 'normal', fontWeight: 500 }}>{big} week{big === 1 ? '' : 's'}</em> since your last shot.</>}
        </div>
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
function CycleSummaryCard({ cycleLength, periodLength, variance, cyclesLogged, animate = true }) {
  if (!cycleLength) return null
  const animCL = useCountUp(cycleLength, animate ? 1200 : 0)
  const animPL = useCountUp(periodLength || 0, animate ? 1200 : 0)
  const animCY = useCountUp(cyclesLogged || 0, animate ? 1400 : 0)
  const clTag = cycleLengthTag(cycleLength)
  const plTag = periodLengthTag(periodLength)
  const vTag  = varianceTag(variance?.conf)
  return (
    <div className="insight-stagger alive-card" style={{ padding: 18, background: sectionPaper('body'), border: `1px solid ${sectionColors('body').accent}22`, boxShadow: `0 1px 0 ${sectionColors('body').accent}10, 0 14px 30px -20px ${sectionColors('body').accent}40`, borderRadius: 20, marginBottom: 22, animationDelay: '120ms' }}>
      <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 1.2, fontWeight: 600, color: T.muted, marginBottom: 8 }}>
        Your cycles
      </div>
      <div style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 400, lineHeight: 1.45, color: T.text, letterSpacing: -0.2 }}>
        About <em style={{ color: T.accent, fontStyle: 'normal', fontWeight: 500 }}>{animCL} days</em>, end to end — {clTag}. Your bleed runs about <em style={{ color: T.accent, fontStyle: 'normal', fontWeight: 500 }}>{animPL} day{animPL === 1 ? '' : 's'}</em> — {plTag}.
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 10, borderTop: `1px solid ${T.hair}` }}>
        <span style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 1, color: T.muted, fontWeight: 600 }}>RHYTHM</span>
        <span style={{ fontFamily: T.serif, fontSize: 13.5, fontStyle: 'italic', color: T.text, fontWeight: 500 }}>
          {vTag}
        </span>
        {cyclesLogged > 0 && (
          <span style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 0.5, color: T.muted, marginLeft: 'auto' }}>
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
        className="spark-dot" style={{ animationDelay: '1.05s', fontFamily: T.mono, fontSize: 9.5, letterSpacing: 0.6, fill: PHASES.ovulation.color, fontWeight: 600, transformOrigin: `${shiftX}px ${padY}px` }}>
        DAY {bbtShift.shiftDayMedian}
      </text>
      {/* Two reading dots — follicular avg + luteal avg */}
      <circle cx={padX + innerW * 0.18} cy={yLow}  r={3.2} fill={PHASES.follicular.color}
        className="spark-dot" style={{ animationDelay: '1.0s' }} />
      <circle cx={padX + innerW * 0.82} cy={yHigh} r={3.2} fill={PHASES.luteal.color}
        className="spark-dot" style={{ animationDelay: '1.15s' }} />
      {/* Tiny labels under the dots */}
      <text x={padX + innerW * 0.18} y={yLow + 14}
        textAnchor="middle" style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 0.5, fill: T.muted, fontWeight: 600, opacity: 0.85 }}>
        {bbtShift.follicularAvg}°
      </text>
      <text x={padX + innerW * 0.82} y={yHigh - 6}
        textAnchor="middle" style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 0.5, fill: T.muted, fontWeight: 600, opacity: 0.85 }}>
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

const PHASE_PATTERN_COPY = {
  menstrual:  'your period days',
  follicular: 'your follicular days',
  ovulation:  'your ovulation window',
  luteal:     'your luteal days',
}

function dayWindowLabel(days = []) {
  const [min, max] = days
  if (min == null || max == null) return ''
  return min === max ? `day ${min}` : `days ${min}–${max}`
}

function patternLeadSentence(pattern, display) {
  const phaseLabel = PHASE_PATTERN_COPY[pattern.phase] || `${pattern.phase} phase`
  if (pattern.type === 'symptom') return `${display} shows up most in ${phaseLabel}.`
  return `${display} moods keep gathering in ${phaseLabel}.`
}

function PatternLeadCard({ patterns, cyclesLogged, loggedDays, accent }) {
  const primary = patterns[0]
  if (!primary) return null
  const secondary = patterns[1] || null
  const { iconId, display } = resolvePattern(primary)
  const primaryColor = PHASE_COLOR[primary.phase] || accent
  const concentration = Math.round((primary.concentration || 0) * 100)
  const secondaryResolved = secondary ? resolvePattern(secondary) : null

  return (
    <div className="insight-stagger alive-card"
      style={{
        marginBottom: 22,
        padding: 18,
        background: 'rgba(253,250,245,0.62)',
        border: `1px solid ${primaryColor}22`,
        borderRadius: 20,
        boxShadow: `0 1px 0 ${primaryColor}10, 0 14px 28px -24px ${primaryColor}38`,
        animationDelay: '110ms',
      }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          flexShrink: 0,
          width: 42,
          height: 42,
          borderRadius: 14,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `${primaryColor}10`,
          color: primaryColor,
        }}>
          <SymptomIcon id={iconId} size={24} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 1.2, fontWeight: 600, color: primaryColor, marginBottom: 8 }}>
            Pattern detected
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 24, fontWeight: 500, letterSpacing: -0.45, lineHeight: 1.18, color: T.text, marginBottom: 8 }}>
            {patternLeadSentence(primary, display)}
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 14.5, lineHeight: 1.58, color: T.muted, fontStyle: 'italic' }}>
            {primary.occurrences} time{primary.occurrences === 1 ? '' : 's'} across {primary.cycles} cycle{primary.cycles === 1 ? '' : 's'}, most often around {dayWindowLabel(primary.days)}.
          </div>
        </div>
      </div>

      {secondary && secondaryResolved && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${primaryColor}14` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: PHASE_COLOR[secondary.phase] || accent, opacity: 0.8, display: 'inline-flex' }}>
              <SymptomIcon id={secondaryResolved.iconId} size={16} />
            </span>
            <div style={{ fontFamily: T.serif, fontSize: 13.5, lineHeight: 1.5, color: T.text, fontStyle: 'italic' }}>
              Also: {secondary.type === 'symptom'
                ? `${secondaryResolved.display.toLowerCase()} shows up around ${dayWindowLabel(secondary.days)}.`
                : `${secondaryResolved.display.toLowerCase()} moods keep showing up around ${dayWindowLabel(secondary.days)}.`}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.hair}` }}>
        <span style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 0.8, fontWeight: 600, color: T.muted }}>
          {concentration}% concentration
        </span>
        <span style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 0.8, fontWeight: 600, color: T.muted }}>
          {cyclesLogged} cycle{cyclesLogged === 1 ? '' : 's'} tracked
        </span>
        <span style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 0.8, fontWeight: 600, color: T.muted }}>
          {loggedDays} day{loggedDays === 1 ? '' : 's'} logged
        </span>
      </div>
    </div>
  )
}

export default function Insights() {
  const store = useLuna()
  const cycle = useCycle(store)
  // Entrance choreography plays once per session; re-visits render settled.
  const [animate] = useState(() => choreoOnce('insights'))
  const { phase, periodHistory } = cycle
  const logs = useLuna((s) => s.logs)
  const birthControl = useLuna((s) => s.birthControl)
  const go = useLuna((s) => s.go)
  const onHormonalBC = isOnHormonalBC(birthControl)
  // Method-aware model — pill/patch/ring and the shot get a wheel
  // that shows their real timeline; the natural-cycle summary card
  // is hidden for all hormonal methods (its math isn't true for them).
  const bcModel = getBcCycleModel(birthControl)
  const bcMode = onHormonalBC && !bcModel.showNaturalPhases
  const showBcWheel = bcMode && (bcModel.kind === 'pillPack' || bcModel.kind === 'injection') && !bcModel.missingStartDate
  const patterns = detectSymptomPatterns(logs, periodHistory, cycle.cycleLength, cycle.periodLength)
  const cyclesLogged = periodHistory ? periodHistory.length : 0
  const bbtShift = !onHormonalBC ? cycle.bbtShift : null
  const ovulation = !onHormonalBC ? cycle.ovulation : null
  const cycleDay = cycle.cycleDay
  const loggedDays = Object.keys(logs || {}).length
  const goPhase = useLuna((s) => s.goPhase)
  // Gentle condition matching — surfaces conditions worth knowing about
  // based on log patterns. Never diagnostic. Hidden when no matches
  // clear the score threshold.
  const conditionMatches = matchConditions(logs, cycle)

  const blobColor = (phase?.color) || T.accent

  return (
    <div className={`home-stage${animate ? '' : ' choreo-done'}`}>
      {!onHormonalBC && <Backdrop accent={blobColor} subtle />}
      <Screen>
        <div style={{ position: 'relative', zIndex: 1, padding: '20px 22px 0', color: T.text }}>
        <div className="insight-stagger" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginTop: 6, marginBottom: 10, animationDelay: '0ms' }}>
          <div style={{ fontFamily: T.serif, fontSize: 40, fontWeight: 500, letterSpacing: -1, lineHeight: 1, flex: 1 }}>
            What we've noticed.
          </div>
          <div aria-hidden="true" style={{ color: (phase?.color || T.accent), opacity: 0.6, paddingTop: 4 }}>
            <MoonMark size={28} />
          </div>
        </div>
        <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 14, lineHeight: 1.55, color: T.muted, marginBottom: 18, fontStyle: 'italic', animationDelay: '60ms' }}>
          Patterns Luna sees across your cycles, gathered gently.
        </div>

        {/* Cycle wheel — circular visualization of where you are. Now
            always renders so it's visible regardless of BC method or
            whether the user has logged anything yet. */}
        <div className="insight-stagger" style={{ marginBottom: 22, animationDelay: '80ms' }}>
          {showBcWheel ? (
            <BcWheel model={bcModel} animate={animate} />
          ) : cycleDay ? (
            <>
              <CycleWheel cycleDay={cycleDay} cycleLength={cycle.cycleLength} periodLength={cycle.periodLength} bbtShift={bbtShift} onTapPhase={goPhase} animate={animate} />
              {onHormonalBC && (
                <div style={{ fontFamily: T.serif, fontSize: 13, color: T.muted, marginTop: 8, fontStyle: 'italic', textAlign: 'center', maxWidth: 280, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.55 }}>
                  Your method softens the natural phase pattern — this is the underlying cycle Luna still tracks for you.
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
              <CycleWheel cycleDay={1} cycleLength={cycle.cycleLength || 28} periodLength={cycle.periodLength || 5} bbtShift={null} onTapPhase={goPhase} animate={animate} />
              <div style={{ fontFamily: T.serif, fontSize: 14, color: T.muted, marginTop: 8, fontStyle: 'italic', textAlign: 'center', maxWidth: 260, lineHeight: 1.5 }}>
                Log your first period and Luna will mark where you are on the wheel.
              </div>
            </div>
          )}
        </div>

        {patterns.length > 0 && (
          <PatternLeadCard
            patterns={patterns}
            cyclesLogged={cyclesLogged}
            loggedDays={loggedDays}
            accent={phase?.color || T.accent}
          />
        )}

        {/* Cycle summary — the "you are normal" surface most apps don't
            do. Hidden on hormonal BC: "about 28 days, within typical
            range" is pack math or stale data there, not her body. */}
        {!bcMode && (
          <CycleSummaryCard
            cycleLength={cycle.cycleLength}
            periodLength={cycle.periodLength}
            variance={cycle.variance}
            cyclesLogged={cyclesLogged}
          />
        )}

        {/* The accuracy receipt — Luna grades its own predictions
            against her actual periods (backtested per cycle, see
            predictionAccuracy). Honest in both directions: it shows
            the misses too. The per-user claim competitors don't make. */}
        {!bcMode && cycle.accuracy && (() => {
          const a = cycle.accuracy
          const strong = a.avgError <= 1.5
          const mid = !strong && a.avgError <= 3
          const c = sectionColors('care')
          return (
            <div className="insight-stagger alive-card" style={{ padding: 18, background: sectionPaper('care'), border: `1px solid ${c.accent}22`, boxShadow: `0 1px 0 ${c.accent}10, 0 14px 30px -20px ${c.accent}40`, borderRadius: 20, marginBottom: 22, animationDelay: '150ms' }}>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, fontWeight: 500, color: c.accent, letterSpacing: -0.1, marginBottom: 8 }}>
                how the predictions have landed
              </div>
              <div style={{ fontFamily: T.serif, fontSize: 19, fontWeight: 500, lineHeight: 1.3, letterSpacing: -0.3, marginBottom: 8 }}>
                {strong
                  ? <>Within a day, <em style={{ color: c.accent }}>{a.within1} of {a.cycles}</em> times.</>
                  : mid
                    ? <>Within two days, <em style={{ color: c.accent }}>{a.within2} of {a.cycles}</em> times.</>
                    : <>Your cycles keep their own counsel.</>}
              </div>
              <div style={{ fontFamily: T.serif, fontSize: 13.5, color: T.muted, fontStyle: 'italic', lineHeight: 1.6, marginBottom: 4 }}>
                {strong || mid
                  ? `Measured against your last ${a.cycles} periods — each prediction re-run with only what Luna knew at the time, then scored against the day your period actually came. A scorecard, not a promise.`
                  : `Right now predictions are averaging about ±${a.avgError} days for you. Bodies aren't metronomes — every cycle you log tightens the call.`}
              </div>
              <WhyChip label="how this is measured" color={c.accent} source="Backtested against your own logged periods">
                For each of your last {a.cycles} periods, Luna went back in time: it re-computed the prediction using only the cycles that came before, then compared it to when that period actually arrived. {a.within1} landed within ±1 day, {a.within2} within ±2{a.avgError > 0 ? `, averaging ±${a.avgError} days overall` : ''}. No app can promise the future — this shows you the track record instead.
              </WhyChip>
            </div>
          )
        })()}

        <div className="insight-stagger" style={{ animationDelay: '180ms' }}>
        <Eyebrow>Where you are now</Eyebrow>
        {onHormonalBC ? (
          <>
            <div style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 500, letterSpacing: -0.5, lineHeight: 1.15, marginBottom: 14 }}>
              Your cycle is shaped by your method, <em style={{ color: T.accent }}>but symptoms still tell a story.</em>
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 15.5, lineHeight: 1.6, marginBottom: 12 }}>
              {bcModel.cover?.presence && !bcModel.missingStartDate
                ? bcModel.cover.presence
                : 'Hormonal contraception softens the natural phase pattern.'}
              {' '}Moods, headaches, and other symptoms can still cluster — keep logging and Luna will surface what repeats.
            </div>
            <button onClick={() => go('bcMethod')}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.accent, fontFamily: T.serif, fontStyle: 'italic', fontSize: 13.5, padding: '0 0 10px', textAlign: 'left', letterSpacing: -0.1, display: 'block' }}>
              A deeper read on your method →
            </button>
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

        {ovulation && (
          <div className="insight-stagger" style={{ marginBottom: 22, animationDelay: '240ms' }}>
            <Eyebrow>Your ovulation marker</Eyebrow>
            <div className="alive-card" style={{ padding: 18, background: sectionPaper('care'), border: `1px solid ${sectionColors('care').accent}22`, boxShadow: `0 1px 0 ${sectionColors('care').accent}10, 0 14px 30px -20px ${sectionColors('care').accent}40`, borderRadius: 20, marginTop: 4 }}>
              {/* Confidence pill — multi-signal cases get visibly louder.
                  Very-high / high cases use phase color; medium grey; low grey. */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                <div style={{
                  fontFamily: T.sans, fontSize: 11, letterSpacing: 1.5, fontWeight: 700, textTransform: 'uppercase',
                  padding: '4px 10px', borderRadius: 999,
                  background: ovulation.confidence === 'very-high' || ovulation.confidence === 'high'
                    ? PHASES.ovulation.color
                    : ovulation.confidence === 'medium' ? T.muted : 'rgba(26,19,16,0.10)',
                  color: ovulation.confidence === 'very-high' || ovulation.confidence === 'high'
                    ? '#fff'
                    : ovulation.confidence === 'medium' ? '#fff' : T.muted,
                }}>
                  {ovulation.confidence === 'very-high' ? 'High confidence' : ovulation.confidence === 'high' ? 'High confidence' : ovulation.confidence === 'medium' ? 'Medium confidence' : 'Low confidence'}
                </div>
                <div style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, letterSpacing: 0.4, fontWeight: 600 }}>
                  {ovulation.signals.length === 1 ? '1 signal' : `${ovulation.signals.length} signals`}
                </div>
              </div>
              <div style={{ fontFamily: T.serif, fontSize: 19, fontWeight: 500, marginBottom: 12, lineHeight: 1.3 }}>
                You ovulate around <em style={{ color: T.accent }}>day {ovulation.day}.</em>
              </div>

              {/* Signal chips — show each contributing signal with its day */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {ovulation.signals.map((s) => (
                  <div key={s.type} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px',
                    background: 'rgba(253,250,245,0.55)',
                    border: '1px solid rgba(26,19,16,0.06)',
                    borderRadius: 14,
                  }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: 999,
                      background: s.type === 'bbt' ? PHASES.ovulation.color
                                : s.type === 'mucus' ? PHASES.follicular.color
                                : PHASES.luteal.color,
                    }} />
                    <span style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13.5, color: T.text, letterSpacing: -0.1, flex: 1 }}>
                      {s.detail}
                    </span>
                    <span style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, letterSpacing: 0.4, fontWeight: 600 }}>
                      day {s.day}
                    </span>
                  </div>
                ))}
              </div>

              {/* Mini sparkline — only when BBT is one of the signals */}
              {bbtShift && <BBTSparkline bbtShift={bbtShift} cycleLength={cycle.cycleLength} />}

              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: T.muted, lineHeight: 1.6, marginTop: bbtShift ? 8 : 0 }}>
                {ovulation.why}
              </div>

              {/* When BBT is one of the signals, expose the underlying numbers */}
              {bbtShift && (
                <div style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, letterSpacing: 0.5, paddingTop: 10, marginTop: 10, borderTop: `1px solid ${T.hair}` }}>
                  {bbtShift.follicularAvg}°{bbtShift.unit} → {bbtShift.lutealAvg}°{bbtShift.unit} · {bbtShift.samples} reading{bbtShift.samples === 1 ? '' : 's'}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="insight-stagger" style={{ animationDelay: '280ms' }}>
        <Eyebrow>{patterns.length > 0 ? 'A closer look' : 'What keeps coming back'}</Eyebrow>
        {patterns.length === 0 ? (
          <div className="alive-card" style={{
            marginTop: 6,
            padding: 20,
            background: 'rgba(253,250,245,0.58)',
            border: `1px solid ${(phase?.color || T.accent)}18`,
            borderRadius: 20,
            boxShadow: `0 1px 0 ${(phase?.color || T.accent)}10, 0 12px 26px -24px ${(phase?.color || T.accent)}34`,
          }}>
            {/* Constellation forming — points connecting into a shape,
                "patterns become visible with more of them." */}
            <div style={{ marginBottom: 8 }}>
              <Constellation size={150} accent={phase?.color || T.accent} />
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 500, letterSpacing: -0.28, lineHeight: 1.24, marginBottom: 6 }}>
              {cyclesLogged < 2 ? 'Your patterns are still forming.' : 'No strong patterns yet.'}
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 13.5, fontStyle: 'italic', color: T.muted, lineHeight: 1.55 }}>
              {cyclesLogged < 2
                ? 'Patterns surface after about a cycle of logging. Luna is paying attention — keep going.'
                : "Keep logging and they'll arrive here as they emerge. Three connected dots make a constellation."}
            </div>
            {cyclesLogged > 0 && (
              <div style={{ marginTop: 12, fontFamily: T.mono, fontSize: 11, letterSpacing: 1, color: T.muted, fontWeight: 600 }}>
                {cyclesLogged} CYCLE{cyclesLogged === 1 ? '' : 'S'} TRACKED · {Object.keys(logs || {}).length} DAY{Object.keys(logs || {}).length === 1 ? '' : 'S'} LOGGED
              </div>
            )}
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
              // Pull body-literacy depth from SYMPTOMS for symptom patterns.
              // The dict has why + evidence + source — surface these so each
              // pattern card teaches instead of just stating the pattern.
              const sym = p.type === 'symptom' ? SYMPTOMS[p.label] : null
              const title = p.type === 'symptom'
                ? `${display} shows up here.`
                : `${display} moods keep showing up here.`
              return (
                <div key={p.id} className="insight-stagger alive-card" style={{ padding: 18, background: 'rgba(253,250,245,0.6)', border: `1px solid ${color}20`, boxShadow: `0 1px 0 ${color}10, 0 14px 28px -24px ${color}32`, borderRadius: 20, animationDelay: `${320 + idx * 70}ms` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flexShrink: 0, color: color, marginTop: 2, opacity: 0.85 }}>
                      <SymptomIcon id={iconId} size={32} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, letterSpacing: 1.1, fontWeight: 600, color: color, fontFamily: T.mono, marginBottom: 6 }}>
                        {p.phase} phase · {dayLabel}
                      </div>
                      <div style={{ fontFamily: T.serif, fontSize: 19, fontWeight: 500, marginBottom: 6, lineHeight: 1.24, letterSpacing: -0.25 }}>
                        {title}
                      </div>
                      <div style={{ fontSize: 13.5, color: T.muted, lineHeight: 1.55, fontFamily: T.serif, fontStyle: 'italic' }}>
                        {sentence}.
                      </div>
                      <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        <span style={{ fontSize: 11, fontFamily: T.mono, color: T.muted, letterSpacing: 0.4, fontWeight: 600 }}>
                          {p.occurrences} occurrence{p.occurrences === 1 ? '' : 's'}
                        </span>
                        <span style={{ fontSize: 11, fontFamily: T.mono, color: T.muted, letterSpacing: 0.4, fontWeight: 600 }}>
                          {p.cycles} cycle{p.cycles === 1 ? '' : 's'}
                        </span>
                        <span style={{ fontSize: 11, fontFamily: T.mono, color: T.muted, letterSpacing: 0.4, fontWeight: 600 }}>
                          {concentration}% concentration
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Teach layer — sourced "why" + actionable "what helps".
                      Pulled from SYMPTOMS dict so every pattern doubles as a
                      body-literacy moment instead of just a stat. */}
                  {sym && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${color}14` }}>
                      <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 1.2, fontWeight: 600, color: color, marginBottom: 6 }}>
                        Why this happens
                      </div>
                      <div style={{ fontFamily: T.serif, fontSize: 13.5, lineHeight: 1.55, color: T.text, fontStyle: 'italic', marginBottom: 10 }}>
                        {sym.why}
                      </div>
                      {Array.isArray(sym.evidence) && sym.evidence.length > 0 && (
                        <>
                          <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 1.2, fontWeight: 600, color: T.muted, marginBottom: 6 }}>
                            What helps
                          </div>
                          <ul style={{ margin: 0, paddingLeft: 18, fontFamily: T.serif, fontSize: 13, lineHeight: 1.55, color: T.text }}>
                            {sym.evidence.slice(0, 3).map((e, ei) => (
                              <li key={ei} style={{ marginBottom: 4 }}>{e}</li>
                            ))}
                          </ul>
                        </>
                      )}
                      <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {sym.source && <SourceTag color={color} compact>{sym.source}</SourceTag>}
                        {sym.redFlag && (
                          <WhyChip label="when to ask a doctor" color={PHASES.menstrual.color} source={sym.source}>
                            {sym.redFlag}
                          </WhyChip>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        </div>

        {/* Quiet condition surfacing — when log patterns line up with
            something worth knowing, Luna leaves a soft note. NEVER
            diagnostic — just the language to bring to a conversation
            if she ever wants it. Two cards max so it feels considered,
            not a screening report. */}
        {conditionMatches.length > 0 && (
          <div className="insight-stagger" style={{ marginTop: 28, animationDelay: '420ms' }}>
            <div style={{ fontFamily: T.serif, fontSize: 16, fontStyle: 'italic', letterSpacing: -0.2, marginBottom: 4 }}>
              Some reading, if you want it.
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 13.5, color: T.muted, fontStyle: 'italic', marginBottom: 14, lineHeight: 1.55 }}>
              A few pieces Luna pulled — they line up with what you've been logging. No conclusions, just a doorway in.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {conditionMatches.slice(0, 2).map((m) => (
                <button key={m.id} onClick={() => go('conditions', { activeConditionId: m.id })}
                  className="alive-card"
                  style={{
                    padding: 16,
                    background: 'rgba(253,250,245,0.58)',
                    border: `1px solid ${sectionColors('urgent').accent}22`,
                    borderRadius: 16,
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                    color: T.text, fontFamily: 'inherit',
                    boxShadow: 'none',
                  }}>
                  <div style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 500, letterSpacing: -0.2, marginBottom: 4 }}>
                    Reading on {m.condition.name}
                  </div>
                  <div style={{ fontFamily: T.serif, fontSize: 13, color: T.muted, fontStyle: 'italic', lineHeight: 1.55 }}>
                    {m.condition.summary}
                  </div>
                </button>
              ))}
              <button onClick={() => go('conditions')}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.accent, fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, padding: '4px 0', textAlign: 'left', letterSpacing: -0.1 }}>
                More like this →
              </button>
            </div>
          </div>
        )}

        {/* Long-form reflection — only shown once there's something
            real to look back on. The gate lives in buildYearNarrative. */}
        {(cycle.cyclesLogged >= 2 || Object.keys(logs || {}).length >= 30) && (
          <button onClick={() => go('yourYear')}
            className="glass-card insight-stagger alive-card"
            style={{ marginTop: 22, padding: 20, borderRadius: 22, textAlign: 'left', width: '100%', cursor: 'pointer', color: T.text, fontFamily: 'inherit', display: 'block', animationDelay: '420ms' }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 1.2, fontWeight: 600, color: T.muted, marginBottom: 8 }}>
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
