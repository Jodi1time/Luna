import { useMemo } from 'react'
import { T } from '../data/theme'
import { Masthead, Screen, SourceLine } from '../components/shared'
import { PhaseFlourish } from '../components/phaseFlourishes'
import { sectionColors, sectionPaper } from '../data/sectionPalette'
import useLuna from '../store/useLuna'
import { useCycle, isOnHormonalBC } from '../hooks/useCycle'

const MS_PER_DAY = 86400000

// TTC mode — Luna's home for "actively trying to conceive". Uses the
// fused ovulation signal (BBT + mucus + libido) plus the variance
// engine to give a personalised, doula-toned read. Now in the new
// Luna register: frosted glass, soft rounded corners, section tints,
// italic serif lowercase eyebrows.

// Phase-tinted accent for the daily window. Each window stage wears
// its own soft hue so the eye sees "you've moved" between days.
const WINDOW_ACCENT = {
  pre:     '#7A9070',  // sage — preparing
  opening: '#D88B5A',  // peach — energy gathering
  peak:    '#3F7E55',  // green — fertile peak
  past:    '#9F7BB8',  // lavender — wait
  late:    '#C84E2E',  // terra — late
}

function dayWindow({ cycleDay, ovDay, cycleLength }) {
  if (cycleDay == null) return null
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

// Section head — small dot + italic-serif lowercase, the pattern
// used across Settings/Intimate/Cycle Schools for consistency.
function GroupHead({ label, accent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <div style={{ width: 6, height: 6, borderRadius: 999, background: accent, boxShadow: `0 0 0 3px ${accent}22` }} />
      <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 14.5, fontWeight: 500, color: T.text, letterSpacing: -0.1 }}>
        {label.toLowerCase()}.
      </div>
    </div>
  )
}

// Signal row — frosted soft card with label, value chip, italic
// hint, optional CTA. Replaces the old glass-card pattern.
function SignalRow({ label, value, hint, cta, accent, present }) {
  return (
    <div className="alive-card frost-card" style={{
      padding: 16,
      background: present ? `${accent}10` : 'rgba(253,250,245,0.55)',
      border: `1px solid ${present ? accent + '33' : 'rgba(26,19,16,0.06)'}`,
      borderRadius: 18,
      boxShadow: present
        ? `0 14px 30px -22px ${accent}55`
        : '0 10px 22px -22px rgba(26,19,16,0.18)',
      transition: 'all .22s var(--ease-out)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <div style={{ fontFamily: T.serif, fontSize: 14.5, fontWeight: 500, color: T.text, letterSpacing: -0.1 }}>{label}</div>
        <div style={{
          fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, fontWeight: 500,
          color: present ? accent : T.muted,
          padding: present ? '2px 10px' : 0,
          borderRadius: 999,
          background: present ? `${accent}1a` : 'transparent',
        }}>{value}</div>
      </div>
      {hint && (
        <div style={{ fontFamily: T.serif, fontSize: 13, color: T.muted, fontStyle: 'italic', lineHeight: 1.6, marginBottom: cta ? 10 : 0 }}>
          {hint}
        </div>
      )}
      {cta && (
        <button onClick={cta.onTap}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: accent, fontSize: 12, fontWeight: 600, letterSpacing: 0.3, fontFamily: T.sans, padding: 0 }}>
          {cta.label} →
        </button>
      )}
    </div>
  )
}

