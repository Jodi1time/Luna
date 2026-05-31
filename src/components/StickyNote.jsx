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
  const tilt = tiltFromSeed(seed)
  const tapeTilt = -tilt * 1.8  // tape tilts opposite for charm

  return (
    <div style={{ padding: '24px 4px 14px', display: 'flex', justifyContent: 'center' }}>
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
          padding: '28px 24px 22px',
          transform: `rotate(${tilt}deg)`,
          boxShadow: '0 14px 28px -12px rgba(26,19,16,0.32), 0 4px 8px -2px rgba(26,19,16,0.12), inset 0 1px 0 rgba(255,255,255,0.4)',
          width: 280,
          minHeight: 110,
          borderRadius: 2,
          textAlign: 'left',
          color: '#2A1A14',
        }}>
          {/* Washi tape strip across the top — semi-translucent so the
              paper texture below shows through, tilted slightly opposite
              the paper for hand-placed feel. */}
          <div aria-hidden="true" style={{
            position: 'absolute',
            top: -11, left: '50%',
            transform: `translateX(-50%) rotate(${tapeTilt}deg)`,
            width: 100, height: 22,
            background: `linear-gradient(180deg, ${tapeColor}55 0%, ${tapeColor}28 100%)`,
            borderRadius: 1,
            boxShadow: '0 2px 4px rgba(26,19,16,0.08)',
          }} />

          {eyebrow && (
            <div style={{
              fontFamily: T.mono, fontSize: 9.5,
              letterSpacing: 1.2, fontWeight: 600,
              color: 'rgba(26,19,16,0.55)', marginBottom: 8,
            }}>
              {eyebrow}
            </div>
          )}
          <div style={{
            fontFamily: T.serif, fontSize: 16,
            fontStyle: 'italic', lineHeight: 1.5,
            color: '#2A1A14', letterSpacing: -0.1,
            wordBreak: 'break-word',
          }}>
            {body}
          </div>
          {signature && (
            <div style={{
              fontFamily: T.serif, fontSize: 12,
              fontStyle: 'italic',
              color: 'rgba(26,19,16,0.5)',
              marginTop: 12, textAlign: 'right',
            }}>
              — {signature}
            </div>
          )}
        </div>
      </button>
    </div>
  )
}
