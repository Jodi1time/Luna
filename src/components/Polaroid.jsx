import { useState } from 'react'
import { T } from '../data/theme'

// A photo styled as a Polaroid — off-white frame, thicker bottom for
// the caption strip, soft drop shadow, slight rotation. Index-driven
// horizontal offset gives the lived-in scrapbook feel (some lean left,
// some lean right, occasionally one sits centered). The actual
// rotation lives on the photo data so it stays consistent across
// renders — see makePhotoMeta() in Journal.jsx.
export default function Polaroid({
  photo,
  index = 0,
  editable = false,
  onRemove,
  width = 180,
}) {
  const [confirming, setConfirming] = useState(false)
  if (!photo?.dataUrl) return null

  // Polaroid framing — proportions tuned to feel like a real one.
  const FRAME_PAD_TOP_X = 10
  const FRAME_PAD_BOTTOM = 34
  const innerW = width - FRAME_PAD_TOP_X * 2
  const innerH = innerW * (photo.h && photo.w ? photo.h / photo.w : 1.18)

  const rot = photo.rot ?? 0
  // Lateral offset varies by index — some stick out left, some right,
  // sometimes nothing. Subtle enough to feel handmade, not chaotic.
  const offsets = [-12, 0, 14, -6, 8, 0, -10]
  const xOffset = photo.offset ?? offsets[index % offsets.length]

  return (
    <div style={{
      display: 'flex',
      justifyContent: index % 2 === 0 ? 'flex-start' : 'flex-end',
      marginLeft: xOffset < 0 ? xOffset : 0,
      marginRight: xOffset > 0 ? xOffset : 0,
      marginTop: 14,
    }}>
      <div style={{
        position: 'relative',
        transform: `rotate(${rot}deg)`,
        transformOrigin: 'center',
        transition: 'transform 0.28s var(--ease-spring)',
      }}
        onMouseEnter={editable ? undefined : undefined}>
        {/* The Polaroid frame */}
        <div style={{
          background: '#FBF7EC',
          padding: `${FRAME_PAD_TOP_X}px ${FRAME_PAD_TOP_X}px ${FRAME_PAD_BOTTOM}px`,
          width,
          boxShadow:
            // Layered shadow: tight contact + soft ambient. Reads
            // like paper laid on paper.
            '0 1px 0 rgba(26,19,16,0.05), ' +
            '0 4px 8px -2px rgba(26,19,16,0.18), ' +
            '0 16px 28px -14px rgba(26,19,16,0.22)',
          borderRadius: 2,
        }}>
          <img
            src={photo.dataUrl}
            alt=""
            draggable={false}
            style={{
              display: 'block',
              width: innerW,
              height: innerH,
              objectFit: 'cover',
              background: '#1a1310',
              borderRadius: 1,
              // A subtle vintage curve — slightly less than full
              // saturation, a touch of contrast. Feels filmic.
              filter: 'saturate(0.92) contrast(1.04)',
            }}
          />
        </div>
        {/* Remove button — only visible in editable mode. Sits in the
            top-right corner of the Polaroid frame, scaled to be
            tappable without being intrusive. */}
        {editable && (
          confirming ? (
            <div style={{
              position: 'absolute', top: -10, right: -10,
              display: 'flex', gap: 4,
              animation: 'fadeUp 0.2s ease-out both',
            }}>
              <button
                onClick={() => { setConfirming(false); onRemove?.() }}
                aria-label="Remove this photo"
                style={{
                  background: T.accent, color: '#fff', border: 'none',
                  borderRadius: 999, padding: '5px 10px',
                  fontFamily: T.sans, fontSize: 11, fontWeight: 700, letterSpacing: 0.8,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                }}>
                REMOVE
              </button>
              <button
                onClick={() => setConfirming(false)}
                aria-label="Keep"
                style={{
                  background: '#fff', color: T.text, border: `1px solid ${T.hair}`,
                  borderRadius: 999, padding: '5px 10px',
                  fontFamily: T.sans, fontSize: 11, fontWeight: 700, letterSpacing: 0.8,
                  cursor: 'pointer',
                }}>
                KEEP
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setConfirming(true) }}
              aria-label="Remove this photo"
              style={{
                position: 'absolute', top: -10, right: -10,
                width: 26, height: 26, borderRadius: '50%',
                background: '#fff',
                border: `1px solid ${T.hair}`,
                color: T.muted,
                cursor: 'pointer', padding: 0,
                fontFamily: T.mono, fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
              }}>
              ✕
            </button>
          )
        )}
      </div>
    </div>
  )
}

// Build the metadata for a freshly-added photo — random rotation
// (-7° to +7°, biased away from 0°) and a horizontal offset chosen
// from a small set so the layout feels scattered, not stamped.
export function makePhotoMeta() {
  const sign = Math.random() < 0.5 ? -1 : 1
  // 2–7° feels handmade; flat photos look like stock card layouts.
  const rot = sign * (2 + Math.random() * 5)
  const offsets = [-14, -8, 0, 0, 8, 12]
  const offset = offsets[Math.floor(Math.random() * offsets.length)]
  return { rot: Number(rot.toFixed(2)), offset }
}
