import { useEffect, useMemo } from 'react'
import { T } from '../data/theme'
import { JOURNAL_THEMES, THEME_IDS, DECORATIONS } from '../data/journalThemes'
import { BACKDROPS } from './Backdrop'
import { generateShades } from '../lib/colorShades'

// Tiny static preview of each backdrop kind for the picker swatch.
// Not animated — that's reserved for the live backdrop. Just enough
// shape to read "moons" vs "aurora" vs "petals" vs "stars" at a glance.
function BackdropPreview({ kind, accent }) {
  if (kind === 'blob') {
    return (
      <div style={{ position: 'absolute', inset: 6, borderRadius: '50%',
        background: accent, opacity: 0.55, filter: 'blur(4px)' }} />
    )
  }
  if (kind === 'moons') {
    return (
      <svg viewBox="0 0 32 32" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <path d="M22 6 A 8 8 0 1 0 22 22 A 6 6 0 1 1 22 6 Z" fill={accent} opacity="0.6" />
        <path d="M10 20 A 5 5 0 1 0 10 30 A 4 4 0 1 1 10 20 Z" fill={accent} opacity="0.45" />
      </svg>
    )
  }
  if (kind === 'aurora') {
    return (
      <>
        <div style={{ position: 'absolute', top: 4, left: 6, width: 22, height: 22, background: accent, opacity: 0.5, filter: 'blur(8px)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: 4, right: 4, width: 18, height: 18, background: accent, opacity: 0.35, filter: 'blur(8px)', borderRadius: '50%' }} />
      </>
    )
  }
  if (kind === 'silk') {
    return (
      <div style={{
        position: 'absolute', inset: -4,
        background: `conic-gradient(from 20deg at 50% 50%, ${accent}22, ${accent}aa, ${accent}33, ${accent}99, ${accent}22)`,
        filter: 'blur(5px)',
        opacity: 0.7,
      }} />
    )
  }
  if (kind === 'petals') {
    return (
      <svg viewBox="0 0 32 44" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <ellipse cx="8"  cy="14" rx="3" ry="6" fill={accent} opacity="0.7" transform="rotate(20 8 14)" />
        <ellipse cx="20" cy="22" rx="3" ry="6" fill={accent} opacity="0.55" transform="rotate(-20 20 22)" />
        <ellipse cx="13" cy="34" rx="3" ry="6" fill={accent} opacity="0.45" transform="rotate(15 13 34)" />
      </svg>
    )
  }
  if (kind === 'bends') {
    return (
      <div style={{
        position: 'absolute', inset: -2,
        background: `linear-gradient(110deg, ${accent}, ${accent}88 35%, ${accent}55 60%, ${accent}aa)`,
        filter: 'blur(3px)',
        opacity: 0.85,
      }} />
    )
  }
  if (kind === 'galaxy') {
    // Mini star field — scattered dots with two faint streak lines
    // hinting at galactic rotation. Static preview; real Galaxy is
    // a WebGL star field, lazy-loaded on selection.
    const pts = [[7,9],[22,6],[14,15],[5,21],[26,20],[19,28],[10,26],[28,12],[18,11]]
    return (
      <svg viewBox="0 0 32 32" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <ellipse cx="16" cy="16" rx="13" ry="4" stroke={accent} strokeWidth="0.4" fill="none" opacity="0.25" transform="rotate(-22 16 16)" />
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.6 : 1.0} fill={accent} opacity={0.6 + (i % 3) * 0.12} />
        ))}
      </svg>
    )
  }
  return null
}

