// Cycle Schools — 5-day phase-aware programs.
//
// Why this exists: tracking gives you data. Schools give you literacy.
// Most women have never been taught what their hormones actually do
// — the framing is either "your cycle is something to manage" or
// "your cycle is something to optimise." Both are wrong. Schools
// are a five-day walk through what your body is doing AND a small
// practice each day so the knowledge lands somewhere physical.
//
// Each program is 5 days. Each day has:
//   - title
//   - body         — the editorial / educational paragraph
//   - practice     — one small thing to actually do today
//   - source       — citation for the science claim
//
// Voice rules:
//   - Doula / older-sister tone
//   - No "should" / "must" / optimisation framing
//   - Phase-accurate; only claims we can source
//   - Reflective register — the practice is never homework
//
// The three first programs cover the three places where literacy is
// most missing: understanding the luteal phase (the misunderstood
// week before period), moving with the follicular phase (when energy
// is naturally rising), and using the menstrual week for restoration
// (the one most women resist).

export const CYCLE_SCHOOLS = [
  // ────────────────────────────────────────────────────────────
  // Program 1 — Understanding your luteal phase
  // ────────────────────────────────────────────────────────────
  {
    id: 'understanding-luteal',
    title: 'Understanding your luteal phase',
    subtitle: 'Why the week before your period feels different',
    phase: 'luteal',
    category: 'reflect',
    duration: 5,
    intro:
      "Most of us were taught that PMS is a personality flaw. It isn't. The luteal phase is a specific hormonal environment — progesterone rising, then both progesterone and estrogen falling — and your body, mood, sleep, and appetite all respond to that shift. Five days of literacy so the week before your period stops being a mystery.",
    days: [
      {
        n: 1,
        title: 'What progesterone is doing',
        body: "After ovulation, your corpus luteum (the temporary gland that forms from the released follicle) starts producing progesterone. Progesterone's job is to prepare the uterine lining for a possible pregnancy — and to act on your brain, your gut, and your body temperature. It's a calming, slowing, inward-turning hormone. If you feel less social, less driven, more sensitive to noise, more sleepy, more interested in being home — that's progesterone doing what it does. The shift is real; it isn't a failure of willpower or a sign of depression.",
        practice:
          "Notice one moment today when your energy turns inward. Don't fix it. Don't push past it. Just name it: 'oh, this is progesterone.' That naming alone is half the work.",
        source: 'Cleveland Clinic — The Menstrual Cycle; ACOG Hormone Reference',
      },
      {
        n: 2,
        title: 'Why mood shifts here',
        body: "Progesterone is broken down by your body into a metabolite called allopregnanolone. Allopregnanolone acts on the same brain receptors as GABA — the system anti-anxiety medications target. When progesterone is rising, allopregnanolone is calming. When progesterone drops sharply in late luteal phase (the few days before your period), allopregnanolone drops too — and that withdrawal looks a lot like anxiety, irritability, or sadness. It is brain chemistry, not character.",
        practice:
          "Today, give yourself one extra layer of softness with how you talk to yourself. The 'why am I being so much' voice in your head — that's the allopregnanolone drop, not the truth about who you are.",
        source: 'Bäckström et al., Allopregnanolone in PMDD; Cleveland Clinic',
      },
      {
        n: 3,
        title: 'Cravings as signal',
        body: "Your basal body temperature is about 0.5°F higher in your luteal phase because progesterone is thermogenic — it raises your core temperature, which means you actually burn slightly more calories at rest (around 100–300 more per day). Your body knows. That's why hunger and cravings often spike here, especially for warming, denser foods — soups, stews, dark chocolate, complex carbs. Your body is asking for fuel, not failing at restraint. Eating more in your luteal week is biologically appropriate.",
        practice:
          "Eat one warming, grounding meal today without negotiation. Congee, soup, a baked sweet potato, dal. Notice if your body settles afterward.",
        source: 'Day & Bisdee, BMR variation across cycle; Cleveland Clinic',
      },
      {
        n: 4,
        title: 'Sleep and the luteal week',
        body: "Progesterone is sedating — but the same hormone that makes you drowsy can also fragment your sleep. The temperature rise alone can disrupt deep sleep, and the late-luteal drop in serotonin (estrogen supports serotonin; both fall together) can cause early-morning waking. If you sleep worse in the week before your period, you're not imagining it. Magnesium glycinate (200–400mg) before bed has decent evidence for both PMS symptoms and sleep quality in this window.",
        practice:
          "Cool the room by a degree or two tonight. Heavier blanket. No screens for the half-hour before bed. Sleep is medicine this week — let it be.",
        source: 'NIH Magnesium for PMS RCT; Sleep Foundation — Hormones & Sleep',
      },
      {
        n: 5,
        title: 'Closing the cycle',
        body: "If no pregnancy occurs, the corpus luteum dissolves about 12–14 days after ovulation. Progesterone and estrogen both crash. That hormonal cliff is what triggers your period — the uterine lining loses its hormonal support and sheds. Many notice a strange kind of relief in the day or two before bleeding starts: a clearing, a settling. That's the storm passing. The cycle isn't ending; it's beginning a new one.",
        practice:
          "Look back at the four days behind you. Was there a pattern? A day that was harder than others? Note it without judgment — that data is yours next month.",
        source: 'Cleveland Clinic — Phases; ACOG',
      },
    ],
  },

  // ────────────────────────────────────────────────────────────
  // Program 2 — Your follicular movement week
  // ────────────────────────────────────────────────────────────
  {
    id: 'follicular-movement',
    title: 'Your follicular movement week',
    subtitle: 'Building energy with your body, not against it',
    phase: 'follicular',
    category: 'body',
    duration: 5,
    intro:
      "The week after your period is the most underused week of your cycle for movement. Estrogen is rising, pain tolerance is up, recovery is fast, and the brain is in build-mode. This isn't 'push through' week — it's the week your body is most ready to receive a new stimulus. Five days of phase-appropriate movement guidance, written for the body you actually have.",
    days: [
      {
        n: 1,
        title: 'Reading your energy',
        body: "On day 1 of follicular phase, your period may have just ended — energy is usually low-to-moderate even though hormones are rising. Don't trust the rising estrogen narrative on its own; trust what your body is telling you today. A 20-minute walk in daylight is the perfect entry point. Daylight in the first hour after waking helps reset cortisol rhythm, which supports the rest of the week's energy.",
        practice:
          "Take a 20-minute walk outside today, ideally before noon. Phone in your pocket. Notice your stride lengthening as you go.",
        source: 'Cleveland Clinic — Follicular phase; Huberman, Light & Cortisol',
      },
      {
        n: 2,
        title: 'Strength, with intention',
        body: "Research is starting to show that the follicular phase is when women may build muscle most efficiently — estrogen supports muscle protein synthesis, and the brain is primed for new motor learning. This is your week for heavier lifts, technical practice, or progressing a movement. Aim for 6–10 reps at a weight that's hard by rep 8. Compound movements (squat, deadlift, row, press) give you the most return. Two to three sets is plenty.",
        practice:
          "Pick three compound movements. Do two to three sets each, 6–10 reps. Track the weight today so you have a baseline.",
        source: 'Sims, ROAR; Schoenfeld, Hypertrophy Research',
      },
      {
        n: 3,
        title: 'A cardio day',
        body: "Higher-intensity cardio is well-tolerated in follicular phase — rising estrogen supports cardiovascular adaptation, and the lower BBT means your body can dissipate heat more efficiently than it can in luteal. Today is a good day for intervals: 4 rounds of 4 minutes hard, 2 minutes easy. Or, if intervals aren't your thing, a longer steady run, ride, or swim. The key is that this should feel demanding but not depleting.",
        practice:
          "30 minutes of cardio at a pace that makes conversation difficult. Stop when you feel demanding-but-clear, not depleted.",
        source: 'Sims, ROAR; ACSM Position Stand on Exercise',
      },
      {
        n: 4,
        title: 'Flow + flexibility',
        body: "Estrogen affects ligament laxity — which makes follicular phase a good time to work on mobility and flexibility, but also a phase where you want to be slightly more careful about end-range or pivoting movements (ACL injuries in athletes cluster around late follicular for this reason). Yoga, pilates, dance, or any practice that asks for range without asking for max load is well-suited to today.",
        practice:
          "Take a 30–45 minute yoga, pilates, or dance class — in person or on video. Move with the practice; don't try to win at it.",
        source: 'Wojtys et al., ACL Injury & Cycle Phase; Cleveland Clinic',
      },
      {
        n: 5,
        title: 'Listening for the peak',
        body: "The last day of follicular phase is just before ovulation. Estrogen is at its highest. Testosterone is peaking too. You may notice: more verbal fluency, more spontaneous social energy, more interest in your own body. This is the week's gift — and a day to do something that feels expressive rather than disciplined. A long walk with someone you love. A dance class. A swim somewhere beautiful. The body is at the top of an arc; honor it by being in it.",
        practice:
          "Move today in a way that feels good, not a way that feels productive. The distinction matters.",
        source: 'Cleveland Clinic — Estrogen Peak; FeelGoodPal',
      },
    ],
  },

  // ────────────────────────────────────────────────────────────
  // Program 3 — Rest as the work
  // ────────────────────────────────────────────────────────────
  {
    id: 'menstrual-rest',
    title: 'Rest as the work',
    subtitle: 'Five days of menstrual-week restoration',
    phase: 'menstrual',
    category: 'urgent',
    duration: 5,
    intro:
      "Most cultures used to give menstruating women a rest week. We don't anymore, and our bodies still need it. The menstrual phase is your hormonal lowest point — estrogen and progesterone both bottom out, immune function dips slightly, energy is genuinely lower. Five days that don't ask you to push through.",
    days: [
      {
        n: 1,
        title: 'Permission to slow',
        body: "Day one of your period is a low-energy day. Estrogen has crashed, progesterone has crashed, and your body has just begun the work of shedding the uterine lining. Prostaglandins — the inflammatory compounds that drive cramping — are at their peak. If you feel like you have less to give today, you have less to give today. The rest of the world is wrong about this, not you. Resting is not a failure; it's the biology.",
        practice:
          "Cancel one thing today that you can cancel. Reschedule it for follicular week. Notice the relief.",
        source: 'ACOG — Dysmenorrhea; Cleveland Clinic — Menstrual phase',
      },
      {
        n: 2,
        title: 'Pain you don\'t have to push through',
        body: "Period pain is caused by prostaglandins making the uterus contract. NSAIDs (ibuprofen, naproxen) work specifically because they block prostaglandin production — they are not just generic painkillers, they target the actual cause. Taking them at the first sign of pain is significantly more effective than waiting until you're suffering. Heat is also genuinely effective — multiple RCTs show heating-pad use rivals ibuprofen for many women. You don't have to be brave about cramps.",
        practice:
          "If your cramps are real, take ibuprofen 400mg with food at first sign. Heating pad on the lower belly or lower back. Both. No martyrdom.",
        source: 'Cochrane Review — NSAIDs for Dysmenorrhea; Akin et al., Heat Therapy RCT',
      },
      {
        n: 3,
        title: 'What to eat this week',
        body: "Iron loss during menstruation is real, especially if your flow is moderate or heavy. Iron-rich foods help — red meat is the most bioavailable form, but lentils, dark leafy greens, pumpkin seeds, and dark chocolate also contribute. Vitamin C eaten alongside (citrus, peppers, kiwi) significantly increases absorption of plant-iron. Calcium-rich foods and coffee should be eaten away from iron meals because they block absorption. This is the practical version of 'eat for your cycle.'",
        practice:
          "One iron-rich meal today, with something bright and citrusy alongside. Save coffee for between meals, not with food.",
        source: 'NIH Iron; American Society of Hematology',
      },
      {
        n: 4,
        title: 'The mental side of rest',
        body: "Rest is uncomfortable for people trained to be productive. Lying down without earning it can produce a low-grade anxiety that's often labelled 'restlessness' or 'guilt.' That feeling is conditioned, not biological. The most useful skill in menstrual week is the ability to be horizontal without doing anything productive, without it costing you. Reading something undemanding, watching something beautiful, sleeping when the body wants to sleep — these are restorative, not lazy. The body knows; the culture forgot.",
        practice:
          "Spend 20 minutes today lying down doing nothing useful. Notice if guilt comes up. Stay with it. The guilt is not the truth.",
        source: 'Cleveland Clinic — Rest & Recovery; Maté, The Myth of Normal',
      },
      {
        n: 5,
        title: 'Closing the cycle, opening the next',
        body: "By the last day of your period, estrogen is starting to rise again. You may notice a small lift — a slightly easier morning, a little more interest in food, the world becoming a touch more colorful. This is the threshold to follicular week. The cycle isn't a circle that you finish; it's a spiral that you're always somewhere on. The work you did this week — actually resting, actually eating well, actually treating pain instead of pushing through — pays you back next week, when your body is ready to build.",
        practice:
          "Write one line tonight in your diary: what did this menstrual week teach you that you want to remember next month?",
        source: 'Cleveland Clinic — Follicular phase; Northrup, Women\'s Bodies',
      },
    ],
  },
  // ────────────────────────────────────────────────────────────
  // Program 4 — Postpartum recovery (first six weeks)
  // ────────────────────────────────────────────────────────────
  {
    id: 'postpartum-recovery',
    title: 'Postpartum recovery, week by week',
    subtitle: 'A gentler map of the first six weeks',
    phase: 'menstrual',
    // Postpartum shares the menstrual phase tag, but it must NEVER be
    // auto-surfaced on Home for an ordinary menstrual-phase user —
    // only postpartum users should land here. `hidden` keeps it out of
    // schoolForPhase()'s phase match while staying browsable in the
    // full Cycle Schools list. (Without this, it's one array reorder
    // away from serving postpartum content to everyone — flagged in
    // the roadmap doc.)
    hidden: true,
    category: 'care',
    duration: 5,
    intro:
      "The fourth trimester gets called 'recovery' like there's a finish line. There isn't. It's a hormonal cliff (estrogen and progesterone drop ~99% within hours of birth), a body actively healing, and a brain learning a new person. Five days of literacy so you stop measuring yourself against an arrival date that doesn't exist.",
    days: [
      {
        n: 1,
        title: 'The hormonal cliff',
        body: "Within 24 hours of birth, estrogen and progesterone — the hormones that climbed steadily for nine months — collapse by ~99%. It is the largest hormonal shift the human body ever undergoes. Mood swings, weeping at small things, hot flashes at night, hair shedding around three months postpartum — all downstream of that drop. Your reaction is biology, not weakness, and not yet a sign that something is wrong.",
        practice:
          "Today, when you feel a wave of emotion, try saying out loud: 'this is the cliff, not me.' Naming the chemistry doesn't fix the feeling but it widens the gap between you and it.",
        source: 'Schiller et al., Hormones and the Postpartum Brain; ACOG Postpartum Care',
      },
      {
        n: 2,
        title: 'What healing actually means',
        body: "Your uterus shrinks from grapefruit-sized back to a pear over six weeks (involution). Lochia — the postpartum bleed — is the lining shedding and the placental wound healing, typically 4-6 weeks. Pelvic floor muscles, perineal tissue, and (if you had one) C-section incisions all need 6-12 weeks of REAL rest. The 'bouncing back' culture is medically incorrect. Your tissue heals on its own clock.",
        practice:
          "Today, sit or lie down for ten minutes without your phone. Notice what your body is doing without an external prompt. It is healing whether you watch it or not, but watching it helps you respect the timeline.",
        source: 'ACOG — Postpartum Optimization; Royal College of OB-GYN (UK)',
      },
      {
        n: 3,
        title: 'Sleep, in fragments',
        body: "Fragmented sleep is its own injury. Even 7 total hours broken into three pieces does not equal 7 consolidated hours — your body doesn't reach the deep REM cycles where physical and emotional repair happens. This is why postpartum brain fog and mood swings worsen even with 'enough' sleep on paper. The fix isn't more hours — it's any consolidated stretch, however short. A protected 3-4 hour block matters more than 8 broken ones.",
        practice:
          "If you can, ask someone to take one feed or hold the baby for one stretch tonight. Even three hours of uninterrupted sleep changes your brain's recovery curve. This isn't a luxury — it's a clinical need.",
        source: 'Mindell et al., Sleep in the Postpartum; Cleveland Clinic',
      },
      {
        n: 4,
        title: 'When to call — postpartum red flags',
        body: "Most discomfort in postpartum is normal. Some isn't. Call your provider same-day for: heavy bleeding (saturating a pad in under an hour, large clots), severe headache that doesn't lift with hydration + rest (possible postpartum preeclampsia, which can develop up to 6 weeks after birth), calf pain or swelling on one side (possible blood clot), fever over 100.4°F, or persistent thoughts of harming yourself or the baby. Postpartum depression and psychosis are treatable but need immediate attention — not 'when you can get to it.'",
        practice:
          "Save your OB's after-hours number into your phone right now if you haven't. Tell one trusted person what the red flags are so they can prompt you to call if you're too foggy to assess.",
        source: 'ACOG Practice Bulletin — Postpartum; CDC Maternal Mortality Brief',
      },
      {
        n: 5,
        title: 'The fourth trimester is real',
        body: "The phrase 'fourth trimester' was coined by Harvey Karp to acknowledge that the 12 weeks after birth are physiologically as significant as the three trimesters before it — for both you and the baby. Some cultures formalize this with 40+ days of mandated rest, family support, and ritual care for the new mother. Western postpartum culture mostly doesn't. You are not failing by needing what other cultures explicitly build in. You are just under-resourced.",
        practice:
          "Today, refuse one expectation that has nothing to do with healing — a thank-you note, a load of laundry, a tidy house when visitors come. Use the saved energy to nap, to eat, or to sit in the sun for ten minutes. Recovery counts as productive.",
        source: 'Karp — The Happiest Baby; Postpartum Support International',
      },
    ],
  },

  // ────────────────────────────────────────────────────────────
  // Program 5 — TTC fundamentals (trying to conceive)
  // ────────────────────────────────────────────────────────────
  {
    id: 'ttc-fundamentals',
    title: 'TTC, without the noise',
    subtitle: 'Five days on what actually moves the needle when trying',
    phase: 'follicular',
    category: 'plan',
    duration: 5,
    intro:
      "Fertility content is a marketplace of pills, supplements, apps, and influencers. Most of it is noise; some of it is harmful. Five days of evidence-based literacy on what actually moves the needle when you're trying to conceive — and how to tell when the timeline warrants a workup vs more patience.",
    days: [
      {
        n: 1,
        title: 'The fertile window, named',
        body: "The fertile window is the 5 days BEFORE ovulation plus ovulation day itself — six days total. Sperm survives 3-5 days in fertile cervical mucus; the egg lives 12-24 hours. So the window is built around sperm timing, not egg timing. The single day with the highest pregnancy probability is the day before ovulation, NOT ovulation day. This is the most-missed nuance in fertility timing — and the reason BBT alone (which confirms ovulation AFTER it happens) doesn't help your timing this cycle.",
        practice:
          "Today, look at your last cycle's logged signals (cervical mucus, BBT, libido) on Luna's Insights screen. Notice the days before your ovulation marker — that's where your fertile window actually sat.",
        source: 'Wilcox et al., NEJM 1995; ACOG — Fertility Awareness Methods',
      },
      {
        n: 2,
        title: 'Cervical mucus is your best free signal',
        body: "Egg-white cervical mucus — stretchy, clear, slippery — peaks 1-2 days before ovulation when estrogen crests. It is biologically designed to keep sperm alive AND transport them through the cervix. If you're tracking only one fertility signal, mucus beats BBT (which confirms ovulation post-event) and LH strips (which catch the surge but not the days before). Most fertility apps' free tiers ignore mucus because it's qualitative; Luna doesn't.",
        practice:
          "Today, check your cervical mucus once (clean finger, just inside the vagina). Note the texture in Luna's Log. Even one data point gets you started; three cycles of tracking and you'll know your own pattern better than most providers do.",
        source: 'WHO — Cervical Mucus Method; Billings Ovulation Method',
      },
      {
        n: 3,
        title: 'What actually helps — the short list',
        body: "Most TTC content is noise. The evidence-based short list: prenatal vitamin with at least 400 mcg folate (start 3 months before trying — neural tube formation happens before most people know they're pregnant), regular sex across the fertile window (every 1-2 days beats once at 'peak'), within 3 BMI units of your healthy weight, limited alcohol (especially in the second half of the cycle), no smoking. Supplements beyond a prenatal — CoQ10, NAC, inositol — have evidence in specific clinical contexts (PCOS, low egg quality) but are not magic for everyone.",
        practice:
          "Today, audit your prenatal. Is it at least 400 mcg of folate (or methylfolate if you have an MTHFR variant)? Does it include iodine, choline, and vitamin D? If not, the upgrade matters more than any other supplement on the market.",
        source: 'CDC — Pre-Pregnancy Folate; Endocrine Society Fertility Guidelines',
      },
      {
        n: 4,
        title: 'When to ask for help',
        body: "The medical definition of infertility: 12 months of well-timed unprotected sex without pregnancy under 35, or 6 months over 35. Below those thresholds, patience and tracking are usually the right answer. At or above them, a workup is reasonable — testing CAN catch issues (low AMH, blocked tubes, sperm quality, thyroid) that won't resolve on their own. Asking earlier is also reasonable if you have a known condition (PCOS, endometriosis, irregular cycles, history of pelvic infection) — don't wait 12 months when there's a clinical reason to look sooner.",
        practice:
          "Today, write down how many fully-tracked cycles you've had (logged ovulation signals + timed sex within the fertile window). That's the number that matters — not how long you've been 'thinking about' trying. Calendar months feel longer than tracked cycles.",
        source: 'ASRM — Infertility Definition; NICE Fertility Guideline CG156',
      },
      {
        n: 5,
        title: 'Holding the timeline',
        body: "TTC is one of the few life experiences where the body is on its own clock and there's almost nothing you can do to accelerate it. That mismatch — the willingness to do anything for something that mostly requires waiting — is what wears people down. The emotional cost is real and tracked: people TTC report stress levels comparable to those of people with cancer diagnoses. Find a therapist who specializes in fertility if it's hard. Keep one room of your life that has nothing to do with trying.",
        practice:
          "Today, do one thing that has nothing to do with conceiving — see a friend, finish a book, go for a walk somewhere new. The waiting is the work, and you can't earn the result by trying harder. Protecting the rest of your life is part of holding the timeline.",
        source: 'Domar et al., Psychological Impact of Infertility; ASRM Patient Education',
      },
    ],
  },
]

// Helper — lookup a school by id.
export function getSchool(id) {
  return CYCLE_SCHOOLS.find((s) => s.id === id) || null
}

// Helper — phase to school suggestion. Returns the school whose phase
// matches the current phase, so Home can surface "the school that
// matches the week you're in." If multiple match, return the first.
export function schoolForPhase(phaseId) {
  return CYCLE_SCHOOLS.find((s) => s.phase === phaseId && !s.hidden) || null
}
