import { useState, useEffect } from 'react'
import { T } from '../data/theme'
import { Eyebrow, CTAButton, Icons, Screen } from '../components/shared'
import useLuna from '../store/useLuna'
import {
  revenueCatAvailable,
  initRevenueCat,
  getOfferings,
  purchasePackage,
  restorePurchases,
  hasPro as rcHasPro,
} from '../lib/revenuecat'
import { capture } from '../lib/posthog'

export default function Paywall() {
  const back = useLuna((s) => s.back)
  const setIsPro = useLuna((s) => s.setIsPro)
  const user = useLuna((s) => s.user)
  const [plan, setPlan] = useState('annual')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [offering, setOffering] = useState(null)

  const features = [
    ['Share with someone',       'Bring a partner, your mother, a doula into the loop. Read-only, revokable, no diary exposed.'],
    ['Weekly editorial',         'Plain-language patterns, written for your phase.'],
    ['Full Library access',      'Every article and phase brief unlocked.'],
    ['Predictions with reasoning','Every "Why" badge expanded.'],
    ['Doctor-ready exports',     'PDF + CSV with daily symptom data.'],
    ['Quiet companion',          "No mid-app upsells once you're in."],
  ]

  // Fallback prices for web preview. The real prices come from
  // RevenueCat / App Store Connect / Play Console when running native.
  const fallbackPlans = [
    { id: 'annual',  label: 'ANNUAL',  price: '$49.99', sub: '$4.16/mo · Save 40%', badge: 'BEST VALUE', pkg: null },
    { id: 'monthly', label: 'MONTHLY', price: '$6.99',  sub: 'Cancel any time',     badge: null,         pkg: null },
  ]

  // Analytics: paywall viewed
  useEffect(() => {
    capture('paywall_viewed', { native: revenueCatAvailable })
  }, [])

  // Native: pull live offerings from RevenueCat after init
  useEffect(() => {
    if (!revenueCatAvailable) return
    let cancelled = false
    ;(async () => {
      try {
        await initRevenueCat(user?.id || null)
        const o = await getOfferings()
        if (!cancelled) setOffering(o)
      } catch {
        // Stay on fallback prices
      }
    })()
    return () => { cancelled = true }
  }, [user?.id])

  // Build the plan list — prefer live RevenueCat packages when present
  const plans = (() => {
    if (!offering?.availablePackages?.length) return fallbackPlans
    const live = []
    const a = offering.availablePackages.find((p) => p.packageType === 'ANNUAL')
    const m = offering.availablePackages.find((p) => p.packageType === 'MONTHLY')
    if (a) live.push({ id: 'annual',  label: 'ANNUAL',  price: a.product?.priceString || '$49.99', sub: '$4.16/mo · Save 40%', badge: 'BEST VALUE', pkg: a })
    if (m) live.push({ id: 'monthly', label: 'MONTHLY', price: m.product?.priceString || '$6.99',  sub: 'Cancel any time',     badge: null,         pkg: m })
    return live.length ? live : fallbackPlans
  })()

  const selectedPlan = plans.find((p) => p.id === plan) || plans[0]

  const handleSubscribe = async () => {
    setError('')
    if (!revenueCatAvailable) {
      // Beta path or web — just dismiss. Once on the App Store /
      // Play Store, the native plugin runs the real purchase flow.
      back()
      return
    }
    if (!selectedPlan?.pkg) {
      setError('No subscription package configured yet. Try again later.')
      return
    }
    setBusy(true)
    try {
      const customerInfo = await purchasePackage(selectedPlan.pkg)
      if (rcHasPro(customerInfo)) {
        setIsPro(true)
        capture('pro_subscribed', { plan: selectedPlan.id })
        back()
      } else {
        setError('Purchase completed but Pro not active yet. Try Restore.')
      }
    } catch (e) {
      // RevenueCat throws for user-cancelled too — swallow that quietly
      if (e?.code !== 'PURCHASE_CANCELLED') {
        setError(e?.message || 'Could not complete purchase.')
      }
    } finally {
      setBusy(false)
    }
  }

  const handleRestore = async () => {
    setError('')
    setBusy(true)
    try {
      const info = await restorePurchases()
      if (info && rcHasPro(info.customerInfo || info)) {
        setIsPro(true)
        back()
      } else {
        setError('No active subscription found on this account.')
      }
    } catch (e) {
      setError(e?.message || 'Could not restore purchases.')
    } finally {
      setBusy(false)
    }
  }

  const ctaLabel = busy ? 'WORKING…' : (revenueCatAvailable ? 'START 7-DAY FREE TRIAL' : 'CONTINUE')

  return (
    <Screen padBottom={30}>
      <div style={{ padding: '12px 22px 24px', color: T.text }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 0' }}>
          <button onClick={back} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 6 }}>{Icons.close}</button>
        </div>
        <Eyebrow color={T.accent}>LUNA · PRO</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 36, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 18 }}>
          Insights that actually <em style={{ color: T.accent }}>get you.</em>
        </div>
        <div style={{ marginBottom: 22 }}>
          {features.map(([t, sub], i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: i < features.length - 1 ? `1px solid ${T.hair}` : 'none' }}>
              <div style={{ color: T.accent, marginTop: 4, fontFamily: T.mono, fontSize: 11 }}>{String(i + 1).padStart(2, '0')}</div>
              <div>
                <div style={{ fontFamily: T.serif, fontSize: 16, fontWeight: 500 }}>{t}</div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 2, fontFamily: T.sans }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {plans.map((p) => {
            const on = plan === p.id
            return (
              <button key={p.id} onClick={() => setPlan(p.id)}
                style={{ cursor: 'pointer', textAlign: 'left', border: `1.5px solid ${on ? T.accent : T.hair}`, background: on ? T.accent + '0E' : T.card, color: T.text, padding: 14, display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'inherit', position: 'relative', borderRadius: T.r }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 12, letterSpacing: 1 }}>{p.label}</div>
                  <div style={{ fontSize: 11, color: T.muted, fontFamily: T.sans, marginTop: 2 }}>{p.sub}</div>
                </div>
                <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500 }}>{p.price}</div>
                {p.badge && (
                  <div style={{ position: 'absolute', top: -1, right: -1, background: T.accent, color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: 1, padding: '3px 8px', fontFamily: T.sans }}>
                    {p.badge}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {error && (
          <div style={{ fontFamily: T.sans, fontSize: 12, color: T.accent, marginBottom: 10, padding: '8px 12px', background: T.accent + '12', borderRadius: T.r, lineHeight: 1.4 }}>
            {error}
          </div>
        )}

        <CTAButton full onClick={handleSubscribe} style={{ opacity: busy ? 0.5 : 1 }}>{ctaLabel}</CTAButton>

        {revenueCatAvailable && (
          <button onClick={handleRestore} disabled={busy}
            style={{ marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontFamily: T.sans, fontSize: 12, padding: 8, width: '100%' }}>
            Restore purchases
          </button>
        )}

        <div style={{ fontSize: 11, color: T.muted, textAlign: 'center', marginTop: 10, fontFamily: T.sans }}>
          Cancel any time in Settings. Free trial then {selectedPlan?.price || '$49.99/yr'}.
        </div>
      </div>
    </Screen>
  )
}
