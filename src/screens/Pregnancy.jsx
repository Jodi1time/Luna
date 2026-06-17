import { useState, useMemo } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, CTAButton, Icons, Screen, SourceLine } from '../components/shared'
import { PHASES } from '../data/lunaData'
import useLuna from '../store/useLuna'
import { usePregnancy } from '../hooks/usePregnancy'

const MS_PER_DAY = 86400000

// Trimester accent colours reuse the phase palette so the editorial palette
// stays coherent across the app. First trimester = ovulation, second =
// follicular, third = luteal.
function trimesterColor(num) {
  if (num === 1) return PHASES.ovulation.color
  if (num === 2) return PHASES.follicular.color
  if (num === 3) return PHASES.luteal.color
  return T.accent
}

function formatLongDate(iso) {
  if (!iso) return ''
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function lmpToDue(iso) {
  if (!iso) return null
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + 280)
  return d.toISOString().slice(0, 10)
}

function weeksFromToday(iso) {
  if (!iso) return null
  const d = new Date(iso + 'T00:00:00')
  const now = new Date(); now.setHours(0, 0, 0, 0)
  return Math.round((d - now) / MS_PER_DAY / 7)
}

function CalendarBlock({ year, month, selectedISO, onPick, minISO, maxISO }) {
  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const days = ['M','T','W','T','F','S','S']
  const first = new Date(year, month, 1).getDay()
  const adj = first === 0 ? 6 : first - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  return (
    <div style={{ background: T.card, padding: 16, border: `1px solid ${T.hair}`, borderRadius: T.r, marginBottom: 14 }}>
      <div style={{ fontWeight: 600, fontSize: 13, fontFamily: T.sans, marginBottom: 12, color: T.text }}>{monthLabel}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
        {days.map((d, i) => <div key={i} style={{ textAlign: 'center', fontSize: 11, color: T.muted, fontFamily: T.mono, fontWeight: 600, letterSpacing: 1 }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {Array.from({ length: adj }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
          const iso = new Date(year, month, d).toISOString().slice(0, 10)
          const outOfRange = (minISO && iso < minISO) || (maxISO && iso > maxISO)
          const isSelected = iso === selectedISO
          return (
            <button key={d} onClick={() => !outOfRange && onPick(iso)} disabled={outOfRange}
              style={{
                aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontFamily: T.sans, fontWeight: isSelected ? 600 : 400,
                cursor: outOfRange ? 'default' : 'pointer', border: 'none',
                background: isSelected ? T.accent : 'transparent',
                color: isSelected ? '#fff' : (outOfRange ? T.hair : T.text),
                borderRadius: T.r,
                opacity: outOfRange ? 0.4 : 1,
              }}>
              {d}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function NotPregnantState() {
  const { back, startPregnancy } = useLuna()
  const [selected, setSelected] = useState(null)

  // LMP date range — within the past 280 days, and not in the future.
  // Per spec: "no more, no less than -10" — allow a 10-day forward window
  // to accommodate users who just discovered they were pregnant and are
  // logging slightly before what would be the canonical LMP date.
  const { minISO, maxISO } = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const min = new Date(today.getTime() - 280 * MS_PER_DAY)
    const max = new Date(today.getTime() + 10 * MS_PER_DAY)
    return { minISO: min.toISOString().slice(0, 10), maxISO: max.toISOString().slice(0, 10) }
  }, [])

  const due = selected ? lmpToDue(selected) : null
  const wks = due ? weeksFromToday(due) : null

  const inRange = selected && selected >= minISO && selected <= maxISO
  const outOfRangeMessage = selected && !inRange
    ? selected < minISO
      ? 'That date is more than 40 weeks ago. If your pregnancy is past 40 weeks, please reach out to your provider.'
      : 'That date is in the future. Pick a date on or near today.'
    : null

  const now = new Date()
  const months = [
    new Date(now.getFullYear(), now.getMonth() - 2, 1),
    new Date(now.getFullYear(), now.getMonth() - 1, 1),
    new Date(now.getFullYear(), now.getMonth(), 1),
  ]

  const activate = () => {
    if (!inRange) return
    startPregnancy({ lmp: selected })
  }

  return (
    <Screen padBottom={40}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="pregnancy" onBack={back} />
        <div style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 10 }}>
          Are you <em>expecting?</em>
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 15, color: T.muted, lineHeight: 1.6, marginBottom: 24 }}>
          Pregnancy mode trades cycle tracking for week-by-week guidance through your 40 weeks. You can switch back anytime — bodies change.
        </div>

        <div style={{ fontFamily: T.serif, fontSize: 14, color: T.text, marginBottom: 10, fontStyle: 'italic' }}>
          When did your last period start?
        </div>

        {months.map((m) => (
          <CalendarBlock key={`${m.getFullYear()}-${m.getMonth()}`}
            year={m.getFullYear()} month={m.getMonth()}
            selectedISO={selected} onPick={setSelected}
            minISO={minISO} maxISO={maxISO}
          />
        ))}

        {selected && inRange && due && (
          <div className="glass-card" style={{ padding: '14px 16px', borderRadius: T.r, marginBottom: 14 }}>
            <div style={{ fontFamily: T.sans, fontSize: 11, letterSpacing: 1.2, fontWeight: 600, color: T.accent, marginBottom: 6 }}>
              You're due around
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 500, lineHeight: 1.3 }}>
              {formatLongDate(due)}
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 13, color: T.muted, marginTop: 4, fontStyle: 'italic' }}>
              {wks > 0 ? `${wks} week${wks === 1 ? '' : 's'} from today` : wks === 0 ? 'Right around today' : `${Math.abs(wks)} week${Math.abs(wks) === 1 ? '' : 's'} past`}
            </div>
          </div>
        )}

        {outOfRangeMessage && (
          <div style={{ padding: '10px 14px', border: `1px solid ${T.accent}`, background: T.accent + '0F', borderRadius: T.r, fontFamily: T.sans, fontSize: 12, lineHeight: 1.45, color: T.text, marginBottom: 14 }}>
            {outOfRangeMessage}
          </div>
        )}

        <CTAButton full onClick={activate} style={{ opacity: inRange ? 1 : 0.45, pointerEvents: inRange ? 'auto' : 'none' }}>
          Switch to pregnancy mode {Icons.arrow}
        </CTAButton>

        <div style={{ marginTop: 18, fontFamily: T.serif, fontSize: 12.5, color: T.muted, lineHeight: 1.6, fontStyle: 'italic' }}>
          Due date is last period + 280 days (Naegele's rule). Most babies arrive between weeks 37 and 42 — every body keeps its own time.
        </div>
      </div>
    </Screen>
  )
}

