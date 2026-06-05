// Birth control — deep knowledge base, per method.
//
// What this is FOR: when a user is on a method, Luna can answer
// "is what I'm feeling normal?" and "what should I be tracking?"
// without sending her to Reddit. Powers the BcMethodDetail screen
// and the AI thought context for BC users.
//
// Voice rules observed:
//   - Never "you should" — "many people find" / "evidence supports"
//   - Bleeding pattern framed as "what to expect," not "normal/abnormal"
//   - Red flags clearly labeled but never alarmist
//   - Time-to-fertility honest, especially for shot (longest delay)
//   - No method recommended over another — each has trade-offs
//
// Sources cited inline. Primary references:
//   - ACOG Practice Bulletin 110 (combined hormonal contraception)
//   - ACOG Practice Bulletin 186 (LARCs: IUDs and implants)
//   - ACOG Practice Bulletin 206 (progestin-only contraception)
//   - WHO Medical Eligibility Criteria for Contraceptive Use, 5th ed.
//   - CDC US Medical Eligibility Criteria (US MEC)
//   - CDC US Selected Practice Recommendations (US SPR)
//   - Depo-Provera Prescribing Information (Pfizer)
//   - Cochrane Reviews (individual methods cited per item)
//   - Trussell J., Contraception 2011 (effectiveness rates)

