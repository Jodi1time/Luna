import { T } from '../data/theme'
import { CTAButton } from '../components/shared'
import useLuna from '../store/useLuna'

export default function Welcome() {
  const go = useLuna((s) => s.go)
  return (
    <div className="home-stage" style={{ overflow: 'hidden' }}>
      <div className="blob-stage subtle" aria-hidden="true">
        <div className="breathing-blob" style={{ '--phase-color': T.accent }} />
      </div>
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', padding: '60px 28px 36px', color: T.text, animation: 'fadeUp .35s ease-out both', overflowY: 'auto', minHeight: 0 }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, letterSpacing: 2.5, fontWeight: 700, fontFamily: T.sans, color: T.muted }}>
            LUNA
          </div>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 11, color: T.muted, marginTop: 2, letterSpacing: 0.3 }}>
            by Gloria
          </div>
        </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontFamily: T.serif, fontSize: 36, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.1 }}>
          A little less to remember.<br /><em>A little more support.</em>
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 16, lineHeight: 1.6, color: T.muted, marginTop: 20 }}>
          Keep your symptoms, treatment history and appointment questions together. Whether you’re managing PCOS or simply getting to know your body, there’s a place for you here.
        </div>
      </div>

      <div style={{ padding: '18px 0', borderTop: `1px solid ${T.hair}`, borderBottom: `1px solid ${T.hair}`, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 24 }}>
        {[
          { n: '01', h: 'Notice', s: 'Record how you feel, in your own words.' },
          { n: '02', h: 'Remember', s: 'Keep your care history and questions close.' },
          { n: '03', h: 'Prepare', s: 'Review and edit notes for your next visit.' },
        ].map((p) => (
          <div key={p.n}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.accent, marginBottom: 5 }}>{p.n}</div>
            <div style={{ fontFamily: T.serif, fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{p.h}</div>
            <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.4, fontFamily: T.sans }}>{p.s}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 22 }}>
        <p style={{ fontFamily: T.sans, fontSize: 13, lineHeight: 1.6, color: T.muted }}>
          No perfect routine or regular cycle needed. Start with what you know; leave the rest for later. Luna helps you keep records, not diagnose a condition.
        </p>
        <div style={{ fontSize: 11, color: T.muted, fontFamily: T.sans, lineHeight: 1.55, marginBottom: 16, textAlign: 'center' }}>
          You're 13 or older and you agree to Luna's <button onClick={() => go('terms')} style={{ background: 'none', border: 'none', padding: 0, color: T.text, cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2 }}>Terms</button> and <button onClick={() => go('privacy')} style={{ background: 'none', border: 'none', padding: 0, color: T.text, cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2 }}>Privacy Policy</button>.
        </div>
        <CTAButton full onClick={() => go('onbIntent')}>Make Luna mine</CTAButton>
        <button onClick={() => go('auth')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontFamily: T.sans, fontSize: 12, marginTop: 12, padding: 8, width: '100%' }}>
          Already with us? <span style={{ color: T.text, fontWeight: 600 }}>Sign in</span>
        </button>
      </div>
      </div>
    </div>
  )
}
