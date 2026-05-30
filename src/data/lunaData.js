// Medical content — every claim sourced from peer-reviewed research,
// ACOG, Cleveland Clinic, WHO, or equivalent bodies.
// A licensed clinician must review this before shipping to users.

export const PHASES = {
  menstrual: {
    id: 'menstrual',
    name: 'Menstrual',
    days: '1–7',
    color: '#C84E2E',
    hormones: 'Estrogen and progesterone drop sharply.',
    whatsHappening: 'Your uterine lining sheds. Prostaglandins contract the uterus — that causes cramps and the flu-like feeling.',
    bodyMood: 'Your body is doing something quiet and demanding. Energy will be low — make space for it.',
    sourceBody: 'Cleveland Clinic; Geisinger Health',
    nutrition: {
      headline: 'Iron is the priority.',
      do: [
        'Iron-rich foods: lean red meat, lentils, spinach, beans, tofu',
        'Pair iron with vitamin C (oranges, peppers, broccoli) to boost absorption',
        'Magnesium for cramps: pumpkin seeds, dark leafy greens, dark chocolate',
        'Warm, anti-inflammatory foods: ginger tea, turmeric, soups',
      ],
      avoid: ['High caffeine (worsens cramps and anxiety)', 'Excess alcohol (poor sleep, dehydration)'],
      source: 'Trinity Health Michigan; Cleveland Clinic',
    },
    exercise: {
      headline: 'Rest is productive.',
      do: ['Walking', 'Restorative yoga', 'Light stretching', 'Pilates if energy allows'],
      avoid: ['Heavy lifting if cramps are severe', 'High-intensity intervals'],
      note: 'A 2020 systematic review found early follicular performance dips only trivially. Train if you feel up to it.',
      source: 'Sims et al., Systematic Review & Meta-Analysis 2020 (PMC7497427)',
    },
    redFlag: 'Heavy flow >7 days or soaking a pad/tampon hourly — see a doctor. Could indicate menorrhagia or iron-deficiency anemia.',
  },
  follicular: {
    id: 'follicular',
    name: 'Follicular',
    days: '8–13',
    color: '#D88869',
    hormones: 'Estrogen rises steadily. FSH triggers a dominant follicle to mature.',
    whatsHappening: 'Your body preps to release an egg as the uterine lining thickens again.',
    bodyMood: 'Something gentle is rising. Estrogen lifts mood and energy a little more each day.',
    sourceBody: 'Cleveland Clinic; FeelGoodPal (citing Sims 2020)',
    nutrition: {
      headline: 'Carb tolerance is highest now.',
      do: [
        'Complex carbs: quinoa, brown rice, oats, sweet potatoes',
        'Lean proteins: chicken, fish, tofu, Greek yogurt',
        'Healthy fats: avocado, olive oil, nuts and seeds',
        'Fermented foods for gut + estrogen metabolism: kimchi, yogurt, kefir',
      ],
      avoid: ['Rigid "estrogenic food" rules — no clinical evidence'],
      source: 'Cleveland Clinic; Trinity Health Michigan',
    },
    exercise: {
      headline: 'Best window for new PRs.',
      do: ['Strength training', 'High-intensity intervals', 'Running, cycling, hiking', 'New movements — coordination is sharper'],
      avoid: [],
      note: 'Insulin sensitivity is improved; anabolic response to protein may be slightly higher.',
      source: 'Geisinger; Equator Virgin Active Nutrition Guide',
    },
    redFlag: 'Spotting between periods, severe pelvic pain, or no period 3+ months after stopping birth control — see a doctor.',
  },
  ovulation: {
    id: 'ovulation',
    name: 'Ovulation',
    days: '14–16',
    color: '#E8B765',
    hormones: 'Estrogen and testosterone peak. LH surge triggers egg release.',
    whatsHappening: 'A mature egg is released. Cervical mucus turns egg-white, and basal body temperature rises ~0.5°F after.',
    bodyMood: 'Your most outward-facing window. Notice what feels easier today — connection, words, wanting.',
    sourceBody: 'Cleveland Clinic; FeelGoodPal',
    nutrition: {
      headline: 'Oxidative stress is up — eat the rainbow.',
      do: [
        'Antioxidants: berries, dark leafy greens, beets',
        'Polyunsaturated fats: salmon, walnuts, flax, chia',
        'Cruciferous veg (broccoli, cauliflower) for estrogen metabolism',
        'Plenty of water — body temperature rises slightly',
      ],
      avoid: ['Excess processed foods during this peak'],
      source: 'Virgin Active Nutrition Guide for Menstrual Cycle',
    },
    exercise: {
      headline: 'Peak performance window.',
      do: ['Strength PRs', 'Sprint work', 'Team sports', 'Anything needing confidence + power'],
      avoid: [],
      note: 'ACL injury risk may rise slightly at ovulation from estrogen-driven ligament laxity. Warm up thoroughly.',
      source: 'Sports medicine research; Hertel et al.',
    },
    redFlag: 'Severe ovulation pain (mittelschmerz) >24h or with fever — could be ovarian cyst or PID. See a doctor.',
  },
  luteal: {
    id: 'luteal',
    name: 'Luteal',
    days: '17–28',
    color: '#9D6F8C',
    hormones: 'Progesterone rises and takes over. Estrogen has a smaller secondary peak.',
    whatsHappening: "The corpus luteum produces progesterone to prep the uterus; without pregnancy, hormones drop and the cycle restarts.",
    bodyMood: 'Things slow down. Cravings, fatigue, edges to your mood — all chemistry, not character.',
    sourceBody: 'Trinity Health; Cleveland Clinic; Geisinger',
    nutrition: {
      headline: "Cravings are biological, not willpower.",
      do: [
        'Complex carbs (oats, sweet potato, whole grain) — support serotonin',
        'Magnesium: pumpkin seeds, 70%+ dark chocolate, spinach — may reduce PMS',
        'B6-rich foods: salmon, chicken, bananas — supports mood',
        'Calcium: yogurt, fortified plant milk — RCT data shows PMS reduction',
        'Stay hydrated to combat bloating',
      ],
      avoid: ['High sugar (worsens mood crashes)', 'Excess alcohol (worsens sleep, mood)', 'Excess salt if bloating'],
      note: 'Women eat 159–529 kcal/day more in luteal. Hormonally driven, not a discipline problem.',
      source: 'Oxford Nutrition Reviews 2023; Trinity Health',
    },
    exercise: {
      headline: 'Start strong. Taper as you go.',
      do: [
        'Early luteal: moderate-to-vigorous workouts still work',
        'Mid-to-late luteal: shift to walking, yoga, tai chi, Pilates',
        'Light movement helps PMS — even when motivation drops',
      ],
      avoid: ['Punishing workouts in the final days before your period'],
      source: 'Geisinger; Kaiser Permanente',
    },
    redFlag: 'Disabling PMS — extreme mood swings, depression, panic attacks, or suicidal ideation before your period — could be PMDD. Affects ~3–8% of menstruating people. Treatable. Talk to a doctor.',
  },
}

