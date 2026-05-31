import { useState, useEffect, useMemo } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, Rule, Screen, SourceLine } from '../components/shared'
import { ARTICLES, SYMPTOMS } from '../data/lunaData'
import { SymptomIcon } from '../components/symptomIcons'
import useLuna from '../store/useLuna'

// Doula-toned scales. Each option is a value, not a verdict — the
// labels deliberately don't lean on "good / bad" framing.
const LIBIDO_OPTIONS = [
  { id: 'low',     label: 'Low',         sub: 'Nothing here today' },
  { id: 'neutral', label: 'Neutral',     sub: 'Just present' },
  { id: 'open',    label: 'Open',        sub: 'A spark, given time' },
  { id: 'high',    label: 'Strong',      sub: 'Drawn toward it' },
]
const LUBRICATION_OPTIONS = [
  { id: 'dry',     label: 'Dry',        sub: 'Could use lube' },
  { id: 'low',     label: 'A little',   sub: 'Some, not much' },
  { id: 'normal',  label: 'Comfortable', sub: 'No notes' },
  { id: 'high',    label: 'Abundant',   sub: 'Wet, easily' },
]
const PAINFUL_OPTIONS = [
  { id: 'none',     label: 'None',          sub: 'No pain' },
  { id: 'some',     label: 'Some',          sub: 'A little discomfort' },
  { id: 'significant', label: 'Significant', sub: 'Worth a note' },
]

// Vaginal-health symptoms surfaced specifically on this screen so the
// main Log stays compact. These are the day-to-day issues women carry
// without language.
const INTIMATE_SYMPTOM_IDS = ['uti', 'yeast', 'bv', 'vulvarPain']

const ARTICLE_IDS = ['anatomy-vulva', 'libido', 'painful-sex', 'yeast-bv', 'uti']

