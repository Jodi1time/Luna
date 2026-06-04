// Generate a long-form, doula-toned narrative summary of a user's
// recent year (up to 365 days) with Luna. NOT a streak / gamification
// surface — this is real reflection, the kind nobody else in the
// category does well.
//
// Output shape:
//   {
//     ready: boolean,     // true if we have enough data to write
//     reason: string,     // when not ready, why
//     title, subtitle,
//     spanLabel,
//     sections: [{ heading, body }]   // body is one or more paragraphs
//   }

import { SYMPTOMS } from '../data/lunaData'
import { MOOD_LABELS } from '../components/symptomIcons'
import { moodIdsOf } from './moods'

function recentLogs(logs, days = 365) {
  const cutoff = new Date(); cutoff.setHours(0,0,0,0)
  cutoff.setDate(cutoff.getDate() - days)
  return Object.entries(logs || {})
    .filter(([d]) => new Date(d + 'T00:00:00') >= cutoff)
    .map(([d, l]) => ({ date: d, ...l }))
}

function topEntry(map, minCount = 1) {
  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1])
  return sorted[0] && sorted[0][1] >= minCount ? sorted[0] : null
}

function fmtDate(iso) {
  if (!iso) return null
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export function buildYearNarrative({ logs, cycle, patterns = [], displayName }) {
  const recent = recentLogs(logs, 365)
  const daysLogged = recent.length

  // Gate: need at least ~30 entries OR 2 cycles before we write.
  // Anything shorter feels presumptuous.
  if (daysLogged < 30 && (cycle?.cyclesLogged ?? 0) < 2) {
    return {
      ready: false,
      reason: 'Luna needs a little more to look back on. After a few more weeks of logging — or your next cycle — a real picture will be here.',
    }
  }

  // ── derive stats ─────────────────────────────────────────────
  const moodCount = {}
  const symptomCount = {}
  let totalPeriodDays = 0
  let bbtReadings = 0
  let notesWritten = 0
  let sleepGood = 0, sleepPoor = 0
  let firstISO = null, lastISO = null

  recent.forEach((l) => {
    moodIdsOf(l).forEach((m) => { moodCount[m] = (moodCount[m] || 0) + 1 })
    ;(l.symptoms || []).forEach((s) => { symptomCount[s] = (symptomCount[s] || 0) + 1 })
    if (l.flow && l.flow !== 'Spotting') totalPeriodDays += 1
    if (l.bbt?.value != null) bbtReadings += 1
    if ((l.note || '').trim().length > 0) notesWritten += 1
    if (l.sleep === 'Great' || l.sleep === 'Okay') sleepGood += 1
    if (l.sleep === 'Poor' || l.sleep === 'Restless') sleepPoor += 1
    if (!firstISO || l.date < firstISO) firstISO = l.date
    if (!lastISO  || l.date > lastISO)  lastISO  = l.date
  })

  const topMoodEntry    = topEntry(moodCount, 3)
  const topSymptomEntry = topEntry(symptomCount, 3)
  const topMoodLabel    = topMoodEntry ? (MOOD_LABELS[topMoodEntry[0]] || topMoodEntry[0]) : null
  const topMoodCount    = topMoodEntry?.[1]
  const topSymptomLabel = topSymptomEntry ? (SYMPTOMS[topSymptomEntry[0]]?.label || topSymptomEntry[0]) : null
  const topSymptomCount = topSymptomEntry?.[1]

  const cycles = cycle?.cyclesLogged ?? 0
  const cycleLength = cycle?.cycleLength
  const periodLength = cycle?.periodLength
  const variance = cycle?.variance
  const bbtShift = cycle?.bbtShift

  // Span label
  const spanLabel = (firstISO && lastISO)
    ? (firstISO === lastISO ? fmtDate(firstISO) : `${fmtDate(firstISO)} → ${fmtDate(lastISO)}`)
    : null

  // ── write sections ───────────────────────────────────────────
  const first = (displayName || '').trim().split(' ')[0]
  const sections = []

  // 1. Showing up
  sections.push({
    heading: 'Showing up',
    body: [
      `${first || 'You'} opened Luna on ${daysLogged} day${daysLogged === 1 ? '' : 's'} ${daysLogged >= 200 ? 'this year' : 'in this window'}. That isn't a streak — it's a body-listening habit, and it's the reason the rest of this page has anything to say.`,
      notesWritten >= 5
        ? `You wrote ${notesWritten} short notes to your future self along the way. Those are the parts no other app would ever see.`
        : null,
    ].filter(Boolean),
  })

  // 2. The shape of your year
  if (cycles >= 1 && cycleLength) {
    const rhythm = variance?.conf === 'high'
      ? `Your cycles ran about ${cycleLength} days from one to the next — remarkably steady. ${variance.why}`
      : variance?.conf === 'medium'
        ? `Your cycles averaged about ${cycleLength} days, with a little month-to-month variation. ${variance.why || ''}`.trim()
        : `Your cycles have varied, ${cycleLength} days on average. ${variance?.why || ''} That variation is also data — and worth a conversation if it's new for you.`.trim()
    sections.push({
      heading: 'The shape of your year',
      body: [
        `Across the window, ${cycles} cycle${cycles === 1 ? '' : 's'} anchored what Luna knows about you. Your bleed ran about ${periodLength} day${periodLength === 1 ? '' : 's'}, and you spent ${totalPeriodDays} day${totalPeriodDays === 1 ? '' : 's'} in the menstrual phase overall — a quiet amount of work the body did under the surface.`,
        rhythm,
      ],
    })
  }

  // 3. What kept showing up
  if (topMoodEntry || topSymptomEntry) {
    const bits = []
    if (topMoodLabel) bits.push(`The mood you tagged most often was *${topMoodLabel.toLowerCase()}* — ${topMoodCount} time${topMoodCount === 1 ? '' : 's'}.`)
    if (topSymptomLabel) bits.push(`The body signal that kept turning up: *${String(topSymptomLabel).toLowerCase()}* (${topSymptomCount}).`)
    sections.push({
      heading: 'What kept showing up',
      body: [bits.join(' '), 'Neither of these are verdicts — they\'re patterns. Luna noticed them so the next conversation with a clinician or with yourself starts from somewhere real.'],
    })
  }

  // 4. Patterns worth flagging
  const lutealLow = patterns.find((p) => p.type === 'mood' && /^low$/i.test(p.label) && p.phase === 'luteal' && p.occurrences >= 3)
  const recurringCramps = patterns.find((p) => p.type === 'symptom' && p.label === 'cramps' && p.occurrences >= 5)
  if (lutealLow || recurringCramps) {
    const lines = ['One or two things showed up consistently enough that they\'re worth bringing to a provider — Luna has the talking points ready.']
    if (lutealLow) lines.push(`Low mood clustered repeatedly in the week before your period — across ${lutealLow.cycles} cycle${lutealLow.cycles === 1 ? '' : 's'}. PMDD is real and treatable; it's worth asking about.`)
    if (recurringCramps) lines.push(`Cramps kept landing on days ${recurringCramps.days[0]}–${recurringCramps.days[1]} of your cycle, ${recurringCramps.occurrences} times in this window. The wedge from "bad cramps" to "endometriosis worth screening" is the kind of conversation tracking like this exists to make easier.`)
    sections.push({ heading: 'Worth a conversation', body: lines })
  }

  // 5. Quiet wins
  const wins = []
  if (bbtShift) wins.push(`Luna detected your ovulation shift around day ${bbtShift.shiftDayMedian} — a real biological signature, not a guess. ${bbtReadings} BBT reading${bbtReadings === 1 ? '' : 's'} taught us that.`)
  if (sleepGood >= 10 && sleepGood >= sleepPoor) wins.push(`More restful nights than restless ones, by your own counting.`)
  if (cycles >= 6) wins.push(`Six cycles is enough that Luna's predictions for you are now built on your body, not the average.`)
  if (wins.length > 0) {
    sections.push({
      heading: 'Quiet wins',
      body: [wins.join(' ')],
    })
  }

  // 6. Closing
  sections.push({
    heading: 'For the year ahead',
    body: [
      `Keep noticing. The body keeps changing, and the version of this page Luna writes a year from now will be different — sharper, more specific, more yours. ${first ? `That's the work, ${first}.` : 'That\'s the work.'} Quietly, on your own terms.`,
    ],
  })

  return {
    ready: true,
    title: 'Your year with Luna',
    subtitle: first ? `For ${first}, with what your body taught us.` : 'With what your body taught us.',
    spanLabel,
    sections,
  }
}

// Plain-text rendering for clipboard / email sharing.
export function yearNarrativeText(narrative, { displayName } = {}) {
  if (!narrative?.ready) return ''
  const lines = []
  lines.push(narrative.title)
  if (narrative.subtitle) lines.push(narrative.subtitle)
  if (narrative.spanLabel) lines.push(`(${narrative.spanLabel})`)
  lines.push('')
  for (const s of narrative.sections) {
    lines.push(s.heading.toUpperCase())
    for (const para of s.body) lines.push(para.replace(/\*/g, ''))
    lines.push('')
  }
  lines.push(displayName ? `— Written by Luna, for ${displayName}.` : '— Written by Luna.')
  return lines.join('\n')
}
