import { useState } from 'react'
import { T } from '../data/theme'
import { Screen, Icons } from '../components/shared'
import useLuna from '../store/useLuna'

const todayISO = () => new Date().toISOString().slice(0, 10)

const groups = [
  { key: 'mood', label: 'Mood', icon: '☻', options: ['Calm', 'Anxious', 'Irritable', 'Low'] },
  { key: 'body', label: 'Body', icon: '♁', options: ['Cramps', 'Bloating', 'Tender breasts', 'Back ache'] },
  { key: 'flow', label: 'Flow', icon: '◌', options: ['None', 'Spotting', 'Light', 'Medium', 'Heavy'] },
  { key: 'sleep', label: 'Sleep', icon: '☾', options: ['Restful', 'Restless', 'Woke up', 'Too little'] },
]

function Chip({ children, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      border: `1px solid ${selected ? T.accent : 'rgba(26,19,16,0.08)'}`,
      background: selected ? `${T.accent}12` : 'rgba(255,255,255,0.46)',
      color: selected ? T.accent : T.text,
      borderRadius: 10,
      padding: '10px 12px',
      fontFamily: T.sans,
      fontSize: 12.5,
      fontWeight: selected ? 700 : 500,
      boxShadow: selected ? `0 10px 18px -16px ${T.accent}` : 'none',
    }}>{children}</button>
  )
}

function PremiumPanel({ children }) {
  return (
    <div style={{
      border: '1px solid rgba(26,19,16,0.075)',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.78), rgba(253,250,245,0.58))',
      borderRadius: 22,
      padding: 16,
      boxShadow: T.shadow.md,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.72)' }} />
      <div style={{ position: 'relative' }}>{children}</div>
    </div>
  )
}

export default function PremiumLog() {
  const store = useLuna()
  const { back, saveLog, activeLogDate, setActiveLogDate, getLog } = store
  const date = activeLogDate && activeLogDate <= todayISO() ? activeLogDate : todayISO()
  const existing = getLog(date) || {}

  const [picked, setPicked] = useState({
    mood: existing.mood || existing.moods?.[0] || null,
    body: existing.symptoms?.[0] || null,
    flow: existing.flow || null,
    sleep: existing.sleep || null,
  })
  const [hours, setHours] = useState(existing.sleepHours || 6.5)
  const [note, setNote] = useState(existing.note || '')

  const save = () => {
    saveLog(date, {
      moods: picked.mood ? [picked.mood] : [],
      mood: picked.mood || null,
      symptoms: picked.body ? [picked.body] : [],
      flow: picked.flow === 'None' ? null : picked.flow,
      sleep: picked.sleep || null,
      note,
    })
    setActiveLogDate(null)
    back()
  }

  return (
    <Screen padBottom={28}>
      <div style={{ padding: '18px 22px 0', color: T.text }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <button onClick={back} aria-label="Close" style={{ background: 'transparent', border: 'none', color: T.text, padding: 6 }}>{Icons.close}</button>
          <div style={{ fontFamily: T.serif, fontSize: 21, letterSpacing: -0.3 }}>Log</div>
          <div style={{ fontSize: 20, color: T.text }}>▢</div>
        </header>

        <h1 style={{ fontFamily: T.serif, fontSize: 31, lineHeight: 1.02, letterSpacing: -0.8, fontWeight: 500, margin: '0 0 16px' }}>
          What changed in<br />your body today?
        </h1>

        <PremiumPanel>
          <div style={{ display: 'grid', gap: 20 }}>
            {groups.map((group) => (
              <section key={group.key} style={{ display: 'grid', gridTemplateColumns: '32px 1fr', gap: 14, borderBottom: group.key === 'sleep' ? 'none' : '1px solid rgba(26,19,16,0.08)', paddingBottom: group.key === 'sleep' ? 0 : 18 }}>
                <div style={{ fontFamily: T.serif, fontSize: 23, color: T.muted, paddingTop: 21 }}>{group.icon}</div>
                <div>
                  <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.5, color: T.muted, fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 }}>{group.label}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {group.options.map((option) => (
                      <Chip key={option} selected={picked[group.key] === option} onClick={() => setPicked((p) => ({ ...p, [group.key]: p[group.key] === option ? null : option }))}>
                        {option}
                      </Chip>
                    ))}
                  </div>
                  {group.key === 'sleep' && (
                    <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <span style={{ fontFamily: T.sans, fontSize: 13, color: T.muted }}>Hours slept</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button onClick={() => setHours((h) => Math.max(0, Number(h) - 0.5))} style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid rgba(26,19,16,0.08)', background: '#fff' }}>−</button>
                        <span style={{ fontFamily: T.sans, fontSize: 14, minWidth: 28, textAlign: 'center' }}>{hours}</span>
                        <button onClick={() => setHours((h) => Number(h) + 0.5)} style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid rgba(26,19,16,0.08)', background: '#fff' }}>+</button>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            ))}

            <section style={{ display: 'grid', gridTemplateColumns: '32px 1fr', gap: 14 }}>
              <div style={{ fontFamily: T.serif, fontSize: 22, color: T.muted, paddingTop: 21 }}>✎</div>
              <div>
                <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.5, color: T.muted, fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 }}>Notes</div>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="A sentence is enough." style={{
                  width: '100%', minHeight: 86, resize: 'none', border: '1px solid rgba(26,19,16,0.08)', borderRadius: 14,
                  background: 'rgba(26,19,16,0.035)', padding: 13, color: T.text, fontFamily: T.sans, fontSize: 13.5, lineHeight: 1.4,
                }} />
                <div style={{ textAlign: 'right', fontFamily: T.sans, fontSize: 11, color: T.muted, marginTop: 4 }}>{note.length}/300</div>
              </div>
            </section>
          </div>
        </PremiumPanel>

        <div style={{ textAlign: 'center', fontFamily: T.sans, fontSize: 12, color: T.muted, margin: '14px 0 12px' }}>⌕ Private on this device</div>

        <button onClick={save} style={{ width: '100%', border: 'none', borderRadius: 14, padding: '16px 18px', background: `linear-gradient(180deg, ${T.accent}, #AF3E24)`, color: '#fff', fontFamily: T.sans, fontSize: 15, fontWeight: 700, boxShadow: `0 16px 30px -18px ${T.accent}` }}>
          Save log
        </button>
      </div>
    </Screen>
  )
}
