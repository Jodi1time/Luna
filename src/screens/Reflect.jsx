import { useState, useMemo, useEffect } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, Rule, Screen, SourceLine } from '../components/shared'
import useLuna from '../store/useLuna'
import { useCycle } from '../hooks/useCycle'
import QuickNote from '../components/QuickNote'
import LunaChat from '../components/LunaChat'
import { useScrollLock } from '../lib/useScrollLock'

// Reflect — interactive journaling + short guided practices for
// emotional and mental health. Takes traits from meditation apps
// (short, body-paced, no streaks) but every practice is something
// the user does WITH Luna, not just AT a textarea.
//
// Three modes:
//   1. Write freely — opens QuickNote, saves to today's log.note
//   2. Guided practices — short evidence-based exercises, each
//      ending with a save + reassuring note
//   3. Talk to Luna — opens the existing LunaChat with no opener

// ── Practices ───────────────────────────────────────────────────
// Each practice is a small, complete experience. Tap to open in a
// bottom-sheet overlay; fill in; save → adds to reflectHistory and
// pulses a confirmation. All evidence-based but written as Luna,
// never as a workbook.

const PRACTICES = [
  {
    id: 'intention',
    title: 'A morning intention',
    sub: 'For the day that hasn\'t happened yet.',
    blurb: 'One sentence about what today is really about — chosen by you before the day chooses for you. Thirty seconds, the most efficient practice in this list.',
    cta: 'Set today\'s one thing',
    kind: 'intention',
  },
  {
    id: 'gratitude',
    title: 'Three small things',
    sub: 'For the days that felt heavier than they were.',
    blurb: 'A 2005 study followed people who wrote three things that went well each evening — six months later they were measurably happier than the control group. The brain notices what we point it at.',
    cta: 'Start the three',
    kind: 'gratitude',
  },
  {
    id: 'feeling',
    title: 'Name what you\'re feeling',
    sub: 'When "fine" or "off" is all you can reach.',
    blurb: 'Specific emotion words reduce their intensity — neuroscience calls it "affect labelling". Saying "I feel disappointed" is gentler on the body than "I feel bad".',
    cta: 'Find the word',
    kind: 'feeling',
  },
  {
    id: 'bodyscan',
    title: 'A quick body scan',
    sub: 'For the tension you didn\'t notice you were holding.',
    blurb: 'Three minutes of guided attention from the top of your head to the soles of your feet. Mindfulness research calls this "interoception" — the practice of returning to the body before the mind has had its way.',
    cta: 'Begin the scan',
    kind: 'bodyscan',
  },
  {
    id: 'compassion',
    title: 'A self-compassion pause',
    sub: 'For the moments you\'re hardest on yourself.',
    blurb: 'Kristin Neff\'s three-part practice: notice the difficulty, remember others have felt this too, offer yourself a moment of warmth. Two minutes, no posture required.',
    cta: 'Take the pause',
    kind: 'compassion',
  },
  {
    id: 'reframe',
    title: 'Sit with a worry',
    sub: 'For the thought that won\'t let go.',
    blurb: 'Cognitive reframing — writing the worry, asking whether it\'s the whole picture, and offering the kindness you\'d give a friend. The strongest single tool in CBT.',
    cta: 'Write the worry',
    kind: 'reframe',
  },
  {
    id: 'bedtime',
    title: 'A bedtime release',
    sub: 'For the night that still has thoughts in it.',
    blurb: 'A short ritual to close the day — write the loop that\'s still spinning, then sit with a paced breath that signals "rest now" to the nervous system.',
    cta: 'Begin the release',
    kind: 'bedtime',
  },
]

// Phase-aware opening line. Doesn't change the practice — sets the
// emotional weather as the user enters.
const PHASE_OPENING = {
  menstrual:  'Quiet weeks ask for quieter reflection. Sit with whatever wants to be put down.',
  follicular: 'A lifting week. What feels closer to possible than it did last week?',
  ovulation:  'A more outward-facing week. What\'s easier than usual — and what does that tell you?',
  luteal:     'Softer week, sharper edges. Practices that meet you where you are, not where you wish you were.',
}

