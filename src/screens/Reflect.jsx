import { useState, useMemo, useEffect, useRef } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, Rule, Screen, SourceLine } from '../components/shared'
import { PhaseFlourish } from '../components/phaseFlourishes'
import { sectionColors, sectionPaper } from '../data/sectionPalette'
import { todayKey } from '../lib/dateOnly'

// One soft category per practice — gives each practice its own
// chromatic identity in the picker list. Intention/gratitude/feeling
// wear reflect (lavender); bodyscan wears body (peach); compassion
// wears intimate (mauve); reframe wears read (sage — "thinking
// through"); bedtime wears plan (moonlight).
const PRACTICE_SECTION = {
  intention:  'reflect',
  gratitude:  'reflect',
  feeling:    'reflect',
  bodyscan:   'body',
  compassion: 'intimate',
  reframe:    'read',
  bedtime:    'plan',
}
import useLuna from '../store/useLuna'
import { useCycle } from '../hooks/useCycle'
import QuickNote from '../components/QuickNote'
import LunaChat from '../components/LunaChat'
import { useScrollLock } from '../lib/useScrollLock'
import Portal from '../lib/Portal'

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
function GratitudeSheet({ open, onClose, onSave, history = [], onOpenNote, onOpenChat }) {
  const [items, setItems] = useState(['', '', ''])
  const [stage, setStage] = useState('write')  // 'write' | 'done'
  const [savedItems, setSavedItems] = useState([])

  if (!open) return null

  const update = (i, v) => setItems((curr) => curr.map((x, idx) => idx === i ? v : x))
  const filled = items.filter((t) => t.trim().length > 0).length

  const save = () => {
    if (filled === 0) return
    const list = items.filter((t) => t.trim()).map((t) => t.trim())
    onSave({ kind: 'gratitude', content: list })
    setSavedItems(list)
    setStage('done')
  }

  const reset = () => { setItems(['', '', '']); setStage('write'); setSavedItems([]); onClose() }

  if (stage === 'done') {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30)
    const recent = history.filter((e) => e.kind === 'gratitude' && new Date(e.dateISO + 'T12:00:00') >= cutoff).length
    return (
      <SheetShell onClose={reset} title="Three small things" sub="Done.">
        <div className="glass-card" style={{ padding: 18, borderLeft: `3px solid ${T.accent}`, borderRadius: T.r, marginBottom: 14 }}>
          <div style={{ fontFamily: T.serif, fontSize: 17, fontStyle: 'italic', lineHeight: 1.55, color: T.text, letterSpacing: -0.1, marginBottom: 12 }}>
            You named {savedItems.length} thing{savedItems.length === 1 ? '' : 's'} that landed today.
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 14, lineHeight: 1.6, color: T.muted, fontStyle: 'italic' }}>
            The brain notices what we point it at. In a 2005 trial, six months of this practice measurably lifted mood and reduced depression — durable, not a feeling. {recent >= 3 && <strong style={{ fontWeight: 600, fontStyle: 'normal', color: T.accent }}>{recent} rounds of this in the last month.</strong>}
          </div>
        </div>
        <div className="glass-card" style={{ padding: 14, borderRadius: T.r, marginBottom: 14, background: 'rgba(200,78,46,0.04)' }}>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, letterSpacing: -0.1, fontWeight: 500, color: T.muted, marginBottom: 8 }}>
            What you wrote
          </div>
          {savedItems.map((it, i) => (
            <div key={i} style={{ fontFamily: T.serif, fontSize: 14.5, lineHeight: 1.55, color: T.text, marginBottom: i === savedItems.length - 1 ? 0 : 8 }}>
              · {it}
            </div>
          ))}
        </div>
        <div className="glass-card" style={{ padding: 14, borderRadius: T.r, marginBottom: 14, borderLeft: `3px solid ${T.muted}` }}>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, letterSpacing: -0.1, fontWeight: 500, color: T.muted, marginBottom: 6 }}>
            What helps next
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 14, lineHeight: 1.6, color: T.text, marginBottom: 10, fontStyle: 'italic' }}>
            Protect what just landed — write a note about the day so future-you can come back to it.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => { reset(); onOpenNote?.() }}
              style={{ background: 'transparent', color: T.accent, border: `1px solid ${T.accent}`, padding: '9px 14px', cursor: 'pointer', fontFamily: T.sans, fontSize: 11.5, fontWeight: 600, borderRadius: T.r, letterSpacing: 0.3 }}>
              Write a note about today →
            </button>
            <button onClick={() => { reset(); onOpenChat?.() }}
              style={{ background: 'transparent', color: T.text, border: `1px solid ${T.hair}`, padding: '9px 14px', cursor: 'pointer', fontFamily: T.sans, fontSize: 11.5, fontWeight: 500, borderRadius: T.r, letterSpacing: 0.3 }}>
              Talk to Luna →
            </button>
          </div>
        </div>
        <button onClick={reset}
          style={{ width: '100%', background: T.accent, color: '#fff', border: 'none', padding: '13px 14px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, letterSpacing: 0.4 }}>
          Close
        </button>
      </SheetShell>
    )
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
        saved={false}
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

// Context-aware help routing per emotion word. Each entry maps to a
// concrete next action — the screen the user should land on if she
// wants to do something about what she just named.
function feelingHelp(word, phaseId) {
  const w = (word || '').toLowerCase()
  if (['anxious', 'restless', 'worried', 'overwhelmed', 'irritable'].includes(w)) {
    return {
      line: w === 'overwhelmed'
        ? "Overwhelm is too many open loops. The brain needs a list. Want to put them down?"
        : "Want to sit with anxiety, specifically? Paced breath is the most effective first move.",
      primary: { label: 'Sit with anxiety →', action: 'anxiety' },
      secondary: { label: 'Write it out', action: 'note' },
    }
  }
  if (['lonely', 'empty', 'disconnected'].includes(w)) {
    return {
      line: "Want company? Luna's here — or you can write to someone you might call later.",
      primary: { label: 'Talk to Luna →', action: 'chat' },
      secondary: { label: 'Write a note', action: 'note' },
    }
  }
  if (['sad', 'grief', 'disappointed', 'aching', 'longing'].includes(w)) {
    return {
      line: "Heavy feelings don't ask to be fixed. They ask to be held. Want a self-compassion pause?",
      primary: { label: 'A pause →', action: 'compassion' },
      secondary: { label: 'Talk to Luna', action: 'chat' },
    }
  }
  if (['numb', 'flat', 'detached', 'bored'].includes(w)) {
    return {
      line: "Numb is the body protecting you. A body scan can gently bring you back to yourself.",
      primary: { label: 'Body scan →', action: 'bodyscan' },
      secondary: { label: 'Write a note', action: 'note' },
    }
  }
  if (['tired'].includes(w)) {
    return {
      line: "Tired is data, not a verdict. Want to look at what tonight could be?",
      primary: { label: 'Tonight, wind down →', action: 'insomnia' },
      secondary: { label: 'Write a note', action: 'note' },
    }
  }
  if (['hopeful', 'curious', 'energized', 'grateful', 'joyful', 'confident', 'playful', 'in love', 'proud', 'settled'].includes(w)) {
    return {
      line: "These are worth marking. Future-you will want to read this back.",
      primary: { label: 'Write a note →', action: 'note' },
      secondary: phaseId === 'follicular' || phaseId === 'ovulation'
        ? { label: 'Set an intention', action: 'intention' }
        : { label: 'Talk to Luna', action: 'chat' },
    }
  }
  return {
    line: "Naming it was the work. Want to do more?",
    primary: { label: 'Write a note →', action: 'note' },
    secondary: { label: 'Talk to Luna', action: 'chat' },
  }
}

function FeelingSheet({ open, onClose, onSave, phase, history = [], onOpenNote, onOpenChat, onOpenHelper, onOpenPractice }) {
  const [stage, setStage] = useState('top')
  const [topPick, setTopPick] = useState(null)
  const [picked, setPicked] = useState(null)
  const [doneAt, setDoneAt] = useState(null)

  if (!open) return null

  const top = FEELING_LAYERS.find((l) => l.id === topPick)
  const note = picked ? FEELING_NOTES[picked] : null

  const save = () => {
    if (!picked) return
    onSave({ kind: 'feeling', content: { top: topPick, word: picked } })
    setDoneAt(picked)
    setStage('done')
  }

  const reset = () => { setStage('top'); setTopPick(null); setPicked(null); setDoneAt(null); onClose() }
  const handleHelp = (action) => {
    reset()
    setTimeout(() => {
      if (action === 'note') onOpenNote?.()
      else if (action === 'chat') onOpenChat?.()
      else if (['anxiety', 'insomnia', 'cramps'].includes(action)) onOpenHelper?.(action)
      else if (['compassion', 'bodyscan', 'intention', 'reframe'].includes(action)) onOpenPractice?.(action)
    }, 50)
  }

  if (stage === 'done' && doneAt) {
    const lutealNote = phase?.id === 'luteal'
      ? "Late-luteal serotonin drops can make every feeling louder. You named it precisely — that itself reduces the intensity a little."
      : null
    const recentFeelings = history.filter((e) => e.kind === 'feeling').slice(-5).length
    const help = feelingHelp(doneAt, phase?.id)
    return (
      <SheetShell onClose={reset} title="Named." sub={`You wrote: ${doneAt.toLowerCase()}.`}>
        <div className="glass-card" style={{ padding: 18, borderLeft: `3px solid ${T.accent}`, borderRadius: T.r, marginBottom: 14 }}>
          <div style={{ fontFamily: T.serif, fontSize: 17, fontStyle: 'italic', lineHeight: 1.55, color: T.text, letterSpacing: -0.1, marginBottom: 10 }}>
            {doneAt} — named. The body usually relaxes a fraction the moment you name precisely.
          </div>
          {lutealNote && (
            <div style={{ fontFamily: T.serif, fontSize: 13.5, lineHeight: 1.6, color: T.muted, fontStyle: 'italic', paddingTop: 8, borderTop: `1px solid ${T.hair}` }}>
              {lutealNote}
            </div>
          )}
          {recentFeelings >= 3 && (
            <div style={{ fontFamily: T.serif, fontSize: 13.5, lineHeight: 1.6, color: T.accent, fontStyle: 'italic', paddingTop: 8, borderTop: `1px solid ${T.hair}` }}>
              {recentFeelings} feelings named this stretch — emotional granularity in practice.
            </div>
          )}
        </div>
        <div className="glass-card" style={{ padding: 14, borderRadius: T.r, marginBottom: 14, borderLeft: `3px solid ${T.muted}` }}>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, letterSpacing: -0.1, fontWeight: 500, color: T.muted, marginBottom: 6 }}>
            What helps next
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 14, lineHeight: 1.6, color: T.text, marginBottom: 10 }}>
            {help.line}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => handleHelp(help.primary.action)}
              style={{ background: T.accent, color: '#fff', border: 'none', padding: '9px 14px', cursor: 'pointer', fontFamily: T.sans, fontSize: 11.5, fontWeight: 600, borderRadius: T.r, letterSpacing: 0.3 }}>
              {help.primary.label}
            </button>
            <button onClick={() => handleHelp(help.secondary.action)}
              style={{ background: 'transparent', color: T.text, border: `1px solid ${T.hair}`, padding: '9px 14px', cursor: 'pointer', fontFamily: T.sans, fontSize: 11.5, fontWeight: 500, borderRadius: T.r, letterSpacing: 0.3 }}>
              {help.secondary.label}
            </button>
          </div>
        </div>
        <button onClick={reset}
          style={{ width: '100%', background: 'transparent', border: `1px solid ${T.hair}`, color: T.muted, padding: '11px 14px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans, fontSize: 12, fontWeight: 500 }}>
          Close
        </button>
      </SheetShell>
    )
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
        saved={false}
        label="Save the word"
        savedLabel="Named"
        helper={!picked && stage === 'inner' ? 'Pick the word that fits.' : null}
      />
    </SheetShell>
  )
}