export const SYMPTOMS = {
  cramps:  { label: 'Cramps',        emoji: '🩹', why: 'Prostaglandins cause the uterus to contract to expel its lining. Higher prostaglandins → more severe cramps.', evidence: ['Heat (heating pad) is as effective as ibuprofen for many people — RCT evidence', 'Magnesium supplementation may reduce severity', 'Light exercise can help; sitting still often makes it worse'], redFlag: 'Cramps that stop you from going to work/school, or are getting worse over time, could indicate endometriosis. Affects ~10% of menstruating people and takes 7+ years on average to diagnose.', source: 'ACOG' },
  headache:{ label: 'Headache',      emoji: '🤕', why: 'Estrogen drops at the end of luteal phase can trigger "menstrual migraines" in susceptible people.', evidence: ['Magnesium 400–600mg/day starting 3 days pre-period may prevent menstrual migraines', 'NSAIDs taken at first sign are more effective than later', 'Tracking helps identify patterns — many people don\'t realise their headaches are cyclical'], redFlag: 'New severe headache, headache with vision changes, or "worst headache of your life" = ER, not later.', source: 'American Headache Society' },
  bloat:   { label: 'Bloating',      emoji: '🫧', why: 'Progesterone slows digestion. Water retention also peaks in late luteal phase.', evidence: ['Most bloating resolves within first 2 days of period', 'Reduce salt, increase water, magnesium can help', 'Probiotic foods may support gut motility'], redFlag: "Persistent bloating that doesn't resolve with your period, or feels different — can rarely indicate ovarian issues.", source: 'Cleveland Clinic' },
  mood:    { label: 'Mood swings',   emoji: '🥺', why: 'Serotonin and dopamine drop in late luteal phase. The brain is genuinely operating in a different hormonal environment.', evidence: ['Aerobic exercise has the strongest RCT evidence for PMS mood', 'Calcium 1000–1200mg/day reduced PMS symptoms ~48% in a major RCT', 'CBT shows efficacy for PMDD when severe'], redFlag: 'If you experience suicidal thoughts, hopelessness, or panic attacks specifically in the week before your period, this may be PMDD. Please talk to a doctor.', source: 'Thys-Jacobs RCT 1998; ACOG PMDD guidance' },
  tender:  { label: 'Tender breasts',emoji: '💞', why: 'Rising progesterone in luteal phase causes breast tissue swelling.', evidence: ['Reducing caffeine may help — RCT-supported', 'Vitamin E and evening primrose oil have mixed evidence', 'Well-fitted supportive bra during luteal phase often helps'], redFlag: "A new, persistent, unilateral lump that doesn't move with your cycle = see a doctor promptly.", source: 'Cleveland Clinic' },
  fatigue: { label: 'Fatigue',       emoji: '😴', why: 'Estrogen and serotonin drops sap energy. Heavy menstrual bleeding can drive low iron, which compounds it.', evidence: ['Get ferritin checked if heavy flow + persistent fatigue', 'B12 and vitamin D status matter — both are often low in menstruating people', 'Sleep hygiene is more impactful than supplements'], redFlag: "Fatigue that doesn't lift with rest, plus pallor, hair loss, or shortness of breath → iron deficiency / anaemia bloodwork.", source: 'British Society for Haematology' },
  acne:    { label: 'Skin breakout', emoji: '🫥', why: "Testosterone's relative rise + progesterone's impact on sebum often causes late-luteal/early-menstrual breakouts.", evidence: ['Topical retinoids and salicylic acid are the most evidence-based', 'Hormonal acne pattern (jawline, chin, recurring monthly) often responds to spironolactone or hormonal BC if severe'], redFlag: 'Severe acne, hirsutism, irregular cycles together can indicate PCOS — see a doctor.', source: 'AAD (American Academy of Dermatology)' },
  crave:   { label: 'Cravings',      emoji: '🍫', why: 'Serotonin drops in luteal phase — your brain is literally seeking carbs to boost serotonin synthesis.', evidence: ['Eating regular complex-carb meals reduces craving intensity', 'Dark chocolate (70%+) is a reasonable craving response — magnesium + lower sugar than candy', 'Suppression usually backfires; honouring smaller cravings prevents binge cycles'], source: 'Oxford Nutrition Reviews 2023' },
  sleep:   { label: 'Sleep issues',  emoji: '🌙', why: 'Progesterone has a mild sedating effect — its drop late-luteal can cause insomnia. Body temperature also rises slightly in luteal phase.', evidence: ['Keep bedroom cool (~65°F)', 'Magnesium glycinate before bed has good safety profile', 'Caffeine clearance slows in luteal phase — cut your last cup earlier'], source: 'Sleep Foundation; Mong & Cusmano 2016' },
  back:    { label: 'Back pain',     emoji: '🦴', why: 'Prostaglandins refer pain to the lower back. Endometriosis can also cause cyclical lower-back pain.', evidence: ['Same heat / NSAID / movement protocol as cramps', "Specific lower-back stretches: child's pose, cat-cow"], redFlag: 'Severe back pain with painful sex or painful bowel movements during your period → ask about endometriosis screening.', source: 'ACOG' },
}

