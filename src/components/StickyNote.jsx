import { T } from '../data/theme'

// A small hand-drawn sticky note tucked into the top-right corner of
// Home. Cream-yellow paper, washi tape that extends past the edges as
// if stuck onto the home screen behind it, a rolled-up bottom-right
// corner showing the paper's underside, and a gentle tilt. When the
// user hasn't written anything, the sticky note becomes a soft empty-
// state CTA with a hand-drawn doodle arrow arcing toward it.
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
  const paperWidth = 200
  const tapeWidth = 240  // wider than the paper so it visibly extends past both edges, like real tape

  return (
    <div style={{
      position: 'relative',
      display: 'flex', justifyContent: 'flex-end',
      marginTop: 8, marginBottom: 10, marginRight: -10,
      paddingTop: 12,  // gives the tape room to rise above
    }}>

      {/* Hand-drawn doodle arrow — only when the note is empty.
          One curved arc from below-left up to the sticky note, like
          someone scribbled "look here" on the page behind it. */}
      {isEmpty && (
        <svg width="72" height="64" viewBox="0 0 72 64" aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: -16, left: 4,
            color: tapeColor,
            opacity: 0.55,
            animation: 'stickyArrowBreath 3s ease-in-out infinite',
            pointerEvents: 'none',
          }}>
          {/* The arc body — quadratic curves for a hand-drawn feel */}
          <path d="M 8 56 Q 12 38 28 26 Q 44 14 58 10"
            fill="none" stroke="currentColor" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round" />
          {/* The arrowhead — two short strokes off the arc tip */}
          <path d="M 58 10 L 51 11 M 58 10 L 55 17"
            fill="none" stroke="currentColor" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}

      <button onClick={onTap}
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          padding: 0, fontFamily: 'inherit',
          transition: 'transform 0.25s ease-out',
          position: 'relative', zIndex: 1,
        }}
        onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)' }}
        onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
        onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.97)' }}
        onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)' }}>
        <div style={{
          position: 'relative',
          transform: `rotate(${tilt}deg)`,
          filter: 'drop-shadow(0 16px 24px rgba(26,19,16,0.28)) drop-shadow(0 4px 8px rgba(26,19,16,0.14))',
          width: paperWidth,
        }}>
          {/* Paper — bottom-right corner clipped so the curl beneath can show through. */}
          <div style={{
            position: 'relative',
            background: 'linear-gradient(135deg, #FBEFC2 0%, #F5DE7E 100%)',
            padding: '22px 18px 16px',
            width: '100%',
            minHeight: 96,
            borderRadius: 2,
            textAlign: 'left',
            color: '#2A1A14',
            clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)',
          }}>
            {eyebrow && (
              <div style={{
                fontFamily: T.mono, fontSize: 8.5,
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
                fontFamily: T.serif, fontSize: 10.5,
                fontStyle: 'italic',
                color: 'rgba(26,19,16,0.5)',
                marginTop: 8, textAlign: 'right',
              }}>
                — {signature}
              </div>
            )}
          </div>

          {/* The curled-up bottom-right corner. SVG path with a curved
              leading edge (not a flat triangle) and a gradient running
              from light at the fold edge to a deeper amber at the
              folded underside. drop-shadow casts onto the paper below. */}
          <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"
            style={{
              position: 'absolute',
              bottom: -2, right: -2,
              filter: 'drop-shadow(-2px -2px 2px rgba(26,19,16,0.28))',
            }}>
            <defs>
              <linearGradient id={`curl-grad-${seed}`} x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#5A4A12" />
                <stop offset="35%" stopColor="#A8852B" />
                <stop offset="75%" stopColor="#D8B548" />
                <stop offset="100%" stopColor="#F5DE7E" />
              </linearGradient>
            </defs>
            <path
              d="M 2 26 Q 9 22 14 17 Q 19 12 24 4 L 26 26 Z"
              fill={`url(#curl-grad-${seed})`}
            />
          </svg>

          {/* Washi tape strip across the top — extends past both edges
              of the paper so it visually anchors onto the screen behind. */}
          <div aria-hidden="true" style={{
            position: 'absolute',
            top: -16, left: '50%',
            transform: `translate(-50%, 0) rotate(${tapeTilt}deg)`,
            width: tapeWidth, height: 26,
            background: `linear-gradient(180deg, ${tapeColor}50 0%, ${tapeColor}35 50%, ${tapeColor}20 100%)`,
            borderRadius: 1,
            boxShadow: '0 2px 4px rgba(26,19,16,0.12)',
            // Slight ridges via repeating gradient — like real washi tape grain
            backgroundImage: `linear-gradient(180deg, ${tapeColor}50 0%, ${tapeColor}30 100%), repeating-linear-gradient(90deg, transparent 0, transparent 4px, rgba(255,255,255,0.04) 4px, rgba(255,255,255,0.04) 5px)`,
          }} />
        </div>
      </button>
    </div>
  )
}
