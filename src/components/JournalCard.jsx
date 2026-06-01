import { T } from '../data/theme'
import { resolveTheme, DEFAULT_JOURNAL_THEME } from '../data/journalThemes'
import JournalDecorations from './JournalDecorations'

const LINE_H = 24

// A small notebook-page card for Home. Previews the user's most
// recent diary entry (or an empty-state invitation) and tints to
// whatever theme + decorations they've picked for the diary. Tapping
// opens the full journal.
export default function JournalCard({ entries, journalTheme, phaseColor, onTap }) {
  const jt = journalTheme || DEFAULT_JOURNAL_THEME
  const theme = resolveTheme(jt.themeId, phaseColor, jt.custom)
  const latest = (entries && entries[0]) || null
  const preview = latest
    ? (latest.body.length > 180 ? latest.body.slice(0, 176).trimEnd() + '…' : latest.body)
    : null
  const paper = [
    `linear-gradient(to right, transparent 28px, ${theme.accent}55 28px, ${theme.accent}55 29px, transparent 29px)`,
    `repeating-linear-gradient(to bottom, transparent 0, transparent ${LINE_H - 1}px, rgba(26,19,16,0.08) ${LINE_H - 1}px, rgba(26,19,16,0.08) ${LINE_H}px)`,
    theme.paperBg || theme.paper,
  ].join(', ')
  const entryCount = entries?.length || 0
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
        color: theme.text,
        fontFamily: 'inherit',
        position: 'relative',
        display: 'block',
        overflow: 'hidden',
      }}>
      <JournalDecorations decorations={jt.decorations || []} accent={theme.accent} opacity={0.1} />
      {/* Page corner fold — small triangle in the top-right */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: 0, right: 0,
        width: 0, height: 0,
        borderLeft: '14px solid transparent',
        borderTop: `14px solid ${theme.accent}33`,
        zIndex: 2,
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.3, fontWeight: 600, color: theme.accent, opacity: 0.9 }}>
            THE DIARY {entryCount > 0 && `· ${entryCount} PAGE${entryCount === 1 ? '' : 'S'}`}
          </div>
          <div style={{ fontFamily: T.sans, fontSize: 10, color: theme.accent, fontWeight: 600, letterSpacing: 0.3 }}>
            {latest ? 'Open the book →' : 'Start a page →'}
          </div>
        </div>
        {preview ? (
          <div style={{
            fontFamily: T.serif, fontStyle: 'italic', fontSize: 14.5,
            lineHeight: `${LINE_H}px`, color: theme.text,
            whiteSpace: 'pre-wrap',
            maxHeight: LINE_H * 4,
            overflow: 'hidden',
          }}>
            {preview}
          </div>
        ) : (
          <div style={{
            fontFamily: T.serif, fontStyle: 'italic', fontSize: 15,
            lineHeight: `${LINE_H}px`, color: theme.text, opacity: 0.55,
            minHeight: LINE_H * 3,
          }}>
            A blank book.<br />
            Whatever you want to write — entries stack here.
          </div>
        )}
      </div>
    </button>
  )
}