function PregnantState() {
  const store = useLuna()
  const { back, endPregnancy, go, addPregnancyLoss } = store
  const preg = usePregnancy(store)

  const week = preg.week
  const trim = preg.trimester
  const accent = trimesterColor(trim?.number)
  const content = preg.content

  const daysToDue = preg.daysToDue
  const dueLine = daysToDue > 0
    ? `${daysToDue} day${daysToDue === 1 ? '' : 's'} until due date`
    : daysToDue === 0
      ? 'Today is your due date'
      : `${Math.abs(daysToDue)} day${Math.abs(daysToDue) === 1 ? '' : 's'} past due date`
  const kickReady = week >= 28
  const contractionsReady = week >= 36
  const toolsIntro = kickReady
    ? (contractionsReady
        ? 'These are the tools most likely to matter now.'
        : 'Kick counts are useful now. Contraction timing usually becomes relevant later in the third trimester.')
    : 'These tools stay here the whole time, but they usually become useful later: kick counts around week 28, contraction timing closer to labor.'

  const handleEnd = () => {
    const ok = window.confirm('End pregnancy mode? Your data stays — Luna will return to cycle tracking.')
    if (ok) {
      endPregnancy()
      back()
    }
  }

  // Distinct path for pregnancy ending in loss — records a gentle entry
  // in pregnancy history (with today's date as the loss date and the
  // current gestational week, both editable later), then opens the
  // dedicated PregnancyLoss screen for resources + reflection.
  const handleLoss = () => {
    const ok = window.confirm('Mark this pregnancy as ended in loss? Luna will record a private entry you can edit any time, then open the pregnancy-loss support space.')
    if (!ok) return
    addPregnancyLoss({
      type: week >= 20 ? 'stillbirth' : 'miscarriage',
      dateISO: new Date().toISOString().slice(0, 10),
      gestationWeeks: week || null,
    })
    endPregnancy()
    go('pregnancyLoss')
  }

  return (
    <Screen padBottom={40}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="pregnancy" onBack={back} />
        <Eyebrow color={accent}>week {week} · {trim?.name?.toLowerCase()}</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 44, fontWeight: 500, letterSpacing: -1, lineHeight: 1.02, marginBottom: 4 }}>
          Week {week} <span style={{ color: T.muted, fontWeight: 400 }}>of 40</span>
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 17, fontStyle: 'italic', color: T.muted, marginBottom: 22, lineHeight: 1.4 }}>
          {dueLine}.
        </div>

        <div className="glass-card" style={{ padding: 14, borderRadius: T.r, marginBottom: 18 }}>
          <div style={{ fontFamily: T.sans, fontSize: 11, letterSpacing: 1.2, fontWeight: 600, color: T.muted, marginBottom: 6 }}>You're due</div>
          <div style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 500, lineHeight: 1.3 }}>
            {formatLongDate(preg.dueDate)}
          </div>
        </div>

        {content && (
          <div className="glass-card" style={{ padding: 16, borderRadius: T.r, marginBottom: 18 }}>
            <div style={{ fontFamily: T.sans, fontSize: 11, letterSpacing: 1.2, fontWeight: 600, color: accent, marginBottom: 8 }}>
              This week
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.25, marginBottom: 14, letterSpacing: -0.3 }}>
              About the size of {content.size}.
            </div>
            <div style={{ fontFamily: T.sans, fontSize: 11, letterSpacing: 1.2, fontWeight: 600, color: T.muted, marginBottom: 6 }}>
              Baby
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 15, lineHeight: 1.55, color: T.text, marginBottom: 14 }}>
              {content.baby}
            </div>
            <div style={{ fontFamily: T.sans, fontSize: 11, letterSpacing: 1.2, fontWeight: 600, color: T.muted, marginBottom: 6 }}>
              You
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 15, lineHeight: 1.55, color: T.text }}>
              {content.body}
            </div>
            <SourceLine>{content.source}</SourceLine>
          </div>
        )}

        {/* Pregnancy tools — always reachable, but the copy makes it
            clear when each one usually becomes relevant so the screen
            does not feel like a pile of tools on week 9. */}
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: T.muted, marginBottom: 8, letterSpacing: -0.1 }}>
          tools in reach
        </div>
        <div className="frost-card" style={{
          padding: '0 16px',
          background: 'rgba(253,250,245,0.55)',
          border: `1px solid ${accent}22`,
          borderRadius: 18,
          marginBottom: 10,
        }}>
          <button onClick={() => go('kickCounter')}
            className="alive-card"
            style={{
              width: '100%', padding: '15px 0',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid rgba(26,19,16,0.06)',
              cursor: 'pointer', textAlign: 'left',
              color: T.text, fontFamily: 'inherit',
            }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
              <div style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 500, letterSpacing: -0.2 }}>
                Kick counter
              </div>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12, color: kickReady ? accent : T.muted, fontWeight: 500 }}>
                {kickReady ? 'useful now' : 'usually from week 28'}
              </div>
            </div>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: T.muted, lineHeight: 1.55 }}>
              Count to 10 during your baby's active window. Most days it takes 10-30 minutes.
            </div>
          </button>

          <button onClick={() => go('contractions')}
            className="alive-card"
            style={{
              width: '100%', padding: '15px 0',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer', textAlign: 'left',
              color: T.text, fontFamily: 'inherit',
            }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
              <div style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 500, letterSpacing: -0.2 }}>
                Contractions timer
              </div>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12, color: contractionsReady ? accent : T.muted, fontWeight: 500 }}>
                {contractionsReady ? 'useful now' : 'usually later'}
              </div>
            </div>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: T.muted, lineHeight: 1.55 }}>
              Tap when a contraction starts and ends. Luna tracks spacing and can flag the 5-1-1 pattern.
            </div>
          </button>
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 12.5, color: T.muted, lineHeight: 1.55, fontStyle: 'italic', marginBottom: 22 }}>
          {toolsIntro}
        </div>

        <div style={{ height: 1, background: T.hair, margin: '18px 0' }} />

        <div className="frost-card" style={{
          padding: '0 16px',
          background: 'rgba(253,250,245,0.55)',
          border: '1px solid rgba(26,19,16,0.06)',
          borderRadius: 18,
        }}>
          <button onClick={handleEnd}
            style={{
              width: '100%', textAlign: 'left',
              background: 'transparent', border: 'none',
              borderBottom: '1px solid rgba(26,19,16,0.06)',
              padding: '15px 0', cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              color: T.accent, fontFamily: T.sans, fontSize: 13, fontWeight: 600,
            }}>
            <span>End pregnancy mode</span>
            <span style={{ fontFamily: T.sans, fontSize: 11, letterSpacing: 0.3, opacity: 0.7 }}>back to your cycle</span>
          </button>

          <button onClick={handleLoss}
            style={{
              width: '100%', textAlign: 'left',
              background: 'transparent', border: 'none',
              padding: '15px 0', cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              color: T.text, fontFamily: T.sans, fontSize: 13, fontWeight: 500,
            }}>
            <span>If this pregnancy ended in loss</span>
            <span style={{ fontFamily: T.sans, fontSize: 11, letterSpacing: 0.3, opacity: 0.7 }}>support + resources</span>
          </button>
        </div>
        <div style={{ marginTop: 10, fontFamily: T.serif, fontSize: 12.5, color: T.muted, lineHeight: 1.55, fontStyle: 'italic' }}>
          Your logs are kept if this mode ends. If circumstances changed painfully, Luna opens a quieter room instead of asking you to explain everything first.
        </div>
      </div>
    </Screen>
  )
}

export default function Pregnancy() {
  const pregnancy = useLuna((s) => s.pregnancy)
  if (pregnancy?.active && pregnancy?.lmp) return <PregnantState />
  return <NotPregnantState />
}
