import { useMemo, useState, useRef, useEffect } from 'react'
import { T } from '../data/theme'
import { Screen, Icons } from '../components/shared'
import { PhaseFlourish } from '../components/phaseFlourishes'
import { useCycle } from '../hooks/useCycle'
import { resolveTheme, DEFAULT_JOURNAL_THEME } from '../data/journalThemes'
import JournalDecorations from '../components/JournalDecorations'
import JournalCustomizer from '../components/JournalCustomizer'
import Polaroid, { makePhotoMeta } from '../components/Polaroid'
import PhotoPermissionSheet from '../components/PhotoPermissionSheet'
import { compressImage } from '../lib/imageCompress'
import { createRecognizer, isVoiceSupported } from '../lib/voiceRecognition'
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
    theme.paperBg || theme.paper,
  ].join(', ')
}

// New-entry composer — a notebook page that's empty until the user
// writes. Save commits it as its own entry (with timestamp), clears
// the input so they can start the next page.
function EntryComposer({ theme, decorations, onSave, onPickPhoto, phaseId }) {
  const [text, setText] = useState('')
  const [photos, setPhotos] = useState([])
  const [recording, setRecording] = useState(false)
  const [interim, setInterim] = useState('')
  const [voiceError, setVoiceError] = useState('')
  const [elapsedSec, setElapsedSec] = useState(0)
  const taRef = useRef(null)
  const recRef = useRef(null)
  const timerRef = useRef(null)
  const voiceSupported = useMemo(() => isVoiceSupported(), [])

  // Resize the textarea to fit content as the user writes — or as
  // dictated transcript flows in.
  useEffect(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    const min = LINE_H * 5
    el.style.height = `${Math.max(min, el.scrollHeight)}px`
  }, [text, interim])

  // Tick the recording timer so the UI shows "0:23" while the mic is
  // open. Stops the moment recording flips off.
  useEffect(() => {
    if (!recording) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    setElapsedSec(0)
    const start = Date.now()
    timerRef.current = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - start) / 1000))
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [recording])

  // A page is savable when it has text OR at least one photo —
  // sometimes a picture is the whole entry.
  const canSave = text.trim().length > 0 || photos.length > 0
  const handleSave = () => {
    if (!canSave) return
    onSave(text, photos)
    setText('')
    setPhotos([])
    if (taRef.current) taRef.current.style.height = `${LINE_H * 5}px`
  }
  const handleAddPhoto = () => {
    onPickPhoto((photo) => { setPhotos((cur) => [...cur, photo]) })
  }
  const removePhoto = (id) => {
    setPhotos((cur) => cur.filter((p) => p.id !== id))
  }

  // Voice → text. Web Speech API runs continuously until stopped;
  // each final chunk lands in `text` (with a leading space if needed
  // so the dictation doesn't fuse with the prior word). Interim
  // chunks live in their own state and render as ghost text below
  // the textarea so the user sees Luna catching what they're saying.
  const startVoice = () => {
    if (recording) return
    setVoiceError('')
    setInterim('')
    const rec = createRecognizer({
      onResult: ({ transcript, isFinal }) => {
        if (isFinal) {
          setText((prev) => {
            const sep = prev && !/\s$/.test(prev) ? ' ' : ''
            return (prev + sep + transcript.trim()).trim() + ' '
          })
          setInterim('')
        } else {
          setInterim(transcript)
        }
      },
      onError: (msg) => {
        setVoiceError(msg)
        setRecording(false)
      },
      onEnd: () => {
        setRecording(false)
        setInterim('')
      },
    })
    recRef.current = rec
    rec.start()
    setRecording(true)
  }
  const stopVoice = () => {
    recRef.current?.stop()
    setRecording(false)
  }
  // Always stop the mic when the composer unmounts so the browser
  // tab doesn't keep the indicator on.
  useEffect(() => () => { recRef.current?.stop() }, [])
  const mmss = `${Math.floor(elapsedSec / 60)}:${String(elapsedSec % 60).padStart(2, '0')}`
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
      <JournalDecorations decorations={decorations} accent={theme.accent} opacity={0.18} />
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
          placeholder={recording ? 'Listening — speak whenever.' : "Whatever's on your mind — start writing."}
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
        {/* Live interim transcript — what Luna is hearing right now,
            before the final chunk lands in the textarea. Rendered as
            ghost-italic so the user sees a draft without the cursor
            jumping. Disappears between final chunks. */}
        {recording && interim && (
          <div style={{
            fontFamily: T.serif, fontStyle: 'italic', fontSize: 15.5,
            lineHeight: `${LINE_H}px`, color: theme.text, opacity: 0.45,
            marginTop: 2,
          }}>
            {interim}
          </div>
        )}
        {/* Voice error — surfaces permission denial / no-speech /
            unsupported messages above the actions row. */}
        {voiceError && (
          <div style={{
            marginTop: 12, padding: '8px 12px',
            background: T.accent + '12',
            border: `1px solid ${T.accent}40`,
            borderRadius: T.r,
            fontFamily: T.sans, fontSize: 11.5, color: T.accent,
            lineHeight: 1.5,
          }}>
            {voiceError}
          </div>
        )}
        {/* Polaroid attachments — rendered between the text and the
            actions row. Each gets a remove button while in compose. */}
        {photos.length > 0 && (
          <div style={{ marginTop: 8, paddingBottom: 4 }}>
            {photos.map((p, idx) => (
              <Polaroid key={p.id} photo={p} index={idx} editable onRemove={() => removePhoto(p.id)} />
            ))}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={handleAddPhoto}
              disabled={recording}
              style={{
                background: 'transparent',
                color: theme.accent,
                border: `1px solid ${theme.accent}55`,
                padding: '8px 12px',
                borderRadius: 999,
                cursor: recording ? 'default' : 'pointer',
                opacity: recording ? 0.4 : 1,
                fontFamily: T.sans, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.8,
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
              <span style={{ fontSize: 13, lineHeight: 0 }}>＋</span>
              PHOTO
            </button>
            {voiceSupported && (
              recording ? (
                <button onClick={stopVoice}
                  className="voice-recording"
                  style={{
                    background: T.accent, color: '#fff',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: 999,
                    cursor: 'pointer',
                    fontFamily: T.sans, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.8,
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    boxShadow: `0 0 0 0 ${T.accent}66`,
                  }}>
                  <span aria-hidden="true" style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#fff',
                    animation: 'voicePulse 1.2s ease-in-out infinite',
                  }} />
                  STOP · {mmss}
                </button>
              ) : (
                <button onClick={startVoice}
                  style={{
                    background: 'transparent',
                    color: theme.accent,
                    border: `1px solid ${theme.accent}55`,
                    padding: '8px 12px',
                    borderRadius: 999,
                    cursor: 'pointer',
                    fontFamily: T.sans, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.8,
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                  }}>
                  <span style={{ fontSize: 12, lineHeight: 0 }}>🎤</span>
                  VOICE
                </button>
              )
            )}
          </div>
          <button onClick={handleSave} disabled={!canSave || recording}
            style={{
              background: canSave && !recording ? theme.accent : 'rgba(26,19,16,0.08)',
              color: canSave && !recording ? '#fff' : T.muted,
              border: 'none',
              padding: '9px 16px',
              borderRadius: T.r,
              cursor: canSave && !recording ? 'pointer' : 'default',
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
// icon in the corner deletes after a single confirm. In edit mode,
// text becomes a textarea AND photos become removable + addable.
function EntryPage({ entry, theme, decorations, todayISO, onUpdate, onDelete, onPickPhoto }) {
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
  const photos = entry.photos || []
  const save = () => {
    if (text !== entry.body) onUpdate({ body: text.trim() })
    setEditing(false)
  }
  const handleDelete = (e) => {
    e.stopPropagation()
    if (!window.confirm('Tear this page out? This cannot be undone.')) return
    onDelete()
  }
  const removePhoto = (id) => {
    onUpdate({ photos: photos.filter((p) => p.id !== id) })
  }
  const addPhoto = () => {
    onPickPhoto((photo) => { onUpdate({ photos: [...photos, photo] }) })
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
      <JournalDecorations decorations={decorations} accent={theme.accent} opacity={0.15} />
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
          entry.body && (
            <div style={{
              fontFamily: T.serif, fontStyle: 'italic', fontSize: 15.5,
              lineHeight: `${LINE_H}px`, color: theme.text,
              whiteSpace: 'pre-wrap',
            }}>
              {entry.body}
            </div>
          )
        )}
        {/* Polaroids — always rendered (read or edit). Editable mode
            shows a remove button on each + an "+ photo" affordance
            at the bottom. */}
        {photos.length > 0 && (
          <div style={{ marginTop: editing || entry.body ? 8 : 0, paddingBottom: 4 }}
            onClick={(e) => editing && e.stopPropagation()}>
            {photos.map((p, idx) => (
              <Polaroid key={p.id} photo={p} index={idx} editable={editing} onRemove={() => removePhoto(p.id)} />
            ))}
          </div>
        )}
        {editing && (
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-start' }}
            onClick={(e) => e.stopPropagation()}>
            <button onClick={addPhoto}
              style={{
                background: 'transparent',
                color: theme.accent,
                border: `1px solid ${theme.accent}55`,
                padding: '7px 12px',
                borderRadius: 999,
                cursor: 'pointer',
                fontFamily: T.sans, fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
              <span style={{ fontSize: 13, lineHeight: 0 }}>＋</span>
              ADD A PHOTO
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Journal() {
  const store = useLuna()
  const { back, saveJournalEntry, updateJournalEntry, deleteJournalEntry, updateJournalTheme, updateSetting } = store
  const settings = useLuna((s) => s.settings)
  const cycle = useCycle(store)
  const phase = cycle?.phase
  const entries = settings?.journalEntries || []
  const journalTheme = settings?.journalTheme || DEFAULT_JOURNAL_THEME
  const theme = useMemo(
    () => resolveTheme(journalTheme.themeId, phase?.color, journalTheme.custom),
    [journalTheme.themeId, phase?.color, journalTheme.custom]
  )
  const todayISO = new Date().toISOString().slice(0, 10)
  const [customizing, setCustomizing] = useState(false)

  // Photo picker — shared between the new-page composer and any
  // editing past page. We keep one hidden <input type="file"> for
  // the whole screen and stash the requesting callback so the
  // post-pick handler knows where to deliver the photo. The OS
  // picker itself handles the permission grant; we show a one-time
  // explainer the first time so the user understands what tapping
  // means + that photos stay inside Luna.
  const fileInputRef = useRef(null)
  const pendingCallback = useRef(null)
  const [permissionPrompt, setPermissionPrompt] = useState(false)
  const [picking, setPicking] = useState(false)
  const [pickError, setPickError] = useState('')
  const askedPhotoAccess = settings?.askedPhotoAccess === true

  const openSystemPicker = () => {
    const el = fileInputRef.current
    if (!el) return
    el.value = '' // ensure 'change' fires even on same-file re-pick
    el.click()
  }
  const requestPickPhoto = (cb) => {
    pendingCallback.current = cb
    setPickError('')
    if (!askedPhotoAccess) {
      setPermissionPrompt(true)
    } else {
      openSystemPicker()
    }
  }
  const handlePermissionContinue = () => {
    updateSetting('askedPhotoAccess', true)
    setPermissionPrompt(false)
    // Defer to the next tick so the modal can unmount before the
    // system picker steals focus.
    setTimeout(openSystemPicker, 60)
  }
  const handlePermissionCancel = () => {
    pendingCallback.current = null
    setPermissionPrompt(false)
  }
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPicking(true)
    setPickError('')
    try {
      const { dataUrl, width, height } = await compressImage(file, { maxDim: 900, quality: 0.78 })
      const meta = makePhotoMeta()
      const photo = {
        id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        dataUrl,
        w: width,
        h: height,
        rot: meta.rot,
        offset: meta.offset,
      }
      const cb = pendingCallback.current
      pendingCallback.current = null
      cb?.(photo)
    } catch (err) {
      setPickError(err?.message || "Couldn't read that photo. Try another.")
    } finally {
      setPicking(false)
    }
  }

  const handleSaveEntry = (body, photos = []) => { saveJournalEntry(body, photos) }
  const handleChangeTheme = (themeId) => { updateJournalTheme({ themeId }) }
  const handleToggleDecoration = (id) => {
    const cur = journalTheme.decorations || []
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    updateJournalTheme({ decorations: next })
  }
  const handleToggleApplyToApp = () => {
    updateJournalTheme({ applyToApp: !journalTheme.applyToApp })
  }
  const handleChangeBackdrop = (id) => { updateJournalTheme({ backdropKind: id }) }
  const handleChangeBackdropAccent = (color) => {
    const cur = journalTheme.backdrop || { accent: null }
    updateJournalTheme({ backdrop: { ...cur, accent: color } })
  }
  const handleChangeCustom = (partial) => {
    const cur = journalTheme.custom || { color: '#F5E6D3', color2: '#E8C8B5', angle: 150, gradient: false }
    updateJournalTheme({ custom: { ...cur, ...partial } })
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: theme.paperBg || theme.paper, color: theme.text, overflow: 'hidden', transition: 'background 0.4s var(--ease-out)' }}>
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
              onPickPhoto={requestPickPhoto}
              phaseId={phase?.id}
            />
          </div>

          {/* Picker status — quietly surfaced if compression fails or
              while a large photo is being processed. */}
          {(picking || pickError) && (
            <div style={{
              marginBottom: 14,
              padding: '8px 12px',
              background: pickError ? T.accent + '12' : theme.accent + '10',
              border: `1px solid ${pickError ? T.accent + '40' : theme.accent + '40'}`,
              borderRadius: T.r,
              fontFamily: T.sans, fontSize: 11.5,
              color: pickError ? T.accent : theme.text,
              lineHeight: 1.5,
            }}>
              {pickError ? pickError : 'Tucking the photo onto the page…'}
            </div>
          )}

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
                    onPickPhoto={requestPickPhoto}
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
        backdropKind={journalTheme.backdropKind || 'blob'}
        backdropAccent={journalTheme.backdrop?.accent || null}
        custom={journalTheme.custom}
        resolvedAccent={theme.accent}
        onChangeTheme={handleChangeTheme}
        onToggleDecoration={handleToggleDecoration}
        onToggleApplyToApp={handleToggleApplyToApp}
        onChangeBackdrop={handleChangeBackdrop}
        onChangeBackdropAccent={handleChangeBackdropAccent}
        onChangeCustom={handleChangeCustom}
      />

      {/* First-time camera-roll explainer. The OS picker handles the
          actual permission grant; this sheet sets expectations before
          the system dialog appears. */}
      <PhotoPermissionSheet
        open={permissionPrompt}
        accent={theme.accent}
        onContinue={handlePermissionContinue}
        onCancel={handlePermissionCancel}
      />

      {/* Hidden file input — one for the whole screen. Programmatically
          clicked by openSystemPicker(); the change handler compresses
          the chosen file and routes it to whichever component asked
          via pendingCallback. */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none', overflow: 'hidden' }}
        aria-hidden="true"
      />
    </div>
  )
}
