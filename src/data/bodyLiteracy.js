// Body literacy — the teach layer.
//
// Every input the user can log has a sourced, plain-English 2-line
// explainer here. The log becomes the lesson. The daily-insight
// surface on Home pulls from `dailyLessonPool` per phase. Conditions
// matching pulls from this file too via the symptom IDs.
//
// All voice rules from the rest of Luna apply: doula, no optimisation
// talk, body-literacy framing, sources visible.

import { PHASES } from './lunaData'

// ── Flow at the moment of log ───────────────────────────────────
// Phase-aware so the same flow level reads differently in luteal
// vs menstrual. When phase doesn't matter, the `any` key applies.
export const FLOW_LESSONS = {
  Spotting: {
    any: {
      title: 'Spotting is data.',
      body: "A few drops outside your period can mean ovulation bleeding (mid-cycle estrogen dip), an implantation pinch, or breakthrough bleeding on hormonal BC. Tracked over cycles, the pattern itself becomes a clinical clue.",
      source: 'ACOG; Cleveland Clinic',
    },
    luteal: {
      title: 'Late-luteal spotting is common.',
      body: "Brown or pink spotting in the 1–3 days before your period is just the lining loosening early. Pre-menstrual spotting that lasts more than 2 days for multiple cycles is worth a conversation — sometimes a progesterone issue.",
      source: 'ACOG',
    },
    follicular: {
      title: 'Spotting in follicular is unusual.',
      body: "If this repeats more than one cycle without a hormonal-BC change, it's worth bringing up. Polyps, fibroids, or a thyroid shift can all do this — none are emergencies, all are worth knowing about.",
      source: 'Cleveland Clinic',
    },
    ovulation: {
      title: 'Ovulation bleeding is a real thing.',
      body: "About 5% of menstruating people spot mid-cycle — a brief estrogen dip right after the LH surge can shed a tiny bit of lining. Brief and one-off is normal; tracking confirms the pattern.",
      source: 'ACOG',
    },
  },
  Light: {
    any: {
      title: 'Light flow is within normal.',
      body: "Lighter cycles can be hormonal-BC related, a softer post-pregnancy or perimenopause shift, or just your personal baseline. Tracking three cycles tells you what light means for *you*.",
      source: 'ACOG',
    },
  },
  Medium: {
    any: {
      title: 'Medium is most people\'s baseline.',
      body: "A typical period is about 30–80 mL total across 3–7 days. You don't need to measure — your baseline is the comparison that matters. Big shifts from your normal are the signal worth catching.",
      source: 'ACOG — Menstruation Practice Bulletin',
    },
  },
  Heavy: {
    any: {
      title: 'Heavy flow drains iron — track it.',
      body: "Soaking a pad or tampon every hour for several hours, passing clots bigger than a quarter, or bleeding more than 7 days = clinical heavy menstrual bleeding (HMB). Affects up to 1 in 5 of us. Ask for a ferritin test, not just hemoglobin.",
      source: 'NICE Guideline NG88; British Society for Haematology',
    },
  },
}

// ── Cervical mucus — peak fertility's most useful single signal ─
export const MUCUS_LESSONS = {
  dry: {
    title: 'Dry is normal early and late.',
    body: "Just after your period and again in late luteal, low estrogen makes mucus minimal. It's not 'dry vagina,' it's the cycle resting between estrogen peaks.",
    source: 'Taking Charge of Your Fertility (Weschler)',
  },
  sticky: {
    title: 'Sticky = estrogen rising, low fertility.',
    body: "Thicker, paste-like mucus appears as estrogen begins to climb in early follicular. Sperm can't travel well through it. Fertility is low but rising.",
    source: 'ACOG — Cervical Mucus',
  },
  creamy: {
    title: 'Creamy = closer to fertile.',
    body: "Lotion-like, white or light yellow. Estrogen is mid-rise, fertility is climbing. You're typically 3–5 days from ovulation when this appears consistently.",
    source: 'Taking Charge of Your Fertility',
  },
  eggwhite: {
    title: 'Egg-white = peak fertility window.',
    body: "Stretchy, clear, slippery. This is the gold-standard non-instrumental fertility marker — peaks 1-2 days BEFORE ovulation, so sperm timing is best now. Estrogen has crested.",
    source: 'WHO Cervical Mucus Monitoring; Billings Ovulation Method',
  },
  watery: {
    title: 'Watery = high fertility.',
    body: "Thin and clear, like raw egg-white without the stretch. Often appears just before the egg-white peak. Sperm travels well through this — fertility is high.",
    source: 'Cleveland Clinic',
  },
}

