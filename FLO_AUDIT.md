# Flo audit — red team against Luna

**Date:** 2026-05-29
**Purpose:** Comprehensive deep-dive on Flo as Luna's nearest competitor.
Where Flo is strong (so we don't underestimate them), where Flo is weak
(so we know what to fix), and what Luna's path to a loyal user base
actually looks like in light of both.

Sources behind the analysis: Flo's public product pages, App Store
listings, the 2021 FTC settlement (US v. Flo Health) covering their
data-sharing with Facebook / Google / AppsFlyer / Flurry, post-Roe
press coverage on cycle-tracker subpoena risk, Reddit threads
(r/FloApp, r/PeriodTracker), App Store reviews (~5M total), Trustpilot,
medical-press coverage of period-tracker accuracy, and direct app
exploration.

---

## 1. What Flo actually ships

Comprehensive inventory so we're arguing against the real product, not
a strawman.

### Core cycle tracking
- Period start/end logging with predicted next period
- Fertile window prediction with confidence
- Ovulation day estimate (calendar + optional LH-strip integration)
- Flow intensity (light, medium, heavy) and color
- Spotting log separate from flow

### Symptoms — extensive taxonomy
The widest in the category. Categories include:
- **Mood:** happy, calm, energetic, frisky, mood swings, irritated,
  sad, anxious, depressed, feeling guilty, low energy, apathetic,
  confused, obsessive thoughts, self-critical
- **Energy:** exhausted, fatigued
- **Sex drive:** no drive, low, normal, high
- **Sex:** unprotected, protected, withdrawal, oral, masturbation,
  no sex, high libido, low libido
- **Physical:** everything (cramps, tender breasts, headache, acne,
  backache, nausea, bloating, fatigue, constipation, diarrhea, gas,
  insomnia, hot flashes, etc.)
- **Skin:** good skin, acne, dry, oily
- **Hair:** oily, dry, good
- **Digestion:** good, bloated, nauseated, constipated
- **Sleep:** good, restless, insomnia, short sleep
- **Cervical mucus:** dry, sticky, creamy, egg-white, watery
- **BBT:** numeric input
- **Birth control:** pill, IUD types, implant, ring, patch, shot,
  natural, condom, emergency contraception
- **Medications:** searchable database with reminders

This is overwhelming if presented at once, but it covers the long
tail of "I want to log this specific thing."

### Lifecycle modes
- Tracking (default)
- Trying to conceive (TTC) — fertile window highlighted, optimized
  for conception
- Pregnancy mode — weekly content, baby size comparisons (fruit/
  vegetables), kick counter, contractions timer, hospital bag,
  birth plan
- Postpartum — recovery tracking
- Perimenopause / menopause (added 2023) — hot flashes, hormone
  changes, doctor prep
- Birth control mode — different prediction logic

### Content layer
- ~1,200 articles in the library (estimate based on app browsing)
- "Daily Insights" — short cards on the home screen
- "Health Library" — searchable
- "Cycle Schools" — multi-day educational programs
- Audio courses (sleep, anxiety, body image)
- Doctor-vetted disclaimers throughout

### Community
- "Secret Chats" — anonymous chat (rebranded from Anonymous Chat
  after the 2021 Roe decision)
- Group discussions by topic (TTC, pregnancy, PCOS, etc.)
- Direct reply capability
- Moderation (mixed effectiveness)

### AI assistant
- "Ask Flo" — chatbot for ad-hoc health questions
- Powered by OpenAI under the hood (per their developer disclosures)
- Tries to answer "Why am I bloated?" / "Is this normal?" without
  requiring article search
- Quality varies — sometimes generic, sometimes inaccurate,
  occasionally helpful

### Analytics & reports
- Cycle history visualization
- Symptom pattern detection
- Trend graphs by symptom
- "Health Report" PDF export (Premium)
- Comparison to "average" women

### Integrations
- Apple Health (read steps, sleep, weight; write cycle data)
- Google Fit
- Fitbit (premium feature)
- LH ovulation strip companion
- Apple Watch app

### Notifications
- Period reminders
- Fertile window reminders
- Log reminders (daily)
- Educational nudges
- Pregnancy weekly milestones
- Heavily configurable, frequently overzealous in default state

### Premium (Flo Premium / Flo Premium+)
~$50-100/year depending on plan and promo
- Advanced reports
- Audio courses
- Expert articles (gated)
- Sleep analysis
- Anonymous Mode (added 2022 — strips email + creates anonymous
  account; this is privacy-as-paid-feature, which most ethicists
  call out as a moral failure)
- "Ask Flo" with higher daily limit
- Skin Advisor / Hair Advisor (newer)
- Exclusive courses

### Recent additions (2023-2025)
- Menopause mode
- Skin Advisor (AI-driven recommendations)
- Hair Advisor
- Sleep tracking deep-dive
- Anonymous Mode (paid)
- AI-driven content personalization

---

## 2. Where Flo is genuinely strong

Honest assessment. Not a strawman.

### 2.1 Massive content library
~1,200 articles is hard to match in MVP. The library covers the long
tail of "I have this weird question." Luna's library is intentionally
smaller — that can be a feature (curated, doctor-vetted, no SEO bait)
but it's also a cold-start weakness.

### 2.2 Symptom prediction confidence
~380 million users over a decade means their cycle predictions are
trained on more data than any competitor. Predictions feel
accurate-enough most of the time — sufficient that users trust them.

### 2.3 Lifecycle continuity
TTC → pregnancy → postpartum → menopause is real. Users don't have
to switch apps as life stages shift. Big retention moat.

### 2.4 Onboarding personalization
Asks ~25-30 questions during signup (goal, conditions, age, etc.)
and uses them to personalize content. Long onboarding is unusual
but it builds investment ("I told them so much already") and lets
the home screen feel curated from day one.

### 2.5 Community feature works
For all its moderation flaws, anonymous chat answers a real need.
Especially for TTC, fertility struggles, miscarriage, postpartum
depression — topics women often can't talk about with their
in-person network. The retention impact of community is large.

### 2.6 AI assistant is sticky even when imperfect
"Ask Flo" gets used because it's frictionless — type a question,
get an answer. Even if the answer is mid-quality, the *interaction
pattern* is sticky in a way articles aren't.

### 2.7 Polished UI on the surface
The visual design is competent and consistent. The pink palette
isn't to every taste, but it's coherent and recognizable.

### 2.8 Cross-platform parity
Web app, iOS, Android, Apple Watch all maintained. Luna is currently
PWA-only on the web (Capacitor wrappers planned but not shipped).

### 2.9 Symptom taxonomy depth
Flo lets you log "obsessive thoughts" as a mood. The taxonomy goes
deep enough that almost any symptom has a checkbox. This matters for
the small % of users who track aggressively — they tell others.

---

## 3. Where Flo is weak (the red team)

This is where Luna can win, if we don't repeat the same mistakes.

### 3.1 The privacy disaster (load-bearing)
**The 2021 FTC settlement** (US v. Flo Health, Inc.) found that Flo
shared sensitive cycle and pregnancy data with Facebook (via Custom
App Events), Google Analytics, AppsFlyer, and Flurry between 2016
and 2019 — despite explicit privacy promises to users. The settlement
required Flo to notify affected users (~100M people), get explicit
consent for any future sharing, and undergo independent audits.

This is the single largest fact about Flo. **Most women who care
about privacy do not trust them, and post-Roe, the share of women
who care has grown sharply.** State prosecutors have signaled
willingness to subpoena cycle data in jurisdictions where abortion
is restricted. Flo has tried to address this by introducing
Anonymous Mode (paid) but that's *privacy as a paid feature*, which
reads as bad faith.

**Luna's wedge:** "Built after Roe, by people who know what's at
stake. Privacy isn't a paid tier — it's the floor."

### 3.2 Optimization framing throughout the product
Flo's voice is *manage your cycle, hack your hormones, optimize
your day.* "Best time for productivity." "Peak for performance."
"Use your follicular phase strategically."

This is the productivity-bro vocabulary applied to women's bodies.
Many users — especially the older / more reflective demographic —
find this alienating. It also clashes with the literature on
intuitive embodiment, which is what wellness research actually
supports.

**Luna's wedge:** Doula tone, not taskmaster. "Your body is doing
something quiet and demanding." This is the voice Flo cannot pivot
to without a brand reinvention.

### 3.3 Notification spam
Flo's default notification posture is aggressive: daily log
nudges, fertile window pings, "your friends in luteal need
support" type emails, premium upsell pushes. App Store reviews
repeatedly mention this as the #1 turn-off.

**Luna's wedge:** Quiet by design. Currently we don't fire any
notifications (toggles are stubs). When we do wire them up, the
defaults stay off, and the copy stays soft.

### 3.4 UI clutter
The Flo home screen has 8-12 distinct cards at any time — daily
insights, articles, premium upsell, community posts, AI prompts,
log reminders, sponsored content (sometimes), Cycle Schools
promos. It's overwhelming and a frequent complaint.

**Luna's wedge:** Curated, restrained, three cards on Home. We
just made that change deliberately.

### 3.5 SEO-bait content
A large fraction of Flo's article library reads as SEO content
optimized for "Google search for cramps" rather than written for
the reader. Titles like "8 Things Your Period Says About You"
hit but rarely land deep.

**Luna's wedge:** Smaller library, doctor-vetted, editorial-quality
writing. Quality-over-quantity is a real defensible position.

### 3.6 AI quality issues
"Ask Flo" gives plausible-sounding answers that are sometimes
wrong. There are documented cases of it recommending things a
clinician would not endorse. Health AI is a risk area where Flo
is moving fast.

**Luna's wedge:** If/when we add AI, do it slowly with explicit
safety guardrails. Crisis-keyword detection, "not medical advice"
framing, escalation to provider resources — all already in our
PRELAUNCH plan.

### 3.7 Community moderation
Secret Chats has been called out for misinformation, harmful
diet advice, and occasional harassment that takes too long to
remove. Anonymous chat at scale is genuinely hard to moderate.

**Luna's wedge:** Don't ship community in v1. If/when we do, it's
small, moderated, and probably topic-bounded. (See section 5.)

### 3.8 Pregnancy content depth
Flo's pregnancy mode is shallow — weekly content + size comparisons
+ a few tools. The actual *companion experience* for nine months is
thin. Luna's PRELAUNCH plan calls out a deep pregnancy mode for v1.1
with kick counter, appointment tracker, weight log, blood pressure
log, pregnancy-specific HealthWatch, birth plan builder — this
already plans to leapfrog Flo here.

### 3.9 Dark patterns in cancellation
App Store reviews and Reddit threads mention difficulty canceling
Flo Premium. Apple/Google rules are tightening on this but it has
been an ongoing complaint.

**Luna's wedge:** RevenueCat handles cancellation cleanly. Make
this explicit — "one tap to cancel, anytime."

### 3.10 Russian / Belarusian origin
Flo Health is registered in the UK now, but founded in Belarus.
Some users — especially in the US and EU — are uncomfortable with
sensitive health data having any connection to a Belarus-linked
team, post-2022. This is unfair to the engineers but real in
user perception.

**Luna's wedge:** Honest about who is behind Luna. A small,
identifiable team, transparently US-based or wherever you incorp.

### 3.11 Body-image and cultural issues
Flo content has been called out for fatphobic framing
(weight-loss advice attached to luteal cravings), gender
essentialism (assumption that all users want pregnancy
eventually), and ableist language around fertility.

**Luna's wedge:** Voice work we already did. Plus an editorial
review pass on the article library before launch for these
specific issues.

### 3.12 Data-greedy integrations
Flo pushes Apple Health integration aggressively, and reads quite
a lot once permission is granted (steps, sleep, weight, BP, blood
glucose). Some users perceive this as data-greedy.

**Luna's wedge:** Either skip Apple Health entirely in v1 (cleaner
story) or make integration explicit, opt-in, and minimal (just
period write-back so cycle shows up in Apple Health, no reads).

