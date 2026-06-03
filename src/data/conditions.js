// Conditions Atlas — sourced explainers + gentle pattern-matching.
//
// Six conditions cover the high-impact gap between "I feel off" and
// "named, treatable thing": PCOS, Endometriosis, PMDD, Thyroid,
// Fibroids, Hypothalamic Amenorrhea. Each has:
//   - canonical content (what it is, signs, tests, treatments, sources)
//   - a `matchers` function that scores how well a user's log pattern
//     fits the condition (0..1). Above 0.4, Luna surfaces a quiet
//     "this is worth knowing about" suggestion — never a diagnosis.
//
// All content reviewed against ACOG, Cleveland Clinic, Endocrine Society,
// WHO. A licensed clinician must read before shipping wider.

import { detectSymptomPatterns } from '../hooks/useCycle'

export const CONDITIONS = [
  {
    id: 'pcos',
    name: 'PCOS',
    fullName: 'Polycystic Ovary Syndrome',
    prevalence: 'Up to 1 in 10 of reproductive age',
    summary: 'A hormonal condition with three named markers — irregular cycles, androgen excess, polycystic ovaries. Two of three meets the diagnostic criteria.',
    whatItIs: [
      "PCOS isn't really about cysts — the name is a misnomer. The 'polycystic' ovaries on ultrasound are actually clusters of immature follicles that didn't release. Many people with PCOS don't have them.",
      "It's a metabolic-endocrine condition. Insulin resistance drives elevated androgens (testosterone), which suppresses ovulation, which keeps the cycle irregular.",
      "Rotterdam criteria — 2 of 3: irregular ovulation (cycles > 35 days or < 8/year), clinical or biochemical androgen excess (acne, hirsutism, high testosterone), polycystic ovaries on ultrasound.",
    ],
    commonSigns: ['Irregular cycles (long, missed, or absent)', 'Acne, especially jawline and chin', 'Hirsutism (chin, upper lip, chest, abdomen)', 'Scalp hair thinning', 'Difficulty losing weight despite effort', 'Difficulty conceiving', 'Skin darkening at neck or armpits (acanthosis nigricans)'],
    testsToAsk: [
      'Total + free testosterone',
      'DHEA-S (adrenal androgens)',
      'SHBG (sex hormone binding globulin)',
      'Fasting glucose + insulin (HOMA-IR for insulin resistance)',
      'AMH (anti-Müllerian hormone — often elevated)',
      'Pelvic ultrasound (transvaginal preferred)',
      'TSH + free T4 to rule out thyroid',
      'Prolactin',
    ],
    treatments: [
      'Hormonal birth control — regulates cycles, lowers androgens',
      'Metformin — improves insulin sensitivity, may restore ovulation',
      'Spironolactone — anti-androgen for acne and hirsutism',
      'GLP-1 agonists (newer evidence — semaglutide, tirzepatide)',
      'Inositol (myo + d-chiro 40:1) — modest evidence for ovulation',
      'Letrozole for fertility (first-line ovulation induction now, not Clomid)',
      'Lifestyle: ~5-10% weight loss can restore ovulation when relevant',
    ],
    redFlags: 'PCOS raises lifetime risk of type 2 diabetes (4×), endometrial cancer (3×), cardiovascular disease, and depression. Early diagnosis materially improves long-term outcomes.',
    sources: ['International PCOS Guideline 2023 (Teede et al.)', 'Endocrine Society Clinical Practice Guideline', 'ACOG Practice Bulletin 194'],
    relatedArticleId: 'pcos',
  },
  {
    id: 'endo',
    name: 'Endometriosis',
    fullName: 'Endometriosis',
    prevalence: 'About 1 in 10 menstruating people. Average diagnosis takes 7+ years.',
    summary: 'Tissue similar to the uterine lining grows outside the uterus — on ovaries, fallopian tubes, bowel, bladder. It bleeds with each cycle but has nowhere to go, causing inflammation and adhesions.',
    whatItIs: [
      "Endometriosis is genuine: tissue that responds to your cycle hormones, growing where it shouldn't. Each period, this tissue bleeds too — into your abdomen, pelvis, or organ surfaces. Inflammation results.",
      "The pain is not proportional to disease extent. Stage 1 (minimal lesions) can cause severe pain; stage 4 can be silent. The pain you feel is real regardless of imaging.",
      "There is no blood test. Pelvic ultrasound or MRI catches some forms (deep infiltrating, endometriomas). Laparoscopy is the only definitive diagnostic — and the only definitive treatment (excision).",
    ],
    commonSigns: ['Cramps that stop daily life (work, school)', 'Pain during or after sex (deep dyspareunia)', 'Painful bowel movements during your period', 'Painful urination during your period', 'Chronic (not just cyclical) pelvic pain', 'Heavy or prolonged bleeding', 'Lower-back pain that cycles with your period', 'Fatigue that increases around bleeding', 'Difficulty conceiving (30-50% of those with infertility)'],
    testsToAsk: [
      'Transvaginal pelvic ultrasound (specifically asking for endometriosis assessment, not generic)',
      'Pelvic MRI for deep infiltrating disease',
      'Diagnostic laparoscopy — only definitive diagnosis',
      'CA-125 is sometimes ordered but is not reliable for diagnosis',
    ],
    treatments: [
      'Combined hormonal birth control — first-line for pain management',
      'Progestin-only options (Mirena IUD, dienogest, norethindrone)',
      'GnRH agonists/antagonists for severe disease (orilissa, elagolix)',
      'NSAIDs for breakthrough pain',
      'Pelvic floor PT — many have secondary muscle dysfunction',
      'Excision surgery (not ablation — meaningful evidence difference)',
      'Multidisciplinary approach: pain specialist + gyn + PT + sometimes therapy',
    ],
    redFlags: 'The diagnostic delay is documented and unjust — many people are told their pain is "normal" for years. It is not. If period pain stops you from going to work or school, that is a clinical sign, not a personality trait.',
    sources: ['WHO Endometriosis Fact Sheet 2023', 'ESHRE Guideline on Endometriosis 2022', 'ACOG Practice Bulletin 114', 'Endometriosis Foundation of America'],
    relatedArticleId: 'endo',
  },
  {
    id: 'pmdd',
    name: 'PMDD',
    fullName: 'Premenstrual Dysphoric Disorder',
    prevalence: '3-8% of menstruating people. In the DSM-5.',
    summary: 'A severe, cyclical mood disorder triggered by normal hormonal shifts. Symptoms appear in the week before menstruation, improve within days of bleeding, and are minimal post-period.',
    whatItIs: [
      "PMDD is the cliff-edge end of PMS — disabling, not just uncomfortable. The DSM-5 lists it formally; insurance bills for it.",
      "The mechanism is not 'too much' or 'too little' of any hormone. It's an atypical brain response to normal hormone fluctuations — particularly the late-luteal estrogen and progesterone drops, and their effect on GABA and serotonin systems.",
      "It is treatable, often dramatically. The barrier to treatment is recognising it as PMDD instead of '12-month rolling depression' or 'bad personality week.'",
    ],
    commonSigns: ['Extreme mood swings in the week before period', 'Hopelessness or marked depression late-luteal', 'Anger or irritability beyond your usual baseline', 'Anxiety or panic attacks that cluster pre-period', 'Suicidal thoughts that lift when your period starts', 'Sleep disturbance specifically late-luteal', 'Marked fatigue beyond normal PMS', 'Difficulty concentrating, brain fog', 'Symptoms resolve within 2-3 days of bleeding starting'],
    testsToAsk: [
      'Daily symptom tracking for at least 2 full cycles (DRSP scale gold standard)',
      'TSH + free T4 to rule out thyroid',
      'Vitamin D + B12 to rule out deficiency contributors',
      'Diagnosis is clinical from the symptom-tracking pattern — there is no blood test for PMDD',
    ],
    treatments: [
      'SSRIs — strongest evidence; can be taken continuously OR luteal-phase-only (effective from day of luteal onset)',
      'Combined hormonal birth control containing drospirenone (Yaz/Yasmin) — FDA-approved for PMDD',
      'GnRH agonists for severe refractory cases',
      'CBT — meaningful effect size, especially for irritability/anger',
      'Calcium 1200mg/day + vitamin D — Thys-Jacobs RCT showed ~48% reduction',
      'Magnesium glycinate 400mg + B6 50-100mg — moderate evidence',
      'Aerobic exercise — RCT-supported',
    ],
    redFlags: 'If you have suicidal thoughts that follow a cyclical pattern, please track them and bring the data to a provider. PMDD-related suicidality is treatable. Crisis: 988 (US), 116 123 (Samaritans UK).',
    sources: ['ACOG PMDD Practice Bulletin', 'International Association for Premenstrual Disorders (IAPMD)', 'Yonkers et al., Lancet 2008', 'Thys-Jacobs et al., 1998'],
    relatedArticleId: 'pmdd',
  },
  {
    id: 'thyroid',
    name: 'Thyroid disorder',
    fullName: 'Hypothyroidism / Hyperthyroidism',
    prevalence: '5-8× more common in women. Often missed because symptoms mimic PMS.',
    summary: "Your thyroid sets the metabolic tempo. When it's off, almost every system runs at the wrong speed — including your cycle.",
    whatItIs: [
      "Hypothyroidism (underactive): TSH high, T4 low. Slows everything. Hashimoto's thyroiditis (autoimmune) is the most common cause in iodine-replete countries.",
      "Hyperthyroidism (overactive): TSH low, T4 high. Speeds everything. Graves' disease (autoimmune) is the most common cause.",
      "Subclinical patterns (slightly off labs without classic symptoms) are common in menstruating people and can still affect cycle, mood, and fertility.",
    ],
    commonSigns: ['Hypo: cold intolerance, fatigue, weight gain, dry skin, hair thinning, heavy or long periods, depression, constipation, slowed thinking', 'Hyper: heat intolerance, anxiety, weight loss, palpitations, light or absent periods, tremor, frequent stools, insomnia', 'Cycle changes (shorter, longer, heavier, lighter, missed) can be the first sign before classic symptoms appear', 'Hair changes — thinning, brittleness, eyebrow tail loss (Queen Anne sign)', 'Postpartum thyroiditis is common — often missed as "postpartum mood"'],
    testsToAsk: [
      'TSH (first-line)',
      'Free T4',
      'Free T3 if symptoms strong but TSH normal',
      'TPO antibodies (Hashimoto)',
      'TSH-receptor or TSI antibodies (Graves)',
      'Reverse T3 for non-thyroidal illness picture',
    ],
    treatments: [
      'Hypo: Levothyroxine (T4 replacement). Some respond better to combined T4/T3 (NDT, Tirosint).',
      'Hyper: Methimazole, radioactive iodine, or thyroidectomy depending on cause and severity.',
      'Selenium 200 mcg/day has some evidence for Hashimoto antibody reduction.',
      'Postpartum thyroiditis often resolves on its own but needs monitoring.',
    ],
    redFlags: 'Untreated hypothyroidism in pregnancy increases miscarriage and impairs fetal brain development. TSH targets are tighter in pregnancy. Untreated hyperthyroidism can cause cardiac complications and thyroid storm.',
    sources: ['American Thyroid Association Guidelines', 'Endocrine Society Clinical Practice Guideline', 'NICE Guideline NG145'],
  },
  {
    id: 'fibroids',
    name: 'Uterine fibroids',
    fullName: 'Uterine leiomyomas',
    prevalence: 'Up to 70-80% of women by age 50. Most are silent. About 25% are symptomatic.',
    summary: 'Benign muscle tumors of the uterus. Estrogen and progesterone grow them; menopause typically shrinks them. Most never need treatment. The ones that do can be life-disrupting.',
    whatItIs: [
      "Fibroids range from peppercorn to grapefruit. Location matters more than size — a small submucosal fibroid distorting the cavity can cause heavier bleeding than a large one tucked outside.",
      "Subtypes by location: submucosal (inside the cavity — most symptomatic), intramural (in the muscle wall), subserosal (on the outside), pedunculated (on a stalk).",
      "Race disparity is documented: Black women have higher prevalence, earlier onset, and worse symptoms — historically dismissed in clinical care. This is changing slowly.",
    ],
    commonSigns: ['Heavy menstrual bleeding (often with clots)', 'Long periods (8+ days)', 'Pelvic pressure or fullness', 'Frequent urination or constipation if pushing on neighbors', 'Pain during sex depending on location', 'Lower-back ache', 'Iron-deficiency anemia from heavy bleeding', 'Difficulty conceiving in some configurations', 'Abdominal bloating or visible bulge (large fibroids)'],
    testsToAsk: [
      'Transvaginal pelvic ultrasound (first-line)',
      'Saline-infusion sonography (better for submucosal)',
      'Pelvic MRI (for surgical planning or unclear cases)',
      'Ferritin + CBC (rule out iron deficiency from chronic loss)',
    ],
    treatments: [
      'Watchful waiting if asymptomatic',
      'Hormonal IUD (Mirena) — first-line for heavy bleeding',
      'Combined hormonal birth control',
      'Tranexamic acid for heavy days (non-hormonal option)',
      'GnRH antagonists (elagolix combinations) — newer oral option',
      'Uterine artery embolisation (UAE) — outpatient, uterus-sparing',
      'Myomectomy — surgical removal preserving the uterus',
      'Hysterectomy — definitive but not always necessary',
    ],
    redFlags: 'Heavy bleeding causing fatigue, dizziness, or shortness of breath = iron-deficiency anemia. Ferritin testing matters. Sudden severe pain in a known fibroid can be degeneration — go in.',
    sources: ['ACOG Practice Bulletin 228', 'NICE NG88', 'Stewart, Laughlin-Tommaso et al., Nat Rev Dis Primers 2016'],
  },
  {
    id: 'ha',
    name: 'Hypothalamic amenorrhea',
    fullName: 'Functional hypothalamic amenorrhea',
    prevalence: '~3% of menstruating people. Underdiagnosed in athletes and dieters.',
    summary: 'Your hypothalamus stops sending the GnRH pulse that triggers ovulation — usually in response to under-eating, over-exercising, low body weight, or sustained psychological stress.',
    whatItIs: [
      "HA is a protective shutdown — your body has assessed that conditions are too poor to support a pregnancy and turned off the cycle. It is reversible.",
      "The triad most commonly associated: low energy availability (eating less than your body burns), elevated stress, low body weight or rapid weight loss. You can have HA without being underweight — energy availability and stress matter independently.",
      "It is not just a lifestyle inconvenience. HA accelerates bone loss, raises cardiovascular risk, impairs fertility, and increases anxiety/depression risk while it persists.",
    ],
    commonSigns: ['Missed periods (3+ months) without pregnancy', 'Periods became light then stopped after weight loss or training increase', 'Low libido', 'Vaginal dryness', 'Cold hands and feet', 'Hair thinning', 'Sleep disturbance', 'Brittle nails', 'Stress fractures or low bone density on DEXA'],
    testsToAsk: [
      'TSH + free T4 to rule out thyroid',
      'Prolactin to rule out adenoma',
      'LH + FSH (typically both low or normal-low in HA — distinguishes from PCOS)',
      'Estradiol (low)',
      'AMH',
      'Pelvic ultrasound',
      'DEXA scan if HA persisted >6 months',
      'Pregnancy test',
    ],
    treatments: [
      'Increase energy availability (eat enough — usually 2500-3000+ kcal/day during recovery)',
      'Reduce high-impact / endurance training during recovery',
      'Manage chronic stress (therapy, sleep, lower cortisol load)',
      'Cognitive behavioural therapy for HA has the strongest single-intervention evidence',
      'Vitamin D + calcium for bone protection',
      'Transdermal estradiol + cyclic progesterone if recovery is slow (NOT combined OCPs — they mask the underlying issue)',
    ],
    redFlags: 'Combined hormonal birth control RESTORES "withdrawal bleeds" but does NOT restore HA. The bleed on the pill week is not the same as ovulating — bone loss and metabolic harm continue. Treating HA means treating the cause.',
    sources: ['Endocrine Society Clinical Practice Guideline 2017 (Gordon et al.)', 'No Period. Now What? (Nicola Rinaldi PhD)', 'Mountjoy et al., Br J Sports Med 2014 (RED-S)'],
  },
]

