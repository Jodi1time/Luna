import { useState } from 'react'
import { T } from '../data/theme'
import { Eyebrow, CTAButton, Icons, Screen } from '../components/shared'
import useLuna from '../store/useLuna'

export default function Paywall() {
  const back = useLuna((s) => s.back)
  const [plan, setPlan] = useState('annual')
  const features = [
    ['Weekly AI editorial',      'Plain-language patterns, written for you.'],
    ['Full Library access',      'Every article and phase brief unlocked.'],
    ['Predictions with reasoning','Every "Why" badge expanded.'],
    ['Doctor-ready exports',     'PDF + CSV with daily symptom data.'],
    ['Quiet companion',          "No mid-app upsells once you're in."],
  ]
  const plans = [
    { id: 'annual',  label: 'ANNUAL',  price: '$49.99', sub: '$4.16/mo · Save 40%', badge: 'BEST VALUE' },
    { id: 'monthly', label: 'MONTHLY', price: '$6.99',  sub: 'Cancel any time',     badge: null },
  ]
  return (
    <Screen padBottom={30}>
      <div style={{ padding: '12px 22px 24px', color: T.text }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 0' }}>
          <button onClick={back} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 6 }}>{Icons.close}</button>
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
                  <div style={{ position: 'absolute', top: -1, right: -1, background: T.accent, color: '#fff', fontSize: 9, fontWeight: 700, letterSpacing: 1, padding: '3px 8px', fontFamily: T.sans }}>
                    {p.badge}
                  </div>
                )}
              </button>
            )
          })}
        </div>
        <CTAButton full onClick={back}>START 7-DAY FREE TRIAL</CTAButton>
        <div style={{ fontSize: 10, color: T.muted, textAlign: 'center', marginTop: 10, fontFamily: T.sans }}>Cancel any time in Settings. Free trial then {plan === 'annual' ? '$49.99/yr' : '$6.99/mo'}.</div>
      </div>
    </Screen>
  )
}
