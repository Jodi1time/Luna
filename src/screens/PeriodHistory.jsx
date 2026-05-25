import { T } from '../data/theme'
import { Masthead, Eyebrow, Rule, SourceLine, Screen, CTAButton } from '../components/shared'
import { useCycle, getPeriodHistory } from '../hooks/useCycle'
import useLuna from '../store/useLuna'

// Format an ISO date like "May 5" — used for compact row labels.
const fmtShort = (iso) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

// "May 5, 2026" for the trailing year on a span.
const fmtLong = (iso) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export default function PeriodHistory() {
  const store = useLuna()
  const { go, back, logs } = store
  const cycle = useCycle(store)
  const history = getPeriodHistory(logs, cycle.periodHistory).slice(0, 12)

  // Summary stats only meaningful with at least two periods.
  const gaps = history.map((p) => p.gapFromPrev).filter((g) => g != null && g >= 18 && g <= 60)
  const avgCycle = gaps.length > 0 ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : null
  const avgPeriod = history.length > 0
    ? Math.round(history.reduce((a, p) => a + p.length, 0) / history.length)
    : null
  const minGap = gaps.length > 0 ? Math.min(...gaps) : null
  const maxGap = gaps.length > 0 ? Math.max(...gaps) : null

  const headline = history.length === 0
    ? 'Just getting started.'
    : `Your last ${history.length} ${history.length === 1 ? 'period' : 'periods'}.`

  return (
    <Screen padBottom={48}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead onBack={back} issue="Period History" />

        <Eyebrow>YOUR CYCLE · LAST {history.length} PERIOD{history.length === 1 ? '' : 'S'}</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 500, letterSpacing: -0.6, lineHeight: 1.1, marginBottom: 14 }}>
          {headline}
        </div>

        {history.length === 0 ? (
          <>
            <div style={{ fontFamily: T.serif, fontSize: 15.5, lineHeight: 1.6, color: T.muted, marginBottom: 16 }}>
              Once you log flow for a few days, your period history will start to fill in here. Two cycles is enough to spot a rhythm.
            </div>
            <CTAButton onClick={() => go('log')} full>LOG TODAY</CTAButton>
          </>
        ) : (
          <>
            {history.length >= 2 && (
              <div style={{
                background: T.card, border: `1px solid ${T.hair}`, borderRadius: T.r,
                padding: '14px 16px', marginBottom: 18,
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <SummaryRow label="Average cycle" value={avgCycle ? `${avgCycle} days` : '—'} />
                <SummaryRow label="Average period" value={avgPeriod ? `${avgPeriod} days` : '—'} />
                <SummaryRow
                  label="Variability range"
                  value={minGap && maxGap ? (minGap === maxGap ? `${minGap} days` : `${minGap}–${maxGap} days`) : '—'}
                />
              </div>
            )}

            <Rule />
            <Eyebrow>EACH CYCLE</Eyebrow>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              {history.map((p) => {
                const sameYear =
                  new Date(p.start + 'T12:00:00').getFullYear() ===
                  new Date(p.end + 'T12:00:00').getFullYear()
                const range = `${fmtShort(p.start)} — ${sameYear ? fmtShort(p.end) : fmtLong(p.end)}, ${new Date(p.end + 'T12:00:00').getFullYear()}`
                // `history` is newest-first. `gapFromPrev` was set chronologically:
                // distance from the older period start to this one — i.e. the
                // cycle length leading up to this period.
                const cycleLenForRow = p.gapFromPrev

                return (
                  <div key={p.start} style={{
                    background: T.card, border: `1px solid ${T.hair}`, borderRadius: T.r,
                    padding: '12px 14px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <div style={{ fontFamily: T.serif, fontSize: 16, fontWeight: 500, letterSpacing: -0.2 }}>
                        {range}
                      </div>
                      <div style={{ fontFamily: T.mono, fontSize: 11, color: T.accent, letterSpacing: 0.5 }}>
                        {p.length} {p.length === 1 ? 'DAY' : 'DAYS'}
                      </div>
                    </div>
                    {cycleLenForRow && (
                      <div style={{ marginTop: 6, fontFamily: T.mono, fontSize: 10, color: T.muted, letterSpacing: 1 }}>
                        {cycleLenForRow}-DAY CYCLE
                      </div>
                    )}
                    {/* Tiny visual: period days marked against the cycle length */}
                    {cycleLenForRow && (
                      <div style={{
                        position: 'relative',
                        height: 4,
                        marginTop: 10,
                        background: T.faint,
                        borderRadius: 2,
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          position: 'absolute',
                          left: 0, top: 0, bottom: 0,
                          width: `${Math.min(100, (p.length / cycleLenForRow) * 100)}%`,
                          background: T.accent,
                        }} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <SourceLine>Detected from your logs — log flow during your period to refine this.</SourceLine>
          </>
        )}
      </div>
    </Screen>
  )
}

function SummaryRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ fontFamily: T.sans, fontSize: 12, color: T.muted, letterSpacing: 0.3 }}>{label}</span>
      <span style={{ fontFamily: T.mono, fontSize: 12, color: T.text, letterSpacing: 0.5 }}>{value}</span>
    </div>
  )
}
