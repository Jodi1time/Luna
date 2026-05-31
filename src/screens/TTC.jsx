import { useMemo } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, Rule, Screen, SourceLine } from '../components/shared'
import useLuna from '../store/useLuna'
import { useCycle, isOnHormonalBC } from '../hooks/useCycle'

const MS_PER_DAY = 86400000

// TTC mode — Luna's home for "actively trying to conceive". Uses the
// cycle engine (BBT shift, mucus, variance, predictions) to give a
// real personalised read rather than a generic "have sex during your
// fertile window" line. The voice is doula-warm; the science is
// evidence-based.

function dayWindow({ cycleDay, bbtShift, cycleLength }) {
  if (cycleDay == null) return null
  // Prefer BBT-detected ovulation day when available, else midpoint.
  const ovDay = bbtShift?.shiftDayMedian ?? Math.round((cycleLength || 28) / 2)
  // Fertile window = 5 days before ovulation through ovulation day.
  const fertileStart = ovDay - 5
  const fertileEnd = ovDay
  const peakStart = ovDay - 2
  const peakEnd = ovDay
  if (cycleDay < fertileStart) {
    const daysUntil = fertileStart - cycleDay
    return { kind: 'pre', daysUntil, ovDay, fertileStart, fertileEnd }
  }
  if (cycleDay >= fertileStart && cycleDay < peakStart) {
    return { kind: 'opening', ovDay, fertileStart, fertileEnd, peakStart }
  }
  if (cycleDay >= peakStart && cycleDay <= peakEnd) {
    return { kind: 'peak', ovDay, fertileStart, fertileEnd, peakStart, peakEnd }
  }
  if (cycleDay <= cycleLength) {
    return { kind: 'past', ovDay, daysSince: cycleDay - peakEnd }
  }
  return { kind: 'late', ovDay }
}

