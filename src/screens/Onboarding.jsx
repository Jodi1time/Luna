import { useState, useEffect } from 'react'
import { T } from '../data/theme'
import { CTAButton, SourceLine, Icons } from '../components/shared'
import Backdrop from '../components/Backdrop'
import useLuna from '../store/useLuna'
import { getSession } from '../lib/supabase'
import { StatusView } from '../components/StatusView'
import { validateName, validateAccountPassword, validateEmail } from '../lib/validation'
import { sectionColors } from '../data/sectionPalette'
import { getCycleDay, getPhaseForDay } from '../hooks/useCycle'
import { getReflectionPrompt } from '../data/lunaData'
import { dailyThought } from '../lib/lunaChat'
import { CrescentCradle } from '../components/Illustrations'

// Intent — what brings her to Luna. Drives every downstream surface:
// which home cards lead, which features she sees first, which copy
// Luna uses to talk to her. This is the master branch of the
// personalization tree. Order is intentional — needs first (the
// hurting woman), planning second (TTC / avoiding / pregnant /
// menopause), the calm-default last.
const INTENT_OPTIONS = [
  { id: 'understanding',       label: 'Understanding my cycle & moods',         hint: 'Why I feel how I feel, week to week.' },
  { id: 'managing-condition',  label: 'Managing a condition',                    hint: 'PCOS, endo, PMDD, fibroids, thyroid, HA.' },
  { id: 'ttc',                 label: 'Trying to conceive',                      hint: 'Make this window as clear as it can be.' },
  { id: 'avoiding',            label: 'Avoiding pregnancy',                      hint: 'Know my fertile days, without guessing.' },
  { id: 'pregnant',            label: 'Pregnant or postpartum',                  hint: 'Walk this with someone, week by week.' },
  { id: 'menopause',           label: 'Approaching menopause',                   hint: 'Hold space for a body that’s changing.' },
  { id: 'just-tracking',       label: 'Just tracking, simply',                   hint: 'The basics, beautifully. Nothing more.' },
]

// Priorities — what she most wants Luna to do for her right now. Five
// clean buckets, each mapping to a distinct Luna surface. Previous
// 7-option list had two pairs of overlap (understand / mood, and
// symptoms as a tool-ask not a need-ask) — merged into the body-and-
// moods bucket. Drives Adaptive Home ordering downstream. Each option
// carries a small custom icon so the list reads as a visual menu, not
// another stack of identical pills.
const PRIORITY_OPTIONS = [
  {
    id: 'understand', label: 'Understanding my body & moods',
    hint: 'Why I feel how I feel — symptoms, hormones, week to week.',
    // wave + small dot — "the rhythm of you"
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11c2 -2 4 -2 6 0s4 2 6 0 2 0 2 0" />
        <circle cx="6" cy="6" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: 'predict', label: 'Knowing when my period’s coming',
    hint: 'Predictions that don’t pretend to be certain.',
    // crescent arc — moon prediction
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 4a7 7 0 1 0 2 9 6 6 0 0 1 -2 -9z" />
      </svg>
    ),
  },
  {
    id: 'fertility', label: 'Fertility & ovulation',
    hint: 'The window, the signs, the math behind it.',
    // ovum — concentric circles
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="10" r="6.5" />
        <circle cx="10" cy="10" r="2" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: 'condition', label: 'Learning about my condition',
    hint: 'Plain-English explainers, doctor-ready notes.',
    // open book / clipboard
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4.5" y="3.5" width="11" height="13" rx="1.5" />
        <path d="M7 7h6 M7 10h6 M7 13h4" />
      </svg>
    ),
  },
  {
    id: 'reflect', label: 'A private space to reflect',
    hint: 'A diary, voice notes, quiet practices.',
    // pen tip
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 16l3 -1 9 -9 -2 -2 -9 9 -1 3z" />
        <path d="M13 5l2 2" />
      </svg>
    ),
  },
]

// Conditions sub-step — surfaces only when intent === 'managing-condition'.
// Pins matching Conditions Atlas entries on Home and unlocks the relevant
// symptoms in default views.
const CONDITION_OPTIONS = [
  { id: 'pcos',     label: 'PCOS' },
  { id: 'endo',     label: 'Endometriosis' },
  { id: 'pmdd',     label: 'PMDD' },
  { id: 'thyroid',  label: 'Thyroid' },
  { id: 'fibroids', label: 'Fibroids' },
  { id: 'ha',       label: 'Hypothalamic amenorrhea (HA)' },
]

// In-voice reply Luna gives after each intent choice. Doula register —
// never optimisation talk, never "Great!". This is the first taste of
// the moat: the moment she realises Luna talks to her like a person.
const INTENT_REPLIES = {
  'understanding':       'Then let’s start with what’s actually happening in your body.',
  'managing-condition':  'Then let’s make sure Luna actually understands it — not just tracks it.',
  'ttc':                 'Then let’s make this window as clear as it can be.',
  'avoiding':            'Then knowing your fertile days is power. Luna will be honest about them.',
  'pregnant':            'Then welcome — Luna will walk this with you, week by week.',
  'menopause':           'Then let’s hold space for a body that’s changing — without alarm.',
  'just-tracking':       'Then we keep it simple. The basics, beautifully.',
}