// Phase-aware practice recommendation. THE feature that makes Luna's
// wellness distinctly female: which short practice fits THIS week of
// her cycle, grounded in what the science of cyclical hormones and
// female mental health tells us is helpful in each phase.
//   menstrual  — the body is doing real work; rest/compassion supports the system
//   follicular — estrogen rising; intention-setting + gratitude land best here
//   ovulation  — outward window; naming what's actually present (vs imagined)
//   luteal     — serotonin/dopamine drop; self-compassion and reframe are most protective
const PHASE_PRACTICE = {
  menstrual: {
    id: 'compassion',
    eyebrow: 'For your menstrual week',
    line: 'A self-compassion pause — the body is doing real work this week.',
  },
  follicular: {
    id: 'intention',
    eyebrow: 'For your follicular week',
    line: 'A morning intention — estrogen is lifting, the brain notices what we point it at.',
  },
  ovulation: {
    id: 'feeling',
    eyebrow: 'For your ovulation week',
    line: 'Name what you\'re feeling — the outward window is when specific words land cleanest.',
  },
  luteal: {
    id: 'reframe',
    eyebrow: 'For your luteal week',
    line: 'Sit with a worry — late-luteal serotonin drops make the inner voice harsher than it has to be.',
  },
}

// ── Gratitude practice ──────────────────────────────────────────
function GratitudeSheet({ open, onClose, onSave }) {
  const [items, setItems] = useState(['', '', ''])
  const [saved, setSaved] = useState(false)

  if (!open) return null

  const update = (i, v) => setItems((curr) => curr.map((x, idx) => idx === i ? v : x))
  const filled = items.filter((t) => t.trim().length > 0).length

  const save = () => {
    if (filled === 0) return
    onSave({
      kind: 'gratitude',
      content: items.filter((t) => t.trim()).map((t) => t.trim()),
    })
    setSaved(true)
    setTimeout(() => { setItems(['', '', '']); setSaved(false); onClose() }, 1100)
  }

  return (
    <SheetShell onClose={onClose} title="Three small things" sub="From today — moments, not achievements.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((v, i) => (
          <textarea key={i}
            value={v}
            onChange={(e) => update(i, e.target.value)}
            placeholder={i === 0 ? 'The first thing…' : i === 1 ? 'And another…' : 'One more…'}
            maxLength={400}
            rows={2}
            style={{
              background: T.card, border: `1px solid ${T.hair}`,
              borderRadius: T.r, padding: '12px 14px',
              fontFamily: T.serif, fontStyle: 'italic', fontSize: 15,
              color: T.text, lineHeight: 1.5, outline: 'none',
            }} />
        ))}
      </div>
      <SheetFooter
        onSave={save}
        disabled={filled === 0}
        saved={saved}
        label={`Save ${filled || ''}`.trim()}
        savedLabel="Saved"
        helper={filled === 0 ? 'Write at least one — there\'s always something.' : null}
      />
    </SheetShell>
  )
}

// ── Name-the-feeling practice ───────────────────────────────────
// A layered emotion vocabulary. Pick the closest top-level, then
// drill down to the most precise word. Research on affect labelling
// shows specificity reduces emotional intensity.
const FEELING_LAYERS = [
  { id: 'heavy',     label: 'Heavy',     children: ['Sad', 'Grief', 'Lonely', 'Disappointed', 'Empty'] },
  { id: 'tense',     label: 'Tense',     children: ['Anxious', 'Restless', 'Worried', 'Overwhelmed', 'Irritable'] },
  { id: 'tender',    label: 'Tender',    children: ['Vulnerable', 'Soft', 'Open', 'Aching', 'Longing'] },
  { id: 'flat',      label: 'Flat',      children: ['Numb', 'Detached', 'Bored', 'Disconnected', 'Tired'] },
  { id: 'rising',    label: 'Rising',    children: ['Hopeful', 'Energized', 'Curious', 'Settled', 'Grateful'] },
  { id: 'bright',    label: 'Bright',    children: ['Joyful', 'Confident', 'Playful', 'In love', 'Proud'] },
]

const FEELING_NOTES = {
  Anxious: 'Anxiety is the body bracing for something that might not come. The breath softens it; the thought rarely does.',
  Lonely: 'Loneliness is sometimes a signal to reach out — and sometimes a signal to be gentler with the one you\'re with: you.',
  Overwhelmed: 'Overwhelm usually means too many open loops. Putting one of them on paper can be its own relief.',
  Grief: 'Grief moves in waves; this one will recede. Whatever you\'re missing was worth missing.',
  Numb: 'Numb is the body protecting you from too much at once. It\'s not absence — it\'s a kind of presence, paused.',
  Irritable: 'Irritability often points back at sleep, hunger, or hormones — and only sometimes at the person in front of you.',
  Hopeful: 'Hope is a small bright thing worth marking. Write down what it\'s pointing toward.',
  Tired: 'Tired is data, not a verdict. Your body might be asking for rest, iron, or simply less.',
  Longing: 'Longing is a quiet teacher — it shows you what matters before you can do anything about it.',
}

