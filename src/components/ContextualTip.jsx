import { T } from '../data/theme'
import useLuna from '../store/useLuna'

// One-line contextual tip — replaces the swipeable Tutorial wall that
// used to fire on first Home visit. The principle: tutorials get
// skipped; in-context tips get read. Each tip lives where the feature
// itself is, not in a one-shot onboarding overlay the user has to
// dismiss before they can use the app.
//
// Usage: <ContextualTip tipId="diary-intro">A line of doula-toned guidance.</ContextualTip>
//
// Persisted in settings.tipsSeen[] — each tipId added when she dismisses
// it. Never shows again for that user once dismissed.

export default function ContextualTip({ tipId, children, accent }) {
  const settings = useLuna((s) => s.settings)
  const updateSetting = useLuna((s) => s.updateSetting)
  const seen = settings?.tipsSeen || []
  if (!tipId) return null
  if (seen.includes(tipId)) return null
  const acc = accent || T.accent
  const dismiss = () => {
    const next = Array.from(new Set([...seen, tipId]))
    updateSetting('tipsSeen', next)
  }
  return (
    <div className="frost-card" style={{
      position: 'relative',
      padding: '12px 36px 12px 16px',
      marginTop: 10,
      marginBottom: 10,
      background: `linear-gradient(160deg, ${acc}0e, rgba(253,250,245,0.5))`,
      border: `1px solid ${acc}28`,
      borderRadius: 14,
      animation: 'fadeUp 0.32s ease-out both',
    }}>
      <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13.5, lineHeight: 1.55, color: T.text, letterSpacing: -0.1 }}>
        {children}
      </div>
      {/* Quiet × — tap dismisses + marks seen. Top-right, low opacity
          so it doesn't compete with the line itself. */}
      <button onClick={dismiss} aria-label="Got it"
        style={{
          position: 'absolute', top: 6, right: 6,
          width: 24, height: 24, borderRadius: 999,
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: T.muted, fontSize: 16, lineHeight: 1, opacity: 0.55,
          fontFamily: T.serif, padding: 0,
        }}>×</button>
    </div>
  )
}
