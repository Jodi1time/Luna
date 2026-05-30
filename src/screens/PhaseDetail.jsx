import { T } from '../data/theme'
import { Masthead, Eyebrow, Rule, SourceLine, BrickList, Screen } from '../components/shared'
import { PHASES } from '../data/lunaData'
import useLuna from '../store/useLuna'

export default function PhaseDetail() {
  const { back, activePhaseId } = useLuna()
  const p = PHASES[activePhaseId] || PHASES.ovulation
  return (
    <Screen padBottom={30}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue={p.name.toLowerCase()} onBack={back} />
      </div>
      <div style={{ padding: '0 22px' }}>
        <Eyebrow color={p.color}>days {p.days} · your {p.name.toLowerCase()} phase</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 44, fontWeight: 400, lineHeight: 1, letterSpacing: -1.2, fontStyle: 'italic', color: p.color, marginTop: 4 }}>
          {p.name}.
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 17, lineHeight: 1.55, marginTop: 14, color: T.text }}>
          {p.whatsHappening}
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 15, lineHeight: 1.55, color: T.muted, marginTop: 10, fontStyle: 'italic' }}>
          {p.bodyMood}
        </div>
        <div className="glass-card" style={{ marginTop: 14, padding: 12, borderRadius: T.r }}>
          <div style={{ fontSize: 10, letterSpacing: 1.2, fontWeight: 600, fontFamily: T.sans, color: T.muted, marginBottom: 4 }}>What your hormones are doing</div>
          <div style={{ fontFamily: T.serif, fontSize: 14, lineHeight: 1.5 }}>{p.hormones}</div>
        </div>
        <SourceLine>{p.sourceBody}</SourceLine>
      </div>

      <Rule />

      <div style={{ padding: '0 22px' }}>
        <Eyebrow>To nourish</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 500, lineHeight: 1.15, letterSpacing: -0.4, marginBottom: 14 }}>{p.nutrition.headline}</div>
        <BrickList title="Lean in" items={p.nutrition.do} positive />
        {p.nutrition.avoid?.length > 0 && <BrickList title="Ease off" items={p.nutrition.avoid} />}
        {p.nutrition.note && (
          <div style={{ marginTop: 12, padding: 12, borderLeft: `2px solid ${T.accent}`, background: T.faint, fontFamily: T.serif, fontSize: 14, fontStyle: 'italic', lineHeight: 1.5 }}>
            {p.nutrition.note}
          </div>
        )}
        <SourceLine>{p.nutrition.source}</SourceLine>
      </div>

      <Rule />

      <div style={{ padding: '0 22px' }}>
        <Eyebrow>To move</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 500, lineHeight: 1.15, letterSpacing: -0.4, marginBottom: 14 }}>{p.exercise.headline}</div>
        <BrickList title="Best fit now" items={p.exercise.do} positive />
        {p.exercise.avoid?.length > 0 && <BrickList title="Ease off" items={p.exercise.avoid} />}
        {p.exercise.note && (
          <div style={{ marginTop: 12, padding: 12, borderLeft: `2px solid ${T.accent}`, background: T.faint, fontFamily: T.serif, fontSize: 14, fontStyle: 'italic', lineHeight: 1.5 }}>
            {p.exercise.note}
          </div>
        )}
        <SourceLine>{p.exercise.source}</SourceLine>
      </div>

      <Rule />

      <div style={{ padding: '0 22px' }}>
        <div className="glass-card" style={{ padding: 16, borderLeft: `3px solid ${T.accent}`, borderRadius: T.r }}>
          <div style={{ fontSize: 10, letterSpacing: 1.2, fontWeight: 600, color: T.accent, fontFamily: T.sans, marginBottom: 8 }}>Worth talking to a doctor about</div>
          <div style={{ fontFamily: T.serif, fontSize: 15, lineHeight: 1.55 }}>{p.redFlag}</div>
        </div>
        <div style={{ height: 16 }} />
      </div>
    </Screen>
  )
}
