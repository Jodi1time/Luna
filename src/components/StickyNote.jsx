import { T } from '../data/theme'

// A small hand-drawn sticky note tucked into the top-right corner of
// Home. Cream-yellow paper with a strip of washi tape, a rolled-up
// bottom-right corner showing the paper's underside, and a gentle
// tilt. Editorial register; not a card. When the user has something
// to remember (today's own note, a resurfaced past note), the body
// is the content. When she hasn't written anything, the sticky note
// becomes a soft empty-state CTA — "Leave a note for your future
// self" — with two faint hand-drawn arrows pulsing toward it to
// invite the tap.
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
  isEmpty = false,         // when true, render attention arrows
}) {
  const baseTilt = tiltFromSeed(seed)
  const tilt = baseTilt > 0 ? baseTilt + 4 : baseTilt - 4
  const tapeTilt = -tilt * 0.4

  return (
    <div style={{
      position: 'relative',
      display: 'flex', justifyContent: 'flex-end',
      marginTop: 4, marginBottom: 8, marginRight: -10,
    }}>

      {/* Attention arrows — only shown when the note is empty.
          Two tiny hand-drawn curls pointing at the paper, breathing
          softly so they catch the eye without nagging. */}
      {isEmpty && (
        <>
          <svg width="42" height="36" viewBox="0 0 42 36" aria-hidden="true"
            style={{
              position: 'absolute',
              top: 28, left: 16,
              opacity: 0.55,
              color: tapeColor,
              animation: 'stickyArrowBreath 3s ease-in-out infinite',
            }}>
            <path d="M 4 6 Q 18 4 30 18 Q 32 20 33 23"
              fill="none" stroke="currentColor" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 30 18 L 36 22 M 30 18 L 33 12"
              fill="none" stroke="currentColor" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <svg width="34" height="48" viewBox="0 0 34 48" aria-hidden="true"
            style={{
              position: 'absolute',
              bottom: -6, left: 36,
              opacity: 0.45,
              color: tapeColor,
              animation: 'stickyArrowBreath 3s ease-in-out infinite 0.6s',
            }}>
            <path d="M 6 44 Q 4 26 18 14 Q 22 11 26 9"
              fill="none" stroke="currentColor" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 26 9 L 21 9 M 26 9 L 25 14"
              fill="none" stroke="currentColor" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </>
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
        }}>
          {/* Paper — bottom-right corner clipped so the rolled-up curl
              underneath can peek through. */}
          <div style={{
            position: 'relative',
            background: 'linear-gradient(135deg, #FBEFC2 0%, #F5DE7E 100%)',
            padding: '22px 18px 16px',
            width: 200,
            minHeight: 96,
            borderRadius: 2,
            textAlign: 'left',
            color: '#2A1A14',
            clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)',
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

          {/* The curled-up bottom-right corner. A small triangle showing
              the underside of the paper — slightly darker amber with a
              soft inner shadow so it reads as folded back. */}
          <div aria-hidden="true" style={{
            position: 'absolute',
            bottom: 0, right: 0,
            width: 16, height: 16,
            background: 'linear-gradient(135deg, #D8B548 0%, #B89627 100%)',
            clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
            boxShadow: 'inset 1px 1px 2px rgba(26,19,16,0.18)',
          }} />
        </div>
      </button>
    </div>
  )
}