### 3.13 Anonymous Mode is a paid privacy feature
Privacy as a Premium tier reads as bad faith. Many of Flo's
ethicist critics consider this disqualifying.

**Luna's wedge:** Privacy floor is the same for everyone. Period.

---

## 4. Gap analysis — what Luna is missing vs. Flo

Honest list. Doesn't mean we build all of it — see section 5.

| Feature | Flo has | Luna has | Notes |
|---|---|---|---|
| Period prediction | ✓ deep ML | ✓ basic math | Ours fine for MVP; ML refinement later |
| Symptom taxonomy | very deep | moderate | Expand selectively; not all of Flo's options are useful |
| Cervical mucus | ✓ | ✓ | Parity |
| BBT | ✓ | ✓ | Parity |
| Library articles | ~1,200 | ~8 | **Big gap** — bridge by being curated, not by matching volume |
| TTC mode | ✓ | ✗ | Should ship v1.0 or v1.0.1 — it's a flip in onboarding + fertile window emphasis |
| Pregnancy mode | shallow | shallow | Both shallow today; Luna's v1.1 plan is to leapfrog |
| Postpartum | basic | ✗ | v1.1 |
| Menopause | basic | ✗ | v1.2+ |
| Anonymous chat | ✓ | ✗ | Likely skip — see section 5 |
| AI assistant | ✓ (Ask Flo) | ✗ | Plan post-launch v1.1 with safety guardrails |
| Apple Health | aggressive | ✗ | Decide deliberately — see section 5 |
| Apple Watch | ✓ | ✗ | v1.1+ |
| Audio courses | ✓ (Premium) | ✗ | Skip in v1, evaluate later |
| Cycle Schools | ✓ | ✗ | Could ship as a "weeklong gentle program" later |
| Doctor PDF export | ✓ (Premium) | ✓ (free) | We're already ahead — keep free |
| Cross-platform | iOS/Android/Web/Watch | PWA + Capacitor planned | Capacitor work in progress |
| Skin/hair advisors | ✓ | ✗ | Skip — these feel like product creep at Flo |
| Med tracking | ✓ | ✗ | Could add later if users ask |
| Kick counter (preg) | ✓ | ✗ | v1.1 with pregnancy deep-dive |
| Birth plan builder | ✓ | ✗ | v1.1 with pregnancy deep-dive |
| Weight tracker | ✓ | ✗ | Risky — fatphobia exposure. Hold unless requested |

