import { useMemo, useRef, useState } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, Rule, SourceLine, Screen, Icons } from '../components/shared'
import { RED_FLAGS, ARTICLES } from '../data/lunaData'
import { PhaseFlourish } from '../components/phaseFlourishes'
import { useCycle, getPeriodHistory } from '../hooks/useCycle'
import useLuna from '../store/useLuna'

// Defensive escape for anything interpolated into the PDF HTML template.
// No user-supplied content reaches here today, but if RED_FLAGS or any
// other source ever does, this prevents script injection in the print
// window that exportPDF opens.
function htmlEscape(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

const WATCH_SIGNALS = {
  headache: {
    label: 'Headache',
    matches: (log) => (log?.symptoms || []).includes('headache'),
    question: 'Could these headaches be menstrual migraines or tied to a hormone shift?',
  },
  heavyFlow: {
    label: 'Heavy flow',
    matches: (log) => log?.flow === 'Heavy',
    question: 'Could this bleeding pattern point to low iron, fibroids, or adenomyosis?',
  },
  cramps: {
    label: 'Cramps',
    matches: (log) => (log?.symptoms || []).includes('cramps'),
    question: 'Do these cramps warrant a conversation about endometriosis or pelvic pain?',
  },
  longPeriod: {
    label: 'Long periods',
    matchesPeriod: (period) => (period?.length || 0) > 7,
    question: 'Should we check why bleeding is lasting this long, and whether iron is being affected?',
  },
}

const monthLabel = (iso) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' }).toUpperCase()

function recentMonthLabels(count = 5) {
  const now = new Date()
  return Array.from({ length: count }, (_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - idx), 1)
    return d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  })
}

function buildWatchSnapshot(logs, periodStarts) {
  const starts = periodStarts ? [...periodStarts].sort() : []
  const historyByStart = new Map(getPeriodHistory(logs, periodStarts || []).map((p) => [p.start, p]))
  const windows = []

  if (starts.length >= 2) {
    for (let i = 0; i < starts.length - 1; i++) {
      const start = starts[i]
      const nextStart = starts[i + 1]
      const period = historyByStart.get(start) || null
      const cycleLogs = Object.entries(logs || {})
        .filter(([date]) => date >= start && date < nextStart)
        .map(([, log]) => log)

      const signals = {}
      for (const [id, meta] of Object.entries(WATCH_SIGNALS)) {
        const hitInLogs = meta.matches ? cycleLogs.some((log) => meta.matches(log)) : false
        const hitInPeriod = meta.matchesPeriod ? meta.matchesPeriod(period) : false
        signals[id] = hitInLogs || hitInPeriod
      }

      windows.push({
        start,
        label: monthLabel(start),
        signals,
        hasData: cycleLogs.length > 0 || Boolean(period),
      })
    }
  }

  let recentCycles = windows.slice(-5)
  if (recentCycles.length < 3) {
    recentCycles = recentMonthLabels(5).map((label, idx) => ({
      start: `placeholder-${idx}`,
      label,
      signals: Object.fromEntries(Object.keys(WATCH_SIGNALS).map((id) => [id, false])),
      hasData: false,
    }))
  }

  const signalStats = Object.entries(WATCH_SIGNALS)
    .map(([id, meta]) => ({
      id,
      label: meta.label,
      question: meta.question,
      occurrences: recentCycles.filter((cycle) => cycle.signals[id]).length,
    }))
    .sort((a, b) => b.occurrences - a.occurrences)

  const topSignals = signalStats.filter((item) => item.occurrences >= 2).slice(0, 2)
  const fallbackSignals = ['headache', 'heavyFlow'].map((id) => ({
    id,
    label: WATCH_SIGNALS[id].label,
    question: WATCH_SIGNALS[id].question,
    occurrences: recentCycles.filter((cycle) => cycle.signals[id]).length,
  }))
  const hasPattern = topSignals.length > 0
  const signals = hasPattern ? topSignals : fallbackSignals

  return {
    cycles: recentCycles,
    signals,
    hasPattern,
    hasAnyData: windows.some((cycle) => cycle.hasData),
  }
}

