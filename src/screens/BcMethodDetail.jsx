import { T } from '../data/theme'
import { Masthead, Eyebrow, Screen, Rule } from '../components/shared'
import { sectionColors, sectionPaper } from '../data/sectionPalette'
import useLuna from '../store/useLuna'
import { BC_METHODS } from '../data/birthControl'
import { getBcKnowledge, effectivenessLine } from '../data/bcKnowledge'

// BcMethodDetail — read-only reference for the user's BC method.
// Lives at /bcMethod. Entered from the BirthControl screen ("Learn
// about [method]") or from a soft affordance on Home.
//
// The goal: she opens this once and gets the answer to "is what I'm
// feeling normal?" — bleeding patterns by month, common side effects,
// when to call her doctor, effectiveness rates, how long fertility
// takes to return. All sourced.

function BleedingSection({ entries, accent }) {
  if (!entries || entries.length === 0) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
      {entries.map((e, i) => (
        <div key={i} style={{ padding: '14px 16px', background: 'rgba(253,250,245,0.55)', border: `1px solid ${accent}22`, borderRadius: 16 }}>
          <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.2, fontWeight: 600, color: accent, marginBottom: 6 }}>
            {e.when.toUpperCase()}
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 14.5, color: T.text, lineHeight: 1.55 }}>
            {e.detail}
          </div>
        </div>
      ))}
    </div>
  )
}

function BulletGroup({ title, items, accent, cue = 'neutral' }) {
  if (!items || items.length === 0) return null
  const cueColor = cue === 'red' ? '#C84E2E' : cue === 'less' ? T.muted : accent
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.2, fontWeight: 600, color: cueColor, marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 5, height: 5, borderRadius: 999, background: cueColor, marginTop: 8, flexShrink: 0, opacity: 0.85 }} />
            <div style={{ fontFamily: T.serif, fontSize: 14, color: T.text, lineHeight: 1.55, flex: 1 }}>{it}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function BcMethodDetail() {
  const { back, birthControl } = useLuna()
  const method = birthControl?.method || 'none'
  const meta = BC_METHODS.find((m) => m.id === method)
  const k = getBcKnowledge(method)
  const accent = sectionColors('care').accent
  const eff = effectivenessLine(method)

  if (!k) {
    return (
      <Screen padBottom={40}>
        <div style={{ padding: '12px 22px 0', color: T.text }}>
          <Masthead issue="your method" onBack={back} />
          <div style={{ fontFamily: T.serif, fontSize: 16, color: T.muted, lineHeight: 1.6, fontStyle: 'italic' }}>
            Nothing on file for this method yet.
          </div>
        </div>
      </Screen>
    )
  }

  return (
    <Screen padBottom={40}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="your method" onBack={back} />
        <Eyebrow color={accent}>plain English, sourced</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 32, fontWeight: 500, letterSpacing: -0.7, lineHeight: 1.1, marginBottom: 10 }}>
          {meta?.name || 'Your method'}.
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 14.5, color: T.muted, lineHeight: 1.6, marginBottom: 22, fontStyle: 'italic' }}>
          {k.summary}
        </div>

        {/* Effectiveness — small but reassuring */}
        {eff && (
          <div className="frost-card insight-stagger" style={{
            padding: '12px 16px',
            background: `linear-gradient(160deg, ${accent}0e, rgba(253,250,245,0.55))`,
            border: `1px solid ${accent}28`,
            borderRadius: 14,
            marginBottom: 22,
            animationDelay: '40ms',
          }}>
            <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.2, fontWeight: 600, color: accent, marginBottom: 4 }}>
              EFFECTIVENESS
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 14.5, color: T.text, fontStyle: 'italic' }}>
              {eff}
            </div>
          </div>
        )}

        {/* Mechanism — how it works */}
        <div className="insight-stagger" style={{ marginBottom: 22, animationDelay: '80ms' }}>
          <Eyebrow color={accent}>How it works</Eyebrow>
          <div style={{ fontFamily: T.serif, fontSize: 14.5, color: T.text, lineHeight: 1.6, marginTop: 4 }}>
            {k.mechanism}
          </div>
        </div>

        {/* Bleeding pattern — the most-asked question */}
        {k.bleedingPattern && k.bleedingPattern.length > 0 && (
          <div className="insight-stagger" style={{ marginBottom: 22, animationDelay: '140ms' }}>
            <Eyebrow color={accent}>Bleeding pattern, by phase</Eyebrow>
            <BleedingSection entries={k.bleedingPattern} accent={accent} />
          </div>
        )}

        {/* Side effects — common / less common / red flags */}
        {(k.sideEffects?.common?.length || k.sideEffects?.less?.length || k.sideEffects?.red?.length) > 0 && (
          <div className="insight-stagger" style={{ marginBottom: 22, animationDelay: '200ms' }}>
            <Eyebrow color={accent}>What to watch</Eyebrow>
            <div style={{ marginTop: 6 }}>
              <BulletGroup title="COMMON" items={k.sideEffects.common} accent={accent} />
              <BulletGroup title="LESS COMMON" items={k.sideEffects.less} accent={accent} cue="less" />
              <BulletGroup title="CALL YOUR DOCTOR" items={k.sideEffects.red} accent={accent} cue="red" />
            </div>
          </div>
        )}

        {/* Fertility return — load-bearing for TTC planning */}
        {k.fertilityReturn && (
          <div className="insight-stagger" style={{ marginBottom: 22, animationDelay: '260ms' }}>
            <Eyebrow color={accent}>When fertility comes back</Eyebrow>
            <div style={{ fontFamily: T.serif, fontSize: 14.5, color: T.text, lineHeight: 1.6, fontStyle: 'italic', marginTop: 4 }}>
              {k.fertilityReturn}
            </div>
          </div>
        )}

        {/* What this method doesn't do — honest limits */}
        {k.doesnt && k.doesnt.length > 0 && (
          <div className="insight-stagger" style={{ marginBottom: 22, animationDelay: '320ms' }}>
            <Eyebrow color={accent}>What it doesn’t do</Eyebrow>
            <div style={{ marginTop: 4 }}>
              <BulletGroup title="" items={k.doesnt} accent={accent} cue="less" />
            </div>
          </div>
        )}

        {/* Switching guidance */}
        {k.switching && k.switching.length > 0 && (
          <div className="insight-stagger" style={{ marginBottom: 22, animationDelay: '380ms' }}>
            <Eyebrow color={accent}>Switching methods</Eyebrow>
            <div style={{ marginTop: 4 }}>
              <BulletGroup title="" items={k.switching} accent={accent} />
            </div>
          </div>
        )}

        {/* Sources */}
        {k.sources && k.sources.length > 0 && (
          <>
            <Rule />
            <div style={{ marginTop: 12, marginBottom: 8 }}>
              <Eyebrow color={accent}>Sources</Eyebrow>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {k.sources.map((s, i) => (
                  <span key={i} style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    background: `${accent}10`,
                    border: `1px solid ${accent}30`,
                    borderRadius: 999,
                    fontFamily: T.mono,
                    fontSize: 10,
                    letterSpacing: 0.3,
                    color: T.text,
                  }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, color: T.muted, lineHeight: 1.55, padding: '14px 0 8px', textAlign: 'center' }}>
          Information here is sourced and current. It isn’t medical advice — talk to your provider about what’s right for you.
        </div>
      </div>
    </Screen>
  )
}
