import { useMemo } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, Rule, Screen } from '../components/shared'
import useLuna from '../store/useLuna'
import { useCycle } from '../hooks/useCycle'
import { parseDateOnly } from '../lib/dateOnly'

const MS_PER_DAY = 86400000

// Late period calibrator — uses the engine's variance to give a
// personalised "give it X days" rather than a generic "wait a week".
// Variance-aware reassurance is the whole point: a steady cycle that's
// 4 days late means something different than a variable one that's
// 4 days late.
export default function LatePeriodHelper() {
  const store = useLuna()
  const { back, go, birthControl, displayName } = store
  const cycle = useCycle(store)

  const { daysLate, expectedISO, conf, why, range, hasBC } = useMemo(() => {
    const today = parseDateOnly(new Date())
    const periodPrediction = cycle?.predictions?.find((p) => p.label === 'Next period')
    if (!periodPrediction?.iso) return { daysLate: null }
    const expected = parseDateOnly(periodPrediction.iso)
    const days = Math.round((today - expected) / MS_PER_DAY)
    return {
      daysLate: days,
      expectedISO: periodPrediction.iso,
      conf: cycle?.variance?.conf || 'medium',
      why: cycle?.variance?.why,
      range: cycle?.variance?.range || 3,
      hasBC: birthControl?.method && birthControl.method !== 'none' && birthControl.method !== 'copper-iud',
    }
  }, [cycle, birthControl])

  const firstName = (displayName || '').trim().split(' ')[0]

  if (daysLate == null) {
    return (
      <Screen padBottom={40}>
        <div style={{ padding: '12px 22px 0', color: T.text }}>
          <Masthead issue="late period" onBack={back} />
          <div style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 500, letterSpacing: -0.7, lineHeight: 1.05, marginBottom: 10 }}>
            Nothing to anchor to yet.
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 15, color: T.muted, fontStyle: 'italic', lineHeight: 1.6 }}>
            Log a period start first and Luna will know when "late" actually starts.
          </div>
        </div>
      </Screen>
    )
  }

  // Build the calibration headline based on confidence + days late.
  let headline, body
  if (daysLate < 0) {
    headline = `Your period isn't actually late yet${firstName ? `, ${firstName}` : ''} — Luna's prediction is ${Math.abs(daysLate)} day${Math.abs(daysLate) === 1 ? '' : 's'} away.`
    body = `Based on your last start, you're due around ${new Date(expectedISO + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}. Some people get the "is it late?" feeling a day or two early — that's normal too.`
  } else if (daysLate === 0) {
    headline = `Today's the day Luna expected your period.`
    body = `It could land today, or in the next day or two. Cycles vary by ±${range} day${range === 1 ? '' : 's'} for most people.`
  } else if (conf === 'high' && daysLate <= 2) {
    headline = `Your period is ${daysLate} day${daysLate === 1 ? '' : 's'} late — and your cycles are steady, so this is the edge of normal.`
    body = `${why || 'You\'ve been very regular.'} Give it another day or two before reading anything into it. Stress, travel, illness, or hard training can shift a period by 2–3 days without anything else being going on.`
  } else if (daysLate <= range) {
    headline = `${daysLate} day${daysLate === 1 ? '' : 's'} late — still inside your variation.`
    body = `${why || `Your cycles vary by about ${range} days.`} Wait a few more days before testing or worrying. The body shifts; that's biology, not a verdict.`
  } else if (daysLate <= 7) {
    headline = `${daysLate} days late — past your usual range.`
    body = `If unprotected sex is on the table, a home pregnancy test is reliable from today onward (the first-morning urine ones are most accurate). If pregnancy isn't a possibility, stress + sleep + recent illness + new exercise + recent BC change are the usual suspects.`
  } else {
    headline = `${daysLate} days late.`
    body = `Test if pregnancy could be possible. If not — and especially if it happens again next cycle — that's worth a conversation with a clinician. Long gaps can signal thyroid, PCOS, perimenopause, or stress amenorrhoea, and all of those are workupable.`
  }

  return (
    <Screen padBottom={40}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="late period" onBack={back} />

        <div style={{ fontFamily: T.serif, fontSize: 32, fontWeight: 500, letterSpacing: -0.7, lineHeight: 1.05, marginBottom: 8 }}>
          Period thoughts?
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 16, fontStyle: 'italic', color: T.muted, lineHeight: 1.5, marginBottom: 4 }}>
          Luna has read your cycles. Here's the honest read.
        </div>
        <Rule />

        <div className="glass-card" style={{ padding: 18, borderRadius: T.r, marginBottom: 18 }}>
          <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 1.2, fontWeight: 600, color: T.muted, marginBottom: 10 }}>
            What Luna sees
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 500, lineHeight: 1.4, letterSpacing: -0.2, marginBottom: 12, color: T.text }}>
            {headline}
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 15.5, lineHeight: 1.65, color: T.text }}>
            {body}
          </div>
        </div>

        {daysLate > 4 && (
          <div className="glass-card" style={{ padding: 14, borderRadius: T.r, marginBottom: 18, background: T.accent + '10' }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 1.2, fontWeight: 600, color: T.accent, marginBottom: 6 }}>
              About testing
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 14.5, lineHeight: 1.55, color: T.text }}>
              Home tests are reliable from about the day of a missed period — first-morning urine is most accurate. A faint line is still a line. If negative and your period still doesn't come within a week, retest or ask a clinician for a blood HCG, which is more sensitive.
            </div>
          </div>
        )}

        {hasBC && (
          <div className="glass-card" style={{ padding: 14, borderRadius: T.r, marginBottom: 18 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 1.2, fontWeight: 600, color: T.muted, marginBottom: 6 }}>
              On your method
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 14, lineHeight: 1.55, color: T.text }}>
              On hormonal birth control, "late" can mean different things — some methods reduce or stop periods entirely as expected. If yours is normally regular and this is a new pattern, worth mentioning to your prescriber.
            </div>
          </div>
        )}

        <Rule />
        <Eyebrow>The honest list of what shifts a cycle</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 14.5, lineHeight: 1.7, color: T.text }}>
          <div>· Pregnancy.</div>
          <div>· Stress — a high-cortisol week can delay ovulation, which delays the bleed.</div>
          <div>· Travel, especially across time zones.</div>
          <div>· Illness, fever, or recent surgery.</div>
          <div>· Major sleep disruption.</div>
          <div>· Sudden weight change in either direction.</div>
          <div>· Hard new training — running, lifting, anything intense.</div>
          <div>· Hormonal BC start, stop, or method change in the last few months.</div>
          <div>· Thyroid drift, PCOS, perimenopause — slower-moving signals if it keeps happening.</div>
        </div>

        <Rule />
        <button onClick={() => go('cheatsheet')}
          style={{ width: '100%', background: 'transparent', color: T.text, border: `1px solid ${T.text}`, padding: '12px 14px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans, fontSize: 12, fontWeight: 600, letterSpacing: 0.4, marginBottom: 14 }}>
          Open my talking points for a clinician →
        </button>

        <div style={{ fontFamily: T.serif, fontSize: 13, color: T.muted, fontStyle: 'italic', lineHeight: 1.55 }}>
          Cycles aren't metronomes. A few days off, especially after a hard or unusual stretch of life, is more a weather report than an alarm.
        </div>
        <div style={{ height: 16 }} />
      </div>
    </Screen>
  )
}