function PatternGraphCard({ snapshot, accent }) {
  const [primary, secondary] = snapshot.signals
  const lead = snapshot.hasPattern
    ? (secondary
        ? `${primary.label.toLowerCase()} + ${secondary.label.toLowerCase()} across recent cycles.`
        : `${primary.label.toLowerCase()} across recent cycles.`)
    : 'Luna is watching for patterns in your recent cycles.'

  return (
    <div className="alive-card"
      style={{
        minWidth: '100%',
        scrollSnapAlign: 'start',
        padding: 18,
        background: 'rgba(253,250,245,0.68)',
        border: `1px solid ${accent}18`,
        borderRadius: 22,
        boxShadow: `0 1px 0 ${accent}10, 0 16px 30px -24px ${accent}36`,
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 1.2, fontWeight: 600, color: accent, marginBottom: 8 }}>
            {snapshot.hasPattern ? 'Pattern detected' : 'Still learning'}
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 19, fontWeight: 500, lineHeight: 1.34, letterSpacing: -0.25, color: T.text, maxWidth: 240 }}>
            {snapshot.hasPattern ? `We noticed: ${lead}` : lead}
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 13.5, lineHeight: 1.55, color: T.muted, fontStyle: 'italic', marginTop: 8, maxWidth: 250 }}>
            {snapshot.hasPattern
              ? 'This may be worth a conversation with a clinician.'
              : snapshot.hasAnyData
                ? 'A little more logging will make the repeating signals easier to read here.'
                : 'As you log symptoms and periods, this card will start mapping what repeats.'}
          </div>
        </div>
        <div aria-hidden="true" style={{
          width: 54,
          height: 54,
          borderRadius: 18,
          background: `radial-gradient(circle at 35% 35%, ${accent}18, rgba(253,250,245,0.35))`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accent,
          flexShrink: 0,
        }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 19c3-4 6-6 9-6s6 2 9 6" />
            <path d="M7 10l3 3 4-5 3 3 4-5" />
          </svg>
        </div>
      </div>

      <div style={{ marginTop: 14, padding: '14px 14px 12px', background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(26,19,16,0.06)', borderRadius: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: `96px repeat(${snapshot.cycles.length}, minmax(0, 1fr))`, gap: 8, alignItems: 'center' }}>
          <div />
          {snapshot.cycles.map((cycle) => (
            <div key={cycle.start} style={{ textAlign: 'center', fontFamily: T.mono, fontSize: 10.5, color: T.muted, letterSpacing: 0.9, fontWeight: 600 }}>
              {cycle.label}
            </div>
          ))}

          {snapshot.signals.flatMap((signal) => {
            const cells = [
              <div key={`${signal.id}-label`} style={{ fontFamily: T.serif, fontSize: 13.5, color: T.text, lineHeight: 1.2 }}>
                {signal.label}
              </div>,
            ]
            snapshot.cycles.forEach((cycle) => {
              const on = cycle.signals[signal.id]
              cells.push(
                <div key={`${signal.id}-${cycle.start}`} style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{
                    width: on ? 22 : 5,
                    height: 6,
                    borderRadius: 999,
                    background: on ? accent : 'rgba(26,19,16,0.12)',
                    transition: 'width .22s ease, background .22s ease',
                  }} />
                </div>
              )
            })
            return cells
          })}
        </div>
        <div style={{ marginTop: 12, fontFamily: T.mono, fontSize: 10.5, color: T.muted, letterSpacing: 0.6 }}>
          {snapshot.hasAnyData
            ? `Based on logs from your last ${snapshot.cycles.length} cycles`
            : 'This graph fills as Luna gathers more of your cycle history'}
        </div>
      </div>
    </div>
  )
}