---

## 5. Where Luna wins — the strategic recommendation

Five wedges, in priority order. Build to these. Skip everything else.

### Wedge 1: Privacy and tone (the brand)
**Already in motion.** Privacy Policy rewritten. Voice rewritten.
The Welcome screen and Home now read like a doula, not a
productivity app. This is the brand and the marketing wedge.
**No further code required to win on this — just protect it.**

What to do:
- Don't accept any future feature that requires advertising
  pixels, third-party analytics that send content, or affiliate
  tracking. Anything that walks toward Flo's 2021 mistake is a
  no.
- Don't paywall privacy. Anonymous Mode is for everyone.
- Marketing copy leans into this directly: "After Roe, your cycle
  data shouldn't be on the open market. Luna was built knowing
  that."

### Wedge 2: Quality over quantity in content
Don't try to match Flo's 1,200 articles. Build 30-50 *deep*,
doctor-vetted, editorial-quality pieces over the next 6 months.
Read like a New Yorker health column, not Web MD.

What to do:
- Ship the existing 8 articles polished, source-cited.
- Commission 1-2 articles per month from clinicians who can be
  bylined. Real authorship matters here.
- Topic priorities: PMDD (we have), endo (we have), iron (we have),
  PCOS (we have), perimenopause early signs (gap), birth control
  side effects (gap), sex post-menopause (gap), mental health x
  cycle (gap), abnormal bleeding (gap).
