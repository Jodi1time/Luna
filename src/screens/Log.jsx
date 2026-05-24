import { useState } from 'react'
import { T } from '../data/theme'
import { Eyebrow, SourceLine, Icons } from '../components/shared'
import { SymptomIcon, MOOD_IDS, MOOD_LABELS } from '../components/symptomIcons'
import { SYMPTOMS } from '../data/lunaData'
import useLuna from '../store/useLuna'

export default function Log() {
  const { back, goSymptom, saveLog, getLog } = useLuna()
  const todayISO = new Date().toISOString().slice(0, 10)
  const existing = getLog(todayISO) || {}
  const [mood,     setMood]     = useState(existing.mood || null)
  const [symptoms, setSymptoms] = useState(existing.symptoms || [])
  const [flow,     setFlow]     = useState(existing.flow || null)
  const [note,     setNote]     = useState(existing.note || '')

  const toggleSym = (id) =>
    setSymptoms((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id])

  const save = () => {
    saveLog(todayISO, { mood, symptoms, flow, note })
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
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          {MOOD_IDS.map((id) => (
            <button key={id} onClick={() => setMood(id)} title={MOOD_LABELS[id]}
              style={{
                border: 'none', cursor: 'pointer', width: 40, height: 40,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: mood === id ? T.accent + '22' : 'transparent',
                outline: mood === id ? `1.5px solid ${T.accent}` : 'none',
                color: mood === id ? T.accent : T.text,
                borderRadius: T.r, fontFamily: 'inherit',
              }}>
              <SymptomIcon id={id} size={22} />
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

        {/* Note */}
        <Eyebrow>NOTE</Eyebrow>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What was on your mind today?"
          style={{ width: '100%', background: T.card, border: `1px solid ${T.hair}`, padding: 14, fontSize: 14, lineHeight: 1.5, color: T.text, minHeight: 80, borderRadius: T.r }} />

        <SourceLine>Daily symptom tracking improves diagnostic accuracy for PMDD & menstrual disorders — ACOG</SourceLine>
      </div>
    </div>
  )
}
