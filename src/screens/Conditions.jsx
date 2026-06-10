import { useMemo } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, Rule, Screen, BrickList } from '../components/shared'
import { CONDITIONS, getCondition, matchConditions } from '../data/conditions'
import { useCycle } from '../hooks/useCycle'
import { SourceTag, LiteracyCard } from '../components/Sourced'
import { sectionColors, sectionPaper } from '../data/sectionPalette'
import useLuna from '../store/useLuna'

// Single screen, two modes:
// - When `activeConditionId` is set in the store, show the full
//   explainer for that condition (what it is, signs, tests, treatments,
//   sources, related article).
// - Otherwise, show the atlas — every condition, with the matches
//   surfaced at the top in a "your patterns suggest" section.

function ConditionDetail({ condition, onBack, onOpenArticle }) {
  const c = condition
  const accent = sectionColors('urgent').accent
  return (
    <Screen padBottom={40}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue={c.name.toLowerCase()} onBack={onBack} />
      </div>

      {/* Hero — centered editorial composition */}
      <div style={{ position: 'relative', padding: '8px 22px 28px', textAlign: 'center', background: `linear-gradient(180deg, ${accent}10, transparent 80%)` }}>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, letterSpacing: 0.4, color: accent, fontWeight: 500, marginBottom: 10, opacity: 0.9 }}>
          conditions atlas
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 46, fontWeight: 400, lineHeight: 1, letterSpacing: -1.5, fontStyle: 'italic', color: accent, marginBottom: 14 }}>
          {c.name}.
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 13.5, color: T.muted, fontStyle: 'italic', maxWidth: 320, margin: '0 auto', lineHeight: 1.55 }}>
          {c.prevalence}
        </div>
      </div>

      <div style={{ padding: '0 22px', marginBottom: 22 }}>
        <div style={{ fontFamily: T.serif, fontSize: 16.5, lineHeight: 1.55, color: T.text }}>
          {c.summary}
        </div>
      </div>

      <div style={{ padding: '0 22px', marginBottom: 28 }}>
        <Eyebrow color={accent}>What it is</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {c.whatItIs.map((para, i) => (
            <div key={i} style={{ fontFamily: T.serif, fontSize: 14.5, lineHeight: 1.6, color: T.text }}>
              {para}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 22px', marginBottom: 28 }}>
        <Eyebrow color={accent}>Common signs</Eyebrow>
        <BrickList title="Notice if" items={c.commonSigns} />
      </div>

      <div style={{ padding: '0 22px', marginBottom: 28 }}>
        <Eyebrow color={accent}>Tests to ask about</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 14, color: T.muted, fontStyle: 'italic', marginBottom: 12, lineHeight: 1.55 }}>
          Bring these by name. Many providers won't order them unless you ask specifically.
        </div>
        <BrickList title="Ask for" items={c.testsToAsk} positive />
      </div>

      <div style={{ padding: '0 22px', marginBottom: 28 }}>
        <Eyebrow color={accent}>Treatments that work</Eyebrow>
        <BrickList title="Evidence-supported" items={c.treatments} positive />
      </div>

      {c.redFlags && (
        <div style={{ padding: '0 22px', marginBottom: 22 }}>
          <LiteracyCard
            eyebrow="Worth knowing"
            title="What makes this urgent"
            body={c.redFlags}
            color={accent}
          />
        </div>
      )}

      <div style={{ padding: '0 22px', marginBottom: 28 }}>
        <Eyebrow color={accent}>Sources</Eyebrow>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {c.sources.map((s, i) => (
            <SourceTag key={i} color={accent}>{s}</SourceTag>
          ))}
        </div>
      </div>

      {c.relatedArticleId && (
        <div style={{ padding: '0 22px 22px' }}>
          <button onClick={() => onOpenArticle(c.relatedArticleId)}
            className="alive-card frost-card"
            style={{
              width: '100%', padding: 16, background: 'rgba(253,250,245,0.55)',
              border: `1px solid ${accent}28`,
              borderRadius: 18, cursor: 'pointer', textAlign: 'left',
              color: T.text, fontFamily: 'inherit',
            }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 1.2, fontWeight: 600, color: accent, marginBottom: 6 }}>
              read deeper
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 15.5, fontWeight: 500, letterSpacing: -0.2 }}>
              The full article on {c.name} →
            </div>
          </button>
        </div>
      )}
    </Screen>
  )
}

