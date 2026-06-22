// Real cycle phase calculation engine.
// All math is based on a conventional cycle model:
//   Day 1 = first day of period
//   Menstrual  : days 1 – periodLength
//   Estimated ovulation: roughly 14 days before the next period
//   Ovulation phase: the estimated day ± 1
//   Luteal     : remainder through cycleLength

import { PHASES } from '../data/lunaData.js'
import { addCalendarDays, parseDateOnly, toDateKey } from '../lib/dateOnly.js'
import {
  buildBayesianCycleModel,
  buildPhaseDurationModel,
  predictionRangeForHorizon,
} from '../lib/cyclePrediction.js'

const MS_PER_DAY = 86400000

function daysBetween(aISO, bISO) {
  const a = parseDateOnly(aISO)
  const b = parseDateOnly(bISO)
  return Math.round((b - a) / MS_PER_DAY)
}

// ── Period detection from flow logs ──────────────────────────
// A period start = the first day of a continuous stretch of flow
// (≥ Light), defined as: a flow-logged day with NO flow log in
// the previous 7 days.
// 'Spotting' is excluded — it doesn't count as a period start.
// Detect period start days from the logs. Any logged flow day
// (excluding Spotting) is treated as authoritative. A new period
// start = the first flow day in a stretch, where consecutive
// stretches are separated by at least 7 days of no-flow.
//
// We deliberately trust the user here — when she backfills a single
// past day, that's an intentional record, not breakthrough bleeding.
// The previous "require 2+ consecutive days" rule was over-protective
// and broke past-day editing: phase would compute correctly until the
// next hydrate, then revert when detection ignored single-day saves.
export function detectPeriodStarts(logs) {
  const flowDays = Object.entries(logs || {})
    .filter(([, l]) => l?.flow && l.flow !== 'Spotting')
    .map(([d]) => d)
    .sort()
  const starts = []
  for (let i = 0; i < flowDays.length; i++) {
    if (i === 0) { starts.push(flowDays[i]); continue }
    const gap = daysBetween(flowDays[i - 1], flowDays[i])
    if (gap > 7) starts.push(flowDays[i])
  }
  return starts
}

// Merge detected starts with the onboarding-supplied lastPeriodStart
// so the very first cycle (before any logs exist) still anchors predictions.
export function allPeriodStarts(logs, onboardingStart) {
  const detected = detectPeriodStarts(logs)
  if (!onboardingStart) return detected
  // Skip the onboarding date if a detected start is within 7 days of it
  // (avoids double-counting when the user logged on or near the same day).
  const hasNearby = detected.some((d) => Math.abs(daysBetween(d, onboardingStart)) <= 7)
  if (hasNearby) return detected
  return [onboardingStart, ...detected].sort()
}

// Average gap between consecutive period starts, kept around for any
// legacy callers. Prefer weightedCycleLength below.
export function dynamicCycleLength(starts, fallback) {
  if (!starts || starts.length < 2) return fallback
  const gaps = []
  for (let i = 1; i < starts.length; i++) {
    gaps.push(daysBetween(starts[i - 1], starts[i]))
  }
  const valid = gaps.filter((g) => g >= 18 && g <= 60)
  if (valid.length === 0) return fallback
  const avg = valid.reduce((a, b) => a + b, 0) / valid.length
  return Math.round(avg)
}

// Weighted-recency cycle length. Recent cycles dominate the average
// because bodies change — the cycles of two years ago are weaker
// signal than the last three. Weights decay from 1.0 (most recent
// gap) to 0.25 (oldest), clamped to a 6-gap window so a long-time
// user doesn't get pulled by ancient cycles.
//
// Returns { length, weights } so the caller knows what was used.
export function weightedCycleLength(starts, fallback) {
  const model = buildBayesianCycleModel(starts, fallback)
  return { length: model.p50, samples: model.samples, model }
}

