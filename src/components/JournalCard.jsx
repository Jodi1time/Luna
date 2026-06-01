import { T } from '../data/theme'

const LINE_H = 24

// A small notebook-page card for Home. Shows today's note preview if
// one exists, otherwise a soft "blank page" invitation. The aesthetic
// matches the full Journal screen (cream paper, ruled lines, phase-
// color margin line) so tapping in feels like opening the same book.
export default function JournalCard({ todayNote, accent, onTap }) {
  const trimmed = (todayNote || '').toString().trim()
  const preview = trimmed.length > 180 ? trimmed.slice(0, 176).trimEnd() + '…' : trimmed
  // Three layers: phase-color left margin, horizontal ruled lines,
  // cream paper.
  const paper = [
    `linear-gradient(to right, transparent 28px, ${accent}55 28px, ${accent}55 29px, transparent 29px)`,
    `repeating-linear-gradient(to bottom, transparent 0, transparent ${LINE_H - 1}px, rgba(26,19,16,0.08) ${LINE_H - 1}px, rgba(26,19,16,0.08) ${LINE_H}px)`,
    '#FAF4DC',
  ].join(', ')
  return (
    <button onClick={onTap}
      style={{
        marginTop: 14,
        width: '100%',
        textAlign: 'left',
        background: paper,
        borderRadius: T.r,
        padding: '16px 18px 18px 38px',
        boxShadow: '0 1px 0 rgba(26,19,16,0.04), 0 10px 24px -18px rgba(26,19,16,0.16)',
        border: 'none',
        cursor: 'pointer',
        color: T.text,
        fontFamily: 'inherit',
        position: 'relative',
        display: 'block',
      }}>
      {/* Page corner fold — small triangle in the top-right, signals
          "this is a page, not a card." */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: 0, right: 0,
        width: 0, height: 0,
        borderLeft: '14px solid transparent',
        borderTop: `14px solid ${accent}22`,
      }} />
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.3, fontWeight: 600, color: accent, opacity: 0.85 }}>
          THE JOURNAL
        </div>
        <div style={{ fontFamily: T.sans, fontSize: 10, color: accent, fontWeight: 600, letterSpacing: 0.3 }}>
          {trimmed ? 'Open the book →' : 'Start a page →'}
        </div>
      </div>
      {trimmed ? (
        <div style={{
          fontFamily: T.serif, fontStyle: 'italic', fontSize: 14.5,
          lineHeight: `${LINE_H}px`, color: T.text,
          whiteSpace: 'pre-wrap',
          maxHeight: LINE_H * 4,
          overflow: 'hidden',
        }}>
          {preview}
        </div>
      ) : (
        <div style={{
          fontFamily: T.serif, fontStyle: 'italic', fontSize: 15,
          lineHeight: `${LINE_H}px`, color: T.muted,
          minHeight: LINE_H * 3,
        }}>
          A blank page.<br />
          Whatever you want to put down.
        </div>
      )}
    </button>
  )
}