// Editorial progress indicator — three small italic-serif step labels,
// current step lit in accent, completed steps dimmed but legible.
// Lowercase to match Luna's literary register; uppercase mono was
// the form-wizard tell that didn't belong here.
// Bounded progress — 5 visible steps. Voice preference deliberately
// cut: declaring "Luna's tone" in a picker violates the HAVEN, NOT
// CLASSROOM rule (the voice should be felt, never named). The conditions
// sub-step doesn't count toward the total — it reads as one moment of
// "tell me a bit more about it."
function ProgressBar({ step, total = 5 }) {
  const labels = ['why you’re here', 'your last period', 'your cycle', 'what matters', 'your name']
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 30 }}>
      {Array.from({ length: total }).map((_, i) => {
        const n = i + 1
        const active = n === step
        const done = n < step
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, fontWeight: 500,
              background: active ? T.accent : (done ? T.accent + '22' : 'rgba(253,250,245,0.55)'),
              color: active ? '#fff' : (done ? T.accent : T.muted),
              border: active ? 'none' : `1px solid ${done ? T.accent + '40' : 'rgba(26,19,16,0.08)'}`,
              boxShadow: active ? `0 6px 14px -6px ${T.accent}80` : 'none',
              transition: 'all 0.3s var(--ease-out)',
            }}>
              {n}
            </div>
            <div style={{
              fontFamily: T.serif, fontStyle: 'italic',
              fontSize: 11, fontWeight: 500,
              color: active ? T.accent : T.muted,
              opacity: active ? 1 : 0.6,
              letterSpacing: -0.1,
              transition: 'all 0.3s var(--ease-out)',
            }}>
              {labels[i]}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Single-select option card — full-width frost-card with a label and
// optional hint. Selection state mirrors mood-pill / scope-picker
// pattern: subtle accent border + tint, no harsh highlight. Optional
// `dot` (small circle, for intent rows tagged with their downstream
// category color) or `icon` (small stroke SVG, for priorities rows
// matched to their target surface). The two visual treatments give
// intent / conditions / priorities distinct rhythm even though they
// all use the same card shell — fixes the "every list looks the same"
// problem flagged in the design pass.
function OptionCard({ label, hint, selected, accent, dot, icon, onTap }) {
  const hasLeading = Boolean(dot || icon)
  return (
    <button onClick={onTap}
      className={`alive-card frost-card${selected ? ' tap-bloom' : ''}`}
      style={{
        textAlign: 'left', cursor: 'pointer', width: '100%',
        padding: '14px 16px',
        background: selected ? `${accent}14` : 'rgba(253,250,245,0.55)',
        border: `1px solid ${selected ? accent + '55' : 'rgba(26,19,16,0.06)'}`,
        borderRadius: 18,
        color: T.text, fontFamily: 'inherit',
        boxShadow: selected ? `0 12px 22px -16px ${accent}60` : '0 10px 22px -22px rgba(26,19,16,0.18)',
        transition: 'all 0.2s var(--ease-out)',
        display: 'flex', alignItems: 'flex-start', gap: 12,
      }}>
      {hasLeading && (
        <div style={{
          flexShrink: 0,
          width: icon ? 36 : 12, height: icon ? 36 : 12,
          marginTop: icon ? 0 : 6,
          borderRadius: 999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: icon ? (selected ? `${accent}22` : 'rgba(253,250,245,0.55)') : (dot || T.muted),
          border: icon ? `1px solid ${selected ? accent + '40' : 'rgba(26,19,16,0.08)'}` : 'none',
          color: icon ? (selected ? accent : T.muted) : 'transparent',
          opacity: dot ? (selected ? 1 : 0.75) : 1,
          transition: 'all 0.2s var(--ease-out)',
        }}>
          {icon}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: T.serif, fontStyle: selected ? 'italic' : 'normal',
          fontSize: 16, fontWeight: 500, letterSpacing: -0.2,
          color: selected ? accent : T.text,
          marginBottom: hint ? 4 : 0,
        }}>
          {label}
        </div>
        {hint && (
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: T.muted, lineHeight: 1.5 }}>
            {hint}
          </div>
        )}
      </div>
    </button>
  )
}

// Category tag per intent — drives the small left-edge dot on each
// intent option card. Visually differentiates the seven life-stage
// choices instead of stacking them as seven identical cards. Picked to
// roughly match the downstream Home register each intent lands in.
const INTENT_CATEGORY = {
  'understanding':       'reflect',     // lavender — body literacy
  'managing-condition':  'urgent',      // rose — when something feels off
  'ttc':                 'plan',        // moonlight purple — life-stage planning
  'avoiding':            'care',        // gold — routines, prevention
  'pregnant':            'body',        // peach — body changes
  'menopause':           'intimate',    // mauve — a different chapter
  'just-tracking':       'read',        // sage — quiet, knowledge
}

// Intent step — the master-branch question. Single-select, surfaces
// Luna's in-voice reply once she picks. Reply line is what teaches the
// register: "this isn't a form, this is a relationship."
export function StepIntent({ value, onChange }) {
  const accent = sectionColors('plan').accent
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {INTENT_OPTIONS.map((opt) => {
        const catAccent = sectionColors(INTENT_CATEGORY[opt.id]).accent
        return (
          <OptionCard key={opt.id}
            label={opt.label} hint={opt.hint}
            selected={value === opt.id}
            accent={accent}
            dot={catAccent}
            onTap={() => onChange(opt.id)}
          />
        )
      })}
      {value && INTENT_REPLIES[value] && (
        <div className="frost-card" style={{
          marginTop: 6, padding: '16px 18px',
          background: `linear-gradient(160deg, ${accent}0e, rgba(253,250,245,0.5))`,
          border: `1px solid ${accent}28`,
          borderRadius: 16,
          animation: 'fadeUp 0.35s ease-out both',
        }}>
          <div style={{ fontFamily: T.serif, fontSize: 15.5, fontStyle: 'italic', lineHeight: 1.55, color: T.text, letterSpacing: -0.15 }}>
            {INTENT_REPLIES[value]}
          </div>
        </div>
      )}
    </div>
  )
}

// Priorities — multi-select. Pre-selects sensible defaults based on
// intent so the user isn't starting from a blank slate (and so we have
// reasonable defaults if she skips picking). Selections override the
// defaults the moment she taps anything.
export function StepPriorities({ values, onChange }) {
  const accent = sectionColors('reflect').accent
  const toggle = (id) => {
    const set = new Set(values || [])
    if (set.has(id)) set.delete(id)
    else set.add(id)
    onChange([...set])
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {PRIORITY_OPTIONS.map((opt) => {
        const on = (values || []).includes(opt.id)
        return (
          <OptionCard key={opt.id}
            label={opt.label} hint={opt.hint}
            selected={on}
            accent={accent}
            icon={opt.icon}
            onTap={() => toggle(opt.id)}
          />
        )
      })}
    </div>
  )
}