export const ARTICLES = [
  { id: 'pmdd',     cat: 'Mental Health', tag: 'Important',       read: '4 min', title: "PMDD: when it's not \"just PMS\"",                      summary: "Up to 1 in 12 menstruating people have PMDD — and it's treatable.", body: ["PMDD (Premenstrual Dysphoric Disorder) affects 3–8% of menstruating people. It's in the DSM-5 — formally recognised and well-studied.", "The difference from PMS is severity. PMS is uncomfortable; PMDD is disabling. Symptoms occur in the week before menstruation, improve within a few days of period onset, and are minimal or absent post-period.", "Symptoms include extreme mood swings, hopelessness, panic attacks, anger, suicidal ideation, severe fatigue, and difficulty concentrating.", "Treatments with strong evidence: SSRIs (often dosed only during luteal phase), CBT, certain hormonal birth control formulations, and aerobic exercise.", "If you suspect PMDD, track symptoms for at least 2 cycles before your appointment. Your provider needs the daily data to diagnose — Luna can export this."], sources: ['American College of Obstetricians and Gynecologists (ACOG) Practice Bulletin', 'International Association for Premenstrual Disorders (IAPMD)', 'Yonkers et al., Lancet 2008'] },
  { id: 'iron',     cat: 'Nutrition',     tag: 'Common',          read: '3 min', title: 'Heavy periods, low iron, and how they connect',         summary: 'If you soak pads hourly or bleed >7 days, your iron may be empty.', body: ['Heavy menstrual bleeding (menorrhagia) means losing more than 80mL per cycle, or bleeding more than 7 days. Up to 1 in 5 menstruating people meet this definition.', 'Iron deficiency develops gradually. You can be iron-deficient without being anaemic — and still feel exhausted, foggy, lose hair, or get restless legs.', 'Ask your doctor for a "ferritin" test, not just haemoglobin. Ferritin shows stored iron and drops first.', 'Heme iron (red meat, poultry, fish) absorbs at ~25%; non-heme iron (beans, spinach, tofu) at ~5–10%. Pair non-heme with vitamin C to boost absorption.', 'Avoid iron with tea, coffee, or calcium — they block absorption.'], sources: ['British Society for Haematology', 'NIH Office of Dietary Supplements', 'NICE Guideline NG88 (Heavy Menstrual Bleeding)'] },
  { id: 'endo',     cat: 'Conditions',   tag: 'Diagnosis matters',read: '5 min', title: 'Endometriosis: signs that warrant a conversation',       summary: 'Affects ~10% of menstruating people. Average diagnosis takes 7+ years.', body: ['Endometriosis is when tissue similar to the uterine lining grows outside the uterus. It causes inflammation and can fuse organs together.', 'Signs beyond "bad cramps": pain during or after sex, painful bowel movements during your period, chronic (not just cyclical) pelvic pain, and infertility.', 'The diagnostic delay is documented. Many people are told their pain is "normal" for years. It is not.', 'There is no blood test. Pelvic ultrasound shows some forms. Laparoscopy is the only definitive diagnosis.', 'Treatments range from NSAIDs to hormonal therapy to excision surgery. Earlier diagnosis means better long-term outcomes.'], sources: ['World Health Organization (WHO) Endometriosis Fact Sheet 2023', 'ESHRE Guideline on Endometriosis', 'Endometriosis Foundation of America'] },
  { id: 'pcos',     cat: 'Conditions',   tag: 'Often missed',     read: '4 min', title: 'PCOS: more than irregular periods',                      summary: 'Up to 1 in 10 of reproductive age — many go years undiagnosed.', body: ['PCOS (Polycystic Ovary Syndrome) is a hormonal condition. Diagnosis uses the Rotterdam criteria — 2 of 3: irregular cycles, elevated androgens (acne, hirsutism, or bloodwork), and polycystic ovaries on ultrasound.', "Linked to insulin resistance, higher type 2 diabetes risk, and fertility challenges — manageable with early intervention.", 'Treatment is not one-size: hormonal birth control, metformin, spironolactone, GLP-1 agonists, and lifestyle interventions all have evidence.', 'If your cycles are unpredictable (>35 days apart, or skipping months) without a clear cause like breastfeeding or a recent contraceptive change, ask for a workup.'], sources: ['International PCOS Guideline 2023', 'Endocrine Society Clinical Practice Guideline'] },
  { id: 'cravings', cat: 'Nutrition',     tag: 'Mythbusting',      read: '3 min', title: 'Why your luteal cravings are biology, not weakness',    summary: "You eat 159–529 kcal/day more in luteal. Measurable, not weakness.", body: ['A 2023 Oxford Nutrition Reviews review found women consume 159–529 kcal more per day in luteal than follicular.', 'The driver: serotonin drops in late luteal. Carbs increase tryptophan transport into the brain, boosting serotonin. Your brain is asking for what it needs.', 'Restricting in luteal often backfires into binge cycles. Honouring smaller cravings with complex carbs (oats, sweet potato, whole grains) prevents that.', 'Dark chocolate 70%+ is a reasonable response — magnesium content plus lower sugar than candy.'], sources: ['Souza et al., Nutrition Reviews 2023', 'Wurtman et al., Am J Clin Nutr'] },
  { id: 'privacy',  cat: 'Your Data',    tag: 'Read this',        read: '2 min', title: 'How Luna handles your cycle data — in plain English',  summary: 'Server-side, encrypted at rest, gated to your account. No selling, no tracking.', body: [
    'Your cycle data is stored on Luna\'s servers (run on Supabase) and encrypted at rest. Access is gated by row-level security so only your signed-in account can read or modify it.',
    'No selling, no sharing. No third-party advertising trackers inside the app. Anonymous analytics is opt-in from Settings and never sends the content of what you logged — only event categories.',
    'Signing in on a new device pulls your data down over TLS. Signing out and deleting the app removes the local copy; the server copy stays so you can sign back in later.',
    'No AI in Luna today. Future AI features will be opt-in per conversation with clear consent.',
    'Export everything as CSV any time from Settings → Export all data.',
    'Full account deletion via Settings → Delete my account — removes your account and all your cycle data from our servers.',
    'We may receive valid legal process for the data we hold. We will resist overbroad requests and notify affected users unless prohibited by law. For specific concerns — especially in jurisdictions where reproductive care is restricted — consider what to track at all. Data we never receive is data no one can compel us to share.',
  ], sources: [
    'Luna data handling policy',
    'Supabase infrastructure-level encryption at rest',
    'Postgres row-level security',
  ] },
  { id: 'exercise', cat: 'Movement',     tag: 'Mythbusting',      read: '4 min', title: 'Cycle-syncing workouts: what the evidence actually says', summary: 'Early follicular dips slightly. The rest of the cycle, train hard.', body: ['A 2020 systematic review and meta-analysis of 78 studies found a trivial effect of cycle phase on exercise performance overall (effect size –0.06).', 'The largest effect was between early and late follicular — and even that was small.', 'Translation: rigid "do this on day X, never on day Y" rules outpace the science. Listen to your body, not a chart.', "Well-supported: insulin sensitivity improves in follicular, so carbs around training feel better. Anabolic response to protein may be slightly higher when oestrogen is up.", "During your period, light exercise can reduce cramps. Skip hero workouts if you're wiped — but don't feel obligated to skip movement entirely."], sources: ['McNulty et al., Sports Medicine 2020 (PMC7497427)', 'Sims et al., Roar protocol'] },
  {
    id: 'basics', cat: 'Basics', tag: 'Start here', read: '3 min',
    title: 'The four phases of your cycle — explained simply',
    summary: "Four hormonal environments, every month. Here's what happens.",
    body: [
      "Your menstrual cycle has four phases, each driven by different hormones. Knowing them explains why you feel different week to week — and those shifts are normal.",
      "Phase 1 — Menstrual (days 1–7): Estrogen and progesterone drop; the uterine lining sheds. Energy is at its lowest. Cramps come from prostaglandins (inflammatory compounds) that help the uterus contract.",
      "Phase 2 — Follicular (days 8–13): Estrogen rises as a follicle matures. Energy lifts, mood improves, brain function sharpens. Most people feel most like themselves here.",
      "Phase 3 — Ovulation (days 14–16): An LH surge releases the mature egg. Estrogen and testosterone peak. Many feel confident, social, and energetic.",
      "Phase 4 — Luteal (days 17–28): Progesterone takes over. Without pregnancy, hormones drop in the final days and the cycle restarts. PMS shows up here as serotonin dips.",
      "Every cycle is different. 21–35 days is medically normal. Tracking your own pattern over 2–3 cycles is far more useful than any average.",
    ],
    sources: ['Cleveland Clinic', 'ACOG Menstrual Cycle Guidance'],
  },
  {
    id: 'firstperiod', cat: 'Basics', tag: 'Young people', read: '4 min',
    title: "Your first period: what's normal, what to expect",
    summary: 'Most first periods arrive between ages 9 and 16. Here is what to know.',
    body: [
      "Menarche — your first period — usually happens between ages 9 and 16, most often at 12–13. Earlier or later than your friends is usually nothing to worry about.",
      "Your first few periods may be light (spotting), irregular, or short. It can take up to 2 years for cycles to settle into a regular pattern.",
      "Flow can range from a few days of spotting to 7 days of heavier bleeding. Colour varies from bright red to dark brown — all normal.",
      "Cramps are common — prostaglandins help the uterus contract. A heat pack and ibuprofen (if you can take it) are both effective. If cramps stop you going to school, tell a parent or doctor.",
      "Period products: pads are the easiest start — no insertion needed. Tampons, cups, and discs are options once you're comfortable with your body. None affect virginity.",
      "See a doctor if: no period by age 16, bleeding more than 7 days, soaking pads hourly, or severe cramps.",
    ],
    sources: ['ACOG', 'Mayo Clinic — Menarche', 'NHS'],
  },
  {
    id: 'tracking', cat: 'Basics', tag: 'Start here', read: '2 min',
    title: 'Why tracking your cycle is worth it',
    summary: 'Your cycle is a vital sign — and often the first signal something is up.',
    body: [
      "ACOG (the leading US ob-gyn body) officially recommends the menstrual cycle as a 'fifth vital sign' — alongside pulse, temperature, blood pressure, and breathing rate. It is that informative.",
      "A sudden change — shorter, longer, heavier, more painful — can be an early signal of PCOS, thyroid issues, endometriosis, or nutritional deficiencies. Catching these earlier means better outcomes.",
      "Tracking gives you data to show your doctor. Most cycle-related conditions need symptom patterns over multiple cycles to diagnose. Three months of logged data improves your appointment.",
      "You don't have to track everything. At minimum: when your period starts and ends. Three cycles of simple tracking is remarkably useful.",
      "Luna stores everything locally on your device. Nobody sees it unless you choose to export and share.",
    ],
    sources: ['ACOG Committee Opinion — Menstrual Cycle as Vital Sign', 'BJOG'],
  },
  {
    id: 'products', cat: 'Basics', tag: 'Practical', read: '3 min',
    title: 'Period products compared: pads, tampons, cups, discs',
    summary: 'No single product works for everyone. The practical breakdown.',
    body: [
      "Pads: worn externally, stick to underwear. Best for first-time users, overnight, and lighter days. Wide range of absorbencies.",
      "Tampons: inserted into the vagina. Regular, super, super-plus. Change every 4–8 hours. TSS (toxic shock syndrome) risk is very low but real — never sleep in one.",
      "Menstrual cups: silicone, worn internally, collects rather than absorbs. Up to 12 hours. Takes a few cycles to get comfortable with insertion, but reusable for years and cost-effective.",
      "Menstrual discs: flat disc worn higher up near the cervix. Can be worn during sex. Disposable or reusable. Often good for heavy flow.",
      "Period underwear: looks like regular underwear, absorbs into fabric layers. Best for light days or as backup.",
      "None of these affect virginity. Virginity is a social concept, not a medical one.",
    ],
    sources: ['FDA Period Products Overview', 'ACOG', 'NHS'],
  },
]

