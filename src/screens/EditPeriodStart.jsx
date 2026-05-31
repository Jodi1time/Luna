import { useState, useMemo } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, CTAButton, Icons, Screen } from '../components/shared'
import useLuna from '../store/useLuna'
import { useCycle } from '../hooks/useCycle'

// Compact date editor for the "Update last period start" Settings row.
// Shows the previous + current month; tap any past day to set it as the
// new lastPeriodStart. NEVER runs the full onboarding flow (which would
// re-create the vault and lose data).
//
// IMPORTANT: just setting the onboarding lastPeriodStart isn't enough
// — the cycle engine uses period starts DETECTED from flow logs as the
// anchor, with the onboarding date only filling in when there are no
// detected starts nearby. So saving here ALSO writes a Medium flow log
// for the selected day, which makes the cycle engine treat it as a
// real period start.

const MS_PER_DAY = 86400000

function CalendarBlock({ year, month, selectedISO, onPick }) {
  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const days = ['M','T','W','T','F','S','S']
  const first = new Date(year, month, 1).getDay()
  const adj = first === 0 ? 6 : first - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayISO = new Date().toISOString().slice(0, 10)

  return (
    <div style={{ background: T.card, padding: 16, border: `1px solid ${T.hair}`, borderRadius: T.r, marginBottom: 14 }}>
      <div style={{ fontWeight: 600, fontSize: 13, fontFamily: T.sans, marginBottom: 12, color: T.text }}>{monthLabel}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
        {days.map((d, i) => <div key={i} style={{ textAlign: 'center', fontSize: 9, color: T.muted, fontFamily: T.mono, fontWeight: 600, letterSpacing: 1 }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {Array.from({ length: adj }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
          const iso = new Date(year, month, d).toISOString().slice(0, 10)
          const isFuture = iso > todayISO
          const isSelected = iso === selectedISO
          return (
            <button key={d} onClick={() => !isFuture && onPick(iso)} disabled={isFuture}
              style={{
                aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontFamily: T.sans, fontWeight: isSelected ? 600 : 400,
                cursor: isFuture ? 'default' : 'pointer', border: 'none',
                background: isSelected ? T.accent : 'transparent',
                color: isSelected ? '#fff' : (isFuture ? T.hair : T.text),
                borderRadius: T.r,
                opacity: isFuture ? 0.4 : 1,
              }}>
              {d}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function EditPeriodStart() {
  const store = useLuna()
  const { back, lastPeriodStart, setLastPeriodStart, saveLog, logs, cycleLength } = store
  const cycle = useCycle(store)
  const [selected, setSelected] = useState(lastPeriodStart)

  const now = new Date()
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  // Live preview: what will Luna think your cycle day is if you pick
  // this date? Keeps the math visible so the user knows what they're
  // about to commit to, rather than tapping "save" into a void.
  const preview = useMemo(() => {
    if (!selected) return null
    const today = new Date(); today.setHours(0,0,0,0)
    const sel = new Date(selected + 'T00:00:00')
    const dayOfCycle = Math.floor((today - sel) / MS_PER_DAY) + 1
    const friendlyDay = ((dayOfCycle - 1) % (cycleLength || 28)) + 1
    const cyclesAgo = Math.floor((dayOfCycle - 1) / (cycleLength || 28))
    // Anything within the last ~3 cycles is "yes Luna will reanchor".
    const tooFarBack = cyclesAgo > 3
    return { friendlyDay, cyclesAgo, tooFarBack, dayOfCycle }
  }, [selected, cycleLength])

  const handleSave = () => {
    if (!selected) return
    // Write a flow log for the chosen date so the cycle engine actually
    // treats it as a period start (not just an onboarding hint that
    // gets ignored when other flow logs exist).
    const existing = logs?.[selected] || {}
    const hadFlow = existing.flow && existing.flow !== 'Spotting'
    if (!hadFlow) {
      saveLog(new Date(selected + 'T12:00:00'), { ...existing, flow: 'Medium' })
    }
    setLastPeriodStart(selected)
    back()
  }

  return (
    <Screen padBottom={40}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="Update period start" onBack={back} />
        <Eyebrow>Tell Luna where you actually are</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 500, letterSpacing: -0.6, lineHeight: 1.1, marginBottom: 10 }}>
          When did your <em>last period</em> start?
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 14, color: T.muted, lineHeight: 1.55, marginBottom: 22 }}>
          Tap a day to update. Luna will treat that morning as day one and reanchor everything — your phase, your predictions, the next-period nudge.
        </div>

        <CalendarBlock year={prevMonth.getFullYear()} month={prevMonth.getMonth()} selectedISO={selected} onPick={setSelected} />
        <CalendarBlock year={now.getFullYear()} month={now.getMonth()} selectedISO={selected} onPick={setSelected} />

        {selected && preview && (
          <div className="glass-card" style={{ padding: '12px 14px', borderLeft: `3px solid ${T.accent}`, borderRadius: T.r, marginBottom: 14 }}>
            <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.2, fontWeight: 600, color: T.muted, marginBottom: 6 }}>
              {preview.tooFarBack ? 'Heads up' : 'What this will do'}
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 14.5, lineHeight: 1.5, color: T.text }}>
              {preview.tooFarBack
                ? `That's more than three cycles back. If your most recent period actually started after this date, choose that one instead — Luna anchors to your latest, not your earliest.`
                : (
                  <>
                    From <em style={{ fontStyle: 'italic', color: T.accent }}>
                      {new Date(selected + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </em>, today becomes <strong style={{ fontWeight: 600 }}>day {preview.friendlyDay}</strong>{preview.cyclesAgo > 0 ? ` (one cycle later)` : ''}. {cycle?.lastPeriodStart && cycle.lastPeriodStart !== selected
                      ? `Right now Luna has your last start on ${new Date(cycle.lastPeriodStart + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — saving will move that anchor here.`
                      : null}
                  </>
                )}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <button onClick={back}
            style={{ border: `1px solid ${T.hair}`, background: 'transparent', color: T.text, padding: '15px 18px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans, fontSize: 12, letterSpacing: 0.4, fontWeight: 700 }}>
            CANCEL
          </button>
          <CTAButton full onClick={handleSave} style={{ opacity: selected ? 1 : 0.5 }}>
            SAVE {Icons.arrow}
          </CTAButton>
        </div>
      </div>
    </Screen>
  )
}