// Sensible default priorities derived from intent — so the user never
// starts with a blank slate and home ordering has something to lean on
// even if she skips priorities entirely. She can still pick anything in
// the picker; whatever she picks replaces these.
export function defaultPrioritiesForIntent(intent) {
  switch (intent) {
    case 'understanding':       return ['understand', 'predict']
    case 'managing-condition':  return ['condition', 'understand']
    case 'ttc':                 return ['fertility', 'predict', 'understand']
    case 'avoiding':            return ['fertility', 'predict']
    case 'pregnant':            return ['understand']
    case 'menopause':           return ['understand']
    case 'just-tracking':       return ['predict']
    default:                    return ['understand', 'predict']
  }
}

// Conditions sub-step — multi-select. Only mounted when intent is
// "managing-condition." Skipping is fine (user can add later in
// Settings → Your setup); we just won't pin the Conditions Atlas
// entries until she does.
export function StepConditions({ values, onChange }) {
  const accent = sectionColors('urgent').accent
  const toggle = (id) => {
    const set = new Set(values || [])
    if (set.has(id)) set.delete(id)
    else set.add(id)
    onChange([...set])
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {CONDITION_OPTIONS.map((opt) => {
        const on = (values || []).includes(opt.id)
        return (
          <OptionCard key={opt.id}
            label={opt.label}
            selected={on}
            accent={accent}
            onTap={() => toggle(opt.id)}
          />
        )
      })}
      <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, color: T.muted, lineHeight: 1.55, marginTop: 6 }}>
        You can change this anytime in Settings.
      </div>
    </div>
  )
}

// ─── Payoff screen helpers ────────────────────────────────────────
// The opening clause stitched from her answers. Reads as a sentence
// that could only have been written for her: "Because you’re
// navigating PCOS with a cycle that doesn’t follow the rules —"
// Order: intent (life-stage) → conditions list → irregular qualifier.
const CONDITION_LABEL = {
  pcos: 'PCOS', endo: 'endometriosis', pmdd: 'PMDD',
  thyroid: 'a thyroid condition', fibroids: 'fibroids',
  ha: 'hypothalamic amenorrhea',
}

function intentPhrase(intent, conditions) {
  switch (intent) {
    case 'understanding':
      return 'Because you’re here to understand your body'
    case 'managing-condition': {
      const named = (conditions || []).map((id) => CONDITION_LABEL[id]).filter(Boolean)
      if (named.length === 0) return 'Because you’re managing a condition'
      if (named.length === 1) return `Because you’re navigating ${named[0]}`
      if (named.length === 2) return `Because you’re navigating ${named[0]} and ${named[1]}`
      const last = named[named.length - 1]
      const head = named.slice(0, -1).join(', ')
      return `Because you’re navigating ${head}, and ${last}`
    }
    case 'ttc':           return 'Because you’re trying to conceive'
    case 'avoiding':      return 'Because you want to know your fertile days, honestly'
    case 'pregnant':      return 'Because you’re walking this pregnancy'
    case 'menopause':     return 'Because you’re approaching menopause'
    case 'just-tracking': return 'Because you want to track your cycle, simply'
    default:              return 'Because you’re here'
  }
}

// One bullet per priority she picked. Each is a small commitment Luna
// makes, written in doula register — what she'll DO, not what feature
// will be enabled. Keys match PRIORITY_OPTIONS ids.
const PRIORITY_COMMITMENT = {
  understand: 'Plain-English explanations for what your body is doing, week by week.',
  predict:    'Honest predictions — ranges over certainty, especially when your rhythm is its own.',
  fertility:  'The fertile window with the signs that actually show it — temperature, mucus, drive.',
  condition:  'Your condition explained in plain English, with doctor-ready notes when you need them.',
  reflect:    'A quiet space to write, name what you’re feeling, sit with it.',
}