function FeelingSheet({ open, onClose, onSave }) {
  const [stage, setStage] = useState('top')
  const [topPick, setTopPick] = useState(null)
  const [picked, setPicked] = useState(null)
  const [saved, setSaved] = useState(false)

  if (!open) return null

  const top = FEELING_LAYERS.find((l) => l.id === topPick)
  const note = picked ? FEELING_NOTES[picked] : null

  const save = () => {
    if (!picked) return
    onSave({ kind: 'feeling', content: { top: topPick, word: picked } })
    setSaved(true)
    setTimeout(() => {
      setStage('top'); setTopPick(null); setPicked(null); setSaved(false); onClose()
    }, 1100)
  }

  return (
    <SheetShell onClose={onClose} title="Name what you're feeling" sub={stage === 'top' ? 'Start with the weather. Pick the closest.' : 'Now closer. Which word is true?'}>
      {stage === 'top' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {FEELING_LAYERS.map((l) => (
            <button key={l.id} onClick={() => { setTopPick(l.id); setStage('inner') }}
              style={{
                padding: '14px 10px', border: `1px solid ${T.hair}`,
                background: T.card, borderRadius: T.r, cursor: 'pointer',
                fontFamily: T.serif, fontStyle: 'italic', fontSize: 16, color: T.text,
              }}>
              {l.label}
            </button>
          ))}
        </div>
      )}
      {stage === 'inner' && top && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <div style={{ fontFamily: T.serif, fontSize: 14, fontStyle: 'italic', color: T.muted }}>
              You picked <em style={{ color: T.accent, fontStyle: 'normal', fontWeight: 500 }}>{top.label.toLowerCase()}</em>.
            </div>
            <button onClick={() => { setStage('top'); setPicked(null) }}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 11, fontFamily: T.sans }}>
              ← back
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 14 }}>
            {top.children.map((w) => {
              const on = picked === w
              return (
                <button key={w} onClick={() => setPicked(w)}
                  style={{
                    padding: '12px 10px', border: `1px solid ${on ? T.accent : T.hair}`,
                    background: on ? T.accent + '12' : T.card, borderRadius: T.r, cursor: 'pointer',
                    fontFamily: T.serif, fontSize: 14.5, color: on ? T.accent : T.text, fontWeight: 500,
                  }}>
                  {w}
                </button>
              )
            })}
          </div>
          {note && (
            <div className="glass-card" style={{ padding: 14, borderLeft: `3px solid ${T.accent}`, borderRadius: T.r }}>
              <div style={{ fontFamily: T.serif, fontSize: 15, lineHeight: 1.55, color: T.text, fontStyle: 'italic' }}>
                {note}
              </div>
            </div>
          )}
        </div>
      )}
      <SheetFooter
        onSave={save}
        disabled={!picked}
        saved={saved}
        label="Save the word"
        savedLabel="Named"
        helper={!picked && stage === 'inner' ? 'Pick the word that fits.' : null}
      />
    </SheetShell>
  )
}

// ── Self-compassion practice (Neff three-step) ──────────────────
function CompassionSheet({ open, onClose, onSave }) {
  const [step, setStep] = useState(0)
  const [reflection, setReflection] = useState('')
  const [saved, setSaved] = useState(false)

  if (!open) return null

  const lines = [
    {
      title: 'This is hard right now.',
      body: 'Whatever you\'re sitting with — name it to yourself, even silently. "I\'m struggling." Letting the truth in is the first part.',
    },
    {
      title: 'You\'re not the only one.',
      body: 'Other women have felt this exact thing today. Not as a fact-checking, but as a release — the body softens when it knows the experience is shared.',
    },
    {
      title: 'You deserve kindness, too.',
      body: 'The kindness you\'d give a friend in this same place — it\'s allowed to come back to you. A hand on your chest, a breath, a sentence: "May I be soft with myself today."',
    },
  ]

  const save = () => {
    onSave({ kind: 'compassion', content: reflection.trim() || null })
    setSaved(true)
    setTimeout(() => { setStep(0); setReflection(''); setSaved(false); onClose() }, 1100)
  }

  if (step < lines.length) {
    const line = lines[step]
    return (
      <SheetShell onClose={onClose} title="A self-compassion pause" sub={`Three breaths — ${step + 1} of ${lines.length}.`}>
        <div className="glass-card" style={{ padding: 18, borderLeft: `3px solid ${T.accent}`, borderRadius: T.r, marginBottom: 14 }}>
          <div style={{ fontFamily: T.serif, fontSize: 22, fontStyle: 'italic', lineHeight: 1.3, color: T.text, letterSpacing: -0.3, marginBottom: 12 }}>
            {line.title}
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 15, lineHeight: 1.65, color: T.text }}>
            {line.body}
          </div>
        </div>
        <button onClick={() => setStep(step + 1)}
          style={{ width: '100%', background: T.accent, color: '#fff', border: 'none', padding: '13px 14px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, letterSpacing: 0.4 }}>
          {step === lines.length - 1 ? 'One last step' : 'Take a breath, next'}
        </button>
      </SheetShell>
    )
  }

  return (
    <SheetShell onClose={onClose} title="One sentence, if you want" sub="Anything that came up — keep it for your future self.">
      <textarea value={reflection} onChange={(e) => setReflection(e.target.value)}
        placeholder="What you'd say to yourself as a friend, right now."
        rows={4} maxLength={1000}
        style={{
          width: '100%', background: T.card, border: `1px solid ${T.hair}`,
          borderRadius: T.r, padding: '14px 16px',
          fontFamily: T.serif, fontStyle: 'italic', fontSize: 15,
          color: T.text, lineHeight: 1.55, outline: 'none',
        }} />
      <SheetFooter onSave={save} disabled={false} saved={saved} label="Save the pause" savedLabel="Held" helper={null} />
    </SheetShell>
  )
}

