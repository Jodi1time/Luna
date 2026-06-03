import { useState } from 'react'
import { T } from '../data/theme'

// SourceTag — inline citation chip. Sits beside a claim and names the
// authority. The depth differentiator vs Flo: every line that asserts
// something medical can name where the assertion comes from.
export function SourceTag({ children, color, compact = false }) {
  if (!children) return null
  const acc = color || T.muted
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: compact ? '2px 7px' : '3px 8px',
      borderRadius: 999,
      background: `${acc}10`,
      border: `1px solid ${acc}28`,
      fontFamily: T.mono,
      fontSize: compact ? 8.5 : 9.5,
      letterSpacing: 0.6,
      fontWeight: 600,
      color: acc,
      lineHeight: 1.2,
      verticalAlign: 'middle',
      whiteSpace: 'nowrap',
      maxWidth: '100%',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }}>
      <span aria-hidden="true" style={{
        width: 4, height: 4, borderRadius: 999, background: acc, opacity: 0.8, flexShrink: 0,
      }} />
      {children}
    </span>
  )
}

// WhyChip — small "why?" affordance that expands into a sourced
// rationale. Used beside predictions and pattern cards so the user
// can pull on any claim and see Luna's reasoning.
export function WhyChip({ label = 'why?', children, source, color, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  const acc = color || T.accent
  return (
    <div style={{ marginTop: 8 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: open ? `${acc}14` : 'rgba(253,250,245,0.55)',
          border: `1px solid ${open ? acc + '40' : 'rgba(26,19,16,0.08)'}`,
          borderRadius: 999,
          padding: '4px 11px',
          cursor: 'pointer',
          fontFamily: T.serif,
          fontSize: 11.5,
          fontStyle: 'italic',
          color: open ? acc : T.muted,
          letterSpacing: -0.1,
          fontWeight: 500,
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          transition: 'all 0.2s var(--ease-out)',
        }}
      >
        <span style={{
          width: 5, height: 5, borderRadius: 999, background: open ? acc : T.muted, opacity: 0.7,
        }} aria-hidden="true" />
        {label}
        <span aria-hidden="true" style={{
          display: 'inline-block',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s var(--ease-out)',
          fontSize: 9,
          marginLeft: 1,
        }}>▾</span>
      </button>
      {open && (
        <div style={{
          marginTop: 8,
          padding: '11px 14px',
          background: 'rgba(253,250,245,0.55)',
          border: `1px solid ${acc}22`,
          borderLeft: `2px solid ${acc}`,
          borderRadius: 14,
          fontFamily: T.serif,
          fontSize: 13,
          fontStyle: 'italic',
          color: T.text,
          lineHeight: 1.55,
          letterSpacing: -0.05,
          animation: 'fadeUp 0.3s ease-out both',
        }}>
          {children}
          {source && (
            <div style={{ marginTop: 8 }}>
              <SourceTag color={acc} compact>{source}</SourceTag>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// LiteracyCard — the canonical body-literacy surface. Eyebrow,
// editorial title, body, source chip. Used by the daily insight card
// on Home and by inline log-time micro-teaching.
export function LiteracyCard({ eyebrow, title, body, source, color, onReadMore, readMoreLabel = 'Read more →', children, category, paper, compact = false }) {
  const acc = color || T.accent
  const bg = paper || 'rgba(253,250,245,0.55)'
  return (
    <div className="alive-card frost-card" style={{
      padding: compact ? '14px 16px' : '18px 18px 16px',
      background: bg,
      border: `1px solid ${acc}22`,
      borderLeft: `3px solid ${acc}`,
      borderRadius: 22,
      boxShadow: `0 1px 0 ${acc}10, 0 14px 30px -22px ${acc}50`,
      animation: 'fadeUp 0.35s ease-out both',
    }}>
      {eyebrow && (
        <div style={{
          fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.2,
          fontWeight: 600, color: acc, marginBottom: 8,
        }}>
          {eyebrow}
        </div>
      )}
      {title && (
        <div style={{
          fontFamily: T.serif, fontSize: compact ? 16 : 19, fontWeight: 500,
          lineHeight: 1.3, letterSpacing: -0.3, marginBottom: body ? 8 : 0,
        }}>
          {title}
        </div>
      )}
      {body && (
        <div style={{
          fontFamily: T.serif, fontSize: 14, lineHeight: 1.6, color: T.text,
          fontStyle: 'italic', opacity: 0.92,
        }}>
          {body}
        </div>
      )}
      {children}
      {(source || onReadMore) && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginTop: 12, paddingTop: 10, borderTop: `1px solid ${acc}14`,
          flexWrap: 'wrap',
        }}>
          {source && <SourceTag color={acc} compact>{source}</SourceTag>}
          {onReadMore && (
            <button
              type="button"
              onClick={onReadMore}
              style={{
                marginLeft: 'auto',
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: acc, fontSize: 11.5, fontWeight: 600, letterSpacing: 0.3,
                fontFamily: T.sans, padding: 0,
              }}
            >
              {readMoreLabel}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