// ── Sleep — what it means in each phase ─────────────────────────
export const SLEEP_LESSONS = {
  Poor: {
    menstrual: { title: 'Sleep fragments during your period.', body: "Estrogen and progesterone just dropped — both affect deep sleep architecture. Magnesium glycinate, cool room, no screens 30 min before bed.", source: 'Sleep Foundation; Mong & Cusmano 2016' },
    follicular: { title: 'Poor sleep in follicular is worth pausing on.', body: "This phase typically has the best sleep — falling temps, rising estrogen. If it's not happening, look at sleep hygiene, stress, screens, or possible thyroid.", source: 'Sleep Foundation' },
    ovulation: { title: 'Estrogen peak can disrupt sleep briefly.', body: "Some feel a 1-2 night dip around ovulation. Magnesium and a cool room help. If it lasts more than 3 nights, look elsewhere.", source: 'Sleep Foundation' },
    luteal: { title: 'Late-luteal insomnia is hormonal.', body: "Progesterone is sedating — when it drops in the final luteal days, sleep wakes you. Steady bedtime, magnesium, cut caffeine earlier. Common, not personal.", source: 'Sleep Foundation; Mong & Cusmano 2016' },
  },
  Restless: {
    any: { title: 'Restless sleep is worth tracking.', body: "Restless ≠ insomnia. Many factors converge: cycle phase, room temperature, alcohol, late caffeine, screen exposure. Track which days repeat across cycles.", source: 'Sleep Foundation' },
  },
  Okay: { any: { title: '"Okay" sleep is useful data.', body: "Patterns hide in the okay-not-great range. If you log 'okay' five days a week across a month, that's a quiet signal something is suppressing deeper rest.", source: 'Sleep Foundation' } },
  Great: { any: { title: 'Great sleep is worth noticing.', body: "When sleep clicks, log what you did — earlier bedtime, magnesium, less screen, lighter dinner. The patterns that work for *you* are more useful than any generic rule.", source: 'Sleep Foundation' } },
}

// ── Sex log — privacy-first framing, fertility-aware ───────────
export const SEX_LESSONS = {
  unprotected: {
    fertile: { title: 'Sperm can survive 3–5 days.', body: "If you're inside or just before your fertile window, sperm logged today can still meet an egg this week. If you're tracking to conceive, this is the timing. If you're not, plan-B works up to 72h, ulipristal up to 120h.", source: 'ACOG — Emergency Contraception' },
    any: { title: 'Pregnancy risk depends on cycle day.', body: "Outside the fertile window pregnancy is unlikely but not impossible — cycles vary by 2–3 days routinely. Tracking unprotected sex alongside ovulation signals is good body literacy regardless of goals.", source: 'ACOG' },
  },
  protected: {
    any: { title: 'Protected sex is still data.', body: "Frequency and timing across the cycle tell you about your own libido pattern. Most women feel desire shift across the cycle — this is the log that surfaces it for you.", source: 'Basson — Responsive Desire model' },
  },
  none: { any: { title: 'Tracking days without is also data.', body: "Libido dips have causes — BC, SSRIs, postpartum, perimenopause, stress, undiagnosed pain. The log over time helps you see when the pattern started and what shifted.", source: 'ACOG — Female Sexual Dysfunction' } },
}

// ── BBT — what the reading means today ──────────────────────────
export const BBT_LESSONS = {
  pre: { title: 'Pre-ovulation, BBT runs lower.', body: "Estrogen suppresses basal body temperature. Follicular average is usually 97.0–97.7°F (36.1–36.5°C). A reading in that range is normal-low.", source: 'Cleveland Clinic — BBT' },
  post: { title: 'Post-ovulation, BBT runs higher.', body: "Progesterone raises BBT about 0.4–0.8°F (0.2–0.4°C). Luteal average is usually 97.7–98.6°F (36.5–37.0°C). The shift is what confirms ovulation — not any one reading.", source: 'Cleveland Clinic — BBT' },
  high: { title: 'Sustained high BBT for 18+ days.', body: "Luteal phase normally runs 10–14 days. Temperature staying high past 18 days post-ovulation can signal early pregnancy. A urine test is more practical than waiting on temperature.", source: 'ACOG — Early Pregnancy Detection' },
}