// Variance + confidence in the prediction. Returns:
//   stdDev:  std deviation of recent gaps (days)
//   range:   ± days to surface around any predicted date
//   conf:    'high' | 'medium' | 'low' label for UI
//   why:     a short human-readable explanation of the label
//
// Confidence is evidence-aware as well as variance-aware. One observed
// cycle has zero mathematical variance, but that does not make it precise;
// uncertainty floors keep early predictions honest until a pattern repeats.
export function cycleVariance(starts, fallback = 28) {
  const model = buildBayesianCycleModel(starts, fallback)
  return {
    stdDev: model.samples ? model.predictiveSd : null,
    range: model.halfWidth80,
    conf: model.conf,
    label: model.label,
    samples: model.samples,
    why: model.why,
    p10: model.p10,
    p50: model.p50,
    p90: model.p90,
  }
}

// Average length of the actual bleeding stretches in the logs.
// Returns null if we don't have enough data (need a stretch that ended).
export function dynamicPeriodLength(logs, fallback) {
  const flowDays = Object.entries(logs || {})
    .filter(([, l]) => l?.flow && l.flow !== 'Spotting')
    .map(([d]) => d)
    .sort()
  if (flowDays.length === 0) return fallback
  const stretches = []
  let current = [flowDays[0]]
  for (let i = 1; i < flowDays.length; i++) {
    const gap = daysBetween(flowDays[i - 1], flowDays[i])
    if (gap === 1) current.push(flowDays[i])
    else {
      stretches.push(current)
      current = [flowDays[i]]
    }
  }
  stretches.push(current)
  // Only count stretches that have ended (i.e. the last stretch is excluded
  // if it ends within the last 2 days — might still be ongoing)
  const today = new Date(); today.setHours(0,0,0,0)
  const completed = stretches.filter((s) => {
    return daysBetween(s[s.length - 1], toDateKey(today)) > 2
  })
  if (completed.length === 0) return fallback
  const avg = completed.reduce((a, s) => a + s.length, 0) / completed.length
  return Math.max(1, Math.round(avg))
}

// Compact history of past periods derived from logs.
// Returns array of { start, end, length, gapFromPrev }, newest first.
// `end` walks forward from each start while flow days remain consecutive
// (gap of 1 day or less). `gapFromPrev` is the day-distance from the
// previous (older) period's start, or null for the oldest entry.
export function getPeriodHistory(logs, periodStarts) {
  if (!periodStarts || periodStarts.length === 0) return []
  const flowDays = Object.entries(logs || {})
    .filter(([, l]) => l?.flow && l.flow !== 'Spotting')
    .map(([d]) => d)
    .sort()
  const periods = []
  for (let i = 0; i < periodStarts.length; i++) {
    const start = periodStarts[i]
    const nextStart = periodStarts[i + 1]
    // walk forward from start while flow days are consecutive
    let end = start
    let cursor = parseDateOnly(start)
    for (const day of flowDays) {
      const d = parseDateOnly(day)
      if (d < cursor) continue
      if (nextStart && d >= parseDateOnly(nextStart)) break
      const gap = Math.round((d - cursor) / MS_PER_DAY)
      if (gap <= 1) { end = day; cursor = d }
      else break
    }
    const length = daysBetween(start, end) + 1
    const gapFromPrev = i > 0
      ? daysBetween(periodStarts[i - 1], start)
      : null
    periods.push({ start, end, length, gapFromPrev })
  }
  return periods.reverse() // newest first
}

// Detects whether the user is on a hormonal birth control method.
// Methods that suppress or override natural cycle hormones return true.
// Copper IUD is non-hormonal — natural cycle continues, so returns false.
export function isOnHormonalBC(birthControl) {
  if (!birthControl?.method) return false
  return ['combined-pill', 'mini-pill', 'hormonal-iud', 'implant', 'shot', 'patch', 'ring'].includes(birthControl.method)
}

