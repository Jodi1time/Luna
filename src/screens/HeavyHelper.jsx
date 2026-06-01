import { useState, useEffect } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, Rule, Screen, SourceLine } from '../components/shared'
import useLuna from '../store/useLuna'
import { useCycle } from '../hooks/useCycle'
import QuickNote from '../components/QuickNote'
import LunaChat from '../components/LunaChat'
import { useScrollLock } from '../lib/useScrollLock'
import { breathTone } from '../lib/sounds'
import Portal from '../lib/Portal'
import { sectionColors, sectionPaper } from '../data/sectionPalette'

// "When it feels heavy" — a hub, not a single-helper screen. Different
// roots need different supports, and routing "Heavy today" to the
// Anxiety helper alone under-served everyone whose heaviness wasn't
// anxiety specifically. This screen presents multiple paths and lets
// her pick the one that fits the moment.
//
// Phase-aware: in late luteal, a small context card surfaces the
// PMDD signal without diagnosing.

// Quick breath overlay — 4-1-7 paced. Local to this screen so the
// hub stays self-contained.
function QuickBreathOverlay({ onClose, soundsOn }) {
  useScrollLock(true)
  const [phase, setPhase] = useState('inhale')
  const [done, setDone] = useState(0)

  useEffect(() => {
    let timeouts = []
    let live = true
    const cycle = () => {
      if (!live) return
      breathTone(soundsOn)
      setPhase('inhale')
      timeouts.push(setTimeout(() => { if (live) setPhase('hold') }, 4000))
      timeouts.push(setTimeout(() => { if (live) setPhase('exhale') }, 5000))
      timeouts.push(setTimeout(() => {
        if (!live) return
        setDone((d) => d + 1)
        cycle()
      }, 12000))
    }
    cycle()
    return () => { live = false; timeouts.forEach(clearTimeout) }
  }, [soundsOn])

  const label = phase === 'inhale' ? 'Breathe in…'
              : phase === 'hold'   ? 'Hold…'
              : 'Breathe out — long.'

  return (
    <Portal>
    <div
      data-luna-overlay="true"
      onClick={onClose}
      onTouchMove={(e) => e.preventDefault()}
      onWheel={(e) => e.preventDefault()}
      style={{
        position: 'fixed', inset: 0, zIndex: 1100,
        background: 'rgba(26,19,16,0.7)',
        backdropFilter: 'blur(20px) saturate(1.15)', WebkitBackdropFilter: 'blur(20px) saturate(1.15)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.4s ease-out both',
        color: '#FAF4ED', padding: 24,
        touchAction: 'none', overscrollBehavior: 'contain',
      }}>
      <div className="breath-circle" data-phase={phase}
        style={{
          width: 220, height: 220, borderRadius: '50%',
          background: `radial-gradient(circle, ${T.accent}40 0%, ${T.accent}10 60%, transparent 100%)`,
          border: `1px solid rgba(250,244,237,0.18)`, marginBottom: 36,
        }} />
      <div style={{ fontFamily: T.serif, fontSize: 24, fontStyle: 'italic', letterSpacing: -0.3, marginBottom: 12 }}>
        {label}
      </div>
      <div style={{ fontFamily: T.serif, fontSize: 14, color: 'rgba(250,244,237,0.65)', marginBottom: 28, fontStyle: 'italic', textAlign: 'center', maxWidth: 280 }}>
        {done === 0 ? 'A slower exhale signals "rest now" to the body.' : 'Keep going — or close when you\'re ready.'}
      </div>
      <button onClick={onClose}
        style={{ background: 'transparent', border: `1px solid rgba(250,244,237,0.32)`, color: '#FAF4ED', padding: '11px 22px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans, fontSize: 12, letterSpacing: 0.5, fontWeight: 600 }}>
        I'm done
      </button>
    </div>
    </Portal>
  )
}

function PathCard({ eyebrow, title, blurb, onTap, category = 'reflect' }) {
  const c = sectionColors(category)
  return (
    <button onClick={onTap} className="alive-card"
      style={{
        width: '100%', textAlign: 'left', padding: 16, borderRadius: T.r,
        background: sectionPaper(category),
        border: `1px solid ${c.accent}22`,
        borderLeft: `3px solid ${c.accent}`,
        boxShadow: `0 1px 0 ${c.accent}10, 0 10px 22px -18px ${c.accent}30`,
        cursor: 'pointer', color: T.text, fontFamily: 'inherit', display: 'block',
      }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.2, fontWeight: 600, color: T.muted }}>
          {eyebrow}
        </div>
        <div style={{ fontFamily: T.sans, fontSize: 10, color: T.accent, fontWeight: 600, letterSpacing: 0.3 }}>→</div>
      </div>
      <div style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 500, lineHeight: 1.3, letterSpacing: -0.2, marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ fontFamily: T.serif, fontSize: 13.5, color: T.muted, fontStyle: 'italic', lineHeight: 1.55 }}>
        {blurb}
      </div>
    </button>
  )
}

