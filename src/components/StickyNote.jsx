import { T } from '../data/theme'

// A small hand-drawn sticky note for the Home screen — cream-yellow
// paper with a strip of washi tape at the top, a soft drop shadow, and
// a gentle tilt. Editorial register; not a card. Used to surface
// whatever the user wanted to remember today (or yesterday, or a year
// ago today). Tap → opens the day's Log.
//
// The tilt is deterministic per day-of-month so it doesn't jitter
// on every render — a sticky note that subtly leans the same way all
// day feels physical; one that re-rolls its rotation each render
// reads as broken.

function tiltFromSeed(seed) {
  // -2.5° to +2.5° based on the seed
  const range = 5
  const v = ((seed * 137 + 11) % 100) / 100
  return -range / 2 + v * range
}

export default function StickyNote({ eyebrow, body, signature, tapeColor = T.accent, seed = 1, onTap }) {
  // Stronger tilt for the corner-tucked layout — looks pinned in, not flat.
  const baseTilt = tiltFromSeed(seed)
  const tilt = baseTilt > 0 ? baseTilt + 4 : baseTilt - 4
  const tapeTilt = -tilt * 0.4

  return (
    // Right-aligned container — sticky note hugs the right edge,
    // peeking out into the corner like it's tucked there.
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4, marginBottom: 8, marginRight: -10 }}>
      <button onClick={onTap}
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          padding: 0, fontFamily: 'inherit',
          transition: 'transform 0.25s ease-out',
        }}
        onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)' }}
        onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
        onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.97)' }}
        onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)' }}>
        <div style={{
          position: 'relative',
          background: 'linear-gradient(135deg, #FBEFC2 0%, #F5DE7E 100%)',
          padding: '22px 18px 16px',
          transform: `rotate(${tilt}deg)`,
          boxShadow: '0 16px 32px -14px rgba(26,19,16,0.38), 0 4px 10px -2px rgba(26,19,16,0.16), inset 0 1px 0 rgba(255,255,255,0.4)',
          width: 200,
          minHeight: 96,
          borderRadius: 2,
          textAlign: 'left',
          color: '#2A1A14',
        }}>
          {/* Washi tape strip across the top — semi-translucent so the
              paper texture below shows through, tilted slightly opposite
              the paper for hand-placed feel. */}
          <div aria-hidden="true" style={{
            position: 'absolute',
            top: -9, left: '50%',
            transform: `translateX(-50%) rotate(${tapeTilt}deg)`,
            width: 78, height: 18,
            background: `linear-gradient(180deg, ${tapeColor}55 0%, ${tapeColor}28 100%)`,
            borderRadius: 1,
            boxShadow: '0 2px 4px rgba(26,19,16,0.08)',
          }} />

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
            fontStyle: 'italic', lineHeight: 1.45,
            color: '#2A1A14', letterSpacing: -0.1,
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
      </button>
    </div>
  )
}