// Detects the biphasic temperature shift that confirms ovulation.
// Splits BBT readings into pre-ovulation (early cycle) vs post-ovulation
// (late cycle) halves across multiple cycles. If the luteal average is
// at least 0.3°F (or 0.17°C) higher than the follicular average, there's
// a real shift — and the day where temps cross the mid-line is the typical
// ovulation marker.
//
// Returns null when we don't have enough data, otherwise:
//   { shiftDayMedian, shiftDelta, unit, follicularAvg, lutealAvg, samples }
export function detectBBTShift(logs, periodStarts, cycleLength) {
  if (!periodStarts || periodStarts.length < 2) return null

  const cycleDayFor = (dateISO) => {
    let anchor = null
    for (const s of periodStarts) {
      if (s <= dateISO) anchor = s
      else break
    }
    if (!anchor) return null
    return daysBetween(anchor, dateISO) + 1
  }

  // Gather BBT readings tagged with cycle day
  const bbtReadings = []
  let unit = 'F'
  for (const [date, log] of Object.entries(logs || {})) {
    if (!log?.bbt || typeof log.bbt.value !== 'number') continue
    const day = cycleDayFor(date)
    if (day == null) continue
    unit = log.bbt.unit || unit
    let v = log.bbt.value
    // Normalize to F for the math so the threshold is consistent
    if ((log.bbt.unit || 'F') === 'C') v = v * 9/5 + 32
    bbtReadings.push({ day, valueF: v, originalUnit: log.bbt.unit || 'F' })
  }

  if (bbtReadings.length < 6) return null

  const ovMid = estimatedOvulationDay(cycleLength)
  const follicular = bbtReadings.filter((r) => r.day <= ovMid)
  const luteal     = bbtReadings.filter((r) => r.day >  ovMid)

  if (follicular.length < 3 || luteal.length < 3) return null

  const avg = (arr) => arr.reduce((a, b) => a + b.valueF, 0) / arr.length
  const follF = avg(follicular)
  const lutF  = avg(luteal)
  const deltaF = lutF - follF

  if (deltaF < 0.3) return null  // no real shift

  // Find the day where readings cross the midpoint of the two averages
  const midF = (follF + lutF) / 2
  const crossingsByDay = {}
  for (const r of bbtReadings) {
    if (r.valueF >= midF) {
      crossingsByDay[r.day] = (crossingsByDay[r.day] || 0) + 1
    }
  }
  // First day with crossings in 2+ cycles (or most-frequent if only one cycle of data)
  const dayCounts = Object.entries(crossingsByDay).map(([d, c]) => ({ day: Number(d), count: c })).sort((a, b) => a.day - b.day)
  const shiftDayMedian = dayCounts.find((d) => d.count >= 2)?.day || dayCounts[0]?.day || ovMid

  const back = (vF) => unit === 'C' ? (vF - 32) * 5/9 : vF
  return {
    shiftDayMedian,
    shiftDelta: Number((unit === 'C' ? deltaF * 5/9 : deltaF).toFixed(2)),
    unit,
    follicularAvg: Number(back(follF).toFixed(2)),
    lutealAvg: Number(back(lutF).toFixed(2)),
    samples: bbtReadings.length,
  }
}

// Find the median cycle day on which the user logs egg-white cervical
// mucus. Egg-white mucus is the strongest non-instrumental marker of
// peak fertility — it appears in the 2-3 days before ovulation when
// estrogen peaks. Returns { day, samples, cycles } or null when we
// don't have enough data.
//
// Why this matters: mucus is logged but until this function existed,
// the data wasn't feeding ovulation prediction at all. With BBT alone
// we infer ovulation AFTER it happens (the shift is post-event).
// Mucus tells us BEFORE — which materially improves fertile-window
// timing accuracy.
export function detectMucusPeak(logs, periodStarts) {
  if (!periodStarts || periodStarts.length < 2) return null
  const cycleDayFor = (dateISO) => {
    let anchor = null
    for (const s of periodStarts) {
      if (s <= dateISO) anchor = s
      else break
    }
    if (!anchor) return null
    return daysBetween(anchor, dateISO) + 1
  }
  // Track which cycle each egg-white day belongs to so we can count
  // cycles, not just total occurrences.
  const cyclesWithEggWhite = new Set()
  const eggWhiteDays = []
  for (const [date, log] of Object.entries(logs || {})) {
    if (log?.mucus !== 'eggwhite') continue
    const day = cycleDayFor(date)
    if (day == null) continue
    let anchor = null
    for (const s of periodStarts) {
      if (s <= date) anchor = s
      else break
    }
    if (anchor) cyclesWithEggWhite.add(anchor)
    eggWhiteDays.push(day)
  }
  if (eggWhiteDays.length < 2) return null
  eggWhiteDays.sort((a, b) => a - b)
  // Median is more robust to outlier days than mean
  const median = eggWhiteDays[Math.floor(eggWhiteDays.length / 2)]
  return { day: median, samples: eggWhiteDays.length, cycles: cyclesWithEggWhite.size }
}

