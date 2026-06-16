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
        borderRadius: 22,
        padding: '18px 20px 20px 40px',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.42), 0 12px 28px -22px rgba(26,19,16,0.20)',
        border: `1px solid ${theme.accent}24`,
        cursor: 'pointer',
        color: theme.text,
        fontFamily: 'inherit',
        position: 'relative',
        display: 'block',
        overflow: 'hidden',
      }}>
      <JournalDecorations decorations={jt.decorations || []} accent={theme.accent} opacity={0.16} />
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
          <div style={{ fontFamily: T.serif, fontSize: 13, fontStyle: 'italic', letterSpacing: -0.1, fontWeight: 500, color: theme.accent, opacity: 0.95 }}>
            The diary {entryCount > 0 && `(${entryCount} page${entryCount === 1 ? '' : 's'})`}
          </div>
          <div style={{ fontFamily: T.sans, fontSize: 11, color: theme.accent, fontWeight: 600, letterSpacing: 0.3 }}>
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
            Whatever you want to write. Entries stack here.
          </div>
        )}
      </div>
    </button>
  )
}