export default function HeavyHelper() {
  const store = useLuna()
  const { back, go, settings, displayName, setActiveReflectPractice } = store
  const cycle = useCycle(store)
  const soundsOn = Boolean(settings?.sounds)
  const phase = cycle.phase
  const firstName = (displayName || '').trim().split(' ')[0]

  const [breathOpen, setBreathOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  const isLuteal = phase?.id === 'luteal'

  // Deep-link into a specific Reflect practice. Sets the active
  // practice in the store, then navigates — Reflect picks it up on
  // mount and auto-opens it, then clears the value.
  const openReflectPractice = (id) => {
    setActiveReflectPractice(id)
    go('reflect')
  }

  return (
    <Screen padBottom={40}>
      {breathOpen && <QuickBreathOverlay onClose={() => setBreathOpen(false)} soundsOn={soundsOn} />}
      <QuickNote open={noteOpen} onClose={() => setNoteOpen(false)} />
      <LunaChat
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        opener={null}
        context={phase ? { phaseId: phase.id, phaseName: phase.name, cycleDay: cycle.cycleDay, cycleLength: cycle.cycleLength } : {}}
      />

      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="when it feels heavy" onBack={back} />

        <div style={{ fontFamily: T.serif, fontSize: 32, fontWeight: 500, letterSpacing: -0.7, lineHeight: 1.05 }}>
          {firstName ? `Heavy, ${firstName}?` : 'Heavy today?'}
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 16, fontStyle: 'italic', color: T.muted, lineHeight: 1.55, marginTop: 10 }}>
          Sometimes the body, sometimes the mind, sometimes both at once. A few ways in — pick the one that fits.
        </div>
        <Rule />

        {/* Phase context — only in luteal, where it actually changes the read */}
        {isLuteal && (
          <div className="glass-card" style={{ padding: 14, borderLeft: `3px solid ${phase.color}`, borderRadius: T.r, marginBottom: 18 }}>
            <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.2, fontWeight: 600, color: T.muted, marginBottom: 6 }}>
              On where you are in your cycle
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 14.5, lineHeight: 1.6, color: T.text }}>
              You're in late luteal — the week before your period. Serotonin and dopamine genuinely drop here, which makes everything feel a bit more. That's biology talking, not your character. If the heaviness is disabling and shows up the same week every cycle, that's worth a conversation — PMDD is recognised and very treatable.
            </div>
          </div>
        )}

        {/* The paths — eight distinct ways in, each going to a real
            destination. No path falls through to a generic list. */}
        <Eyebrow>Start with the body</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          <PathCard category="body"
            eyebrow="Two minutes"
            title="Breathe — slow, long exhale"
            blurb="A longer exhale signals 'rest now' to the nervous system. It works before the thought does."
            onTap={() => setBreathOpen(true)}
          />
          <PathCard category="body"
            eyebrow="Three minutes"
            title="A body scan"
            blurb="Guided attention from the top of your head to the soles of your feet. Returns you to the body before the mind gets its way."
            onTap={() => openReflectPractice('bodyscan')}
          />
        </div>

        <Eyebrow>Work with the thoughts</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          <PathCard category="reflect"
            eyebrow="When it's anxiety, specifically"
            title="Sit with anxiety"
            blurb="Grounding, paced breath, and a triage that asks where this lives most — body or mind."
            onTap={() => go('anxiety')}
          />
          <PathCard category="read"
            eyebrow="When a worry won't let go"
            title="Reframe the thought"
            blurb="The strongest single tool in CBT — write the worry, ask if it's the whole picture, offer the kindness you'd give a friend."
            onTap={() => openReflectPractice('reframe')}
          />
          <PathCard category="reflect"
            eyebrow="When 'fine' isn't accurate"
            title="Name what you're feeling"
            blurb="Specific emotion words reduce their intensity — affect-labelling research. 'Disappointed' is gentler than 'bad'."
            onTap={() => openReflectPractice('feeling')}
          />
          <PathCard category="intimate"
            eyebrow="When the inner voice is harsh"
            title="A self-compassion pause"
            blurb="Three short steps — notice it's hard, remember others have felt this, offer yourself warmth. Two minutes."
            onTap={() => openReflectPractice('compassion')}
          />
        </div>

        <Eyebrow>Reach for someone</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
          <PathCard category="reflect"
            eyebrow="Talk it through"
            title="A few minutes with Luna"
            blurb="A quiet, reflective space — no judgement, no advice unless you ask for it."
            onTap={() => setChatOpen(true)}
          />
          <PathCard category="care"
            eyebrow="On paper"
            title="Put it down in a note"
            blurb="One sentence to your future self. The act of writing alone takes some weight off."
            onTap={() => setNoteOpen(true)}
          />
        </div>

        <Rule />
        <Eyebrow>When to widen the conversation</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 14, lineHeight: 1.65, color: T.text, marginBottom: 18 }}>
          <div>· If heaviness shows up the week before your period, three cycles in a row, that's a PMDD signature — recognised and treatable.</div>
          <div>· If most days lately are heavy, talk to a clinician this week. Hormones, thyroid, iron, sleep, and life all play a role — and all can be worked with.</div>
          <div>· If there's any thought of self-harm, please reach out tonight: <strong style={{ fontWeight: 600 }}>988 (US/Canada)</strong>, <strong style={{ fontWeight: 600 }}>116 123 (UK Samaritans)</strong>, or your local equivalent.</div>
        </div>

        <button onClick={() => go('cheatsheet')}
          style={{ width: '100%', background: 'transparent', color: T.text, border: `1px solid ${T.text}`, padding: '12px 14px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans, fontSize: 12, fontWeight: 600, letterSpacing: 0.4, marginBottom: 14 }}>
          Open my talking points for a clinician →
        </button>

        <SourceLine>Mental-health practices grounded in CBT, mindful self-compassion (Neff), affect-labelling research, and the PMDD treatment literature.</SourceLine>
        <div style={{ height: 16 }} />
      </div>
    </Screen>
  )
}
