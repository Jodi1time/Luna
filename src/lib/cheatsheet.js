// Doctor's-office cheat sheet generator.
import { todayKey } from './dateOnly'
//
// Reads the user's logs + the engine-computed cycle signals (variance,
// BBT shift, recurring patterns) and produces a small, ordered list of
// talking points she can hand a clinician at her next visit. Each point
// is a self-contained object:
//
//   { id, title, say, why, source }
//
//   title   — short headline ("Cycle length has varied")
//   say     — one-sentence wording in the user's voice ("My cycles have
//             been ranging from 24 to 38 days over the past four months.")
//   why     — one-sentence clinical reason it's worth a conversation
//   source  — short attribution string (ACOG, Cleveland Clinic, etc.)
//
// Triggers favour the doula register over alarm — we surface signals
// that *are worth a conversation*, not "you have a disease." Order is
// importance-first (cycle structure → flow → cyclical patterns →
// reassurance) so the most clinically meaningful items appear top of
// the page.

const MS_PER_DAY = 86400000

const heavyFlow = (l) => l?.flow === 'Heavy'
const isFlowDay = (l) => l?.flow && l.flow !== 'Spotting'

function recentLogs(logs, days = 120) {
  const cutoff = new Date(); cutoff.setHours(0,0,0,0)
  cutoff.setDate(cutoff.getDate() - days)
  return Object.entries(logs || {})
    .filter(([d]) => new Date(d + 'T00:00:00') >= cutoff)
    .map(([d, l]) => ({ date: d, ...l }))
}

function longestPeriodStretch(logs, periodStarts) {
  if (!periodStarts?.length) return 0
  const flowDates = Object.entries(logs || {})
    .filter(([, l]) => isFlowDay(l))
    .map(([d]) => d)
    .sort()
  let longest = 0
  for (const start of periodStarts) {
    let cur = 0
    let cursor = new Date(start + 'T00:00:00')
    for (const day of flowDates) {
      const d = new Date(day + 'T00:00:00')
      if (d < cursor) continue
      const gap = Math.round((d - cursor) / MS_PER_DAY)
      if (gap <= 1) { cur += 1; cursor = d }
      else break
    }
    if (cur > longest) longest = cur
  }
  return longest
}

