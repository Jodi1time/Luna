# Luna pre-launch checklist

Things to do/decide before opening Luna to the public. Keep this updated as items land or new ones appear.

## Status

**Last review:** 2026-05-24

The core data layer is launch-ready. Several user-facing flows
(billing, real legal review, server-side account deletion, monitoring)
still need to be addressed before public launch. See "Critical for
launch" below.

## Security audit · 2026-05-25

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
- [x] RLS policies now explicit: SELECT/UPDATE by owner, INSERT
      restricted to self, DELETE denied entirely (server-side only).
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
- [ ] **Supabase Edge Function for true server-side account deletion** — the in-app "Delete my account" flow signs out and wipes the local vault, but the server-side row still needs an Edge Function to honour the 30-day deletion promise
- [ ] **Stripe wiring for Pro subscription** — products, Checkout, webhook → `profiles.stripe_customer_id`, gate `isPro` from server
- [ ] **Re-enable Supabase email confirmation with verify-in-background pattern** — see Authentication section below for the detailed approach
- [ ] **Rotate the Supabase anon key** — the current anon key was pasted in chat history; rotate as a hygiene step
- [ ] **Either fix `jodi.com` DNS or remove the CNAME** — see Domain / hosting section
- [ ] **Sentry (or equivalent) error monitoring DSN** — the in-app `ErrorBoundary` already logs to `console.error`; wire it into a real monitor before public launch
- [ ] **Real iPhone/Android device testing pass** — particularly the Face ID PRF biometric unlock flow on actual hardware

## Authentication & accounts

- [ ] **Re-enable email confirmation with verify-in-background pattern**
  - Currently OFF in Supabase for testing seamless onboarding
  - Before launch: flip "Confirm email" ON in Supabase dashboard
  - Update onboarding `signUp` to use `emailRedirectTo` so a session is returned immediately even though the email is unconfirmed
  - Add a Settings row "Verify email" (only when `auth.user.email_confirmed_at` is null) that re-sends the confirmation link
  - Gate **recovery flows** behind a confirmed email:
    - Forgot password
    - Sign in on a new device (when sync ships)
    - Account deletion
  - Optional: dismissible banner on Home until verified
  - Estimate: ~2 hours

- [ ] **Recovery code / passcode reset path**
  - Forgetting the vault passcode currently means data loss
  - Generate a one-time recovery code at vault creation, prompt user to save it
  - Recovery code can wrap a copy of the passcode (similar to how biometric wraps it)
  - Alternative: server-side encrypted passcode escrow gated by email verification (more complex but no user-managed code)

## Privacy / security

- [ ] **Update privacy article copy** ([src/data/lunaData.js](src/data/lunaData.js) `id: 'privacy'`)
  - Currently claims "stored on your phone in encrypted form" which is now true
  - Update to mention the account/server split when sync ships
  - Remove the "anonymised data sent to AI partner" line (no AI integration exists)

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

- [ ] **Wire up Stripe for Pro subscription**
  - Currently the paywall and Pro card are visual only
  - Need: products in Stripe, checkout via Stripe.js, webhook → set `profiles.stripe_customer_id` and toggle `isPro`
  - Email confirmation required before checkout (payment disputes)

## Sync (Tier 1 E2EE)

- [ ] **Multi-device sync via E2EE**
  - Server stores encrypted vault blob keyed to `auth.user.id`
  - Decrypted only with passcode on each device
  - Conflict resolution: last-write-wins with vector clocks per log day
  - Big feature — design separately

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

## Notifications

- [ ] **Period / log / weekly editorial reminders**
  - Settings toggles exist but don't do anything
  - Use Notification API + Service Worker for local scheduling (no server needed initially)
  - Push notifications later require a server (Tier 2)

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
