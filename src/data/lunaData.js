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
  uti:     { label: 'UTI symptoms',   emoji: '💧', why: 'Bacteria — usually E. coli — in the urethra cause burning, urgency, and frequency. Up to 60% of women get one in their lifetime.', evidence: ['Hydrate aggressively at first sign', 'D-mannose has RCT support for prevention', 'Cranberry concentrate (capsules) has better evidence than juice', 'Pee after sex to reduce risk'], redFlag: 'Fever, back/flank pain, blood in urine, nausea, chills → kidney infection. Same-day medical care.', source: 'American Urological Association' },
  yeast:   { label: 'Yeast symptoms', emoji: '🌾', why: 'Candida overgrowth. Thick white discharge, intense itching, burning. Often triggered by antibiotics, hormone shifts, sugar+stress combos.', evidence: ['Over-the-counter fluconazole or miconazole', 'Probiotics may help in recurrence', 'Cotton underwear + skip tight synthetic clothing'], redFlag: '4+ episodes a year warrants a workup — recurrent yeast can signal diabetes, immune issues, or non-albicans candida species.', source: 'CDC — Vaginitis' },
  bv:      { label: 'BV symptoms',    emoji: '🌊', why: 'Overgrowth of normal vaginal bacteria. Thin grey/white discharge with fishy odour, especially after sex. Not an STI.', evidence: ['Needs antibiotics (metronidazole or clindamycin) — yeast treatments will not work', 'Avoid douching (makes it worse)', 'Boric acid suppositories help recurrent cases'], redFlag: '3+ episodes in 6 months → recurrent BV needs different treatment strategy. Talk to a clinician.', source: 'ACOG Practice Bulletin 215' },
  vulvarPain: { label: 'Vulvar pain', emoji: '🌸', why: 'Pain or burning of the vulva — at the entrance, during sex, or constant. Can be vulvodynia, vestibulodynia, or related to pelvic floor tension, infection, or hormonal change.', evidence: ['Pelvic floor PT is first-line for muscle-driven pain', 'Topical lidocaine for vestibulodynia', 'Vaginal estrogen for perimenopause/menopause-related thinning'], redFlag: 'New, persistent vulvar pain — especially if it disrupts daily life or sex — deserves a sex-positive gynaecologist or pelvic pain specialist.', source: 'International Pelvic Pain Society' },
  // ── PCOS-relevant symptoms ───────────────────────────────────
  // Added for PCOS Deep Mode. Each maps to a Rotterdam axis —
  // hirsutism + scalpThinning are androgen-excess signals;
  // acanthosis + sugarCraving + energyCrash point at insulin
  // resistance. The PCOS dashboard surfaces them specifically;
  // they also feed the general detectSymptomPatterns engine so
  // patterns show in Insights for all users.
  hirsutism:      { label: 'Hair growth',         emoji: '🌿', why: 'Androgen excess (elevated testosterone or DHEA-S) can drive coarse hair growth in androgen-sensitive areas — chin, upper lip, chest, abdomen, lower back. A core PCOS sign.', evidence: ['Spironolactone (anti-androgen) reduces growth in most people, takes 3–6 months', 'Topical eflornithine (Vaniqa) slows facial hair growth', 'Inositol can lower androgens over months', 'Laser/IPL works on darker hair against lighter skin'], redFlag: 'Sudden onset + voice deepening + clitoral enlargement → ask about non-PCOS androgen sources (adrenal, ovarian tumor — rare but warrants workup).', source: 'International PCOS Guideline 2023; AAD' },
  scalpThinning:  { label: 'Scalp thinning',      emoji: '🪞', why: 'Androgen excess can cause female-pattern hair loss — diffuse thinning at the crown / part line. Often misread as just stress or styling.', evidence: ['Topical minoxidil 5% (Rogaine) has the best evidence for female-pattern hair loss', 'Treating the underlying androgens (spironolactone, inositol) often slows progression', 'Low iron + low thyroid also drive shedding — get bloodwork to rule out'], redFlag: 'Patchy round bald spots → alopecia areata (autoimmune, different treatment).', source: 'AAD; International PCOS Guideline 2023' },
  acanthosis:     { label: 'Skin darkening',      emoji: '🌒', why: 'Velvety dark patches at the neck, armpits, or groin — acanthosis nigricans. Almost always a sign of insulin resistance. Common in PCOS.', evidence: ['Treating insulin resistance (metformin, inositol, GLP-1, lifestyle) often fades the patches over months', 'Topical retinoids may help cosmetically while you treat the cause'], redFlag: 'Sudden, rapidly spreading acanthosis in an adult → rule out non-insulin causes. Talk to a doctor.', source: 'AAD; Endocrine Society' },
  sugarCraving:   { label: 'Sugar cravings',      emoji: '🍯', why: 'Intense, hard-to-resist cravings for sugar or refined carbs — often a sign of insulin spikes and crashes driving the brain to chase quick fuel. Especially common in PCOS.', evidence: ['Protein and fiber at every meal blunt the spike-crash pattern', 'Walking after meals lowers post-meal glucose by ~20-30%', 'Inositol and metformin both reduce craving intensity over weeks'], source: 'JCEM; Diabetes Care' },
  energyCrash:    { label: 'Energy crash',        emoji: '🌫️', why: 'Sudden energy drop 1–2 hours after eating — usually a reactive blood-sugar drop following a glucose spike. A common PCOS / insulin-resistance pattern.', evidence: ['Pair carbs with protein + fat to slow the spike', 'Avoid eating carbs alone, especially in the morning', 'Continuous glucose monitors (CGMs) can show your personal pattern if curious'], source: 'JCEM; CGM in PCOS reviews' },
}