export function buildCheatsheet({ logs, cycle, patterns = [] }) {
  const points = []
  const recent = recentLogs(logs, 120)
  const cycleLength = cycle?.cycleLength
  const variance = cycle?.variance
  const bbtShift = cycle?.bbtShift
  const periodStarts = cycle?.periodHistory || []
  const cyclesLogged = cycle?.cyclesLogged ?? 0

  // 1. Cycle structure — long or short cycles.
  if (cycleLength && cycleLength > 35 && cyclesLogged >= 2) {
    points.push({
      id: 'cycle-long',
      title: 'Cycles are longer than typical',
      say: `My cycles have been averaging about ${cycleLength} days end to end, which is longer than the typical 21–35 range.`,
      why: 'Longer cycles can be a sign of PCOS, thyroid dysfunction, or anovulation — worth a workup.',
      source: 'ACOG; Endocrine Society',
    })
  }
  if (cycleLength && cycleLength < 21 && cyclesLogged >= 2) {
    points.push({
      id: 'cycle-short',
      title: 'Cycles are shorter than typical',
      say: `My cycles have been averaging about ${cycleLength} days, which is shorter than the typical 21–35 range.`,
      why: 'Consistently short cycles can suggest a luteal phase defect or hormonal imbalance worth investigating.',
      source: 'ACOG; Cleveland Clinic',
    })
  }

  // 2. Cycle variance — high SD = "varied recently".
  if (variance?.conf === 'low' && variance?.stdDev != null && variance.stdDev >= 4 && cyclesLogged >= 3) {
    points.push({
      id: 'cycle-variable',
      title: 'Cycle length has varied recently',
      say: `My cycle length has been varying by about ${Math.round(variance.stdDev)} days from one to the next.`,
      why: 'Sudden changes in regularity can flag thyroid issues, stress effects, perimenopause, or PCOS.',
      source: 'Cleveland Clinic',
    })
  }

  // 3. Heavy flow days — if the user logs Heavy ≥3 times across the
  // window, flag for menorrhagia/iron evaluation.
  const heavyDays = recent.filter(heavyFlow).length
  if (heavyDays >= 3) {
    points.push({
      id: 'flow-heavy',
      title: 'Flow is on the heavy side',
      say: `I've logged ${heavyDays} heavy-flow days in roughly the last four months — sometimes soaking through pads or tampons quickly.`,
      why: 'Heavy menstrual bleeding can lead to iron-deficiency anaemia and may warrant a ferritin test or workup for fibroids / adenomyosis.',
      source: 'NICE Guideline NG88; British Society for Haematology',
    })
  }

  // 4. Long periods (>7 days) — pull from logged stretches.
  const longest = longestPeriodStretch(logs, periodStarts)
  if (longest > 7) {
    points.push({
      id: 'period-long',
      title: 'Periods running longer than 7 days',
      say: `My longest recent period ran ${longest} days — past the typical 7-day mark.`,
      why: 'Periods longer than 7 days can indicate fibroids, polyps, or other structural causes worth ruling out.',
      source: 'ACOG',
    })
  }

  // 5. PMDD signal — Low moods clustered in luteal across multiple
  // cycles. Uses the engine's pattern detector results, passed in.
  const lutealLow = patterns.find((p) =>
    p.type === 'mood' && /^low$/i.test(p.label) && p.phase === 'luteal' && p.occurrences >= 3
  )
  if (lutealLow) {
    points.push({
      id: 'mood-pmdd',
      title: 'Low mood clusters before your period',
      say: 'I notice strong low-mood days repeatedly in the week before my period — across multiple cycles.',
      why: 'Disabling premenstrual mood symptoms can indicate PMDD, which is recognised in DSM-5 and treatable.',
      source: 'ACOG Practice Bulletin; IAPMD',
    })
  }

  // 6. Endometriosis signal — recurring severe cramps that aren't
  // just menstrual phase.
  const crampsPattern = patterns.find((p) => p.type === 'symptom' && p.label === 'cramps' && p.occurrences >= 5)
  if (crampsPattern) {
    points.push({
      id: 'cramps-recurring',
      title: 'Cramps are persistent across cycles',
      say: `Cramps have repeated for me ${crampsPattern.occurrences} times across recent cycles, often around days ${crampsPattern.days[0]}–${crampsPattern.days[1]}.`,
      why: 'Cramps that disrupt daily life or recur outside menstruation may be a signal for endometriosis screening — the average diagnostic delay is 7+ years.',
      source: 'WHO Endometriosis Fact Sheet; ESHRE Guideline',
    })
  }

  // 7. Fatigue near period — possible iron deficiency.
  const fatiguePattern = patterns.find((p) =>
    p.type === 'symptom' && /fatigue|tired/i.test(p.label) && p.occurrences >= 4
  )
  if (fatiguePattern) {
    points.push({
      id: 'fatigue-recurring',
      title: 'Fatigue keeps repeating around your cycle',
      say: 'I have ongoing fatigue that clusters around my cycle, even with adequate sleep.',
      why: 'Worth a ferritin test (not just haemoglobin) — iron stores can be low without anaemia, and fatigue + heavy flow is a common combination.',
      source: 'British Society for Haematology',
    })
  }

  // 8a. Intimate health — painful sex repeating, dry lubrication, low
  // libido cluster. Pulled from the new `intimate` field on logs.
  const intimateLogs = recent.filter((l) => l.intimate)
  const painfulSexCount = intimateLogs.filter((l) => l.intimate?.painful_sex === 'significant').length
  if (painfulSexCount >= 2) {
    points.push({
      id: 'intimate-painful-sex',
      title: 'Painful sex is recurring',
      say: `I have logged painful sex on ${painfulSexCount} separate occasions in the past few months.`,
      why: 'Dyspareunia is common and treatable — pelvic floor PT, vaginal estrogen, or evaluation for endometriosis are all on the table.',
      source: 'ACOG — Female Sexual Pain; International Pelvic Pain Society',
    })
  }
  const dryCount = intimateLogs.filter((l) => l.intimate?.lubrication === 'dry').length
  if (dryCount >= 3) {
    points.push({
      id: 'intimate-dryness',
      title: 'Vaginal dryness has been frequent',
      say: `Lubrication has been low across ${dryCount} entries — it doesn't feel like just a one-off.`,
      why: 'Persistent dryness can be hormonal (perimenopause, postpartum, breastfeeding) or medication-related (SSRIs, hormonal BC). Real treatments exist including vaginal estrogen.',
      source: 'ACOG — Vaginal Atrophy; Endocrine Society',
    })
  }

  // 8b. Vaginal-health symptoms — count UTI / yeast / BV / vulvar pain
  // ticks across the window. Three or more = a real pattern.
  const symCount = (id) => recent.filter((l) => (l.symptoms || []).includes(id)).length
  const utiCount = symCount('uti')
  const yeastCount = symCount('yeast')
  const bvCount = symCount('bv')
  const vulvarCount = symCount('vulvarPain')
  if (utiCount >= 3) {
    points.push({
      id: 'recurrent-uti',
      title: 'UTI symptoms keep coming back',
      say: `I have logged UTI symptoms ${utiCount} times in the past few months.`,
      why: 'Recurrent UTIs (3+ in a year) deserve a workup — post-sex voiding, D-mannose, vaginal estrogen for perimenopause, low-dose prophylaxis, or imaging are all options.',
      source: 'American Urological Association',
    })
  }
  if (yeastCount >= 3) {
    points.push({
      id: 'recurrent-yeast',
      title: 'Yeast infections keep recurring',
      say: `I have had yeast symptoms ${yeastCount} times recently.`,
      why: 'Four-plus episodes a year warrants investigation — diabetes screening, non-albicans candida testing, or longer suppressive treatment are all considered.',
      source: 'CDC — Vaginitis',
    })
  }
  if (bvCount >= 3) {
    points.push({
      id: 'recurrent-bv',
      title: 'BV symptoms keep recurring',
      say: `I have had BV symptoms ${bvCount} times in recent months.`,
      why: 'Recurrent BV needs a different strategy — extended antibiotics, boric acid suppositories, or addressing triggers like douching or new partners.',
      source: 'ACOG Practice Bulletin 215',
    })
  }
  if (vulvarCount >= 2) {
    points.push({
      id: 'vulvar-pain',
      title: 'Vulvar pain is persistent',
      say: `I have logged vulvar pain ${vulvarCount} times — it isn't a one-off.`,
      why: 'Vulvodynia, pelvic floor tension, or hormonal thinning are all treatable — a sex-positive gynaecologist or pelvic pain specialist is the right room.',
      source: 'International Pelvic Pain Society',
    })
  }

  // 9. BBT shift detected — reassurance / supports fertility convos.
  if (bbtShift?.shiftDayMedian) {
    points.push({
      id: 'bbt-confirmed',
      title: 'Ovulation confirmed via BBT',
      say: `My basal body temperature shifts about ${bbtShift.shiftDelta}°${bbtShift.unit} after roughly day ${bbtShift.shiftDayMedian} of my cycle — the biological signature of ovulation.`,
      why: 'Helpful context for fertility conversations, hormonal evaluation, or any prescription that depends on knowing whether you ovulate.',
      source: 'ACOG Fertility Awareness',
    })
  }

  // 9. Reassurance entry — only when nothing else has fired, so the
  // user doesn't leave with an empty page. Gentle framing.
  if (points.length === 0) {
    if (cyclesLogged >= 2 && variance?.conf === 'high') {
      points.push({
        id: 'reassure-steady',
        title: 'Cycles have been steady',
        say: `My cycles have been running about ${cycleLength} days, with little variation cycle to cycle.`,
        why: 'A steady cycle pattern is a useful baseline for any future hormonal or fertility conversation.',
        source: 'ACOG — Menstrual Cycle as Vital Sign',
      })
    } else {
      points.push({
        id: 'reassure-tracking',
        title: 'Tracking has started — patterns will emerge',
        say: 'I\'ve started tracking my cycle so I can bring concrete data to future appointments.',
        why: 'ACOG recommends the menstrual cycle as a fifth vital sign — tracked patterns make appointments more productive.',
        source: 'ACOG Committee Opinion',
      })
    }
  }

  return points
}

// Render the talking points to a plain-text block suitable for the
// clipboard or an email. Kept simple — no markdown styling so it pastes
// cleanly into any provider portal.
export function cheatsheetText(points, { displayName, generatedISO } = {}) {
  const date = generatedISO || todayKey()
  const lines = []
  lines.push(displayName ? `Notes from ${displayName} — for our appointment` : 'Notes for our appointment')
  lines.push(`Prepared ${date}`)
  lines.push('')
  points.forEach((p, i) => {
    lines.push(`${i + 1}. ${p.title}`)
    lines.push(`   Say: ${p.say}`)
    lines.push(`   Why it matters: ${p.why}`)
    lines.push(`   Source: ${p.source}`)
    lines.push('')
  })
  lines.push('Generated by Luna. Not a diagnosis — wording for the conversation.')
  return lines.join('\n')
}