// ── Self-compassion practice (Neff three-step) ──────────────────
function CompassionSheet({ open, onClose, onSave, phase, history = [], onOpenNote, onOpenChat }) {
  const [step, setStep] = useState(0)
  const [reflection, setReflection] = useState('')
  const [savedReflection, setSavedReflection] = useState('')

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
    setSavedReflection(reflection.trim())
    setStep(lines.length + 1)  // done state
  }

  const reset = () => { setStep(0); setReflection(''); setSavedReflection(''); onClose() }

  if (step === lines.length + 1) {
    const recent = history.filter((e) => e.kind === 'compassion').length
    const lutealNote = phase?.id === 'luteal'
      ? "In luteal, this is the single most protective practice for your week. Serotonin drops; the inner voice gets sharper. You picked the right tool."
      : null
    return (
      <SheetShell onClose={reset} title="Held." sub="A small kindness landed.">
        <div className="glass-card" style={{ padding: 18, borderLeft: `3px solid ${T.accent}`, borderRadius: T.r, marginBottom: 14 }}>
          <div style={{ fontFamily: T.serif, fontSize: 17, fontStyle: 'italic', lineHeight: 1.55, color: T.text, letterSpacing: -0.1, marginBottom: 10 }}>
            Two minutes of softness toward yourself. The body registers that, even when you don't feel it.
          </div>
          {lutealNote && (
            <div style={{ fontFamily: T.serif, fontSize: 13.5, lineHeight: 1.6, color: T.muted, fontStyle: 'italic', paddingTop: 8, borderTop: `1px solid ${T.hair}` }}>
              {lutealNote}
            </div>
          )}
          {recent >= 3 && (
            <div style={{ fontFamily: T.serif, fontSize: 13.5, lineHeight: 1.6, color: T.accent, fontStyle: 'italic', paddingTop: 8, borderTop: `1px solid ${T.hair}` }}>
              {recent} pauses like this so far — the inner voice is being trained, even when you can't tell yet.
            </div>
          )}
        </div>
        {savedReflection && (
          <div className="glass-card" style={{ padding: 14, borderRadius: T.r, marginBottom: 14, background: 'rgba(200,78,46,0.04)' }}>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, letterSpacing: -0.1, fontWeight: 500, color: T.muted, marginBottom: 6 }}>
              You wrote
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 15, fontStyle: 'italic', lineHeight: 1.55, color: T.text }}>
              {savedReflection}
            </div>
          </div>
        )}
        <div className="glass-card" style={{ padding: 14, borderRadius: T.r, marginBottom: 14, borderLeft: `3px solid ${T.muted}` }}>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, letterSpacing: -0.1, fontWeight: 500, color: T.muted, marginBottom: 6 }}>
            What helps next
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 14, lineHeight: 1.6, color: T.text, marginBottom: 10 }}>
            One small kindness toward yourself in the next hour — a snack, five minutes outside, a stretch, a slower next thing. The practice extends into the day when you let it.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => { reset(); onOpenChat?.() }}
              style={{ background: T.accent, color: '#fff', border: 'none', padding: '9px 14px', cursor: 'pointer', fontFamily: T.sans, fontSize: 11.5, fontWeight: 600, borderRadius: T.r, letterSpacing: 0.3 }}>
              Talk to Luna →
            </button>
            <button onClick={() => { reset(); onOpenNote?.() }}
              style={{ background: 'transparent', color: T.text, border: `1px solid ${T.hair}`, padding: '9px 14px', cursor: 'pointer', fontFamily: T.sans, fontSize: 11.5, fontWeight: 500, borderRadius: T.r, letterSpacing: 0.3 }}>
              A note to your future self
            </button>
          </div>
        </div>
        <button onClick={reset}
          style={{ width: '100%', background: 'transparent', border: `1px solid ${T.hair}`, color: T.muted, padding: '11px 14px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans, fontSize: 12, fontWeight: 500 }}>
          Close
        </button>
      </SheetShell>
    )
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
      <SheetFooter onSave={save} disabled={false} saved={false} label="Save the pause" savedLabel="Held" helper={null} />
    </SheetShell>
  )
}