- "Cycle Schools" equivalent later as a 5-day gentle program:
  "Understanding your luteal phase" / "Pregnancy first trimester
  honestly" / "After your first postpartum bleed."

### Wedge 3: When something feels off (Health Watch as a signature)
Flo doesn't have a deliberate symptom-to-doctor pipeline. We do.
The doctor-ready PDF + the "find words for what you're feeling"
framing is unique. Lean in.

What to do:
- Expand the RED_FLAGS list (currently ~20 items). Aim for 40-50
  covering: PMDD, endo, fibroids, PCOS, perimenopause symptoms,
  postpartum red flags, iron deficiency, thyroid, pelvic floor.
- Polish the PDF export. Sample-doctor-visit framing — "Here's
  what to say in the room."
- Surface a soft Home prompt when a logged symptom matches a flag
  pattern: "We noticed [pattern]. Worth a conversation?"

### Wedge 4: Pregnancy companion (v1.1 flagship)
PRELAUNCH already has this. Don't drop it.

What to do:
- Build the Tier 1 + Tier 2 features in the existing pregnancy
  deep-dive plan — kick counter, appointment tracker, weight
  log (carefully, with gentle framing), BP log, pregnancy-specific
  HealthWatch, birth plan builder.
- Editorial: 30-40 pregnancy articles. Real writers, real
  clinicians. This is the v1.1 launch hero.

