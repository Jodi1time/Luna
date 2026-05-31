import { useState, useEffect, useMemo } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, Rule, Screen } from '../components/shared'
import useLuna from '../store/useLuna'
import { breathTone } from '../lib/sounds'
import { useScrollLock } from '../lib/useScrollLock'
import Portal from '../lib/Portal'

// Cramps Helper — Luna's first true "what now?" surface.
// The prototype for the pattern that turns Luna from logger into
// companion. Warm motherly tone throughout, but Luna is the speaker —
// never a character. Gloria built Luna; users only ever meet Luna.
//
// Three movements:
//   1. A soft triage — where / how loud (both optional)
//   2. The action card — what helps right now, plus a breathing visual
//      to sit with for two minutes
//   3. The afterward — once she's through it, tap what helped. Luna
//      keeps a personal playbook so next month she can say
//      "Last time the heat made the biggest difference."

const WHERE_OPTIONS = [
  { id: 'belly', label: 'Lower belly' },
  { id: 'back',  label: 'Lower back' },
  { id: 'both',  label: 'Both' },
]

const INTENSITY_OPTIONS = [
  { id: 'manageable', label: 'Manageable', sub: "I can keep going" },
  { id: 'loud',       label: 'Loud',       sub: "It's hard to ignore" },
  { id: 'stopping',   label: 'Stopping me', sub: "I can't keep going" },
]

// The "what helped" options live as a tiny dictionary so the Cramps
// Helper screen and the playbook recall both read from the same source
// and labels stay consistent.
const HELPED_OPTIONS = [
  { id: 'heat',       label: 'Heat',          line: "Heat" },
  { id: 'ibuprofen',  label: 'Ibuprofen',     line: "Ibuprofen" },
  { id: 'magnesium',  label: 'Magnesium',     line: "Magnesium" },
  { id: 'movement',   label: 'Light movement', line: "A walk" },
  { id: 'breath',     label: 'Breathing',     line: "Breathing" },
  { id: 'rest',       label: 'Just rest',     line: "Resting" },
]

// Tally what's helped most often across past episodes so Luna can
// recall the user's personal pattern next time she opens this screen.
function topPriorHelpers(history) {
  if (!history?.length) return []
  const count = {}
  for (const ep of history) {
    for (const id of ep.helped || []) {
      count[id] = (count[id] || 0) + 1
    }
  }
  return Object.entries(count)
    .sort((a, b) => b[1] - a[1])
    .map(([id, n]) => ({ id, n, label: HELPED_OPTIONS.find((o) => o.id === id)?.line || id }))
}