// ── Cervix position teach (for users who track it) ─────────────
export const CERVIX_LESSONS = {
  soft: { title: 'Soft cervix = approaching ovulation.', body: "Around ovulation, your cervix moves higher, opens slightly, and softens (think 'lips' instead of 'tip of nose'). Estrogen is doing this.", source: 'Taking Charge of Your Fertility' },
  firm: { title: 'Firm cervix = not fertile right now.', body: "Outside the fertile window, cervix sits lower and feels firmer — closer to a small ring. Progesterone (luteal) and low-estrogen (menstrual / early follicular) both produce this.", source: 'Taking Charge of Your Fertility' },
}

// ── Daily lesson pool — Home daily-insight surface ─────────────
// Pool per phase. One lesson surfaces per day, picked deterministically
// from cycleDay so the user sees the same lesson all day but a different
// one tomorrow. Each lesson is a piece of body literacy — the kind of
// thing Flo would charge for or bury in a wall of text. Luna leads with it.
export const DAILY_LESSON_POOL = {
  menstrual: [
    { eyebrow: 'Body literacy', title: 'Your prostaglandins drive the cramping.', body: "These are inflammatory compounds the uterus releases to contract and shed its lining. Higher prostaglandins = more pain. Heat works on the same pathway as ibuprofen — both are valid.", source: 'ACOG' },
    { eyebrow: 'Body literacy', title: 'Heavy first 2 days = normal.', body: "Most of your total loss happens in the first 48 hours. Tapering after that means the lining is shedding cleanly. Soaking through hourly is the signal worth catching.", source: 'NICE NG88' },
    { eyebrow: 'Body literacy', title: 'Iron drops measurably each period.', body: "Each cycle loses roughly 12-15 mg of iron. Heavy cycles can outpace replenishment, which is why menstruating people are the most iron-deficient demographic on earth. Ferritin > hemoglobin for testing.", source: 'British Society for Haematology' },
    { eyebrow: 'Body literacy', title: 'Period stool changes are real.', body: 'Prostaglandins affect the bowel too. Looser stools, urgency, sometimes nausea — same chemistry that contracts the uterus. Not the food you ate.', source: 'Cleveland Clinic' },
    { eyebrow: 'Body literacy', title: 'Period blood is not "dirty."', body: "It's lining tissue, mucus, and blood — the same material that supports an early pregnancy. The 'unclean' framing is cultural baggage with no medical basis.", source: 'WHO Menstrual Health Framework' },
    { eyebrow: 'Body literacy', title: 'Clots up to a quarter = normal.', body: "Small dark clots, especially in heavier hours, are just lining tissue. Clots larger than a quarter, repeating across several hours, are worth bringing up — flow is heavy enough that clotting cascades are activating.", source: 'NICE NG88' },
    { eyebrow: 'Body literacy', title: 'Energy is low because hormones just dropped.', body: "Estrogen and progesterone both bottomed out to start your period. Both affect mood, energy, and brain function. Feeling like a different person is biology, not a willpower problem.", source: 'Cleveland Clinic' },
  ],
  follicular: [
    { eyebrow: 'Body literacy', title: 'Estrogen sharpens you week to week.', body: "Rising estrogen is associated with sharper verbal fluency, better mood, faster reaction time, deeper sleep. The 'feeling like yourself' sense is real — and it's measurable.", source: 'Sundström-Poromaa et al., Front Neuroendocrinol 2014' },
    { eyebrow: 'Body literacy', title: 'A follicle is growing right now.', body: "One dominant follicle in one ovary is being selected this week. Multiple started — most regress. The chosen one will release its egg in ~5-7 days.", source: 'Endocrine Society' },
    { eyebrow: 'Body literacy', title: 'Insulin sensitivity is at its peak.', body: "Your body uses carbs more efficiently in follicular. Strength training, intervals, and learning new movements all work especially well now.", source: 'McNulty et al., Sports Medicine 2020' },
    { eyebrow: 'Body literacy', title: 'Skin is calmest this week.', body: "Sebum production is lower in follicular — many people see clearer skin and less reactive moods. If you experiment with skincare, this is the lowest-noise window to test.", source: 'AAD' },
    { eyebrow: 'Body literacy', title: 'Mucus thickens before it thins.', body: "Right after your period, mucus is minimal and sticky. As estrogen rises through this phase, it turns creamy → watery → egg-white over about a week. The pattern is a fertility narrative.", source: 'WHO Cervical Mucus Monitoring' },
    { eyebrow: 'Body literacy', title: 'Endurance benefits from the estrogen up-curve.', body: "Aerobic capacity is slightly higher in follicular than luteal — better oxygen utilization, lower core temp. Hard runs feel less hard.", source: 'Sims — Roar Protocol' },
  ],
  ovulation: [
    { eyebrow: 'Body literacy', title: 'The LH surge lasts about 24-36 hours.', body: "Once luteinizing hormone surges, the follicle ruptures within 24-36 hours and releases the egg. The egg itself is viable for 12-24 hours after that.", source: 'Endocrine Society' },
    { eyebrow: 'Body literacy', title: 'Sperm outlasts the egg by days.', body: "Sperm survives 3-5 days in fertile mucus. The egg lives 12-24 hours. Which means the fertile window is built around sperm timing, not egg timing.", source: 'Wilcox et al., NEJM 1995' },
    { eyebrow: 'Body literacy', title: 'Mittelschmerz is real, named, and one-sided.', body: "About 20% of menstruating people feel a brief one-sided pinch when the follicle ruptures. Lasts minutes to a day. If it lasts 24+ hours, gets severe, or comes with fever — get checked.", source: 'Cleveland Clinic' },
    { eyebrow: 'Body literacy', title: 'Testosterone peaks too.', body: "Estrogen rises AND testosterone has a small mid-cycle bump. Many people notice sharper libido, more confidence, easier social fluency. Biologically supported.", source: 'Roney & Simmons 2013' },
    { eyebrow: 'Body literacy', title: 'ACL injuries cluster here.', body: "Estrogen relaxes connective tissue slightly. Female athletes have measurably higher ACL injury rates around ovulation. Warm up thoroughly this week, especially before lateral or jumping movements.", source: 'Hertel et al., Sports Health 2006' },
  ],
  luteal: [
    { eyebrow: 'Body literacy', title: 'Your corpus luteum runs a 12-14 day clock.', body: "After ovulation, the empty follicle becomes the corpus luteum — a temporary progesterone factory. Without pregnancy it dissolves on schedule, hormones drop, and your period starts. This is why luteal length is more predictable than follicular.", source: 'Cleveland Clinic' },
    { eyebrow: 'Body literacy', title: 'Carb cravings are biological.', body: "Serotonin drops in late luteal. Carbs increase tryptophan transport into the brain, which boosts serotonin. Your brain is asking for what it needs. Complex carbs (oats, sweet potato, whole grains) work best — they don't crash you.", source: 'Souza et al., Nutrition Reviews 2023' },
    { eyebrow: 'Body literacy', title: 'Progesterone slows digestion.', body: "Smooth muscle relaxes throughout the GI tract — that's the same mechanism that prevents miscarriage. The bloating and constipation are not bad food choices, they're chemistry.", source: 'Cleveland Clinic' },
    { eyebrow: 'Body literacy', title: 'BBT runs about 0.5°F higher now.', body: "Progesterone raises your set point. You'll sleep cooler if you keep the room a degree or two lower than usual. The shift itself is what confirmed ovulation a few days back.", source: 'Cleveland Clinic — BBT' },
    { eyebrow: 'Body literacy', title: 'Late-luteal mood drops are PMS by definition.', body: "If your low/anxious/irritable days cluster in the final 5-7 days before your period and improve within 2-3 days of bleeding starting, that's PMS. If the lows are disabling — hopelessness, panic, suicidal thoughts — that's PMDD, recognized in the DSM-5, and treatable.", source: 'ACOG PMDD Practice Bulletin' },
    { eyebrow: 'Body literacy', title: 'Calcium reduced PMS ~48% in one major RCT.', body: "1000-1200 mg/day across the whole month, not just during luteal. Yogurt, fortified plant milk, leafy greens. Thys-Jacobs 1998 is the foundational study. Magnesium 400 mg/day stacks well with it.", source: 'Thys-Jacobs et al., 1998; Walker et al., 1998' },
    { eyebrow: 'Body literacy', title: 'Caffeine clears slower in luteal.', body: "Estrogen and progesterone both slow the liver enzymes that metabolize caffeine. Your 4 PM coffee that was fine in follicular hits like a 7 PM coffee now. Cut the last cup earlier.", source: 'Granfone et al., Clin Pharmacol Ther 1991' },
  ],
}

