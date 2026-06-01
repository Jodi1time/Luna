import { useMemo, useState, useRef, useEffect } from 'react'
import { T } from '../data/theme'
import { Screen, Icons } from '../components/shared'
import { PhaseFlourish } from '../components/phaseFlourishes'
import { useCycle } from '../hooks/useCycle'
import { resolveTheme, DEFAULT_JOURNAL_THEME } from '../data/journalThemes'
import JournalDecorations from '../components/JournalDecorations'
import JournalCustomizer from '../components/JournalCustomizer'
import useLuna from '../store/useLuna'

const LINE_H = 28

// Format a timestamp as a notebook page header.
//   Same-day:   "Today · 7:42 PM"
//   Other:      "Friday, May 31 · 7:42 PM"
function formatEntryDate(iso, todayISO) {
  const d = new Date(iso)
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const dateISO = d.toISOString().slice(0, 10)
  if (dateISO === todayISO) return `Today · ${time}`
  return `${d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · ${time}`
}

// Lined-paper background — phase / theme accent margin + horizontal
// ruled lines + paper colour. Composed as three layered backgrounds
// so the margin sits on top of the ruled lines.
function paperBackground(theme) {
  return [
    `linear-gradient(to right, transparent 32px, ${theme.accent}55 32px, ${theme.accent}55 33px, transparent 33px)`,
    `repeating-linear-gradient(to bottom, transparent 0, transparent ${LINE_H - 1}px, rgba(26,19,16,0.08) ${LINE_H - 1}px, rgba(26,19,16,0.08) ${LINE_H}px)`,
    theme.paper,
  ].join(', ')
}