function QuestionsCard({ snapshot, accent, triggeredCount, onExport, onJumpToFlags }) {
  const questions = snapshot.signals.map((signal) => signal.question).slice(0, 3)
  return (
    <div className="alive-card"
      style={{
        minWidth: '100%',
        scrollSnapAlign: 'start',
        padding: 18,
        background: 'rgba(253,250,245,0.68)',
        border: `1px solid ${accent}18`,
        borderRadius: 22,
        boxShadow: `0 1px 0 ${accent}10, 0 16px 30px -24px ${accent}36`,
      }}>
      <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 1.2, fontWeight: 600, color: accent, marginBottom: 10 }}>
        {snapshot.hasPattern ? 'What to mention at your visit' : 'When something feels off'}
      </div>
      <div style={{ fontFamily: T.serif, fontSize: 19, fontWeight: 500, lineHeight: 1.34, letterSpacing: -0.25, color: T.text, marginBottom: 12 }}>
        {snapshot.hasPattern ? 'Questions to ask' : 'Questions worth keeping in mind'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {questions.map((question) => (
          <div key={question} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: '10px 0',
            borderTop: '1px solid rgba(26,19,16,0.06)',
          }}>
            <span style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `${accent}10`,
              color: accent,
              flexShrink: 0,
              marginTop: 1,
            }}>
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h8M8 3l4 4-4 4" /></svg>
            </span>
            <div style={{ fontFamily: T.serif, fontSize: 14.5, lineHeight: 1.45, color: T.text }}>
              {question}
            </div>
          </div>
        ))}
      </div>
      <button onClick={triggeredCount > 0 ? onExport : onJumpToFlags}
        className="alive-card"
        style={{
          marginTop: 16,
          width: '100%',
          background: accent,
          color: '#fff',
          border: 'none',
          padding: '12px 16px',
          cursor: 'pointer',
          fontFamily: T.sans,
          fontSize: 11.5,
          fontWeight: 600,
          letterSpacing: 0.35,
          borderRadius: 14,
          boxShadow: 'none',
        }}>
        {triggeredCount > 0 ? 'Export doctor summary' : 'Mark flags below to build a summary'}
      </button>
    </div>
  )
}

