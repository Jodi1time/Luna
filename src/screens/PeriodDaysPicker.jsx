import { useState, useMemo } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, CTAButton, Icons, Screen } from '../components/shared'
import useLuna from '../store/useLuna'
import { useCycle } from '../hooks/useCycle'

// Streamlined period-day picker — replaces the single-day EditPeriodStart
// flow for the catch-up nudge on Home. Sometimes a user just wants to
// mark "I bled on these days" without filling out the full Log form;
// this is that surface.
//
// Tap any past day to toggle it as a period day. Save writes Medium-flow
// logs for newly-selected days (preserves Heavy / Light / Spotting if
// already set so we don't downgrade richer entries), clears flow on
// de-selected days that were previously a period day, and anchors
// lastPeriodStart to the first day of the latest contiguous block.

const MS_PER_DAY = 86400000
const LOOKBACK_DAYS = 60

function isoFromYMD(year, month, day) {
  const d = new Date(year, month, day, 12, 0, 0)
  return d.toISOString().slice(0, 10)
}

function CalendarBlock({ year, month, selected, onToggle }) {
  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const days = ['M','T','W','T','F','S','S']
  const first = new Date(year, month, 1).getDay()
  const adj = first === 0 ? 6 : first - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayISO = new Date().toISOString().slice(0, 10)
  return (
    <div className="frost-card" style={{ background: 'rgba(253,250,245,0.55)', padding: 18, border: '1px solid rgba(26,19,16,0.06)', borderRadius: 24, marginBottom: 14, boxShadow: '0 14px 30px -22px rgba(26,19,16,0.20)' }}>
      <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 16, marginBottom: 14, color: T.text, letterSpacing: -0.2 }}>{monthLabel.toLowerCase()}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
        {days.map((d, i) => <div key={i} style={{ textAlign: 'center', fontSize: 9, color: T.muted, fontFamily: T.mono, fontWeight: 600, letterSpacing: 1 }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {Array.from({ length: adj }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
          const iso = isoFromYMD(year, month, d)
          const isFuture = iso > todayISO
          const isSelected = selected.has(iso)
          return (
            <button key={d} onClick={() => !isFuture && onToggle(iso)} disabled={isFuture}
              style={{
                aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontFamily: T.serif, fontWeight: isSelected ? 600 : 400,
                cursor: isFuture ? 'default' : 'pointer', border: 'none',
                background: isSelected ? T.accent : 'transparent',
                color: isSelected ? '#fff' : (isFuture ? 'rgba(26,19,16,0.18)' : T.text),
                borderRadius: 999,
                boxShadow: isSelected ? `0 8px 18px -8px ${T.accent}90` : 'none',
                opacity: isFuture ? 0.4 : 1,
                transition: 'all 0.2s var(--ease-out)',
              }}>
              {d}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function PeriodDaysPicker() {
  const store = useLuna()
  const { back, logs, saveLog, setLastPeriodStart } = store
  const cycle = useCycle(store)

  // Pre-populate from existing flow logs in the lookback window. Spotting
  // is excluded — it isn't a period day in the cycle engine's sense.
  const initial = useMemo(() => {
    const cutoff = new Date(Date.now() - LOOKBACK_DAYS * MS_PER_DAY).toISOString().slice(0, 10)
    const set = new Set()
    for (const [date, log] of Object.entries(logs || {})) {
      if (date < cutoff) continue
      if (log.flow && log.flow !== 'Spotting') set.add(date)
    }
    return set
  }, [logs])
  const [selected, setSelected] = useState(initial)

  const toggle = (iso) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(iso)) next.delete(iso)
      else next.add(iso)
      return next
    })
  }

  // Preview math: count, span, latest contiguous block start. The block
  // start is what becomes lastPeriodStart (Luna's anchor for predictions).
  const preview = useMemo(() => {
    const sortedAsc = [...selected].sort()
    if (sortedAsc.length === 0) return null
    const first = sortedAsc[0]
    const last = sortedAsc[sortedAsc.length - 1]
    // Latest contiguous block: walk backwards from last, accept while
    // the gap to the prior selected day is exactly 1.
    let blockStart = last
    for (let i = sortedAsc.length - 1; i > 0; i--) {
      const cur = sortedAsc[i]
      const prev = sortedAsc[i - 1]
      const gap = (new Date(cur + 'T00:00:00') - new Date(prev + 'T00:00:00')) / MS_PER_DAY
      if (gap === 1) blockStart = prev
      else break
    }
    return { count: sortedAsc.length, first, last, blockStart }
  }, [selected])

  const fmtShort = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const fmtLong = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const handleSave = () => {
    // For each newly-selected day: write Medium flow IF not already a
    // flow day. Preserve richer entries (Heavy / Light / Spotting upgrade
    // to Medium only when going Spotting → Medium; otherwise leave alone).
    for (const iso of selected) {
      const existing = logs?.[iso] || {}
      const isRealFlow = existing.flow && existing.flow !== 'Spotting'
      if (isRealFlow) continue
      saveLog(new Date(iso + 'T12:00:00'), { ...existing, flow: 'Medium' })
    }
    // For each previously-selected (real-flow) day NOT in current
    // selection: clear flow. We only touch days that were in our
    // `initial` set — never clear flow on days outside the lookback
    // window or untouched.
    for (const iso of initial) {
      if (selected.has(iso)) continue
      const existing = logs?.[iso] || {}
      saveLog(new Date(iso + 'T12:00:00'), { ...existing, flow: null })
    }
    if (preview?.blockStart) setLastPeriodStart(preview.blockStart)
    back()
  }

  const now = new Date()
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  return (
    <Screen padBottom={40}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="Select your period days" onBack={back} />
        <Eyebrow>Mark the days you bled</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 500, letterSpacing: -0.6, lineHeight: 1.1, marginBottom: 10 }}>
          When was your <em>last period?</em>
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 14, color: T.muted, lineHeight: 1.55, marginBottom: 22 }}>
          Tap each day you had your period — past or today. Luna will use the first and last day to update predictions. You can come back later to add the full log if you want.
        </div>

        <CalendarBlock year={prevMonth.getFullYear()} month={prevMonth.getMonth()} selected={selected} onToggle={toggle} />
        <CalendarBlock year={now.getFullYear()} month={now.getMonth()} selected={selected} onToggle={toggle} />

        {preview && (
          <div className="glass-card alive-card frost-card" style={{ padding: 18, borderRadius: 22, boxShadow: `0 14px 30px -22px ${T.accent}50`, marginBottom: 14 }}>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, fontWeight: 500, color: T.muted, letterSpacing: -0.1, marginBottom: 8 }}>
              what you've marked
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 14.5, lineHeight: 1.55, color: T.text }}>
              {preview.count === 1
                ? <><strong style={{ fontWeight: 600 }}>One day</strong>: {fmtLong(preview.first).toLowerCase()}.</>
                : <><strong style={{ fontWeight: 600 }}>{preview.count} days</strong>, from <em style={{ color: T.accent }}>{fmtShort(preview.first).toLowerCase()}</em> to <em style={{ color: T.accent }}>{fmtShort(preview.last).toLowerCase()}</em>.</>}
              {preview.blockStart !== cycle?.lastPeriodStart && (
                <> Luna will anchor day one to <em style={{ fontStyle: 'italic', color: T.accent }}>{fmtShort(preview.blockStart).toLowerCase()}</em>.</>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <button onClick={back} className="alive-card frost-card"
            style={{ border: '1px solid rgba(26,19,16,0.08)', background: 'rgba(253,250,245,0.55)', color: T.text, padding: '15px 22px', borderRadius: 999, cursor: 'pointer', fontFamily: T.sans, fontSize: 12, letterSpacing: 0.3, fontWeight: 600 }}>
            Cancel
          </button>
          <CTAButton full onClick={handleSave} style={{ opacity: selected.size > 0 ? 1 : 0.5, textTransform: 'none', letterSpacing: 0.3, fontSize: 13 }}>
            Save {Icons.arrow}
          </CTAButton>
        </div>
      </div>
    </Screen>
  )
}
