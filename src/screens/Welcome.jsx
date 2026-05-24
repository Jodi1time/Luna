import { T } from '../data/theme'
import { CTAButton } from '../components/shared'
import useLuna from '../store/useLuna'

export default function Welcome() {
  const go = useLuna((s) => s.go)
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '60px 28px 36px', background: T.bg, color: T.text, animation: 'fadeUp .35s ease-out both' }}>
      <div style={{ fontSize: 10, letterSpacing: 2.5, fontWeight: 700, fontFamily: T.sans, marginBottom: 32 }}>
        LUNA · ISSUE 01
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontFamily: T.serif, fontSize: 70, fontWeight: 300, color: T.accent, lineHeight: 0.95, letterSpacing: -3, fontStyle: 'italic' }}>
          Luna.
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 500, letterSpacing: -0.6, lineHeight: 1.15, marginTop: 18 }}>
          A cycle tracker that interprets,<br /><em>not just logs.</em>
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 16, lineHeight: 1.55, color: T.muted, marginTop: 16 }}>
          Phase-specific guidance grounded in peer-reviewed research. A knowledgeable friend, in your pocket.
        </div>
      </div>

      <div style={{ padding: '16px 0', borderTop: `1px solid ${T.hair}`, borderBottom: `1px solid ${T.hair}`, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 24 }}>
        {[
          { n: '01', h: 'Yours alone',      s: 'Stored on your phone, encrypted.' },
          { n: '02', h: 'Evidence-led',     s: 'Every claim sourced from clinical research.' },
          { n: '03', h: 'Quiet by design',  s: 'No notifications you didn\'t ask for.' },
        ].map((p) => (
          <div key={p.n}>
            <div style={{ fontFamily: T.mono, fontSize: 10, color: T.accent, marginBottom: 5 }}>{p.n}</div>
            <div style={{ fontFamily: T.serif, fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{p.h}</div>
            <div style={{ fontSize: 10.5, color: T.muted, lineHeight: 1.4, fontFamily: T.sans }}>{p.s}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 22 }}>
        <CTAButton full onClick={() => go('onb1')}>BEGIN</CTAButton>
        <button onClick={() => go('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontFamily: T.sans, fontSize: 12, marginTop: 12, padding: 8, width: '100%' }}>
          Skip to demo →
        </button>
        <button onClick={() => go('auth')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontFamily: T.sans, fontSize: 12, marginTop: 2, padding: 8, width: '100%' }}>
          Already have an account? <span style={{ color: T.text, fontWeight: 600 }}>Sign in</span>
        </button>
      </div>
    </div>
  )
}
