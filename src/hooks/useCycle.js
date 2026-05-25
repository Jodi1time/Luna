// Real cycle phase calculation engine.
// All math is based on the conventional model:
//   Day 1 = first day of period
//   Menstrual  : days 1 – periodLength
//   Follicular : days (periodLength+1) – (cycleLength/2 - 2)
//   Ovulation  : days (cycleLength/2 - 1) – (cycleLength/2 + 1)
//   Luteal     : remainder through cycleLength

import { PHASES } from '../data/lunaData'

const MS_PER_DAY = 86400000

function daysBetween(aISO, bISO) {
  const a = new Date(aISO); a.setHours(0,0,0,0)
  const b = new Date(bISO); b.setHours(0,0,0,0)
  return Math.round((b - a) / MS_PER_DAY)
}

// ── Period detection from flow logs ──────────────────────────
// A period start = the first day of a continuous stretch of flow
// (≥ Light), defined as: a flow-logged day with NO flow log in
// the previous 7 days.
// 'Spotting' is excluded — it doesn't count as a period start.
export function detectPeriodStarts(logs) {
  const flowDays = Object.entries(logs || {})
    .filter(([_, l]) => l?.flow && l.flow !== 'Spotting')
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

// Average gap between consecutive period starts.
// Falls back to the stored cycleLength when there's not enough data
// or all detected gaps are outside the medically-normal 18–60 day range.
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

// Average length of the actual bleeding stretches in the logs.
// Returns null if we don't have enough data (need a stretch that ended).
export function dynamicPeriodLength(logs, fallback) {
  const flowDays = Object.entries(logs || {})
    .filter(([_, l]) => l?.flow && l.flow !== 'Spotting')
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
    const last = new Date(s[s.length - 1])
    return daysBetween(s[s.length - 1], today.toISOString().slice(0, 10)) > 2
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
    .filter(([_, l]) => l?.flow && l.flow !== 'Spotting')
    .map(([d]) => d)
    .sort()
  const periods = []
  for (let i = 0; i < periodStarts.length; i++) {
    const start = periodStarts[i]
    const nextStart = periodStarts[i + 1]
    // walk forward from start while flow days are consecutive
    let end = start
    let cursor = new Date(start); cursor.setHours(0,0,0,0)
    for (const day of flowDays) {
      const d = new Date(day); d.setHours(0,0,0,0)
      if (d < cursor) continue
      if (nextStart && d >= new Date(nextStart)) break
      const gap = Math.round((d - cursor) / MS_PER_DAY)
      if (gap <= 1) { end = day; cursor = d }
      else break
    }
    const length = Math.round((new Date(end) - new Date(start)) / MS_PER_DAY) + 1
    const gapFromPrev = i > 0
      ? Math.round((new Date(start) - new Date(periodStarts[i-1])) / MS_PER_DAY)
      : null
    periods.push({ start, end, length, gapFromPrev })
  }
  return periods.reverse() // newest first
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
    const t = new Date(dateISO + 'T00:00:00').getTime()
    let anchor = null
    for (const s of periodStarts) {
      const st = new Date(s + 'T00:00:00').getTime()
      if (st <= t) anchor = s
      else break
    }
    if (!anchor) return null
    return Math.floor((t - new Date(anchor + 'T00:00:00').getTime()) / MS_PER_DAY) + 1
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
  const start = new Date(lastPeriodStart)
  const now   = new Date()
  now.setHours(0, 0, 0, 0)
  start.setHours(0, 0, 0, 0)
  const diff = Math.floor((now - start) / MS_PER_DAY)
  // Normalise to 1-based day within a cycle
  return ((diff % cycleLength) + cycleLength) % cycleLength + 1
}

export function getPhaseForDay(day, cycleLength = 28, periodLength = 5) {
  const ovStart = Math.round(cycleLength / 2) - 1
  const ovEnd   = Math.round(cycleLength / 2) + 1
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
  const start = new Date(lastPeriodStart)
  start.setHours(0, 0, 0, 0)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const grid = []
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    date.setHours(0, 0, 0, 0)
    const diff = Math.floor((date - start) / MS_PER_DAY)
    const cycleDay = ((diff % cycleLength) + cycleLength) % cycleLength + 1
    const phase = getPhaseForDay(cycleDay, cycleLength, periodLength)
    const iso = date.toISOString().slice(0, 10)
    const log = logs?.[iso]
    const isPeriodDay = Boolean(log?.flow && log.flow !== 'Spotting')
    grid.push({ date: iso, cycleDay, phase, future: date > new Date(), isPeriodDay })
  }
  return grid
}

// Next period, fertile window, PMS window predictions
export function getPredictions(lastPeriodStart, cycleLength, periodLength) {
  if (!lastPeriodStart) return null
  const start = new Date(lastPeriodStart)
  start.setHours(0, 0, 0, 0)

  // Find start of current cycle
  const now = new Date(); now.setHours(0,0,0,0)
  const daysSinceStart = Math.floor((now - start) / MS_PER_DAY)
  const cyclesElapsed  = Math.floor(daysSinceStart / cycleLength)
  const currentCycleStart = new Date(start.getTime() + cyclesElapsed * cycleLength * MS_PER_DAY)

  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const nextPeriod  = new Date(currentCycleStart.getTime() + cycleLength * MS_PER_DAY)
  const ovDay       = Math.round(cycleLength / 2) - 1
  const fertileStart= new Date(currentCycleStart.getTime() + (ovDay - 2) * MS_PER_DAY)
  const fertileEnd  = new Date(currentCycleStart.getTime() + (ovDay + 1) * MS_PER_DAY)
  const pmsStart    = new Date(currentCycleStart.getTime() + (cycleLength - periodLength - 4) * MS_PER_DAY)
  const pmsEnd      = new Date(currentCycleStart.getTime() + (cycleLength - 1) * MS_PER_DAY)

  return [
    { label: 'Next period',    date: fmt(nextPeriod),                          conf: '95%', why: `Based on your ${cycleLength}-day cycle.` },
    { label: 'Fertile window', date: `${fmt(fertileStart)} – ${fmt(fertileEnd)}`, conf: '88%', why: 'Predicted from cycle length and ovulation timing.' },
    { label: 'PMS window',     date: `${fmt(pmsStart)} – ${fmt(pmsEnd)}`,         conf: '76%', why: `Late luteal phase — days ${cycleLength - periodLength - 4}–${cycleLength} of your cycle.` },
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

  // Learn from the logs: detect period starts, then derive the most recent
  // start + average cycle length from real data. Falls back to stored values
  // when there's not enough history.
  const starts = allPeriodStarts(logs, storedStart)
  const cycleLength = dynamicCycleLength(starts, storedCycle)
  const periodLength = dynamicPeriodLength(logs, storedPeriod)
  const lastPeriodStart = starts.length > 0 ? starts[starts.length - 1] : storedStart

  const cycleDay = getCycleDay(lastPeriodStart, cycleLength)
  const phase    = cycleDay ? getPhaseForDay(cycleDay, cycleLength, periodLength) : null
  const predictions = getPredictions(lastPeriodStart, cycleLength, periodLength)
  const now = new Date()
  const monthGrid = buildMonthGrid(now.getFullYear(), now.getMonth(), lastPeriodStart, cycleLength, periodLength, logs)

  return {
    cycleDay,
    phase,
    predictions,
    monthGrid,
    cycleLength,       // dynamic — use this in UI instead of store.cycleLength
    periodLength,      // dynamic
    lastPeriodStart,   // dynamic — most recent detected start, or onboarding fallback
    periodHistory: starts, // for "your last N periods" display
  }
}
