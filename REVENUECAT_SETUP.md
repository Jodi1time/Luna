# RevenueCat setup — Luna Pro subscriptions

Luna's Pro subscription runs through **RevenueCat + native IAP** —
Apple StoreKit on iOS, Google Play Billing on Android. Stripe is NOT
used for in-app subscriptions (Apple/Google forbid it for digital
goods sold inside the app).

## What's already in place

These don't need to be redone:

- `src/lib/revenuecat.js` — wraps the RevenueCat SDK with graceful
  no-op fallback when the plugin isn't installed
- `src/screens/Paywall.jsx` — reads offerings from RevenueCat, calls
  `purchasePackage()` on tap, has a "Restore purchases" link, syncs
  `isPro` state on success
- `src/store/useLuna.js` — `setIsPro(v)` action
- `.env.example` placeholders for `VITE_REVENUECAT_IOS_KEY` and
  `VITE_REVENUECAT_ANDROID_KEY`

## Prerequisites — do these in order

These all need to happen BEFORE Luna's first App Store / Play Store
submission. They can be done in parallel with the Capacitor native
platform setup (see `CAPACITOR_SETUP.md`).

### 1. RevenueCat account

1. Sign up at https://app.revenuecat.com — free
2. Create a new project named "Luna"
3. You'll be issued two **public API keys** (one for iOS, one for
   Android). You add these as GitHub repo secrets later.

### 2. Set up the "pro" entitlement

In RevenueCat dashboard:

1. **Project Settings → Entitlements → New entitlement**
2. Identifier: `pro`
3. Display name: "Pro"

The app code in `src/lib/revenuecat.js` already checks for this
entitlement by id. Don't change the id without updating that code.

### 3. App Store Connect — create subscription products

You need an Apple Developer account ($99/year) and the app already
created in App Store Connect.

1. **App Store Connect → your Luna app → Subscriptions**
2. Create a Subscription Group (e.g., "Luna Pro")
3. Add two products under that group:
   - `luna_pro_monthly` — $6.99/month
   - `luna_pro_annual` — $49.99/year
4. Set up a 7-day free trial as an introductory offer on each
5. Submit each product for review with the rest of the app

### 4. Google Play Console — create subscription products

You need a Google Play Developer account ($25 one-time) and the app
already created in Play Console.

1. **Play Console → your Luna app → Monetize → Products → Subscriptions**
2. Create two base plans (matching the iOS product IDs is recommended):
   - `luna_pro_monthly` — $6.99/month
   - `luna_pro_annual` — $49.99/year
3. Add a 7-day free trial offer to each
4. Activate both

### 5. Wire products into RevenueCat

Back in RevenueCat dashboard:

1. **Project → Apps → New** — add your iOS app (bundle id
   `com.luna.app`), then your Android app (same package name)
2. **Products** — add each store product (RevenueCat will pull them
   from App Store Connect + Play Console once the apps are linked).
   Attach each to the `pro` entitlement.
3. **Offerings** — create a default offering called `default` with
   two packages:
   - `Annual` (type: `ANNUAL`) → linked to `luna_pro_annual`
   - `Monthly` (type: `MONTHLY`) → linked to `luna_pro_monthly`

The Paywall screen reads from this offering by package type
(`ANNUAL` / `MONTHLY`), so the naming has to match exactly.

### 6. Install the Capacitor plugin

Run this AFTER the iOS and Android Capacitor platforms have been
added (see `CAPACITOR_SETUP.md` — `npx cap add ios && npx cap add
android`):

```bash
npm install @revenuecat/purchases-capacitor
npx cap sync
```

### 7. Add API keys

**Local dev** (`.env.local` at repo root, gitignored):
```
VITE_REVENUECAT_IOS_KEY=appl_...
VITE_REVENUECAT_ANDROID_KEY=goog_...
```

**Production builds** (GitHub Actions secrets):
- `VITE_REVENUECAT_IOS_KEY`
- `VITE_REVENUECAT_ANDROID_KEY`

### 8. Flip the beta default

In `src/store/useLuna.js`, currently `isPro: true` is hardcoded for
beta. Change it back to `isPro: false` so users start as Free and
become Pro only via a real RevenueCat purchase:

```diff
- isPro: true,
+ isPro: false,
```

Also wire app-startup entitlement sync. In `src/App.jsx`'s `useEffect`
that runs after unlock, add:

```js
import { revenueCatAvailable, initRevenueCat, getCustomerInfo, hasPro, onCustomerInfoUpdate } from './lib/revenuecat'
const setIsPro = useLuna((s) => s.setIsPro)

useEffect(() => {
  if (locked || !revenueCatAvailable) return
  ;(async () => {
    await initRevenueCat(user?.id || null)
    const info = await getCustomerInfo()
    setIsPro(hasPro(info))
  })()
  let unsub = () => {}
  onCustomerInfoUpdate((info) => setIsPro(hasPro(info))).then((u) => { unsub = u })
  return () => unsub()
}, [locked, user?.id])
```

## Testing the purchase flow

### iOS — sandbox

1. Create a Sandbox Apple ID at App Store Connect → Users and Access
   → Sandbox Testers
2. On your iPhone, sign OUT of the App Store (Settings → App Store →
   sign out)
3. Open Luna → Paywall → tap subscribe
4. Sign in with the sandbox tester ID at the system prompt
5. The subscription "purchase" goes through but no money is charged

### Android — testing track

1. Upload a signed AAB to Play Console internal testing track
2. Add your Google account as a tester
3. Install Luna from the Play Store testing link
4. Subscribe — billed as a test purchase (auto-refunded)

## Common pitfalls

- **"No subscription package configured yet"** — Offering doesn't have
  ANNUAL/MONTHLY packages with those exact types. Check the dashboard.
- **Purchases work but Pro doesn't activate** — entitlement id mismatch.
  RevenueCat dashboard must have an entitlement called exactly `pro`
  and the products attached to it.
- **iOS sandbox test purchases fail with "Cannot connect to iTunes"**
  — usually a banking-region thing on the sandbox account. Recreate
  the sandbox tester in a different region.
- **Restore purchases finds nothing** — user wasn't signed in with
  the original purchasing Apple ID / Google account.

## When ready to ship

- See `PRELAUNCH.md` "Critical for launch" section for the full
  pre-store-submission checklist
- Pricing/plan tier decisions should be locked before App Store
  review (you can change prices afterwards, but plan structure
  changes mean resubmission)