export const ARTICLES = [
  { id: 'pmdd',     cat: 'Mental Health', tag: 'Important',       read: '4 min', title: "PMDD: when it's not \"just PMS\"",                      summary: "Up to 1 in 12 menstruating people have PMDD — and it's treatable.", body: ["PMDD (Premenstrual Dysphoric Disorder) affects 3–8% of menstruating people. It's in the DSM-5 — formally recognised and well-studied.", "The difference from PMS is severity. PMS is uncomfortable; PMDD is disabling. Symptoms occur in the week before menstruation, improve within a few days of period onset, and are minimal or absent post-period.", "Symptoms include extreme mood swings, hopelessness, panic attacks, anger, suicidal ideation, severe fatigue, and difficulty concentrating.", "Treatments with strong evidence: SSRIs (often dosed only during luteal phase), CBT, certain hormonal birth control formulations, and aerobic exercise.", "If you suspect PMDD, track symptoms for at least 2 cycles before your appointment. Your provider needs the daily data to diagnose — Luna can export this."], sources: ['American College of Obstetricians and Gynecologists (ACOG) Practice Bulletin', 'International Association for Premenstrual Disorders (IAPMD)', 'Yonkers et al., Lancet 2008'] },
  { id: 'iron',     cat: 'Nutrition',     tag: 'Common',          read: '3 min', title: 'Heavy periods, low iron, and how they connect',         summary: 'If you soak pads hourly or bleed >7 days, your iron may be empty.', body: ['Heavy menstrual bleeding (menorrhagia) means losing more than 80mL per cycle, or bleeding more than 7 days. Up to 1 in 5 menstruating people meet this definition.', 'Iron deficiency develops gradually. You can be iron-deficient without being anaemic — and still feel exhausted, foggy, lose hair, or get restless legs.', 'Ask your doctor for a "ferritin" test, not just haemoglobin. Ferritin shows stored iron and drops first.', 'Heme iron (red meat, poultry, fish) absorbs at ~25%; non-heme iron (beans, spinach, tofu) at ~5–10%. Pair non-heme with vitamin C to boost absorption.', 'Avoid iron with tea, coffee, or calcium — they block absorption.'], sources: ['British Society for Haematology', 'NIH Office of Dietary Supplements', 'NICE Guideline NG88 (Heavy Menstrual Bleeding)'] },
  { id: 'endo',     cat: 'Conditions',   tag: 'Diagnosis matters',read: '5 min', title: 'Endometriosis: signs that warrant a conversation',       summary: 'Affects ~10% of menstruating people. Average diagnosis takes 7+ years.', body: ['Endometriosis is when tissue similar to the uterine lining grows outside the uterus. It causes inflammation and can fuse organs together.', 'Signs beyond "bad cramps": pain during or after sex, painful bowel movements during your period, chronic (not just cyclical) pelvic pain, and infertility.', 'The diagnostic delay is documented. Many people are told their pain is "normal" for years. It is not.', 'There is no blood test. Pelvic ultrasound shows some forms. Laparoscopy is the only definitive diagnosis.', 'Treatments range from NSAIDs to hormonal therapy to excision surgery. Earlier diagnosis means better long-term outcomes.'], sources: ['World Health Organization (WHO) Endometriosis Fact Sheet 2023', 'ESHRE Guideline on Endometriosis', 'Endometriosis Foundation of America'] },
  { id: 'pcos',     cat: 'Conditions',   tag: 'Often missed',     read: '4 min', title: 'PCOS: more than irregular periods',                      summary: 'Up to 1 in 10 of reproductive age — many go years undiagnosed.', body: ['PCOS (Polycystic Ovary Syndrome) is a hormonal condition. Diagnosis uses the Rotterdam criteria — 2 of 3: irregular cycles, elevated androgens (acne, hirsutism, or bloodwork), and polycystic ovaries on ultrasound.', "Linked to insulin resistance, higher type 2 diabetes risk, and fertility challenges — manageable with early intervention.", 'Treatment is not one-size: hormonal birth control, metformin, spironolactone, GLP-1 agonists, and lifestyle interventions all have evidence.', 'If your cycles are unpredictable (>35 days apart, or skipping months) without a clear cause like breastfeeding or a recent contraceptive change, ask for a workup.'], sources: ['International PCOS Guideline 2023', 'Endocrine Society Clinical Practice Guideline'] },
  { id: 'cravings', cat: 'Nutrition',     tag: 'Mythbusting',      read: '3 min', title: 'Why your luteal cravings are biology, not weakness',    summary: "You eat 159–529 kcal/day more in luteal. Measurable, not weakness.", body: ['A 2023 Oxford Nutrition Reviews review found women consume 159–529 kcal more per day in luteal than follicular.', 'The driver: serotonin drops in late luteal. Carbs increase tryptophan transport into the brain, boosting serotonin. Your brain is asking for what it needs.', 'Restricting in luteal often backfires into binge cycles. Honouring smaller cravings with complex carbs (oats, sweet potato, whole grains) prevents that.', 'Dark chocolate 70%+ is a reasonable response — magnesium content plus lower sugar than candy.'], sources: ['Souza et al., Nutrition Reviews 2023', 'Wurtman et al., Am J Clin Nutr'] },
  // ── Body literacy — short anatomy explainers ────────────────
  { id: 'anatomy-cervix', cat: 'Know your body', tag: 'Quick read', read: '2 min',
    title: 'Where is your cervix, exactly?',
    summary: 'A small donut at the top of the vagina. Its texture and position change across your cycle.',
    body: [
      "Your cervix is the lower neck of your uterus — a small, firm ring of tissue, about the size of a walnut, sitting at the top of the vagina. You can usually feel it with a clean finger.",
      "It shifts across your cycle: lower and firmer after your period (like the tip of your nose), higher and softer around ovulation (like your lips, slightly open). After ovulation it firms up again.",
      "It's also what dilates dramatically in labor, and what your provider sees during a Pap smear. Knowing it's there — and that it's normal for it to change — is part of basic body literacy that's somehow almost never taught.",
      "If you're using fertility awareness, tracking cervical position alongside mucus and BBT triangulates ovulation more precisely than any one signal alone.",
    ],
    sources: ['Cleveland Clinic anatomy', 'Taking Charge of Your Fertility, Toni Weschler'],
  },
  { id: 'anatomy-corpus-luteum', cat: 'Know your body', tag: 'Quick read', read: '2 min',
    title: 'What is the corpus luteum, and why does it matter?',
    summary: 'A short-lived hormone factory that runs your luteal phase. When it dissolves, your period starts.',
    body: [
      "When you ovulate, the follicle that released the egg doesn't just disappear. It transforms into the corpus luteum — Latin for 'yellow body' — a temporary hormone-producing structure that sits on your ovary for about 12-14 days.",
      "Its job is to pump out progesterone, which thickens your uterine lining in case the egg gets fertilized. Progesterone is also why luteal often feels different: more sedated, heavier, hungrier, more sensitive.",
      "If no pregnancy happens, the corpus luteum dissolves on a fairly fixed timeline. Estrogen and progesterone drop sharply — and that drop is what triggers your period.",
      "This is why the luteal phase length is more predictable than the follicular phase: ovulation timing can vary, but once it happens, the corpus luteum runs its 12-14 day clock pretty reliably. That's the math your period prediction is built on.",
    ],
    sources: ['Cleveland Clinic — Menstrual Cycle', 'Endocrine Society — Female Reproductive Hormones'],
  },
  { id: 'anatomy-vulva', cat: 'Know your body', tag: 'Pleasure literacy', read: '3 min',
    title: 'Your vulva, named — and why naming matters',
    summary: 'Most adult women were never taught the parts of their own genitals. Here is the map.',
    body: [
      "Vulva is the umbrella term for all the external parts: the mons (the soft pad over your pubic bone), the labia majora and minora (the outer and inner lips), the clitoris (the small ridge near the top), the urethral opening, and the vaginal opening. The vagina is internal — the canal that connects the vulva to the cervix.",
      "The clitoris extends well beyond the visible glans (the small bead at the front). Internal clitoral structures wrap around the vaginal canal for several inches on each side — which is why what feels good is often a combination of external and internal stimulation, not either alone.",
      "Vulvas vary as widely as faces. Labia length and asymmetry, color variation, hair pattern — almost all of it is normal. Photographs in porn and even medical texts under-represent that variation, which leaves many women thinking theirs is 'wrong' when it isn't.",
      "Knowing the parts is body literacy in the most basic sense. It makes it possible to describe what feels good, ask for what you want, notice when something has changed, and talk to a clinician about pain or pleasure without flinching.",
    ],
    sources: ['Cleveland Clinic — Vulva anatomy', "Come As You Are, Emily Nagoski PhD"],
  },
  { id: 'painful-sex', cat: 'Sexual health', tag: 'Worth a conversation', read: '4 min',
    title: 'When sex hurts — what it might be saying',
    summary: 'Dyspareunia is the medical word for painful sex. It is common, it is not your fault, and it is treatable.',
    body: [
      "Painful sex (dyspareunia) affects up to 1 in 5 women at some point. It is not a personal failing, a sign of being 'broken,' or something to push through.",
      "Pain at the entrance often points to: insufficient lubrication, a yeast or BV infection, vulvodynia (vulvar pain syndrome), or pelvic floor muscles that are holding tension you didn't ask them to.",
      "Deeper pain during penetration can signal endometriosis, fibroids, ovarian cysts, or a tilted uterus. It can also be cyclical — worse around ovulation or right before your period — and that pattern is itself a clinical clue.",
      "Things that genuinely help: longer arousal time (the body needs ~20+ minutes to fully prepare even when you feel ready mentally), generous water- or silicone-based lubricant, pelvic floor physical therapy if muscles are part of it, and treating any underlying infection or condition.",
      "Things that don't help and aren't your job: pretending it doesn't hurt, blaming yourself, or accepting it as the new normal. A pelvic floor PT or a sex-positive gynecologist is the right room for this conversation. Bring your notes — Luna's cheatsheet exists for this.",
    ],
    sources: ['ACOG — Female Sexual Pain', 'International Pelvic Pain Society', 'Come As You Are, Emily Nagoski PhD'],
  },
  { id: 'libido', cat: 'Sexual health', tag: 'Cycle x desire', read: '3 min',
    title: 'Why your desire ebbs and flows — and what is normal',
    summary: 'Desire shifts across your cycle, your life stage, and your stress. Almost none of it is broken.',
    body: [
      "Spontaneous desire (the kind that arrives unprompted) is more common in earlier life and tends to fade with long-term partnerships, postpartum, breastfeeding, perimenopause, and certain medications.",
      "Responsive desire (the kind that shows up after you start kissing, touching, or thinking sexual thoughts) is the dominant pattern for most women across the lifespan. It is not lesser, broken, or a sign that something is wrong — just different.",
      "Across the cycle: testosterone and estrogen peak around ovulation, which boosts desire for many. Progesterone in luteal often dampens it. Period-week desire varies — some feel an unexpected lift, others want stillness.",
      "Common dampeners: hormonal birth control (especially combined pills), SSRIs and SNRIs, breastfeeding (prolactin), perimenopause (falling estrogen and testosterone), chronic stress, untreated pain, and relationship dynamics that don't make space for arousal.",
      "What helps: longer warm-up, scheduling intimacy when you have energy (the spontaneity romanticisation hurts women), removing pressure from any single encounter, treating pain if it's there, considering a med review if symptoms started after a new prescription.",
    ],
    sources: ['Come As You Are, Emily Nagoski PhD', 'ACOG — Female Sexual Dysfunction', 'Basson — Responsive Desire model'],
  },
  { id: 'uti', cat: 'Vaginal health', tag: 'Common', read: '3 min',
    title: 'UTIs: what to do tonight, when to call a doctor',
    summary: 'Up to 60% of women will get one in their lifetime. Knowing the playbook helps.',
    body: [
      "A urinary tract infection is bacteria — usually E. coli — getting into the urethra. Symptoms: burning when you pee, urgency, frequency (running to the bathroom for a few drops), cloudy or strong-smelling urine, lower-belly pressure.",
      "Tonight: drink water aggressively (dilutes the bacteria, helps flush). D-mannose powder has some RCT support for preventing bacteria from sticking to the bladder wall. Cranberry juice has weaker evidence — the active compound is in higher concentrations in supplements than juice.",
      "Call your doctor or get a same-day video visit if: symptoms last past 24 hours, you see blood in your urine, you have fever, back/flank pain, nausea, or chills — those can mean the infection has reached your kidneys and needs antibiotics urgently.",
      "Recurrent UTIs (3+ in a year or 2+ in 6 months) are a real medical pattern, not bad luck. There are preventive strategies: post-sex voiding, vaginal estrogen for perimenopause/menopause-related changes, low-dose long-term antibiotics, immunoprophylaxis in some countries.",
      "Things that increase risk: new sexual partner, certain contraceptives (diaphragms, spermicide), holding urine, dehydration, and the urethra-to-anus distance that simply makes women more susceptible.",
    ],
    sources: ['American Urological Association', 'Cochrane Reviews — D-mannose 2022', 'NICE Guideline CG88'],
  },
  { id: 'yeast-bv', cat: 'Vaginal health', tag: 'Tell them apart', read: '3 min',
    title: 'Yeast vs BV: how to tell, and what each needs',
    summary: 'Discharge changes are common — and the two most frequent causes need very different treatments.',
    body: [
      "Yeast infections (candidiasis) typically cause: thick, white, cottage-cheese-like discharge with little smell, intense itching, redness, and burning during sex or peeing. Often triggered by antibiotics, hormonal shifts, sugar/stress combinations, tight synthetic clothing, or hot/sweaty environments.",
      "Bacterial vaginosis (BV) typically causes: thin, grey or white discharge with a strong fishy odour (often worse after sex), itching that's usually less severe than yeast, and no redness. It is an overgrowth of normal vaginal bacteria, not a sexually transmitted infection — but new partners, douching, and unprotected sex can trigger it.",
      "Yeast is treated with antifungal creams or pills (over-the-counter fluconazole, miconazole) — usually resolves in days. BV needs antibiotics (metronidazole or clindamycin, oral or vaginal) — the wrong treatment can make things worse.",
      "If you've never had one before, see a clinician — symptoms overlap with STIs and trichomoniasis. Recurrent yeast (4+ a year) or recurrent BV (3+) deserves investigation; long-term suppressive treatment or boric acid suppositories are options.",
      "What does NOT help: douching (strips the protective lactobacilli, makes BV worse), scented soaps, washing inside the vagina (it cleans itself), or assuming any unusual discharge is just 'normal hormones.'",
    ],
    sources: ['CDC — Vaginitis', 'ACOG Practice Bulletin 215', 'Sherrard et al., Int J STD AIDS 2018'],
  },
  { id: 'pregnancy-loss', cat: 'Pregnancy loss', tag: 'You are not alone', read: '5 min',
    title: "After a pregnancy loss — what's normal, what helps, what to ask",
    summary: '1 in 4 pregnancies end in loss. The science of what happens is clear; the grief deserves its own room.',
    body: [
      "Most early miscarriages — about 50% — are caused by chromosomal abnormalities that would have prevented the pregnancy from developing. This is not because of anything you did, ate, lifted, felt, or thought. It is biology, and that is hard, and it is also the truth.",
      "Physically: bleeding after loss can last 1–2 weeks and feel heavier than a normal period. Cramping can be intense for several days. Your period usually returns 4–6 weeks later. HCG levels drop gradually, which is why some pregnancy symptoms linger for a week or two.",
      "Emotionally: grief after pregnancy loss is real grief. It can come in waves, around anniversaries, around due dates, around news of other pregnancies. There is no timeline you owe anyone. People who say 'at least it was early' or 'you can try again' usually mean well and do not understand. You are allowed to be selective about who you share this with.",
      "When to call your provider: bleeding through a pad an hour for more than two hours, fever over 100.4°F, severe pain not helped by NSAIDs, foul-smelling discharge, dizziness or faintness. Sepsis from retained tissue is rare but real.",
      "When to try again: medically, most providers say wait for one normal period for cycle dating. Emotionally, that is entirely your call. Recurrent loss (2 or 3+ consecutive) warrants a workup for underlying causes — thyroid, blood clotting disorders, uterine anatomy, chromosomal — most of which are treatable.",
      "Resources: Postpartum Support International (1-800-944-4773), Star Legacy Foundation (pregnancy and infant loss), Return to Zero: H.O.P.E (peer support), and your local OB-GYN can refer to a pregnancy-loss therapist. You do not have to grieve in private.",
    ],
    sources: ['ACOG — Early Pregnancy Loss', 'WHO — Pregnancy Loss Guidance', 'Postpartum Support International'],
  },
  { id: 'anatomy-discharge', cat: 'Know your body', tag: 'Quick read', read: '2 min',
    title: 'What your discharge is doing, day by day',
    summary: 'Cervical mucus changes across your cycle — and it\'s a real fertility signal, not a sign of being unclean.',
    body: [
      "Discharge — cervical mucus — is normal and constant, and its texture changes with your hormones. Estrogen makes it abundant and slippery; progesterone makes it thick and scarce.",
      "Right after your period: minimal, dry-feeling. As estrogen rises through follicular: more, slightly creamy. Approaching ovulation: thin, stretchy, clear — the famous 'egg-white' texture that can stretch between your fingers. This is peak fertile mucus.",
      "After ovulation: progesterone takes over. Mucus thickens, becomes sticky or absent, and acts as a barrier rather than a transport for sperm.",
      "Healthy mucus is white, clear, or pale yellow when it dries. Strong odor, green or grey color, or itching are infection signs and worth seeing a doctor about — but the cyclical changes themselves are body literacy, not a hygiene problem.",
    ],
    sources: ['ACOG — Cervical Mucus', 'Taking Charge of Your Fertility'],
  },
  { id: 'privacy',  cat: 'Your Data',    tag: 'Read this',        read: '2 min', title: 'How Luna handles your cycle data — in plain English',  summary: 'Server-side, encrypted at rest, gated to your account. No selling, no tracking.', body: [
    'Your cycle data is stored on Luna\'s servers (run on Supabase) and encrypted at rest. Access is gated by row-level security so only your signed-in account can read or modify it.',
    'No selling, no sharing. No third-party advertising trackers inside the app. Anonymous analytics is on by default — it sends event categories only (like "log saved · 3 symptoms"), never the content of what you logged. Switch it off in Settings any time.',
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
  // ── Articles added to plug Ask Luna gaps ────────────────────
  {
    id: 'bbt-charting', cat: 'Know your body', tag: 'Body literacy', read: '4 min',
    title: 'Charting BBT: what the shift actually proves',
    summary: 'Your basal body temperature jumps about 0.5°F after ovulation. The shift — not any single reading — is what confirms it.',
    body: [
      "Basal body temperature is your temperature at rest, taken first thing in the morning before you sit up, eat, drink, or talk. It runs lower in follicular (estrogen-suppressed) and higher in luteal (progesterone-raised). The biphasic pattern over a whole cycle is what tells you ovulation happened.",
      "Follicular average sits around 97.0-97.7°F (36.1-36.5°C). Within about 24-48 hours of ovulation, progesterone rises and pushes BBT up by 0.4-0.8°F (0.2-0.4°C). The new luteal baseline holds until your period starts and progesterone collapses again.",
      "Critically: BBT confirms ovulation AFTER it happens. The temperature rises in response to progesterone, which only rises after the corpus luteum forms. So BBT is excellent for *confirming* the cycle worked, and for *predicting next month's* ovulation by averaging your shifts. It is poor at predicting *this cycle's* ovulation in real time — that's what cervical mucus and LH strips are for.",
      "For useful charting: same thermometer (digital, 2-decimal-place ideal), same time of day, before getting up, before any drink. Sleep disruption, alcohol the night before, illness, and travel all bump readings — log them as notes. Three cycles of charting tells you your personal ovulation day better than any general 'day 14' rule.",
      "If BBT never rises across a cycle, you may not have ovulated that cycle (anovulation). One anovulatory cycle a year is normal. Multiple in a row warrants a workup — PCOS, hypothalamic amenorrhea, thyroid, perimenopause all sit on this signal.",
      "If BBT stays high for 18+ days past your last low reading, pregnancy is increasingly likely — a urine test is more practical than waiting on temperature alone.",
    ],
    sources: ['Taking Charge of Your Fertility, Toni Weschler', 'Cleveland Clinic — BBT', 'WHO Cervical Mucus & BBT Monitoring'],
  },
  {
    id: 'spotting', cat: 'Conditions', tag: 'Decoder', read: '4 min',
    title: 'Spotting decoder: when it matters, when it doesn\'t',
    summary: 'Brown, pink, light red, mid-cycle, pre-period, post-coital — each one is a different story. Here is the map.',
    body: [
      "Spotting is bleeding light enough that it doesn't fill a pad. It can be brown (oxidized old blood), pink (mixed with mucus), or light red. Timing across your cycle says far more than color alone.",
      "Mid-cycle spotting (around day 12-16): often ovulation bleeding. About 5% of menstruating people spot when the brief estrogen dip right after the LH surge sheds a tiny bit of lining. One-off, brief, and roughly tracking your fertile window = normal body literacy.",
      "Pre-period spotting (1-3 days before your period): the lining loosening early. Light brown spotting for a day or two is common and harmless. Pre-menstrual spotting that goes on for 3+ days across multiple cycles can suggest a progesterone shortfall (short luteal phase) — worth bringing up if you're tracking to conceive.",
      "Post-period spotting (extending past day 5-7 of bleeding): your lining hasn't fully cleared. Occasional is fine. Pattern (every cycle, for days) warrants a check for fibroids, polyps, or adenomyosis.",
      "Spotting on hormonal birth control (especially the first 3 months on a new method): breakthrough bleeding is the body adjusting. Usually settles. If it persists past 3 months, the dose may be too low or the method not the right fit.",
      "Post-coital spotting (bleeding after sex): can be a friable cervix from cervicitis, low estrogen (perimenopause, postpartum, breastfeeding), cervical polyps, or — rarely — cervical changes that need screening. Persistent post-coital bleeding deserves a Pap and exam, not waiting.",
      "Spotting with a positive pregnancy test: early implantation bleeding affects ~25% of pregnancies and is usually fine. But any bleeding in pregnancy warrants a same-day call to your provider — ectopic pregnancy and miscarriage can present as 'just spotting' early on.",
      "Red flags that need same-day evaluation: spotting with severe one-sided pain, dizziness, shoulder pain (ectopic warning), or large clots; any postmenopausal bleeding; spotting with fever or foul discharge.",
    ],
    sources: ['ACOG — Abnormal Uterine Bleeding', 'Cleveland Clinic — Spotting', 'NICE Heavy Menstrual Bleeding (NG88)'],
  },
  {
    id: 'late-period', cat: 'Conditions', tag: 'When to worry', read: '4 min',
    title: 'Why your period is late — every common cause',
    summary: 'Pregnancy is the obvious one. Stress, weight change, thyroid, perimenopause, and PCOS are the next four. Here is what each looks like.',
    body: [
      "A 'late period' technically means more than 5 days past your usual cycle length. Most cycles vary by 2-3 days routinely — that's not lateness, that's variance.",
      "Pregnancy is the first thing to rule out if there's been any chance of conception. A urine test 1+ week past the missed date is reliable; blood hCG works earlier. Sensitive tests can pick up pregnancy at the missed date itself.",
      "Stress shuts down the GnRH pulse from the hypothalamus that triggers ovulation. A genuinely stressful month — bereavement, a major move, a deadline season — can push ovulation later or skip it entirely. The period that follows would be late or absent. Usually self-corrects in 1-2 cycles.",
      "Weight changes — rapid loss, low body fat (athletes, restrictive eating), or significant gain — disrupt estrogen production and ovulation signaling. Hypothalamic amenorrhea sits on this axis. The body's calculation is: conditions aren't safe enough for pregnancy right now. Reversible when the underlying issue resolves.",
      "Thyroid (both hypo and hyper) directly affects cycle timing. A TSH test is cheap and quick. Worth doing if late periods are a new pattern.",
      "Perimenopause begins for most people 7-10 years before menopause — so symptoms can start in late 30s or early 40s. Cycles get shorter, longer, or skip entirely as ovulation becomes less reliable. Lighter or heavier periods, sleep disruption, mood shifts, hot flashes are the cluster.",
      "PCOS classically causes long irregular cycles. If your cycles have always been >35 days or skip months without explanation, plus acne or hirsutism or weight pattern, this is worth a workup.",
      "Coming off hormonal birth control: cycles can take 3-6 months to fully return, especially after long-term suppression. Post-pill amenorrhea past 6 months is worth investigating — the suppression may have masked an underlying issue.",
      "Travel across time zones, illness, vaccine response, intense exercise, breastfeeding, and certain medications (antipsychotics, antidepressants, chemotherapy, opioids) can all shift cycle timing.",
      "When to call: pregnancy test positive (any bleeding warrants a call); periods missed for 3+ months and not pregnant; periods that suddenly change pattern in your 40s+ (worth ruling out endometrial issues); late periods with severe pelvic pain.",
    ],
    sources: ['ACOG — Amenorrhea', 'Endocrine Society — Functional Hypothalamic Amenorrhea 2017', 'NICE Menopause Guideline NG23'],
  },
  {
    id: 'perimenopause', cat: 'Conditions', tag: 'Mid-life', read: '6 min',
    title: 'Perimenopause: the 7-10 years nobody warns you about',
    summary: 'It begins long before periods stop, and most of the symptoms aren\'t hot flashes. Here is the real catalog.',
    body: [
      "Menopause is one day — the 12-month anniversary of your last period. Average age in the US is 51. Perimenopause is the transition before it, usually starting in the early-to-mid 40s but for some, the late 30s. It lasts 4-10 years.",
      "The mechanism: your follicle reserve dwindles. Estrogen and progesterone don't decline smoothly — they swing wildly, often higher than your reproductive years on some cycles. The swings, not the eventual decline, drive most symptoms.",
      "Cycle changes are usually the first sign. Cycles get shorter (every 21-25 days), then longer (35+ days), then unpredictable, then skipped. Bleeding can be heavier or lighter. Periods may cluster (two in three weeks) then disappear for months.",
      "Sleep disruption affects ~40-60% of perimenopausal people, often before classic hot flashes appear. Falling asleep is fine; staying asleep isn't. The 3-4 AM wake-up is hormonal, not a personal failing.",
      "Mood shifts are common and underdiagnosed. New anxiety, irritability, brain fog, low mood — often dismissed as midlife crisis or burnout. The perimenopausal depression risk doubles for those with a prior depression history.",
      "Hot flashes and night sweats hit about 75% of women, but many start years into perimenopause, not at the beginning. They can be mild flushes or severe drenching episodes.",
      "Genitourinary changes: vaginal dryness, painful sex, urinary urgency, more frequent UTIs. Estrogen drives vaginal tissue elasticity and lubrication. Vaginal estrogen is highly effective, low-risk, and underused.",
      "Other commonly missed: joint aches, weight redistribution to the midsection, palpitations, dry skin, hair thinning, new migraines, breast tenderness shifting from cyclical to unpredictable.",
      "Tests rarely diagnose perimenopause — FSH bounces too much to be reliable. The diagnosis is clinical: symptoms + age + cycle changes. Don't let a 'normal FSH' make a provider dismiss your experience.",
      "Treatments that work: hormone therapy (the 2002 WHI scare overcorrected — current evidence supports HT for symptom management, started within 10 years of menopause, for most healthy women); SSRIs/SNRIs for hot flashes if HT isn't an option; vaginal estrogen for genitourinary symptoms (separate risk profile, very safe); CBT for sleep and mood; strength training is the single best preventive against bone and muscle loss.",
      "What does not work as primary treatment: 'just push through it', adrenal cocktails, generic supplements without evidence, telling women it's just stress. If your provider is dismissive, find a NAMS-certified menopause practitioner.",
    ],
    sources: ['NICE NG23 Menopause', 'North American Menopause Society 2022 Hormone Therapy Position Statement', 'Menopause: Charting the Course (Mary Claire Haver MD)'],
  },
  {
    id: 'bc-side-effects', cat: 'Sexual health', tag: 'What\'s documented', read: '5 min',
    title: 'Birth control side effects, honestly',
    summary: 'The well-studied risks and the underweighted everyday ones — what shifts with each method.',
    body: [
      "Hormonal birth control prevents pregnancy with high effectiveness and offers real non-contraceptive benefits (lighter periods, fewer cramps, lower ovarian and endometrial cancer risk, acne improvement). It also has documented side effects that get less air time than they should.",
      "Mood effects: a large Danish cohort study (Skovlund et al., 2016) of over a million women found combined hormonal contraception increases first prescription of antidepressants by ~23-34%, with stronger signal in adolescents and progestin-only methods. Not every user experiences this, but if your mood shifted after starting, that's not 'in your head.'",
      "Libido: synthetic estrogen raises sex hormone binding globulin (SHBG), which lowers free testosterone — the hormone driving spontaneous desire. Some users notice no change. Others notice a quiet, persistent dampening that doesn't reverse fully for months after stopping.",
      "Vaginal and vulvar tissue: lower free testosterone and circulating estrogen levels can thin vaginal tissue over years, contributing to dryness and pain with sex (vulvodynia/vestibulodynia) in susceptible users.",
      "Blood clot risk: combined methods (with estrogen) raise venous thromboembolism risk roughly 2-4x baseline. The absolute risk is still low (~5-12 per 10,000 woman-years vs ~2 baseline), but stacks with smoking, age >35, obesity, family history, immobility, recent surgery, and some genetic factors. Progestin-only methods do not carry this risk.",
      "Bone density: depot medroxyprogesterone (the shot) lowers bone density during use, typically reversible within 2-3 years of stopping. Not a great choice for long-term use in teens still building peak bone mass.",
      "Weight: the shot is the only method with consistent weight-gain evidence (~5 lbs/year). Pills, rings, patches: large reviews show no consistent weight effect across populations, though individuals vary.",
      "IUD insertion: the procedure can be painful, especially for those who haven't given birth. The 'pinch' framing is widely dismissed. Ask about pre-procedure NSAIDs, lidocaine paracervical block, or — if you've had trauma — sedation options.",
      "Post-method delays: cycles return immediately for most after pills/rings/IUDs. The shot can take 6-12 months for ovulation to resume. Long-term suppression rarely 'breaks' fertility, but underlying issues that the pill was masking (PCOS, irregular cycles, endometriosis) often reappear.",
      "Honest framing: birth control is a powerful tool with a real risk-benefit calculation that should be yours to make with full information. If your provider dismisses a side effect you're experiencing, you're allowed to switch methods or providers.",
    ],
    sources: ['Skovlund et al., JAMA Psychiatry 2016 (HC and depression)', 'ACOG Practice Bulletin 206 (Combined Hormonal Contraception)', 'Daniels & Mosher, NCHS Data Brief 327'],
  },
  {
    id: 'stress-cycle', cat: 'Mental Health', tag: 'Connection', read: '4 min',
    title: 'Stress and your missed period — the HPA-HPO axis explained',
    summary: 'Chronic stress directly shuts down ovulation. The biology is named, well-studied, and not your imagination.',
    body: [
      "The hypothalamic-pituitary-adrenal (HPA) axis runs your stress response. The hypothalamic-pituitary-ovarian (HPO) axis runs your reproductive cycle. They share a single starting node — the hypothalamus — and they actively compete.",
      "When the HPA axis is sustained 'on' from chronic stress, cortisol stays elevated. Elevated cortisol suppresses the gonadotropin-releasing hormone (GnRH) pulse from the hypothalamus. No GnRH pulse means no LH surge. No LH surge means no ovulation. No ovulation eventually means no period.",
      "The biology is protective, not punitive. Your body has assessed conditions as too poor to support pregnancy and is conserving resources. This is the same mechanism that drives functional hypothalamic amenorrhea (HA) in athletes and people in calorie deficits.",
      "What counts as 'stress' here is broader than feelings of stress. The HPA axis responds to: sustained psychological strain (deadline season, grief, caregiving), under-eating relative to output, overtraining, poor sleep (less than 7h chronic), low body fat, illness, post-surgery recovery.",
      "The cycle response varies. Some people lose periods entirely (amenorrhea). Some have cycles that lengthen (35-60+ days) because ovulation gets delayed. Some keep ovulating but with shorter luteal phases that can affect fertility. PMS can also worsen because the same HPA activation amplifies serotonin and GABA disruption.",
      "Trauma deserves its own line. People with PTSD, complex trauma, or sustained ACEs often have an HPA axis stuck in either chronic hyperactivation or burnout. This affects cycles independently of current 'stress level.' Trauma-informed therapy is part of cycle treatment for some.",
      "Recovery: usually 1-3 months after the stressor resolves, sometimes longer. Cycles that have been suppressed for 6+ months warrant a workup to rule out other causes (PCOS, thyroid, premature ovarian insufficiency).",
      "What helps: increasing rest, increasing caloric intake to match output, treating sleep, reducing high-intensity training, addressing the underlying stressor where possible. The combined hormonal pill restores bleeding but does not restore HPO function — masking it without treating it.",
    ],
    sources: ['Endocrine Society Functional HA Guideline 2017 (Gordon et al.)', 'Berga & Loucks, Stress 2007', "Nicola Rinaldi PhD — No Period. Now What?"],
  },
  {
    id: 'mittelschmerz', cat: 'Know your body', tag: 'Named', read: '2 min',
    title: 'Mittelschmerz: your ovulation pain, named',
    summary: 'About 1 in 5 people feel a brief mid-cycle pinch. It is real, it has a name, and it is a fertility signal — not a problem.',
    body: [
      "Mittelschmerz is German for 'middle pain' — the brief one-sided lower abdominal or pelvic pain that some people feel at ovulation. It is reported by about 20% of menstruating people.",
      "The mechanism is mechanical: the follicle stretches the ovarian surface as it matures, and the rupture that releases the egg causes a small amount of fluid and sometimes a few drops of blood to irritate the surrounding peritoneum. Both can cause a brief pinch or ache.",
      "It usually lasts minutes to a few hours, occasionally up to 24 hours. It alternates sides each cycle in many people (right ovary one month, left the next), which is itself an interesting body-literacy datapoint.",
      "It is a real fertility signal. Paired with cervical mucus changes and BBT charting, mittelschmerz can sharpen your sense of your own ovulation window without instruments.",
      "When it isn't mittelschmerz: pain that lasts more than 24 hours, is severe, comes with fever, nausea, or vomiting, or is on the same side persistently — those need evaluation. Ovarian cysts, ectopic pregnancy, appendicitis, and pelvic inflammatory disease can all mimic mittelschmerz.",
      "Treatment is rarely needed — heat, ibuprofen, and patience handle it. If it disrupts daily life, talk to a provider — hormonal birth control reliably eliminates it by suppressing ovulation.",
    ],
    sources: ['Cleveland Clinic — Mittelschmerz', 'ACOG — Ovulation Pain'],
  },
  {
    id: 'acne-cycle', cat: 'Know your body', tag: 'Hormonal pattern', read: '3 min',
    title: 'Why your jaw breaks out monthly',
    summary: 'Hormonal acne has a signature pattern, a known mechanism, and treatments that actually work.',
    body: [
      "Hormonal acne tends to cluster on the lower face — jawline, chin, around the mouth — and to recur on a monthly schedule. It usually appears in late luteal phase (the week before your period) and during your period.",
      "The mechanism: progesterone and testosterone (which both have a small mid-cycle and luteal peak) stimulate sebaceous glands. More sebum + bacterial overgrowth + inflammation = the deep, painful, slow-healing cysts that hormonal acne specializes in. These aren't surface pimples — they're deeper, often without a head, and can leave marks.",
      "The pattern itself is diagnostic. If you track your skin alongside your cycle and the breakouts cluster predictably late-luteal, that's hormonal acne. If they're scattered or worse during other phases, look for other drivers (stress, products, diet, hormonal BC adjustments).",
      "Topical treatments with the strongest evidence: tretinoin (retinoid) at night, salicylic acid 2%, benzoyl peroxide 2.5-5%. Slow burn — give each 8-12 weeks before judging effect. Layering all three at once is usually a recipe for irritation; rotate or combine carefully.",
      "Systemic options when topicals aren't enough: combined hormonal birth control (drospirenone-containing pills have the strongest acne label), spironolactone (an anti-androgen — particularly good for jawline acne in adults), or — for severe scarring acne — isotretinoin.",
      "PCOS deserves a mention. Acne + irregular cycles + hirsutism (chin/upper lip/chest hair) + difficulty losing weight is a classic cluster. Worth a workup with the testing in the Conditions Atlas.",
      "What does not help (despite popular claims): cutting dairy unless you have a specific reaction; aggressive scrubbing (worsens inflammation); 'detoxes'; spot-treating with toothpaste; sleeping in makeup. Gentle cleansing + evidence-based actives + patience does.",
    ],
    sources: ['American Academy of Dermatology — Hormonal Acne', 'Layton, J Eur Acad Dermatol Venereol 2016', 'Yemisci et al., J Dermatol Treat 2005 (spironolactone)'],
  },
  {
    id: 'cervical-screening', cat: 'Conditions', tag: 'Updated 2024', read: '3 min',
    title: 'Cervical screening: what changed, what to ask for',
    summary: 'Pap-only is outdated for most. HPV-primary testing every 5 years is now first-line for ages 25+.',
    body: [
      "Cervical screening prevents cancer by catching HPV-driven cell changes early. Nearly all cervical cancer is caused by persistent infection with high-risk HPV types — primarily HPV 16 and 18.",
      "Current US guidance (USPSTF 2018, updated 2024; ACS 2020): ages 21-25 follow older Pap-only schedules. Ages 25-65, the preferred approach is HPV testing alone every 5 years OR co-testing (HPV + Pap) every 5 years OR Pap alone every 3 years. HPV-primary is now first-line for many providers.",
      "Why the shift: HPV testing has higher sensitivity than Pap for detecting precancerous changes. Catching the underlying infection earlier is more protective than catching the cell changes after.",
      "What to ask for at your next visit: 'Am I due for HPV primary or co-testing?' — many practices still default to Pap every 3 years out of habit. You're allowed to ask for the more sensitive test.",
      "Self-collection: the FDA approved HPV self-collection in 2024. You collect a vaginal swab at the clinic (no speculum), which is then sent for HPV testing. For people who avoid screening because of past trauma, discomfort, or limited access, this is a meaningful expansion. Ask if your clinic offers it.",
      "After age 65: most can stop screening if past results have been negative and there are no risk factors. Ask your provider about your specific history.",
      "After hysterectomy: depends on whether the cervix was removed and why. If for a benign condition with the cervix removed, screening usually stops. If for HPV-related disease, screening continues.",
      "HPV vaccine: the 9-valent vaccine prevents the strains responsible for ~90% of cervical cancers. Recommended through age 26, available through age 45 case-by-case. Worth asking about even in your 30s and 40s — the safety profile is excellent.",
      "Red flags between screenings: post-coital bleeding, persistent unusual discharge, pelvic pain that's not cyclical, spotting between periods that doesn't fit ovulation timing.",
    ],
    sources: ['USPSTF Cervical Cancer Screening 2018 (update 2024)', 'American Cancer Society Cervical Screening Guidelines 2020', 'FDA HPV Self-Collection Approval 2024'],
  },
  {
    id: 'fatigue-cycle', cat: 'Know your body', tag: 'Energy', read: '4 min',
    title: 'Cycle fatigue across the four phases',
    summary: 'Your energy is supposed to shift. Here is what each phase\'s tiredness means — and when it stops being normal.',
    body: [
      "Energy isn't constant across your cycle. The same person who feels sharp and capable in late follicular can feel like a different human in late luteal — and that's hormonally appropriate, not a failure of discipline.",
      "Menstrual phase fatigue: estrogen and progesterone just bottomed out. Both affect mood, alertness, and energy. Iron loss adds physical depletion, especially in heavy bleeders. Resting more is biologically called-for here — the productivity culture's framing that you should 'push through' is at odds with the chemistry.",
      "Follicular phase: estrogen is climbing. Energy lifts day by day. Sleep gets easier. Many people feel their sharpest by mid-to-late follicular. If you feel exhausted in follicular, that's a meaningful signal — sleep, iron, thyroid, mental health all sit there.",
      "Ovulation: energy usually peaks. Estrogen and testosterone both crest. If you feel a brief dip at ovulation, hydration helps more than caffeine; some people are sensitive to the LH surge itself.",
      "Luteal fatigue: progesterone is rising. Progesterone is sedating — that's its job. It also slows digestion and raises body temperature, both of which subtly drain energy. Late-luteal fatigue is the hormonal cliff — estrogen and progesterone both drop, serotonin follows, and the system requires more sleep and rest. Cravings for carbs are biology asking for tryptophan transport, not weakness.",
      "What's normal: feeling more tired in the week before your period and during your period than in mid-cycle. Wanting more sleep. Lower workout output in late luteal. Mood feeling heavier.",
      "What's not just 'cycle fatigue' — worth a workup: bone-deep exhaustion that doesn't lift with rest, daytime sleepiness even after 8 hours, hair shedding, brain fog that doesn't follow phase pattern, cold intolerance, breathlessness on stairs.",
      "First-line tests if fatigue isn't tracking with your cycle: ferritin (not just hemoglobin — iron stores drop before anemia), TSH and free T4, vitamin D, B12, fasting glucose. Most providers will run these. Bring your cycle log to show the timing — patterns help diagnosis.",
      "Honest framing: women's fatigue is dismissed twice as often as men's in primary care. If you've been told 'just rest more' or 'try harder to sleep' and your fatigue is real, you're allowed to ask for the bloodwork by name.",
    ],
    sources: ['British Society for Haematology — Iron Deficiency', 'American Thyroid Association', 'NICE NG12 Suspected Cancer / Fatigue Guidelines'],
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
  { id: 'painsex', q: 'Pain during or after sex that has continued for more than a few weeks',                    a: 'Dyspareunia is common and treatable — sex-positive gynaecologist or pelvic floor PT is the right room.' },
  { id: 'recuti', q: 'Three or more urinary tract infections in the past year',                                   a: 'Recurrent UTIs are a clinical pattern, not bad luck. Worth a urology or gynae referral.' },
  { id: 'recbv',  q: 'Recurrent BV or yeast infections (3+ in six months)',                                        a: 'Suggests the standard treatments aren\'t enough alone — long-term suppressive or boric-acid options exist.' },
  { id: 'vulvar', q: 'Vulvar pain or burning that lingers between cycles',                                         a: 'Vulvodynia, pelvic floor tension, or hormonal thinning are all treatable — ask for a referral to a pelvic pain specialist.' },
  { id: 'drylow', q: 'Persistent vaginal dryness or low desire that started after a new medication or life stage', a: 'Often hormonal (perimenopause, postpartum, breastfeeding) or medication-related — there are real options including vaginal estrogen.' },
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
