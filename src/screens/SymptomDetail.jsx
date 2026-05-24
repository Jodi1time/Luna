import { T } from '../data/theme'
import { Masthead, Eyebrow, Rule, SourceLine, BrickList, Screen } from '../components/shared'
import { SYMPTOMS } from '../data/lunaData'
import useLuna from '../store/useLuna'

export default function SymptomDetail() {
  const { back, activeSymptomId } = useLuna()
  const s = SYMPTOMS[activeSymptomId]
  if (!s) return null
  return (
    <Screen padBottom={30}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="Symptom" onBack={back} />
      </div>
      <div style={{ padding: '0 22px', color: T.text }}>
        <Eyebrow>SYMPTOM · EVIDENCE BRIEF</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 36, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05 }}>
          <span style={{ fontSize: 44, marginRight: 10 }}>{s.emoji}</span>
          <em>{s.label}</em>
        </div>
        <Rule />
        <Eyebrow>WHY IT HAPPENS</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 17, lineHeight: 1.55 }}>{s.why}</div>
        <Rule />
        <BrickList title="What the evidence says" items={s.evidence} positive />
        {s.redFlag && <>
          <Rule />
          <div style={{ padding: 16, border: `1px solid ${T.accent}`, background: '#fff', borderRadius: T.r }}>
            <div style={{ fontSize: 10, letterSpacing: 2, fontWeight: 700, color: T.accent, fontFamily: T.sans, marginBottom: 8 }}>⚠ WHEN TO ESCALATE</div>
            <div style={{ fontFamily: T.serif, fontSize: 15, lineHeight: 1.5 }}>{s.redFlag}</div>
          </div>
        </>}
        <SourceLine>{s.source}</SourceLine>
      </div>
    </Screen>
  )
}