// Find the median cycle day on which the user reports high or "open"
// libido. Libido tends to peak in the days around ovulation as
// testosterone and estrogen both crest. Returns { day, samples, cycles }
// or null. Lower-weight signal than BBT/mucus — used to corroborate.
export function detectLibidoPeak(logs, periodStarts) {
  if (!periodStarts || periodStarts.length < 2) return null
  const cycleDayFor = (dateISO) => {
    let anchor = null
    for (const s of periodStarts) {
      if (s <= dateISO) anchor = s
      else break
    }
    if (!anchor) return null
    return daysBetween(anchor, dateISO) + 1
  }
  const cyclesWithHigh = new Set()
  const highDays = []
  for (const [date, log] of Object.entries(logs || {})) {
    const lib = log?.intimate?.libido
    if (lib !== 'high' && lib !== 'open') continue
    const day = cycleDayFor(date)
    if (day == null) continue
    let anchor = null
    for (const s of periodStarts) {
      if (s <= date) anchor = s
      else break
    }
    if (anchor) cyclesWithHigh.add(anchor)
    highDays.push(day)
  }
  if (highDays.length < 3) return null  // libido is noisier — need more samples
  highDays.sort((a, b) => a - b)
  const median = highDays[Math.floor(highDays.length / 2)]
  return { day: median, samples: highDays.length, cycles: cyclesWithHigh.size }
}

// Triangulated ovulation detection. Fuses up to three signals:
//   - BBT shift (weight 1.0)  — gold standard, post-event marker
//   - Mucus peak (weight 0.8) — egg-white = peak fertility, +1 day = ov
//   - Libido peak (weight 0.5) — supportive, often crests near ov
//
// Weighted average of available signals gives the predicted ov day.
// Confidence rises when signals agree (small spread) and falls when
// they disagree (large spread). Single-signal results inherit the
// signal's intrinsic confidence (BBT → medium, mucus/libido → low).
//
// Returns: { day, confidence: 'very-high'|'high'|'medium'|'low',
//   signals: [{type, day, weight, detail}], spread, why } or null.
export function detectOvulation(logs, periodStarts, cycleLength) {
  const bbt = detectBBTShift(logs, periodStarts, cycleLength)
  const mucus = detectMucusPeak(logs, periodStarts)
  const libido = detectLibidoPeak(logs, periodStarts)

  const signals = []
  if (bbt) {
    signals.push({
      type: 'bbt',
      day: bbt.shiftDayMedian,
      weight: 1.0,
      detail: `Biphasic temperature shift +${bbt.shiftDelta}°${bbt.unit}`,
    })
  }
  if (mucus) {
    // Ovulation typically falls 1 day after peak egg-white mucus —
    // estrogen drives the mucus, ov follows the estrogen peak.
    signals.push({
      type: 'mucus',
      day: mucus.day + 1,
      weight: 0.8,
      detail: `Egg-white mucus peak around day ${mucus.day}`,
    })
  }
  if (libido) {
    signals.push({
      type: 'libido',
      day: libido.day,
      weight: 0.5,
      detail: `Libido tends to peak around day ${libido.day}`,
    })
  }

  if (signals.length === 0) return null

  const totalWeight = signals.reduce((s, x) => s + x.weight, 0)
  const day = Math.round(signals.reduce((s, x) => s + x.day * x.weight, 0) / totalWeight)
  const days = signals.map((s) => s.day)
  const spread = signals.length > 1 ? Math.max(...days) - Math.min(...days) : 0

  // Confidence rubric for Luna's own estimate. This is not a clinical
  // confirmation of ovulation; disagreement reduces confidence.
  let confidence
  if (signals.length >= 3 && spread <= 2)       confidence = 'very-high'
  else if (signals.length >= 2 && spread <= 2)  confidence = 'high'
  else if (signals.length >= 2 && spread <= 4)  confidence = 'medium'
  else if (signals.length === 1 && bbt)         confidence = 'medium'
  else                                          confidence = 'low'

  const sigList = signals.map((s) => {
    if (s.type === 'bbt') return 'BBT shift'
    if (s.type === 'mucus') return 'egg-white mucus'
    return 'libido peak'
  })
  const sigText = sigList.length === 1
    ? sigList[0]
    : sigList.length === 2
      ? `${sigList[0]} and ${sigList[1]}`
      : `${sigList.slice(0, -1).join(', ')}, and ${sigList[sigList.length - 1]}`
  const why = signals.length >= 2
    ? `Triangulated from ${sigText}${spread > 2 ? ' (signals don\'t agree exactly).' : '.'}`
    : `From ${sigText} alone — add more signals for tighter timing.`

  return { day, confidence, signals, spread, why }
}

