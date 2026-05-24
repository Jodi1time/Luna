import { T } from '../data/theme'
import { Masthead, Eyebrow, Rule, SourceLine, Screen } from '../components/shared'
import { PHASES } from '../data/lunaData'
import { useCycle } from '../hooks/useCycle'
import useLuna from '../store/useLuna'

export default function Insights() {
  const store = useLuna()
  const { phase } = useCycle(store)
  const logs = useLuna((s) => s.logs)
  const logCount = Object.keys(logs).length

  const patterns = [
    { tag: 'MOOD', col: PHASES.ovulation.color, title: 'Energy peaks in your ovulatory window', body: 'Your highest-energy log entries cluster in the ovulation phase. Consistent with the testosterone + estrogen peak.', source: 'Pattern detected in your logs' },
    { tag: 'NUTRITION', col: PHASES.luteal.color, title: 'Luteal cravings are biological', body: 'Serotonin drops in late luteal phase — your brain is seeking carbs to boost synthesis. You are not failing willpower.', source: 'Oxford Nutrition Reviews 2023' },
    { tag: 'MOVEMENT', col: PHASES.follicular.color, title: 'Follicular phase: best training window', body: 'Insulin sensitivity is highest in follicular phase. Carbs around workouts feel better, recovery is faster.', source: 'Sims et al., 2020' },
  ]

  return (
    <Screen>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue={`The Editorial · Week ${new Date().getWeek?.() || 1}`} />

        <Eyebrow>LEAD INSIGHT</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 500, letterSpacing: -0.6, lineHeight: 1.1, marginBottom: 14 }}>
          {phase
            ? <>You are in <em style={{ color: T.accent }}>{phase.name} phase.</em> Here's what that means.</>
            : <>Start logging to unlock <em style={{ color: T.accent }}>personalised insights.</em></>}
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 15.5, lineHeight: 1.6, marginBottom: 12 }}>
          {phase ? phase.whatsHappening : 'Your insights will be generated from your logs and cycle data. The more you log, the more precise they become.'}
        </div>
        {phase && (
          <div style={{ fontFamily: T.serif, fontSize: 15, lineHeight: 1.55, color: T.muted, fontStyle: 'italic' }}>
            {phase.bodyMood}
          </div>
        )}
        <SourceLine>{phase ? phase.sourceBody : 'Log at least 7 days to see pattern analysis'}</SourceLine>

        <Rule />

        <Eyebrow>PATTERNS WE'RE WATCHING</Eyebrow>
        {logCount < 3 ? (
          <div style={{ fontFamily: T.serif, fontSize: 15, color: T.muted, fontStyle: 'italic', marginTop: 8 }}>
            Log at least 3 days to start seeing patterns. You have {logCount} log{logCount !== 1 ? 's' : ''} so far.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 4 }}>
            {patterns.map((p, i) => (
              <div key={i} style={{ padding: 14, background: T.card, border: `1px solid ${T.hair}`, borderLeft: `3px solid ${p.col}`, borderRadius: T.r }}>
                <div style={{ fontSize: 9.5, letterSpacing: 1.5, fontWeight: 700, color: p.col, fontFamily: T.sans, marginBottom: 6 }}>{p.tag}</div>
                <div style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 500, marginBottom: 4, lineHeight: 1.2 }}>{p.title}</div>
                <div style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.45, fontFamily: T.sans }}>{p.body}</div>
                <div style={{ marginTop: 8, fontSize: 9.5, fontFamily: T.mono, color: T.muted, letterSpacing: 0.5 }}>{p.source}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{ height: 16 }} />
      </div>
    </Screen>
  )
}