// ── Pattern matching against the user's logs ───────────────────
// Returns the matched conditions with score + signals, above the
// threshold. Used by the Conditions screen to surface "this is
// worth knowing about" cards — gently, never as diagnosis.

const SCORE_THRESHOLD = 0.35

function countLogs(logs, predicate, lookbackDays = 90) {
  const cutoff = new Date(); cutoff.setHours(0, 0, 0, 0)
  cutoff.setDate(cutoff.getDate() - lookbackDays)
  return Object.entries(logs || {}).reduce((acc, [date, log]) => {
    const d = new Date(date + 'T00:00:00')
    if (d < cutoff) return acc
    return acc + (predicate(log, date) ? 1 : 0)
  }, 0)
}

function pcosMatcher(logs, cycle) {
  const signals = []
  let score = 0

  // Long cycles — >35 days average
  if (cycle.cycleLength > 35) {
    score += 0.35
    signals.push(`Your cycle averages ${cycle.cycleLength} days (PCOS is suggested above 35)`)
  }
  // High variance — irregular pattern
  if (cycle.variance?.stdDev > 5) {
    score += 0.20
    signals.push(`Cycle length varies by ${Math.round(cycle.variance.stdDev)} days — irregular pattern`)
  }
  // Acne in logs
  const acneCount = countLogs(logs, (l) => (l.symptoms || []).includes('acne'))
  if (acneCount >= 4) {
    score += 0.15
    signals.push(`Skin breakouts logged ${acneCount} times in the last 90 days`)
  }
  // Missed period stretch
  if (cycle.cyclesLogged >= 1 && cycle.cycleLength > 45) {
    score += 0.20
    signals.push('Cycles consistently longer than 45 days')
  }
  return { score: Math.min(1, score), signals }
}