// ── Worry reframe practice (CBT) ────────────────────────────────
function ReframeSheet({ open, onClose, onSave, history = [], onOpenChat }) {
  const [worry, setWorry] = useState('')
  const [alternative, setAlternative] = useState('')
  const [friend, setFriend] = useState('')
  const [stage, setStage] = useState('write')  // 'write' | 'done'
  const [savedTriple, setSavedTriple] = useState(null)

  if (!open) return null

  const save = () => {
    if (!worry.trim()) return
    const triple = { worry: worry.trim(), alternative: alternative.trim() || null, friend: friend.trim() || null }
    onSave({ kind: 'reframe', content: triple })
    setSavedTriple(triple)
    setStage('done')
  }

  const reset = () => { setWorry(''); setAlternative(''); setFriend(''); setStage('write'); setSavedTriple(null); onClose() }

  if (stage === 'done' && savedTriple) {
    const recent = history.filter((e) => e.kind === 'reframe').length
    return (
      <SheetShell onClose={reset} title="Reframed." sub="Two voices, side by side.">
        <div className="glass-card" style={{ padding: 18, borderLeft: `3px solid ${T.accent}`, borderRadius: T.r, marginBottom: 14 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, letterSpacing: -0.1, fontWeight: 500, color: T.muted, marginBottom: 6 }}>
              The worry, as it lives
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 15, fontStyle: 'italic', lineHeight: 1.55, color: T.text }}>
              "{savedTriple.worry}"
            </div>
          </div>
          {savedTriple.friend && (
            <div style={{ paddingTop: 14, borderTop: `1px solid ${T.hair}` }}>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, letterSpacing: -0.1, fontWeight: 500, color: T.accent, marginBottom: 6 }}>
                The voice you'd offer a friend
              </div>
              <div style={{ fontFamily: T.serif, fontSize: 15, fontStyle: 'italic', lineHeight: 1.55, color: T.accent }}>
                "{savedTriple.friend}"
              </div>
            </div>
          )}
          <div style={{ fontFamily: T.serif, fontSize: 14, lineHeight: 1.65, color: T.text, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.hair}` }}>
            <strong style={{ fontWeight: 600 }}>The second voice is the truer one</strong> — and the one you usually withhold from yourself. Read both back when the worry returns. {recent >= 3 && <span style={{ color: T.muted, fontStyle: 'italic' }}>{recent} reframes saved so far — they accumulate.</span>}
          </div>
        </div>
        <div className="glass-card" style={{ padding: 14, borderRadius: T.r, marginBottom: 14, borderLeft: `3px solid ${T.muted}` }}>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, letterSpacing: -0.1, fontWeight: 500, color: T.muted, marginBottom: 6 }}>
            What helps next
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 14, lineHeight: 1.6, color: T.text, marginBottom: 10 }}>
            When the worry comes back tonight or tomorrow — your reframes are kept in Reflect. The friend-voice is yours to come back to.
          </div>
          <button onClick={() => { reset(); onOpenChat?.() }}
            style={{ background: T.accent, color: '#fff', border: 'none', padding: '9px 14px', cursor: 'pointer', fontFamily: T.sans, fontSize: 11.5, fontWeight: 600, borderRadius: T.r, letterSpacing: 0.3 }}>
            Talk this through with Luna →
          </button>
        </div>
        <button onClick={reset}
          style={{ width: '100%', background: 'transparent', border: `1px solid ${T.hair}`, color: T.muted, padding: '11px 14px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans, fontSize: 12, fontWeight: 500 }}>
          Close
        </button>
      </SheetShell>
    )
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
      <SheetFooter onSave={save} disabled={!worry.trim()} saved={false} label="Save the reframe" savedLabel="Reframed" helper={!worry.trim() ? 'Start with the worry itself.' : null} />
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
function IntentionSheet({ open, onClose, onSave, history = [], onOpenNote, onOpenChat }) {
  const [text, setText] = useState('')
  const [stage, setStage] = useState('write')
  const [savedText, setSavedText] = useState('')

  if (!open) return null

  const save = () => {
    if (!text.trim()) return
    onSave({ kind: 'intention', content: text.trim() })
    setSavedText(text.trim())
    setStage('done')
  }

  const reset = () => { setText(''); setStage('write'); setSavedText(''); onClose() }

  if (stage === 'done') {
    const recent = history.filter((e) => e.kind === 'intention').length
    return (
      <SheetShell onClose={reset} title="Set." sub="Luna will hold this for you today.">
        <div className="glass-card" style={{ padding: 18, borderLeft: `3px solid ${T.accent}`, borderRadius: T.r, marginBottom: 14 }}>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, letterSpacing: -0.1, fontWeight: 500, color: T.muted, marginBottom: 8 }}>
            Today is about
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 19, fontStyle: 'italic', lineHeight: 1.4, color: T.text, letterSpacing: -0.2, marginBottom: 14 }}>
            "{savedText}"
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 14, lineHeight: 1.6, color: T.muted, fontStyle: 'italic' }}>
            Luna will bring this back this evening — to ask how the day landed against it. {recent >= 4 && <strong style={{ fontWeight: 600, fontStyle: 'normal', color: T.accent }}>{recent} intentions set so far — a real practice.</strong>}
          </div>
        </div>
        <div className="glass-card" style={{ padding: 14, borderRadius: T.r, marginBottom: 14, borderLeft: `3px solid ${T.muted}` }}>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, letterSpacing: -0.1, fontWeight: 500, color: T.muted, marginBottom: 6 }}>
            What helps next
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 14, lineHeight: 1.6, color: T.text, marginBottom: 10 }}>
            Move into the day with this. If a decision comes up that doesn't match — that's a signal worth following.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => { reset(); onOpenNote?.() }}
              style={{ background: T.accent, color: '#fff', border: 'none', padding: '9px 14px', cursor: 'pointer', fontFamily: T.sans, fontSize: 11.5, fontWeight: 600, borderRadius: T.r, letterSpacing: 0.3 }}>
              Add a note about why →
            </button>
            <button onClick={() => { reset(); onOpenChat?.() }}
              style={{ background: 'transparent', color: T.text, border: `1px solid ${T.hair}`, padding: '9px 14px', cursor: 'pointer', fontFamily: T.sans, fontSize: 11.5, fontWeight: 500, borderRadius: T.r, letterSpacing: 0.3 }}>
              Talk to Luna
            </button>
          </div>
        </div>
        <button onClick={reset}
          style={{ width: '100%', background: 'transparent', border: `1px solid ${T.hair}`, color: T.muted, padding: '11px 14px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans, fontSize: 12, fontWeight: 500 }}>
          Close — carry it with you
        </button>
      </SheetShell>
    )
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
      <SheetFooter onSave={save} disabled={!text.trim()} saved={false} label="Set the intention" savedLabel="Set" helper={!text.trim() ? 'One short line is plenty.' : null} />
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

function BodyScanSheet({ open, onClose, onSave, phase, history = [], onOpenNote }) {
  const [step, setStep] = useState(0)
  const [stage, setStage] = useState('walk')  // 'walk' | 'done'

  if (!open) return null

  const isLast = step >= BODY_SCAN_STEPS.length

  const save = () => {
    onSave({ kind: 'bodyscan', content: null })
    setStage('done')
  }

  const reset = () => { setStep(0); setStage('walk'); onClose() }

  if (stage === 'done') {
    const recent = history.filter((e) => e.kind === 'bodyscan').length
    const phaseNote =
      phase?.id === 'menstrual'
        ? "Your body is doing real work this week. This practice lands deeper now — the system is already in protective mode."
        : phase?.id === 'luteal'
          ? "Late luteal often makes the body feel louder. This is exactly the practice the week asks for."
          : phase?.id === 'follicular'
            ? "Estrogen is rising — the body's window for new movement opens here. This scan + a short walk is a small ritual worth keeping."
            : null
    return (
      <SheetShell onClose={reset} title="Held." sub="The body was noticed.">
        <div className="glass-card" style={{ padding: 18, borderLeft: `3px solid ${T.accent}`, borderRadius: T.r, marginBottom: 14 }}>
          <div style={{ fontFamily: T.serif, fontSize: 17, fontStyle: 'italic', lineHeight: 1.55, color: T.text, letterSpacing: -0.1, marginBottom: 10 }}>
            Eight stops on the body's tour. Whatever you noticed — tension, warmth, an ache that wanted attention — was the practice. Nothing to fix; just noticed.
          </div>
          {phaseNote && (
            <div style={{ fontFamily: T.serif, fontSize: 13.5, lineHeight: 1.6, color: T.muted, fontStyle: 'italic', paddingTop: 8, borderTop: `1px solid ${T.hair}` }}>
              {phaseNote}
            </div>
          )}
          {recent >= 3 && (
            <div style={{ fontFamily: T.serif, fontSize: 13.5, lineHeight: 1.6, color: T.accent, fontStyle: 'italic', paddingTop: 8, borderTop: `1px solid ${T.hair}` }}>
              {recent} scans like this so far — the body remembers it's allowed to be soft.
            </div>
          )}
        </div>
        <div className="glass-card" style={{ padding: 14, borderRadius: T.r, marginBottom: 14, borderLeft: `3px solid ${T.muted}` }}>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, letterSpacing: -0.1, fontWeight: 500, color: T.muted, marginBottom: 6 }}>
            What helps next
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 14, lineHeight: 1.6, color: T.text, marginBottom: 10 }}>
            A short walk (5–10 min, no headphones) consolidates this. The body learns the softness was allowed.
          </div>
          <button onClick={() => { reset(); onOpenNote?.() }}
            style={{ background: T.accent, color: '#fff', border: 'none', padding: '9px 14px', cursor: 'pointer', fontFamily: T.sans, fontSize: 11.5, fontWeight: 600, borderRadius: T.r, letterSpacing: 0.3 }}>
            Note what you noticed →
          </button>
        </div>
        <button onClick={reset}
          style={{ width: '100%', background: 'transparent', border: `1px solid ${T.hair}`, color: T.muted, padding: '11px 14px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans, fontSize: 12, fontWeight: 500 }}>
          Close
        </button>
      </SheetShell>
    )
  }

  if (isLast) {
    return (
      <SheetShell onClose={onClose} title="A quick body scan" sub="Last step.">
        <div className="glass-card" style={{ padding: 18, borderLeft: `3px solid ${T.accent}`, borderRadius: T.r, marginBottom: 14 }}>
          <div style={{ fontFamily: T.serif, fontSize: 17, fontStyle: 'italic', lineHeight: 1.55, color: T.text, letterSpacing: -0.1 }}>
            Whatever you noticed — tension, warmth, an ache that wanted attention — was the practice. Nothing to fix; just noticed.
          </div>
        </div>
        <SheetFooter onSave={save} disabled={false} saved={false} label="Keep this practice" savedLabel="Saved" helper={null} />
      </SheetShell>
    )
  }

  const s = BODY_SCAN_STEPS[step]
  // Soft progress dots beneath the step card — visual sense of
  // "you've moved through this many stops, this many to go" without
  // a sterile progress bar.
  const dots = (
    <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginBottom: 14 }}>
      {BODY_SCAN_STEPS.map((_, i) => (
        <span key={i} style={{
          width: i === step ? 16 : 5, height: 5, borderRadius: 999,
          background: i <= step ? T.accent : 'rgba(26,19,16,0.14)',
          opacity: i === step ? 1 : (i < step ? 0.5 : 1),
          transition: 'all 0.4s var(--ease-out)',
        }} />
      ))}
    </div>
  )
  return (
    <SheetShell onClose={onClose} title="A quick body scan" sub={`${step + 1} of ${BODY_SCAN_STEPS.length}`}>
      {dots}
      {/* key={step} forces a remount per step so the fadeUp animation
          replays — each stop on the tour arrives, doesn't just swap. */}
      <div key={step} className="glass-card" style={{ padding: 20, borderLeft: `3px solid ${T.accent}`, borderRadius: 18, marginBottom: 14, animation: 'fadeUp 0.42s cubic-bezier(0.22, 1, 0.36, 1) both' }}>
        <div style={{ fontFamily: T.serif, fontSize: 19, fontStyle: 'italic', lineHeight: 1.4, color: T.text, marginBottom: 10, letterSpacing: -0.2 }}>
          {s.title}
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 15.5, lineHeight: 1.65, color: T.text }}>
          {s.body}
        </div>
      </div>
      <button onClick={() => setStep(step + 1)}
        className="alive-card"
        style={{ width: '100%', background: T.accent, color: '#fff', border: 'none', padding: '14px 16px', borderRadius: 999, cursor: 'pointer', fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, letterSpacing: 0.4, boxShadow: `0 12px 24px -12px ${T.accent}70` }}>
        {step === BODY_SCAN_STEPS.length - 1 ? 'Hold the whole body' : 'Move on, slowly'}
      </button>
    </SheetShell>
  )
}

// ── Bedtime release practice ────────────────────────────────────
function BedtimeSheet({ open, onClose, onSave, history = [], onOpenHelper }) {
  const [stage, setStage] = useState('write')  // 'write' | 'breath' | 'done'
  const [text, setText] = useState('')
  const [savedText, setSavedText] = useState('')

  if (!open) return null

  const save = () => {
    onSave({ kind: 'bedtime', content: text.trim() || null })
    setSavedText(text.trim())
    setStage('done')
  }

  const reset = () => { setStage('write'); setText(''); setSavedText(''); onClose() }

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
          style={{ width: '100%', background: T.accent, color: '#fff', border: 'none', padding: '13px 14px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, letterSpacing: 0.4 }}>
          Done — keep this practice
        </button>
      </SheetShell>
    )
  }

  if (stage === 'done') {
    const recent = history.filter((e) => e.kind === 'bedtime').length
    return (
      <SheetShell onClose={reset} title="Released." sub="The day is closing.">
        <div className="glass-card" style={{ padding: 18, borderLeft: `3px solid ${T.accent}`, borderRadius: T.r, marginBottom: 14 }}>
          <div style={{ fontFamily: T.serif, fontSize: 17, fontStyle: 'italic', lineHeight: 1.55, color: T.text, letterSpacing: -0.1 }}>
            You put it down. {savedText ? 'Whatever you wrote will be there if you need it tomorrow.' : 'The breath did its work — the body knows it can rest now.'}
          </div>
          {recent >= 3 && (
            <div style={{ fontFamily: T.serif, fontSize: 13.5, lineHeight: 1.6, color: T.accent, fontStyle: 'italic', paddingTop: 8, borderTop: `1px solid ${T.hair}`, marginTop: 12 }}>
              {recent} bedtime releases so far — sleep is paying attention.
            </div>
          )}
        </div>
        <div className="glass-card" style={{ padding: 14, borderRadius: T.r, marginBottom: 14, borderLeft: `3px solid ${T.muted}` }}>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, letterSpacing: -0.1, fontWeight: 500, color: T.muted, marginBottom: 6 }}>
            What helps next
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 14, lineHeight: 1.65, color: T.text, marginBottom: 10 }}>
            Phone away or face-down. Cool room — around 65°F if you can. Soft pages, dim lights. If sleep still won't come in twenty minutes, get up briefly, sit somewhere boring, come back when it feels close.
          </div>
          <button onClick={() => { reset(); onOpenHelper?.('insomnia') }}
            style={{ background: 'transparent', color: T.accent, border: `1px solid ${T.accent}`, padding: '9px 14px', cursor: 'pointer', fontFamily: T.sans, fontSize: 11.5, fontWeight: 600, borderRadius: T.r, letterSpacing: 0.3 }}>
            If sleep won't come — full playbook →
          </button>
        </div>
        <button onClick={reset}
          style={{ width: '100%', background: 'transparent', border: `1px solid ${T.hair}`, color: T.muted, padding: '11px 14px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans, fontSize: 12, fontWeight: 500 }}>
          Close — off the screen now
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
    <Portal>
    <div
      data-luna-overlay="true"
      onClick={onClose}
      onTouchMove={(e) => e.preventDefault()}
      onWheel={(e) => e.preventDefault()}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(26,19,16,0.55)',
        backdropFilter: 'blur(18px) saturate(1.2)', WebkitBackdropFilter: 'blur(18px) saturate(1.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.25s ease-out both',
        touchAction: 'none',
        overscrollBehavior: 'contain',
        padding: 16,
      }}>
      <div onClick={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 430,
          background: T.bg,
          borderRadius: 18,
          boxShadow: '0 24px 60px -12px rgba(0,0,0,0.45)',
          maxHeight: '88dvh',
          minHeight: 'min(440px, 70dvh)',
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
    </Portal>
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
  // request so it doesn't fire again on re-render. We also mark this
  // visit as "came for a practice" so that when the user closes the
  // practice sheet, we navigate back to the originating screen instead
  // of stranding her on the Reflect screen she never asked to see.
  const cameForPractice = useRef(false)
  const lastOpenPractice = useRef(null)
  useEffect(() => {
    if (activeReflectPractice) {
      setOpenPractice(activeReflectPractice)
      setActiveReflectPractice(null)
      cameForPractice.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeReflectPractice])

  // When the deep-linked practice closes, walk back to where she came
  // from. Guard so this doesn't fire on the initial null state.
  useEffect(() => {
    if (lastOpenPractice.current && openPractice === null && cameForPractice.current) {
      cameForPractice.current = false
      back()
    }
    lastOpenPractice.current = openPractice
  }, [openPractice, back])

  // The phase-aware recommendation for this week.
  const recommendation = phase ? PHASE_PRACTICE[phase.id] : null

  const handleSavePractice = (entry) => {
    const next = [
      ...history,
      { ...entry, dateISO: todayKey(), recordedAt: new Date().toISOString() },
    ].slice(-60)  // keep last ~2 months
    updateSetting('reflectHistory', next)
  }

  // Helper-routing callbacks the practices can call from their
  // completion views — Luna doesn't stop at witnessing; it helps.
  const go = useLuna((s) => s.go)
  const handleOpenHelper = (id) => { setOpenPractice(null); go(id) }
  const handleOpenPractice = (id) => setOpenPractice(id)
  const handleOpenNote = () => { setOpenPractice(null); setQuickNoteOpen(true) }
  const handleOpenChat = () => { setOpenPractice(null); setChatOpen(true) }

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
        <div className="insight-stagger" style={{ animationDelay: '0ms' }}>
          <Eyebrow color={phase?.color}>For your mind and heart</Eyebrow>
        </div>
        <div className="insight-stagger" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, animationDelay: '40ms' }}>
          <div style={{ fontFamily: T.serif, fontSize: 32, fontWeight: 500, letterSpacing: -0.7, lineHeight: 1.05, flex: 1 }}>
            {firstName ? `Sit a minute, ${firstName}.` : 'Sit a minute.'}
          </div>
          {phase && (
            <div aria-hidden="true" style={{ color: phase.color, opacity: 0.55, paddingTop: 2 }}>
              <PhaseFlourish phaseId={phase.id} size={24} />
            </div>
          )}
        </div>
        <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 15, lineHeight: 1.6, color: T.muted, marginTop: 12, fontStyle: 'italic', animationDelay: '90ms' }}>
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
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, letterSpacing: -0.1, fontWeight: 500, color: phase.color }}>
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
          {PRACTICES.map((p) => {
            const c = sectionColors(PRACTICE_SECTION[p.id] || 'reflect')
            return (
              <button key={p.id} onClick={() => setOpenPractice(p.id)}
                className="alive-card"
                style={{
                  width: '100%', textAlign: 'left', padding: 16, borderRadius: T.r,
                  cursor: 'pointer', color: T.text, fontFamily: 'inherit', display: 'block',
                  background: sectionPaper(PRACTICE_SECTION[p.id] || 'reflect'),
                  border: `1px solid ${c.accent}22`,
                  borderLeft: `3px solid ${c.accent}`,
                  boxShadow: `0 1px 0 ${c.accent}10, 0 10px 22px -18px ${c.accent}30`,
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <div style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 500, lineHeight: 1.3, letterSpacing: -0.2 }}>
                    {p.title}
                  </div>
                  {counts[p.kind] > 0 && (
                    <div style={{ fontFamily: T.mono, fontSize: 9.5, color: c.accent, letterSpacing: 0.6, fontWeight: 600 }}>
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
                <div style={{ fontFamily: T.sans, fontSize: 11, color: c.accent, fontWeight: 600, letterSpacing: 0.3 }}>
                  {p.cta} →
                </div>
              </button>
            )
          })}
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

      {/* Practice overlays — each receives history + phase + helper
          callbacks so its completion view can route to real next
          actions (note, chat, helper screen, sibling practice). */}
      <IntentionSheet  open={openPractice === 'intention'}  onClose={() => setOpenPractice(null)} onSave={handleSavePractice}
                       history={history} onOpenNote={handleOpenNote} onOpenChat={handleOpenChat} />
      <GratitudeSheet  open={openPractice === 'gratitude'}  onClose={() => setOpenPractice(null)} onSave={handleSavePractice}
                       history={history} onOpenNote={handleOpenNote} onOpenChat={handleOpenChat} />
      <FeelingSheet    open={openPractice === 'feeling'}    onClose={() => setOpenPractice(null)} onSave={handleSavePractice}
                       phase={phase} history={history}
                       onOpenNote={handleOpenNote} onOpenChat={handleOpenChat}
                       onOpenHelper={handleOpenHelper} onOpenPractice={handleOpenPractice} />
      <BodyScanSheet   open={openPractice === 'bodyscan'}   onClose={() => setOpenPractice(null)} onSave={handleSavePractice}
                       phase={phase} history={history} onOpenNote={handleOpenNote} />
      <CompassionSheet open={openPractice === 'compassion'} onClose={() => setOpenPractice(null)} onSave={handleSavePractice}
                       phase={phase} history={history} onOpenNote={handleOpenNote} onOpenChat={handleOpenChat} />
      <ReframeSheet    open={openPractice === 'reframe'}    onClose={() => setOpenPractice(null)} onSave={handleSavePractice}
                       history={history} onOpenChat={handleOpenChat} />
      <BedtimeSheet    open={openPractice === 'bedtime'}    onClose={() => setOpenPractice(null)} onSave={handleSavePractice}
                       history={history} onOpenHelper={handleOpenHelper} />

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
