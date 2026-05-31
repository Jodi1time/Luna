// Note resurfacing — finds an old note worth re-showing on Home today.
//
// Priority order (first hit wins, so the cheapest signal is always
// chosen):
//   1. Exact anniversary — a note from 365 days ago today, or 730, etc.
//   2. Same cycle day, previous cycle — uses periodHistory to compute
//      the cycle-day of every dated note and matches today's day.
//   3. Same phase, prior cycle — falls back to "a previous luteal" etc.
//
// Returns one { kind, date, note, label } object, or null when nothing
// worth surfacing exists. `kind` drives the label rendered on Home.

const MS_PER_DAY = 86400000

function notesFromLogs(logs) {
  return Object.entries(logs || {})
    .filter(([, l]) => (l?.note || '').trim().length > 0)
    .map(([d, l]) => ({ dateISO: d, note: l.note.trim() }))
}

function fmtFriendlyAgo(dateISO) {
  const past = new Date(dateISO + 'T12:00:00')
  const now = new Date(); now.setHours(12, 0, 0, 0)
  const days = Math.round((now - past) / MS_PER_DAY)
  if (days >= 360 && days <= 370) return 'a year ago today'
  if (days >= 720 && days <= 740) return 'two years ago today'
  if (days >= 1080 && days <= 1100) return 'three years ago today'
  if (days >= 28 && days <= 32) return 'a month ago'
  if (days >= 86 && days <= 94) return 'three months ago'
  if (days >= 175 && days <= 190) return 'half a year ago'
  const months = Math.round(days / 30)
  if (months >= 2) return `${months} months ago`
  if (days >= 7) return `${Math.round(days / 7)} weeks ago`
  return `${days} days ago`
}

function cycleDayFor(dateISO, periodStarts) {
  if (!periodStarts?.length) return null
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

function phaseFor(day, cycleLength = 28, periodLength = 5) {
  const ovStart = Math.round(cycleLength / 2) - 1
  const ovEnd = Math.round(cycleLength / 2) + 1
  if (day <= periodLength) return 'menstrual'
  if (day < ovStart) return 'follicular'
  if (day <= ovEnd) return 'ovulation'
  return 'luteal'
}

export function resurfaceNote({ logs, cycle, todayPhaseId, todayISO }) {
  const today = todayISO || new Date().toISOString().slice(0, 10)
  const allNotes = notesFromLogs(logs)
  if (allNotes.length === 0) return null

  // Older notes only — never resurface today's or yesterday's; that's
  // not a callback, that's an echo.
  const oldEnough = allNotes.filter((n) => {
    const days = Math.round((new Date(today + 'T12:00:00') - new Date(n.dateISO + 'T12:00:00')) / MS_PER_DAY)
    return days >= 14
  })
  if (oldEnough.length === 0) return null

  // 1. Anniversary — same month-day, 365/730/etc. days back.
  const todayMD = today.slice(5)
  const anniversary = oldEnough
    .filter((n) => n.dateISO.slice(5) === todayMD)
    .sort((a, b) => b.dateISO.localeCompare(a.dateISO))[0]
  if (anniversary) {
    return {
      kind: 'anniversary',
      label: fmtFriendlyAgo(anniversary.dateISO),
      ...anniversary,
    }
  }

  // 2. Same cycle day — needs periodHistory. Match today's cycle day
  // against the cycle day of each older note. Prefer the MOST RECENT
  // match so it's still relatable.
  const periodStarts = cycle?.periodHistory || []
  const todayDay = cycleDayFor(today, periodStarts)
  if (todayDay != null && periodStarts.length >= 2) {
    const sameDay = oldEnough
      .map((n) => ({ ...n, cd: cycleDayFor(n.dateISO, periodStarts) }))
      .filter((n) => n.cd === todayDay)
      .sort((a, b) => b.dateISO.localeCompare(a.dateISO))[0]
    if (sameDay) {
      return {
        kind: 'same-cycle-day',
        label: `day ${todayDay} of a previous cycle`,
        dateISO: sameDay.dateISO,
        note: sameDay.note,
      }
    }
  }

  // 3. Same phase — use today's phase id if known, fall back to
  // computing from cycle day.
  const cycleLength = cycle?.cycleLength || 28
  const periodLength = cycle?.periodLength || 5
  const phaseToday = todayPhaseId || (todayDay ? phaseFor(todayDay, cycleLength, periodLength) : null)
  if (phaseToday && periodStarts.length >= 2) {
    const samePhase = oldEnough
      .map((n) => {
        const cd = cycleDayFor(n.dateISO, periodStarts)
        return cd == null ? null : { ...n, phase: phaseFor(cd, cycleLength, periodLength) }
      })
      .filter((n) => n && n.phase === phaseToday)
      .sort((a, b) => b.dateISO.localeCompare(a.dateISO))[0]
    if (samePhase) {
      return {
        kind: 'same-phase',
        label: `a previous ${phaseToday}`,
        dateISO: samePhase.dateISO,
        note: samePhase.note,
      }
    }
  }

  return null
}