function endoMatcher(logs, cycle) {
  const signals = []
  let score = 0

  const crampsCount = countLogs(logs, (l) => (l.symptoms || []).includes('cramps') || l.mood === 'sore')
  if (crampsCount >= 6) {
    score += 0.25
    signals.push(`Cramps logged ${crampsCount} times across recent cycles`)
  }
  const painfulSexCount = countLogs(logs, (l) => (l.symptoms || []).includes('vulvarPain') || l.intimate?.painful)
  if (painfulSexCount >= 2) {
    score += 0.25
    signals.push(`Pain during sex logged ${painfulSexCount} times`)
  }
  const heavyCount = countLogs(logs, (l) => l.flow === 'Heavy')
  if (heavyCount >= 3) {
    score += 0.15
    signals.push(`Heavy flow on ${heavyCount} days in the last 90`)
  }
  const backCount = countLogs(logs, (l) => (l.symptoms || []).includes('back'))
  if (backCount >= 4) {
    score += 0.15
    signals.push(`Lower back pain logged ${backCount} times`)
  }
  // Long bleeds — periodLength > 7
  if (cycle.periodLength > 7) {
    score += 0.10
    signals.push(`Bleeds averaging ${cycle.periodLength} days (longer than typical)`)
  }
  return { score: Math.min(1, score), signals }
}

