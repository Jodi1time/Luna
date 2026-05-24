// luna-data.jsx — Evidence-based medical content for Luna
// Every claim sourced from peer-reviewed research, Cleveland Clinic, Kaiser
// Permanente, Geisinger, Trinity Health, or systematic reviews. Sources listed
// inline so users (and the team) can verify.

// ─────────────────────────────────────────────────────────────
// CYCLE PHASES — medically grounded
// ─────────────────────────────────────────────────────────────
const LUNA_PHASES = {
  menstrual: {
    id: 'menstrual',
    name: 'Menstrual',
    days: '1–7',
    color: '#C84E2E',
    hormones: 'Estrogen and progesterone drop sharply.',
    whatsHappening: 'Your uterine lining sheds. Prostaglandins (inflammatory compounds) are released to help the uterus contract — this is what causes cramps and that flu-like feeling.',
    bodyMood: 'Energy at its lowest. Brain may feel foggy. Serotonin and dopamine dip.',
    sourceBody: 'Cleveland Clinic; Geisinger Health',
    nutrition: {
      headline: 'Iron is the priority.',
      do: [
        'Iron-rich foods: lean red meat, lentils, spinach, beans, tofu',
        'Pair iron with vitamin C (oranges, peppers, broccoli) — it boosts absorption',
        'Magnesium-rich foods may reduce cramps: pumpkin seeds, dark leafy greens, dark chocolate',
        'Warm, anti-inflammatory foods: ginger tea, turmeric, soups',
      ],
      avoid: [
        'High caffeine (can worsen cramps and anxiety)',
        'Excess alcohol (poor sleep, dehydration)',
      ],
      source: 'Trinity Health Michigan; Cleveland Clinic',
    },
    exercise: {
      headline: 'Rest is productive.',
      do: ['Walking', 'Restorative yoga', 'Light stretching', 'Pilates if energy allows'],
      avoid: ['Heavy lifting if cramping severe', 'High-intensity intervals'],
      note: 'A 2020 systematic review found early follicular (overlapping with menstrual) shows trivially reduced exercise performance — but you can still train if you feel up to it.',
      source: 'Sims et al., Systematic Review & Meta-Analysis 2020 (PMC7497427)',
    },
    redFlag: 'Heavy flow lasting >7 days or soaking a pad/tampon every hour for several hours = see a doctor. Could indicate menorrhagia or iron-deficiency anemia risk.',
  },
  follicular: {
    id: 'follicular',
    name: 'Follicular',
    days: '8–13',
    color: '#D88869',
    hormones: 'Estrogen rises steadily. FSH triggers a dominant follicle to mature.',
    whatsHappening: 'Your body is preparing to release an egg. The uterine lining begins to thicken again.',
    bodyMood: 'Energy lifts. Mood, cognition, skin all tend to improve. Social drive often increases.',
    sourceBody: 'Cleveland Clinic; FeelGoodPal (citing Sims 2020)',
    nutrition: {
      headline: 'Carb tolerance is highest now.',
      do: [
        'Complex carbs: quinoa, brown rice, oats, sweet potatoes',
        'Lean proteins: chicken, fish, tofu, Greek yogurt',
        'Healthy fats: avocado, olive oil, nuts and seeds',
        'Fermented foods may support gut + estrogen metabolism: kimchi, yogurt, kefir',
      ],
      avoid: ['Rigid "estrogenic food" rules — no clinical evidence'],
      source: 'Cleveland Clinic; Trinity Health Michigan',
    },
    exercise: {
      headline: 'Best window for new PRs.',
      do: ['Strength training', 'High-intensity intervals', 'Running, cycling, hiking', 'Try new movements — coordination tends to be sharper'],
      avoid: [],
      note: 'Insulin sensitivity is improved; anabolic response to protein may be slightly higher.',
      source: 'Geisinger; Equator Virgin Active Nutrition Guide',
    },
    redFlag: 'Spotting between periods, severe pelvic pain, or no period after stopping birth control for 3+ months → see a doctor.',
  },
  ovulation: {
    id: 'ovulation',
    name: 'Ovulation',
    days: '14–16',
    color: '#E8B765',
    hormones: 'Estrogen and testosterone peak. LH surge triggers egg release.',
    whatsHappening: 'A mature egg is released from the ovary. Cervical mucus becomes egg-white-like. Basal body temperature rises ~0.5°F after ovulation.',
    bodyMood: 'Peak energy, libido, and confidence for many people. Verbal fluency may sharpen.',
    sourceBody: 'Cleveland Clinic; FeelGoodPal',
    nutrition: {
      headline: 'Oxidative stress increases — eat the rainbow.',
      do: [
        'Antioxidant-rich foods: berries, dark leafy greens, beets',
        'Polyunsaturated fats: salmon, walnuts, flax, chia',
        'Cruciferous vegetables (broccoli, cauliflower) support estrogen metabolism',
        'Plenty of water — body temperature rises slightly',
      ],
      avoid: ['Excessive processed foods during this peak'],
      source: 'Virgin Active Nutrition Guide for Menstrual Cycle',
    },
    exercise: {
      headline: 'Peak performance window.',
      do: ['Strength PRs', 'Sprint work', 'Team sports', 'Anything that needs confidence + power'],
      avoid: [],
      note: 'Be aware: some research suggests slightly higher ACL injury risk at ovulation due to ligament laxity from estrogen peak. Warm up thoroughly.',
      source: 'Sports medicine research; Hertel et al.',
    },
    redFlag: 'Severe ovulation pain (mittelschmerz) lasting >24h or accompanied by fever could indicate ovarian cyst or PID — see a doctor.',
  },
  luteal: {
    id: 'luteal',
    name: 'Luteal',
    days: '17–28',
    color: '#9D6F8C',
    hormones: 'Progesterone takes over and rises. Estrogen has a smaller secondary peak.',
    whatsHappening: 'The corpus luteum (what\'s left of the follicle) produces progesterone to prep the uterus. If no pregnancy, hormones drop in the last days and the cycle restarts.',
    bodyMood: 'Energy gradually declines. PMS symptoms may appear: bloating, irritability, fatigue, brain fog, cravings. Serotonin and dopamine begin to drop.',
    sourceBody: 'Trinity Health; Cleveland Clinic; Geisinger',
    nutrition: {
      headline: 'Cravings are biological, not weak willpower.',
      do: [
        'Complex carbs (oats, sweet potato, whole grain) — support serotonin production',
        'Magnesium: pumpkin seeds, dark chocolate (70%+), spinach — can reduce PMS severity',
        'B6-rich foods: salmon, chicken, bananas — supports mood',
        'Calcium: yogurt, fortified plant milk — may reduce PMS per RCT data',
        'Stay hydrated to combat bloating',
      ],
      avoid: ['High sugar (worsens mood crashes)', 'Excess alcohol (worsens sleep, mood)', 'Excess salt if bloating'],
      note: 'Research shows women eat 159–529 kcal/day more in the luteal phase. This is hormonally driven, not a discipline problem.',
      source: 'Oxford Nutrition Reviews 2023; Trinity Health',
    },
    exercise: {
      headline: 'Start strong. Taper as you go.',
      do: [
        'Early luteal: still good for moderate-to-vigorous workouts',
        'Mid-to-late luteal: shift to walking, yoga, tai chi, Pilates',
        'Light movement actually helps PMS — even when motivation drops',
      ],
      avoid: ['Punishing workouts in the final days before your period'],
      source: 'Geisinger; Kaiser Permanente',
    },
    redFlag: 'If PMS feels disabling — extreme mood swings, depression, panic attacks, suicidal ideation in the days before your period — this could be PMDD (Premenstrual Dysphoric Disorder), a clinical condition affecting ~3–8% of menstruating people. Talk to a doctor. PMDD is treatable.',
  },
};

