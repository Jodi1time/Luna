import { useEffect } from 'react'
import { T } from '../data/theme'
import { JOURNAL_THEMES, THEME_IDS, DECORATIONS } from '../data/journalThemes'
import { BACKDROPS } from './Backdrop'

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
  if (kind === 'petals') {
    return (
      <svg viewBox="0 0 32 44" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <ellipse cx="8"  cy="14" rx="3" ry="6" fill={accent} opacity="0.7" transform="rotate(20 8 14)" />
        <ellipse cx="20" cy="22" rx="3" ry="6" fill={accent} opacity="0.55" transform="rotate(-20 20 22)" />
        <ellipse cx="13" cy="34" rx="3" ry="6" fill={accent} opacity="0.45" transform="rotate(15 13 34)" />
      </svg>
    )
  }
  if (kind === 'constellation') {
    const pts = [[8,8],[22,6],[14,16],[6,22],[24,22],[18,28]]
    return (
      <svg viewBox="0 0 32 32" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <line x1="8" y1="8" x2="22" y2="6"   stroke={accent} strokeWidth="0.6" opacity="0.4" />
        <line x1="22" y1="6" x2="24" y2="22" stroke={accent} strokeWidth="0.6" opacity="0.4" />
        <line x1="14" y1="16" x2="6" y2="22" stroke={accent} strokeWidth="0.6" opacity="0.4" />
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.4" fill={accent} opacity="0.85" />
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
  resolvedAccent,
  onChangeTheme,
  onToggleDecoration,
  onToggleApplyToApp,
  onChangeBackdrop,
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

        {/* Color presets */}
        <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.4, fontWeight: 600, color: T.muted, marginBottom: 10 }}>
          THE PAPER
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 22 }}>
          {THEME_IDS.map((id) => {
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
        </div>

        {/* Backdrop atmosphere — the animated thing behind every screen */}
        <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.4, fontWeight: 600, color: T.muted, marginBottom: 10 }}>
          THE ATMOSPHERE
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 22 }}>
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
