import { T } from '../data/theme'
import { CTAButton } from '../components/shared'
import useLuna from '../store/useLuna'

export default function Welcome() {
  const go = useLuna((s) => s.go)
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '60px 28px 36px', background: T.bg, color: T.text, animation: 'fadeUp .35s ease-out both' }}>
      <div style={{ fontSize: 10, letterSpacing: 2.5, fontWeight: 700, fontFamily: T.sans, marginBottom: 32, color: T.muted }}>
        LUNA
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontFamily: T.serif, fontSize: 36, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.1 }}>
          A companion for the body<br /><em>you live in.</em>
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 16, lineHeight: 1.6, color: T.muted, marginTop: 20 }}>
          Luna learns your cycle and meets you where you are — in the energy of follicular, the quiet of menstrual, the heat of luteal. A wise older sister, on the days you need one.
        </div>
      </div>

      <div style={{ padding: '18px 0', borderTop: `1px solid ${T.hair}`, borderBottom: `1px solid ${T.hair}`, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 24 }}>
        {[
          { n: '01', h: 'Yours alone',      s: 'Encrypted at rest. Never sold, never shared.' },
          { n: '02', h: 'Grounded in care', s: 'Every claim sourced from doctors and clinical research.' },
          { n: '03', h: 'Quiet by design',  s: 'No notifications you didn\'t ask for. No optimisation talk.' },
        ].map((p) => (
          <div key={p.n}>
            <div style={{ fontFamily: T.mono, fontSize: 10, color: T.accent, marginBottom: 5 }}>{p.n}</div>
            <div style={{ fontFamily: T.serif, fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{p.h}</div>
            <div style={{ fontSize: 10.5, color: T.muted, lineHeight: 1.4, fontFamily: T.sans }}>{p.s}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 22 }}>
        <div style={{ fontSize: 11, color: T.muted, fontFamily: T.sans, lineHeight: 1.55, marginBottom: 16, textAlign: 'center' }}>
          You're 13 or older and you agree to Luna's <button onClick={() => go('terms')} style={{ background: 'none', border: 'none', padding: 0, color: T.text, cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2 }}>Terms</button> and <button onClick={() => go('privacy')} style={{ background: 'none', border: 'none', padding: 0, color: T.text, cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2 }}>Privacy Policy</button>.
        </div>
        <CTAButton full onClick={() => go('onb1')}>BEGIN</CTAButton>
        <button onClick={() => go('auth')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontFamily: T.sans, fontSize: 12, marginTop: 12, padding: 8, width: '100%' }}>
          Already with us? <span style={{ color: T.text, fontWeight: 600 }}>Sign in</span>
        </button>
      </div>
    </div>
  )
}