export default function TTC() {
  const store = useLuna()
  const { back, go, logs, birthControl, displayName, settings, updateSetting } = store
  const cycle = useCycle(store)
  const onBC = isOnHormonalBC(birthControl)

  const todayISO = new Date().toISOString().slice(0, 10)
  const todayLog = logs?.[todayISO] || {}

  // Use the fused ovulation day when available (BBT + mucus + libido),
  // falls back to BBT alone, then to cycle midpoint.
  const ovDay = cycle.ovulation?.day
    ?? cycle.bbtShift?.shiftDayMedian
    ?? Math.round((cycle.cycleLength || 28) / 2)

  const window = useMemo(
    () => dayWindow({ cycleDay: cycle.cycleDay, ovDay, cycleLength: cycle.cycleLength }),
    [cycle.cycleDay, ovDay, cycle.cycleLength]
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

  // Doula-toned guidance for today, keyed off the current window stage.
  let headline = 'Trying to conceive.'
  let body = 'Luna will keep close to your fertile window and tell you what your signals are saying. No pressure, no peak-week marketing.'
  let stageColor = sectionColors('plan').accent
  if (onBC) {
    headline = 'Your method still has hormones in the system.'
    body = "Hormonal birth control suppresses ovulation. The natural cycle (and the chance of conceiving) returns after your method clears — for most pills that takes 1–3 cycles; for some methods longer. If you haven't already, talk to a prescriber about stopping."
  } else if (window) {
    stageColor = WINDOW_ACCENT[window.kind] || stageColor
    if (window.kind === 'pre') {
      headline = `Your fertile window opens in about ${window.daysUntil} day${window.daysUntil === 1 ? '' : 's'}.`
      body = "You don't need to do anything special this week. Enjoy each other when you feel like it. The body does most of the work below the surface; readying for the actual window starts in a few days."
    } else if (window.kind === 'opening') {
      headline = 'The fertile window is opening.'
      body = `Sperm can live in your body for up to five days when cervical mucus is friendly — which means sex in the next several days can result in conception on the day of ovulation. Aim for roughly every other day if that feels good. ${window.peakStart > 0 ? `Peak fertility is around days ${window.peakStart}–${window.peakEnd}.` : ''}`
    } else if (window.kind === 'peak') {
      headline = 'Peak fertility — today.'
      body = 'This is the highest-probability window. The classic guidance is sex every other day through ovulation; many providers now say every day is fine if energy and desire are there. Whichever rhythm feels right.'
    } else if (window.kind === 'past') {
      headline = window.daysSince <= 7
        ? `${window.daysSince} day${window.daysSince === 1 ? '' : 's'} past ovulation. Now is the wait.`
        : 'Late luteal — the two-week wait.'
      body = 'Implantation usually happens 6–12 days after ovulation, so any pregnancy symptoms before then are almost always still hormonal noise. Home pregnancy tests get reliable starting about the day of your expected period (around day 14 past ovulation).'
    } else if (window.kind === 'late') {
      headline = 'Your period is a little late.'
      body = "A reliable home pregnancy test is fair game from today. If it's negative and your period still doesn't arrive within a week, retest, or ask a clinician for a blood HCG — those pick up earlier than urine tests."
    }
  }

  const hasMucus = Boolean(todayLog.mucus)
  const hasBBT = Boolean(todayLog.bbt?.value)
  const hasLibido = Boolean(todayLog.intimate?.libido)
  const mucusFertile = ['eggwhite', 'watery'].includes(todayLog.mucus)
  const planAccent = sectionColors('plan').accent

  return (
    <Screen padBottom={140}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="trying to conceive" onBack={back} />

        {/* Hero — phase-tinted gradient wash, italic title, gentle subtitle. */}
        <div className="insight-stagger" style={{
          margin: '4px -22px 0', padding: '14px 28px 24px',
          background: `linear-gradient(180deg, ${planAccent}14 0%, transparent 80%)`,
          textAlign: 'center', animationDelay: '0ms',
        }}>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: planAccent, fontWeight: 500, letterSpacing: 0.2, opacity: 0.9, marginBottom: 8 }}>
            your fertile window, on your terms
          </div>
          {cycle.phase && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6, color: planAccent, opacity: 0.6 }} aria-hidden="true">
              <PhaseFlourish phaseId={cycle.phase.id} size={24} />
            </div>
          )}
          <div style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 400, letterSpacing: -0.6, lineHeight: 1.1, color: T.text, fontStyle: 'italic' }}>
            {firstName ? <>{firstName}, here's <em>where you are.</em></> : <>Here's <em>where you are.</em></>}
          </div>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 14, color: T.muted, lineHeight: 1.6, marginTop: 12, maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
            Luna reads your signals — cycle day, BBT, mucus, libido — and keeps the guidance honest.
          </div>
        </div>

        {/* Today's read — stage-colored frost card */}
        <div className="insight-stagger alive-card frost-card" style={{
          marginTop: 18, padding: 20,
          background: `linear-gradient(160deg, ${stageColor}14, rgba(253,250,245,0.5))`,
          border: `1px solid ${stageColor}33`,
          borderLeft: `3px solid ${stageColor}`,
          borderRadius: 22,
          boxShadow: `0 14px 30px -22px ${stageColor}55`,
          animationDelay: '60ms',
        }}>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, color: stageColor, fontWeight: 500, letterSpacing: -0.1, marginBottom: 10 }}>
            today's read
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 500, lineHeight: 1.35, color: T.text, letterSpacing: -0.3, marginBottom: 10, fontStyle: 'italic' }}>
            {headline}
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 15.5, lineHeight: 1.65, color: T.text }}>
            {body}
          </div>
        </div>

        {/* Confidence / ovulation read — when Luna has fused signals */}
        {!onBC && cycle.ovulation && (
          <div className="insight-stagger alive-card frost-card" style={{
            marginTop: 14, padding: 16,
            background: sectionPaper('plan'),
            border: `1px solid ${planAccent}28`,
            borderLeft: `3px solid ${planAccent}`,
            borderRadius: 18,
            boxShadow: `0 14px 30px -22px ${planAccent}55`,
            animationDelay: '100ms',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, color: planAccent, fontWeight: 500, letterSpacing: -0.1 }}>
                how luna is reading your ovulation
              </div>
              <div style={{
                fontFamily: T.sans, fontSize: 9, letterSpacing: 1.5, fontWeight: 700, textTransform: 'uppercase',
                padding: '4px 10px', borderRadius: 999,
                background: cycle.ovulation.confidence === 'very-high' || cycle.ovulation.confidence === 'high' ? planAccent : T.muted,
                color: '#fff',
              }}>
                {cycle.ovulation.confidence === 'very-high' ? 'High' : cycle.ovulation.confidence === 'high' ? 'High' : cycle.ovulation.confidence === 'medium' ? 'Medium' : 'Low'} confidence
              </div>
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 15.5, fontStyle: 'italic', color: T.text, lineHeight: 1.55, letterSpacing: -0.1 }}>
              Ovulation around <em style={{ color: planAccent }}>day {cycle.ovulation.day}</em>. {cycle.ovulation.why}
            </div>
          </div>
        )}

        {/* Your signals today */}
        {!onBC && (
          <div style={{ marginTop: 26 }}>
            <GroupHead label="What your signals say" accent={planAccent} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SignalRow
                accent={planAccent}
                label="Basal body temperature"
                present={hasBBT}
                value={hasBBT ? `${todayLog.bbt.value}°${todayLog.bbt.unit}` : 'not logged today'}
                hint={
                  cycle.bbtShift
                    ? `Luna has detected your ovulation shift around day ${cycle.bbtShift.shiftDayMedian} — about ${cycle.bbtShift.shiftDelta}°${cycle.bbtShift.unit} rise.`
                    : 'Daily BBT first thing in the morning, before sitting up. After 2–3 cycles, Luna detects your ovulation marker.'
                }
                cta={hasBBT ? null : { label: 'Log it', onTap: () => go('log') }}
              />
              <SignalRow
                accent={planAccent}
                label="Cervical mucus"
                present={hasMucus}
                value={hasMucus
                  ? (todayLog.mucus === 'eggwhite' ? 'Egg-white' : todayLog.mucus.charAt(0).toUpperCase() + todayLog.mucus.slice(1))
                  : 'not logged today'}
                hint={
                  hasMucus
                    ? mucusFertile
                      ? 'Egg-white or watery mucus is the most fertile signal — sperm move best through it. The next few days are high-probability.'
                      : 'Sticky / creamy mucus is less fertile but normal across early and late cycle. Watch for the shift to egg-white.'
                    : 'Cervical mucus shifts are one of the clearest fertility signals — abundant and stretchy near ovulation, drier after.'
                }
                cta={hasMucus ? null : { label: 'Log it', onTap: () => go('log') }}
              />
              <SignalRow
                accent={planAccent}
                label="Libido"
                present={hasLibido}
                value={hasLibido ? todayLog.intimate.libido.charAt(0).toUpperCase() + todayLog.intimate.libido.slice(1) : 'not logged today'}
                hint={
                  hasLibido
                    ? 'Libido often crests around ovulation as testosterone + estrogen peak. Luna folds this into the fertility read.'
                    : 'High or open libido days are a supporting signal. Logged in your intimate health surface.'
                }
                cta={hasLibido ? null : { label: 'Log it', onTap: () => go('intimate') }}
              />
            </div>
          </div>
        )}

        {/* When-to-test guidance — only show if late or past ovulation */}
        {(window?.kind === 'past' || window?.kind === 'late') && (
          <div className="alive-card frost-card" style={{
            marginTop: 22, padding: 18,
            background: sectionPaper('care'),
            border: `1px solid ${sectionColors('care').accent}28`,
            borderLeft: `3px solid ${sectionColors('care').accent}`,
            borderRadius: 18,
            boxShadow: `0 14px 30px -22px ${sectionColors('care').accent}55`,
          }}>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, color: sectionColors('care').accent, fontWeight: 500, letterSpacing: -0.1, marginBottom: 8 }}>
              about testing
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 14.5, lineHeight: 1.65, color: T.text }}>
              Home pregnancy tests are reliable from around the day of expected period — first-morning urine is most accurate. A faint line still counts. Negative + late period after a week → retest or ask for a blood HCG (more sensitive).
            </div>
          </div>
        )}

        {/* When to talk to a specialist */}
        <div style={{ marginTop: 26 }}>
          <GroupHead label="When to widen the conversation" accent={planAccent} />
          <div className="frost-card" style={{
            padding: 18,
            background: 'rgba(253,250,245,0.55)',
            border: '1px solid rgba(26,19,16,0.06)',
            borderRadius: 18,
            fontFamily: T.serif, fontSize: 14.5, lineHeight: 1.75, color: T.text,
          }}>
            <div style={{ marginBottom: 6 }}>· Under 35 — a workup is reasonable after <em style={{ fontStyle: 'italic', color: planAccent, fontWeight: 600 }}>12 months</em> of trying.</div>
            <div style={{ marginBottom: 6 }}>· 35 and older — sooner: <em style={{ fontStyle: 'italic', color: planAccent, fontWeight: 600 }}>6 months</em>.</div>
            <div style={{ marginBottom: 6 }}>· 40 and older — start conversations now, regardless.</div>
            <div>· Known issues (irregular cycles, PCOS, endo, prior pelvic surgery, partner with known fertility issues) — earlier.</div>
          </div>
        </div>

        {monthsTrying != null && monthsTrying >= 6 && (
          <div className="alive-card frost-card" style={{
            marginTop: 18, padding: 18,
            background: sectionPaper('urgent'),
            border: `1px solid ${sectionColors('urgent').accent}33`,
            borderLeft: `3px solid ${sectionColors('urgent').accent}`,
            borderRadius: 18,
            boxShadow: `0 14px 30px -22px ${sectionColors('urgent').accent}55`,
          }}>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, color: sectionColors('urgent').accent, fontWeight: 500, letterSpacing: -0.1, marginBottom: 8 }}>
              {monthsTrying} months in
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 14.5, lineHeight: 1.65, color: T.text }}>
              You've been trying for about {monthsTrying} months. That's a fair amount of patient work, and worth telling a clinician about regardless of age — a basic fertility workup (hormone panel, ultrasound, partner semen analysis) takes weeks, not months, and shifts the conversation from uncertainty to data.
            </div>
            <button onClick={() => go('cheatsheet')}
              style={{ marginTop: 12, background: 'transparent', border: 'none', cursor: 'pointer', color: sectionColors('urgent').accent, fontSize: 12, fontWeight: 600, letterSpacing: 0.3, fontFamily: T.sans, padding: 0 }}>
              Open my talking points →
            </button>
          </div>
        )}

        {!ttcSince && (
          <button onClick={markStart}
            className="alive-card frost-card"
            style={{ marginTop: 22, width: '100%', background: 'rgba(253,250,245,0.55)', border: `1px solid ${planAccent}40`, color: planAccent, padding: '14px 18px', borderRadius: 999, cursor: 'pointer', fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, letterSpacing: 0.3, boxShadow: `0 10px 22px -16px ${planAccent}60` }}>
            Mark today as when you started trying
          </button>
        )}

        <button onClick={turnOff}
          className="alive-card frost-card"
          style={{ marginTop: 14, width: '100%', background: 'rgba(253,250,245,0.55)', border: '1px solid rgba(26,19,16,0.08)', color: T.muted, padding: '13px 18px', borderRadius: 999, cursor: 'pointer', fontFamily: T.sans, fontSize: 12, fontWeight: 500, letterSpacing: 0.3 }}>
          Switch back to cycle mode
        </button>
        <div style={{ marginTop: 10, fontFamily: T.serif, fontSize: 12, color: T.muted, fontStyle: 'italic', lineHeight: 1.6 }}>
          Your logs stay — only the framing changes. Use this when you're done trying or pausing for now.
        </div>

        <SourceLine>Guidance based on ACOG, ASRM, NICE fertility guideline CG156.</SourceLine>
        <div style={{ height: 16 }} />
      </div>
    </Screen>
  )
}
