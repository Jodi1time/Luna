import { useMemo, useState, useEffect, useRef } from 'react'
import { T } from '../data/theme'
import { Screen, Icons } from '../components/shared'
import { PhaseFlourish } from '../components/phaseFlourishes'
import { useCycle } from '../hooks/useCycle'
import useLuna from '../store/useLuna'

const LINE_H = 28

// Format an ISO date as a notebook page header: "Friday, May 31"
function formatPageDate(iso) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

// Friendly "X days ago" — short and quiet, used on past pages.
function ago(iso, todayISO) {
  const a = new Date(todayISO + 'T00:00:00')
  const b = new Date(iso + 'T00:00:00')
  const days = Math.round((a - b) / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7)   return `${days} days ago`
  if (days < 14)  return 'last week'
  if (days < 30)  return `${Math.round(days / 7)} weeks ago`
  if (days < 365) return `${Math.round(days / 30)} months ago`
  return `${Math.round(days / 365)} years ago`
}

// Lined-paper background — three layers: vertical margin line in
// phase accent, horizontal ruled lines, warm cream paper.
function paperBackground(accent) {
  return [
    `linear-gradient(to right, transparent 32px, ${accent}55 32px, ${accent}55 33px, transparent 33px)`,
    `repeating-linear-gradient(to bottom, transparent 0, transparent ${LINE_H - 1}px, rgba(26,19,16,0.08) ${LINE_H - 1}px, rgba(26,19,16,0.08) ${LINE_H}px)`,
    '#FAF4DC',
  ].join(', ')
}

// Today's page — editable, autosaves to log.note with a short
// debounce so every keystroke isn't a write.
function TodayPage({ todayISO, todayNote, save, accent, phaseId }) {
  const [text, setText] = useState(todayNote || '')
  const taRef = useRef(null)
  const saveT = useRef(null)
  useEffect(() => { setText(todayNote || '') }, [todayNote])
  // Debounced autosave
  useEffect(() => {
    if (text === (todayNote || '')) return
    if (saveT.current) clearTimeout(saveT.current)
    saveT.current = setTimeout(() => { save(text) }, 700)
    return () => { if (saveT.current) clearTimeout(saveT.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])
  // Save on blur — covers the case where the user leaves the screen
  // before the debounce fires.
  const flush = () => { if (text !== (todayNote || '')) save(text) }
  // Auto-grow the textarea so the page expands as the user writes.
  useEffect(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    const min = LINE_H * 6
    el.style.height = `${Math.max(min, el.scrollHeight)}px`
  }, [text])
  return (
    <div style={{
      background: paperBackground(accent),
      borderRadius: T.r,
      padding: '20px 22px 28px 44px',
      boxShadow: '0 1px 0 rgba(26,19,16,0.04), 0 12px 28px -18px rgba(26,19,16,0.18)',
      marginBottom: 26,
      position: 'relative',
    }}>
      {/* Page header — italic serif date, phase flourish in the corner */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
        <div style={{ fontFamily: T.serif, fontSize: 22, fontStyle: 'italic', fontWeight: 500, letterSpacing: -0.3, lineHeight: 1.2 }}>
          {formatPageDate(todayISO)}.
        </div>
        {phaseId && (
          <span aria-hidden="true" style={{ color: accent, opacity: 0.6, display: 'inline-flex' }}>
            <PhaseFlourish phaseId={phaseId} size={20} />
          </span>
        )}
      </div>
      {/* Subtle eyebrow in mono — "page X / today / writing" register */}
      <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: 1.4, fontWeight: 600, color: accent, opacity: 0.7, marginBottom: 10 }}>
        TODAY'S PAGE
      </div>
      <textarea
        ref={taRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={flush}
        placeholder="What did today feel like? Anything you want to remember…"
        maxLength={4000}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          resize: 'none',
          padding: 0,
          fontFamily: T.serif,
          fontStyle: 'italic',
          fontSize: 16,
          lineHeight: `${LINE_H}px`,
          color: T.text,
          minHeight: LINE_H * 6,
          display: 'block',
        }}
      />
    </div>
  )
}

