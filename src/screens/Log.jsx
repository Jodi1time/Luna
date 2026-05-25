import { useState } from 'react'
import { T } from '../data/theme'
import { Eyebrow, SourceLine, Icons } from '../components/shared'
import { SymptomIcon, MOOD_IDS, MOOD_LABELS } from '../components/symptomIcons'
import { SYMPTOMS } from '../data/lunaData'
import useLuna from '../store/useLuna'
import { validateBBT } from '../lib/validation'

const MUCUS_OPTIONS = [
  { id: 'dry',      label: 'Dry',       sub: 'Low fertility' },
  { id: 'sticky',   label: 'Sticky',    sub: 'Low fertility' },
  { id: 'creamy',   label: 'Creamy',    sub: 'Moderate' },
  { id: 'eggwhite', label: 'Egg-white', sub: 'Peak fertility' },
  { id: 'watery',   label: 'Watery',    sub: 'High fertility' },
]

const SEX_OPTIONS = [
  { id: 'protected',   label: 'Protected' },
  { id: 'unprotected', label: 'Unprotected' },
  { id: 'none',        label: 'None' },
]

export default function Log() {
  const { back, goSymptom, saveLog, getLog } = useLuna()
  const todayISO = new Date().toISOString().slice(0, 10)
  const existing = getLog(todayISO) || {}
  const [mood,     setMood]     = useState(existing.mood || null)
  const [symptoms, setSymptoms] = useState(existing.symptoms || [])
  const [flow,     setFlow]     = useState(existing.flow || null)
  const [bbt,      setBbt]      = useState(existing.bbt?.value ?? '')
  const [bbtUnit,  setBbtUnit]  = useState(existing.bbt?.unit || 'F')
  const [mucus,    setMucus]    = useState(existing.mucus || null)
  const [sex,      setSex]      = useState(existing.sex || null)
  const [note,     setNote]     = useState(existing.note || '')
  const [bbtError, setBbtError] = useState('')

  const toggleSym = (id) =>
    setSymptoms((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id])

  const save = () => {
    const bbtErr = validateBBT(bbt, bbtUnit)
    if (bbtErr) { setBbtError(bbtErr); return }
    setBbtError('')
    const bbtNum = parseFloat(bbt)
    const bbtPayload = !isNaN(bbtNum) && bbt !== '' ? { value: bbtNum, unit: bbtUnit } : null
    saveLog(todayISO, { mood, symptoms, flow, bbt: bbtPayload, mucus, sex, note })
    back()
  }

  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase().replace(',', ' ·')

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: T.bg, color: T.text, animation: 'fadeUp .3s ease-out both', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 22px 30px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0 0', fontFamily: T.sans }}>
          <button onClick={back} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 6 }}>{Icons.close}</button>
          <div style={{ fontSize: 11, color: T.muted, letterSpacing: 1.5, fontWeight: 700 }}>{dateLabel}</div>
          <button onClick={save} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.accent, padding: 6, fontWeight: 700, fontSize: 11, letterSpacing: 1.5, fontFamily: T.sans }}>SAVE</button>
        </div>

        <div style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, margin: '16px 0 6px' }}>
          How was<br /><em>today?</em>
        </div>
        <div style={{ fontSize: 13, color: T.muted, marginBottom: 24, fontFamily: T.sans }}>Tap the ? on any symptom to see the evidence behind it.</div>

        {/* Mood */}
        <Eyebrow>MOOD</Eyebrow>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, gap: 2 }}>
          {MOOD_IDS.map((id) => (
            <button key={id} onClick={() => setMood(id)}
              style={{
                border: 'none', cursor: 'pointer',
                flex: 1, padding: '8px 2px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                background: mood === id ? T.accent + '22' : 'transparent',
                outline: mood === id ? `1.5px solid ${T.accent}` : 'none',
                color: mood === id ? T.accent : T.text,
                borderRadius: T.r, fontFamily: 'inherit',
              }}>
              <SymptomIcon id={id} size={22} />
              <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: 0.2 }}>{MOOD_LABELS[id]}</span>
            </button>
          ))}
        </div>

        {/* Symptoms */}
        <Eyebrow>SYMPTOMS</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 24 }}>
          {Object.entries(SYMPTOMS).slice(0, 8).map(([id, s]) => {
            const on = symptoms.includes(id)
            return (
              <div key={id} style={{ border: `1px solid ${on ? T.accent : T.hair}`, background: on ? T.accent + '12' : T.card, padding: '12px 4px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, position: 'relative', borderRadius: T.r }}>
                <button onClick={() => toggleSym(id)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontFamily: 'inherit', color: on ? T.accent : T.text, padding: 0, width: '100%' }}>
                  <SymptomIcon id={id} size={22} />
                  <span style={{ fontSize: 10, fontWeight: 500 }}>{s.label}</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); goSymptom(id) }}
                  style={{ position: 'absolute', top: 2, right: 3, width: 16, height: 16, padding: 0, background: 'transparent', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 11, fontFamily: T.mono, fontWeight: 700 }}>
                  ?
                </button>
              </div>
            )
          })}
        </div>

        {/* Flow */}
        <Eyebrow>FLOW</Eyebrow>
        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {['Spotting','Light','Medium','Heavy'].map((f) => {
            const on = flow === f
            return (
              <button key={f} onClick={() => setFlow(f)}
                style={{ flex: 1, border: `1px solid ${on ? T.accent : T.hair}`, background: on ? T.accent : T.card, color: on ? '#fff' : T.text, padding: '12px 4px', cursor: 'pointer', fontFamily: T.sans, fontSize: 10, letterSpacing: 0.8, fontWeight: 600, textTransform: 'uppercase', borderRadius: T.r }}>
                {f}
              </button>
            )
          })}
        </div>

        {/* Temperature (BBT) */}
        <Eyebrow>TEMPERATURE · OPTIONAL</Eyebrow>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={bbt}
            onChange={(e) => { setBbt(e.target.value); if (bbtError) setBbtError('') }}
            placeholder={bbtUnit === 'F' ? '97.8' : '36.5'}
            style={{ flex: 1, background: T.card, border: `1px solid ${bbtError ? T.accent : T.hair}`, borderRadius: T.r, padding: '12px 14px', fontSize: 16, fontFamily: T.sans, color: T.text, outline: 'none' }}
          />
          <div style={{ display: 'flex', border: `1px solid ${T.hair}`, borderRadius: T.r, overflow: 'hidden' }}>
            {['F','C'].map((u) => (
              <button key={u} onClick={() => { setBbtUnit(u); if (bbtError) setBbtError('') }}
                style={{ background: bbtUnit === u ? T.text : 'transparent', color: bbtUnit === u ? T.bg : T.text, border: 'none', padding: '12px 14px', cursor: 'pointer', fontFamily: T.sans, fontSize: 11, fontWeight: 700 }}>
                °{u}
              </button>
            ))}
          </div>
        </div>
        {bbtError && (
          <div style={{ fontFamily: T.sans, fontSize: 12, color: T.accent, lineHeight: 1.5, padding: '10px 14px', background: T.accent + '12', border: `1px solid ${T.accent}40`, borderRadius: T.r, marginTop: 6, marginBottom: 8 }}>
            {bbtError}
          </div>
        )}
        <div style={{ fontSize: 11, color: T.muted, fontFamily: T.sans, lineHeight: 1.4, marginBottom: 24 }}>
          Basal body temperature — first thing in the morning, before getting up. Rises ~0.5°F after ovulation.
        </div>

        {/* Discharge (cervical mucus internally — friendlier label here) */}
        <Eyebrow>DISCHARGE · OPTIONAL</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginBottom: 24 }}>
          {MUCUS_OPTIONS.map((m) => {
            const on = mucus === m.id
            return (
              <button key={m.id} onClick={() => setMucus(on ? null : m.id)}
                style={{ border: `1px solid ${on ? T.accent : T.hair}`, background: on ? T.accent + '12' : T.card, color: on ? T.accent : T.text, padding: '10px 4px', cursor: 'pointer', fontFamily: T.sans, fontSize: 10, fontWeight: 600, borderRadius: T.r, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 700 }}>{m.label}</span>
                <span style={{ fontSize: 8.5, color: T.muted, letterSpacing: 0.3 }}>{m.sub}</span>
              </button>
            )
          })}
        </div>

        {/* Sex */}
        <Eyebrow>SEX · OPTIONAL</Eyebrow>
        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {SEX_OPTIONS.map((s) => {
            const on = sex === s.id
            return (
              <button key={s.id} onClick={() => setSex(on ? null : s.id)}
                style={{ flex: 1, border: `1px solid ${on ? T.accent : T.hair}`, background: on ? T.accent : T.card, color: on ? '#fff' : T.text, padding: '12px 4px', cursor: 'pointer', fontFamily: T.sans, fontSize: 10.5, letterSpacing: 0.6, fontWeight: 600, borderRadius: T.r }}>
                {s.label}
              </button>
            )
          })}
        </div>

        {/* Note */}
        <Eyebrow>NOTE</Eyebrow>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What was on your mind today?"
          maxLength={2000}
          style={{ width: '100%', background: T.card, border: `1px solid ${T.hair}`, padding: 14, fontSize: 14, lineHeight: 1.5, color: T.text, minHeight: 80, borderRadius: T.r }} />
        {note.length > 1900 && (
          <div style={{ fontSize: 10, fontFamily: T.mono, color: T.muted, textAlign: 'right', marginTop: 4 }}>
            {note.length} / 2000
          </div>
        )}

        <SourceLine>Daily symptom tracking improves diagnostic accuracy for PMDD & menstrual disorders — ACOG</SourceLine>
      </div>
    </div>
  )
}