// New-entry composer — a notebook page that's empty until the user
// writes. Save commits it as its own entry (with timestamp), clears
// the input so they can start the next page.
function EntryComposer({ theme, decorations, onSave, phaseId }) {
  const [text, setText] = useState('')
  const taRef = useRef(null)
  useEffect(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    const min = LINE_H * 5
    el.style.height = `${Math.max(min, el.scrollHeight)}px`
  }, [text])
  const canSave = text.trim().length > 0
  const handleSave = () => {
    if (!canSave) return
    onSave(text)
    setText('')
    if (taRef.current) taRef.current.style.height = `${LINE_H * 5}px`
  }
  return (
    <div style={{
      background: paperBackground(theme),
      borderRadius: T.r,
      padding: '20px 22px 22px 44px',
      boxShadow: '0 1px 0 rgba(26,19,16,0.04), 0 12px 28px -18px rgba(26,19,16,0.18)',
      marginBottom: 22,
      position: 'relative',
      color: theme.text,
    }}>
      <JournalDecorations decorations={decorations} accent={theme.accent} opacity={0.1} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
          <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.4, fontWeight: 600, color: theme.accent, opacity: 0.85 }}>
            A NEW PAGE
          </div>
          {phaseId && (
            <span aria-hidden="true" style={{ color: theme.accent, opacity: 0.55, display: 'inline-flex' }}>
              <PhaseFlourish phaseId={phaseId} size={18} />
            </span>
          )}
        </div>
        <textarea
          ref={taRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Whatever's on your mind — start writing."
          maxLength={6000}
          style={{
            width: '100%', background: 'transparent', border: 'none', outline: 'none', resize: 'none',
            padding: 0,
            fontFamily: T.serif, fontStyle: 'italic', fontSize: 16,
            lineHeight: `${LINE_H}px`,
            color: theme.text,
            minHeight: LINE_H * 5,
            display: 'block',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button onClick={handleSave} disabled={!canSave}
            style={{
              background: canSave ? theme.accent : 'rgba(26,19,16,0.08)',
              color: canSave ? '#fff' : T.muted,
              border: 'none',
              padding: '9px 16px',
              borderRadius: T.r,
              cursor: canSave ? 'pointer' : 'default',
              fontFamily: T.sans, fontSize: 11.5, fontWeight: 700, letterSpacing: 1,
              transition: 'background 0.25s var(--ease-out), color 0.25s var(--ease-out)',
            }}>
            SAVE PAGE
          </button>
        </div>
      </div>
    </div>
  )
}

// A past entry — read mode by default, tap to edit in place. Trash
// icon in the corner deletes after a single confirm.
function EntryPage({ entry, theme, decorations, todayISO, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(entry.body)
  const taRef = useRef(null)
  useEffect(() => { setText(entry.body) }, [entry.body])
  useEffect(() => {
    if (!editing) return
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    const min = LINE_H * 4
    el.style.height = `${Math.max(min, el.scrollHeight)}px`
  }, [editing, text])
  const save = () => {
    if (text.trim() && text !== entry.body) onUpdate({ body: text.trim() })
    setEditing(false)
  }
  const handleDelete = (e) => {
    e.stopPropagation()
    if (!window.confirm('Tear this page out? This cannot be undone.')) return
    onDelete()
  }
  return (
    <div
      onClick={editing ? undefined : () => setEditing(true)}
      style={{
        background: paperBackground(theme),
        borderRadius: T.r,
        padding: '18px 22px 22px 44px',
        boxShadow: '0 1px 0 rgba(26,19,16,0.04), 0 8px 22px -16px rgba(26,19,16,0.16)',
        marginBottom: 16,
        cursor: editing ? 'text' : 'pointer',
        position: 'relative',
        color: theme.text,
      }}>
      <JournalDecorations decorations={decorations} accent={theme.accent} opacity={0.08} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
          <div style={{ fontFamily: T.serif, fontSize: 17, fontStyle: 'italic', fontWeight: 500, letterSpacing: -0.2, color: theme.text }}>
            {formatEntryDate(entry.createdAt, todayISO)}.
          </div>
          <button onClick={handleDelete}
            aria-label="Delete this entry"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.accent, opacity: 0.5, padding: 4, fontFamily: T.mono, fontSize: 11, letterSpacing: 0.5, fontWeight: 600 }}>
            ✕
          </button>
        </div>
        {editing ? (
          <>
            <textarea
              ref={taRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={save}
              autoFocus
              maxLength={6000}
              style={{
                width: '100%', background: 'transparent', border: 'none', outline: 'none', resize: 'none',
                padding: 0,
                fontFamily: T.serif, fontStyle: 'italic', fontSize: 15.5,
                lineHeight: `${LINE_H}px`,
                color: theme.text,
                minHeight: LINE_H * 4,
                display: 'block',
              }}
            />
            <div style={{ fontFamily: T.mono, fontSize: 9.5, color: theme.accent, opacity: 0.7, letterSpacing: 1, marginTop: 8 }}>
              TAP OUTSIDE TO SAVE
            </div>
          </>
        ) : (
          <div style={{
            fontFamily: T.serif, fontStyle: 'italic', fontSize: 15.5,
            lineHeight: `${LINE_H}px`, color: theme.text,
            whiteSpace: 'pre-wrap',
          }}>
            {entry.body}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Journal() {
  const store = useLuna()
  const { back, saveJournalEntry, updateJournalEntry, deleteJournalEntry, updateJournalTheme } = store
  const settings = useLuna((s) => s.settings)
  const cycle = useCycle(store)
  const phase = cycle?.phase
  const entries = settings?.journalEntries || []
  const journalTheme = settings?.journalTheme || DEFAULT_JOURNAL_THEME
  const theme = useMemo(
    () => resolveTheme(journalTheme.themeId, phase?.color),
    [journalTheme.themeId, phase?.color]
  )
  const todayISO = new Date().toISOString().slice(0, 10)
  const [customizing, setCustomizing] = useState(false)

  const handleSaveEntry = (body) => { saveJournalEntry(body) }
  const handleChangeTheme = (themeId) => { updateJournalTheme({ themeId }) }
  const handleToggleDecoration = (id) => {
    const cur = journalTheme.decorations || []
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    updateJournalTheme({ decorations: next })
  }
  const handleToggleApplyToApp = () => {
    updateJournalTheme({ applyToApp: !journalTheme.applyToApp })
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: theme.paper, color: theme.text, overflow: 'hidden', transition: 'background 0.4s var(--ease-out)' }}>
      <Screen>
        <div style={{ padding: '12px 18px 0' }}>
          {/* Header */}
          <div className="insight-stagger" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0 14px', animationDelay: '0ms' }}>
            <button onClick={back} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.text, opacity: 0.55, padding: 6 }}>
              {Icons.close}
            </button>
            <div style={{ fontFamily: T.serif, fontSize: 18, fontStyle: 'italic', fontWeight: 500, letterSpacing: -0.2, color: theme.text }}>
              The diary.
            </div>
            <button onClick={() => setCustomizing(true)}
              aria-label="Customize the journal"
              style={{ background: 'none', border: `1px solid ${theme.accent}66`, color: theme.accent, padding: '5px 10px', borderRadius: 999, fontFamily: T.sans, fontSize: 10, fontWeight: 700, letterSpacing: 0.8, cursor: 'pointer' }}>
              DECORATE
            </button>
          </div>

          {/* New-page composer */}
          <div className="insight-stagger" style={{ animationDelay: '50ms' }}>
            <EntryComposer
              theme={theme}
              decorations={journalTheme.decorations || []}
              onSave={handleSaveEntry}
              phaseId={phase?.id}
            />
          </div>

          {/* Earlier entries */}
          {entries.length > 0 && (
            <>
              <div className="insight-stagger" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0 14px', animationDelay: '110ms' }}>
                <div style={{ flex: 1, height: 1, background: theme.accent + '33' }} />
                <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.4, fontWeight: 600, color: theme.text, opacity: 0.55 }}>
                  EARLIER PAGES · {entries.length}
                </div>
                <div style={{ flex: 1, height: 1, background: theme.accent + '33' }} />
              </div>
              {entries.map((entry, i) => (
                <div key={entry.id} className="insight-stagger" style={{ animationDelay: `${160 + i * 50}ms` }}>
                  <EntryPage
                    entry={entry}
                    theme={theme}
                    decorations={journalTheme.decorations || []}
                    todayISO={todayISO}
                    onUpdate={(p) => updateJournalEntry(entry.id, p)}
                    onDelete={() => deleteJournalEntry(entry.id)}
                  />
                </div>
              ))}
            </>
          )}

          {entries.length === 0 && (
            <div className="insight-stagger" style={{ textAlign: 'center', padding: '8px 22px 32px', fontFamily: T.serif, fontSize: 13, fontStyle: 'italic', color: theme.text, opacity: 0.55, lineHeight: 1.6, animationDelay: '180ms' }}>
              The book is empty. Whatever you save here becomes a page.
            </div>
          )}

          <div style={{ height: 24 }} />
        </div>
      </Screen>

      <JournalCustomizer
        open={customizing}
        onClose={() => setCustomizing(false)}
        themeId={journalTheme.themeId}
        decorations={journalTheme.decorations || []}
        applyToApp={journalTheme.applyToApp}
        resolvedAccent={theme.accent}
        onChangeTheme={handleChangeTheme}
        onToggleDecoration={handleToggleDecoration}
        onToggleApplyToApp={handleToggleApplyToApp}
      />
    </div>
  )
}