// ── Weekly editorial pool ─────────────────────────────────
// 6 per phase × 4 phases = 24 distinct editorial cards.
// Selected deterministically by (week of year) % pool length per phase,
// so users see the same content all week and rotation feels weekly.
export const EDITORIALS = {
  menstrual: [
    { pre: 'Rest is productive.', em: 'Honour this phase.', body: "Energy is at its lowest because estrogen and progesterone just dropped. That's biology asking for rest, not weakness." },
    { pre: 'Iron is the priority this week.', em: 'You just lost some.', body: 'Heavy flow can deplete ferritin. Lean red meat, lentils, spinach, beans — pair with vitamin C to triple absorption.' },
    { pre: 'A heating pad works.', em: 'The data is on your side.', body: 'For many people heat is as effective as ibuprofen for cramps. RCT evidence. Use both if cramps are severe — they hit different pathways.' },
    { pre: 'Magnesium may reduce cramps.', em: 'Worth trying for three cycles.', body: 'Pumpkin seeds, dark leafy greens, 70%+ chocolate. Evidence is moderate, downside is essentially zero.' },
    { pre: 'Light movement actually helps.', em: 'Even when motivation drops.', body: 'Walking, gentle yoga, stretching. Skip the hero workouts this week — your body has other work to do.' },
    { pre: 'Track this flow.', em: 'It tells your doctor more than you think.', body: "Flow soaking pads hourly, or lasting >7 days, is worth a conversation. You're building the data right now." },
  ],
  follicular: [
    { pre: 'Estrogen is rising.', em: 'Make the most of it.', body: 'Mood, cognition, skin all tend to improve. Energy lifts. This is the week your body operates most freely.' },
    { pre: 'Best window for personal records.', em: 'Insulin sensitivity is up.', body: 'Strength, intervals, hard hikes. Your anabolic response to protein is sharper. Carbs feel different around training now.' },
    { pre: 'Try the new thing this week.', em: 'Coordination is sharper.', body: "Whatever you've been putting off — class, sport, social — this is the natural time. Confidence is biologically supported." },
    { pre: 'Sleep comes easier now.', em: 'Bank it while you have it.', body: "Body temperature drops, falling asleep is quicker. The deeper sleep here is rest you'll lean on later in the cycle." },
    { pre: 'Your skin is calmer this week.', em: 'Hormonal acne is on the back foot.', body: 'Sebum production is lower. Many people see their clearest skin in late follicular.' },
    { pre: 'Carbs around training.', em: 'Your body uses them well now.', body: 'Complex carbs — quinoa, oats, sweet potato. Insulin sensitivity makes them perform differently than they will in luteal.' },
  ],
  ovulation: [
    { pre: 'Peak energy window.', em: 'Your body is ready.', body: 'Estrogen and testosterone peak. Strength, focus, libido, verbal fluency. The 36–72 hour window is real.' },
    { pre: 'Sprint, lift, present.', em: 'Confidence is biological right now.', body: 'Many people feel their sharpest socially this week. Schedule the hard conversations, the asks, the presentations.' },
    { pre: 'Warm up like you mean it.', em: 'ACL injuries spike during ovulation.', body: "Estrogen-driven ligament laxity is well documented. Extra mobility work, dynamic warm-ups — don't skip them this week." },
    { pre: 'Cervical mucus is doing its job.', em: "It's data, not a problem.", body: 'Egg-white-like discharge marks the fertile window. Your body is signalling. Worth tracking regardless of pregnancy goals.' },
    { pre: 'Antioxidants matter this week.', em: 'Berries, greens, beets.', body: 'Oxidative stress is elevated during ovulation. Eating the rainbow this week is more than a saying — it\'s measurably useful.' },
    { pre: 'Body temperature rises slightly.', em: 'Drink more water.', body: 'A 0.5°F bump is normal after ovulation. Hydration helps everything — energy, skin, that vague "off" feeling some people get.' },
  ],
  luteal: [
    { pre: 'Your brain is asking for carbs —', em: "that's biology.", body: 'Serotonin drops in late luteal. Carbs increase tryptophan transport. Your brain is asking for what it actually needs. Complex carbs work best.' },
    { pre: "PMS isn't your imagination.", em: 'Hormones genuinely shift.', body: "Bloating, irritability, fatigue, brain fog. Serotonin and dopamine dip. The science is on your side — it's not a character flaw." },
    { pre: 'Magnesium reduced PMS', em: 'in RCT data.', body: '400mg/day. Three cycles is a reasonable test. Pumpkin seeds, dark chocolate, leafy greens. Bedtime is the best time.' },
    { pre: 'Light movement helps PMS mood.', em: 'Even when motivation drops.', body: "Walking and yoga have real RCT evidence here. Five minutes counts. Don't aim for hero workouts in the final luteal days." },
    { pre: 'Calcium reduced PMS', em: '~48% in one trial.', body: 'Yogurt, fortified milk, leafy greens. Daily, not just during luteal. Thys-Jacobs 1998 — the foundational study.' },
    { pre: 'If it feels disabling,', em: 'it might be PMDD.', body: 'Affecting ~3–8% of menstruating people. Treatable with several approaches. Track two cycles, then talk to a doctor. Luna can export the data.' },
  ],
}