function ConditionsAtlas({ matches, onOpen, onBack }) {
  const accent = sectionColors('urgent').accent
  const matchedIds = new Set(matches.map((m) => m.id))
  const unmatched = CONDITIONS.filter((c) => !matchedIds.has(c.id))

  return (
    <Screen padBottom={40}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="conditions atlas" onBack={onBack} />
      </div>

      <div style={{ padding: '8px 22px 16px', color: T.text }}>
        <div className="insight-stagger" style={{ animationDelay: '0ms' }}>
          <Eyebrow color={accent}>Body literacy, named</Eyebrow>
        </div>
        <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 36, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, animationDelay: '40ms' }}>
          The conditions Luna<br /><em>watches with you.</em>
        </div>
        <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 14.5, color: T.muted, marginTop: 10, fontStyle: 'italic', lineHeight: 1.6, animationDelay: '90ms' }}>
          Six conditions cover most of the gap between "something feels off" and a name. Each has signs to notice, tests to ask for by name, and treatments that work. None of this is a diagnosis — it is the language to bring to a clinician.
        </div>
        <Rule />
      </div>

      {matches.length > 0 && (
        <div style={{ padding: '0 22px', marginBottom: 26 }}>
          <Eyebrow color={accent}>What your logs suggest looking at</Eyebrow>
          <div style={{ fontFamily: T.serif, fontSize: 13.5, color: T.muted, fontStyle: 'italic', marginBottom: 14, lineHeight: 1.55 }}>
            Patterns Luna noticed across your cycles. These are starting points for a conversation, not conclusions.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {matches.map((m) => (
              <button key={m.id} onClick={() => onOpen(m.id)}
                className="alive-card"
                style={{
                  padding: 18, background: sectionPaper('urgent'),
                  border: `1px solid ${accent}28`,
                  borderRadius: 20, boxShadow: `0 1px 0 ${accent}10, 0 14px 30px -22px ${accent}50`,
                  textAlign: 'left', cursor: 'pointer', width: '100%',
                  color: T.text, fontFamily: 'inherit', display: 'block',
                }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontFamily: T.serif, fontSize: 19, fontWeight: 500, letterSpacing: -0.3 }}>
                    {m.condition.name}
                  </div>
                  <div style={{ fontFamily: T.mono, fontSize: 11, color: accent, letterSpacing: 0.8, fontWeight: 600 }}>
                    open →
                  </div>
                </div>
                <div style={{ fontFamily: T.serif, fontSize: 13.5, color: T.muted, fontStyle: 'italic', lineHeight: 1.55, marginBottom: 10 }}>
                  {m.condition.summary}
                </div>
                <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 1, color: T.muted, fontWeight: 600, marginBottom: 6 }}>
                  WHAT LUNA NOTICED
                </div>
                <ul style={{ margin: 0, paddingLeft: 16, fontFamily: T.serif, fontSize: 13, color: T.text, lineHeight: 1.5 }}>
                  {m.signals.map((s, si) => (
                    <li key={si} style={{ marginBottom: 2 }}>{s}</li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: '0 22px 22px' }}>
        <Eyebrow color={T.muted}>{matches.length > 0 ? 'The full atlas' : 'Every condition Luna covers'}</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {unmatched.map((c) => (
            <button key={c.id} onClick={() => onOpen(c.id)}
              className="alive-card"
              style={{
                padding: 16, background: 'rgba(253,250,245,0.55)',
                border: `1px solid rgba(26,19,16,0.08)`,
                borderRadius: 18, textAlign: 'left', cursor: 'pointer', width: '100%',
                color: T.text, fontFamily: 'inherit', display: 'block',
              }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ fontFamily: T.serif, fontSize: 16.5, fontWeight: 500, letterSpacing: -0.2 }}>
                  {c.name}
                </div>
                <div style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, letterSpacing: 0.5 }}>
                  {c.fullName !== c.name ? c.fullName : ''}
                </div>
              </div>
              <div style={{ fontFamily: T.serif, fontSize: 13, color: T.muted, fontStyle: 'italic', lineHeight: 1.55 }}>
                {c.summary}
              </div>
            </button>
          ))}
        </div>
      </div>
    </Screen>
  )
}

export default function Conditions() {
  const store = useLuna()
  const cycle = useCycle(store)
  const { back, logs, activeConditionId, goArticle } = store
  const setConditionId = (id) => useLuna.setState({ activeConditionId: id })

  const matches = useMemo(() => matchConditions(logs, cycle), [logs, cycle.cycleLength, cycle.cyclesLogged, cycle.cycleDay])

  if (activeConditionId) {
    const condition = getCondition(activeConditionId)
    if (condition) {
      return (
        <ConditionDetail
          condition={condition}
          onBack={() => setConditionId(null)}
          onOpenArticle={(id) => { setConditionId(null); goArticle(id) }}
        />
      )
    }
  }

  return (
    <ConditionsAtlas
      matches={matches}
      onOpen={setConditionId}
      onBack={back}
    />
  )
}