export default function TTC() {
  const store = useLuna()
  const { back, go, logs, birthControl, displayName, settings, updateSetting } = store
  const cycle = useCycle(store)
  const onBC = isOnHormonalBC(birthControl)

  const todayISO = new Date().toISOString().slice(0, 10)
  const todayLog = logs?.[todayISO] || {}
  const window = useMemo(
    () => dayWindow({ cycleDay: cycle.cycleDay, bbtShift: cycle.bbtShift, cycleLength: cycle.cycleLength }),
    [cycle.cycleDay, cycle.bbtShift, cycle.cycleLength]
  )

  const firstName = (displayName || '').trim().split(' ')[0]
  const ttcSince = settings?.ttcStartISO
  const monthsTrying = ttcSince
    ? Math.floor((new Date() - new Date(ttcSince + 'T12:00:00')) / (MS_PER_DAY * 30))
    : null

  const turnOff = () => {
    if (window.confirm('Switch back to cycle mode? Luna keeps all your logs — only the framing changes.')) {
      updateSetting('lifecycle', 'cycle')
      back()
    }
  }

  const markStart = () => {
    if (!ttcSince) {
      updateSetting('ttcStartISO', new Date().toISOString().slice(0, 10))
    }
  }

  // Pull together the doula-toned guidance for today.
  let headline = 'Trying to conceive.'
  let body = 'Luna will keep close to your fertile window and tell you what your signals are saying. No pressure, no peak-week marketing.'
  let cardAccent = T.accent
  if (onBC) {
    headline = 'Your method still has hormones in the system.'
    body = 'Hormonal birth control suppresses ovulation. The natural cycle (and the chance of conceiving) returns after your method clears — for most pills that takes 1–3 cycles; for some methods longer. If you haven\'t already, talk to a prescriber about stopping.'
  } else if (window) {
    if (window.kind === 'pre') {
      headline = `Your fertile window opens in about ${window.daysUntil} day${window.daysUntil === 1 ? '' : 's'}.`
      body = 'You don\'t need to do anything special this week. Enjoy each other when you feel like it. The body does most of the work below the surface; readying for the actual window starts in a few days.'
    } else if (window.kind === 'opening') {
      headline = 'The fertile window is opening.'
      body = `Sperm can live in your body for up to five days when cervical mucus is friendly — which means sex in the next several days can result in conception on the day of ovulation. Aim for roughly every other day if that feels good. ${window.peakStart > 0 ? `Peak fertility is around days ${window.peakStart}–${window.peakEnd}.` : ''}`
    } else if (window.kind === 'peak') {
      headline = 'Peak fertility — today.'
      body = 'This is the highest-probability window. The classic guidance is sex every other day through ovulation; many providers now say every day is fine if energy and desire are there. Whichever rhythm feels right.'
      cardAccent = '#3F7E55'
    } else if (window.kind === 'past') {
      headline = window.daysSince <= 7
        ? `${window.daysSince} day${window.daysSince === 1 ? '' : 's'} past ovulation. Now is the wait.`
        : 'Late luteal — the two-week wait.'
      body = 'Implantation usually happens 6–12 days after ovulation, so any pregnancy symptoms before then are almost always still hormonal noise. Home pregnancy tests get reliable starting about the day of your expected period (around day 14 past ovulation).'
    } else if (window.kind === 'late') {
      headline = 'Your period is a little late.'
      body = 'A reliable home pregnancy test is fair game from today. If it\'s negative and your period still doesn\'t arrive within a week, retest, or ask a clinician for a blood HCG — those pick up earlier than urine tests.'
    }
  }

  const hasMucus = Boolean(todayLog.mucus)
  const hasBBT = Boolean(todayLog.bbt?.value)
  const mucusFertile = ['eggwhite', 'watery'].includes(todayLog.mucus)
  const ovConfirmed = Boolean(cycle.bbtShift?.shiftDayMedian)

  return (
    <Screen padBottom={40}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="trying to conceive" onBack={back} />
        <Eyebrow>Your fertile window, on your terms</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 32, fontWeight: 500, letterSpacing: -0.7, lineHeight: 1.05 }}>
          {firstName ? `${firstName}, here's where you are.` : 'Here\'s where you are.'}
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 15, lineHeight: 1.6, color: T.muted, marginTop: 12, fontStyle: 'italic' }}>
          Luna reads your signals — cycle day, BBT shift, cervical mucus — and keeps the guidance honest.
        </div>
        <Rule />

        {/* Today's read */}
        <div className="glass-card" style={{ padding: 18, borderLeft: `3px solid ${cardAccent}`, borderRadius: T.r, marginBottom: 18 }}>
          <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.2, fontWeight: 600, color: T.muted, marginBottom: 10 }}>
            Today's read
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 19, fontWeight: 500, lineHeight: 1.4, color: T.text, letterSpacing: -0.2, marginBottom: 10 }}>
            {headline}
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 15.5, lineHeight: 1.65, color: T.text }}>
            {body}
          </div>
        </div>

        {/* Your signals today */}
        {!onBC && (
          <>
            <Eyebrow>What your signals say</Eyebrow>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
              <SignalRow
                label="Basal body temperature (BBT)"
                value={hasBBT ? `${todayLog.bbt.value}°${todayLog.bbt.unit}` : 'Not logged today'}
                hint={
                  ovConfirmed
                    ? `Luna has detected your ovulation shift around day ${cycle.bbtShift.shiftDayMedian} (~${cycle.bbtShift.shiftDelta}°${cycle.bbtShift.unit} rise).`
                    : 'Daily BBT first thing in the morning, before sitting up. After 2–3 cycles, Luna can detect your ovulation marker.'
                }
                cta={hasBBT ? null : { label: 'Log it', onTap: () => go('log') }}
              />
              <SignalRow
                label="Cervical mucus"
                value={hasMucus
                  ? todayLog.mucus.charAt(0).toUpperCase() + todayLog.mucus.slice(1).replace(/^([a-z])/, (m) => m).replace('eggwhite', 'Egg-white')
                  : 'Not logged today'}
                hint={
                  hasMucus
                    ? mucusFertile
                      ? 'Egg-white or watery mucus is the most fertile signal — sperm move best through it. The next few days are high-probability.'
                      : 'Sticky/creamy mucus is less fertile but normal across early and late cycle. Watch for the shift to egg-white.'
                    : 'Cervical mucus shifts give one of the clearest fertility signals — abundant and stretchy near ovulation, drier afterwards.'
                }
                cta={hasMucus ? null : { label: 'Log it', onTap: () => go('log') }}
              />
            </div>
          </>
        )}

        {/* When-to-test guidance — only show if late or past ovulation */}
        {(window?.kind === 'past' || window?.kind === 'late') && (
          <div className="glass-card" style={{ padding: 14, borderLeft: `3px solid ${T.accent}`, borderRadius: T.r, marginBottom: 18 }}>
            <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.2, fontWeight: 600, color: T.muted, marginBottom: 6 }}>
              About testing
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 14.5, lineHeight: 1.6, color: T.text }}>
              Home pregnancy tests are reliable from around the day of expected period — first-morning urine is most accurate. A faint line still counts. Negative + late period after a week → retest or ask for a blood HCG (more sensitive).
            </div>
          </div>
        )}

        {/* When to talk to a specialist */}
        <Eyebrow>When to widen the conversation</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 14.5, lineHeight: 1.7, color: T.text, marginBottom: 16 }}>
          <div>· Under 35 — a workup is reasonable after <strong style={{ fontWeight: 600 }}>12 months</strong> of trying without pregnancy.</div>
          <div>· 35 and older — sooner: <strong style={{ fontWeight: 600 }}>6 months</strong>.</div>
          <div>· 40 and older — start conversations now, regardless of how long you've been trying.</div>
          <div>· Known issues (irregular cycles, PCOS, endo, prior pelvic surgery, partner with known fertility issues) — earlier.</div>
        </div>

        {monthsTrying != null && monthsTrying >= 6 && (
          <div className="glass-card" style={{ padding: 14, borderLeft: `3px solid ${T.accent}`, borderRadius: T.r, marginBottom: 18, background: T.accent + '10' }}>
            <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.2, fontWeight: 600, color: T.accent, marginBottom: 6 }}>
              {monthsTrying} months in
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 14.5, lineHeight: 1.6, color: T.text }}>
              You've been trying for about {monthsTrying} months. That's a fair amount of patient work, and worth telling a clinician about regardless of age — a basic fertility workup (hormone panel, ultrasound, partner semen analysis) takes weeks, not months, and shifts the conversation from uncertainty to data.
            </div>
            <button onClick={() => go('cheatsheet')}
              style={{ marginTop: 10, background: 'transparent', border: 'none', cursor: 'pointer', color: T.accent, fontSize: 12, fontWeight: 600, letterSpacing: 0.4, fontFamily: T.sans, padding: 0 }}>
              Open my talking points →
            </button>
          </div>
        )}

        {!ttcSince && (
          <button onClick={markStart}
            style={{ width: '100%', background: 'transparent', border: `1px solid ${T.text}`, color: T.text, padding: '12px 14px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans, fontSize: 12, fontWeight: 600, letterSpacing: 0.4, marginBottom: 14 }}>
            Mark today as when you started trying
          </button>
        )}

        <Rule />
        <button onClick={turnOff}
          style={{ width: '100%', background: 'transparent', border: `1px solid ${T.hair}`, color: T.muted, padding: '12px 14px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans, fontSize: 12, fontWeight: 500, letterSpacing: 0.3 }}>
          Switch back to cycle mode
        </button>
        <div style={{ marginTop: 8, fontFamily: T.serif, fontSize: 12, color: T.muted, fontStyle: 'italic', lineHeight: 1.55 }}>
          Your logs stay — only the framing changes. Use this when you're done trying or pausing for now.
        </div>

        <SourceLine>Guidance based on ACOG, ASRM, NICE fertility guideline CG156.</SourceLine>
        <div style={{ height: 16 }} />
      </div>
    </Screen>
  )
}

function SignalRow({ label, value, hint, cta }) {
  return (
    <div className="glass-card" style={{ padding: 14, borderRadius: T.r }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <div style={{ fontFamily: T.serif, fontSize: 14, fontWeight: 500, color: T.text }}>{label}</div>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.accent, fontWeight: 600 }}>{value}</div>
      </div>
      {hint && (
        <div style={{ fontFamily: T.serif, fontSize: 13, color: T.muted, fontStyle: 'italic', lineHeight: 1.55, marginBottom: cta ? 8 : 0 }}>
          {hint}
        </div>
      )}
      {cta && (
        <button onClick={cta.onTap}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.accent, fontSize: 12, fontWeight: 600, letterSpacing: 0.4, fontFamily: T.sans, padding: 0 }}>
          {cta.label} →
        </button>
      )}
    </div>
  )
}