// Build a short, natural-language summary of a user's cycle patterns
// suitable for passing to the AI chat. The output is DERIVED and
// QUALITATIVE — no raw logs, no dates, no specific counts, no symptom
// IDs verbatim, no cycle-day numbers. The summary is meant to give
// Luna AI enough texture to acknowledge a user's patterns without
// ever transmitting identifying log data.
//
// Examples of output:
//   "tends toward low mood and cramps in late luteal; cycles steady"
//   "headaches cluster around ovulation; cycles vary by a day or two"
//   "cycles steady" (if no patterns yet)
//   ""                (if not enough data even for the rhythm note)
//
// Inputs are the already-detected pattern set and the variance summary
// (both computed locally by detectSymptomPatterns + cycleVariance).
// Pure function — safe to call on every render; callers can memoise.
export function buildPatternSummary(patterns, variance, cycleLength) {
  // Group same-phase patterns together so the summary reads like a
  // natural sentence ("low mood and cramps in late luteal") instead
  // of a comma-separated list.
  const phaseGroups = {}
  if (Array.isArray(patterns) && patterns.length > 0) {
    // Cap at the top 4 patterns by occurrence — beyond that, the
    // summary gets noisy and starts leaking identifying detail.
    for (const p of patterns.slice(0, 4)) {
      const key = p.phase || 'other'
      if (!phaseGroups[key]) phaseGroups[key] = []
      phaseGroups[key].push(p)
    }
  }

  // Pretty phrase per pattern. For moods we append " mood" / " moods"
  // so a single-word label like "low" reads as "low mood" not "low".
  // For symptoms we lowercase and otherwise leave as-is — the SYMPTOMS
  // dictionary already uses noun-shaped labels.
  const labelFor = (p) => {
    const raw = String(p.label || '').toLowerCase()
    if (!raw) return null
    if (p.type === 'mood') return `${raw} mood`
    return raw
  }

  // For luteal patterns, split early vs late based on whether the
  // pattern's median day is past the midpoint of the luteal window.
  // ("late luteal" is the clinically meaningful descriptor — PMDD,
  // PMS, late-cycle hormonal drops all cluster there.)
  const phaseDescriptor = (phaseId, list) => {
    if (phaseId !== 'luteal' || !cycleLength) return phaseId
    const lutealStart = Math.round(cycleLength / 2) + 1
    const lutealEnd   = cycleLength
    const midpoint   = (lutealStart + lutealEnd) / 2
    const medianOfGroup = list.reduce((a, p) => a + (p.median || 0), 0) / list.length
    if (medianOfGroup > midpoint) return 'late luteal'
    return 'early luteal'
  }

  const phaseOrder = ['menstrual', 'follicular', 'ovulation', 'luteal']
  const parts = []
  for (const phaseId of phaseOrder) {
    const list = phaseGroups[phaseId]
    if (!list || list.length === 0) continue
    const labels = list
      .slice(0, 2)
      .map(labelFor)
      .filter(Boolean)
    if (labels.length === 0) continue
    const joined = labels.length === 1
      ? labels[0]
      : `${labels[0]} and ${labels[1]}`
    parts.push(`${joined} in ${phaseDescriptor(phaseId, list)}`)
  }

  // Variance phrase — only when we have meaningful cycle data.
  let varStr = ''
  if (variance?.conf === 'high')        varStr = 'cycles steady'
  else if (variance?.conf === 'medium') varStr = 'cycles vary by a day or two'
  else if (variance?.conf === 'low' && (variance.stdDev != null)) varStr = 'cycles variable'

  // Compose
  if (parts.length === 0 && !varStr) return ''
  if (parts.length === 0) return varStr
  const main = `tends toward ${parts.join('; also ')}`
  return varStr ? `${main}; ${varStr}` : main
}

