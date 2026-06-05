// PCOS — central data file for PCOS Deep Mode.
//
// Sources used throughout:
//   - International PCOS Guideline 2023 (Teede et al., Hum Reprod)
//   - Endocrine Society Clinical Practice Guideline (Legro et al., JCEM 2013)
//   - ACOG Practice Bulletin 194
//   - Cochrane Reviews (specific interventions cited inline)
//   - NEJM (letrozole for PCOS ovulation induction, Legro 2014)
//
// Voice rules embedded:
//   - Never "diet" → "what you eat" / "insulin response"
//   - Never "weight loss" → "your metabolism" / "energy steadiness"
//   - Never "infertility" → "your timeline" / "the path to conceiving"
//   - Never "obese" → name the actual symptoms (energy, sleep, mood)
//   - "PCOS isn't really about cysts" — repeat as load-bearing literacy

// ─── New symptom IDs specific to PCOS ─────────────────────────
// These layer onto the existing symptom system in lunaData.js +
// symptomIcons.jsx. The PCOS dashboard surfaces these specifically;
// they also feed into the existing detectSymptomPatterns engine so
// patterns are detected with the rest of her cycle.
export const PCOS_SYMPTOM_IDS = [
  'hirsutism',         // unwanted hair growth (chin / lip / chest / abdomen)
  'scalpThinning',     // scalp / crown hair loss
  'acanthosis',        // skin darkening (neck / armpits) — insulin marker
  'sugarCraving',      // intense sugar / carb craving
  'energyCrash',       // post-meal energy crash — insulin response
]

// Subset that points to insulin resistance — used to surface "your
// insulin-pattern signals" on the dashboard. Sourced: international
// PCOS guideline 2023, insulin resistance section.
export const INSULIN_PATTERN_SIGNALS = [
  'acanthosis',
  'sugarCraving',
  'energyCrash',
  'fatigue',           // pre-existing in lunaData symptoms
]

// Subset that points to androgen excess — the second Rotterdam axis.
export const ANDROGEN_PATTERN_SIGNALS = [
  'hirsutism',
  'scalpThinning',
  'acne',              // pre-existing
]

// ─── Cycle reading for PCOS users ─────────────────────────────
// PCOS hallmark per Rotterdam: cycles > 35 days, or fewer than 8 per
// year (so > ~45 days average), OR cycles missing entirely. Used by
// the dashboard to describe her pattern without alarm.
export function pcosCycleRead(periodHistory, cycleLength) {
  if (!periodHistory || periodHistory.length < 2) {
    return {
      kind: 'not-enough-data',
      summary: 'Once Luna sees a couple of cycles, she can read your PCOS rhythm with you.',
    }
  }
  // Compute gap days between consecutive starts.
  const sorted = [...periodHistory].sort()
  const gaps = []
  for (let i = 1; i < sorted.length; i++) {
    const ms = new Date(sorted[i] + 'T00:00:00') - new Date(sorted[i - 1] + 'T00:00:00')
    gaps.push(Math.round(ms / 86400000))
  }
  const avg = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length)
  const min = Math.min(...gaps)
  const max = Math.max(...gaps)
  const longGapCount = gaps.filter((g) => g > 35).length
  const consistentLong = longGapCount >= Math.ceil(gaps.length * 0.6)
  const oligo = avg > 45  // oligo-ovulation territory

  if (oligo) {
    return {
      kind: 'oligo',
      avg, min, max, gaps,
      summary: `Your cycles average ${avg} days, ranging from ${min} to ${max}. Fewer than 8 cycles a year is a classic PCOS pattern — what's called oligo-ovulation. Your body is ovulating, just less often.`,
      source: 'Rotterdam criteria · International PCOS Guideline 2023',
    }
  }
  if (consistentLong) {
    return {
      kind: 'long',
      avg, min, max, gaps,
      summary: `Your cycles average ${avg} days, ranging from ${min} to ${max}. Cycles consistently over 35 days is one of the three Rotterdam markers — what your doctor will recognize as PCOS-pattern timing.`,
      source: 'Rotterdam criteria · International PCOS Guideline 2023',
    }
  }
  if (max - min > 14) {
    return {
      kind: 'variable',
      avg, min, max, gaps,
      summary: `Your cycles average ${avg} days but range from ${min} to ${max} — wider variability than typical, which is a common PCOS pattern even when the average looks normal.`,
      source: 'International PCOS Guideline 2023',
    }
  }
  return {
    kind: 'regular',
    avg, min, max, gaps,
    summary: `Your cycles average ${avg} days, ranging ${min}–${max}. That's within the typical range — your PCOS may be expressing more through other signs than cycle timing.`,
    source: 'International PCOS Guideline 2023',
  }
}

// ─── Pattern signals from recent logs ─────────────────────────
// Counts how many days in the recent window had each PCOS-relevant
// signal. Drives the "what you're noticing" section of the dashboard.
// `recentLogs` is the date→log map (same shape as store).
export function pcosSignalCounts(recentLogs, days = 30) {
  const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
  const counts = {}
  for (const id of [...PCOS_SYMPTOM_IDS, 'acne', 'fatigue']) counts[id] = 0
  for (const [date, log] of Object.entries(recentLogs || {})) {
    if (date < cutoff) continue
    for (const s of (log.symptoms || [])) {
      if (s in counts) counts[s] += 1
    }
  }
  return counts
}

// Group counts into the two Rotterdam axes — androgen excess and
// insulin resistance — for the dashboard's "patterns" section.
export function pcosAxisSummary(counts) {
  const androgenTotal = ANDROGEN_PATTERN_SIGNALS.reduce((a, k) => a + (counts[k] || 0), 0)
  const insulinTotal = INSULIN_PATTERN_SIGNALS.reduce((a, k) => a + (counts[k] || 0), 0)
  return { androgenTotal, insulinTotal }
}