// ── Worry reframe practice (CBT) ────────────────────────────────
function ReframeSheet({ open, onClose, onSave }) {
  const [worry, setWorry] = useState('')
  const [alternative, setAlternative] = useState('')
  const [friend, setFriend] = useState('')
  const [saved, setSaved] = useState(false)

  if (!open) return null

  const save = () => {
    if (!worry.trim()) return
    onSave({
      kind: 'reframe',
      content: {
        worry: worry.trim(),
        alternative: alternative.trim() || null,
        friend: friend.trim() || null,
      },
    })
    setSaved(true)
    setTimeout(() => { setWorry(''); setAlternative(''); setFriend(''); setSaved(false); onClose() }, 1100)
  }

  return (
    <SheetShell onClose={onClose} title="Sit with a worry" sub="Write it down. Then look at it together.">
      <Field label="The worry itself">
        <textarea value={worry} onChange={(e) => setWorry(e.target.value)}
          placeholder="Write it plainly — the way it lives in your chest."
          rows={3} maxLength={1000}
          style={fieldStyle} />
      </Field>
      <Field label="Is it the whole picture?">
        <textarea value={alternative} onChange={(e) => setAlternative(e.target.value)}
          placeholder="Even one other reading. Something that complicates it."
          rows={3} maxLength={1000}
          style={fieldStyle} />
      </Field>
      <Field label="What would you tell a friend who said this?">
        <textarea value={friend} onChange={(e) => setFriend(e.target.value)}
          placeholder="In your own voice — gentler than the inner one usually is."
          rows={3} maxLength={1000}
          style={fieldStyle} />
      </Field>
      <SheetFooter onSave={save} disabled={!worry.trim()} saved={saved} label="Save the reframe" savedLabel="Reframed" helper={!worry.trim() ? 'Start with the worry itself.' : null} />
    </SheetShell>
  )
}

const fieldStyle = {
  width: '100%', background: T.card, border: `1px solid ${T.hair}`,
  borderRadius: T.r, padding: '12px 14px',
  fontFamily: T.serif, fontStyle: 'italic', fontSize: 14.5,
  color: T.text, lineHeight: 1.55, outline: 'none',
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: T.serif, fontSize: 13, fontStyle: 'italic', color: T.text, marginBottom: 6, letterSpacing: -0.1 }}>
        {label}
      </div>
      {children}
    </div>
  )
}

// ── Morning intention practice ──────────────────────────────────
function IntentionSheet({ open, onClose, onSave }) {
  const [text, setText] = useState('')
  const [saved, setSaved] = useState(false)

  if (!open) return null

  const save = () => {
    if (!text.trim()) return
    onSave({ kind: 'intention', content: text.trim() })
    setSaved(true)
    setTimeout(() => { setText(''); setSaved(false); onClose() }, 1000)
  }

  return (
    <SheetShell onClose={onClose} title="A morning intention" sub="One sentence. Today, in your own words.">
      <div style={{ fontFamily: T.serif, fontSize: 15.5, fontStyle: 'italic', color: T.text, lineHeight: 1.65, marginBottom: 14 }}>
        What is today really about? Not the to-do list — the one thing underneath it.
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)}
        placeholder="Today is about…"
        rows={3} maxLength={300}
        style={{ width: '100%', background: T.card, border: `1px solid ${T.hair}`, borderRadius: T.r, padding: '14px 16px', fontFamily: T.serif, fontStyle: 'italic', fontSize: 16, color: T.text, lineHeight: 1.55, outline: 'none' }} />
      <SheetFooter onSave={save} disabled={!text.trim()} saved={saved} label="Set the intention" savedLabel="Set" helper={!text.trim() ? 'One short line is plenty.' : null} />
    </SheetShell>
  )
}