export function getWeeklyEditorial(phaseId, date = new Date()) {
  const list = EDITORIALS[phaseId]
  if (!list) return null
  const start = new Date(date.getFullYear(), 0, 1)
  const week = Math.floor((date - start) / (1000 * 60 * 60 * 24 * 7))
  return list[((week % list.length) + list.length) % list.length]
}

export const RED_FLAGS = [
  { id: 'flow',   q: 'Soaking a pad/tampon every hour for several hours',                                         a: 'Could indicate menorrhagia or anaemia risk. See a doctor.' },
  { id: 'long',   q: 'Periods lasting more than 7 days',                                                          a: 'Worth a conversation with your provider.' },
  { id: 'pmdd',   q: 'Severe mood swings or suicidal thoughts in the week before your period',                    a: 'Could be PMDD — recognised and treatable. Talk to a doctor.' },
  { id: 'cramps', q: 'Cramps that stop you from working or going to school',                                       a: 'Not normal. Consider endometriosis screening.' },
  { id: 'sex',    q: 'Pain during or after sex',                                                                   a: 'Worth checking — can indicate endometriosis or other pelvic conditions.' },
  { id: 'spot',   q: 'Spotting between periods (after 3 months on a new BC method)',                              a: 'Get it evaluated.' },
  { id: 'absent', q: 'Missed periods for 3+ months without pregnancy',                                            a: 'Could indicate PCOS, thyroid, or stress amenorrhoea — worth a workup.' },
]