// ─── Daily literacy moments specific to PCOS ──────────────────
// Rotated by day so the dashboard has a new "small thing to know"
// each visit. Sourced, short, doula-toned.
export const PCOS_LITERACY = [
  {
    id: 'not-cysts',
    body: "PCOS isn't really about cysts — the name's a misnomer. The 'polycystic' ovaries on ultrasound are clusters of immature follicles that didn't release. Many people with PCOS don't have them at all.",
    source: 'International PCOS Guideline 2023',
  },
  {
    id: 'insulin-driver',
    body: 'Insulin resistance drives most of what PCOS does. Higher insulin pushes the ovaries to make more testosterone, which suppresses ovulation, which keeps cycles long. Treating insulin sensitivity often eases everything downstream.',
    source: 'Teede et al., Endocrine Society',
  },
  {
    id: 'inositol',
    body: 'Myo-inositol with d-chiro-inositol (40:1 ratio) has the strongest supplement evidence for PCOS — comparable to metformin in some studies for restoring ovulation. Takes 3–6 months to see effects.',
    source: 'Cochrane Review (inositol for PCOS, 2023)',
  },
  {
    id: 'letrozole',
    body: 'For PCOS trying to conceive, letrozole is now first-line — not Clomid. NEJM (Legro 2014) showed it produces more live births in PCOS. Worth asking for by name.',
    source: 'Legro et al., NEJM 2014',
  },
  {
    id: 'long-term-risk',
    body: 'PCOS raises lifetime risk of type 2 diabetes (around 4×) and endometrial cancer. Early diagnosis genuinely improves long-term outcomes — getting the right tests early is care, not catastrophizing.',
    source: 'International PCOS Guideline 2023',
  },
  {
    id: 'glp1',
    body: 'GLP-1 medications (semaglutide / tirzepatide) are newer in PCOS care — early evidence is promising for insulin sensitivity, ovulation, and symptom relief. Worth bringing up if your doctor hasn\'t.',
    source: 'JCEM 2023 (GLP-1 in PCOS reviews)',
  },
  {
    id: 'spironolactone',
    body: 'Spironolactone is an anti-androgen — meaningfully helps acne and unwanted hair growth in PCOS, usually within 6 months. Often combined with hormonal birth control. Avoided in pregnancy.',
    source: 'AAD; ACOG Practice Bulletin 194',
  },
  {
    id: 'amh',
    body: 'PCOS often shows elevated AMH — typical PCOS range is 5–12 ng/mL versus 1–4 for the general female reference. Not diagnostic alone, but a strong supporting signal.',
    source: 'International PCOS Guideline 2023',
  },
]

// Rotate the literacy card by day number. Returns the entry for today.
export function todaysPcosLiteracy() {
  const dayNum = Math.floor(Date.now() / 86400000)
  return PCOS_LITERACY[dayNum % PCOS_LITERACY.length]
}

// ─── A "next thing" suggestion ────────────────────────────────
// One quiet recommendation per day, derived from her state. The
// dashboard surfaces this as the action card — what Luna thinks is
// the most useful thing she could do today. Never alarming, always
// optional.
export function pcosNextThing({ cycleDay, cycleLength, signalCounts, hasBloodwork }) {
  if (!hasBloodwork) {
    return {
      kind: 'log-bloodwork',
      eyebrow: 'a small step',
      title: 'Log your latest bloodwork',
      body: 'When you have testosterone, fasting insulin, AMH, or SHBG results, logging them lets Luna track trends over time and build a doctor-ready summary.',
      cta: 'Coming soon',
      disabled: true,
    }
  }
  if ((signalCounts?.acanthosis || 0) + (signalCounts?.energyCrash || 0) + (signalCounts?.sugarCraving || 0) >= 4) {
    return {
      kind: 'insulin-pattern',
      eyebrow: 'a pattern, this month',
      title: 'Your insulin-pattern signals have been louder',
      body: 'Sugar cravings, energy crashes, and skin-darkening signals together can point at insulin response. Worth a fasting glucose + insulin reading at your next visit — and asking about HOMA-IR.',
      cta: 'Read about insulin in PCOS',
      route: 'conditions',
      activeConditionId: 'pcos',
    }
  }
  if ((signalCounts?.hirsutism || 0) + (signalCounts?.scalpThinning || 0) + (signalCounts?.acne || 0) >= 4) {
    return {
      kind: 'androgen-pattern',
      eyebrow: 'a pattern, this month',
      title: 'Your androgen-pattern signals have been louder',
      body: 'Hair growth, scalp thinning, and acne together can point at androgen excess. Worth asking about total + free testosterone and DHEA-S. Spironolactone often helps.',
      cta: 'Read about androgens in PCOS',
      route: 'conditions',
      activeConditionId: 'pcos',
    }
  }
  if (cycleLength > 45) {
    return {
      kind: 'long-cycle',
      eyebrow: 'a gentle nudge',
      title: 'Your cycles have been long lately',
      body: 'Cycles regularly over 45 days are worth tracking carefully — long gaps without a period can build up the lining and your doctor may want to know.',
      cta: 'Read about cycle length in PCOS',
      route: 'conditions',
      activeConditionId: 'pcos',
    }
  }
  return {
    kind: 'default',
    eyebrow: 'today',
    title: 'Keep logging — Luna learns from every day you show up',
    body: 'PCOS reads itself slowly, across months. Each day you log is data toward a clearer picture and a more useful next visit.',
    cta: null,
  }
}