### Wedge 5: AI companion done slowly
Don't rush "Ask Luna." Flo's Ask Flo is a cautionary tale — fast,
broad, sometimes wrong. Luna's version should be:
- Slow rollout, Pro-only at first
- Strict system prompt: empathy without diagnosis, no dosing,
  crisis-keyword escalation to hotlines and providers
- Anthropic Claude (Haiku for cost, Sonnet for harder topics) with
  zero-retention enabled
- Context optionally attached (opt-in per conversation)
- Daily rate limit per user
- "Not medical advice" framing throughout

PRELAUNCH already specifies most of this. Execute it carefully
in v1.1.

---

## 6. What to skip deliberately

Things Flo has that Luna should *not* build, at least not in v1.

### 6.1 Anonymous chat / community
The moderation cost is real and the harm exposure is significant.
Misinformation on women's health is well-documented in unmoderated
community spaces. If we're "a wise older sister," the answer to
"my friends sound wrong about this" is good editorial content, not
a chat room.

If we ever revisit this, do it as topic-bounded moderated forums
with named moderators — not anonymous chat. And not in v1.

### 6.2 Skin Advisor / Hair Advisor
Product creep. Flo added these because growth flattened and they
needed new SKUs. Luna doesn't have that pressure. Skip.

### 6.3 Audio courses
Calm and Headspace do this better. Don't try to be them.

### 6.4 Apple Health deep integration
For v1, skip. Maybe v1.1 add narrow opt-in write-back so period
data shows up in Apple Health if the user wants it there. Do not
read steps / sleep / weight / BP from Apple Health — that's data
greed and brings privacy exposure.

### 6.5 Weight tracker (general)
Risky for body-image reasons. The pregnancy version is necessary
(provider-recommended weight gain ranges are real medical guidance)
and we'll do it carefully there. Outside pregnancy, skip.

### 6.6 Sponsored content / partnerships
The line "Luna will never run ads or sponsored content" is part of
the wedge. Hold it.

---

## 7. Retention and loyalty mechanics

What actually keeps users.

**Flo's retention loop:** notification → app open → daily log → article
read → optional community → premium upsell. Daily-active driven by
the log nudge.

**Luna's retention loop should be:** quiet daily check-in (no
nudge by default, but easy when the user opens the app) → reading the
contextual phase line → reading a curated card if it lands → coming
back to log when their body changes. *Weekly active is fine.*