export const CHECKUPS = [
  {
    id: 'pap', category: 'Reproductive Health',
    label: 'Pap smear (cervical screening)',
    frequency: 'Every 3 years from age 21',
    why: 'Screens for cervical cancer and abnormal cells. Combined with HPV test every 5 years after age 30.',
    source: 'ACOG',
  },
  {
    id: 'sti', category: 'Reproductive Health',
    label: 'STI screening',
    frequency: 'Annually if sexually active',
    why: 'Chlamydia and gonorrhoea have no symptoms in most people. HIV and syphilis testing also recommended annually.',
    source: 'CDC',
  },
  {
    id: 'pelvic', category: 'Reproductive Health',
    label: 'Pelvic exam',
    frequency: 'Discuss frequency with your provider',
    why: 'Checks the uterus, ovaries, and vagina for anything unusual.',
    source: 'ACOG',
  },
  {
    id: 'breast_self', category: 'Breast Health',
    label: 'Breast self-exam',
    frequency: 'Monthly — best done 1 week after period starts',
    why: 'Know your normal so you can notice changes. Most lumps are benign, but any new change should be checked.',
    source: 'ACOG',
  },
  {
    id: 'mammo', category: 'Breast Health',
    label: 'Mammogram',
    frequency: 'Annually from age 40',
    why: 'Breast cancer screening. USPSTF 2024 guidelines lowered the recommended start age to 40.',
    source: 'USPSTF 2024',
  },
  {
    id: 'bp', category: 'General Health',
    label: 'Blood pressure check',
    frequency: 'Every year',
    why: 'High blood pressure has no symptoms — it raises your risk of stroke, heart disease, and kidney damage.',
    source: 'AHA',
  },
  {
    id: 'thyroid', category: 'Hormones',
    label: 'Thyroid (TSH) test',
    frequency: 'Ask your doctor; typically every 5 years',
    why: 'Thyroid disorders are 5–8× more common in women. Symptoms overlap with PMS and are often missed.',
    source: 'American Thyroid Association',
  },
  {
    id: 'iron', category: 'Nutrition',
    label: 'Iron & ferritin blood test',
    frequency: 'Annually if you have heavy periods',
    why: 'You can be iron-deficient without being anaemic — and feel exhausted, foggy, and lose hair.',
    source: 'British Society for Haematology',
  },
  {
    id: 'vitd', category: 'Nutrition',
    label: 'Vitamin D level',
    frequency: 'Every 1–2 years',
    why: 'Deficiency is widespread. Linked to mood, bone health, immune function, and menstrual regularity.',
    source: 'Endocrine Society',
  },
  {
    id: 'dental', category: 'General Health',
    label: 'Dental cleaning',
    frequency: 'Every 6 months',
    why: 'Hormonal changes make gums more susceptible to bacteria. Gum disease is linked to systemic inflammation.',
    source: 'ADA',
  },
]

