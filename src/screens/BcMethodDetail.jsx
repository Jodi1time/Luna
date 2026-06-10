import { useState } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, Screen } from '../components/shared'
import { sectionColors } from '../data/sectionPalette'
import useLuna from '../store/useLuna'
import { BC_METHODS } from '../data/birthControl'
import { getBcKnowledge, effectivenessLine } from '../data/bcKnowledge'

// BcMethodDetail — read-only reference for the user's BC method.
//
// HAVEN-NOT-CLASSROOM: the most-asked question (bleeding pattern) is
// the only section visible by default. Everything else lives behind
// a quiet "more about this method" tap so a user just wanting to know
// "is what I'm feeling normal?" gets one screen, not eight sections.

function BleedingSection({ entries, accent }) {
  if (!entries || entries.length === 0) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
      {entries.map((e, i) => (
        <div key={i} style={{ padding: '14px 16px', background: 'rgba(253,250,245,0.55)', border: `1px solid ${accent}22`, borderRadius: 16 }}>
          <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 1.2, fontWeight: 600, color: accent, marginBottom: 6 }}>
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

// A foldable "more" section. Stays collapsed by default; tap to reveal.
// Used for everything that isn't the immediate answer she came for.
function FoldSection({ label, children, accent }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderTop: '1px solid rgba(26,19,16,0.06)' }}>
      <button onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          padding: '16px 0',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontFamily: T.serif,
          fontStyle: 'italic',
          fontSize: 14.5,
          color: open ? accent : T.text,
          letterSpacing: -0.1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          textAlign: 'left',
        }}>
        <span>{label}</span>
        <span style={{ fontFamily: T.serif, fontSize: 16, color: T.muted, transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.25s var(--ease-out)' }}>›</span>
      </button>
      {open && (
        <div style={{ paddingBottom: 14, animation: 'fadeUp 0.32s ease-out both' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function Bullets({ items, accent, cue }) {
  if (!items || items.length === 0) return null
  const color = cue === 'red' ? '#C84E2E' : cue === 'less' ? T.muted : accent
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ width: 4, height: 4, borderRadius: 999, background: color, marginTop: 8, flexShrink: 0, opacity: 0.85 }} />
          <div style={{ fontFamily: T.serif, fontSize: 14, color: T.text, lineHeight: 1.55, flex: 1 }}>{it}</div>
        </div>
      ))}
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

        {/* Hero — name + plain-English what-it-is. No eyebrow chip; the
            method name does the work. */}
        <div className="insight-stagger" style={{ animationDelay: '0ms' }}>
          <div style={{ fontFamily: T.serif, fontSize: 32, fontWeight: 500, letterSpacing: -0.7, lineHeight: 1.1, marginBottom: 10 }}>
            {meta?.name || 'Your method'}.
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 14.5, color: T.muted, lineHeight: 1.6, marginBottom: 22, fontStyle: 'italic' }}>
            {k.summary}
            {eff ? ` · ${eff.toLowerCase()}` : ''}
          </div>
        </div>

        {/* The one answer most users came for — bleeding pattern */}
        {k.bleedingPattern && k.bleedingPattern.length > 0 && (
          <div className="insight-stagger" style={{ marginBottom: 22, animationDelay: '60ms' }}>
            <Eyebrow color={accent}>What to expect</Eyebrow>
            <BleedingSection entries={k.bleedingPattern} accent={accent} />
          </div>
        )}

        {/* Everything else is folded by default — taps to reveal */}
        <div className="insight-stagger" style={{ marginTop: 8, animationDelay: '120ms' }}>
          {k.mechanism && (
            <FoldSection label="How it works" accent={accent}>
              <div style={{ fontFamily: T.serif, fontSize: 14, color: T.text, lineHeight: 1.6 }}>
                {k.mechanism}
              </div>
            </FoldSection>
          )}

          {(k.sideEffects?.common?.length > 0 || k.sideEffects?.less?.length > 0) && (
            <FoldSection label="Common things to expect" accent={accent}>
              <Bullets items={[...(k.sideEffects.common || []), ...(k.sideEffects.less || [])]} accent={accent} />
            </FoldSection>
          )}

          {k.sideEffects?.red?.length > 0 && (
            <FoldSection label="When to call your doctor" accent={accent}>
              <Bullets items={k.sideEffects.red} accent={accent} cue="red" />
            </FoldSection>
          )}

          {k.fertilityReturn && (
            <FoldSection label="When fertility comes back" accent={accent}>
              <div style={{ fontFamily: T.serif, fontSize: 14, color: T.text, lineHeight: 1.6, fontStyle: 'italic' }}>
                {k.fertilityReturn}
              </div>
            </FoldSection>
          )}

          {k.doesnt?.length > 0 && (
            <FoldSection label="What it doesn’t do" accent={accent}>
              <Bullets items={k.doesnt} accent={accent} cue="less" />
            </FoldSection>
          )}

          {k.switching?.length > 0 && (
            <FoldSection label="Switching methods" accent={accent}>
              <Bullets items={k.switching} accent={accent} />
            </FoldSection>
          )}
        </div>

        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12, color: T.muted, lineHeight: 1.55, padding: '20px 0 8px', textAlign: 'center' }}>
          Sourced from ACOG, WHO, CDC, and Cochrane. Talk to your doctor about what’s right for you.
        </div>
      </div>
    </Screen>
  )
}