// A past page — read-only preview, tap to open that day's Log for editing.
function PastPage({ iso, note, todayISO, accent, onTap }) {
  // Truncate gently so the page is a preview, not the whole entry.
  const preview = note.length > 380 ? note.slice(0, 376).trimEnd() + '…' : note
  return (
    <button onClick={onTap}
      style={{
        width: '100%',
        textAlign: 'left',
        background: paperBackground(accent),
        borderRadius: T.r,
        padding: '18px 22px 22px 44px',
        boxShadow: '0 1px 0 rgba(26,19,16,0.04), 0 8px 22px -16px rgba(26,19,16,0.16)',
        marginBottom: 16,
        border: 'none',
        cursor: 'pointer',
        color: T.text,
        fontFamily: 'inherit',
        position: 'relative',
      }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
        <div style={{ fontFamily: T.serif, fontSize: 18, fontStyle: 'italic', fontWeight: 500, letterSpacing: -0.2 }}>
          {formatPageDate(iso)}.
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: 1, fontWeight: 600, color: T.muted }}>
          {ago(iso, todayISO).toUpperCase()}
        </div>
      </div>
      <div style={{
        fontFamily: T.serif, fontStyle: 'italic', fontSize: 15,
        lineHeight: `${LINE_H}px`, color: T.text,
        whiteSpace: 'pre-wrap',
      }}>
        {preview}
      </div>
    </button>
  )
}

export default function Journal() {
  const store = useLuna()
  const { back, saveLog, logs, setActiveLogDate, go } = store
  const cycle = useCycle(store)
  const phase = cycle?.phase
  const accent = phase?.color || T.accent
  const todayISO = new Date().toISOString().slice(0, 10)
  const todayNote = (logs?.[todayISO]?.note || '').toString()

  const save = (text) => {
    const existing = logs?.[todayISO] || {}
    saveLog(new Date(), { ...existing, note: text })
  }

  // Past pages — every day other than today that has a non-empty note,
  // newest first. Filter quietly so the list stays the user's writing,
  // not an audit of empty days.
  const pastPages = useMemo(() => {
    const entries = []
    for (const [iso, log] of Object.entries(logs || {})) {
      if (iso === todayISO) continue
      const note = (log?.note || '').toString().trim()
      if (!note) continue
      entries.push({ iso, note })
    }
    entries.sort((a, b) => (a.iso < b.iso ? 1 : -1))
    return entries
  }, [logs, todayISO])

  const openPastDay = (iso) => {
    setActiveLogDate(iso)
    go('log')
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: T.bg, color: T.text, overflow: 'hidden' }}>
      <Screen>
        <div style={{ padding: '12px 18px 0' }}>
          {/* Header — back arrow + small "Journal" title */}
          <div className="insight-stagger" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0 14px', animationDelay: '0ms' }}>
            <button onClick={back} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 6 }}>
              {Icons.close}
            </button>
            <div style={{ fontFamily: T.serif, fontSize: 18, fontStyle: 'italic', fontWeight: 500, letterSpacing: -0.2, color: T.text }}>
              The journal.
            </div>
            <div style={{ width: 30 }} />
          </div>

          {/* Today's page — editable */}
          <div className="insight-stagger" style={{ animationDelay: '60ms' }}>
            <TodayPage
              todayISO={todayISO}
              todayNote={todayNote}
              save={save}
              accent={accent}
              phaseId={phase?.id}
            />
          </div>

          {/* Past pages — divider eyebrow + stack of read-only pages */}
          {pastPages.length > 0 && (
            <>
              <div className="insight-stagger" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0 14px', animationDelay: '140ms' }}>
                <div style={{ flex: 1, height: 1, background: T.hair }} />
                <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.4, fontWeight: 600, color: T.muted }}>
                  EARLIER PAGES
                </div>
                <div style={{ flex: 1, height: 1, background: T.hair }} />
              </div>
              {pastPages.map((p, i) => (
                <div key={p.iso} className="insight-stagger" style={{ animationDelay: `${180 + i * 60}ms` }}>
                  <PastPage
                    iso={p.iso}
                    note={p.note}
                    todayISO={todayISO}
                    accent={accent}
                    onTap={() => openPastDay(p.iso)}
                  />
                </div>
              ))}
            </>
          )}

          {/* Empty-past state — only shown when today has content but
              no prior pages exist. A quiet promise that the book grows. */}
          {pastPages.length === 0 && todayNote.trim().length > 0 && (
            <div className="insight-stagger" style={{ textAlign: 'center', padding: '20px 22px 32px', fontFamily: T.serif, fontSize: 13, fontStyle: 'italic', color: T.muted, lineHeight: 1.6, animationDelay: '160ms' }}>
              This is page one. The book grows from here.
            </div>
          )}

          <div style={{ height: 24 }} />
        </div>
      </Screen>
    </div>
  )
}