// ── Body scan practice ──────────────────────────────────────────
// Three-minute guided text-walk down the body. Tap "next" or it
// auto-advances every ~25s. End with a reflection invitation.
const BODY_SCAN_STEPS = [
  {
    title: 'The crown of your head.',
    body: 'Notice the very top of your head — the soft pressure of air on skin, the warmth of hair, the very faint tug of your scalp. You don\'t need to change anything; just notice.',
  },
  {
    title: 'Your face and jaw.',
    body: 'Move attention down. Forehead, around the eyes, between the brows. Soften, if it wants to. Now the jaw — most of us hold the day there. Let your teeth part, just barely.',
  },
  {
    title: 'Your shoulders and chest.',
    body: 'Drop into your shoulders. They\'re probably an inch higher than they need to be. Exhale them down. Your chest rises and falls all by itself — let it.',
  },
  {
    title: 'Your belly and lower back.',
    body: 'Soften the belly. Most of us hold it in all day. Let it round on the inhale, sink on the exhale. Your lower back is doing all the carrying — say thank you.',
  },
  {
    title: 'Your hands and arms.',
    body: 'Notice your hands. Are they curled? Open them. Let your arms hang heavy, or rest where they are. The weight of an arm is the body asking for rest.',
  },
  {
    title: 'Your hips and pelvis.',
    body: 'Move attention to your pelvis. Whether you\'re sitting, lying, standing — let your hips be soft. The pelvic floor is part of this too; it doesn\'t need to brace right now.',
  },
  {
    title: 'Your legs and feet.',
    body: 'Down through thighs, knees, calves. Into the feet. The soles of your feet are touching something — the floor, the bed, a shoe. Feel that contact.',
  },
  {
    title: 'The whole body, at once.',
    body: 'Now hold the whole body in attention for a moment. Just here. Just this body, just today. You don\'t have to fix anything. Just noticed is enough.',
  },
]

function BodyScanSheet({ open, onClose, onSave }) {
  const [step, setStep] = useState(0)
  const [saved, setSaved] = useState(false)

  if (!open) return null

  const isLast = step >= BODY_SCAN_STEPS.length

  const save = () => {
    onSave({ kind: 'bodyscan', content: null })
    setSaved(true)
    setTimeout(() => { setStep(0); setSaved(false); onClose() }, 1000)
  }

  if (isLast) {
    return (
      <SheetShell onClose={onClose} title="A quick body scan" sub="Done.">
        <div className="glass-card" style={{ padding: 18, borderLeft: `3px solid ${T.accent}`, borderRadius: T.r, marginBottom: 14 }}>
          <div style={{ fontFamily: T.serif, fontSize: 17, fontStyle: 'italic', lineHeight: 1.55, color: T.text, letterSpacing: -0.1 }}>
            Whatever you noticed — tension, warmth, an ache that wanted attention — was the practice. Nothing to fix; just noticed. You can carry that softness with you for a while.
          </div>
        </div>
        <SheetFooter onSave={save} disabled={false} saved={saved} label="Keep this practice" savedLabel="Saved" helper={null} />
      </SheetShell>
    )
  }

  const s = BODY_SCAN_STEPS[step]
  return (
    <SheetShell onClose={onClose} title="A quick body scan" sub={`${step + 1} of ${BODY_SCAN_STEPS.length}`}>
      <div className="glass-card" style={{ padding: 18, borderLeft: `3px solid ${T.accent}`, borderRadius: T.r, marginBottom: 14 }}>
        <div style={{ fontFamily: T.serif, fontSize: 19, fontStyle: 'italic', lineHeight: 1.4, color: T.text, marginBottom: 10, letterSpacing: -0.2 }}>
          {s.title}
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 15.5, lineHeight: 1.65, color: T.text }}>
          {s.body}
        </div>
      </div>
      <button onClick={() => setStep(step + 1)}
        style={{ width: '100%', background: T.accent, color: '#fff', border: 'none', padding: '13px 14px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, letterSpacing: 0.4 }}>
        {step === BODY_SCAN_STEPS.length - 1 ? 'Hold the whole body' : 'Move on, slowly'}
      </button>
    </SheetShell>
  )
}