// ─────────────────────────────────────────────────────────────
// SYMPTOMS — each tied to evidence-based context
// ─────────────────────────────────────────────────────────────
const LUNA_SYMPTOMS = {
  cramps: {
    label: 'Cramps',
    emoji: '🩹',
    why: 'Prostaglandins cause the uterus to contract to expel its lining. Higher prostaglandins → more severe cramps.',
    evidence: [
      'Heat (heating pad) is as effective as ibuprofen for many people — RCT evidence',
      'Magnesium supplementation may reduce severity',
      'Light exercise can help; sitting still often makes it worse',
    ],
    redFlag: 'Cramps that stop you from going to work/school, or are getting worse over time, could indicate endometriosis. Endometriosis affects ~10% of menstruating people and takes an average of 7+ years to diagnose. Ask your doctor.',
    source: 'ACOG (American College of Obstetricians & Gynecologists)',
  },
  headache: {
    label: 'Headache',
    emoji: '🤕',
    why: 'Estrogen drops at the end of luteal phase can trigger "menstrual migraines" in susceptible people.',
    evidence: [
      'Magnesium 400–600mg/day starting 3 days pre-period may prevent menstrual migraines',
      'NSAIDs taken at the first sign are more effective than later',
      'Tracking helps identify patterns — many people don\'t realize their headaches are cyclical',
    ],
    redFlag: 'New severe headache, headache with vision changes, or "worst headache of your life" = ER, not later.',
    source: 'American Headache Society',
  },
  bloat: {
    label: 'Bloating',
    emoji: '🫧',
    why: 'Progesterone slows digestion. Water retention also peaks in late luteal phase.',
    evidence: [
      'Most bloating resolves within first 2 days of period',
      'Reduce salt, increase water, magnesium can help',
      'Probiotic foods may support gut motility',
    ],
    redFlag: 'Persistent bloating that doesn\'t resolve with your period, or feels different — can rarely indicate ovarian issues. Worth checking if it persists.',
    source: 'Cleveland Clinic',
  },
  mood: {
    label: 'Mood swings',
    emoji: '🥺',
    why: 'Serotonin and dopamine drop in late luteal phase. The brain is genuinely operating in a different hormonal environment.',
    evidence: [
      'Aerobic exercise has the strongest RCT evidence for PMS mood',
      'Calcium 1000–1200mg/day reduced PMS symptoms ~48% in a major RCT',
      'CBT shows efficacy for PMDD when severe',
    ],
    redFlag: 'If you experience suicidal thoughts, hopelessness, or panic attacks specifically in the week before your period, this may be PMDD. PMDD is a clinical diagnosis with effective treatments. Please talk to a doctor.',
    source: 'Thys-Jacobs RCT 1998; ACOG PMDD guidance',
  },
  tender: {
    label: 'Tender breasts',
    emoji: '💞',
    why: 'Rising progesterone in luteal phase causes breast tissue swelling.',
    evidence: [
      'Reducing caffeine may help — RCT-supported',
      'Vitamin E and evening primrose oil have mixed evidence',
      'Well-fitted supportive bra during luteal phase often helps',
    ],
    redFlag: 'A new, persistent, unilateral lump that doesn\'t move with your cycle = see a doctor promptly.',
    source: 'Cleveland Clinic',
  },
  fatigue: {
    label: 'Fatigue',
    emoji: '😴',
    why: 'Estrogen and serotonin drops sap energy. Heavy menstrual bleeding can drive low iron, which compounds it.',
    evidence: [
      'Get ferritin checked if heavy flow + persistent fatigue',
      'B12 and vitamin D status matter — both are often low in menstruating people',
      'Sleep hygiene is more impactful than supplements',
    ],
    redFlag: 'Fatigue that doesn\'t lift with rest, plus pallor, hair loss, or shortness of breath → iron deficiency / anemia bloodwork.',
    source: 'British Society for Haematology iron deficiency guidance',
  },
  acne: {
    label: 'Skin breakout',
    emoji: '🫥',
    why: 'Testosterone\'s relative rise + progesterone\'s impact on sebum often causes late-luteal/early-menstrual breakouts.',
    evidence: [
      'Topical retinoids and salicylic acid are the most evidence-based',
      'Hormonal acne pattern (jawline, chin, recurring monthly) often responds to spironolactone or hormonal birth control if severe',
    ],
    redFlag: 'Severe acne, hirsutism, irregular cycles together can indicate PCOS — see a doctor.',
    source: 'AAD (American Academy of Dermatology)',
  },
  crave: {
    label: 'Cravings',
    emoji: '🍫',
    why: 'Serotonin drops in luteal phase — your brain is literally seeking carbs to boost serotonin synthesis.',
    evidence: [
      'Eating regular complex-carb meals reduces craving intensity',
      'Dark chocolate (70%+) is a reasonable craving response — magnesium + lower sugar than candy',
      'Suppression usually backfires; honoring smaller cravings prevents binge cycles',
    ],
    source: 'Oxford Nutrition Reviews 2023',
  },
  sleep: {
    label: 'Sleep issues',
    emoji: '🌙',
    why: 'Progesterone has a mild sedating effect — its drop late-luteal can cause insomnia. Body temperature also rises slightly in luteal phase, which can disrupt sleep.',
    evidence: [
      'Keep bedroom cool (~65°F)',
      'Magnesium glycinate before bed has good safety profile',
      'Caffeine clearance slows in luteal phase — cut your last cup earlier',
    ],
    source: 'Sleep Foundation; Mong & Cusmano 2016',
  },
  back: {
    label: 'Back pain',
    emoji: '🦴',
    why: 'Prostaglandins refer pain to the lower back. Endometriosis can also cause cyclical lower-back pain.',
    evidence: [
      'Same heat / NSAID / movement protocol as cramps',
      'Specific lower-back stretches: child\'s pose, cat-cow',
    ],
    redFlag: 'Severe back pain with painful sex or painful bowel movements during your period → ask about endometriosis screening.',
    source: 'ACOG',
  },
};

