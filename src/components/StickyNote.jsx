import { T } from '../data/theme'

// A small hand-drawn sticky note tucked into the top-right corner of
// Home. Cream-yellow paper with a small strip of washi tape centered
// on the top, a gentle tilt, and a soft drop shadow. When the user
// hasn't written anything, the sticky note becomes a soft empty-state
// CTA — "Leave a note for your future self" — so it's a reliable
// editorial fixture, always on the wall.
//
// The tilt is deterministic per day-of-month so it doesn't jitter
// on every render.

function tiltFromSeed(seed) {
  const range = 5
  const v = ((seed * 137 + 11) % 100) / 100
  return -range / 2 + v * range
}

export default function StickyNote({
  eyebrow, body, signature,
  tapeColor = T.accent,
  seed = 1,
  onTap,
  isEmpty = false,
}) {
  // A whisper of a tilt — hand-placed, not jaunty. The old ±6° plus a
  // yellow sticky + washi tape read clip-arty against the editorial
  // register; this is a cream paper marginalia note instead.
  const tilt = tiltFromSeed(seed) * 0.7

  return (
    <div style={{
      display: 'flex', justifyContent: 'flex-end',
      marginTop: 4, marginBottom: 8, marginRight: -6,
    }}>
      <button onClick={onTap}
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          padding: 0, fontFamily: 'inherit',
          /* Settle wobble on mount — paper landing on the wall.
             Lives on the outer wrapper so the inner rotation tilt
             stays intact when the animation ends. */
          animation: 'stickyNoteSettle 0.7s var(--ease-spring) both',
        }}>
        <div style={{
          position: 'relative',
          // Warm cream paper, in-palette — not a yellow sticky.
          background: 'linear-gradient(135deg, #FCF8EE 0%, #F4EBD9 100%)',
          padding: '14px 16px 14px 17px',
          transform: `rotate(${tilt}deg)`,
          // Softer, warmer, layered elevation + a top light-catch.
          boxShadow: '0 2px 4px rgba(26,19,16,0.05), 0 16px 30px -18px rgba(26,19,16,0.20), inset 0 1px 0 rgba(255,255,255,0.6)',
          border: '1px solid rgba(26,19,16,0.06)',
          // Accent margin rule — the editorial "annotation" detail that
          // replaces the washi tape, echoing Luna's blockquote rules.
          borderLeft: `2.5px solid ${tapeColor}`,
          width: 196,
          minHeight: 78,
          borderRadius: 10,
          textAlign: 'left',
          color: '#2A1A14',
        }}>
          {eyebrow && (
            <div style={{
              fontFamily: T.mono, fontSize: 11,
              letterSpacing: 1, fontWeight: 600,
              color: 'rgba(26,19,16,0.5)', marginBottom: 6,
            }}>
              {eyebrow}
            </div>
          )}
          <div style={{
            fontFamily: T.serif, fontSize: 14,
            fontStyle: isEmpty ? 'normal' : 'italic',
            lineHeight: 1.5,
            color: isEmpty ? 'rgba(26,19,16,0.6)' : '#2A1A14',
            letterSpacing: -0.1,
            wordBreak: 'break-word',
          }}>
            {body}
          </div>
          {signature && (
            <div style={{
              fontFamily: T.serif, fontSize: 11.5,
              fontStyle: 'italic',
              color: 'rgba(26,19,16,0.5)',
              marginTop: 8, textAlign: 'right',
            }}>
              — {signature}
            </div>
          )}
        </div>
      </button>
    </div>
  )
}