// ── Bedtime release practice ────────────────────────────────────
function BedtimeSheet({ open, onClose, onSave }) {
  const [stage, setStage] = useState('write')  // 'write' | 'breath' | 'done'
  const [text, setText] = useState('')
  const [saved, setSaved] = useState(false)

  if (!open) return null

  const save = () => {
    onSave({ kind: 'bedtime', content: text.trim() || null })
    setSaved(true)
    setTimeout(() => { setStage('write'); setText(''); setSaved(false); onClose() }, 1000)
  }

  if (stage === 'write') {
    return (
      <SheetShell onClose={onClose} title="A bedtime release" sub="Put the loop down before sleep.">
        <div style={{ fontFamily: T.serif, fontSize: 15.5, fontStyle: 'italic', color: T.text, lineHeight: 1.65, marginBottom: 14 }}>
          Anything still rattling around — write it down. Your future self will know what to do tomorrow. You don't have to carry it overnight.
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)}
          placeholder="The thing the brain won't let go of…"
          rows={4} maxLength={1500}
          style={{ width: '100%', background: T.card, border: `1px solid ${T.hair}`, borderRadius: T.r, padding: '14px 16px', fontFamily: T.serif, fontStyle: 'italic', fontSize: 15, color: T.text, lineHeight: 1.55, outline: 'none' }} />
        <button onClick={() => setStage('breath')}
          style={{ width: '100%', marginTop: 14, background: T.accent, color: '#fff', border: 'none', padding: '13px 14px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, letterSpacing: 0.4 }}>
          Now, breathe with me
        </button>
      </SheetShell>
    )
  }

  if (stage === 'breath') {
    return (
      <SheetShell onClose={onClose} title="A bedtime release" sub="Slow exhale signals 'rest now' to the nervous system.">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 4px' }}>
          <div className="breath-circle" data-phase="exhale"
            style={{
              width: 180, height: 180, borderRadius: '50%',
              background: `radial-gradient(circle, ${T.accent}30 0%, ${T.accent}10 60%, transparent 100%)`,
              border: `1px solid ${T.hair}`,
              transformOrigin: 'center', marginBottom: 18,
              animation: 'breathLoop 12s ease-in-out infinite',
            }} />
          <div style={{ fontFamily: T.serif, fontSize: 18, fontStyle: 'italic', color: T.text, marginBottom: 6 }}>
            In for four. Hold for seven. Out for eight.
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 14, fontStyle: 'italic', color: T.muted, marginBottom: 18, textAlign: 'center', lineHeight: 1.55 }}>
            Four cycles is enough to start the wind-down. More if it feels right.
          </div>
        </div>
        <button onClick={save}
          className={saved ? 'success-pulse' : ''}
          style={{ width: '100%', background: T.accent, color: '#fff', border: 'none', padding: '13px 14px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, letterSpacing: 0.4 }}>
          {saved ? 'Released' : 'Done — keep this practice'}
        </button>
      </SheetShell>
    )
  }

  return null
}