export const BC_KNOWLEDGE = {
  'none': {
    summary: 'Not on a method. Tracking your natural cycle — predicting ovulation and your period from the rhythms of your own hormones.',
    mechanism: 'Your body does the work. Estrogen rises through the follicular phase, peaks with ovulation, then progesterone takes over in the luteal phase. The period at the end is the lining shedding because no pregnancy occurred.',
    bleedingPattern: [
      { when: 'every cycle', detail: 'A true period — typically 3–7 days, starting with day 1 of bleeding. Flow and length are your own, but consistency cycle-to-cycle is the signal worth tracking.' },
    ],
    effectiveness: null,
    fertilityReturn: null,
    sideEffects: { common: [], less: [], red: [] },
    doesnt: [],
    switching: null,
    sources: [],
  },

  'combined-pill': {
    summary: 'Combined hormonal birth control — estrogen + progestin taken daily. 21 active pills + 7 placebos in the classic pack; the bleed during the placebo week is a withdrawal bleed, not a true period.',
    mechanism: 'Estrogen suppresses FSH so follicles don\'t mature, preventing ovulation. Progestin thickens cervical mucus (so sperm can\'t get through) and thins the endometrial lining (so implantation is unlikely if anything slips through). Three layers of protection.',
    bleedingPattern: [
      { when: 'first 3 months', detail: 'Breakthrough bleeding and spotting are very common as your body adjusts. Take it at roughly the same time each day to minimize this.' },
      { when: 'steady state', detail: 'Withdrawal bleed each placebo week — usually lighter, shorter, and less painful than a true period.' },
      { when: 'on the right pill', detail: 'Many people skip placebo weeks to suppress withdrawal bleeds entirely. Talk to your provider — extended/continuous regimens are safe and well-studied.' },
    ],
    effectiveness: { typical: 93, perfect: 99 },
    fertilityReturn: 'Ovulation typically returns within 1–3 months of stopping. Some people ovulate the cycle they stop.',
    sideEffects: {
      common: [
        'Spotting in the first 3 months',
        'Tender breasts (usually first 1–2 packs)',
        'Mood changes (mixed evidence — some improve, some get worse)',
        'Mild nausea early',
      ],
      less: [
        'Decreased libido in some',
        'Slight weight changes (evidence weaker than reputation)',
        'Migraine pattern changes',
        'Spotting between periods after years on it',
      ],
      red: [
        'Sudden severe headache or vision changes — possible blood-clot risk, especially if you have migraine with aura',
        'Chest pain or shortness of breath',
        'Sharp leg pain or swelling — possible DVT',
        'Sudden numbness or weakness on one side',
      ],
    },
    doesnt: [
      'Doesn\'t protect against STIs — use condoms for that',
      'Doesn\'t treat PCOS at the root — manages symptoms while you\'re on it',
      'Doesn\'t restore "true" cycles — what you bleed is a withdrawal bleed',
    ],
    switching: [
      'Switching from another method: start your first active pill the day you stop the other method (or as your provider advises). Use backup for 7 days unless transitioning within 24 hours of an active hormonal method.',
      'Stopping to try to conceive: ovulation can return within weeks — start tracking immediately if timing matters.',
    ],
    sources: ['ACOG Practice Bulletin 110', 'CDC US MEC', 'Cochrane Review (combined oral contraceptives)'],
  },

  'mini-pill': {
    summary: 'Progestin-only pill — no estrogen. Taken daily within a strict 3-hour window. Common for breastfeeding, migraine-with-aura, or anyone who can\'t use estrogen.',
    mechanism: 'Progestin thickens cervical mucus and thins the endometrium. About half of users still ovulate; the contraceptive effect is mostly downstream. The strict 3-hour window matters because mucus thickening reverses within hours of a missed pill.',
    bleedingPattern: [
      { when: 'first 3–6 months', detail: 'Unpredictable bleeding is the norm — spotting between periods, lighter periods, sometimes none. Frustrating but expected.' },
      { when: 'steady state', detail: 'About 40% of users have regular periods, 40% have irregular bleeding, 20% have no bleeding at all. Your version is your version.' },
    ],
    effectiveness: { typical: 91, perfect: 99 },
    fertilityReturn: 'Fast — ovulation typically returns within days to weeks of stopping. The shortest delay of any hormonal method.',
    sideEffects: {
      common: [
        'Irregular spotting (the main complaint)',
        'Tender breasts early on',
        'Some mood changes',
      ],
      less: [
        'Headaches',
        'Mild acne in some (progestin-driven)',
        'Slight libido changes',
      ],
      red: [
        'Severe abdominal pain — small increased risk of ectopic pregnancy if conception happens despite the pill',
        'Yellowing of skin or eyes — rare liver effect',
      ],
    },
    doesnt: [
      'Doesn\'t protect against STIs',
      'Doesn\'t suppress ovulation in everyone — about half still ovulate',
      'Doesn\'t allow the 3-hour grace period that combined pills do — strict timing matters',
    ],
    switching: [
      'Often used as a bridge: starts immediately when stopping combined pill, IUD removal, or after birth.',
      'Stopping to try to conceive: fertility can return within days — track from the moment you stop.',
    ],
    sources: ['ACOG Practice Bulletin 206', 'WHO MEC 5th ed.', 'CDC US SPR'],
  },

  'hormonal-iud': {
    summary: 'A small T-shaped device placed in the uterus that releases low-dose progestin (levonorgestrel) locally. Brands: Mirena, Liletta (8 years), Kyleena (5 years), Skyla (3 years).',
    mechanism: 'Levonorgestrel is released directly into the uterus, thickening cervical mucus and thinning the endometrium so dramatically that implantation is unlikely. About 50% of Mirena users stop ovulating too. Almost no systemic hormone exposure compared to the pill.',
    bleedingPattern: [
      { when: 'first 3 months', detail: 'Spotting and irregular bleeding daily-ish. This is the "settling" period — most frustrating phase.' },
      { when: '3–6 months', detail: 'Bleeding starts to quiet. Spotting becomes less daily.' },
      { when: '6–12 months', detail: 'About half of users have very light periods or just monthly spotting; the rest get heavier-end light bleeding.' },
      { when: '12+ months', detail: 'Approximately 20% of Mirena users have no bleeding at all. Another 60% have very light periods. This is expected — the lining is too thin to shed.' },
    ],
    effectiveness: { typical: 99.8, perfect: 99.8 },
    fertilityReturn: 'Ovulation returns immediately on removal — many people conceive in the first cycle after.',
    sideEffects: {
      common: [
        'Cramping during insertion + first few days',
        'Spotting for weeks-to-months after insertion',
        'Ovarian cysts (usually painless, resolve on their own)',
      ],
      less: [
        'Headaches, acne, mood changes (lower rates than systemic methods)',
        'Mild ongoing pelvic discomfort',
        'Decreased libido in some',
      ],
      red: [
        'Severe pelvic pain that doesn\'t resolve — possible expulsion or perforation (rare, ~1 in 1000)',
        'Fever + pelvic pain in first 3 weeks — possible PID',
        'Pain with intercourse if a partner can feel the strings sharply — strings may need trimming',
        'Possibility of being unable to find strings — get an ultrasound to confirm placement',
      ],
    },
    doesnt: [
      'Doesn\'t protect against STIs',
      'Doesn\'t cause infertility long-term — the rumor is persistent and wrong (Cochrane review)',
      'Doesn\'t require daily action — protection is continuous',
    ],
    switching: [
      'Insertion: usually done during a period for easier placement, but can be done anytime if pregnancy is reliably excluded.',
      'Removal: can be done in-office anytime, including before the rated expiry. Fertility resumes immediately.',
    ],
    sources: ['ACOG Practice Bulletin 186', 'WHO MEC 5th ed.', 'Cochrane Review (hormonal IUDs)'],
  },

  'copper-iud': {
    summary: 'A small T-shaped device wrapped in copper. Hormone-free — the copper itself is the contraceptive. Brand: Paragard (10 years). The only non-hormonal long-term reversible method.',
    mechanism: 'Copper ions disrupt sperm motility and viability, preventing fertilization. Also induces a sterile inflammatory response in the uterus that\'s hostile to implantation if fertilization does occur. No effect on ovulation — your natural cycle continues fully.',
    bleedingPattern: [
      { when: 'every cycle', detail: 'You have real periods — same rhythm as before insertion, often heavier and crampier (for 3–6 months especially).' },
      { when: 'first 3–6 months', detail: 'Most users see heavier, longer periods + more cramping. Many find this settles after the first 6 months; some don\'t.' },
      { when: 'long-term', detail: 'About 5–15% of users have the IUD removed for unmanageable heavy bleeding or cramping. The rest find the pattern tolerable.' },
    ],
    effectiveness: { typical: 99.2, perfect: 99.4 },
    fertilityReturn: 'Immediate on removal.',
    sideEffects: {
      common: [
        'Heavier, longer periods',
        'Increased menstrual cramping',
        'Insertion discomfort',
      ],
      less: [
        'Spotting between periods (usually first 6 months)',
        'Iron deficiency from heavier bleeding — worth checking ferritin annually',
      ],
      red: [
        'Sudden severe pelvic pain — possible expulsion, perforation, or rare ectopic if pregnancy occurs',
        'Fever + pain in first 3 weeks — possible PID',
        'Can\'t find strings — ultrasound to confirm placement',
      ],
    },
    doesnt: [
      'Doesn\'t protect against STIs',
      'Doesn\'t affect hormones in any way — your cycle, mood, libido all stay your own',
      'Doesn\'t make periods lighter — usually the opposite',
    ],
    switching: [
      'Excellent emergency contraception: inserted within 5 days of unprotected sex, it\'s the most effective EC available.',
      'Removal: in-office, anytime. Fertility resumes immediately.',
    ],
    sources: ['ACOG Practice Bulletin 186', 'WHO MEC 5th ed.', 'Trussell J., Contraception 2011'],
  },

  'implant': {
    summary: 'A small flexible rod (~4cm) placed under the skin of the upper arm. Releases progestin (etonogestrel) for 3 years. Brand: Nexplanon. Most effective reversible method available.',
    mechanism: 'Continuous low-dose progestin suppresses ovulation in most users + thickens cervical mucus. Steady serum levels mean no daily-action requirement and no withdrawal cycle.',
    bleedingPattern: [
      { when: 'first 3 months', detail: 'Unpredictable — spotting most days, irregular bleeding episodes, sometimes prolonged bleeding. The settling-in period.' },
      { when: 'steady state', detail: 'About 1/3 of users get amenorrhea (no bleeding), 1/3 get infrequent light bleeding, 1/3 get prolonged or frequent bleeding. The unpredictability is the most cited reason for removal.' },
    ],
    effectiveness: { typical: 99.95, perfect: 99.95 },
    fertilityReturn: 'Ovulation returns within 1–4 weeks of removal.',
    sideEffects: {
      common: [
        'Bleeding-pattern changes (the dominant side effect)',
        'Mild bruising + tenderness at insertion site for a few days',
        'Headaches in some',
        'Acne in some (progestin effect)',
      ],
      less: [
        'Mood changes',
        'Decreased libido in some',
        'Weight changes (evidence weaker than reputation)',
        'Ovarian cysts (usually painless)',
      ],
      red: [
        'Inability to feel the implant in your arm — get imaging to locate before removal',
        'Severe arm pain or signs of infection at insertion site early on',
        'Sudden severe abdominal pain — small increased ectopic risk if pregnancy occurs',
      ],
    },
    doesnt: [
      'Doesn\'t protect against STIs',
      'Doesn\'t allow you to predict bleeding — that\'s the trade-off',
      'Doesn\'t require any user maintenance — it\'s working continuously',
    ],
    switching: [
      'Insertion: anytime during the cycle if pregnancy is reliably excluded. Use backup for 7 days if inserted after day 5.',
      'Removal + replacement at 3 years; in-office, brief.',
    ],
    sources: ['ACOG Practice Bulletin 186', 'WHO MEC 5th ed.', 'Cochrane Review (etonogestrel implant)'],
  },

  'shot': {
    summary: 'Depo-Provera — a progestin (medroxyprogesterone acetate, DMPA) injection given every 12 weeks. Effective, fully invisible to a partner, no daily action.',
    mechanism: 'High-dose progestin suppresses GnRH → no LH surge → no ovulation. Also thickens cervical mucus and thins the endometrium. The high progestin load is why periods usually stop entirely after a few shots.',
    bleedingPattern: [
      { when: 'first 3–6 months', detail: 'Irregular spotting and unpredictable bleeding episodes are the norm. Frustrating but expected.' },
      { when: '6–12 months', detail: 'About half of users have stopped bleeding entirely by now. The rest have light, infrequent spotting.' },
      { when: '12+ months', detail: 'Approximately 70% of long-term users have no bleeding at all. This is expected and safe — the lining stays thin.' },
    ],
    effectiveness: { typical: 96, perfect: 99 },
    fertilityReturn: 'Slow — average 9–10 months to ovulation return after the last shot, sometimes up to 18 months. The longest delay of any reversible method. If you might want to conceive within a year, this isn\'t the method to choose.',
    sideEffects: {
      common: [
        'Irregular bleeding early, amenorrhea later',
        'Weight gain (evidence is real and stronger than for other methods — average ~5 lbs in the first year)',
        'Headaches in some',
        'Mood changes',
      ],
      less: [
        'Bone density loss with long-term use (mostly reversible after stopping)',
        'Decreased libido in some',
        'Acne (mixed — can improve or worsen)',
        'Hair changes',
      ],
      red: [
        'Sudden severe headache or vision changes',
        'Heavy unexpected bleeding after months of none',
        'Severe depression or new suicidal thoughts — DMPA has the strongest mood-effect signal of common hormonal methods',
        'Sharp leg pain or swelling',
      ],
    },
    doesnt: [
      'Doesn\'t protect against STIs',
      'Doesn\'t allow quick return to fertility — plan ahead if TTC is on your horizon',
      'Doesn\'t suit timing-sensitive people — re-injection within the 12-week window matters',
    ],
    switching: [
      'Re-injection: every 12 weeks ideally; up to 13 weeks is fully effective; 13–15 is considered late and may need a pregnancy test before re-injection.',
      'Stopping: no withdrawal. Just don\'t get the next shot. Fertility resumes when ovulation resumes (avg 9–10 months out).',
    ],
    sources: ['ACOG Practice Bulletin 206', 'Depo-Provera Prescribing Information (Pfizer)', 'WHO MEC 5th ed.', 'Cochrane Review (DMPA)'],
  },

  'patch': {
    summary: 'A transdermal patch (Xulane, Twirla) worn weekly. Same hormones as the combined pill — estrogen + progestin — delivered through the skin instead of orally.',
    mechanism: 'Same as combined pill: suppresses ovulation via FSH suppression, thickens mucus, thins lining. Worn for 3 weeks (new patch each week), then 1 patch-free week for withdrawal bleed.',
    bleedingPattern: [
      { when: 'first 3 months', detail: 'Spotting and adjustment bleeding. Similar to combined pill.' },
      { when: 'steady state', detail: 'Withdrawal bleed during the patch-free week. Usually lighter than a true period.' },
    ],
    effectiveness: { typical: 93, perfect: 99 },
    fertilityReturn: '1–3 months typical.',
    sideEffects: {
      common: [
        'Application-site skin irritation',
        'Tender breasts',
        'Spotting early on',
        'Headaches',
      ],
      less: [
        'Mood changes',
        'Nausea early',
        'Some patches deliver slightly higher estrogen exposure than the pill — slightly higher clot risk in some studies (still rare)',
      ],
      red: [
        'Same as combined pill: severe headache, vision changes, chest pain, sharp leg pain',
        'Patch falling off and not noticing — protection drops quickly',
      ],
    },
    doesnt: [
      'Doesn\'t protect against STIs',
      'Doesn\'t stay on reliably for some people (oily skin, swimming, hot climates)',
    ],
    switching: ['Same guidance as combined pill.'],
    sources: ['ACOG Practice Bulletin 110', 'CDC US MEC'],
  },

  'ring': {
    summary: 'A flexible vaginal ring (NuvaRing, Annovera) inserted for 3 weeks, removed for 1. Annovera is reusable for a year. Same hormone class as the combined pill — estrogen + progestin.',
    mechanism: 'Same as combined pill — local hormone absorption through the vaginal wall reaches similar serum levels. Suppresses ovulation, thickens mucus, thins lining.',
    bleedingPattern: [
      { when: 'first 3 months', detail: 'Adjustment spotting.' },
      { when: 'steady state', detail: 'Withdrawal bleed during the ring-free week.' },
    ],
    effectiveness: { typical: 93, perfect: 99 },
    fertilityReturn: '1–3 months typical.',
    sideEffects: {
      common: [
        'Increased vaginal discharge',
        'Possible discomfort during sex (most don\'t feel it)',
        'Spotting in the first months',
      ],
      less: [
        'Vaginitis or yeast (slight increase)',
        'Mood changes',
        'Same class effects as combined pill',
      ],
      red: ['Same as combined pill: severe headache, vision changes, chest pain, sharp leg pain.'],
    },
    doesnt: [
      'Doesn\'t protect against STIs',
      'Doesn\'t need to be removed during sex (but can be, up to 3 hours)',
    ],
    switching: ['Same guidance as combined pill.'],
    sources: ['ACOG Practice Bulletin 110', 'CDC US MEC'],
  },
}

export function getBcKnowledge(method) {
  return BC_KNOWLEDGE[method] || null
}

// Effectiveness formatted as a one-liner.
export function effectivenessLine(method) {
  const k = BC_KNOWLEDGE[method]
  if (!k?.effectiveness) return null
  const { typical, perfect } = k.effectiveness
  return `${typical}% typical use · ${perfect}% with perfect use`
}
