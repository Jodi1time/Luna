import { T } from '../data/theme'
import { Masthead, Eyebrow, Screen } from '../components/shared'
import { PhaseFlourish } from '../components/phaseFlourishes'
import { CYCLE_SCHOOLS } from '../data/cycleSchools'
import { sectionColors, sectionPaper } from '../data/sectionPalette'
import { useCycle } from '../hooks/useCycle'
import useLuna from '../store/useLuna'

// Progress chip — small "3 / 5" mono label with a filled-dots bar
// underneath. Rendered when the user has at least started a program.
function ProgressChip({ done, total, accent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12, color: accent, fontWeight: 500 }}>
        day {done} of {total}
      </span>
      <div style={{ display: 'flex', gap: 3 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: 999,
            background: i < done ? accent : 'rgba(26,19,16,0.12)',
            transition: 'background .25s ease-out',
          }} />
        ))}
      </div>
    </div>
  )
}

export default function CycleSchools() {
  const store = useLuna()
  const { back, goSchool, settings } = store
  const cycle = useCycle(store)
  const phase = cycle?.phase
  const schoolsState = settings?.schools || {}

  return (
    <Screen padBottom={120}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="cycle schools" onBack={back} />

        {/* Hero — italic editorial title, soft mauve-tinted subtitle */}
        <div className="insight-stagger" style={{ marginTop: 4, animationDelay: '0ms' }}>
          <Eyebrow color={sectionColors('reflect').accent}>Literacy, not tracking</Eyebrow>
          <div style={{ fontFamily: T.serif, fontSize: 36, fontWeight: 400, fontStyle: 'italic', letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 12, color: T.text }}>
            Five-day walks through your body.
          </div>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 15, color: T.muted, lineHeight: 1.6, marginBottom: 22 }}>
            One short reading + one small practice each day. No streaks, no scores — just literacy that lands somewhere physical.
          </div>
        </div>

        {/* School cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 14 }}>
          {CYCLE_SCHOOLS.map((school, idx) => {
            const colors = sectionColors(school.category)
            const state = schoolsState[school.id] || {}
            const done = (state.completedDays || []).length
            const started = done > 0 || state.startedAt
            const matchesPhase = phase?.id === school.phase
            return (
              <button key={school.id} onClick={() => goSchool(school.id)}
                className="insight-stagger alive-card frost-card"
                style={{
                  textAlign: 'left',
                  padding: 22,
                  background: sectionPaper(school.category),
                  border: `1px solid ${colors.accent}28`,
                  borderRadius: 24,
                  cursor: 'pointer',
                  color: T.text,
                  fontFamily: 'inherit',
                  boxShadow: `0 14px 30px -22px ${colors.accent}50`,
                  animationDelay: `${80 + idx * 80}ms`,
                  position: 'relative',
                }}>
                {/* Phase flourish in the corner */}
                <div aria-hidden="true" style={{ position: 'absolute', top: 18, right: 18, color: colors.accent, opacity: 0.65 }}>
                  <PhaseFlourish phaseId={school.phase} size={22} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: 999, background: colors.accent, boxShadow: `0 0 0 3px ${colors.accent}22` }} />
                  <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, color: colors.accent, fontWeight: 500, letterSpacing: -0.1 }}>
                    {school.phase} phase · {school.duration} days
                  </div>
                  {matchesPhase && (
                    <span style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 11, color: colors.accent, opacity: 0.85, marginLeft: 'auto', paddingRight: 32 }}>
                      where you are now
                    </span>
                  )}
                </div>

                <div style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 500, lineHeight: 1.25, letterSpacing: -0.3, marginBottom: 8 }}>
                  {school.title}
                </div>
                <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 14, color: T.muted, lineHeight: 1.5, marginBottom: 16 }}>
                  {school.subtitle}
                </div>

                {/* Footer — progress OR "begin" */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: `1px solid ${colors.accent}22` }}>
                  {started ? (
                    <ProgressChip done={done} total={school.duration} accent={colors.accent} />
                  ) : (
                    <span style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: colors.accent, fontWeight: 500 }}>
                      Begin →
                    </span>
                  )}
                  {started && (
                    <span style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: colors.accent, fontWeight: 500 }}>
                      Continue →
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Editorial footer note */}
        <div style={{ marginTop: 22, fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, color: T.muted, lineHeight: 1.65, textAlign: 'center', maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
          Each program stays open. Come back when the phase comes back. Skip a day, repeat a day — there's no streak to break.
        </div>
        <div style={{ height: 20 }} />
      </div>
    </Screen>
  )
}