// Payoff step — the activation moment. Renders a personalized summary
// stitched from intent + conditions + irregular + priorities, then
// fetches and shows the live AI daily-thought seeded from her cycle
// state. This is the "I need this" beat that has to fire BEFORE
// account creation — sunk-cost commitment in the legitimate sense
// (she's seen what Luna is for her). Falls back to the local static
// reflection prompt if the Edge Function isn't reachable, so the
// screen never feels broken.
function StepPayoff({ settings, displayName, lastPeriodISO, cycleDays }) {
  const accent = sectionColors('plan').accent
  const intent = settings?.intent
  const conditions = settings?.conditions || []
  const priorities = (settings?.priorities && settings.priorities.length > 0)
    ? settings.priorities
    : defaultPrioritiesForIntent(intent)
  const irregular = Boolean(settings?.irregular)

  // Compute her phase from in-flight onboarding state — we haven't
  // written lastPeriodStart to the store yet (that happens at the
  // finish step), so go straight to the math helpers.
  const cycleDay = lastPeriodISO ? getCycleDay(lastPeriodISO, cycleDays || 28) : null
  const phase = cycleDay ? getPhaseForDay(cycleDay, cycleDays || 28) : null

  const [aiThought, setAiThought] = useState(null)
  const [thoughtLoading, setThoughtLoading] = useState(true)
  useEffect(() => {
    if (!phase) { setThoughtLoading(false); return }
    let cancelled = false
    setThoughtLoading(true)
    dailyThought({
      userId: 'onboarding',  // pre-account; cached as anon for today
      phaseId: phase.id,
      phaseName: phase.name,
      cycleDay,
      cycleLength: cycleDays || 28,
      patternSummary: null,  // no logs yet
    })
      .then((text) => { if (!cancelled) setAiThought(text || null) })
      .catch(() => { if (!cancelled) setAiThought(null) })
      .finally(() => { if (!cancelled) setThoughtLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase?.id, cycleDay, cycleDays])

  // Fallback to the static phase-aware reflection prompt if AI failed.
  const thought = aiThought || (phase ? getReflectionPrompt(phase.id) : null)

  const phrase = intentPhrase(intent, conditions)
  const tail = irregular ? ', with a cycle that doesn’t follow the rules' : ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* The reward, drawn — a crescent cradling a seed. The first
          moment onboarding stops asking and starts giving. */}
      <div className="insight-stagger" style={{ display: 'flex', justifyContent: 'center', marginTop: 4, marginBottom: -4, color: accent, animationDelay: '0ms' }}>
        <CrescentCradle size={128} accent={accent} />
      </div>

      {/* Personalized summary card — soft accent gradient, italic serif.
          Reads as a single sentence written for her. */}
      <div className="frost-card insight-stagger" style={{
        padding: '22px 20px',
        background: `linear-gradient(160deg, ${accent}10, rgba(253,250,245,0.55))`,
        border: `1px solid ${accent}28`,
        borderRadius: 22,
        animationDelay: '50ms',
      }}>
        <div style={{ fontFamily: T.serif, fontSize: 17, fontStyle: 'italic', lineHeight: 1.55, color: T.text, letterSpacing: -0.15, marginBottom: 14 }}>
          {phrase}{tail} — here’s how Luna will work for you.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {priorities.map((id) => (
            PRIORITY_COMMITMENT[id] && (
              <div key={id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: 999, background: accent, marginTop: 8, flexShrink: 0, opacity: 0.85 }} />
                <div style={{ fontFamily: T.serif, fontSize: 14.5, lineHeight: 1.55, color: T.text }}>
                  {PRIORITY_COMMITMENT[id]}
                </div>
              </div>
            )
          ))}
        </div>
      </div>

      {/* First daily-thought — the AI moat, live. Hero treatment that
          mirrors the Home AI thought card so the visual identity
          carries forward. The user has now seen Luna's real voice
          BEFORE creating an account — this is the activation aha. */}
      {phase && (
        <div className="frost-card insight-stagger" style={{
          position: 'relative',
          padding: '26px 24px 22px',
          background: `linear-gradient(160deg, ${phase.color}18, ${phase.color}08 60%, rgba(253,250,245,0.5))`,
          border: `1px solid ${phase.color}30`,
          borderRadius: 26,
          boxShadow: `0 20px 44px -20px ${phase.color}70`,
          overflow: 'hidden',
          animationDelay: '150ms',
        }}>
          <div aria-hidden="true" style={{
            position: 'absolute', top: -10, left: 14,
            fontFamily: T.serif, fontSize: 96, lineHeight: 1, fontStyle: 'italic',
            color: phase.color, opacity: 0.2, fontWeight: 400,
            userSelect: 'none', pointerEvents: 'none',
          }}>“</div>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, fontWeight: 500, color: `color-mix(in srgb, ${phase.color}, ${T.ink} 30%)`, letterSpacing: -0.1, marginBottom: 12, position: 'relative' }}>
            a thought, today
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 19, fontStyle: 'italic', lineHeight: 1.45, color: T.text, letterSpacing: -0.2, position: 'relative', minHeight: 56 }}>
            {thoughtLoading
              ? <span style={{ opacity: 0.5 }}>Luna is thinking…</span>
              : (thought || 'Welcome. Luna is here.')}
          </div>
        </div>
      )}

      {/* Gentle handoff to account step — frames creation as "save your
          space," not as a gate. Lifts language straight from the brief. */}
      <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13.5, color: T.muted, lineHeight: 1.55, textAlign: 'center' }}>
        Save your space so it’s here on any device.
      </div>
    </div>
  )
}

