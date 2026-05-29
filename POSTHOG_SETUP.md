# PostHog setup — product analytics for Luna

PostHog tracks anonymous, opt-in event data so we can answer
questions like:

- What percentage of users complete onboarding?
- Which features get used most? Least?
- Do users who log 5 days in week 1 retain better?
- What's the funnel: Welcome → Onboarding → first log?

Strict privacy posture: **NEVER tracks cycle data, names, emails,
or any user content.** Only event names + category-level booleans
(e.g., `has_mood: true`, not `mood: 'sad'`).

## What's already in place

- `posthog-js` installed
- `src/lib/posthog.js` — wrapper with strict privacy guardrails:
  - `autocapture: false` (no silent click tracking)
  - `capture_pageview: false` (we control screen events)
  - `opt_out_capturing_by_default: true`
  - `BLOCKED_KEYS` defensive list strips any sensitive prop names
- `src/main.jsx` initializes PostHog on app boot (capturing stays off
  until user opts in)
- Settings → Anonymous analytics toggle now actually wires through
  to `setAnalyticsEnabled()`
- App.jsx syncs the persisted toggle state on each unlock and fires
  an `app_opened` event when active
- Captured events so far:
  - `analytics_opted_in` — when user flips the Settings toggle ON
  - `app_opened` — each session start (only when opted in)
  - `onboarding_completed` — with `{ account_created: boolean }`
  - `log_saved` — with category booleans (`has_mood`, `symptom_count`,
    `has_flow`, `has_bbt`, `has_mucus`, `has_sex`, `has_note`)
  - `paywall_viewed` — with `{ native: boolean }`
  - `pro_subscribed` — with `{ plan: 'annual' | 'monthly' }`
- On sign-out and account delete, `resetAnalytics()` clears the
  distinct_id so the next user gets a fresh anonymous ID

## Setup (10 min)

### 1. Create a PostHog account

1. Go to https://posthog.com/signup
2. Sign up (email or GitHub). Choose the **US Cloud** region unless
   you specifically need EU compliance.
3. Create a new project named "Luna"

### 2. Get the project API key

After project creation:

1. Click the gear icon (bottom-left) → **Project settings**
2. Find **Project API Key** at the top of the page
3. Copy the key — it starts with `phc_` and is fairly long

### 3. Add to GitHub Secrets

1. Open https://github.com/Jodi1time/Luna/settings/secrets/actions
2. **New repository secret**
3. **Name:** `VITE_POSTHOG_KEY`
4. **Value:** paste the `phc_...` key
5. **Add secret**

If you chose EU Cloud instead of US, also add:

6. **New repository secret**
7. **Name:** `VITE_POSTHOG_HOST`
8. **Value:** `https://eu.i.posthog.com`
9. **Add secret**

(US users can skip this — the code defaults to the US host.)

### 4. Trigger a redeploy

GitHub → Actions → top workflow run → **Re-run all jobs**. Wait
~2 min for green.

### 5. Verify

Open Luna in your browser. In Settings, toggle **Anonymous analytics**
ON. Open the PostHog dashboard → **Live events**. You should see:

- `$pageview` events stop appearing (we disabled autocapture/pageview)
- `analytics_opted_in` event fires immediately when you flip the toggle
- `app_opened` event fires on next page load

If events don't appear within 1-2 minutes:
- Check the browser console for PostHog errors
- Confirm `VITE_POSTHOG_KEY` is in the deployed bundle (curl the live
  JS and grep for the `phc_` prefix)

## What to track next (when you have signal)

Once you see 10+ users in PostHog, useful dashboards to build:

- **Onboarding funnel**: Welcome → onb1 → onb2 → onb3 →
  `onboarding_completed`. Drop-off rate per step.
- **D1, D7, D30 retention**: cohort by `onboarding_completed` date
- **Feature adoption**: what % of users hit Care, Insights, Nourish,
  Pregnancy, Birth Control screens
- **Paywall conversion**: `paywall_viewed` → `pro_subscribed` rate

PostHog's dashboard has "Funnels", "Retention", "Trends" panels —
just drag the event names in.

## Adding more events

In any screen, import and call:

```js
import { capture } from '../lib/posthog'
capture('care_item_toggled', { category: item.category, done: !done })
```

Rules:

1. **Use event names like verbs/nouns**: `log_saved`, `paywall_viewed`,
   not `the_log_was_saved` or `paywall`
2. **Props are category-level booleans/counts/enums, never content.**
   Allowed: `has_mood`, `symptom_count`, `category`. Forbidden: `mood`,
   `symptoms`, `notes`, `email`.
3. The `BLOCKED_KEYS` array in `src/lib/posthog.js` is a safety net —
   keep adding to it if a new sensitive field shows up.

## Privacy claim alignment

The Privacy Policy says: *"No third-party analytics, advertising
trackers, or behavioural fingerprinting inside the app."*

This is still accurate because:
- PostHog only runs when the user **opts in** via Settings (default OFF)
- We never send user content — only event names + category counts
- Users can opt out at any time, and we call `posthog.opt_out_capturing()`

When ready for public launch, update the privacy article to say:
*"Optional, opt-in product analytics via PostHog — anonymous events
only, never your cycle data."* Currently the article still says no
analytics, which is true by default (everyone starts opted out).
