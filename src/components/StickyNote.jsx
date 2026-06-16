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
  const baseTilt = tiltFromSeed(seed)
  const tilt = baseTilt > 0 ? baseTilt + 4 : baseTilt - 4
  const tapeTilt = -tilt * 0.4

  return (
    <div style={{
      display: 'flex', justifyContent: 'flex-end',
      marginTop: 2, marginBottom: 10, marginRight: -2,
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
          background: 'linear-gradient(135deg, #FBEFC2 0%, #F5DE7E 100%)',
          padding: '22px 18px 16px',
          transform: `rotate(${tilt}deg)`,
          boxShadow: '0 14px 26px -18px rgba(26,19,16,0.34), 0 2px 8px -3px rgba(26,19,16,0.14), inset 0 1px 0 rgba(255,255,255,0.45)',
          width: 176,
          minHeight: 90,
          borderRadius: 2,
          textAlign: 'left',
          color: '#2A1A14',
        }}>
          {/* Washi tape strip across the top — small, centered, contained
              within the paper. Semi-translucent so the paper shows
              through, tilted slightly opposite the paper for hand-placed
              feel. */}
          <div aria-hidden="true" style={{
            position: 'absolute',
            top: -9, left: '50%',
            transform: `translateX(-50%) rotate(${tapeTilt}deg)`,
            width: 68, height: 16,
            background: `linear-gradient(180deg, ${tapeColor}55 0%, ${tapeColor}28 100%)`,
            borderRadius: 1,
            boxShadow: '0 2px 4px rgba(26,19,16,0.08)',
          }} />

          {eyebrow && (
            <div style={{
              fontFamily: T.mono, fontSize: 9.5,
              letterSpacing: 1.1, fontWeight: 600,
              color: 'rgba(26,19,16,0.55)', marginBottom: 6,
            }}>
              {eyebrow}
            </div>
          )}
          <div style={{
            fontFamily: T.serif, fontSize: 13.5,
            fontStyle: isEmpty ? 'normal' : 'italic',
            lineHeight: 1.45,
            color: isEmpty ? 'rgba(26,19,16,0.65)' : '#2A1A14',
            letterSpacing: -0.1,
            wordBreak: 'break-word',
          }}>
            {body}
          </div>
          {signature && (
            <div style={{
              fontFamily: T.serif, fontSize: 11,
              fontStyle: 'italic',
              color: 'rgba(26,19,16,0.5)',
              marginTop: 8, textAlign: 'right',
            }}>
              {signature}
            </div>
          )}
        </div>
      </button>
    </div>
  )
}