function pmddMatcher(logs, cycle) {
  const signals = []
  let score = 0
  if (!cycle.periodHistory || cycle.periodHistory.length < 2) {
    return { score: 0, signals: [] }
  }
  // Look for Low / anxious / 'frustrated' moods clustered in late luteal
  // across multiple cycles via the existing detectSymptomPatterns engine.
  const patterns = detectSymptomPatterns(logs, cycle.periodHistory, cycle.cycleLength, cycle.periodLength)
  const lutealMoodPatterns = patterns.filter(
    (p) => p.type === 'mood'
      && p.phase === 'luteal'
      && ['low', 'frustrated', 'sore', 'Low', 'Frustrated', 'Sore'].includes(p.label)
  )
  if (lutealMoodPatterns.length > 0) {
    const total = lutealMoodPatterns.reduce((a, p) => a + p.occurrences, 0)
    score += 0.45
    signals.push(`Difficult moods cluster in your luteal phase (${total} occurrences across cycles)`)
  }
  // Pre-period crisis-level moods
  const crisisCount = countLogs(logs, (l) => l.mood === 'low')
  if (crisisCount >= 4) {
    score += 0.20
    signals.push(`'Low' mood logged ${crisisCount} times in the last 90 days`)
  }
  return { score: Math.min(1, score), signals }
}