// Detect recurring mood / symptom patterns across multiple cycles.
// For each mood and each symptom, computes the median cycle day and the
// concentration of occurrences within ±3 days of that median. Returns
// only the patterns that appear in ≥60% of their occurrences inside that
// window — those are the ones worth surfacing.
export function detectSymptomPatterns(logs, periodStarts, cycleLength, periodLength) {
  if (!periodStarts || periodStarts.length < 2) return []
  const totalCycles = periodStarts.length - 1

  // Find cycle day for an arbitrary date relative to the closest preceding period start
  const cycleDayFor = (dateISO) => {
    let anchor = null
    for (const s of periodStarts) {
      if (s <= dateISO) anchor = s
      else break
    }
    if (!anchor) return null
    return daysBetween(anchor, dateISO) + 1
  }

  const groups = {} // id → { type, label, days: [] }
  for (const [date, log] of Object.entries(logs || {})) {
    const day = cycleDayFor(date)
    if (day == null) continue
    if (log.mood) {
      const id = `mood_${log.mood}`
      groups[id] = groups[id] || { type: 'mood', label: log.mood, days: [] }
      groups[id].days.push(day)
    }
    for (const sym of (log.symptoms || [])) {
      const id = `sym_${sym}`
      groups[id] = groups[id] || { type: 'symptom', label: sym, days: [] }
      groups[id].days.push(day)
    }
  }

  const phaseFor = (day) => {
    const ovStart = Math.round(cycleLength / 2) - 1
    const ovEnd   = Math.round(cycleLength / 2) + 1
    if (day <= periodLength) return 'menstrual'
    if (day < ovStart)        return 'follicular'
    if (day <= ovEnd)         return 'ovulation'
    return 'luteal'
  }

  const patterns = []
  for (const [id, g] of Object.entries(groups)) {
    if (g.days.length < 2) continue
    const sorted = [...g.days].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]
    const inWindow = sorted.filter((d) => Math.abs(d - median) <= 3)
    const concentration = inWindow.length / sorted.length
    if (concentration < 0.6) continue
    const min = Math.min(...inWindow)
    const max = Math.max(...inWindow)
    patterns.push({
      id, type: g.type, label: g.label,
      days: [min, max],
      median,
      occurrences: g.days.length,
      cycles: totalCycles,
      concentration,
      phase: phaseFor(median),
    })
  }
  return patterns.sort((a, b) => b.occurrences - a.occurrences).slice(0, 6)
}

export function getCycleDay(lastPeriodStart, cycleLength) {
  if (!lastPeriodStart) return null
  const start = parseDateOnly(lastPeriodStart)
  const now = parseDateOnly(new Date())
  const diff = daysBetween(toDateKey(start), toDateKey(now))
  // Normalise to 1-based day within a cycle
  return ((diff % cycleLength) + cycleLength) % cycleLength + 1
}

export function estimatedOvulationDay(cycleLength = 28, periodLength = 5) {
  return Math.max(periodLength + 2, cycleLength - 14)
}

export function getPhaseForDay(day, cycleLength = 28, periodLength = 5) {
  const ovulationDay = estimatedOvulationDay(cycleLength, periodLength)
  const ovStart = ovulationDay - 1
  const ovEnd   = ovulationDay + 1
  if (day <= periodLength)  return PHASES.menstrual
  if (day < ovStart)        return PHASES.follicular
  if (day <= ovEnd)         return PHASES.ovulation
  return PHASES.luteal
}

export function getPhaseColor(day, cycleLength, periodLength) {
  return getPhaseForDay(day, cycleLength, periodLength).color
}

// Returns array of {date ISO, phase, cycleDay, isPeriodDay} for a given month
export function buildMonthGrid(year, month, lastPeriodStart, cycleLength, periodLength, logs) {
  if (!lastPeriodStart) return []
  const start = parseDateOnly(lastPeriodStart)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const grid = []
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    date.setHours(0, 0, 0, 0)
    const diff = daysBetween(toDateKey(start), toDateKey(date))
    const cycleDay = ((diff % cycleLength) + cycleLength) % cycleLength + 1
    const phase = getPhaseForDay(cycleDay, cycleLength, periodLength)
    const iso = toDateKey(date)
    const log = logs?.[iso]
    const isPeriodDay = Boolean(log?.flow && log.flow !== 'Spotting')
    grid.push({ date: iso, cycleDay, phase, future: date > new Date(), isPeriodDay })
  }
  return grid
}