// ─────────────────────────────────────────────────────────────
// EVIDENCE-BASED ARTICLES (Library)
// ─────────────────────────────────────────────────────────────
const LUNA_ARTICLES = [
  {
    id: 'pmdd',
    cat: 'Mental Health',
    tag: 'Important',
    title: 'PMDD: when it\'s not "just PMS"',
    read: '4 min',
    summary: 'Up to 1 in 12 menstruating people have PMDD. It\'s a clinical diagnosis — and it\'s treatable.',
    body: [
      'PMDD (Premenstrual Dysphoric Disorder) affects an estimated 3–8% of menstruating people. It\'s in the DSM-5 as a mental health condition — meaning it\'s formally recognized and well-studied.',
      'The difference from PMS is severity. PMS is uncomfortable. PMDD is disabling. Symptoms must occur in the week before menstruation, improve within a few days of period onset, and be minimal or absent in the week post-period — for most cycles.',
      'Symptoms can include: extreme mood swings, hopelessness, panic attacks, anger, suicidal ideation, severe fatigue, and difficulty concentrating.',
      'Treatments with strong evidence: SSRIs (often dosed only during luteal phase), CBT, certain hormonal birth control formulations, and lifestyle interventions including aerobic exercise.',
      'If you suspect PMDD, track symptoms for at least 2 cycles before your appointment. Your provider needs the daily data to diagnose — Luna can export this.',
    ],
    sources: [
      'American College of Obstetricians and Gynecologists (ACOG) Practice Bulletin',
      'International Association for Premenstrual Disorders (IAPMD)',
      'Yonkers et al., Lancet 2008',
    ],
  },
  {
    id: 'iron',
    cat: 'Nutrition',
    tag: 'Common',
    title: 'Heavy periods, low iron, and how they connect',
    read: '3 min',
    summary: 'If your period soaks pads/tampons hourly or lasts >7 days, your iron may be running on empty.',
    body: [
      'Heavy menstrual bleeding (menorrhagia) is defined as losing more than 80mL of blood per cycle, or bleeding for more than 7 days. Up to 1 in 5 menstruating people meet this definition.',
      'Iron deficiency develops gradually. You can be iron-deficient without being anemic — and still feel exhausted, foggy, and have hair loss or restless legs.',
      'Ask your doctor for a "ferritin" test, not just hemoglobin. Ferritin shows your stored iron and drops first.',
      'Dietary iron: heme iron (red meat, poultry, fish) absorbs at ~25%, non-heme iron (beans, spinach, tofu) at ~5–10%. Pair non-heme with vitamin C to boost absorption.',
      'Avoid taking iron with tea, coffee, or calcium — they block absorption.',
    ],
    sources: [
      'British Society for Haematology',
      'NIH Office of Dietary Supplements',
      'NICE Guideline NG88 (Heavy Menstrual Bleeding)',
    ],
  },
  {
    id: 'endo',
    cat: 'Conditions',
    tag: 'Diagnosis matters',
    title: 'Endometriosis: signs that warrant a conversation',
    read: '5 min',
    summary: 'Endometriosis affects ~10% of menstruating people and takes an average of 7+ years to diagnose.',
    body: [
      'Endometriosis is when tissue similar to the uterine lining grows outside the uterus. It causes inflammation and can fuse organs together.',
      'Signs beyond "bad cramps": pain during or after sex, painful bowel movements during your period, chronic pelvic pain (not just cyclical), and infertility.',
      'The diagnostic delay is a real, documented problem. Many people are told their pain is "normal" for years. It is not.',
      'There is no blood test. Pelvic ultrasound can show some forms. Laparoscopy is the only definitive diagnosis.',
      'Treatments range from NSAIDs to hormonal therapy to excision surgery. Earlier diagnosis = better long-term outcomes.',
    ],
    sources: [
      'World Health Organization (WHO) Endometriosis Fact Sheet 2023',
      'ESHRE Guideline on Endometriosis',
      'Endometriosis Foundation of America',
    ],
  },
  {
    id: 'pcos',
    cat: 'Conditions',
    tag: 'Often missed',
    title: 'PCOS: more than irregular periods',
    read: '4 min',
    summary: 'PCOS affects up to 1 in 10 menstruating people of reproductive age. Many go years undiagnosed.',
    body: [
      'PCOS (Polycystic Ovary Syndrome) is a hormonal condition. Diagnosis uses the Rotterdam criteria — you need 2 of 3: irregular cycles, elevated androgens (often shown by acne, hirsutism, or bloodwork), and polycystic ovaries on ultrasound.',
      'It\'s associated with insulin resistance, increased risk of type 2 diabetes, and fertility challenges — all of which are manageable with early intervention.',
      'Treatment isn\'t one-size: hormonal birth control, metformin, spironolactone, GLP-1 agonists, and lifestyle interventions all have evidence.',
      'If you have unpredictable cycles (>35 days apart, or skipping months) without a clear cause like breastfeeding or recent contraceptive change, ask for a workup.',
    ],
    sources: [
      'International PCOS Guideline 2023',
      'Endocrine Society Clinical Practice Guideline',
    ],
  },
  {
    id: 'cravings',
    cat: 'Nutrition',
    tag: 'Mythbusting',
    title: 'Why your luteal cravings are biology, not weakness',
    read: '3 min',
    summary: 'You eat 159–529 kcal/day more in luteal phase. That\'s normal and measurable.',
    body: [
      'A 2023 Oxford Nutrition Reviews narrative review of energy intake studies found women consume 159–529 kcal more per day in the luteal phase compared to the follicular phase.',
      'The driver: serotonin drops in late luteal phase. Carbs increase tryptophan transport into the brain, which boosts serotonin. Your brain is asking for what it actually needs.',
      'Restricting in luteal phase often backfires into binge cycles. Honoring smaller cravings with complex carbs (oats, sweet potato, whole grains) prevents that.',
      'Dark chocolate 70%+ is a reasonable response — magnesium content + lower sugar than candy.',
    ],
    sources: [
      'Souza et al., Nutrition Reviews 2023',
      'Wurtman et al., Am J Clin Nutr',
    ],
  },
  {
    id: 'privacy',
    cat: 'Your Data',
    tag: 'Read this',
    title: 'How Luna handles your cycle data — in plain English',
    read: '3 min',
    summary: 'On-device by default. No third-party tracking. You control exports.',
    body: [
      'Your cycle data is stored locally on your phone in encrypted form. It is not sent to our servers unless you explicitly enable backup.',
      'We do not sell or share your data. We do not run third-party analytics or advertising trackers inside the app.',
      'When you ask for an AI insight, only anonymized symptom and date data is sent to our AI partner. No identifying information leaves your device.',
      'You can export everything as CSV at any time. You can also delete everything in one step from Settings → Data.',
      'We support full account deletion within 24 hours of request. We do not retain a copy.',
      'This is the way we think a health app should work — quiet, on your side, and never the product.',
    ],
    sources: [
      'Luna data handling policy',
      'Built on Apple’s on-device encryption framework',
    ],
  },
  {
    id: 'exercise',
    cat: 'Movement',
    tag: 'Mythbusting',
    title: 'Cycle-syncing workouts: what the evidence actually says',
    read: '4 min',
    summary: 'The early follicular phase shows trivially reduced performance. The rest of the cycle, you can train hard.',
    body: [
      'A 2020 systematic review and meta-analysis of 78 studies found a trivial effect of menstrual cycle phase on exercise performance overall (effect size –0.06).',
      'The largest measured effect was between early follicular and late follicular phases — and even that was small.',
      'Translation: rigid "do this on day X, never on day Y" rules outpace the science. Listen to your body, not a chart.',
      'What is well-supported: insulin sensitivity is improved in follicular phase, so carbs around training feel better. Anabolic response to protein may be slightly higher when estrogen is up.',
      'During your period, light exercise can reduce cramps. Avoid hero workouts if you\'re wiped — but don\'t feel obligated to skip movement entirely.',
    ],
    sources: [
      'McNulty et al., Sports Medicine 2020 (PMC7497427)',
      'Sims et al., Roar protocol',
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// RED FLAGS — quick reference
// ─────────────────────────────────────────────────────────────
const LUNA_RED_FLAGS = [
  { id: 'flow', q: 'Soaking a pad/tampon every hour for several hours', a: 'Could indicate menorrhagia or anemia risk. See a doctor.' },
  { id: 'long', q: 'Periods lasting more than 7 days', a: 'Worth a conversation with your provider.' },
  { id: 'pmdd', q: 'Severe mood disruption, hopelessness, or suicidal thoughts in the week before your period', a: 'This could be PMDD — a recognized clinical condition with effective treatments. Please talk to a doctor.' },
  { id: 'cramps', q: 'Cramps that stop you from working or going to school', a: 'Not normal. Consider endometriosis screening.' },
  { id: 'sex', q: 'Pain during or after sex', a: 'Worth checking — can indicate endometriosis or other pelvic conditions.' },
  { id: 'spot', q: 'Spotting between periods (after the first 3 months on a new BC method)', a: 'Get it evaluated.' },
  { id: 'absent', q: 'Missed periods for 3+ months without pregnancy', a: 'Could indicate PCOS, thyroid, stress amenorrhea — worth a workup.' },
];

Object.assign(window, { LUNA_PHASES, LUNA_SYMPTOMS, LUNA_ARTICLES, LUNA_RED_FLAGS });