function thyroidMatcher(logs, cycle) {
  const signals = []
  let score = 0
  const fatigueCount = countLogs(logs, (l) => (l.symptoms || []).includes('fatigue') || l.mood === 'tired')
  if (fatigueCount >= 8) {
    score += 0.25
    signals.push(`Fatigue or 'tired' logged ${fatigueCount} times`)
  }
  // Long or absent cycles → consider hypothyroid
  if (cycle.cycleLength > 35 || (cycle.variance?.stdDev || 0) > 5) {
    score += 0.20
    signals.push('Cycle length or variance is unusual')
  }
  // Heavy bleeding can be hypothyroid
  const heavyCount = countLogs(logs, (l) => l.flow === 'Heavy')
  if (heavyCount >= 3) {
    score += 0.15
    signals.push('Heavy bleeding can be a hypothyroid sign')
  }
  return { score: Math.min(1, score), signals }
}

function fibroidsMatcher(logs, cycle) {
  const signals = []
  let score = 0
  const heavyCount = countLogs(logs, (l) => l.flow === 'Heavy')
  if (heavyCount >= 4) {
    score += 0.35
    signals.push(`Heavy flow on ${heavyCount} days in the last 90`)
  }
  if (cycle.periodLength > 7) {
    score += 0.25
    signals.push(`Periods running ${cycle.periodLength} days`)
  }
  const backCount = countLogs(logs, (l) => (l.symptoms || []).includes('back') || (l.symptoms || []).includes('bloat'))
  if (backCount >= 5) {
    score += 0.15
    signals.push('Lower back ache or bloating logged repeatedly')
  }
  return { score: Math.min(1, score), signals }
}

