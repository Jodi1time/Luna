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

function Loading({ message }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 40, color: T.muted,
      animation: 'fadeUp 0.3s ease-out both',
    }}>
      <div style={{
        width: 28, height: 28, border: `2px solid ${T.hair}`,
        borderTopColor: T.accent, borderRadius: '50%',
        animation: 'spin 0.9s linear infinite',
      }} />
      <div style={{
        marginTop: 18, fontFamily: T.sans, fontSize: 11,
        letterSpacing: 2, fontWeight: 700, color: T.muted,
      }}>
        {message || 'WORKING…'}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
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
      <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 2, color: T.accent, fontWeight: 700, marginBottom: 14 }}>
        SOMETHING WENT WRONG
      </div>
      <div style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 500, letterSpacing: -0.6, lineHeight: 1.1, marginBottom: 12 }}>
        That didn't work.
      </div>
      <div style={{ fontFamily: T.serif, fontSize: 15, color: T.muted, lineHeight: 1.55, marginBottom: 22 }}>
        {typeof error === 'string' ? error : (error?.message || 'Please try again. If it keeps happening, reload Luna.')}
      </div>
      {onRetry && (
        <CTAButton full onClick={onRetry}>TRY AGAIN</CTAButton>
      )}
    </div>
  )
}

export function StatusView({ loading, loadingMessage, error, onRetry, children }) {
  if (loading) return <Loading message={loadingMessage} />
  if (error)   return <Failed error={error} onRetry={onRetry} />
  return children
}
