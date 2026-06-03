# Luna pre-launch checklist

Things to do/decide before opening Luna to the public. Keep this updated as items land or new ones appear.

**Branding decision (2026-05-30):** Luna is the product name; **Gloria** is the parent / operating company (named after the founder's mother). App Store listing reads **"Luna by Gloria"**, which solves the discoverability problem in a crowded "Luna" search space while keeping the product name simple. Bundle id moved from `com.luna.app` → `app.gloria.luna`. Contact email placeholder switched from `privacy@luna.app` → `privacy@gloria.app`. Legal docs (Privacy Policy + Terms) now name Gloria as data controller / operator.

## Status

**Last review:** 2026-05-29

The core data layer is launch-ready. Several user-facing flows
(billing, real legal review, monitoring) still need to be addressed
before public launch. **Distribution is now App Store + Play Store**
(decided 2026-05-25) — Luna will ship as a native app, not just a
PWA. See "Native app distribution" section below for the work this
entails.

**Distribution + billing decisions (2026-05-27):** native via Capacitor
(decided 2026-05-25) → in-app subscriptions via RevenueCat + native IAP
(not Stripe, per Apple/Google rules for digital subscriptions sold in-app).

**Data architecture change (2026-05-29):** moved from on-device
encrypted vault (passcode-derived key, never left the device) to
server-side storage on Supabase, encrypted at rest by Supabase's
infrastructure, gated to the signed-in user by Postgres row-level
security. Rationale: the on-device model meant signing out, deleting
the app, or switching devices wiped a user's cycle data — a hostile
experience that contradicted what users expect from any modern app.
The trade-off: Luna can technically decrypt user data to serve it,
which is the same threat model as Flo / Clue / Apple Health / Strava
and is reflected honestly in the rewritten Privacy Policy. See
"Server-side storage" section below for what remains before launch.

## Security audit · 2026-05-25 (updated 2026-05-29)

Findings & status:

- [x] No secret keys in client source. Only the Supabase anon key is
      shipped (public by design, gated by RLS).
- [x] No `dangerouslySetInnerHTML` anywhere — React auto-escapes.
- [x] CSV export now defuses formula-injection prefixes (`=+-@`)
      via `csvCell()` helper before writing.
- [x] PDF export wraps all template interpolations in `htmlEscape()`
      as a defensive layer.
- [x] Input validation centralized in `src/lib/validation.js` with
      length caps, email format, BBT range. Used in Onboarding, Auth,
      Log.
- [x] RLS policies updated 2026-05-29 for the server-side model:
      `profiles` — SELECT/UPDATE/INSERT by owner, DELETE denied
      (account deletion goes through the Edge Function).
      `logs` — full CRUD by owner (users edit and delete their own
      logs from the UI).
- [x] Code splitting: most non-tab screens lazy-loaded via
      React.lazy. Main bundle reduced by ~30-40%.

Not done in this pass (require server or external services):
- Sentry / error monitoring (already in Critical for launch)
- API latency monitoring (no client-side metric collection)
- Penetration testing / third-party security audit
- WAF / rate limiting beyond Supabase's defaults
- Account-deletion Edge Function (Critical for launch)
- Rotate the Supabase anon key (Critical for launch)

## Critical for launch

- [ ] **Real legal review of the Privacy Policy + ToS by counsel** — drafts now live in the app at Settings → Privacy Policy / Terms of Service, but they need lawyer eyes before public launch
- [x] **Supabase Edge Function for true server-side account deletion** — deployed 2026-05-27. Reachable at `/functions/v1/delete-account`, wired into Settings → Delete my account.
- [ ] **In-app subscriptions via RevenueCat + native IAP** — code shipped (`src/lib/revenuecat.js`, Paywall wired to call `purchasePackage()` with restore link + entitlement sync). Setup walkthrough in `REVENUECAT_SETUP.md`. Still need: RevenueCat dashboard config, App Store + Play Console product setup, plugin install (after Capacitor platforms added), and flipping `isPro: true` → `false` once real purchases work.
- [x] **Email confirmation decision (2026-06-03): SKIP email confirmation** — matches Flo / Clue / Whoop / industry default for consumer wellness apps. Verify-in-background was a facade (Jodi's framing — user can use the app without being signed in); strict confirm-before-entry is the friction it was designed to avoid. *Action item:* Jodi to flip Supabase dashboard → Authentication → Providers → Email → **"Confirm email" OFF**. Code already handles this — Auth.jsx + Onboarding.jsx propagate `data.session` to the store when returned, Settings shows the signed-in email. Resend SMTP confirmed working 2026-06-03; stays in service for password reset emails. Defensive "Check your email" fallback paths and the Settings "Verify email" row are preserved in case the toggle is ever flipped back.
- [ ] **Rotate the Supabase anon key** — deferred. Anon key is public by design (RLS is the actual security boundary, now load-bearing for user data after the 2026-05-29 architecture change). Hygiene-only rotation; do it before public launch. Note: requires JWT secret reset → invalidates all signed-in sessions.
- [x] **Domain live: `lunadiary.app`** (purchased + DNS configured + HTTPS enforced 2026-05-29). Luna serves at https://lunadiary.app with valid Let's Encrypt cert. Still need: update Supabase auth redirect URLs to use the new domain.
- [x] **Sentry error monitoring** — DSN wired up 2026-05-27. ErrorBoundary reports via `reportError`. PII scrubbing (email patterns in messages + stacktraces) is in place via `beforeSend`. Sample rate: 10% traces, 0% session replay, replay-on-error 10%.
- [x] **PostHog product analytics** — DSN live 2026-05-29. Code in `src/lib/posthog.js`, Settings toggle wired, captures at onboarding_completed / log_saved / paywall_viewed / pro_subscribed. Privacy posture: **on by default** (changed 2026-05-30 — event categories only, never user content), switchable in Settings → Privacy → Anonymous analytics. BLOCKED_KEYS scrub layer + 64-char string filter as defensive guardrails. Reset on sign-out + account delete.

- [ ] **EU consent banner for analytics + Sentry (GDPR / ePrivacy)** — load-bearing for any EU launch. Even though our analytics is event-category-only and never sees user content, GDPR + ePrivacy require explicit opt-in consent for ANY analytics/tracking that persists state to the user's device. Implementation needed before EU traffic:
      - Soft consent prompt on first launch ("We use anonymous product analytics to know what's working. Event names + categories only — never your cycle data, never your name. Accept / Decline.")
      - Defaults: ON for non-EU; explicit choice for EU (we can geo-detect via Cloudflare's CF-IPCountry header or accept-language). For US-only soft launch this can be deferred; for any EU rollout it's required.
      - Persist the consent choice in profiles.settings.analyticsConsent so we don't re-ask.
      - Estimate: ~half day of work. Don't ship to EU users without it.
- [ ] **Real iPhone/Android device testing pass** — particularly the Face ID PRF biometric unlock flow on actual hardware
- [ ] **Wrap as native app via Capacitor for App Store + Play Store distribution** — see "Native app distribution" section below. Replaces the PWA-only path. Required so we can use native Face ID without the iOS WebAuthn sheet.

## Authentication & accounts

- [x] **Email confirmation: decided to skip (2026-06-03)** — see "Critical for launch" section. Matches consumer wellness industry default. Action remaining: Jodi flips Supabase toggle OFF.

- [x] **Vault passcode recovery path** — no longer applicable. Data
      lives on the server; sign-in is the gate. Standard "forgot
      password" email reset works (already wired in Auth.jsx via
      `requestPasswordReset`).

## Privacy / security

- [x] **Update privacy article copy** ([src/data/lunaData.js](src/data/lunaData.js) `id: 'privacy'`) — rewritten 2026-05-29 to honestly reflect the server-side storage model.
- [x] **Update Privacy Policy + Terms** ([src/screens/PrivacyPolicy.jsx](src/screens/PrivacyPolicy.jsx) + [src/screens/Terms.jsx](src/screens/Terms.jsx)) — rewritten 2026-05-29 to drop the on-device-encryption claim and disclose that data is server-side, encrypted at rest, and may be subject to lawful process.

- [ ] **Rotate the Supabase anon key** (anon key was pasted into this conversation; safe to rotate before launch as a hygiene step)

- [ ] **Review CSP / security headers** (GitHub Pages doesn't let us set these; consider Cloudflare in front if needed)

## Domain / hosting

- [ ] **Fix `jodi.com` DNS or remove CNAME**
  - CNAME currently points to `jodi.com` (in `public/CNAME`) but DNS doesn't resolve
  - Decide: real custom domain or delete CNAME and stick with `jodi1time.github.io/Luna/`

- [ ] **Consider migrating off GitHub Pages**
  - Pages is fine for testing, but no custom headers, no edge functions, no analytics
  - Cloudflare Pages or Vercel would give more flexibility for free
  - Becomes more important if we add server-side things (Stripe webhooks, push notifications)

## Payments / Pro

- [ ] **In-app subscriptions via RevenueCat + native IAP** (decided 2026-05-27)
  - App Store and Play Store both forbid Stripe for digital subscriptions sold inside the app
  - Apple StoreKit + Google Play Billing are mandatory; both take 15-30%
  - RevenueCat (free up to ~$10k MRR) handles cross-platform subscription state
    with one JS API
  - Steps:
    1. Create RevenueCat account, set up Luna project
    2. Configure App Store Connect + Play Console with subscription products
    3. `npm install @revenuecat/purchases-capacitor`
    4. Wire Paywall.jsx to call `Purchases.purchasePackage()`
    5. Subscription state syncs from RevenueCat → set `isPro` in store
  - Stripe NOT used for in-app — kept as an option only for any future
    web-only checkout (luna.com sign-up flow, B2B sales, etc.)

## Server-side storage (shipped 2026-05-29)

The on-device encrypted vault was replaced with Supabase-backed
storage. `src/lib/cloud.js` is the data layer; `useLuna.hydrateFromCloud()`
pulls profile + logs on signin; mutations write through to the
server via `fireAndForget()` so the UI never waits on the network.
Local storage is a cache for cold-paint speed; the server is the
source of truth. Schema lives in `supabase-schema.sql`.

Still open:
- [ ] **Run the new schema in the live Supabase project** — apply
      the `alter table public.profiles add column …` block and the
      `create table public.logs …` block from `supabase-schema.sql`.
      Idempotent (`if not exists` everywhere) so safe to re-run.
- [ ] **Verify the `handle_new_user` trigger still fires** — it
      already existed, but worth a smoke-test signup to confirm a
      new `profiles` row lands.
- [ ] **Real multi-device live sync** — current model is "sign-in
      hydrates from cloud, writes go straight to cloud, no live
      push." If a user has Luna open on two devices simultaneously,
      writes don't propagate across until one re-signs in. Use case
      is rare (cycle trackers are personal-device tools) but
      Supabase Realtime subscriptions would close the gap if needed.
      Defer to v1.1 unless users actually ask.

## Luna assistant (post-launch AI companion)

- [ ] **"Talk to Luna" — empathetic AI companion** (deliberate post-launch feature, not MVP)

  Vision: a friend-tone AI inside the app for questions, complaints, encouragement, and
  general support — feels like texting a knowledgeable friend who gets what cycles are like.
  Especially powerful for the luteal/menstrual stretch when users need a soft place to land.

  **Architectural load-bearing decisions (settle these BEFORE writing code):**

  1. **Privacy posture.** The rest of Luna is "your data never leaves the device." AI inherently
     means sending messages to a model API. Need clear in-product framing: "AI mode is opt-in,
     per-conversation. Your stored cycle data is never auto-attached unless you toggle it."
     Apple Intelligence is the reference for honest UX around cloud-processed content.
  2. **Provider + retention.** Use Anthropic Claude (Haiku for cost, Sonnet for harder topics)
     with zero-retention enabled. Strip identifiers; send only the message content plus
     optional user-supplied cycle context.
  3. **Safety guardrails.** Health context = high risk. System prompt enforces: empathy without
     diagnosis, no dosing or drug-interaction advice, escalation to provider/crisis lines on
     red-flag keywords (PMDD severity, suicide ideation, severe pain). Mirror the existing
     HealthWatch flag set as in-prompt knowledge. Visible "not medical advice" framing.
  4. **Cost model.** ~$0.01–0.05 per conversation with Haiku. Realistically a Pro feature.
     Gives Pro tangible value beyond "more articles." Need server-side rate limiting per user
     to bound costs.

  **MVP scope (~1 week post-launch):**
  - Text chat only (no voice in v1)
  - Pro-only with daily/monthly message cap
  - System prompt curated for tone + safety
  - Optional toggle: "Share my current phase with Luna" (per-conversation, off by default)
  - Crisis keywords → suicide/crisis hotline + therapist resources, override AI response
  - Conversation history stored locally in the encrypted vault (Luna companion knows context
    across sessions on this device, server holds nothing)

  **v2 ideas:**
  - Voice input/output (Web Speech API + TTS)
  - Proactive encouraging messages during luteal/menstrual (local scheduling, curated copy,
    not AI — keeps costs flat and tone controlled)
  - "Vent / journal" mode that helps surface patterns over time
  - Complaint logging that feeds back into symptom tracking

## Native app distribution (App Store + Play Store)

Decision (2026-05-25): Luna ships as a **native app** on both stores,
not just a PWA. Reason: native Face ID without the iOS WebAuthn
permission sheet, plus the trust/discovery/billing advantages of
being in the official app catalogues.

**Approach: Capacitor wrapper around the existing React/Vite codebase.**
We don't rewrite — the web app becomes the UI inside a thin native
shell that exposes platform APIs (Face ID, notifications, App Store
billing, etc).

### Capacitor setup

- [ ] **Install Capacitor and initialize native projects**
  - `npm install @capacitor/core @capacitor/ios @capacitor/android`
  - `npx cap init Luna com.luna.app --web-dir=dist`
  - `npx cap add ios && npx cap add android`
  - Each platform creates a native project folder (ios/, android/)
    committed to the repo
- [ ] **Update build pipeline**
  - `npm run build` produces dist/ as before
  - `npx cap sync` copies dist/ into both native projects
  - iOS opens in Xcode (`npx cap open ios`); Android in Android Studio
- [ ] **Replace WebAuthn biometric with native LocalAuthentication**
  - Use `@capacitor-community/biometric-auth` or similar
  - Native Face ID has no permission sheet — opens app → face scan
    runs immediately → unlocked. Exactly what users expect.
  - Wrap the existing `enrollBiometric` / `unlockWithBiometric`
    functions in `src/lib/biometric.js` so the JS API stays the
    same; the implementation calls the native plugin in the wrapped
    build and falls back to WebAuthn in the PWA build.
- [ ] **Capacitor splash screen plugin**
  - Replaces the iOS apple-touch-startup-image PNGs we made — native
    splash is more reliable and instant. Same brand mark.

### iOS / App Store

- [ ] **Apple Developer Program enrollment** — $99/year. Required to
      publish to App Store. ~24-48 hour approval after first signup.
- [ ] **App Store Connect setup**
  - Create the app record, bundle ID (`com.luna.app` reserved)
  - App icons in all required sizes (1024×1024 marketing icon plus
    in-app sizes — Capacitor generates the latter)
  - Screenshots: 3-10 per device size (6.7" iPhone Pro Max
    portrait minimum, also 6.5" and 5.5" required for legacy support)
  - App preview video (optional, recommended): 15-30s portrait MP4
- [ ] **Privacy nutrition labels** — App Store form declaring what
      data Luna collects, how it's used, whether it's linked to the
      user, whether it's used for tracking. Luna's profile here is
      tight: account email (linked, for support), encrypted cycle
      data (not linked, never readable to us), no tracking.
- [ ] **PrivacyInfo.xcprivacy manifest** — required for iOS 17+ apps.
      Lists which "required reason" APIs we use (file timestamps,
      UserDefaults, etc) and why. Capacitor docs cover this.
- [ ] **App Tracking Transparency (ATT) prompt** — only required if
      we add advertising or cross-app tracking. Luna doesn't, so
      we declare "does not track" and skip the prompt.
- [ ] **Age rating** — likely 12+ (mature themes/references for
      reproductive health content). Configured in App Store Connect.
- [ ] **Content guidelines compliance** — App Store has specific
      rules for menstrual / reproductive health apps. Review §1.4
      (Physical Harm) and §5.1.1 (Health) of guidelines. Our
      "not medical advice" framing throughout the app helps.
- [ ] **TestFlight beta** — invite friends/family before public
      launch. Up to 10,000 testers, no review for internal testing.
- [ ] **App Store review submission** — 24-72 hour first-time
      review. Have all marketing materials ready first.

### Android / Play Store

- [ ] **Google Play Developer Account** — $25 one-time. Faster
      approval than Apple (~few hours).
- [ ] **Play Console setup**
  - App listing, screenshots (phone + 7" tablet + 10" tablet),
    feature graphic (1024×500), short + full descriptions
  - Android adaptive icons (foreground + background layers)
- [ ] **Data Safety form** — Play Store's equivalent of Apple's
      nutrition labels. Declare what's collected, shared, security
      practices. Same content as the iOS version.
- [ ] **Content rating questionnaire** — IARC-driven. Probably
      ends at "Mature 17+" or "Teen" depending on answers about
      reproductive health content.
- [ ] **Internal / closed testing track** — equivalent to TestFlight.
      Roll out to a small group before production.
- [ ] **Production submission** — review typically 1-3 days.

### Billing — must use native IAP if paid features ship

- [ ] **Replace direct Stripe with native IAP** for in-app
      subscriptions. Apple and Google both require their billing
      systems for digital subscriptions sold inside the app, taking
      15-30% commission.
  - `@capacitor-community/in-app-purchases` or RevenueCat
    (recommended — RevenueCat handles cross-platform subscription
    state in one API, ~$0 for low volume)
  - Stripe can still be used for *web-only* subscription sales
    (e.g. a marketing site checkout) — just not inside the iOS/
    Android app

### Push notifications — easier in native

- [ ] **APNs (Apple) + FCM (Google) for push** — Capacitor's
      `@capacitor/push-notifications` plugin gives one JS API
      that routes to either. Period reminders, daily log nudges,
      weekly editorial — all the toggles in Settings that currently
      do nothing become real.
- [ ] **Notification server** — to actually send pushes, we need
      a small server (Edge Function works) that holds device
      tokens and triggers messages on a schedule.

### Estimated timeline

- Capacitor setup + iOS/Android shell building: **1 week**
- Native biometric + push integration: **3-5 days**
- App Store + Play Store setup, screenshots, descriptions, privacy
  forms: **3-5 days**
- TestFlight beta + Play internal testing iteration: **1-2 weeks**
- Apple review (first submit): **2-7 days** (variable)
- Google review: **1-3 days**

Realistic end-to-end: **4-6 weeks** from "start Capacitor setup"
to "live on both stores."

### Cost summary

- Apple Developer Program: $99/year
- Google Play Developer: $25 one-time
- RevenueCat: free up to $10k/mo subscription revenue
- Sentry: free tier covers small launch
- Supabase: free tier covers small launch
- Total fixed costs first year: **~$124**

## Notifications

- [ ] **Period / log / weekly editorial reminders**
  - Settings toggles exist but don't do anything
  - PWA path: Notification API + Service Worker for local scheduling
  - Native path (preferred — see Native app distribution): APNs/FCM
    via Capacitor's push-notifications plugin
  - Either way needs the Settings toggles to actually drive
    something. Decide once Capacitor is in.

## Polish

- [x] **Custom icon set replacing emojis** (mood/symptom glyphs, see Quick Log on Home + SymptomDetail)
  - Shipped in `src/components/symptomIcons.jsx`. Editorial mark-making for moods,
    representational shapes for symptoms. Iterate on individual glyphs as needed.

- [x] **Period history view** — Settings → Cycle → Period history
- [x] **Symptom pattern detection** — Insights screen surfaces detected patterns across cycles
- [x] **Calendar visualization** — logged period days + predicted future period dots

- [ ] **Onboarding pass on a real iPhone** — verify Face ID enrollment + unlock on actual hardware
- [ ] **Accessibility audit** — color contrast, screen reader labels, keyboard nav
- [x] **Performance pass** — non-tab screens (article content,
      HealthWatch, Paywall, Nourish, Care, PrivacyPolicy, Terms,
      PeriodHistory, EditPeriodStart, BirthControl, Pregnancy,
      PhaseDetail, SymptomDetail) are now lazy-loaded via
      `React.lazy` (see 2026-05-25 security audit). Further Supabase
      bundle splitting still possible.

## Legal / compliance

- [ ] **Privacy policy + terms of service** pages — links from Settings
- [ ] **HIPAA?** Most cycle trackers explicitly don't fall under HIPAA (no healthcare provider relationship). Confirm and note clearly.
- [ ] **Age gate** — likely 13+ minimum, possibly higher for some jurisdictions
- [x] **Data export format** for GDPR/CCPA right-to-access requests — CSV export wired up in Settings → Privacy & Data → "Export all data (CSV)"
- [x] **Privacy policy + terms of service** pages — drafted in `src/screens/PrivacyPolicy.jsx` + `src/screens/Terms.jsx`, linked from Settings; still need legal review (see Critical above)
- [x] **Age gate** — implicit 13+ confirmation on Welcome above the BEGIN button, with inline links to Terms + Privacy Policy
- [x] **Error boundary at app level** — `src/components/ErrorBoundary.jsx` wraps `<App />` in `main.jsx`; needs Sentry DSN before launch

## v1.1 backlog (post-launch)

Things deliberately deferred from v1.0 so we ship a tight launch and
deepen specific surfaces afterwards.

### Pregnancy mode deep-dive (v1.1's flagship update)

Today's pregnancy mode is a shallow swap — cycle day becomes week of
pregnancy, weekly baby/body content. That's a starter. Real
companionship for ~9 months of someone's life means becoming a
distinct app under the same brand.

**Tier 1 — clinically important**
- Pregnancy-specific symptom tracker (morning sickness, fatigue,
  heartburn, swelling, Braxton Hicks, back pain, pelvic pain) —
  replaces the existing menstrual symptom list when active
- Kick counter (third trimester critical safety feature — tap when
  baby kicks, time-window logging, alert if movements drop)
- Appointment + test tracker (every 4 weeks → every 2 → weekly;
  NT scan, anatomy scan, glucose, GBS, Tdap, RhoGAM if Rh-negative)
- Pregnancy weight tracker (provider-recommended ranges by BMI;
  gentle, never diet-shaming)
- Blood pressure log (preeclampsia is the #1 silent risk)
- Pregnancy HealthWatch — red flags specific to pregnancy:
  severe headache, vision changes, sudden swelling, no fetal
  movement, bleeding, intense lower-belly pain

**Tier 2 — emotional + educational companion**
- 30-40 stage-specific articles (first-trimester anxiety,
  second-trimester travel safety, third-trimester prep)
- Birth plan builder → exports as PDF for provider
- Hospital bag checklist (phase-appropriate, gentle reminders)
- Daily affirmation / supportive note (phase-aware)
- Partner mode (read-only summary share)

**Tier 3 — logistics**
- Insurance / doctor / hospital contact card (one-tap)
- Medication safety lookup (sourced, never a substitute for doctor)
- Pregnancy nutrition shift (folate, iron, choline, DHA; what to
  eat-more, what to skip — lunch meat, sushi, etc.)

**Tier 4 — after birth**
- Postpartum mode (recovery, breastfeeding tracking, PPD screening,
  6-week followup)
- Newborn add-on (feeds, naps, diapers) — could be "Luna baby"
  as a separate sub-mode later

Scope estimate: Tier 1 + 2 = 2-3 focused work sessions, mostly
content (article writing, symptom definitions, red-flag lists).
Tier 3 + 4 = additional sessions.

Decision (2026-05-27): defer to v1.1 so the v1.0 launch can be a
tight, fast, polished base. Pregnancy users (~5-10% of menstruating
people at any moment) get the existing shallow mode at launch and
the deep companion experience as a celebrated v1.1 feature drop.

### Other v1.1 candidates
- Article subscription / "new this week" feed (vs current fixed library)
- WebCrypto worker offload (PBKDF2 to Web Worker so it doesn't block paint)
- Postpartum mode (separate from pregnancy mode)
- "Luna assistant" AI companion (already in its own section above)