// Calendar widget — supports navigating back up to 12 months so the
// user can mark a period that started in a previous month. Forward
// navigation is allowed up to the current month only (no future).
// Selection is stored as an ISO date string (YYYY-MM-DD).
function StepDate({ value, onChange }) {
  const days = ['M','T','W','T','F','S','S']
  const now = new Date()
  const todayISO = now.toISOString().slice(0, 10)
  const initialDate = value ? new Date(value + 'T12:00:00') : now
  const [viewing, setViewing] = useState({
    year:  initialDate.getFullYear(),
    month: initialDate.getMonth(),
  })

  const monthLabel = new Date(viewing.year, viewing.month, 1)
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const daysInMonth = new Date(viewing.year, viewing.month + 1, 0).getDate()
  const firstDay   = new Date(viewing.year, viewing.month, 1).getDay()
  const offset     = firstDay === 0 ? 6 : firstDay - 1
  const dates      = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // Back 12 months max; forward only up to current month.
  const earliestAllowed = new Date(now.getFullYear(), now.getMonth() - 12, 1)
  const currentMonthFirst = new Date(now.getFullYear(), now.getMonth(), 1)
  const viewingFirst = new Date(viewing.year, viewing.month, 1)
  const canGoBack = viewingFirst > earliestAllowed
  const canGoForward = viewingFirst < currentMonthFirst

  const stepMonth = (delta) => {
    setViewing(({ year, month }) => {
      const d = new Date(year, month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  return (
    <div className="frost-card" style={{
      background: 'rgba(253,250,245,0.55)',
      padding: 18,
      border: '1px solid rgba(26,19,16,0.06)',
      borderRadius: 22,
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      boxShadow: '0 14px 30px -22px rgba(26,19,16,0.18)',
    }}>
      {/* Month navigation header — frosted circular nav buttons,
          italic-serif month label. */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={() => stepMonth(-1)} disabled={!canGoBack}
          aria-label="Previous month"
          className="alive-card"
          style={{
            background: 'rgba(253,250,245,0.55)',
            border: '1px solid rgba(26,19,16,0.06)',
            color: canGoBack ? T.text : 'rgba(26,19,16,0.18)',
            width: 32, height: 32, borderRadius: 999,
            cursor: canGoBack ? 'pointer' : 'default',
            fontFamily: T.serif, fontSize: 17, padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>‹</button>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontWeight: 500, fontSize: 18, letterSpacing: -0.2, color: T.text }}>
          {monthLabel.toLowerCase()}
        </div>
        <button onClick={() => stepMonth(1)} disabled={!canGoForward}
          aria-label="Next month"
          className="alive-card"
          style={{
            background: 'rgba(253,250,245,0.55)',
            border: '1px solid rgba(26,19,16,0.06)',
            color: canGoForward ? T.text : 'rgba(26,19,16,0.18)',
            width: 32, height: 32, borderRadius: 999,
            cursor: canGoForward ? 'pointer' : 'default',
            fontFamily: T.serif, fontSize: 17, padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>›</button>
      </div>
      {/* Day-of-week headers — italic serif lowercase, not mono caps */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
        {days.map((d, i) => <div key={i} style={{ textAlign: 'center', fontSize: 11, color: T.muted, fontFamily: T.serif, fontStyle: 'italic', fontWeight: 500, opacity: 0.7 }}>{d.toLowerCase()}</div>)}
      </div>
      {/* Day cells — rounded, soft selection, today gets a dashed ring */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
        {dates.map((d) => {
          const cellISO = `${viewing.year}-${String(viewing.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
          const isFuture = cellISO > todayISO
          const isSelected = value === cellISO
          const isToday = cellISO === todayISO
          return (
            <button key={d} onClick={() => !isFuture && onChange(cellISO)}
              disabled={isFuture}
              style={{
                aspectRatio: '1',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontFamily: T.serif,
                cursor: isFuture ? 'default' : 'pointer',
                border: isToday && !isSelected ? `1.5px dashed ${T.accent}66` : 'none',
                background: isSelected ? T.accent : 'transparent',
                color: isSelected ? '#fff' : isFuture ? 'rgba(26,19,16,0.18)' : T.text,
                opacity: isFuture ? 0.4 : 1,
                borderRadius: 999,
                fontWeight: isSelected ? 600 : 400,
                fontStyle: isSelected ? 'italic' : 'normal',
                padding: 0,
                boxShadow: isSelected ? `0 6px 14px -6px ${T.accent}80` : 'none',
                transition: 'all 0.2s var(--ease-out)',
              }}>
              {d}
            </button>
          )
        })}
      </div>
      {/* Selected-date readback — italic serif sentence */}
      {value && (
        <div style={{
          marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(26,19,16,0.06)',
          fontFamily: T.serif, fontSize: 14, fontStyle: 'italic',
          color: T.text, textAlign: 'center', letterSpacing: -0.1,
        }}>
          {new Date(value + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toLowerCase()}.
        </div>
      )}
    </div>
  )
}

// Cycle length picker — slider for users whose cycles are predictable,
// PLUS an explicit "Mine is irregular / I'm not sure" toggle at the top.
// When toggled on, the slider hides and the reframe lands: "Luna is built
// for cycles that don't follow the rules, and it'll never call your body
// wrong." This is the most reassuring moment in the whole flow — serves
// PCOS, HA, perimenopause, post-pill, and just-don't-track-yet users
// without making them feel like the form failed them.
function StepCycle({ value, onChange, irregular, onIrregularChange }) {
  const accent = sectionColors('plan').accent
  return (
    <div>
      {/* Irregular toggle — soft frost pill at the top. Tappable, with
          tap-bloom feedback. The pivot moment of the whole onboarding. */}
      <button onClick={() => onIrregularChange(!irregular)}
        className={`alive-card frost-card${irregular ? ' tap-bloom' : ''}`}
        style={{
          width: '100%', textAlign: 'left', cursor: 'pointer',
          padding: '14px 16px',
          background: irregular ? `${accent}14` : 'rgba(253,250,245,0.55)',
          border: `1px solid ${irregular ? accent + '55' : 'rgba(26,19,16,0.06)'}`,
          borderRadius: 18,
          color: T.text, fontFamily: 'inherit',
          boxShadow: irregular ? `0 12px 22px -16px ${accent}60` : '0 10px 22px -22px rgba(26,19,16,0.18)',
          transition: 'all 0.2s var(--ease-out)',
          display: 'flex', alignItems: 'center', gap: 12,
          marginBottom: 18,
        }}>
        <div style={{
          width: 22, height: 22, borderRadius: 6,
          background: irregular ? accent : 'transparent',
          border: `1.5px solid ${irregular ? accent : 'rgba(26,19,16,0.18)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.2s var(--ease-out)',
        }}>
          {irregular && (
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 10l3 3 7-7" />
            </svg>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: T.serif, fontStyle: irregular ? 'italic' : 'normal', fontSize: 15, fontWeight: 500, letterSpacing: -0.2, color: irregular ? accent : T.text }}>
            Mine is irregular, or I’m not sure.
          </div>
        </div>
      </button>

      {irregular ? (
        // Reframe — the most reassuring beat in the flow. Italic serif,
        // soft accent gradient, doula register. No source line, no
        // optimisation framing — just a hand on her shoulder.
        <div className="frost-card insight-stagger" style={{
          padding: '22px 20px',
          background: `linear-gradient(160deg, ${accent}10, rgba(253,250,245,0.55))`,
          border: `1px solid ${accent}28`,
          borderRadius: 22,
          animation: 'fadeUp 0.4s ease-out both',
        }}>
          <div style={{ fontFamily: T.serif, fontSize: 17, fontStyle: 'italic', lineHeight: 1.55, color: T.text, letterSpacing: -0.15 }}>
            That’s completely okay. Luna is built for cycles that don’t follow the rules — and it’ll never call your body wrong.
          </div>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13.5, color: T.muted, lineHeight: 1.55, marginTop: 10 }}>
            We’ll show ranges, not certainties, and learn your rhythm as you log.
          </div>
        </div>
      ) : (
        <>
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <span key={value} style={{ fontFamily: T.serif, fontSize: 110, fontStyle: 'italic', fontWeight: 400, color: T.accent, lineHeight: 1, letterSpacing: -3, display: 'inline-block', animation: 'numberPop 0.35s ease-out both' }}>{value}</span>
            <span style={{ fontFamily: T.serif, fontSize: 15, fontStyle: 'italic', color: T.muted, marginLeft: 10 }}>days</span>
          </div>
          <input type="range" min={21} max={45} value={value} onChange={(e) => onChange(+e.target.value)}
            style={{ width: '100%', accentColor: T.accent }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.muted, marginTop: 8, fontFamily: T.mono, letterSpacing: 0.8, fontWeight: 600 }}>
            <span>21</span>
            <span style={{ fontStyle: 'italic', fontFamily: T.serif, fontSize: 11 }}>typical · 28</span>
            <span>45</span>
          </div>
        </>
      )}
    </div>
  )
}

// Field — italic-serif lowercase label, frost-card input, accent
// focus ring. Matches the Settings + Auth register. The previous
// uppercase-mono labels + square inputs were the last form-wizard
// tell on this screen.
function Field({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{
        fontFamily: T.serif, fontStyle: 'italic', fontSize: 13,
        fontWeight: 500, color: T.muted, letterSpacing: -0.1,
      }}>
        {String(label).toLowerCase()}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoCapitalize="off"
        autoCorrect="off"
        className="frost-card"
        style={{
          background: 'rgba(253,250,245,0.55)',
          border: '1px solid rgba(26,19,16,0.08)',
          borderRadius: 16,
          padding: '14px 16px',
          // 16px is the iOS Safari threshold — anything under triggers
          // auto-zoom-in on focus AND doesn't always reset cleanly,
          // leaving the page zoomed past the viewport edges (the user
          // then has to manually pinch back to fit). Stay at 16+ on
          // every text-entry input app-wide.
          fontSize: 16,
          fontFamily: T.sans,
          color: T.text,
          outline: 'none',
          width: '100%',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
        onFocus={(e) => { e.target.style.borderColor = T.accent; e.target.style.boxShadow = `0 0 0 3px ${T.accent}18` }}
        onBlur={(e)  => { e.target.style.borderColor = 'rgba(26,19,16,0.08)'; e.target.style.boxShadow = 'none' }}
      />
    </div>
  )
}

function StepAccount({ name, email, accountPassword, onChange, signedInEmail }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Field label="your name" value={name} onChange={(v) => onChange('name', v)} placeholder="Mira" />

      {signedInEmail ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 14, borderTop: '1px solid rgba(26,19,16,0.06)' }}>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, fontWeight: 500, color: T.muted, letterSpacing: -0.1 }}>
            signed in as
          </div>
          <div style={{ fontFamily: T.sans, fontSize: 14, color: T.text }}>{signedInEmail}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 14, borderTop: '1px solid rgba(26,19,16,0.06)' }}>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, fontWeight: 500, color: T.muted, letterSpacing: -0.1 }}>
            your account
          </div>
          <Field label="email" type="email" value={email} onChange={(v) => onChange('email', v)} placeholder="you@example.com" />
          <Field label="password" type="password" value={accountPassword} onChange={(v) => onChange('accountPassword', v)} placeholder="At least 8 characters" />
        </div>
      )}

      <div className="frost-card" style={{
        fontSize: 12.5, color: T.muted, fontFamily: T.serif, fontStyle: 'italic',
        lineHeight: 1.6, padding: '14px 16px',
        background: 'rgba(253,250,245,0.55)',
        border: '1px solid rgba(26,19,16,0.06)',
        borderRadius: 16,
      }}>
        Sign in on any device to come back to your cycle. Your data is encrypted at rest — only you can read it.
      </div>
    </div>
  )
}

