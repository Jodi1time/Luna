import { useState, useMemo } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, CTAButton, Icons, Screen } from '../components/shared'
import useLuna from '../store/useLuna'
import { useCycle } from '../hooks/useCycle'
import { todayKey, toDateKey } from '../lib/dateOnly'

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
  const todayISO = todayKey()

  return (
    <div className="frost-card" style={{ background: 'rgba(253,250,245,0.55)', padding: 18, border: '1px solid rgba(26,19,16,0.06)', borderRadius: 24, marginBottom: 14, boxShadow: '0 14px 30px -22px rgba(26,19,16,0.20)' }}>
      <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 16, marginBottom: 14, color: T.text, letterSpacing: -0.2 }}>{monthLabel.toLowerCase()}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
        {days.map((d, i) => <div key={i} style={{ textAlign: 'center', fontSize: 11, color: T.muted, fontFamily: T.mono, fontWeight: 600, letterSpacing: 1 }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {Array.from({ length: adj }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
          const iso = toDateKey(new Date(year, month, d))
          const isFuture = iso > todayISO
          const isSelected = iso === selectedISO
          return (
            <button key={d} onClick={() => !isFuture && onPick(iso)} disabled={isFuture}
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
          <div className="glass-card alive-card frost-card" style={{ padding: 18, borderRadius: 22, boxShadow: `0 14px 30px -22px ${T.accent}50`, marginBottom: 14 }}>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, fontWeight: 500, color: T.muted, letterSpacing: -0.1, marginBottom: 8 }}>
              {preview.tooFarBack ? 'heads up' : 'what this will do'}
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 14.5, lineHeight: 1.55, color: T.text }}>
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
          <button onClick={back} className="alive-card frost-card"
            style={{ border: '1px solid rgba(26,19,16,0.08)', background: 'rgba(253,250,245,0.55)', color: T.text, padding: '15px 22px', borderRadius: 999, cursor: 'pointer', fontFamily: T.sans, fontSize: 12, letterSpacing: 0.3, fontWeight: 600 }}>
            Cancel
          </button>
          <CTAButton full onClick={handleSave} style={{ opacity: selected ? 1 : 0.5, textTransform: 'none', letterSpacing: 0.3, fontSize: 13 }}>
            Save {Icons.arrow}
          </CTAButton>
        </div>
      </div>
    </Screen>
  )
}