// Next period, fertile window, PMS window predictions — variance-aware.
// Each prediction includes the date string + an optional ± range derived
// from the user's actual cycle variance, plus a human-readable confidence
// label and reason. If BBT data has detected an ovulation shift, the
// fertile window uses that day instead of the cycle-length midpoint.
export function getPredictions(lastPeriodStart, cycleLength, periodLength, variance, ovulation, cycleModel = null) {
  if (!lastPeriodStart) return null
  const start = parseDateOnly(lastPeriodStart)

  const now = parseDateOnly(new Date())
  const daysSinceStart = daysBetween(toDateKey(start), toDateKey(now))
  const cyclesElapsed  = Math.max(0, Math.floor(daysSinceStart / cycleLength))
  const currentCycleStart = addCalendarDays(start, cyclesElapsed * cycleLength)
  const cyclesAhead = cyclesElapsed + 1

  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const rangeLabel = (r) => r <= 1 ? '± 1 day' : `± ${r} days`

  const range = cycleModel
    ? predictionRangeForHorizon(cycleModel, cyclesAhead)
    : (variance?.range ?? 3)
  const conf  = variance?.conf  ?? 'medium'

  // Period prediction — anchor to ovulation + 14d luteal when we
  // have high-confidence ovulation, otherwise fall back to cycle-
  // length math. Luteal phase length (12-16 days, median ~14) is far
  // more stable across the population than total cycle length, so
  // for users with detected ovulation this prediction is materially
  // tighter. For users without ovulation detection, the original
  // cycle-length math is preserved (no regression).
  const LUTEAL_DEFAULT_DAYS = 14
  const useLutealAnchor = cyclesAhead === 1 && ovulation && (ovulation.confidence === 'very-high' || ovulation.confidence === 'high')
  const nextPeriod = useLutealAnchor
    // A 14-day luteal phase spans the 14 full days after ovulation; the
    // next period begins the following morning.
    ? addCalendarDays(currentCycleStart, ovulation.day + LUTEAL_DEFAULT_DAYS)
    : addCalendarDays(start, cyclesAhead * cycleLength)

  // Multi-signal ovulation fusion. If detectOvulation produced a day
  // from any combination of BBT/mucus/libido, anchor here. Otherwise
  // fall back to cycle-length midpoint. Confidence label is inherited
  // directly from the fusion so users see WHY this window is tight.
  const ovDay = ovulation?.day ?? estimatedOvulationDay(cycleLength, periodLength)
  // The biological fertile window is the five days before estimated
  // ovulation through the estimated ovulation day (six days total).
  const fertileStart = addCalendarDays(currentCycleStart, ovDay - 6)
  const fertileEnd   = addCalendarDays(currentCycleStart, ovDay - 1)
  // PMS is framed as the final five cycle days. It does not depend on bleed
  // length; the previous formula accidentally produced a roughly 9-day span.
  const pmsStart     = addCalendarDays(currentCycleStart, cycleLength - 5)
  const pmsEnd       = addCalendarDays(currentCycleStart, cycleLength - 1)

  const periodWhy = useLutealAnchor
    ? `Anchored to your detected ovulation + a typical 14-day luteal phase. ${variance?.why ?? ''}`.trim()
    : (variance?.why ?? `Based on your ${cycleLength}-day cycle.`)
  const fertileConf =
    ovulation?.confidence === 'very-high' ? 'high' :  // 'very-high' renders as 'high' in the UI
    ovulation?.confidence === 'high'      ? 'high' :
    ovulation?.confidence === 'medium'    ? 'medium' :
    ovulation?.confidence === 'low'       ? 'low' :
    conf
  const fertileWhy = ovulation
    ? ovulation.why
    : 'Predicted from cycle length and ovulation timing.'
  const fertileRange = ovulation
    ? ovulation.confidence === 'very-high' || ovulation.confidence === 'high'
      ? 1
      : ovulation.confidence === 'medium' ? 2 : Math.max(3, range)
    : Math.max(2, range)
  const earliestPeriod = addCalendarDays(nextPeriod, -range)
  const latestPeriod = addCalendarDays(nextPeriod, range)

  return [
    {
      label: 'Next period',
      date: fmt(nextPeriod),
      iso: toDateKey(nextPeriod),
      earliestISO: toDateKey(earliestPeriod),
      latestISO: toDateKey(latestPeriod),
      range: rangeLabel(range),
      conf,
      why: periodWhy,
    },
    {
      label: 'Fertile window',
      date: `${fmt(fertileStart)} – ${fmt(fertileEnd)}`,
      range: rangeLabel(Math.min(5, fertileRange)),
      conf: fertileConf,
      why: fertileWhy,
    },
    {
      label: 'PMS window',
      date: `${fmt(pmsStart)} – ${fmt(pmsEnd)}`,
      range: null,
      conf,
      why: `Late luteal — the final five days of your cycle, when symptoms may gather.`,
    },
  ]
}