// ── Sheet shell + footer ────────────────────────────────────────
function SheetShell({ onClose, title, sub, children }) {
  useScrollLock(true)
  return (
    <div onClick={onClose}
      onTouchMove={(e) => e.preventDefault()}
      onWheel={(e) => e.preventDefault()}
      style={{
        position: 'fixed', inset: 0, zIndex: 220,
        background: 'rgba(26,19,16,0.45)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        animation: 'fadeIn 0.25s ease-out both',
        touchAction: 'none',
        overscrollBehavior: 'contain',
      }}>
      <div onClick={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 430,
          background: T.bg,
          borderTopLeftRadius: 16, borderTopRightRadius: 16,
          maxHeight: '88dvh',
          display: 'flex', flexDirection: 'column',
          animation: 'fadeUp 0.32s cubic-bezier(0.34, 1.36, 0.64, 1) both',
          overflow: 'hidden',
        }}>
        <div style={{ padding: '14px 20px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${T.hair}` }}>
          <div>
            <div style={{ fontFamily: T.serif, fontSize: 17, fontStyle: 'italic', color: T.text, letterSpacing: -0.2 }}>{title}</div>
            {sub && <div style={{ fontFamily: T.sans, fontSize: 10.5, color: T.muted, marginTop: 3, letterSpacing: 0.2 }}>{sub}</div>}
          </div>
          <button onClick={onClose} aria-label="Close"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.muted, padding: 8, fontSize: 16, fontFamily: T.sans }}>
            ✕
          </button>
        </div>
        <div style={{ padding: '16px 18px', overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  )
}

function SheetFooter({ onSave, disabled, saved, label, savedLabel, helper }) {
  return (
    <>
      {helper && (
        <div style={{ fontFamily: T.serif, fontSize: 12.5, color: T.muted, fontStyle: 'italic', textAlign: 'center', marginTop: 12, marginBottom: 6 }}>
          {helper}
        </div>
      )}
      <button onClick={onSave} disabled={disabled}
        className={saved ? 'success-pulse' : ''}
        style={{
          width: '100%', marginTop: 14,
          background: disabled ? T.hair : T.accent,
          color: disabled ? T.muted : '#fff', border: 'none',
          padding: '13px 14px', borderRadius: T.r,
          cursor: disabled ? 'default' : 'pointer',
          fontFamily: T.sans, fontSize: 13, fontWeight: 600, letterSpacing: 0.4,
        }}>
        {saved ? savedLabel : label}
      </button>
    </>
  )
}

// ── Reflect screen ──────────────────────────────────────────────
export default function Reflect() {
  const store = useLuna()
  const { back, settings, updateSetting, displayName, session, activeReflectPractice, setActiveReflectPractice } = store
  const cycle = useCycle(store)
  const phase = cycle.phase
  const history = settings?.reflectHistory || []

  const [openPractice, setOpenPractice] = useState(null)
  const [quickNoteOpen, setQuickNoteOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  // Auto-open a deep-linked practice (e.g. when HeavyHelper sends the
  // user here pointed at compassion or reframe), then clear the
  // request so it doesn't fire again on re-render.
  useEffect(() => {
    if (activeReflectPractice) {
      setOpenPractice(activeReflectPractice)
      setActiveReflectPractice(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeReflectPractice])

  // The phase-aware recommendation for this week.
  const recommendation = phase ? PHASE_PRACTICE[phase.id] : null

  const handleSavePractice = (entry) => {
    const next = [
      ...history,
      { ...entry, dateISO: new Date().toISOString().slice(0, 10), recordedAt: new Date().toISOString() },
    ].slice(-60)  // keep last ~2 months
    updateSetting('reflectHistory', next)
  }

  // Practice count by kind for the recap card.
  const counts = useMemo(() => {
    const c = {}
    history.forEach((e) => { c[e.kind] = (c[e.kind] || 0) + 1 })
    return c
  }, [history])

  const opening = phase ? PHASE_OPENING[phase.id] : null
  const firstName = (displayName || '').trim().split(' ')[0]

  return (
    <Screen padBottom={40}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="reflect" onBack={back} />
        <Eyebrow>For your mind and heart</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 32, fontWeight: 500, letterSpacing: -0.7, lineHeight: 1.05 }}>
          {firstName ? `Sit a minute, ${firstName}.` : 'Sit a minute.'}
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 15, lineHeight: 1.6, color: T.muted, marginTop: 12, fontStyle: 'italic' }}>
          {opening || 'Write what wants to be written. Or pick a practice — short, gentle, evidence-grown.'}
        </div>
        <Rule />

        {/* Phase-aware practice recommendation — the feature that makes
            Luna's wellness distinctly female. Grounded in cycle-phase
            psychology. */}
        {recommendation && (
          <button onClick={() => setOpenPractice(recommendation.id)} className="glass-card"
            style={{
              width: '100%', textAlign: 'left', padding: 16, borderRadius: T.r,
              borderLeft: `3px solid ${phase.color}`,
              cursor: 'pointer', color: T.text, fontFamily: 'inherit', display: 'block',
              marginBottom: 22,
            }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 1.2, fontWeight: 600, color: phase.color }}>
                {recommendation.eyebrow}
              </div>
              <div style={{ fontFamily: T.sans, fontSize: 10, color: T.accent, fontWeight: 600, letterSpacing: 0.3 }}>
                Start the practice →
              </div>
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 16, fontStyle: 'italic', lineHeight: 1.5, color: T.text, letterSpacing: -0.1 }}>
              {recommendation.line}
            </div>
          </button>
        )}

        {/* Write freely */}
        <Eyebrow>Write</Eyebrow>
        <button onClick={() => setQuickNoteOpen(true)} className="glass-card"
          style={{
            width: '100%', textAlign: 'left', padding: 16, borderRadius: T.r,
            borderLeft: `3px solid ${T.accent}`, cursor: 'pointer', color: T.text, fontFamily: 'inherit',
            display: 'block', marginBottom: 22,
          }}>
          <div style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 500, lineHeight: 1.3, letterSpacing: -0.2, marginBottom: 6 }}>
            A note to your future self →
          </div>
          <div style={{ fontFamily: T.sans, fontSize: 12, color: T.muted, lineHeight: 1.5 }}>
            One line, a sentence, a paragraph. Saved to today.
          </div>
        </button>

        {/* Guided practices */}
        <Eyebrow>Or sit with one of these</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
          {PRACTICES.map((p) => (
            <button key={p.id} onClick={() => setOpenPractice(p.id)} className="glass-card"
              style={{
                width: '100%', textAlign: 'left', padding: 16, borderRadius: T.r,
                cursor: 'pointer', color: T.text, fontFamily: 'inherit', display: 'block',
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <div style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 500, lineHeight: 1.3, letterSpacing: -0.2 }}>
                  {p.title}
                </div>
                {counts[p.kind] > 0 && (
                  <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.muted, letterSpacing: 0.6, fontWeight: 600 }}>
                    ×{counts[p.kind]}
                  </div>
                )}
              </div>
              <div style={{ fontFamily: T.serif, fontSize: 13.5, color: T.muted, fontStyle: 'italic', lineHeight: 1.5, marginBottom: 8 }}>
                {p.sub}
              </div>
              <div style={{ fontFamily: T.sans, fontSize: 11.5, color: T.text, lineHeight: 1.55, opacity: 0.85, marginBottom: 8 }}>
                {p.blurb}
              </div>
              <div style={{ fontFamily: T.sans, fontSize: 11, color: T.accent, fontWeight: 600, letterSpacing: 0.3 }}>
                {p.cta} →
              </div>
            </button>
          ))}
        </div>

        {/* Talk to Luna */}
        <Eyebrow>Or just talk it through</Eyebrow>
        <button onClick={() => setChatOpen(true)} className="glass-card"
          style={{
            width: '100%', textAlign: 'left', padding: 16, borderRadius: T.r,
            borderLeft: `3px solid ${phase?.color || T.accent}`,
            cursor: 'pointer', color: T.text, fontFamily: 'inherit', display: 'block', marginBottom: 22,
          }}>
          <div style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 500, lineHeight: 1.3, letterSpacing: -0.2, marginBottom: 6 }}>
            A few minutes with Luna →
          </div>
          <div style={{ fontFamily: T.sans, fontSize: 12, color: T.muted, lineHeight: 1.5 }}>
            A small reflective conversation. Hard-capped so it stays a check-in, not a chat trap.
          </div>
        </button>

        {/* Recap of past reflections */}
        {history.length > 0 && (
          <>
            <Rule />
            <Eyebrow>Your practice so far</Eyebrow>
            <div style={{ fontFamily: T.serif, fontSize: 14.5, lineHeight: 1.65, color: T.text, fontStyle: 'italic' }}>
              {history.length} reflection{history.length === 1 ? '' : 's'} kept{counts.gratitude ? ` — including ${counts.gratitude} round${counts.gratitude === 1 ? '' : 's'} of three good things` : ''}{counts.feeling ? `, ${counts.feeling} time${counts.feeling === 1 ? '' : 's'} naming a feeling` : ''}{counts.compassion ? `, ${counts.compassion} self-compassion pause${counts.compassion === 1 ? '' : 's'}` : ''}{counts.reframe ? `, ${counts.reframe} reframe${counts.reframe === 1 ? '' : 's'}` : ''}.
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 13, color: T.muted, fontStyle: 'italic', lineHeight: 1.55, marginTop: 10 }}>
              Saved on this device. Use it as a small library to come back to.
            </div>
          </>
        )}

        <SourceLine>Practices grounded in positive psychology, mindful self-compassion, CBT, and affect-labelling research.</SourceLine>
        <div style={{ height: 16 }} />
      </div>

      {/* Practice overlays */}
      <IntentionSheet  open={openPractice === 'intention'}  onClose={() => setOpenPractice(null)} onSave={handleSavePractice} />
      <GratitudeSheet  open={openPractice === 'gratitude'}  onClose={() => setOpenPractice(null)} onSave={handleSavePractice} />
      <FeelingSheet    open={openPractice === 'feeling'}    onClose={() => setOpenPractice(null)} onSave={handleSavePractice} />
      <BodyScanSheet   open={openPractice === 'bodyscan'}   onClose={() => setOpenPractice(null)} onSave={handleSavePractice} />
      <CompassionSheet open={openPractice === 'compassion'} onClose={() => setOpenPractice(null)} onSave={handleSavePractice} />
      <ReframeSheet    open={openPractice === 'reframe'}    onClose={() => setOpenPractice(null)} onSave={handleSavePractice} />
      <BedtimeSheet    open={openPractice === 'bedtime'}    onClose={() => setOpenPractice(null)} onSave={handleSavePractice} />

      {/* Existing overlays */}
      <QuickNote open={quickNoteOpen} onClose={() => setQuickNoteOpen(false)} />
      {/* Chat mounted unconditionally so the button always responds.
          Phase context only passed when available. */}
      <LunaChat
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        opener={null}
        context={phase ? { phaseId: phase.id, phaseName: phase.name, cycleDay: cycle.cycleDay, cycleLength: cycle.cycleLength } : {}}
      />
    </Screen>
  )
}
