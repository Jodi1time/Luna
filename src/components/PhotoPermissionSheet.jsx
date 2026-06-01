import { T } from '../data/theme'

// One-time explainer shown before the very first photo pick. The OS
// picker itself handles the actual permission grant on tap — this
// sheet just sets expectations so the user understands what tapping
// next means + that photos stay inside Luna.
export default function PhotoPermissionSheet({ open, accent, onContinue, onCancel }) {
  if (!open) return null
  const acc = accent || T.accent
  return (
    <div onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 220,
        background: 'rgba(26,19,16,0.42)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: 'fadeIn 0.3s ease-out both',
      }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 360,
          background: T.bg,
          borderRadius: 22,
          padding: '28px 24px 22px',
          boxShadow: '0 18px 48px rgba(0,0,0,0.22)',
          animation: 'fadeUp 0.42s var(--ease-spring) both',
        }}>
        <div aria-hidden="true" style={{
          fontFamily: T.serif, fontSize: 56, fontWeight: 400, fontStyle: 'italic',
          color: acc, lineHeight: 1, letterSpacing: -1,
          textAlign: 'center', marginBottom: 14,
        }}>
          ✿
        </div>
        <div style={{
          fontFamily: T.serif, fontSize: 22, fontWeight: 500, letterSpacing: -0.4,
          lineHeight: 1.2, color: T.text, textAlign: 'center', marginBottom: 12,
        }}>
          A photo for the page?
        </div>
        <div style={{
          fontFamily: T.serif, fontSize: 14, fontStyle: 'italic',
          lineHeight: 1.55, color: T.muted, textAlign: 'center', marginBottom: 18,
        }}>
          The next tap opens your camera roll. Whichever photo you pick stays inside Luna — encrypted at rest, never shared, only on your diary page.
        </div>
        <div style={{
          fontFamily: T.sans, fontSize: 11, color: T.muted, lineHeight: 1.55,
          padding: '10px 12px',
          background: 'rgba(26,19,16,0.04)',
          borderRadius: T.r,
          marginBottom: 20,
        }}>
          You can remove any photo later — tap it in the entry and choose Remove.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel}
            style={{
              flex: 1,
              background: 'transparent',
              color: T.text,
              border: `1px solid ${T.hair}`,
              padding: '12px 14px',
              borderRadius: T.r,
              cursor: 'pointer',
              fontFamily: T.sans, fontSize: 11.5, fontWeight: 700, letterSpacing: 0.8,
            }}>
            NOT NOW
          </button>
          <button onClick={onContinue}
            style={{
              flex: 1,
              background: acc, color: '#fff', border: 'none',
              padding: '12px 14px',
              borderRadius: T.r,
              cursor: 'pointer',
              fontFamily: T.sans, fontSize: 11.5, fontWeight: 700, letterSpacing: 0.8,
            }}>
            CONTINUE →
          </button>
        </div>
      </div>
    </div>
  )
}