// Slug-based step model. The flow:
//   intent → (conditions if managing-condition) → date → cycle → account
// New slugs (priorities, voice, payoff) will slot in between cycle and
// account in later passes. Each slug knows its ProgressBar position and
// what comes next. Keeps routing extensible without breaking back-button
// behaviour or App.jsx history. Legacy numeric `step` prop is still
// accepted (App.jsx hasn't been rewired yet) and mapped to a slug.
const STEP_NUMBER = {
  intent: 1,
  conditions: 1,       // sub-step, doesn't increment progress
  date: 2,
  cycle: 3,
  priorities: 4,
  payoff: 4,           // payoff sits between priorities and account, off-count — feels like a reward, not a chore
  account: 5,
}

function legacyStepToSlug(n) {
  if (n === 1) return 'date'
  if (n === 2) return 'cycle'
  if (n === 3) return 'account'
  return 'intent'
}

export default function Onboarding({ step, slug: slugProp }) {
  // Accept either explicit slug (new routes) or legacy step number
  // (old onb1/onb2/onb3 routes). Slug is the source of truth internally.
  const slug = slugProp || legacyStepToSlug(step)
  const stepNum = STEP_NUMBER[slug] ?? 1
  const { go, setOnboarding, cycleLength, updateSetting, settings } = useLuna()
  // Period start is stored as an ISO date string so the picker can
  // navigate back across months. Defaults to today; the user can
  // step back up to 12 months via the calendar header.
  const [lastPeriodISO, setLastPeriodISO] = useState(() => new Date().toISOString().slice(0, 10))
  const [cycleDays, setCycleDays]= useState(cycleLength || 28)
  const [account, setAccount] = useState({
    name: '', email: '', accountPassword: '',
  })
  const [signupError, setSignupError] = useState('')
  const [finishing, setFinishing] = useState(false)
  const [fatalError, setFatalError] = useState('')
  // If the user reached onboarding from the sign-in flow, a Supabase
  // session already exists. We use that email and hide the email +
  // password fields — they just need to confirm a name.
  const [signedInEmail, setSignedInEmail] = useState('')

  useEffect(() => {
    if (slug !== 'account') return
    let cancelled = false
    getSession()
      .then((s) => { if (!cancelled && s?.user?.email) setSignedInEmail(s.user.email) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [slug])

  // Pre-seed priorities from intent the first time she lands on the
  // priorities screen — so she sees Luna already started thinking
  // about her (vs a blank checkbox list). She can untoggle/retoggle
  // anything; her selections override. Only fires when priorities is
  // undefined (never visited) — never overrides an explicit choice,
  // including an empty array she might have cleared on purpose.
  useEffect(() => {
    if (slug !== 'priorities') return
    if (typeof settings?.priorities !== 'undefined') return
    if (!settings?.intent) return
    updateSetting('priorities', defaultPrioritiesForIntent(settings.intent))
  }, [slug, settings?.intent, settings?.priorities, updateSetting])

  const setAccountField = (key, val) => setAccount((a) => ({ ...a, [key]: val }))

  const now = new Date()

  const finish = async () => {
    if (finishing) return
    setSignupError('')
    setFatalError('')
    setFinishing(true)
    try {
      // lastPeriodISO is already the user's exact pick (YYYY-MM-DD),
      // possibly in a previous month.
      const d = new Date(lastPeriodISO + 'T12:00:00')

      let acct = null
      if (signedInEmail) {
        // Returning sign-in — session already established.
        acct = { email: signedInEmail }
      } else {
        const email = account.email.trim()
        const password = account.accountPassword
        if (!email || !password) {
          setSignupError('Add your email and password to create your account.')
          setFinishing(false)
          return
        }
        const { signUp, signIn } = await import('../lib/supabase')
        try {
          const data = await signUp(email, password)
          acct = { email }
          // Propagate the session to the store immediately so the rest
          // of the app (Settings auth row, etc.) knows the user is
          // authenticated. Supabase returns a session here when
          // "Confirm email" is OFF in the dashboard; otherwise the
          // session lands once they click the verify link.
          if (data?.session) {
            useLuna.getState().setSession(data.session)
          }
          if (data && !data.session) {
            setSignupError("Check your email — we sent you a link to confirm your account. Your Luna is set up either way.")
          }
        } catch (e) {
          // Signup failed — most commonly because the email is already
          // registered. Fall back to signin so the same form handles
          // both new and returning users.
          try {
            const data = await signIn(email, password)
            acct = { email }
            if (data?.session) {
              useLuna.getState().setSession(data.session)
            }
          } catch (signInErr) {
            setSignupError(e?.message || signInErr?.message || 'Could not create account — please try again.')
            setFinishing(false)
            return
          }
        }
      }

      // Stamp the join date — anchors the first-week arc on Home
      // (lib/firstWeek.js). Existing users never get one, so the arc
      // only ever fires for accounts created from today forward.
      updateSetting('joinedAt', new Date().toISOString().slice(0, 10))

      // Save profile to cloud and flip onboarded=true. The store's
      // setOnboarding action handles the cloud write.
      setOnboarding({
        lastPeriodStart: d.toISOString().slice(0, 10),
        cycleLength: cycleDays,
        displayName: account.name.trim(),
        account: acct,
      })

      try {
        const { capture } = await import('../lib/posthog')
        capture('onboarding_completed', { account_created: Boolean(acct) })
      } catch {}
      // Success haptic on arrival — the "you're in" moment.
      import('../lib/haptics').then(({ hapticSuccess }) => hapticSuccess())

      go('home')
    } catch (e) {
      setFatalError(e?.message || "Couldn't finish setup. Please try again.")
      setFinishing(false)
    }
  }

  const validationMessage = () => {
    if (slug !== 'account') return null
    const nameErr = validateName(account.name)
    if (nameErr) return nameErr
    if (signedInEmail) return null
    const emailErr = validateEmail(account.email)
    if (emailErr) return emailErr
    const apErr = validateAccountPassword(account.accountPassword)
    if (apErr) return apErr
    return null
  }

  // Intent must be picked to advance off the intent screen.
  const intent = settings?.intent
  const conditions = settings?.conditions || []
  const priorities = settings?.priorities || []
  const canAdvanceFromIntent = Boolean(intent)

  const blockReason = validationMessage()
  const canAdvance = (slug === 'intent' ? canAdvanceFromIntent : blockReason === null)

  // Decide the next slug given the current one + branching state. Skips
  // the conditions sub-step when intent isn't "managing-condition."
  const nextSlugFrom = (cur) => {
    if (cur === 'intent') {
      return intent === 'managing-condition' ? 'conditions' : 'date'
    }
    if (cur === 'conditions') return 'date'
    if (cur === 'date') return 'cycle'
    if (cur === 'cycle') return 'priorities'
    if (cur === 'priorities') return 'payoff'
    if (cur === 'payoff') return 'account'
    return null
  }
  const slugToRoute = (s) => {
    if (s === 'intent') return 'onbIntent'
    if (s === 'conditions') return 'onbConditions'
    if (s === 'date') return 'onb1'
    if (s === 'cycle') return 'onb2'
    if (s === 'priorities') return 'onbPriorities'
    if (s === 'payoff') return 'onbPayoff'
    if (s === 'account') return 'onb3'
    return 'onb1'
  }
  const prevSlugFrom = (cur) => {
    if (cur === 'date') return intent === 'managing-condition' ? 'conditions' : 'intent'
    if (cur === 'conditions') return 'intent'
    if (cur === 'cycle') return 'date'
    if (cur === 'priorities') return 'cycle'
    if (cur === 'payoff') return 'priorities'
    if (cur === 'account') return 'payoff'
    return null
  }
  const goNext = () => {
    const ns = nextSlugFrom(slug)
    if (ns) go(slugToRoute(ns))
  }
  const goPrev = () => {
    const ps = prevSlugFrom(slug)
    if (ps) go(slugToRoute(ps))
  }
  const next = slug === 'account' ? finish : goNext

  if (finishing || fatalError) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: T.bg, color: T.text }}>
        <StatusView
          loading={finishing && !fatalError}
          loadingMessage="GETTING THINGS READY"
          error={fatalError}
          onRetry={() => { setFatalError(''); finish() }}
        />
      </div>
    )
  }

  return (
    <div className="home-stage">
      <Backdrop accent={T.accent} subtle />
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', padding: '60px 28px 36px', color: T.text, animation: 'fadeUp .3s ease-out both', overflowY: 'auto', minHeight: 0 }}>
      <ProgressBar step={stepNum} />

      {slug !== 'payoff' && (
        <div className="insight-stagger" style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, letterSpacing: -0.1, color: T.muted, marginBottom: 6, fontWeight: 500, animationDelay: '0ms' }}>step {stepNum} of 5</div>
      )}

      {slug === 'intent' && <>
        <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 10, animationDelay: '50ms' }}>
          What brings<br /><em>you to Luna?</em>
        </div>
        <div className="insight-stagger" style={{ fontSize: 14, color: T.muted, marginBottom: 24, fontFamily: T.serif, lineHeight: 1.55, fontStyle: 'italic', animationDelay: '100ms' }}>
          Two minutes, and Luna becomes yours. You can change any of this later.
        </div>
        <div className="insight-stagger" style={{ animationDelay: '160ms' }}>
          <StepIntent value={intent} onChange={(id) => updateSetting('intent', id)} />
        </div>
      </>}

      {slug === 'conditions' && <>
        <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 10, animationDelay: '50ms' }}>
          Which one(s) are<br /><em>you navigating?</em>
        </div>
        <div className="insight-stagger" style={{ fontSize: 14, color: T.muted, marginBottom: 24, fontFamily: T.serif, lineHeight: 1.55, fontStyle: 'italic', animationDelay: '100ms' }}>
          You can pick more than one. Luna will pin what matters for each.
        </div>
        <div className="insight-stagger" style={{ animationDelay: '160ms' }}>
          <StepConditions values={conditions} onChange={(arr) => updateSetting('conditions', arr)} />
        </div>
      </>}

      {slug === 'date' && <>
        <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 10, animationDelay: '50ms' }}>
          When did your<br /><em>last period</em> start?
        </div>
        <div className="insight-stagger" style={{ fontSize: 14, color: T.muted, marginBottom: 24, fontFamily: T.serif, lineHeight: 1.55, fontStyle: 'italic', animationDelay: '100ms' }}>
          A rough estimate is enough. We'll learn the rest from you.
        </div>
        <div className="insight-stagger" style={{ animationDelay: '160ms' }}>
          <StepDate value={lastPeriodISO} onChange={setLastPeriodISO} />
        </div>
      </>}

      {slug === 'cycle' && <>
        <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 10, animationDelay: '50ms' }}>
          How long is your<br /><em>cycle, usually?</em>
        </div>
        <div className="insight-stagger" style={{ fontSize: 14, color: T.muted, marginBottom: 24, fontFamily: T.serif, lineHeight: 1.55, fontStyle: 'italic', animationDelay: '100ms' }}>
          Most cycles land between 21 and 35 days. If yours is different, that's okay — bodies aren't averages.
        </div>
        <div className="insight-stagger" style={{ animationDelay: '160ms' }}>
          <StepCycle
            value={cycleDays}
            onChange={setCycleDays}
            irregular={Boolean(settings?.irregular)}
            onIrregularChange={(v) => updateSetting('irregular', v)}
          />
          {!settings?.irregular && <SourceLine>ACOG — Menstrual Cycle Norms</SourceLine>}
        </div>
      </>}

      {slug === 'priorities' && <>
        <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 10, animationDelay: '50ms' }}>
          What matters<br /><em>most right now?</em>
        </div>
        <div className="insight-stagger" style={{ fontSize: 14, color: T.muted, marginBottom: 24, fontFamily: T.serif, lineHeight: 1.55, fontStyle: 'italic', animationDelay: '100ms' }}>
          Pick as many as feel true. Luna will lead with what you choose — and stay quiet about the rest.
        </div>
        <div className="insight-stagger" style={{ animationDelay: '160ms' }}>
          <StepPriorities values={priorities} onChange={(arr) => updateSetting('priorities', arr)} />
        </div>
      </>}

      {slug === 'payoff' && <>
        <div className="insight-stagger" style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, color: T.muted, marginBottom: 6, fontWeight: 500, letterSpacing: -0.1, animationDelay: '0ms' }}>
          your luna, ready
        </div>
        <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 22, animationDelay: '40ms' }}>
          Here’s what we’ve<br /><em>made for you.</em>
        </div>
        <StepPayoff
          settings={settings}
          displayName={account.name}
          lastPeriodISO={lastPeriodISO}
          cycleDays={cycleDays}
        />
      </>}

      {slug === 'account' && <>
        <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 10, animationDelay: '50ms' }}>
          Last thing —<br /><em>what shall we call you?</em>
        </div>
        <div className="insight-stagger" style={{ fontSize: 14, color: T.muted, marginBottom: 24, fontFamily: T.serif, lineHeight: 1.55, fontStyle: 'italic', animationDelay: '100ms' }}>
          Your name greets you on your home screen.{signedInEmail ? '' : ' Your account is how you sign in on any device.'}
        </div>
        <div className="insight-stagger" style={{ animationDelay: '160ms' }}>
          <StepAccount
            name={account.name}
            email={account.email}
            accountPassword={account.accountPassword}
            onChange={setAccountField}
            signedInEmail={signedInEmail}
          />
        </div>
        {signupError && (
          <div style={{ marginTop: 12, fontFamily: T.sans, fontSize: 12, color: T.accent, lineHeight: 1.5 }}>{signupError}</div>
        )}
      </>}

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {slug === 'account' && blockReason && (
          <div className="frost-card" style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: T.accent, lineHeight: 1.5, padding: '12px 16px', background: T.accent + '14', border: `1px solid ${T.accent}40`, borderRadius: 16 }}>
            {blockReason}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          {slug !== 'intent' && (
            <button onClick={goPrev}
              className="alive-card"
              aria-label="Back"
              style={{
                border: '1px solid rgba(26,19,16,0.08)',
                background: 'rgba(253,250,245,0.55)',
                color: T.text,
                padding: '14px 18px',
                borderRadius: 999,
                cursor: 'pointer',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
              }}>
              {Icons.back}
            </button>
          )}
          <CTAButton full onClick={() => { if (canAdvance && !finishing) next() }} style={{ opacity: canAdvance && !finishing ? 1 : 0.5, letterSpacing: 0.3, textTransform: 'none', fontSize: 13 }}>
            {finishing
              ? 'Getting things ready…'
              : (slug === 'account' ? 'Welcome to Luna' : (slug === 'payoff' ? 'Save your space' : 'Continue'))} {Icons.arrow}
          </CTAButton>
        </div>

      </div>
      </div>
    </div>
  )
}