// ── Phase reflection prompts ───────────────────────────────────
// One quiet, phase-appropriate question Luna sits with on Home.
// Two per phase so the same question doesn't appear every visit;
// pick by day-of-week to keep it predictable but not stale.
export const REFLECTION_PROMPTS = {
  menstrual: [
    'What can you let yourself put down this week?',
    'How does your body want to be cared for today?',
  ],
  follicular: [
    'What feels newly possible this week?',
    'What\'s one small thing you\'d like to start?',
  ],
  ovulation: [
    'Who do you want to be close to today?',
    'What\'s easier than it usually is, right now?',
  ],
  luteal: [
    'What are you longing for this week?',
    'Where do you need a little more softness?',
  ],
}

// Pick a stable-per-day reflection so the same question doesn't
// shuffle on every render but does change day to day.
export function getReflectionPrompt(phaseId) {
  const list = REFLECTION_PROMPTS[phaseId] || REFLECTION_PROMPTS.follicular
  const day = Math.floor(Date.now() / 86400000)
  return list[day % list.length]
}

// ── Symptom × phase insights ───────────────────────────────────
// Tapping a symptom in Log surfaces this — a tip + optional
// article link, phase-tuned. Same pattern as MOOD_INSIGHTS.
export const SYMPTOM_INSIGHTS = {
  cramps: {
    menstrual:  { text: 'Cramps come from prostaglandins. Heat works as well as ibuprofen for many people. Magnesium can help too.', read: null },
    follicular: { text: 'Cramps in follicular are unusual — sometimes mid-cycle pain (mittelschmerz) signals ovulation. If they\'re severe or growing, worth investigating.', read: 'endo' },
    ovulation:  { text: 'A brief one-sided cramp at ovulation is normal — mittelschmerz, "middle pain." If it\'s severe or lasts more than a day, see a doctor.', read: null },
    luteal:     { text: 'Cramps building before your period are PMS. If they\'re disabling or getting worse cycle to cycle, that can be endometriosis.', read: 'endo' },
  },
  headache: {
    menstrual:  { text: 'Estrogen drops trigger menstrual migraines. Hydration, magnesium, and steady sleep help. Track to spot the pattern.', read: null },
    follicular: { text: 'Headaches in follicular are often dehydration or stress, not hormonal. Worth ruling those out first.', read: null },
    ovulation:  { text: 'A short-lived headache at ovulation can come from the estrogen peak. Notice if it repeats.', read: null },
    luteal:     { text: 'Late-luteal headaches often respond to magnesium and stable sleep. Persistent ones can be hormonal — track them.', read: null },
  },
  bloating: {
    menstrual:  { text: 'Bloating during your period is fluid retention from hormone shifts. Less salt, more water, gentle movement.', read: null },
    follicular: { text: 'Persistent bloating outside your premenstrual window can point to gut health or food sensitivities. Worth tracking.', read: null },
    ovulation:  { text: 'Mid-cycle bloating sometimes accompanies ovulation. Brief and mild is normal.', read: null },
    luteal:     { text: 'Progesterone slows digestion — late-luteal bloating is biology, not what you ate. Magnesium and water help.', read: 'cravings' },
  },
  acne: {
    menstrual:  { text: 'Menstrual acne is hormonal — usually along the jaw. It\'s not about your skincare. Be gentle with yourself.', read: null },
    follicular: { text: 'Skin tends to be clearest in late follicular as estrogen rises. Lean in.', read: null },
    ovulation:  { text: 'A small mid-cycle breakout can come from the testosterone bump at ovulation.', read: null },
    luteal:     { text: 'Late-luteal acne is hormonal — progesterone stimulates oil glands. Spot treatments help; punishing your skin doesn\'t.', read: null },
  },
  fatigue: {
    menstrual:  { text: 'Tiredness during your period is normal. Iron, warmth, slower mornings. If it\'s severe or with heavy flow — worth a ferritin test.', read: 'iron' },
    follicular: { text: 'Tiredness in follicular is worth pausing on — sleep, stress, or low iron. Track if it persists.', read: 'iron' },
    ovulation:  { text: 'Some feel a mid-cycle energy dip. Hydration and movement help more than caffeine.', read: null },
    luteal:     { text: 'Progesterone is sedating. Luteal fatigue is biology, not laziness — protect your sleep and ease your workouts.', read: null },
  },
  backache: {
    menstrual:  { text: 'Cramping radiates to the lower back — same prostaglandins, same heat-and-magnesium response.', read: null },
    follicular: { text: 'Backache without obvious cause? Could be posture, sleep, or — rarely — endometriosis-related.', read: 'endo' },
    ovulation:  { text: 'Some feel one-sided lower back pain at ovulation — mittelschmerz again. Brief is normal.', read: null },
    luteal:     { text: 'Late-luteal lower back pain often pairs with cramps. Heat and gentle movement help.', read: null },
  },
  insomnia: {
    menstrual:  { text: 'Sleep can fragment during your period — falling estrogen affects deep sleep. Magnesium glycinate and cool rooms help.', read: null },
    follicular: { text: 'Insomnia in follicular is worth investigating beyond cycle — sleep hygiene, screen time, stress.', read: null },
    ovulation:  { text: 'Mid-cycle insomnia can come from elevated estrogen/testosterone. Magnesium and a cool room.', read: null },
    luteal:     { text: 'Progesterone usually helps sleep, but late-luteal hormone drops can wake you. Steady bedtime + magnesium help.', read: null },
  },
  nausea: {
    menstrual:  { text: 'Prostaglandins can cause nausea during your period — ginger tea, small frequent meals, gentle stretching help.', read: null },
    follicular: { text: 'Nausea in follicular without obvious cause is worth tracking — and ruling out pregnancy if relevant.', read: null },
    ovulation:  { text: 'Some feel briefly nauseated at ovulation from the LH surge. Short and mild is normal.', read: null },
    luteal:     { text: 'Late-luteal nausea is sometimes PMS, sometimes early pregnancy if conception happened this cycle. Track it.', read: null },
  },
}

