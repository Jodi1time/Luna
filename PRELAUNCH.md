# Luna pre-launch checklist

Things to do/decide before opening Luna to the public. Keep this updated as items land or new ones appear.

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

## Notifications

- [ ] **Period / log / weekly editorial reminders**
  - Settings toggles exist but don't do anything
  - Use Notification API + Service Worker for local scheduling (no server needed initially)
  - Push notifications later require a server (Tier 2)

## Polish

- [ ] **Custom icon set replacing emojis** (mood/symptom glyphs, see Quick Log on Home + SymptomDetail)
  - User asked for this; planned as a focused design pass
  - Match the existing 20×20 stroke style of the tab bar icons

- [ ] **Onboarding pass on a real iPhone** — verify Face ID enrollment + unlock on actual hardware
- [ ] **Accessibility audit** — color contrast, screen reader labels, keyboard nav
- [ ] **Performance pass** — code-split the Supabase bundle, lazy-load article content, audit the 500 KB JS bundle

## Legal / compliance

- [ ] **Privacy policy + terms of service** pages — links from Settings
- [ ] **HIPAA?** Most cycle trackers explicitly don't fall under HIPAA (no healthcare provider relationship). Confirm and note clearly.
- [ ] **Age gate** — likely 13+ minimum, possibly higher for some jurisdictions
- [ ] **Data export format** for GDPR/CCPA right-to-access requests (the CSV export button already exists; wire it up)
