import { useState, useRef, useEffect } from 'react'
import { T } from '../data/theme'
import { chat } from '../lib/lunaChat'

// Small chat overlay that slides up from the bottom. Opens with Luna's
// reflection as the first message, then lets the user reply a few
// times. Hard-capped at 6 user turns so we don't run away on cost or
// emotional weight — at the cap Luna gently closes the conversation
// with a warm note.

const MAX_USER_TURNS = 6

export default function LunaChat({ open, onClose, opener, context }) {
  // messages: { role: 'assistant'|'user', content: string, error?: boolean }[]
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  // Tracks how much of the bottom is being eaten by the soft keyboard
  // on iOS / Android Chrome via the Visual Viewport API. We push the
  // composer up by this amount so it never hides behind the keyboard.
  const [keyboardInset, setKeyboardInset] = useState(0)
  const scrollRef = useRef(null)

  // Seed with the opener whenever a new conversation starts.
  useEffect(() => {
    if (open && opener) {
      setMessages([{ role: 'assistant', content: opener }])
      setDraft('')
    }
  }, [open, opener])

  // Auto-scroll to the latest message.
  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, sending])

  // Track keyboard via Visual Viewport so the composer follows it.
  useEffect(() => {
    if (!open) return
    const vv = typeof window !== 'undefined' && window.visualViewport
    if (!vv) return
    const update = () => {
      // The keyboard is the difference between window height and the
      // visible viewport height. Clamp so we never push beyond.
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

  const userTurns = messages.filter((m) => m.role === 'user').length
  const reachedCap = userTurns >= MAX_USER_TURNS

  const send = async () => {
    const text = draft.trim()
    if (!text || sending || reachedCap) return
    setDraft('')
    const nextMessages = [...messages, { role: 'user', content: text }]
    setMessages(nextMessages)
    setSending(true)
    try {
      const reply = await chat({
        messages: nextMessages.map(({ role, content }) => ({ role, content })),
        phaseId: context?.phaseId,
        phaseName: context?.phaseName,
        cycleDay: context?.cycleDay,
        cycleLength: context?.cycleLength,
      })
      if (reply) {
        setMessages([...nextMessages, { role: 'assistant', content: reply }])
      } else {
        setMessages([...nextMessages, { role: 'assistant', content: "I can't reach myself right now — try again in a moment. Either way, I'm glad you stopped by.", error: true }])
      }
    } finally {
      setSending(false)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(26,19,16,0.45)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        animation: 'fadeIn 0.25s ease-out both',
      }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 430,
          background: T.bg,
          borderTopLeftRadius: 16, borderTopRightRadius: 16,
          /* Use dvh and lift by keyboard inset so the composer stays
             visible even when the soft keyboard is open. */
          maxHeight: `calc(85dvh - ${keyboardInset}px)`,
          marginBottom: keyboardInset,
          display: 'flex', flexDirection: 'column',
          animation: 'fadeUp 0.32s cubic-bezier(0.34, 1.36, 0.64, 1) both',
          overflow: 'hidden',
          transition: 'margin-bottom 0.15s ease-out, max-height 0.15s ease-out',
        }}>
        {/* Header */}
        <div style={{ padding: '14px 20px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${T.hair}` }}>
          <div>
            <div style={{ fontFamily: T.serif, fontSize: 16, fontStyle: 'italic', color: T.text, letterSpacing: -0.2 }}>
              A moment with Luna
            </div>
            <div style={{ fontFamily: T.sans, fontSize: 10.5, color: T.muted, marginTop: 2, letterSpacing: 0.2 }}>
              Not medical advice — a small reflection
            </div>
          </div>
          <button onClick={onClose} aria-label="Close"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.muted, padding: 8, fontSize: 16, fontFamily: T.sans }}>
            ✕
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '82%',
              padding: '11px 14px',
              borderRadius: 14,
              background: m.role === 'user'
                ? T.accent + 'E0'
                : 'rgba(255,255,255,0.7)',
              color: m.role === 'user' ? '#fff' : T.text,
              border: m.role === 'user' ? 'none' : `1px solid ${T.hair}`,
              fontFamily: T.serif,
              fontSize: 14.5,
              lineHeight: 1.5,
              letterSpacing: -0.1,
              animation: 'fadeUp 0.3s ease-out both',
              ...(m.role === 'assistant' ? {
                WebkitBackdropFilter: 'blur(8px)',
                backdropFilter: 'blur(8px)',
              } : {}),
            }}>
              {m.content}
            </div>
          ))}
          {sending && (
            <div style={{ alignSelf: 'flex-start', padding: '11px 14px', color: T.muted, fontFamily: T.serif, fontStyle: 'italic', fontSize: 13.5, opacity: 0.7 }}>
              …
            </div>
          )}
          {reachedCap && !sending && (
            <div style={{ alignSelf: 'center', padding: '10px 14px', fontFamily: T.serif, fontSize: 12.5, color: T.muted, fontStyle: 'italic', textAlign: 'center', maxWidth: 280, lineHeight: 1.5 }}>
              We'll pick this up another day. Longer conversations are part of Luna Pro — coming soon.
            </div>
          )}
        </div>

        {/* Composer */}
        <div style={{ padding: '12px 16px 18px', borderTop: `1px solid ${T.hair}`, background: T.bg }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={sending || reachedCap}
              placeholder={reachedCap ? 'Come back tomorrow…' : 'Write a sentence — or just a word.'}
              rows={1}
              maxLength={500}
              style={{
                flex: 1,
                background: T.card,
                border: `1px solid ${T.hair}`,
                borderRadius: 14,
                padding: '11px 14px',
                fontFamily: T.serif,
                fontStyle: 'italic',
                fontSize: 14.5,
                color: T.text,
                resize: 'none',
                lineHeight: 1.5,
                opacity: reachedCap ? 0.5 : 1,
              }}
            />
            <button
              onClick={send}
              disabled={!draft.trim() || sending || reachedCap}
              style={{
                background: T.accent,
                color: '#fff',
                border: 'none',
                padding: '11px 16px',
                borderRadius: 14,
                cursor: (!draft.trim() || sending || reachedCap) ? 'default' : 'pointer',
                fontFamily: T.sans,
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: 0.3,
                opacity: (!draft.trim() || sending || reachedCap) ? 0.4 : 1,
              }}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