export default function HealthWatch() {
  const store = useLuna()
  const { back, goArticle, logs } = store
  const cycle = useCycle(store)
  const phase = cycle?.phase
  const acc = phase?.color || T.accent
  const [answers, setAnswers] = useState({})
  const [deckIndex, setDeckIndex] = useState(0)
  const flagsRef = useRef(null)
  const toggle = (id) => setAnswers((a) => ({ ...a, [id]: !a[id] }))
  const triggered = RED_FLAGS.filter((f) => answers[f.id])
  const snapshot = useMemo(() => buildWatchSnapshot(logs, cycle?.periodHistory), [logs, cycle?.periodHistory])

  const exportPDF = () => {
    const flagged = RED_FLAGS.filter((f) => answers[f.id])
    const generated = new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})
    const html = `<!DOCTYPE html><html><head><title>Luna Health Summary</title>
<style>
  body{font-family:Georgia,serif;padding:40px;max-width:600px;margin:0 auto;color:#1a1310;}
  h1{font-size:26px;margin-bottom:4px;}
  .sub{font-size:13px;color:#888;margin-bottom:32px;}
  h2{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#888;margin:28px 0 10px;}
  .item{margin:10px 0;padding:12px 14px;border:1px solid #e8e3d8;border-radius:4px;}
  .q{font-size:15px;font-weight:600;margin-bottom:4px;}
  .a{font-size:13px;color:#555;}
  .none{font-size:14px;color:#888;font-style:italic;}
  .footer{margin-top:36px;padding-top:16px;border-top:1px solid #e8e3d8;font-size:11px;color:#999;line-height:1.5;}
  .mark{margin-top:10px;font-size:10px;color:#999;}
  .mark b{letter-spacing:3px;font-weight:700;color:#9B5A49;font-size:10px;}
</style></head><body>
<h1>Luna Health Screener Summary</h1>
<div class="sub">Generated ${htmlEscape(generated)}</div>
<h2>Flagged items (${flagged.length})</h2>
${flagged.length === 0
  ? '<div class="none">No items flagged.</div>'
  : flagged.map((f) => `<div class="item"><div class="q">${htmlEscape(f.q)}</div><div class="a">${htmlEscape(f.a)}</div></div>`).join('')
}
<h2>All items reviewed</h2>
${RED_FLAGS.map((f) => `<div class="item" style="opacity:${answers[f.id]?1:.45}"><div class="q">${answers[f.id]?'✓ ':''} ${htmlEscape(f.q)}</div></div>`).join('')}
<div class="footer">For discussion with a healthcare provider — not a diagnosis.
<div class="mark"><b>LUNA</b> &nbsp;·&nbsp; prepared with lunadiary.app</div></div>
</body></html>`
    const w = window.open('', '_blank')
    if (!w) {
      // iOS standalone PWA blocks popups — fall through gracefully
      // instead of throwing Cannot-read-properties-of-null on w.document.
      // eslint-disable-next-line no-alert
      alert("Couldn't open the PDF view — your browser blocked the popup. Try from a regular browser tab if you'd like to print.")
      return
    }
    w.document.write(html)
    w.document.close()
    w.print()
  }

  return (
    <Screen padBottom={30}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="When something feels off" onBack={back} />
        <div className="insight-stagger" style={{ animationDelay: '0ms' }}>
          <Eyebrow color={acc}>Not a diagnosis — words to take to your doctor</Eyebrow>
        </div>
        <div className="insight-stagger" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, animationDelay: '40ms' }}>
          <div style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 500, letterSpacing: -0.6, lineHeight: 1.1, flex: 1 }}>
            What you've been feeling is real.
          </div>
          {phase && (
            <div aria-hidden="true" style={{ color: acc, opacity: 0.55, paddingTop: 2 }}>
              <PhaseFlourish phaseId={phase.id} size={22} />
            </div>
          )}
        </div>
        <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 14.5, lineHeight: 1.6, color: T.muted, marginTop: 10, fontStyle: 'italic', animationDelay: '90ms' }}>
          Tap anything that's been showing up for you lately. Luna will gather the language so the next conversation with your provider is easier.
        </div>
        {snapshot && (
          <div className="insight-stagger" style={{ marginTop: 18, marginBottom: 18, animationDelay: '120ms' }}>
            <div onScroll={(e) => {
                const el = e.currentTarget
                const idx = Math.round(el.scrollLeft / Math.max(1, el.clientWidth))
                setDeckIndex(idx)
              }}
              style={{
                display: 'flex',
                gap: 12,
                overflowX: 'auto',
                scrollSnapType: 'x mandatory',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}>
              <PatternGraphCard snapshot={snapshot} accent={acc} />
              <QuestionsCard
                snapshot={snapshot}
                accent={acc}
                triggeredCount={triggered.length}
                onExport={exportPDF}
                onJumpToFlags={() => flagsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
              {[0, 1].map((idx) => (
                <div key={idx} style={{
                  width: deckIndex === idx ? 18 : 6,
                  height: 6,
                  borderRadius: 999,
                  background: deckIndex === idx ? acc : 'rgba(26,19,16,0.16)',
                  transition: 'width .22s ease, background .22s ease',
                }} />
              ))}
            </div>
          </div>
        )}
        <Rule />

        <div ref={flagsRef} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {RED_FLAGS.map((f, i) => {
            const on = !!answers[f.id]
            return (
              <button key={f.id} onClick={() => toggle(f.id)}
                className="insight-stagger alive-card frost-card"
                style={{
                  border: `1px solid ${on ? acc + '55' : 'rgba(26,19,16,0.06)'}`,
                  background: on ? acc + '14' : 'rgba(253,250,245,0.55)',
                  padding: '16px 16px 16px 48px',
                  cursor: 'pointer', fontFamily: 'inherit', color: T.text, textAlign: 'left',
                  position: 'relative', borderRadius: 18,
                  boxShadow: on ? `0 14px 30px -22px ${acc}60` : '0 10px 22px -22px rgba(26,19,16,0.18)',
                  animationDelay: `${140 + i * 40}ms`,
                  transition: 'all 0.2s var(--ease-out)',
                }}>
                <div style={{
                  position: 'absolute', top: 16, left: 16, width: 22, height: 22,
                  border: `1.5px solid ${on ? acc : 'rgba(26,19,16,0.22)'}`,
                  background: on ? acc : 'rgba(253,250,245,0.6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', borderRadius: 8,
                  boxShadow: on ? `0 6px 12px -6px ${acc}80` : 'none',
                  transition: 'all 0.2s var(--ease-out)',
                }}>
                  {on && Icons.check}
                </div>
                <div style={{ fontFamily: T.serif, fontSize: 15, fontWeight: 500, marginBottom: on ? 6 : 0, lineHeight: 1.4, letterSpacing: -0.1 }}>{f.q}</div>
                {on && <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: T.muted, lineHeight: 1.55, animation: 'fadeUp .2s ease-out both' }}>{f.a}</div>}
              </button>
            )
          })}
        </div>

        {triggered.length > 0 && (
          <div className="frost-card alive-card" style={{ marginTop: 22, padding: 20, background: T.text, color: '#FAF4ED', borderRadius: 22, boxShadow: `0 16px 36px -20px rgba(26,19,16,0.5)`, animation: 'fadeUp .25s ease-out both' }}>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: acc, fontWeight: 500, marginBottom: 10, letterSpacing: -0.1 }}>worth bringing up</div>
            <div style={{ fontFamily: T.serif, fontSize: 19, lineHeight: 1.4, marginBottom: 10, fontStyle: 'italic', letterSpacing: -0.3 }}>
              {triggered.length === 1 ? 'One thing' : `${triggered.length} of these`} is worth a conversation with your provider.
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 13.5, color: 'rgba(250,244,237,0.72)', lineHeight: 1.6, marginBottom: 16, fontStyle: 'italic' }}>
              Luna will make a one-page summary you can email or print, so you don't have to find the words in the room.
            </div>
            <button onClick={exportPDF} className="alive-card" style={{ background: acc, color: '#fff', border: 'none', padding: '11px 18px', cursor: 'pointer', fontFamily: T.sans, fontSize: 11.5, letterSpacing: 0.3, fontWeight: 600, borderRadius: 999, boxShadow: `0 10px 22px -10px ${acc}80` }}>
              Make me a summary →
            </button>
          </div>
        )}

        <Rule />
        <Eyebrow color={acc}>To read with a cup of tea</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {['pmdd','endo','iron','pcos'].map((id) => {
            const a = ARTICLES.find((x) => x.id === id)
            if (!a) return null
            return (
              <button key={id} onClick={() => goArticle(id)}
                className="alive-card frost-card"
                style={{ background: 'rgba(253,250,245,0.55)', border: '1px solid rgba(26,19,16,0.06)', textAlign: 'left', padding: 16, cursor: 'pointer', color: T.text, fontFamily: 'inherit', borderRadius: 18, boxShadow: `0 14px 30px -22px ${acc}40` }}>
                <div style={{ fontFamily: T.serif, fontSize: 16, fontWeight: 500, lineHeight: 1.3, letterSpacing: -0.1 }}>{a.title} →</div>
                <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12, color: T.muted, marginTop: 4 }}>{a.read} · {a.cat}</div>
              </button>
            )
          })}
        </div>
        <SourceLine>This screener is informational. It does not replace a clinical evaluation.</SourceLine>
        <div style={{ height: 16 }} />
      </div>
    </Screen>
  )
}
