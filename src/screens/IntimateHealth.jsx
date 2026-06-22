import { useState, useEffect, useMemo } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, Rule, Screen, SourceLine } from '../components/shared'
import { ARTICLES, SYMPTOMS } from '../data/lunaData'
import { SymptomIcon } from '../components/symptomIcons'
import { PhaseFlourish } from '../components/phaseFlourishes'
import { useCycle } from '../hooks/useCycle'
import { sectionColors, sectionPaper } from '../data/sectionPalette'
import useLuna from '../store/useLuna'
import { todayKey } from '../lib/dateOnly'

// Doula-toned scales. Each option is a value, not a verdict — the
// labels deliberately don't lean on "good / bad" framing.
const LIBIDO_OPTIONS = [
  { id: 'low',     label: 'Low',     sub: 'Nothing here today' },
  { id: 'neutral', label: 'Neutral', sub: 'Just present' },
  { id: 'open',    label: 'Open',    sub: 'A spark, given time' },
  { id: 'high',    label: 'Strong',  sub: 'Drawn toward it' },
]
const LUBRICATION_OPTIONS = [
  { id: 'dry',     label: 'Dry',         sub: 'Could use lube' },
  { id: 'low',     label: 'A little',    sub: 'Some, not much' },
  { id: 'normal',  label: 'Comfortable', sub: 'No notes' },
  { id: 'high',    label: 'Abundant',    sub: 'Wet, easily' },
]
const PAINFUL_OPTIONS = [
  { id: 'none',        label: 'None',        sub: 'No pain' },
  { id: 'some',        label: 'Some',        sub: 'A little discomfort' },
  { id: 'significant', label: 'Significant', sub: 'Worth a note' },
]

// Vaginal-health symptoms surfaced specifically on this screen so the
// main Log stays compact. These are the day-to-day issues women carry
// without language.
const INTIMATE_SYMPTOM_IDS = ['uti', 'yeast', 'bv', 'vulvarPain']

const ARTICLE_IDS = ['anatomy-vulva', 'libido', 'painful-sex', 'yeast-bv', 'uti']

// Phase context — what the cycle phase is doing to libido / lubrication
// / mood in a one-liner. Doula tone — never "optimal" or "peak"
// framing; never "should". Just naming what's true.
const PHASE_NOTE = {
  menstrual:
    "Your body is shedding. Many notice libido inward, lubrication lower — that's not absence of desire, it's a change in shape.",
  follicular:
    "Estrogen rising. Many notice libido lifting, energy moving outward. A good week to notice what arouses you, not what you should want.",
  ovulation:
    "Estrogen + testosterone peaking. Many notice libido at its highest, lubrication abundant. Pay attention to what you're drawn to — the body is louder this week.",
  luteal:
    "Progesterone rising, estrogen falling. Many notice libido turning quieter, slower, more emotional. Soft attention often lands here.",
}

// Scale colour gradients per dimension — light → deep mauve / peach.
// Used to wash the row so the eye reads "this is a scale," not "four
// identical chips." Tints are picked from the intimate section family.
const LIBIDO_SHADES =      ['#F5DCE0', '#EDC0CB', '#D89BAE', '#C68799']
const LUBRICATION_SHADES = ['#F5E0D2', '#F1CDB6', '#E3B49C', '#D88B5A']
const PAIN_SHADES =        ['#E8E0EC', '#E5B5B5', '#C84E2E']