function haMatcher(logs, cycle) {
  const signals = []
  let score = 0
  // Missed periods — long cycles or very few period starts in lookback
  if (cycle.cycleLength > 45) {
    score += 0.45
    signals.push(`Cycle averaging ${cycle.cycleLength} days — possibly missing periods`)
  }
  // No period starts in the last 90 days
  if (cycle.periodHistory && cycle.periodHistory.length > 0) {
    const lastStart = cycle.periodHistory[cycle.periodHistory.length - 1]
    const daysSince = Math.floor((Date.now() - new Date(lastStart + 'T00:00:00').getTime()) / 86400000)
    if (daysSince > 90) {
      score += 0.40
      signals.push(`No period logged in the last ${daysSince} days`)
    }
  }
  return { score: Math.min(1, score), signals }
}

const MATCHERS = {
  pcos: pcosMatcher,
  endo: endoMatcher,
  pmdd: pmddMatcher,
  thyroid: thyroidMatcher,
  fibroids: fibroidsMatcher,
  ha: haMatcher,
}

export function matchConditions(logs, cycle) {
  const out = []
  for (const cond of CONDITIONS) {
    const fn = MATCHERS[cond.id]
    if (!fn) continue
    const { score, signals } = fn(logs, cycle)
    if (score >= SCORE_THRESHOLD && signals.length > 0) {
      out.push({ id: cond.id, name: cond.name, score, signals, condition: cond })
    }
  }
  return out.sort((a, b) => b.score - a.score)
}

export function getCondition(id) {
  return CONDITIONS.find((c) => c.id === id) || null
}
