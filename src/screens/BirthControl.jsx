import { useState } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, Screen, Icons } from '../components/shared'
import useLuna from '../store/useLuna'
import { BC_METHODS, BC_LABELS } from '../data/birthControl'
import { getBcCycleModel } from '../lib/bcCycle'

// Re-export so existing call sites that import from this screen keep working
// while we migrate. New code should import from `data/birthControl` instead.
export { BC_METHODS, BC_LABELS }

// Methods where the start date materially changes what Luna shows on
// the cover: pill-pack day, weeks-since-shot countdown, months-since
// insertion. For 'none', 'copper-iud', and 'mini-pill' the date isn't
// needed (or isn't useful enough to ask).
const METHODS_NEED_DATE = new Set([
  'combined-pill', 'patch', 'ring',
  'shot',
  'hormonal-iud',
  'implant',
])

function StartDateField({ method, value, onChange }) {
  if (!METHODS_NEED_DATE.has(method)) return null
  const model = getBcCycleModel({ method, startDate: value })
  const label = model?.startDateLabel || 'When did you start this method?'
  const todayISO = new Date().toISOString().slice(0, 10)
  return (
    <div className="frost-card" style={{
      margin: '12px 16px 0',
      padding: '14px 16px',
      background: 'rgba(253,250,245,0.55)',
      border: `1px solid ${T.accent}28`,
      borderRadius: 16,
    }}>
      <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: T.muted, marginBottom: 8, letterSpacing: -0.1 }}>
        {label.toLowerCase()}
      </div>
      <input
        type="date"
        value={value || ''}
        max={todayISO}
        onChange={(e) => onChange(e.target.value || null)}
        style={{
          width: '100%',
          background: 'rgba(253,250,245,0.6)',
          border: '1px solid rgba(26,19,16,0.08)',
          borderRadius: 14,
          padding: '12px 14px',
          fontSize: 16,
          fontFamily: T.sans,
          color: T.text,
          outline: 'none',
        }}
        onFocus={(e) => { e.target.style.borderColor = T.accent; e.target.style.boxShadow = `0 0 0 3px ${T.accent}18` }}
        onBlur={(e)  => { e.target.style.borderColor = 'rgba(26,19,16,0.08)'; e.target.style.boxShadow = 'none' }}
      />
      <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12, color: T.muted, marginTop: 8, lineHeight: 1.5 }}>
        {method === 'shot'
          ? 'Luna counts down to your next 12-week shot from this date.'
          : method === 'hormonal-iud' || method === 'implant'
            ? 'Lets Luna track how long you\'ve been on it and when replacement is due.'
            : 'Lets Luna track your pack-week and your next withdrawal bleed.'}
      </div>
    </div>
  )
}

export default function BirthControl() {
  const { back, birthControl, setBirthControl } = useLuna()
  const selectedId = birthControl?.method || 'none'
  // Local working copy of the start date so the date field updates
  // smoothly as the user picks one; we write through to the store on
  // every change (existing setBirthControl handles persistence).
  const [pendingDate, setPendingDate] = useState(birthControl?.startDate || '')

  const updateMethod = (id) => {
    // Switching method clears any prior start date that's no longer
    // meaningful, except when the new method also needs one (we keep
    // it so re-tapping the same kind of method doesn't blow away the
    // user's date). For methods that don't want a date, write null.
    const keepDate = METHODS_NEED_DATE.has(id) ? pendingDate : null
    setBirthControl({ method: id, startDate: keepDate || null })
    if (!METHODS_NEED_DATE.has(id)) setPendingDate('')
  }
  const updateDate = (newDate) => {
    setPendingDate(newDate || '')
    setBirthControl({ method: selectedId, startDate: newDate || null })
  }

  return (
    <Screen padBottom={30}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="birth control" onBack={back} />
        <div style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 8 }}>
          What are you<br /><em>on?</em>
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 15, color: T.muted, lineHeight: 1.6, marginBottom: 24 }}>
          Your method shapes what Luna shows. We won't predict periods that aren't coming, or run cycle math on a body whose hormones are doing something else.
        </div>
      </div>

      <div style={{ margin: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {BC_METHODS.map((m) => {
          const selected = m.id === selectedId
          return (
            <button
              key={m.id}
              onClick={() => updateMethod(m.id)}
              style={{
                width: '100%',
                padding: '14px 16px',
                textAlign: 'left',
                background: selected ? T.accent + '0A' : T.card,
                border: `1px solid ${selected ? T.accent : T.hair}`,
                borderRadius: T.r,
                cursor: 'pointer',
                fontFamily: 'inherit',
                color: T.text,
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                transition: 'background .2s, border-color .2s',
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                border: `1.5px solid ${selected ? T.accent : T.muted}`,
                background: selected ? T.accent : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                transition: 'background .25s, border-color .25s',
              }}>
                {selected && <span style={{ display: 'flex', animation: 'checkPop 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}>{Icons.check}</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: T.serif, fontSize: 16, fontWeight: 500, marginBottom: 4, color: selected ? T.accent : T.text }}>
                  {m.name}
                </div>
                <div style={{ fontFamily: T.sans, fontSize: 12, color: T.muted, lineHeight: 1.45 }}>
                  {m.blurb}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Start date — only mounts for methods where it actually changes
          what Luna does. Asks once, persists, drives the cover + the
          next-thing surface (shot countdown, pack-week, since insertion). */}
      <StartDateField method={selectedId} value={pendingDate} onChange={updateDate} />

      {/* Method-detail link — opens the deep reference page so she
          can read sourced info on the method she's on. Hidden for
          'none' (nothing to read). */}
      {selectedId !== 'none' && (
        <div style={{ margin: '14px 16px 0' }}>
          <button onClick={() => useLuna.getState().go('bcMethod')}
            className="alive-card frost-card"
            style={{
              width: '100%',
              padding: '14px 16px',
              background: 'rgba(253,250,245,0.55)',
              border: `1px solid ${T.accent}28`,
              borderRadius: 16,
              textAlign: 'left',
              cursor: 'pointer',
              color: T.text,
              fontFamily: 'inherit',
            }}>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12, color: T.muted, marginBottom: 4 }}>
              the deeper read
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 15, fontWeight: 500, letterSpacing: -0.2 }}>
              How {BC_LABELS[selectedId]?.toLowerCase() || 'your method'} works, what to expect, when to call your doctor →
            </div>
          </button>
        </div>
      )}

      <div style={{ padding: '20px 22px 8px', fontSize: 11, color: T.muted, fontFamily: T.sans, lineHeight: 1.5 }}>
        Change this any time. Logged cycle data isn't affected.
      </div>
    </Screen>
  )
}
