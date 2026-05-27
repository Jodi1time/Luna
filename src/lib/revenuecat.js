// RevenueCat subscription wrapper — handles Pro subscriptions on iOS
// and Android via Apple StoreKit + Google Play Billing.
//
// PLUGIN NOT INSTALLED YET. Once Capacitor's iOS/Android platforms
// are added (npx cap add ios && npx cap add android), install with:
//
//   npm install @revenuecat/purchases-capacitor
//   npx cap sync
//
// Then add the API keys to env (see REVENUECAT_SETUP.md). Until then,
// every function returns null/false gracefully — the Paywall UI shows
// a "Pro coming soon" state.
//
// Why RevenueCat (and not Stripe directly):
//   - Apple and Google FORBID Stripe for digital subscriptions sold
//     inside an iOS/Android app. Native IAP (StoreKit + Play Billing)
//     is the only allowed path. They take 15-30%.
//   - RevenueCat wraps both in one JS API with cross-platform
//     subscription state, restore flows, and webhook integration —
//     free up to ~$10k MRR.

import { Capacitor } from '@capacitor/core'

const iosKey      = import.meta.env.VITE_REVENUECAT_IOS_KEY
const androidKey  = import.meta.env.VITE_REVENUECAT_ANDROID_KEY

// RevenueCat is only used inside the native app shell — not the web PWA.
// On web, subscriptions either go through a separate Stripe-backed
// checkout (out of scope for v1) or simply aren't offered.
export const revenueCatAvailable = (
  typeof Capacitor !== 'undefined'
  && Capacitor.isNativePlatform?.()
  && Boolean(iosKey || androidKey)
)

let _purchases = null
let _initialized = false

async function loadPurchases() {
  if (!Capacitor.isNativePlatform?.()) return null
  if (_purchases) return _purchases
  try {
    // Dynamic import so the bundle still works when the plugin isn't
    // installed (web build, or before `npm install`).
    const mod = await import(/* @vite-ignore */ '@revenuecat/purchases-capacitor')
    _purchases = mod.Purchases
    return _purchases
  } catch {
    return null
  }
}

// Call once after auth: passes the Supabase user.id so RevenueCat
// links the subscription to the user (survives reinstalls, restores
// across devices, syncs entitlement state).
export async function initRevenueCat(userId = null) {
  if (_initialized) return true
  const p = await loadPurchases()
  if (!p) return false
  const apiKey = Capacitor.getPlatform() === 'ios' ? iosKey : androidKey
  if (!apiKey) return false
  try {
    await p.configure({ apiKey, appUserID: userId || undefined })
    _initialized = true
    return true
  } catch {
    return false
  }
}

// Returns the current offering — a set of subscription Packages
// configured in the RevenueCat dashboard. Each Package wraps an
// App Store / Play Store product.
export async function getOfferings() {
  const p = await loadPurchases()
  if (!p) return null
  try {
    const { current } = await p.getOfferings()
    return current
  } catch {
    return null
  }
}

// Trigger a purchase. `pkg` is a RevenueCat Package object from
// getOfferings(). Returns the updated customer info on success.
export async function purchasePackage(pkg) {
  const p = await loadPurchases()
  if (!p) throw new Error('Subscriptions not available on this device')
  const result = await p.purchasePackage({ aPackage: pkg })
  return result?.customerInfo
}

// Restore purchases from the user's App Store / Play Store account.
// Used by the "Restore purchases" link in the Paywall.
export async function restorePurchases() {
  const p = await loadPurchases()
  if (!p) return null
  try {
    return await p.restorePurchases()
  } catch {
    return null
  }
}

// Current subscription state from RevenueCat. Useful on app launch
// to know whether the user is still entitled to Pro.
export async function getCustomerInfo() {
  const p = await loadPurchases()
  if (!p) return null
  try {
    const { customerInfo } = await p.getCustomerInfo()
    return customerInfo
  } catch {
    return null
  }
}

// We name the RevenueCat entitlement 'pro' in the dashboard. This
// reads the entitlement state from a customerInfo object.
export function hasPro(customerInfo) {
  return customerInfo?.entitlements?.active?.pro != null
}

// Subscribe to entitlement changes. RevenueCat fires this when a
// purchase, renewal, or expiry happens.
export async function onCustomerInfoUpdate(callback) {
  const p = await loadPurchases()
  if (!p) return () => {}
  try {
    const handle = await p.addCustomerInfoUpdateListener(callback)
    return () => p.removeCustomerInfoUpdateListener(handle)
  } catch {
    return () => {}
  }
}
