import { useState, useEffect } from 'react'
import { T } from '../data/theme'

// 4-card walkthrough that fires once on the user's first Home visit.
// Lives in settings.tutorialSeen so it never reshows after dismissal.
// Each card: small icon glyph (serif italic in accent), headline,
// sub copy. Tap "Next" / arrow to advance; "Skip" closes immediately.

const SLIDES = [
  {
    glyph: '☾',
    title: 'Welcome.',
    body:  'This was made for you.',
  },
  {
    glyph: '3',
    title: 'The cover is where you are.',
    body:  'The big number is your cycle day. Tap it for a deeper read. Scroll for your diary, today\'s notes, the small surfaces Luna saves for you.',
  },
  {
    glyph: '✿',
    title: 'Write, decorate, journal.',
    body:  'The sticky note is a line to your future self. The diary is for whatever\'s on your mind — and you can pick the paper, the ornaments, the atmosphere.',
  },
  {
    glyph: '✦',
    title: 'Make the room yours.',
    body:  'Open the diary, tap DECORATE. Backdrop, paper, ornaments. The whole app is your room.',
  },
]

export default function Tutorial({ open, onClose, accent }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (!open) return
    setI(0)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])
  if (!open) return null

  const slide = SLIDES[i]
  const isLast = i === SLIDES.length - 1
  const next = () => {
    if (isLast) onClose()
    else setI(i + 1)
  }
  const acc = accent || T.accent

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 220,
      background: 'rgba(26,19,16,0.42)',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.3s ease-out both',
      padding: '20px',
    }}>
      <div style={{
        width: '100%', maxWidth: 360,
        background: T.bg,
        borderRadius: 22,
        padding: '32px 28px 24px',
        boxShadow: '0 18px 48px rgba(0,0,0,0.22)',
        animation: 'fadeUp 0.42s var(--ease-spring) both',
      }}>
        {/* Skip — top right */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontFamily: T.sans, fontSize: 11, fontWeight: 600, letterSpacing: 1, padding: 4 }}>
            SKIP
          </button>
        </div>
        {/* Big italic serif glyph in accent — keeps the same editorial
            register as the rest of Luna. Different glyph per slide so
            it reads as a brief illustrated tour, not the same card. */}
        <div key={i} style={{
          fontFamily: T.serif, fontStyle: 'italic',
          fontSize: 86, fontWeight: 400,
          color: acc, lineHeight: 1, letterSpacing: -2,
          textAlign: 'center',
          marginBottom: 18,
          animation: 'fadeUp 0.4s var(--ease-out) both',
        }}>
          {slide.glyph}
        </div>
        {/* Title + body — re-animate on slide change with the key trick */}
        <div key={`t-${i}`} style={{
          fontFamily: T.serif, fontSize: 24, fontWeight: 500,
          letterSpacing: -0.5, lineHeight: 1.15,
          color: T.text, textAlign: 'center',
          marginBottom: 12,
          animation: 'fadeUp 0.45s var(--ease-out) 0.05s both',
        }}>
          {slide.title}
        </div>
        <div key={`b-${i}`} style={{
          fontFamily: T.serif, fontSize: 14.5, fontStyle: 'italic',
          lineHeight: 1.55, color: T.muted, textAlign: 'center',
          marginBottom: 24,
          animation: 'fadeUp 0.45s var(--ease-out) 0.12s both',
        }}>
          {slide.body}
        </div>
        {/* Dots indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
          {SLIDES.map((_, idx) => (
            <span key={idx} style={{
              width: idx === i ? 18 : 6,
              height: 6, borderRadius: 3,
              background: idx === i ? acc : 'rgba(26,19,16,0.2)',
              transition: 'all 0.3s var(--ease-out)',
            }} />
          ))}
        </div>
        {/* Next / Got it */}
        <button onClick={next}
          style={{
            width: '100%',
            background: acc, color: '#fff', border: 'none',
            padding: '13px 16px',
            borderRadius: T.r,
            cursor: 'pointer',
            fontFamily: T.sans, fontSize: 12, fontWeight: 700, letterSpacing: 1,
          }}>
          {isLast ? 'GOT IT' : 'NEXT →'}
        </button>
      </div>
    </div>
  )
}