function OptionGrid({ value, onChange, options }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${options.length}, 1fr)`, gap: 6 }}>
      {options.map((o) => {
        const on = value === o.id
        return (
          <button key={o.id} onClick={() => onChange(on ? null : o.id)}
            style={{
              border: `1px solid ${on ? T.accent : T.hair}`,
              background: on ? T.accent + '12' : T.card,
              color: on ? T.accent : T.text,
              padding: '11px 6px 9px',
              borderRadius: T.r,
              cursor: 'pointer',
              fontFamily: T.sans,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            }}>
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.2 }}>{o.label}</span>
            <span style={{ fontSize: 9.5, color: T.muted, letterSpacing: 0.2, fontWeight: 500, textAlign: 'center', lineHeight: 1.3 }}>{o.sub}</span>
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

export default function IntimateHealth() {
  const store = useLuna()
  const { back, goArticle, saveLog, getLog, logs } = store
  const todayISO = new Date().toISOString().slice(0, 10)
  const existing = getLog(todayISO) || {}
  const initialIntimate = existing.intimate || {}

  const [libido, setLibido] = useState(initialIntimate.libido || null)
  const [lubrication, setLubrication] = useState(initialIntimate.lubrication || null)
  const [painful, setPainful] = useState(initialIntimate.painful_sex || null)
  const [orgasm, setOrgasm] = useState(initialIntimate.orgasm_count ?? 0)
  const [symptoms, setSymptoms] = useState(() => (existing.symptoms || []).filter((s) => INTIMATE_SYMPTOM_IDS.includes(s)))
  const [otherSymptoms, setOtherSymptoms] = useState(() => (existing.symptoms || []).filter((s) => !INTIMATE_SYMPTOM_IDS.includes(s)))
  const [saved, setSaved] = useState(false)

  // If the log changes under us (e.g. user came back after editing
  // elsewhere), re-seed.
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
    // Merge intimate-screen symptoms back with the other symptoms
    // already logged so we don't clobber non-intimate ticks.
    const allSymptoms = [...new Set([...otherSymptoms, ...symptoms])]
    saveLog(new Date(), { intimate, symptoms: allSymptoms })
    setSaved(true)
    setTimeout(() => setSaved(false), 1200)
  }

  return (
    <Screen padBottom={40}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="intimate health" onBack={back} />
        <Eyebrow>Your sexual life, on your own terms</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 500, letterSpacing: -0.7, lineHeight: 1.08 }}>
          What's the body telling you today?
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 14.5, lineHeight: 1.6, color: T.muted, marginTop: 10 }}>
          Desire, lubrication, pain, pleasure — all of it counts as health. Track what feels worth tracking. None of this is required, none of it is graded.
        </div>
        <Rule />

        {/* Today's intimate check-in */}
        <Eyebrow>Today</Eyebrow>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: T.serif, fontSize: 14, fontStyle: 'italic', marginBottom: 8, color: T.text }}>Libido</div>
          <OptionGrid value={libido} onChange={setLibido} options={LIBIDO_OPTIONS} />
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: T.serif, fontSize: 14, fontStyle: 'italic', marginBottom: 8, color: T.text }}>Lubrication</div>
          <OptionGrid value={lubrication} onChange={setLubrication} options={LUBRICATION_OPTIONS} />
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: T.serif, fontSize: 14, fontStyle: 'italic', marginBottom: 8, color: T.text }}>Pain during or after sex</div>
          <OptionGrid value={painful} onChange={setPainful} options={PAINFUL_OPTIONS} />
        </div>

        <div style={{ marginBottom: 22 }}>
          <div style={{ fontFamily: T.serif, fontSize: 14, fontStyle: 'italic', marginBottom: 8, color: T.text }}>Orgasm count (optional)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 4px' }}>
            <button onClick={() => setOrgasm(Math.max(0, orgasm - 1))} disabled={orgasm === 0}
              style={{ width: 40, height: 40, borderRadius: T.r, border: `1px solid ${T.hair}`, background: T.card, color: T.text, fontSize: 18, cursor: orgasm === 0 ? 'default' : 'pointer', opacity: orgasm === 0 ? 0.4 : 1 }}>
              –
            </button>
            <div style={{ flex: 1, textAlign: 'center', fontFamily: T.serif, fontSize: 22, fontWeight: 500, color: orgasm > 0 ? T.accent : T.muted }}>
              {orgasm}
            </div>
            <button onClick={() => setOrgasm(orgasm + 1)}
              style={{ width: 40, height: 40, borderRadius: T.r, border: `1px solid ${T.accent}`, background: T.accent, color: '#fff', fontSize: 18, cursor: 'pointer' }}>
              +
            </button>
          </div>
        </div>

        <Eyebrow>Anything else going on down there</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 22 }}>
          {INTIMATE_SYMPTOM_IDS.map((id) => {
            const s = SYMPTOMS[id]
            if (!s) return null
            const on = symptoms.includes(id)
            return (
              <button key={id} onClick={() => toggleSymptom(id)}
                style={{ border: `1px solid ${on ? T.accent : T.hair}`, background: on ? T.accent + '12' : T.card, padding: '12px 4px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, borderRadius: T.r, cursor: 'pointer', color: on ? T.accent : T.text }}>
                <SymptomIcon id={id} size={22} />
                <span style={{ fontSize: 10, fontWeight: 500, fontFamily: T.sans, textAlign: 'center', lineHeight: 1.25 }}>{s.label}</span>
              </button>
            )
          })}
        </div>

        <button onClick={save}
          className={saved ? 'success-pulse' : ''}
          style={{ width: '100%', background: T.accent, color: '#fff', border: 'none', padding: '13px 14px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, letterSpacing: 0.4 }}>
          {saved ? 'Saved' : 'Save to today'}
        </button>

        {patterns && patterns.length > 0 && (
          <>
            <Rule />
            <Eyebrow>What Luna is noticing</Eyebrow>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {patterns.map((line, i) => (
                <div key={i} className="glass-card" style={{ padding: '12px 14px', borderLeft: `3px solid ${T.accent}`, borderRadius: T.r }}>
                  <div style={{ fontFamily: T.serif, fontSize: 14, lineHeight: 1.55, color: T.text, fontStyle: 'italic' }}>
                    {line}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <Rule />
        <Eyebrow>To read with a cup of tea</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
          {ARTICLE_IDS.map((id) => {
            const a = ARTICLES.find((x) => x.id === id)
            if (!a) return null
            return (
              <button key={id} onClick={() => goArticle(id)}
                style={{ background: 'transparent', border: 'none', textAlign: 'left', padding: 0, cursor: 'pointer', color: T.text, fontFamily: 'inherit' }}>
                <div style={{ fontFamily: T.serif, fontSize: 16, fontWeight: 500, lineHeight: 1.25 }}>{a.title} →</div>
                <div style={{ fontFamily: T.sans, fontSize: 11.5, color: T.muted, marginTop: 2 }}>{a.read} · {a.cat}</div>
              </button>
            )
          })}
        </div>

        <SourceLine>Sexual wellness is wellness. Your data stays as private as the rest of your cycle data.</SourceLine>
        <div style={{ height: 16 }} />
      </div>
    </Screen>
  )
}