// Soft frosted "scale" row. Each option is a pill carrying a soft tint
// from the gradient (deeper = "more"). Selected fills with the shade.
function ScaleRow({ value, onChange, options, shades }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${options.length}, 1fr)`, gap: 6 }}>
      {options.map((o, idx) => {
        const on = value === o.id
        const shade = shades[idx] || shades[shades.length - 1]
        return (
          <button key={o.id} onClick={() => onChange(on ? null : o.id)}
            className="alive-card frost-card"
            style={{
              border: `1px solid ${on ? shade : 'rgba(26,19,16,0.06)'}`,
              background: on
                ? shade
                : `linear-gradient(160deg, ${shade}24, rgba(253,250,245,0.5))`,
              color: on ? '#fff' : T.text,
              padding: '14px 6px 12px',
              borderRadius: 18,
              cursor: 'pointer',
              fontFamily: T.sans,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              boxShadow: on
                ? `0 14px 28px -16px ${shade}aa`
                : `0 10px 22px -22px ${shade}60`,
              transition: 'all 0.22s var(--ease-out)',
            }}>
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.1, fontFamily: T.serif }}>{o.label}</span>
            <span style={{ fontSize: 9.5, color: on ? 'rgba(255,255,255,0.85)' : T.muted, fontStyle: 'italic', fontFamily: T.serif, textAlign: 'center', lineHeight: 1.35 }}>{o.sub}</span>
          </button>
        )
      })}
    </div>
  )
}

// Look back over recent intimate-health logs to surface a quiet pattern
// line if one exists. Phase-aware where possible.
function intimatePatterns(logs, cycleLengthDays = 60) {
  const cutoff = new Date(); cutoff.setHours(0,0,0,0)
  cutoff.setDate(cutoff.getDate() - cycleLengthDays)
  const recent = Object.entries(logs || {})
    .filter(([d]) => new Date(d + 'T00:00:00') >= cutoff)
    .map(([, l]) => l)
    .filter((l) => l?.intimate)
  if (recent.length < 3) return null
  const painfulCount = recent.filter((l) => l.intimate?.painful_sex === 'significant').length
  const dryCount = recent.filter((l) => l.intimate?.lubrication === 'dry').length
  const lowLibido = recent.filter((l) => l.intimate?.libido === 'low').length
  const lines = []
  if (painfulCount >= 2) lines.push(`Painful sex has shown up ${painfulCount} times recently — worth bringing up.`)
  if (dryCount >= 3) lines.push(`Lubrication has been low ${dryCount} times — could be cycle phase, medication, or stage of life.`)
  if (lowLibido >= 4) lines.push(`Low libido on ${lowLibido} recent entries. Sometimes it's just the season; sometimes it's medication or stress worth tracing.`)
  return lines.length ? lines : null
}

// Section label — small intimate-tinted dot + italic serif lowercase
// heading. Used inside the page to group fields under a warm
// editorial signpost instead of a flat eyebrow.
function GroupHead({ label, accent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <div style={{ width: 6, height: 6, borderRadius: 999, background: accent, boxShadow: `0 0 0 3px ${accent}22` }} />
      <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 14.5, fontWeight: 500, color: T.text, letterSpacing: -0.1 }}>
        {label.toLowerCase()}.
      </div>
    </div>
  )
}

export default function IntimateHealth() {
  const store = useLuna()
  const { back, goArticle, saveLog, getLog, logs } = store
  const cycle = useCycle(store)
  const phase = cycle?.phase
  const intimate = sectionColors('intimate')
  const acc = intimate.accent
  const todayISO = todayKey()
  const existing = getLog(todayISO) || {}
  const initialIntimate = existing.intimate || {}

  const [libido, setLibido] = useState(initialIntimate.libido || null)
  const [lubrication, setLubrication] = useState(initialIntimate.lubrication || null)
  const [painful, setPainful] = useState(initialIntimate.painful_sex || null)
  const [orgasm, setOrgasm] = useState(initialIntimate.orgasm_count ?? 0)
  const [symptoms, setSymptoms] = useState(() => (existing.symptoms || []).filter((s) => INTIMATE_SYMPTOM_IDS.includes(s)))
  const [otherSymptoms, setOtherSymptoms] = useState(() => (existing.symptoms || []).filter((s) => !INTIMATE_SYMPTOM_IDS.includes(s)))
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const log = getLog(todayISO) || {}
    const intimate = log.intimate || {}
    setLibido(intimate.libido || null)
    setLubrication(intimate.lubrication || null)
    setPainful(intimate.painful_sex || null)
    setOrgasm(intimate.orgasm_count ?? 0)
    setSymptoms((log.symptoms || []).filter((s) => INTIMATE_SYMPTOM_IDS.includes(s)))
    setOtherSymptoms((log.symptoms || []).filter((s) => !INTIMATE_SYMPTOM_IDS.includes(s)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayISO])

  const toggleSymptom = (id) => {
    setSymptoms((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id])
  }

  const patterns = useMemo(() => intimatePatterns(logs), [logs])

  const save = () => {
    const intimate = {
      libido: libido || null,
      lubrication: lubrication || null,
      painful_sex: painful || null,
      orgasm_count: orgasm > 0 ? orgasm : null,
    }
    const allSymptoms = [...new Set([...otherSymptoms, ...symptoms])]
    saveLog(new Date(), { intimate, symptoms: allSymptoms })
    setSaved(true)
    setTimeout(() => setSaved(false), 1200)
  }

  const phaseNote = phase ? PHASE_NOTE[phase.id] : null

  return (
    <Screen padBottom={120}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="intimate health" onBack={back} />

        {/* Hero — soft mauve gradient wash, centered phase flourish,
            italic serif headline, gentle subtitle. */}
        <div className="insight-stagger" style={{
          margin: '4px -22px 0', padding: '14px 28px 22px',
          background: `linear-gradient(180deg, ${acc}14 0%, transparent 80%)`,
          textAlign: 'center', animationDelay: '0ms',
        }}>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: acc, fontWeight: 500, letterSpacing: 0.2, opacity: 0.9, marginBottom: 8 }}>
            your sexual life, your way
          </div>
          {phase && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6, color: acc, opacity: 0.6 }} aria-hidden="true">
              <PhaseFlourish phaseId={phase.id} size={24} />
            </div>
          )}
          <div style={{ fontFamily: T.serif, fontSize: 32, fontWeight: 400, letterSpacing: -0.6, lineHeight: 1.1, color: T.text, fontStyle: 'italic' }}>
            What's the body
            <br />
            telling you today?
          </div>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 14, color: T.muted, lineHeight: 1.55, marginTop: 14, maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
            Desire, lubrication, pain, pleasure — all of it counts as health. None of this is required, none of it is graded.
          </div>
        </div>

        {/* Phase context — what's TRUE in this phase. Quiet poetic
            note in a soft intimate-tinted frosted card. */}
        {phaseNote && (
          <div className="insight-stagger alive-card frost-card" style={{
            marginTop: 18, padding: 18,
            background: sectionPaper('intimate'),
            border: `1px solid ${acc}22`,
            borderLeft: `3px solid ${acc}`,
            borderRadius: 22,
            boxShadow: `0 14px 30px -22px ${acc}50`,
            animationDelay: '90ms',
          }}>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, color: acc, fontWeight: 500, letterSpacing: -0.1, marginBottom: 8 }}>
              in your {phase.name.toLowerCase()} phase
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 15.5, lineHeight: 1.55, color: T.text, fontStyle: 'italic', letterSpacing: -0.1 }}>
              {phaseNote}
            </div>
          </div>
        )}

        {/* Today's check-in — three scale rows + orgasm counter */}
        <div className="insight-stagger" style={{ marginTop: 26, animationDelay: '140ms' }}>
          <GroupHead label="Libido" accent={acc} />
          <ScaleRow value={libido} onChange={setLibido} options={LIBIDO_OPTIONS} shades={LIBIDO_SHADES} />
        </div>

        <div className="insight-stagger" style={{ marginTop: 22, animationDelay: '180ms' }}>
          <GroupHead label="Lubrication" accent={acc} />
          <ScaleRow value={lubrication} onChange={setLubrication} options={LUBRICATION_OPTIONS} shades={LUBRICATION_SHADES} />
        </div>

        <div className="insight-stagger" style={{ marginTop: 22, animationDelay: '220ms' }}>
          <GroupHead label="Pain during or after sex" accent={acc} />
          <ScaleRow value={painful} onChange={setPainful} options={PAINFUL_OPTIONS} shades={PAIN_SHADES} />
        </div>

        {/* Orgasm counter — frosted card with circular minus / plus
            buttons and a large italic count. The count itself isn't
            a goal — it's a record of what was true. */}
        <div className="insight-stagger" style={{ marginTop: 22, animationDelay: '260ms' }}>
          <GroupHead label="Orgasm count (optional)" accent={acc} />
          <div className="frost-card" style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 16px',
            background: sectionPaper('intimate'),
            border: `1px solid ${acc}22`,
            borderRadius: 18,
            boxShadow: `0 10px 22px -22px ${acc}40`,
          }}>
            <button onClick={() => setOrgasm(Math.max(0, orgasm - 1))} disabled={orgasm === 0} aria-label="Decrease count"
              className="alive-card"
              style={{ width: 40, height: 40, borderRadius: 999, border: '1px solid rgba(26,19,16,0.10)', background: 'rgba(253,250,245,0.6)', color: T.text, fontSize: 18, fontFamily: T.serif, cursor: orgasm === 0 ? 'default' : 'pointer', opacity: orgasm === 0 ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              –
            </button>
            <div style={{ flex: 1, textAlign: 'center', fontFamily: T.serif, fontSize: 28, fontWeight: 400, fontStyle: 'italic', color: orgasm > 0 ? acc : T.muted, letterSpacing: -0.5, lineHeight: 1 }}>
              {orgasm}
            </div>
            <button onClick={() => setOrgasm(orgasm + 1)} aria-label="Increase count"
              className="alive-card"
              style={{ width: 40, height: 40, borderRadius: 999, border: 'none', background: acc, color: '#fff', fontSize: 18, fontFamily: T.serif, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 18px -8px ${acc}90` }}>
              +
            </button>
          </div>
        </div>

        {/* Vaginal symptoms — same intimate-tinted card grid */}
        <div className="insight-stagger" style={{ marginTop: 22, animationDelay: '300ms' }}>
          <GroupHead label="Anything else going on down there" accent={acc} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {INTIMATE_SYMPTOM_IDS.map((id) => {
              const s = SYMPTOMS[id]
              if (!s) return null
              const on = symptoms.includes(id)
              return (
                <button key={id} onClick={() => toggleSymptom(id)}
                  className="alive-card frost-card"
                  style={{
                    border: `1px solid ${on ? acc + '55' : 'rgba(26,19,16,0.06)'}`,
                    background: on ? acc + '15' : sectionPaper('intimate'),
                    padding: '14px 4px 12px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    borderRadius: 18,
                    cursor: 'pointer',
                    color: on ? acc : T.text,
                    boxShadow: on ? `0 12px 22px -16px ${acc}80` : `0 10px 22px -22px ${acc}40`,
                    transition: 'all 0.22s var(--ease-out)',
                  }}>
                  <span style={{
                    width: 30, height: 30, borderRadius: 999,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    background: on ? `${acc}24` : `${acc}14`,
                    color: acc,
                  }}>
                    <SymptomIcon id={id} size={18} />
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 500, fontFamily: T.serif, textAlign: 'center', lineHeight: 1.3, letterSpacing: -0.1 }}>{s.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Save — pill CTA */}
        <button onClick={save}
          className={`alive-card${saved ? ' success-pulse' : ''}`}
          style={{ marginTop: 28, width: '100%', background: acc, color: '#fff', border: 'none', padding: '15px 18px', borderRadius: 999, cursor: 'pointer', fontFamily: T.sans, fontSize: 13, fontWeight: 600, letterSpacing: 0.3, boxShadow: `0 14px 28px -10px ${acc}80` }}>
          {saved ? 'Saved' : 'Save to today'}
        </button>

        {/* Patterns — what Luna has noticed across recent logs */}
        {patterns && patterns.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <GroupHead label="What Luna is noticing" accent={acc} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {patterns.map((line, i) => (
                <div key={i} className="alive-card frost-card" style={{
                  padding: 18,
                  background: sectionPaper('intimate'),
                  border: `1px solid ${acc}22`,
                  borderLeft: `3px solid ${acc}`,
                  borderRadius: 20,
                  boxShadow: `0 14px 30px -22px ${acc}50`,
                }}>
                  <div style={{ fontFamily: T.serif, fontSize: 14.5, lineHeight: 1.6, color: T.text, fontStyle: 'italic' }}>
                    {line}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Articles — frosted soft cards with intimate accent borderLeft */}
        <div style={{ marginTop: 32 }}>
          <GroupHead label="To read with a cup of tea" accent={acc} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
            {ARTICLE_IDS.map((id) => {
              const a = ARTICLES.find((x) => x.id === id)
              if (!a) return null
              return (
                <button key={id} onClick={() => goArticle(id)}
                  className="alive-card frost-card"
                  style={{ background: 'rgba(253,250,245,0.55)', border: '1px solid rgba(26,19,16,0.06)', borderLeft: `3px solid ${acc}`, textAlign: 'left', padding: 16, cursor: 'pointer', color: T.text, fontFamily: 'inherit', borderRadius: 18, boxShadow: `0 14px 30px -22px ${acc}40` }}>
                  <div style={{ fontFamily: T.serif, fontSize: 16, fontWeight: 500, lineHeight: 1.3, letterSpacing: -0.1 }}>{a.title} →</div>
                  <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12, color: T.muted, marginTop: 4 }}>{a.read} · {a.cat}</div>
                </button>
              )
            })}
          </div>
        </div>

        <SourceLine>Sexual wellness is wellness. Your data stays as private as the rest of your cycle data.</SourceLine>
        <div style={{ height: 16 }} />
      </div>
    </Screen>
  )
}