// ── Mood × phase insights ──────────────────────────────────────
// When a user taps a mood in the Home check-in, surface a tiny
// contextual note + optional link to a deeper article. The pairing
// is what makes this distinctive — "Tired in luteal" is biology;
// "Tired in follicular" is worth investigating. Doula tone, no
// optimisation talk. `read` is the article id to deep-link to,
// or null when there isn't a great match.
export const MOOD_INSIGHTS = {
  menstrual: {
    Calm:   { text: "Calm during your period — your body is doing quiet, demanding work below the surface.", read: null },
    Bright: { text: "Bright through bleeding is unusual and worth noticing — often a sign your iron stores are solid.", read: 'iron' },
    Tired:  { text: "Tiredness now is expected. Iron, warmth, and slower mornings help — not laziness.", read: 'iron' },
    Sore:   { text: "Cramps come from prostaglandins. Heat works as well as ibuprofen for many people; magnesium can help too.", read: null },
    Low:    { text: "Serotonin dips with your hormones. Rest is the work this week — and complex carbs nudge serotonin back.", read: 'cravings' },
  },
  follicular: {
    Calm:   { text: "Calm with rising energy. A steady week to plan from, gently.", read: null },
    Bright: { text: "Estrogen is climbing — many feel sharper, lighter, more open this week.", read: 'basics' },
    Tired:  { text: "Tired in follicular is worth pausing on — could be sleep, stress, or low iron. Worth a check.", read: 'iron' },
    Sore:   { text: "Soreness here often points to sleep or tension, not the cycle itself.", read: null },
    Low:    { text: "Feeling low in follicular is worth tracking. If it persists across cycles, talk to a provider.", read: null },
  },
  ovulation: {
    Calm:   { text: "Steady through your peak — that's quiet strength, not flatness.", read: null },
    Bright: { text: "Estrogen and testosterone peak right around now. Many feel their most outward-facing this week.", read: 'basics' },
    Tired:  { text: "Some feel a mid-cycle dip. Hydration and a little extra rest go further than caffeine.", read: null },
    Sore:   { text: "Mittelschmerz — some feel a brief one-sided pain at ovulation. Normal if short and one-sided.", read: null },
    Low:    { text: "Low at ovulation is unusual — sometimes a hormonal fluctuation. Log it; patterns matter.", read: null },
  },
  luteal: {
    Calm:   { text: "Calm in luteal is precious. Protect it where you can — and don't second-guess it.", read: null },
    Bright: { text: "Bright in luteal is worth noting — log it. Your body is telling you what works for it.", read: null },
    Tired:  { text: "Progesterone is sedating. Luteal tiredness is biology, not motivation.", read: 'cravings' },
    Sore:   { text: "Tender breasts and aches build through luteal. Magnesium and less caffeine often soften them.", read: 'cravings' },
    Low:    { text: "Late-luteal lows are common. If they're disabling — with hopelessness, panic, or thoughts of harm — PMDD is real and treatable.", read: 'pmdd' },
  },
}
