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
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', padding: '52px 26px 34px', color: T.text, animation: 'fadeUp .35s ease-out both', overflowY: 'auto', minHeight: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 2.4, fontWeight: 700, fontFamily: T.sans, color: T.text }}>
              LUNA
            </div>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 11, color: T.muted, marginTop: 2, letterSpacing: 0.3 }}>
              by Gloria
            </div>
          </div>
          <div aria-hidden="true" style={{
            width: 46,
            height: 46,
            borderRadius: 18,
            background: 'rgba(253,250,245,0.48)',
            border: '1px solid rgba(26,19,16,0.06)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.62), 0 18px 34px -26px rgba(26,19,16,0.32)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: T.accent,
            fontFamily: T.serif,
            fontStyle: 'italic',
            fontSize: 26,
          }}>
            L
          </div>
        </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: 20 }}>
        <div style={{ fontFamily: T.serif, fontSize: 43, fontWeight: 500, letterSpacing: -1.35, lineHeight: 0.98, textWrap: 'balance' }}>
          A companion, on the days you need one.
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 17, lineHeight: 1.55, color: T.muted, marginTop: 18, maxWidth: 320 }}>
          Track your cycle. Notice your patterns. Keep one private place for your body.
        </div>
      </div>

      <div style={{
        padding: '16px 0',
        borderTop: `1px solid ${T.hair}`,
        borderBottom: `1px solid ${T.hair}`,
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 10,
        marginTop: 8,
      }}>
        {[
          { h: 'Private by default', s: 'Your diary stays yours. Luna never sells your data.' },
          { h: 'Clear when it matters', s: 'Predictions show uncertainty instead of pretending the body is a clock.' },
          { h: 'Quiet unless invited', s: 'No noise for the sake of engagement.' },
        ].map((p) => (
          <div key={p.h} style={{ display: 'grid', gridTemplateColumns: '118px 1fr', gap: 12, alignItems: 'baseline' }}>
            <div style={{ fontFamily: T.serif, fontSize: 13.5, fontWeight: 600, letterSpacing: -0.1 }}>{p.h}</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.45, fontFamily: T.sans }}>{p.s}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 22 }}>
        <div style={{ fontSize: 11, color: T.muted, fontFamily: T.sans, lineHeight: 1.55, marginBottom: 16, textAlign: 'center' }}>
          You're 13 or older and you agree to Luna's <button onClick={() => go('terms')} style={{ background: 'none', border: 'none', padding: 0, color: T.text, cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2 }}>Terms</button> and <button onClick={() => go('privacy')} style={{ background: 'none', border: 'none', padding: 0, color: T.text, cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2 }}>Privacy Policy</button>.
        </div>
        <CTAButton full onClick={() => go('onbIntent')}>Start</CTAButton>
        <button onClick={() => go('auth')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontFamily: T.sans, fontSize: 12, marginTop: 12, padding: 8, width: '100%' }}>
          Already with us? <span style={{ color: T.text, fontWeight: 600 }}>Sign in</span>
        </button>
      </div>
      </div>
    </div>
  )
}