// Returns the number of days the user is overdue for their period.
// Negative when the period is upcoming, positive when overdue.
// Returns null when we don't have data.
export function daysOverdue(lastPeriodStart, cycleLength) {
  if (!lastPeriodStart) return null
  const cycleDay = getCycleDay(lastPeriodStart, cycleLength)
  if (cycleDay == null) return null
  return cycleDay > cycleLength ? cycleDay - cycleLength : cycleDay - cycleLength
}

export function useCycle(store) {
  const { lastPeriodStart: storedStart, cycleLength: storedCycle, periodLength: storedPeriod, logs } = store

  // Learn from the logs. Cycle length uses weighted recency now (recent
  // cycles dominate older ones), with the simple average kept around for
  // any legacy caller. Variance + BBT shift detection feed the predictor.
  const starts = allPeriodStarts(logs, storedStart)
  const weighted = weightedCycleLength(starts, storedCycle)
  const cycleLength = weighted.length
  const periodLength = dynamicPeriodLength(logs, storedPeriod)
  const lastPeriodStart = starts.length > 0 ? starts[starts.length - 1] : storedStart
  const cycleModel = weighted.model || buildBayesianCycleModel(starts, storedCycle)
  const variance = {
    stdDev: cycleModel.samples ? cycleModel.predictiveSd : null,
    range: cycleModel.halfWidth80,
    conf: cycleModel.conf,
    label: cycleModel.label,
    samples: cycleModel.samples,
    why: cycleModel.why,
    p10: cycleModel.p10,
    p50: cycleModel.p50,
    p90: cycleModel.p90,
  }
  const bbtShift = detectBBTShift(logs, starts, cycleLength)
  // Triangulated ovulation from BBT + mucus + libido. May be null.
  const ovulation = detectOvulation(logs, starts, cycleLength)

  const cycleDay = getCycleDay(lastPeriodStart, cycleLength)
  const phase    = cycleDay ? getPhaseForDay(cycleDay, cycleLength, periodLength) : null
  const predictions = getPredictions(lastPeriodStart, cycleLength, periodLength, variance, ovulation, cycleModel)
  const phaseDurations = buildPhaseDurationModel(cycleModel, periodLength)
  const daysSinceLastPeriod = lastPeriodStart
    ? daysBetween(lastPeriodStart, toDateKey(new Date())) + 1
    : null
  const now = new Date()
  const monthGrid = buildMonthGrid(now.getFullYear(), now.getMonth(), lastPeriodStart, cycleLength, periodLength, logs)

  return {
    cycleDay,
    phase,
    predictions,
    monthGrid,
    cycleLength,           // weighted-recency length
    periodLength,
    lastPeriodStart,
    periodHistory: starts,
    variance,              // { stdDev, range, conf, label, samples, why }
    cycleModel,            // posterior duration + P10/P50/P90 predictive days
    phaseDurations,        // explicit duration assumptions for each phase
    daysSinceLastPeriod,   // raw age of the last real anchor (not modulo)
    bbtShift,              // null OR detected biphasic shift (kept for legacy callers)
    ovulation,             // null OR fused ovulation { day, confidence, signals, why }
    cyclesLogged: weighted.samples, // completed cycle intervals, not start dates
  }
}
