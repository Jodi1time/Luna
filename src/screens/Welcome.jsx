import { T } from '../data/theme'
import { CTAButton } from '../components/shared'
import useLuna from '../store/useLuna'

const RITUAL_IMAGE = '/luna-ritual-still-life.webp'

export default function Welcome() {
  const go = useLuna((s) => s.go)
  return (
    <div className="home-stage" style={{ overflow: 'hidden' }}>
      <div className="blob-stage subtle" aria-hidden="true">
        <div className="breathing-blob" style={{ '--phase-color': T.accent }} />
      </div>
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', padding: '42px 26px 32px', color: T.text, animation: 'fadeUp .35s ease-out both', overflowY: 'auto', minHeight: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 18 }}>
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

      <div aria-hidden="true" className="alive-card" style={{
        height: 118,
        borderRadius: 28,
        overflow: 'hidden',
        marginBottom: 22,
        backgroundImage: `linear-gradient(90deg, rgba(247,242,234,0.16), rgba(43,33,28,0.08)), url(${RITUAL_IMAGE})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 62%',
        border: `1px solid ${T.hair}`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.46), 0 24px 52px -38px rgba(43,33,28,0.35)',
      }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: 18 }}>
        <div style={{ fontFamily: T.serif, fontSize: 39, fontWeight: 500, letterSpacing: -1.15, lineHeight: 1.03, textWrap: 'balance' }}>
          Understand why your body feels different today.
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 16.5, lineHeight: 1.55, color: T.muted, marginTop: 16, maxWidth: 320 }}>
          Mood, energy, sleep, symptoms, and cycle patterns in one private daily ritual.
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
          { h: 'Ritual, not routine', s: 'A calm check-in for what your body is asking for today.' },
          { h: 'Science, softly', s: 'Evidence-informed guidance without turning your body into homework.' },
          { h: 'Private by design', s: 'Your diary stays yours. Luna never sells your data.' },
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