// Soft pulsing breathing visual — 4s inhale, 2s hold, 6s exhale. The
// numbers aren't shown to the user; they live in the timing of the
// circle. Cycle continues until the user taps "I'm done."
function BreathingOverlay({ onClose, soundsOn }) {
  useScrollLock(true)
  const [phase, setPhase] = useState('inhale')  // 'inhale' | 'hold' | 'exhale'
  const [cyclesDone, setCyclesDone] = useState(0)

  useEffect(() => {
    // Drive the breath state machine. Total cycle is 12s.
    // Schedule one full breath, then loop.
    let timeouts = []
    let live = true
    const cycle = () => {
      if (!live) return
      breathTone(soundsOn)
      setPhase('inhale')
      timeouts.push(setTimeout(() => { if (live) setPhase('hold') }, 4000))
      timeouts.push(setTimeout(() => { if (live) setPhase('exhale') }, 6000))
      timeouts.push(setTimeout(() => {
        if (!live) return
        setCyclesDone((c) => c + 1)
        cycle()
      }, 12000))
    }
    cycle()
    return () => { live = false; timeouts.forEach(clearTimeout) }
  }, [soundsOn])

  const label = phase === 'inhale' ? 'Breathe in…'
              : phase === 'hold'   ? 'Hold…'
              : 'Breathe out…'

  return (
    <Portal>
    <div
      data-luna-overlay="true"
      onClick={onClose}
      onTouchMove={(e) => e.preventDefault()}
      onWheel={(e) => e.preventDefault()}
      style={{
        position: 'fixed', inset: 0, zIndex: 1100,
        background: 'rgba(26,19,16,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.4s ease-out both',
        color: '#FAF4ED',
        padding: 24,
        touchAction: 'none',
        overscrollBehavior: 'contain',
      }}>
      <div className="breath-circle"
        data-phase={phase}
        style={{
          width: 220, height: 220, borderRadius: '50%',
          background: `radial-gradient(circle, ${T.accent}40 0%, ${T.accent}10 60%, transparent 100%)`,
          border: `1px solid rgba(250,244,237,0.18)`,
          transformOrigin: 'center',
          marginBottom: 36,
        }} />
      <div style={{ fontFamily: T.serif, fontSize: 26, fontStyle: 'italic', letterSpacing: -0.3, marginBottom: 12 }}>
        {label}
      </div>
      <div style={{ fontFamily: T.serif, fontSize: 14, color: 'rgba(250,244,237,0.65)', marginBottom: 28, fontStyle: 'italic' }}>
        {cyclesDone === 0 ? 'Stay with me.' : cyclesDone < 3 ? 'You\'re doing it.' : 'Keep going — or close when you\'re ready.'}
      </div>
      <button onClick={onClose}
        style={{ background: 'transparent', border: `1px solid rgba(250,244,237,0.32)`, color: '#FAF4ED', padding: '11px 22px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans, fontSize: 12, letterSpacing: 0.5, fontWeight: 600 }}>
        I'm done
      </button>
    </div>
    </Portal>
  )
}

export default function CrampsHelper() {
  const store = useLuna()
  const { back, go, settings, updateSetting } = store
  const soundsOn = Boolean(settings?.sounds)
  const history = settings?.crampsHistory || []

  const [where, setWhere] = useState(null)
  const [intensity, setIntensity] = useState(null)
  const [helped, setHelped] = useState([])
  const [breathOpen, setBreathOpen] = useState(false)
  const [saved, setSaved] = useState(false)

  const topHelpers = useMemo(() => topPriorHelpers(history), [history])
  const topHelper = topHelpers[0] // most-used helper across history

  const toggleHelped = (id) => {
    setHelped((curr) => curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id])
  }

  const recordEpisode = () => {
    const next = [
      ...history,
      {
        dateISO: new Date().toISOString().slice(0, 10),
        where,
        intensity,
        helped,
        recordedAt: new Date().toISOString(),
      },
    ].slice(-30)  // keep the most recent 30 episodes
    updateSetting('crampsHistory', next)
    setSaved(true)
    setTimeout(() => setSaved(false), 1400)
  }

  // Severe-cramps flag — if the user marks "stopping me", surface a
  // soft escalation card. Doesn't pop a modal; just appears below the
  // action card, in Gloria's voice.
  const severe = intensity === 'stopping'

  return (
    <Screen padBottom={40}>
      {breathOpen && <BreathingOverlay onClose={() => setBreathOpen(false)} soundsOn={soundsOn} />}

      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="cramps today" onBack={back} />

        <div style={{ fontFamily: T.serif, fontSize: 36, fontWeight: 500, letterSpacing: -0.9, lineHeight: 1.02 }}>
          Cramps today?
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 18, fontStyle: 'italic', color: T.muted, marginTop: 8, lineHeight: 1.45, letterSpacing: -0.2 }}>
          Sit with me. Let's start.
        </div>
        <Rule />

        {/* The action card — the heart of this screen */}
        <div className="glass-card" style={{ padding: 18, borderLeft: `3px solid ${T.accent}`, borderRadius: T.r, marginBottom: 18 }}>
          <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.2, fontWeight: 600, color: T.muted, marginBottom: 10 }}>
            What helps right now
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 17, lineHeight: 1.65, color: T.text, letterSpacing: -0.1 }}>
            <p style={{ margin: '0 0 12px 0' }}>
              Put a heating pad low on your belly — that's the part working hardest right now.
            </p>
            <p style={{ margin: '0 0 12px 0' }}>
              If you've got ibuprofen, take it now, not later when the pain has already won. A little magnesium tonight before bed, if you can — it softens tomorrow.
            </p>
            <p style={{ margin: 0, fontStyle: 'italic', color: 'color-mix(in srgb, ' + T.text + ', white 18%)' }}>
              Stay close to warm things. We'll check in soon.
            </p>
          </div>

          {topHelper && topHelper.n >= 2 && (
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.hair}`, fontFamily: T.serif, fontSize: 14, fontStyle: 'italic', color: T.accent, lineHeight: 1.5 }}>
              Last time, <strong style={{ fontWeight: 600, fontStyle: 'normal' }}>{topHelper.label.toLowerCase()}</strong> made the biggest difference for you. Try that first today.
            </div>
          )}
        </div>

        <button onClick={() => setBreathOpen(true)}
          style={{ width: '100%', background: T.accent, color: '#fff', border: 'none', padding: '14px 16px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans, fontSize: 13, fontWeight: 600, letterSpacing: 0.4, marginBottom: 18 }}>
          Breathe with me — two minutes
        </button>

        {severe && (
          <div className="glass-card" style={{ padding: 14, borderLeft: `3px solid ${T.accent}`, borderRadius: T.r, marginBottom: 18, background: T.accent + '10' }}>
            <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.2, fontWeight: 600, color: T.accent, marginBottom: 6 }}>
              When it's this loud
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 14.5, lineHeight: 1.55, color: T.text }}>
              If cramps are stopping you from going where you need to go — not just this once, but month after month — that's not what your body should be asking. Worth a conversation with a doctor. Luna will have the words ready when you are.
            </div>
            <button onClick={() => go('cheatsheet')}
              style={{ marginTop: 10, background: 'transparent', border: 'none', cursor: 'pointer', color: T.accent, fontSize: 12, fontWeight: 600, letterSpacing: 0.4, fontFamily: T.sans, padding: 0 }}>
              Open my talking points →
            </button>
          </div>
        )}

        <Rule />

        {/* A soft, optional triage. Useful but never gating. */}
        <Eyebrow>If you want to tell me more</Eyebrow>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: T.serif, fontSize: 14, fontStyle: 'italic', marginBottom: 8, color: T.text }}>Where is it most?</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {WHERE_OPTIONS.map((o) => {
              const on = where === o.id
              return (
                <button key={o.id} onClick={() => setWhere(on ? null : o.id)}
                  style={{ border: `1px solid ${on ? T.accent : T.hair}`, background: on ? T.accent + '12' : T.card, color: on ? T.accent : T.text, padding: '10px 6px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans, fontSize: 12, fontWeight: 600 }}>
                  {o.label}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: T.serif, fontSize: 14, fontStyle: 'italic', marginBottom: 8, color: T.text }}>How loud is it?</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {INTENSITY_OPTIONS.map((o) => {
              const on = intensity === o.id
              return (
                <button key={o.id} onClick={() => setIntensity(on ? null : o.id)}
                  style={{ border: `1px solid ${on ? T.accent : T.hair}`, background: on ? T.accent + '12' : T.card, color: on ? T.accent : T.text, padding: '10px 6px 8px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{o.label}</span>
                  <span style={{ fontSize: 9.5, color: T.muted, lineHeight: 1.3, textAlign: 'center', fontWeight: 500 }}>{o.sub}</span>
                </button>
              )
            })}
          </div>
        </div>

        <Rule />

        {/* The afterward — tap what helped. Builds the personal playbook. */}
        <Eyebrow>Once you're through this</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 14, fontStyle: 'italic', lineHeight: 1.6, color: T.muted, marginBottom: 12 }}>
          Tap what helped. I'll remember for next time.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 14 }}>
          {HELPED_OPTIONS.map((o) => {
            const on = helped.includes(o.id)
            return (
              <button key={o.id} onClick={() => toggleHelped(o.id)}
                style={{ border: `1px solid ${on ? T.accent : T.hair}`, background: on ? T.accent + '12' : T.card, color: on ? T.accent : T.text, padding: '12px 6px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans, fontSize: 11.5, fontWeight: 600 }}>
                {o.label}
              </button>
            )
          })}
        </div>

        <button onClick={recordEpisode}
          disabled={helped.length === 0}
          className={saved ? 'success-pulse' : ''}
          style={{ width: '100%', background: helped.length === 0 ? T.hair : T.accent, color: helped.length === 0 ? T.muted : '#fff', border: 'none', padding: '12px 14px', borderRadius: T.r, cursor: helped.length === 0 ? 'default' : 'pointer', fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, letterSpacing: 0.4 }}>
          {saved ? 'Saved to your playbook' : 'Remember this for me'}
        </button>

        {history.length > 0 && (
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${T.hair}`, fontFamily: T.serif, fontSize: 13, color: T.muted, fontStyle: 'italic', lineHeight: 1.55 }}>
            Your playbook so far — {history.length} episode{history.length === 1 ? '' : 's'} remembered.
            {topHelpers.length > 0 && (
              <> Most-relied-on: <em style={{ color: T.accent, fontStyle: 'italic' }}>{topHelpers.slice(0, 3).map((h) => h.label.toLowerCase()).join(', ')}</em>.</>
            )}
          </div>
        )}

        <div style={{ height: 16 }} />
      </div>
    </Screen>
  )
}