// Pick the day's lesson deterministically — same lesson all day, new
// one tomorrow. Falls through cycleDay so users near the end of a phase
// see different lessons than those at the start.
export function dailyLessonFor(phaseId, cycleDay) {
  const pool = DAILY_LESSON_POOL[phaseId]
  if (!pool || !pool.length) return null
  const idx = ((cycleDay || 1) - 1) % pool.length
  return pool[idx]
}

// ── Adaptive: pick a lesson that responds to recent log signals ──
// If today's log has something specific (cramps + heavy in menstrual,
// poor sleep in luteal, EWCM in follicular, etc.), surface a lesson
// that addresses it instead of the rotating one. Falls back to the
// rotating pool when nothing matches.
export function adaptiveLessonFor({ phaseId, cycleDay, todayLog, recentLogs }) {
  if (!phaseId) return null
  const symptoms = todayLog?.symptoms || []
  const mood = todayLog?.mood
  const flow = todayLog?.flow

  // Menstrual — heavy flow → iron lesson
  if (phaseId === 'menstrual' && flow === 'Heavy') {
    return { eyebrow: 'For today', title: 'Heavy days quietly drain iron.', body: "Each heavy cycle can outpace your iron replenishment. Pair iron-rich food (red meat, lentils, spinach) with vitamin C — it triples absorption. If you're soaking pads hourly, a ferritin test is the right ask.", source: 'British Society for Haematology', readId: 'iron' }
  }
  // Cramps → prostaglandin lesson with action
  if (symptoms.includes('cramps')) {
    return { eyebrow: 'For today', title: 'Cramps come from prostaglandins.', body: "Heat works as well as ibuprofen for many people — RCT-supported. Magnesium 400mg may reduce intensity over 3 cycles. Light movement reduces them; sitting still often makes them worse.", source: 'ACOG; Cochrane Reviews' }
  }
  // Late-luteal Low mood → PMDD literacy
  if (phaseId === 'luteal' && mood === 'low' && cycleDay >= 21) {
    return { eyebrow: 'For today', title: 'When late-luteal lows are disabling.', body: "If you experience hopelessness, panic, or thoughts of harm only in the week before your period — and they lift within days of bleeding — that's PMDD. Affects 3-8% of menstruating people, formally recognised, treatable. Track two cycles, then talk to a doctor.", source: 'ACOG PMDD Practice Bulletin', readId: 'pmdd' }
  }
  // Late luteal headache → menstrual migraine
  if (phaseId === 'luteal' && symptoms.includes('headache') && cycleDay >= 23) {
    return { eyebrow: 'For today', title: 'Estrogen drops trigger menstrual migraines.', body: "The hormonal cliff at end-luteal is the trigger. Magnesium 400-600mg daily starting 3 days pre-period prevents many. NSAIDs at first sign beat NSAIDs at peak. Track to confirm the pattern.", source: 'American Headache Society' }
  }
  // EWCM logged → fertility window lesson
  if (phaseId === 'follicular' && todayLog?.mucus === 'eggwhite') {
    return { eyebrow: 'For today', title: 'Egg-white mucus = peak window.', body: "This is the strongest non-instrumental fertility signal. Peaks 1-2 days BEFORE ovulation, so sperm timing is best NOW. Mucus is the best single fertility predictor most people don't track.", source: 'WHO Cervical Mucus Monitoring' }
  }
  // Poor sleep in luteal → progesterone drop
  if (phaseId === 'luteal' && todayLog?.sleep === 'Poor') {
    return { eyebrow: 'For today', title: 'Late-luteal insomnia is hormonal.', body: "Progesterone is sedating — when it drops in the final days, sleep wakes you. Steady bedtime, room about 65°F, magnesium glycinate, no caffeine after 1 PM. The pattern repeats most cycles for many people.", source: 'Sleep Foundation; Mong & Cusmano 2016' }
  }
  // Default — rotating pool
  return dailyLessonFor(phaseId, cycleDay)
}

// Convenience export — phase summary for the cycle wheel tap teach modal
export function phaseSummary(phaseId) {
  const p = PHASES[phaseId]
  if (!p) return null
  return {
    name: p.name,
    days: p.days,
    color: p.color,
    hormones: p.hormones,
    whatsHappening: p.whatsHappening,
    bodyMood: p.bodyMood,
    source: p.sourceBody,
  }
}
