import { useEffect, useRef, useState } from 'react'
import { T } from '../data/theme'
import useLuna from '../store/useLuna'
import { useScrollLock } from '../lib/useScrollLock'
import Portal from '../lib/Portal'
import { todayKey } from '../lib/dateOnly'

// A tiny bottom-sheet for the "A note" quick action — opens straight
// to a focused textarea, saves to today's log, and closes. Designed
// for the moment you want to leave a sentence for your future self
// without committing to the full Log form.
//
// Honours the store's merge semantics: saveLog merges into the
// existing day's log, so writing a note here never clobbers a flow /
// mood / symptom that was already there.
export default function QuickNote({ open, onClose }) {
  useScrollLock(open)
  const saveLog = useLuna((s) => s.saveLog)
  const getLog = useLuna((s) => s.getLog)
  const soundsOn = useLuna((s) => Boolean(s.settings?.sounds))
  const todayISO = todayKey()
  const existing = open ? (getLog(todayISO) || {}) : {}

  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [keyboardInset, setKeyboardInset] = useState(0)
  const textareaRef = useRef(null)

  // Seed with today's existing note (if any) on open, then focus.
  useEffect(() => {
    if (!open) return
    setText(existing.note || '')
    setSaving(false)
    const id = setTimeout(() => textareaRef.current?.focus(), 80)
    return () => clearTimeout(id)
    // We only re-seed when the sheet opens, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // iOS soft-keyboard tracking, same trick LunaChat uses, so the
  // save button never hides behind the keyboard.
  useEffect(() => {
    if (!open) return
    const vv = typeof window !== 'undefined' && window.visualViewport
    if (!vv) return
    const update = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      setKeyboardInset(inset)
    }
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [open])

  if (!open) return null

  const trimmed = text.trim()
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0

  const handleSave = async () => {
    if (!trimmed || saving) return
    setSaving(true)
    saveLog(new Date(), { note: trimmed })
    try {
      const { chime } = await import('../lib/sounds')
      chime(soundsOn)
    } catch { /* sounds optional */ }
    // Brief pause so the save-pulse can play before we dismiss.
    setTimeout(() => onClose(), 320)
  }

  return (
    <Portal>
    <div
      data-luna-overlay="true"
      onClick={onClose}
      onTouchMove={(e) => e.preventDefault()}
      onWheel={(e) => e.preventDefault()}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(26,19,16,0.55)',
        backdropFilter: 'blur(18px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(18px) saturate(1.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.25s ease-out both',
        touchAction: 'none',
        overscrollBehavior: 'contain',
        padding: 16,
      }}>
      <div onClick={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 430,
          background: T.bg,
          borderRadius: 18,
          boxShadow: '0 24px 60px -12px rgba(0,0,0,0.45)',
          maxHeight: `calc(88dvh - ${keyboardInset}px)`,
          minHeight: `min(420px, calc(70dvh - ${keyboardInset}px))`,
          marginBottom: keyboardInset / 2,
          display: 'flex', flexDirection: 'column',
          animation: 'fadeUp 0.32s cubic-bezier(0.34, 1.36, 0.64, 1) both',
          overflow: 'hidden',
          transition: 'margin-bottom 0.15s ease-out, max-height 0.15s ease-out',
        }}>

        <div style={{ padding: '14px 20px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${T.hair}` }}>
          <div>
            <div style={{ fontFamily: T.serif, fontSize: 16, fontStyle: 'italic', color: T.text, letterSpacing: -0.2 }}>
              A note, for your future self
            </div>
            <div style={{ fontFamily: T.sans, fontSize: 11, color: T.muted, marginTop: 2, letterSpacing: 0.2 }}>
              Saved to today
            </div>
          </div>
          <button onClick={onClose} aria-label="Close"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.muted, padding: 8, fontSize: 16, fontFamily: T.sans }}>
            ✕
          </button>
        </div>

        <div style={{ padding: '16px 18px 12px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minHeight: 0 }}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="A line, a sentence — whatever you want to remember."
            maxLength={2000}
            style={{
              flex: 1,
              background: T.card,
              border: `1px solid ${T.hair}`,
              borderRadius: T.r,
              padding: '14px 16px',
              fontFamily: T.serif,
              fontStyle: 'italic',
              fontSize: 16,
              color: T.text,
              resize: 'none',
              lineHeight: 1.55,
              minHeight: 140,
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, fontFamily: T.mono, color: T.muted, letterSpacing: 0.4, padding: '0 2px' }}>
            <span>
              {wordCount === 0 ? '' : `${wordCount} word${wordCount === 1 ? '' : 's'}`}
            </span>
            <span>{text.length} / 2000</span>
          </div>
        </div>

        <div style={{ padding: '8px 16px 18px', borderTop: `1px solid ${T.hair}`, background: T.bg }}>
          <button onClick={handleSave} disabled={!trimmed || saving}
            className={saving ? 'success-pulse' : ''}
            style={{
              width: '100%',
              background: T.accent,
              color: '#fff',
              border: 'none',
              padding: '13px 16px',
              borderRadius: T.r,
              cursor: (!trimmed || saving) ? 'default' : 'pointer',
              fontFamily: T.sans,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: 0.4,
              opacity: (!trimmed || saving) ? 0.4 : 1,
            }}>
            {saving ? 'Saved' : (existing.note ? 'Update note' : 'Save note')}
          </button>
          {existing.note && !saving && (
            <button onClick={() => {
              if (!window.confirm('Remove the note for today? You can write a new one any time.')) return
              saveLog(new Date(), { note: null })
              setText('')
              setTimeout(() => onClose(), 200)
            }}
              style={{
                width: '100%', marginTop: 8,
                background: 'transparent',
                color: T.muted,
                border: `1px solid ${T.hair}`,
                padding: '11px 16px',
                borderRadius: T.r,
                cursor: 'pointer',
                fontFamily: T.sans,
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: 0.3,
              }}>
              Remove this note
            </button>
          )}
        </div>
      </div>
    </div>
    </Portal>
  )
}
