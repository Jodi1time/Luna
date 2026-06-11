// First-week arc — three quiet moments that take over the daily-
// thought slot on Home during a new user's first week. Trackers die
// in week one; these are the gentlest possible counterweight:
//
//   day 2–3  "observation"  — the smallest thing her logs already say
//   day 4–5  "wheel"        — the cycle wheel, introduced as hers
//   day 7–9  "letter"       — what one week taught Luna
//
// Rules (HAVEN): no new surfaces, no tutorial framing, nothing that
// announces itself as onboarding. Each moment REPLACES the thought
// that would have been there anyway, shows for one full day, and is
// never caught up on — if she doesn't open the app on day 4, the
// wheel moment simply never happens. Existing users (no joinedAt)
// never see any of it.

const MS_PER_DAY = 86400000

function daysBetweenISO(aISO, bISO) {
  if (!aISO || !bISO) return null
  const a = new Date(aISO + 'T00:00:00')
  const b = new Date(bISO + 'T00:00:00')
  return Math.round((b - a) / MS_PER_DAY)
}

// What she's actually logged since joining — counts + categories,
// never contents.
function logStats(logs, joinedAt) {
  let days = 0
  let hasMood = false
  let hasSymptom = false
  let hasFlow = false
  let hasBody = false
  for (const [date, log] of Object.entries(logs || {})) {
    if (date < joinedAt || !log) continue
    const mood = (Array.isArray(log.moods) && log.moods.length > 0) || Boolean(log.mood)
    const symptom = Array.isArray(log.symptoms) && log.symptoms.length > 0
    const flow = Boolean(log.flow)
    const body = Boolean(log.bbt || log.mucus || log.sleep)
    if (mood || symptom || flow || body || (log.note || '').trim()) days++
    hasMood = hasMood || mood
    hasSymptom = hasSymptom || symptom
    hasFlow = hasFlow || flow
    hasBody = hasBody || body
  }
  return { days, hasMood, hasSymptom, hasFlow, hasBody }
}

// The in-sentence list of what she's touched, doula-toned, capped at
// three so the letter reads as a glance, not an audit.
function touchedList(stats) {
  const parts = []
  if (stats.hasMood) parts.push('how you felt')
  if (stats.hasSymptom) parts.push('what your body said')
  if (stats.hasFlow) parts.push('your bleeding')
  if (stats.hasBody) parts.push('the quieter signals')
  return parts.slice(0, 3).join(', ')
}

// Returns { id, eyebrow, text, cta } or null.
//   cta: 'talk' → the card opens chat seeded with the text (same as
//        the daily thought), 'wheel' → the card routes to Insights.
export function getFirstWeekMoment({ joinedAt, todayISO, logs, cycleDay, cycleLength, seen = {} }) {
  if (!joinedAt || !todayISO) return null
  const between = daysBetweenISO(joinedAt, todayISO)
  if (between == null || between < 0) return null
  const daysIn = between + 1  // join day = day 1
  if (daysIn < 2 || daysIn > 9) return null

  let id = null
  if (daysIn <= 3) id = 'observation'
  else if (daysIn <= 5) id = 'wheel'
  else if (daysIn >= 7) id = 'letter'
  if (!id) return null

  // Each moment shows for one full day: unseen, or seen earlier today.
  if (seen[id] && seen[id] !== todayISO) return null

  const stats = logStats(logs, joinedAt)

  if (id === 'observation') {
    // Stay quiet until there's something true to observe.
    if (stats.days === 0) return null
    const text = stats.days >= 2
      ? `${stats.days} days written down already. The small things — the ones doctors ask about and nobody quite remembers — are collecting now.`
      : stats.hasMood
        ? 'You wrote down how a day felt. That\'s the seed — feelings are usually the first pattern to surface, often within a single cycle.'
        : 'You\'ve started writing things down. None of it is small — the quiet entries are the ones that turn into patterns.'
    return {
      id,
      eyebrow: daysIn === 2 ? 'two days in' : 'three days in',
      text,
      cta: 'talk',
    }
  }

  if (id === 'wheel') {
    const text = cycleDay
      ? `Your cycle has a shape, and you're inside it — day ${cycleDay} of about ${cycleLength}. The wheel shows where that is.`
      : 'Your cycle has a shape. The wheel shows it — and where you are inside it.'
    return {
      id,
      eyebrow: 'something to see',
      text,
      cta: 'wheel',
    }
  }

  // letter — days 7–9
  const touched = touchedList(stats)
  const middle = stats.days > 0
    ? ` Since then: ${stats.days} day${stats.days === 1 ? '' : 's'} written down${touched ? ` — ${touched}` : ''}.`
    : ''
  return {
    id,
    eyebrow: 'a week in',
    text: `A week ago you gave Luna a starting point.${middle} From here it compounds — by your second cycle, predictions stop being guesses and start being yours.`,
    cta: 'talk',
  }
}
