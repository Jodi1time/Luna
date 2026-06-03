import { T } from '../data/theme'
import { CTAButton } from './shared'

// Three-state wrapper for screens or sections that have async work:
//   <StatusView loading={busy} error={err} onRetry={...}>{normal content}</StatusView>
//
// - loading: shows a centered, calm loading message
// - error:   shows an editorial error block with optional retry
// - default: renders children
//
// Use this for sections where async actually happens (sign-in,
// unlock, save). Static read-from-store screens don't need it —
// don't bolt this onto everything.

// Pretty loading state — a soft breathing dot in accent over a
// quiet halo, italic-serif "settling…" copy beneath. Replaces the
// uppercase-mono spinner-and-WORKING register, which was the last
// form-wizard tell on this surface.
function Loading({ message }) {
  // Default copy in lowercase sentence case so it lands like Luna
  // would say it. Callers can still pass uppercase legacy strings;
  // we lower-case them for visual consistency.
  const text = (message || 'settling').toString().toLowerCase().replace(/…\s*$/, '')
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 40, color: T.muted,
      animation: 'fadeUp 0.3s ease-out both',
    }}>
      {/* Two concentric circles — outer pulses softly (halo), inner
          breathes (the dot). Both phase-accent tinted. Reads as
          something gentle catching its breath, not a spinner. */}
      <div style={{ position: 'relative', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: `radial-gradient(circle, ${T.accent}28 0%, ${T.accent}00 70%)`,
          animation: 'lunaLoadHalo 2.4s ease-in-out infinite',
        }} />
        <span style={{
          width: 14, height: 14, borderRadius: '50%',
          background: T.accent,
          boxShadow: `0 0 0 0 ${T.accent}55`,
          animation: 'lunaLoadDot 2.4s ease-in-out infinite',
        }} />
      </div>
      <div style={{
        marginTop: 22, fontFamily: T.serif, fontStyle: 'italic',
        fontSize: 15, color: T.muted, letterSpacing: -0.1,
      }}>
        {text}…
      </div>
      <style>{`
        @keyframes lunaLoadHalo {
          0%, 100% { transform: scale(0.85); opacity: 0.6; }
          50%      { transform: scale(1.15); opacity: 1; }
        }
        @keyframes lunaLoadDot {
          0%, 100% { transform: scale(0.92); }
          50%      { transform: scale(1.08); }
        }
      `}</style>
    </div>
  )
}

function Failed({ error, onRetry }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      justifyContent: 'center', padding: '40px 28px', color: T.text,
      animation: 'fadeUp 0.3s ease-out both',
    }}>
      <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: T.accent, fontWeight: 500, letterSpacing: -0.1, marginBottom: 14 }}>
        something didn't come through
      </div>
      <div style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 500, letterSpacing: -0.7, lineHeight: 1.1, marginBottom: 12 }}>
        That didn't work — yet.
      </div>
      <div style={{ fontFamily: T.serif, fontSize: 15, color: T.muted, lineHeight: 1.55, marginBottom: 22, fontStyle: 'italic' }}>
        {typeof error === 'string' ? error : (error?.message || 'Try again in a moment. If it keeps happening, give Luna a fresh open.')}
      </div>
      {onRetry && (
        <CTAButton full onClick={onRetry} style={{ textTransform: 'none', letterSpacing: 0.3, fontSize: 13 }}>Try again</CTAButton>
      )}
    </div>
  )
}

export function StatusView({ loading, loadingMessage, error, onRetry, children }) {
  if (loading) return <Loading message={loadingMessage} />
  if (error)   return <Failed error={error} onRetry={onRetry} />
  return children
}
