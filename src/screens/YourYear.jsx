import { useMemo, useState } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, Rule, Screen, SourceLine } from '../components/shared'
import { useCycle, detectSymptomPatterns } from '../hooks/useCycle'
import { PhaseFlourish } from '../components/phaseFlourishes'
import useLuna from '../store/useLuna'
import { buildYearNarrative, yearNarrativeText } from '../lib/yourYear'

// Renders a paragraph with simple *italic* segments. Keeps the
// long-form essay readable without bringing in a markdown lib.
function ParaWithItalics({ text, accent }) {
  const parts = String(text).split(/(\*[^*]+\*)/g)
  return (
    <p style={{ fontFamily: T.serif, fontSize: 16, lineHeight: 1.7, color: T.text, margin: '0 0 14px 0', letterSpacing: -0.1 }}>
      {parts.map((p, i) => {
        if (p.startsWith('*') && p.endsWith('*')) {
          return <em key={i} style={{ color: accent, fontStyle: 'italic', fontWeight: 500 }}>{p.slice(1, -1)}</em>
        }
        return <span key={i}>{p}</span>
      })}
    </p>
  )
}

export default function YourYear() {
  const store = useLuna()
  const { back, logs, displayName } = store
  const cycle = useCycle(store)
  const phase = cycle?.phase
  const acc = phase?.color || T.accent
  const patterns = useMemo(
    () => detectSymptomPatterns(logs, cycle.periodHistory, cycle.cycleLength, cycle.periodLength),
    [logs, cycle.periodHistory, cycle.cycleLength, cycle.periodLength]
  )
  const narrative = useMemo(
    () => buildYearNarrative({ logs, cycle, patterns, displayName }),
    [logs, cycle, patterns, displayName]
  )
  const [copied, setCopied] = useState(false)

  const copyAll = async () => {
    const text = yearNarrativeText(narrative, { displayName })
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true); setTimeout(() => setCopied(false), 1800)
    } catch {
      const w = window.open('', '_blank')
      if (w) {
        w.document.write(`<pre style="font-family:Georgia,serif;padding:24px;white-space:pre-wrap;">${text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</pre>`)
        w.document.close()
      }
    }
  }

  if (!narrative.ready) {
    return (
      <Screen padBottom={40}>
        <div style={{ padding: '12px 22px 0', color: T.text }}>
          <Masthead issue="Your year with Luna" onBack={back} />
          <div style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 500, letterSpacing: -0.7, lineHeight: 1.08, marginBottom: 14 }}>
            A page that's waiting on you.
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 16, lineHeight: 1.65, color: T.muted, fontStyle: 'italic' }}>
            {narrative.reason}
          </div>
        </div>
      </Screen>
    )
  }

  return (
    <Screen padBottom={40}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="Your year with Luna" onBack={back} />
        <div className="insight-stagger" style={{ animationDelay: '0ms' }}>
          <Eyebrow color={acc}>A long look back — written for you</Eyebrow>
        </div>
        <div className="insight-stagger" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, animationDelay: '40ms' }}>
          <div style={{ fontFamily: T.serif, fontSize: 32, fontWeight: 500, letterSpacing: -0.7, lineHeight: 1.05, flex: 1 }}>
            {narrative.title}.
          </div>
          {phase && (
            <div aria-hidden="true" style={{ color: acc, opacity: 0.55, paddingTop: 2 }}>
              <PhaseFlourish phaseId={phase.id} size={22} />
            </div>
          )}
        </div>
        <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 16, lineHeight: 1.55, color: T.muted, marginTop: 12, fontStyle: 'italic', animationDelay: '90ms' }}>
          {narrative.subtitle}
        </div>
        {narrative.spanLabel && (
          <div style={{ fontFamily: T.mono, fontSize: 10.5, letterSpacing: 0.8, color: T.muted, marginTop: 8 }}>
            {narrative.spanLabel}
          </div>
        )}
        <Rule />

        <div>
          {narrative.sections.map((s, i) => (
            <section key={i} className="insight-stagger" style={{ marginBottom: 22, animationDelay: `${160 + i * 80}ms` }}>
              <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4, fontWeight: 700, color: acc, marginBottom: 10 }}>
                {String(i + 1).padStart(2, '0')} · {s.heading.toUpperCase()}
              </div>
              {s.body.map((para, j) => (
                <ParaWithItalics key={j} text={para} accent={acc} />
              ))}
            </section>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <button onClick={copyAll}
            style={{ flex: 1, background: acc, color: '#fff', border: 'none', padding: '12px 14px', cursor: 'pointer', fontFamily: T.sans, fontSize: 12, fontWeight: 600, letterSpacing: 0.4, borderRadius: T.r }}>
            {copied ? 'Copied' : 'Copy as text'}
          </button>
        </div>

        <SourceLine>Written from your logs · a quiet reflection, not a diagnosis</SourceLine>
        <div style={{ height: 16 }} />
      </div>
    </Screen>
  )
}