// Bottom-sheet customisation panel — color, decorations, and an
// optional "skin the whole app" toggle. The user's diary, their
// rules.
export default function JournalCustomizer({
  open,
  onClose,
  themeId,
  decorations,
  applyToApp,
  backdropKind,
  backdropAccent,
  custom,
  resolvedAccent,
  onChangeTheme,
  onToggleDecoration,
  onToggleApplyToApp,
  onChangeBackdrop,
  onChangeBackdropAccent,
  onChangeCustom,
}) {
  // Lock body scroll while the sheet is open.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  if (!open) return null

  return (
    <div onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(26,19,16,0.32)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        animation: 'fadeIn 0.25s ease-out both',
      }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 460,
          background: T.bg,
          borderTopLeftRadius: 22, borderTopRightRadius: 22,
          padding: '14px 22px 28px',
          maxHeight: '88dvh', overflowY: 'auto',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.18)',
          animation: 'fadeUp 0.32s var(--ease-drawer) both',
        }}>
        {/* Drag handle */}
        <div aria-hidden="true" style={{
          width: 38, height: 4, background: T.hair, borderRadius: 2,
          margin: '6px auto 16px',
        }} />

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, fontStyle: 'italic', letterSpacing: -0.3 }}>
            Make it yours.
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', color: resolvedAccent, fontFamily: T.sans, fontSize: 11.5, fontWeight: 700, letterSpacing: 1, cursor: 'pointer', padding: 6 }}>
            DONE
          </button>
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 13, color: T.muted, fontStyle: 'italic', lineHeight: 1.5, marginBottom: 18 }}>
          It is your diary, after all.
        </div>

        {/* Color presets — plus a final "Custom" tile that opens the
            color picker below it. */}
        <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.4, fontWeight: 600, color: T.muted, marginBottom: 10 }}>
          THE PAPER
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: themeId === 'custom' ? 14 : 22 }}>
          {THEME_IDS.filter((id) => id !== 'custom').map((id) => {
            const t = JOURNAL_THEMES[id]
            const selected = themeId === id
            return (
              <button key={id} onClick={() => onChangeTheme(id)}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  padding: 4, fontFamily: 'inherit',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 12,
                  background: t.swatch,
                  border: `2px solid ${selected ? (t.accent || resolvedAccent) : 'rgba(26,19,16,0.08)'}`,
                  boxShadow: selected ? `0 0 0 3px ${(t.accent || resolvedAccent)}22` : '0 1px 0 rgba(26,19,16,0.05)',
                  position: 'relative',
                }}>
                  {/* Tiny margin-line + ruled-line preview inside the swatch */}
                  <div style={{
                    position: 'absolute', top: 8, bottom: 8, left: 10, width: 1,
                    background: t.accent || resolvedAccent, opacity: 0.6,
                  }} />
                  <div style={{
                    position: 'absolute', top: 14, left: 14, right: 8, height: 1,
                    background: 'rgba(26,19,16,0.18)',
                  }} />
                  <div style={{
                    position: 'absolute', top: 24, left: 14, right: 8, height: 1,
                    background: 'rgba(26,19,16,0.18)',
                  }} />
                  <div style={{
                    position: 'absolute', top: 34, left: 14, right: 8, height: 1,
                    background: 'rgba(26,19,16,0.18)',
                  }} />
                </div>
                <span style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 600, color: selected ? T.text : T.muted, letterSpacing: 0.3 }}>
                  {t.label}
                </span>
              </button>
            )
          })}
          {/* Custom tile — opens the color picker below when selected.
              Swatch previews the user's current custom color (or
              gradient) so they see exactly what they'll get. */}
          {(() => {
            const selected = themeId === 'custom'
            const swatchBg = custom?.gradient
              ? `linear-gradient(${custom.angle ?? 150}deg, ${custom.color || '#F5E6D3'}, ${custom.color2 || '#E8C8B5'})`
              : (custom?.color || '#F5E6D3')
            return (
              <button onClick={() => onChangeTheme('custom')}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  padding: 4, fontFamily: 'inherit',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 12,
                  background: swatchBg,
                  border: `2px solid ${selected ? resolvedAccent : 'rgba(26,19,16,0.08)'}`,
                  boxShadow: selected ? `0 0 0 3px ${resolvedAccent}22` : '0 1px 0 rgba(26,19,16,0.05)',
                  position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {/* A small "+" mark so the tile reads as "build your own,"
                      not just another preset. */}
                  <span style={{ fontFamily: T.serif, fontSize: 22, fontStyle: 'italic', color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.35)', lineHeight: 1 }}>
                    +
                  </span>
                </div>
                <span style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 600, color: selected ? T.text : T.muted, letterSpacing: 0.3 }}>
                  Custom
                </span>
              </button>
            )
          })()}
        </div>

        {/* Custom-paper picker — only appears when themeId === 'custom'.
            Native color inputs for the start (and end, when gradient
            is on) + a gradient toggle + an angle slider for direction. */}
        {themeId === 'custom' && (
          <div style={{
            padding: '14px 14px 16px',
            background: 'rgba(26,19,16,0.03)',
            border: `1px solid ${T.hair}`,
            borderRadius: T.r,
            marginBottom: 22,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: 1.2, fontWeight: 600, color: T.muted }}>
                  {custom?.gradient ? 'START COLOUR' : 'COLOUR'}
                </span>
                <input
                  type="color"
                  value={custom?.color || '#F5E6D3'}
                  onChange={(e) => onChangeCustom?.({ color: e.target.value })}
                  style={{
                    width: '100%', height: 36, border: `1px solid ${T.hair}`,
                    borderRadius: T.r, background: 'transparent', cursor: 'pointer', padding: 2,
                  }}
                />
              </label>
              {custom?.gradient && (
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                  <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: 1.2, fontWeight: 600, color: T.muted }}>
                    END COLOUR
                  </span>
                  <input
                    type="color"
                    value={custom?.color2 || '#E8C8B5'}
                    onChange={(e) => onChangeCustom?.({ color2: e.target.value })}
                    style={{
                      width: '100%', height: 36, border: `1px solid ${T.hair}`,
                      borderRadius: T.r, background: 'transparent', cursor: 'pointer', padding: 2,
                    }}
                  />
                </label>
              )}
            </div>
            <button onClick={() => onChangeCustom?.({ gradient: !custom?.gradient })}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: custom?.gradient ? resolvedAccent + '12' : 'transparent',
                border: `1px solid ${custom?.gradient ? resolvedAccent : T.hair}`,
                borderRadius: T.r, padding: '10px 12px',
                fontFamily: 'inherit', cursor: 'pointer', color: T.text, textAlign: 'left',
              }}>
              <span style={{ fontFamily: T.serif, fontSize: 14, fontStyle: 'italic', letterSpacing: -0.1 }}>
                Blend two colours
              </span>
              <span style={{
                width: 32, height: 18, borderRadius: 9,
                background: custom?.gradient ? resolvedAccent : 'rgba(26,19,16,0.18)',
                position: 'relative',
                transition: 'background 0.25s var(--ease-out)',
              }}>
                <span style={{
                  position: 'absolute', top: 2,
                  left: custom?.gradient ? 16 : 2,
                  width: 14, height: 14, borderRadius: '50%', background: '#fff',
                  transition: 'left 0.25s var(--ease-out)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.18)',
                }} />
              </span>
            </button>
            {custom?.gradient && (
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: 1.2, fontWeight: 600, color: T.muted }}>
                    ANGLE
                  </span>
                  <span style={{ fontFamily: T.mono, fontSize: 10, color: T.text, fontWeight: 500 }}>
                    {custom?.angle ?? 150}°
                  </span>
                </div>
                <input
                  type="range" min={0} max={360} value={custom?.angle ?? 150}
                  onChange={(e) => onChangeCustom?.({ angle: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: resolvedAccent }}
                />
              </label>
            )}
          </div>
        )}

        {/* Backdrop atmosphere — the animated thing behind every screen */}
        <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.4, fontWeight: 600, color: T.muted, marginBottom: 10 }}>
          THE ATMOSPHERE
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 22 }}>
          {BACKDROPS.map((b) => {
            const on = backdropKind === b.id
            return (
              <button key={b.id} onClick={() => onChangeBackdrop(b.id)}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  padding: 4, fontFamily: 'inherit',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: T.bg,
                  border: `2px solid ${on ? resolvedAccent : 'rgba(26,19,16,0.08)'}`,
                  boxShadow: on ? `0 0 0 3px ${resolvedAccent}22` : '0 1px 0 rgba(26,19,16,0.05)',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <BackdropPreview kind={b.id} accent={resolvedAccent} />
                </div>
                <span style={{ fontFamily: T.sans, fontSize: 9.5, fontWeight: 600, color: on ? T.text : T.muted, letterSpacing: 0.3 }}>
                  {b.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Backdrop colour. Default ("Follow your phase") ties the
            backdrop to today's cycle phase — Luna's signature look.
            The shade row offers six tones derived from the user's
            current paper colour — keeps the backdrop in the same
            visual family as the page, so nothing ever clashes. */}
        <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.4, fontWeight: 600, color: T.muted, marginBottom: 10 }}>
          BACKDROP COLOUR
        </div>
        {(() => {
          // The effective paper colour drives the palette. For preset
          // themes that's the theme's paper; for the Custom theme
          // it's whatever the user picked (gradient start if a
          // gradient is on).
          const paperHex = themeId === 'custom'
            ? (custom?.color || '#F5E6D3')
            : (JOURNAL_THEMES[themeId]?.paper || JOURNAL_THEMES.cream.paper)
          const shades = generateShades(paperHex, 6)
          const selectedShade = backdropAccent
            ? shades.findIndex((s) => s.toLowerCase() === backdropAccent.toLowerCase())
            : -1
          return (
            <div style={{ marginBottom: 22 }}>
              <button onClick={() => onChangeBackdropAccent?.(null)}
                style={{
                  width: '100%',
                  background: !backdropAccent ? resolvedAccent + '12' : 'transparent',
                  border: `1px solid ${!backdropAccent ? resolvedAccent : T.hair}`,
                  borderRadius: T.r,
                  padding: '10px 12px',
                  marginBottom: 10,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  color: T.text,
                  textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                <span style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: resolvedAccent,
                  boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.6)',
                  flexShrink: 0,
                }} />
                <span style={{ fontFamily: T.serif, fontSize: 13.5, fontStyle: 'italic', letterSpacing: -0.1 }}>
                  Follow your phase
                </span>
              </button>
              {/* Shade row — six tones of the paper hue from dark to
                  light. Tapping one sets it as the backdrop accent;
                  staying on "Follow your phase" leaves the row
                  unselected. */}
              <div style={{
                fontFamily: T.mono, fontSize: 8.5, letterSpacing: 1.2, fontWeight: 600,
                color: T.muted, marginBottom: 6, opacity: 0.7,
              }}>
                OR PICK A SHADE OF YOUR PAPER
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
                {shades.map((shade, i) => {
                  const on = selectedShade === i
                  return (
                    <button key={shade} onClick={() => onChangeBackdropAccent?.(shade)}
                      aria-label={`Shade ${i + 1}`}
                      style={{
                        aspectRatio: '1',
                        background: shade,
                        border: `2px solid ${on ? resolvedAccent : 'rgba(26,19,16,0.08)'}`,
                        boxShadow: on ? `0 0 0 3px ${resolvedAccent}33` : '0 1px 0 rgba(26,19,16,0.05)',
                        borderRadius: 10,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    />
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* Decorations */}
        <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.4, fontWeight: 600, color: T.muted, marginBottom: 10 }}>
          DECORATE
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 22 }}>
          {DECORATIONS.map((d) => {
            const on = decorations.includes(d.id)
            return (
              <button key={d.id} onClick={() => onToggleDecoration(d.id)}
                style={{
                  background: on ? resolvedAccent + '14' : 'rgba(26,19,16,0.03)',
                  border: `1px solid ${on ? resolvedAccent : T.hair}`,
                  borderRadius: T.r,
                  padding: '12px 8px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  color: on ? resolvedAccent : T.text,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}>
                <span style={{ fontFamily: T.serif, fontSize: 22, lineHeight: 1, color: resolvedAccent }}>
                  {d.emoji}
                </span>
                <span style={{ fontFamily: T.sans, fontSize: 10.5, fontWeight: 600, letterSpacing: 0.3 }}>
                  {d.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Whole-app toggle */}
        <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.4, fontWeight: 600, color: T.muted, marginBottom: 10 }}>
          BEYOND THE BOOK
        </div>
        <button onClick={onToggleApplyToApp}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: applyToApp ? resolvedAccent + '12' : 'rgba(26,19,16,0.03)',
            border: `1px solid ${applyToApp ? resolvedAccent : T.hair}`,
            borderRadius: T.r,
            padding: '14px 16px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            color: T.text,
            textAlign: 'left',
          }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.serif, fontSize: 15, fontWeight: 500, letterSpacing: -0.2 }}>
              Skin the whole app
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 12.5, color: T.muted, fontStyle: 'italic', marginTop: 2 }}>
              Bring the paper + decorations everywhere.
            </div>
          </div>
          <div style={{
            width: 38, height: 22, borderRadius: 11,
            background: applyToApp ? resolvedAccent : 'rgba(26,19,16,0.15)',
            position: 'relative',
            transition: 'background 0.25s var(--ease-out)',
            flexShrink: 0,
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%', background: '#fff',
              position: 'absolute', top: 2,
              left: applyToApp ? 18 : 2,
              transition: 'left 0.25s var(--ease-out)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
            }} />
          </div>
        </button>
      </div>
    </div>
  )
}
