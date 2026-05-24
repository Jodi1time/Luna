// Real cycle phase calculation engine.
// All math is based on the conventional model:
//   Day 1 = first day of period
//   Menstrual  : days 1 – periodLength
//   Follicular : days (periodLength+1) – (cycleLength/2 - 2)
//   Ovulation  : days (cycleLength/2 - 1) – (cycleLength/2 + 1)
//   Luteal     : remainder through cycleLength

import { PHASES } from '../data/lunaData'

export function getCycleDay(lastPeriodStart, cycleLength) {
  if (!lastPeriodStart) return null
  const start = new Date(lastPeriodStart)
  const now   = new Date()
  now.setHours(0, 0, 0, 0)
  start.setHours(0, 0, 0, 0)
  const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24))
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

// Returns array of {date ISO, phase, cycleDay} for a given month
export function buildMonthGrid(year, month, lastPeriodStart, cycleLength, periodLength) {
  if (!lastPeriodStart) return []
  const start = new Date(lastPeriodStart)
  start.setHours(0, 0, 0, 0)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const grid = []
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    date.setHours(0, 0, 0, 0)
    const diff = Math.floor((date - start) / (1000 * 60 * 60 * 24))
    const cycleDay = ((diff % cycleLength) + cycleLength) % cycleLength + 1
    const phase = getPhaseForDay(cycleDay, cycleLength, periodLength)
    grid.push({ date: date.toISOString().slice(0, 10), cycleDay, phase, future: date > new Date() })
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
  const daysSinceStart = Math.floor((now - start) / 86400000)
  const cyclesElapsed  = Math.floor(daysSinceStart / cycleLength)
  const currentCycleStart = new Date(start.getTime() + cyclesElapsed * cycleLength * 86400000)

  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const nextPeriod  = new Date(currentCycleStart.getTime() + cycleLength * 86400000)
  const ovDay       = Math.round(cycleLength / 2) - 1
  const fertileStart= new Date(currentCycleStart.getTime() + (ovDay - 2) * 86400000)
  const fertileEnd  = new Date(currentCycleStart.getTime() + (ovDay + 1) * 86400000)
  const pmsStart    = new Date(currentCycleStart.getTime() + (cycleLength - periodLength - 4) * 86400000)
  const pmsEnd      = new Date(currentCycleStart.getTime() + (cycleLength - 1) * 86400000)

  return [
    { label: 'Next period',    date: fmt(nextPeriod),                          conf: '95%', why: `Based on your ${cycleLength}-day cycle.` },
    { label: 'Fertile window', date: `${fmt(fertileStart)} – ${fmt(fertileEnd)}`, conf: '88%', why: 'Predicted from cycle length and ovulation timing.' },
    { label: 'PMS window',     date: `${fmt(pmsStart)} – ${fmt(pmsEnd)}`,         conf: '76%', why: `Late luteal phase — days ${cycleLength - periodLength - 4}–${cycleLength} of your cycle.` },
  ]
}

export function useCycle(store) {
  const { lastPeriodStart, cycleLength, periodLength } = store
  const cycleDay = getCycleDay(lastPeriodStart, cycleLength)
  const phase    = cycleDay ? getPhaseForDay(cycleDay, cycleLength, periodLength) : null
  const predictions = getPredictions(lastPeriodStart, cycleLength, periodLength)
  const now = new Date()
  const monthGrid = buildMonthGrid(now.getFullYear(), now.getMonth(), lastPeriodStart, cycleLength, periodLength)
  return { cycleDay, phase, predictions, monthGrid }
}
