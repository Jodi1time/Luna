# Luna — Product Requirements

The north star for *what* Luna is and *why* each piece exists. Pairs
with `docs/BRAND.md` (how it looks) and `PRELAUNCH.md` (what's left to
ship). When a feature decision is unclear, it should be resolvable here.

---

## 1. Vision

**Luna is the privacy-first, doctor-grounded companion for the body you
live in** — and, over time, the front door to actual women's care.

Post-Roe, in a category where the market leader (Flo) monetizes user
data, Luna's wedge is trust: anonymous by default, encrypted, sourced,
and written in a voice that validates before it informs. The cycle
tracker is the acquisition layer; chronic-condition depth is the
retention layer; care coordination (labs, telehealth, prescriptions) is
the eventual revenue layer. See the staged strategy in project memory.

Parent company: **Gloria**. App Store: **"Luna by Gloria."**

---

## 2. Who it's for

- **Primary:** women who've been failed by the current options — by Flo
  selling their data, by doctors dismissing them, by apps that treat the
  body as a fertility vending machine.
- **Highest-value segments (chronic = retention):** PCOS (the beachhead),
  then endometriosis, then peri/menopause. These are lifelong, underserved,
  and evangelical communities.
- **Also served:** general cycle tracking, TTC, pregnancy, avoiding.

---

## 3. Principles (load-bearing — violating these breaks the product)

1. **HAVEN, not classroom.** One idea per surface; depth one tap away.
   A doula's voice, not a textbook's. Never name Luna's tone in copy.
2. **Privacy is the product, not a feature.** Anonymous by default. Never
   sell or share. Diary entries never leave, even in the share feature.
3. **Honesty over engagement.** No dark patterns, no fake urgency, no dead
   toggles. The accuracy receipt shows the misses. We'd rather be trusted
   than sticky.
4. **Validation before information.** Meet the feeling first.
5. **Ship don't ask** for aligned work; confirm for schema, money,
   branding, positioning, destructive actions.
6. **Native mobile is the product**; the website is plumbing.

---

## 4. What Luna is (shipped)

- **Adaptive cycle engine** — weighted-recency length, variance-aware
  predictions, triangulated ovulation (BBT + mucus + libido), all
  unit-tested. The **accuracy receipt** backtests its own predictions.
- **Birth-control-true cycle** — per-method models (pill/patch/ring,
  Depo, IUD, implant, mini-pill) across Home, Calendar, Insights. No
  competitor shows a Depo user her real timeline.
- **PCOS Deep Mode** — Rotterdam-aware pattern read, bloodwork + HOMA-IR,
  medications, doctor-script generator. (Pre-clinical care infrastructure.)
- **Conditions Atlas**, **Library** (doctor-bylined), **Insights**
  (cycle wheel + pattern detection), **Calendar**, **Log** (multi-mood,
  body-literacy micro-lessons), **Reflect** (evidence-based practices),
  **Journal** (photos + voice + themes), **Care** (checkup tracker),
  **Health Watch** (red-flag screener → doctor PDF), **8 helpers**,
  **Share with someone** (server-enforced privacy), **pregnancy tools**.
- **First-week arc** — three quiet moments that counter week-one churn.
- **AI** ("Talk to Luna", the daily thought) — Claude Haiku Edge Function,
  graceful static fallback. *Pending deploy.*

---

## 5. What Luna is deliberately NOT

No community/forum. No partner-surveillance mode (Share is the inverse).
No mascot. No skin/hair product creep. No optimization/productivity
framing. No diet/weight-loss framing in PCOS. No notifications the user
didn't ask for. No contraception-effectiveness claims (regulatory).

---

## 6. Success metrics (see ANALYTICS.md for the dashboard)

The honest targets, in order:
1. **D30 retention ≥ 40%** (category avg ~25–30%). The fundraising number.
2. **Cycle-2 survival ≥ 60%** of week-one keepers — the cliff trackers die on.
3. **3+ logs/week** — the strongest leading indicator of long-term retention.
4. **Word-of-mouth share** — % of new users arriving via a share invite or
   referral, not paid. Conditions communities are the engine.

Not chased: raw DAU, streaks, session count. Luna's promise is quiet.

---

## 7. Roadmap (post-launch, in recommended order)

1. **Launch** — deploys, device walk, store assets.
2. **PCOS user testing** (5–10 women) — first conversation with the
   community we intend to own.
3. **Endometriosis Deep Mode** — body-map pain tracking; mirrors PCOS.
4. **Perimenopause** — *recommended before pregnancy v1.1*: 10-year LTV,
   highest disposable income, most dismissed demographic, almost no
   competition. (Founder's call.)
5. **The care bridge** — at-home labs + telehealth referral, capital-light,
   revenue-share. The conversion number that earns a Series A.
6. Pregnancy v1.1, Spanish localization, employer channel — later.

---

## 8. Open decisions for the founder

- Perimenopause vs. pregnancy as condition #3 (recommendation: peri).
- Section-color loudness (the `WASH` knob) — tune on a real device.
- When to flip `isPro` to gated (needs RevenueCat live first).
- Gloria parent-corp domain + `privacy@gloria.app`.