Trying to beat Flo on daily-active is the wrong fight. We win on
*emotional resonance per session* and *life-stage continuity over
months/years.* Users stay with Luna because Luna got them through
PMDD diagnosis / pregnancy / postpartum, not because Luna pinged
them seven times a week.

What to invest in for retention:
1. **Voice consistency** across surfaces. Already underway.
2. **Personalization that compounds**: as the user logs more, the
   contextual line, the "for today" cards, and the HealthWatch
   pattern detection should get more specific to *them*. This is
   where we already-have-the-data should pay off.
3. **Real anniversary moments**: "It's been six months since you
   started logging with Luna. Here's what we've noticed together."
   Not "streak preservation" gamification — meaningful reflection.
4. **Pregnancy / TTC / postpartum transitions handled gracefully**.
   The moment a user switches modes is a high-emotional-stakes
   moment; nailing that earns lifelong loyalty.
5. **Doctor PDF as a delight feature**. The first time a user
   exports a PDF that genuinely helps them in an appointment, they
   tell other women. Word-of-mouth is the only marketing that
   works in this category — see the next section.

---

## 8. Acquisition reality check

Cycle trackers are won by word of mouth, not advertising. Flo spent
$XXm+ on paid acquisition over the years and got there. Luna will
not outspend Flo. We need word-of-mouth that's *better than Flo's
default*, which means giving users a story they want to tell.

The story is: **"I switched to Luna because I didn't want my cycle
data on the open market, and the app actually feels like it cares
about me."** That's a sentence women will repeat. It's not a sentence
about Flo.

What to do:
1. **Privacy story front and center** in landing-page copy, App
   Store description, and any press.
2. **Editorial press, not paid press.** Pitch to women's-health
   journalists. Specifically Erika Hayasaki, Cecile Richards, Lily
   Loofbourow types who cover post-Roe cycle-tracking concerns.
3. **Doctor referrals.** Build relationships with OB-GYNs willing
   to recommend Luna to patients who ask "should I track my cycle?"
   (This is also a path to clinical content credibility.)
4. **Single-feature TikTok moments.** "Wondering if your period
   has arrived." (Home nudge) and the doctor PDF export are the
   two strongest single-feature shareable moments we have.

---

## 9. The 12-month roadmap implied by this

**v1.0 (launch, next 2-3 weeks):**
- Ship what we have, plus expand HealthWatch RED_FLAGS list to ~40
- Editorial polish on existing 8 articles + commission 4 more
- Capacitor wrappers shipped to TestFlight / Play internal

**v1.0.1 (1 month post-launch):**
- TTC mode — onboarding mode selector + fertile window emphasis
- 2-3 more articles
- Wire up basic notifications (period reminder, with quiet defaults)

**v1.1 (3-4 months post-launch):**
- Pregnancy companion deep-dive (Tier 1 + Tier 2 from PRELAUNCH)
- 20-30 pregnancy articles commissioned
- AI companion "Talk to Luna" beta (Pro-only, gated, careful)

**v1.2 (6-9 months post-launch):**
- Postpartum mode
- 5-day "Cycle School" program (luteal)
- 5-day "Pregnancy school" program (first trimester)

**v1.3+ (9-12 months):**
- Perimenopause mode
- Apple Health narrow integration (opt-in, write-only)
- Possibly Apple Watch app
- Possibly small moderated community surface (TBD)

This roadmap is opinionated. Update as we learn from users.

---

## 10. The one-sentence summary

**Flo is the broad scale-out competitor with a privacy disaster, a
productivity-app voice, and content quality that doesn't match its
volume. Luna's path to loyal users is not to match Flo's surface
area — it's to be the calm, doctor-grounded, privacy-credible
companion that women actually want to recommend to their friends
after Roe. Win on voice, privacy, and the moments that matter
(symptom-to-doctor, pregnancy, transitions). Skip community, ads,
skin advisors, and any data integration that walks toward Flo's
2021 mistake.**
