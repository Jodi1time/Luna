import { useState } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, Rule, SourceLine, Screen, Icons } from '../components/shared'
import { RED_FLAGS, ARTICLES } from '../data/lunaData'
import useLuna from '../store/useLuna'

export default function HealthWatch() {
  const { back, goArticle } = useLuna()
  const [answers, setAnswers] = useState({})
  const toggle = (id) => setAnswers((a) => ({ ...a, [id]: !a[id] }))
  const triggered = RED_FLAGS.filter((f) => answers[f.id])

  return (
    <Screen padBottom={30}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="Health Watch" onBack={back} />
        <Eyebrow>SCREENER · NOT A DIAGNOSIS</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 500, letterSpacing: -0.6, lineHeight: 1.1 }}>When should you talk to a doctor?</div>
        <div style={{ fontFamily: T.serif, fontSize: 14.5, lineHeight: 1.55, color: T.muted, marginTop: 10 }}>
          Tap any that apply to you. This isn't a diagnosis — it's a conversation starter you can show your provider.
        </div>
        <Rule />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {RED_FLAGS.map((f) => {
            const on = !!answers[f.id]
            return (
              <button key={f.id} onClick={() => toggle(f.id)}
                style={{ border: `1px solid ${on ? T.accent : T.hair}`, background: on ? T.accent + '0E' : T.card, padding: '14px 14px 14px 44px', cursor: 'pointer', fontFamily: 'inherit', color: T.text, textAlign: 'left', position: 'relative', borderRadius: T.r }}>
                <div style={{ position: 'absolute', top: 14, left: 14, width: 18, height: 18, border: `1.5px solid ${on ? T.accent : T.muted}`, background: on ? T.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', borderRadius: 2 }}>
                  {on && Icons.check}
                </div>
                <div style={{ fontFamily: T.serif, fontSize: 14.5, fontWeight: 500, marginBottom: on ? 6 : 0, lineHeight: 1.35 }}>{f.q}</div>
                {on && <div style={{ fontFamily: T.sans, fontSize: 12, color: T.muted, lineHeight: 1.45, animation: 'fadeUp .2s ease-out both' }}>{f.a}</div>}
              </button>
            )
          })}
        </div>

        {triggered.length > 0 && (
          <div style={{ marginTop: 22, padding: 18, background: T.text, color: '#FAF4ED', borderRadius: T.r, animation: 'fadeUp .25s ease-out both' }}>
            <div style={{ fontFamily: T.sans, fontSize: 10, letterSpacing: 2, color: T.accent, fontWeight: 700, marginBottom: 8 }}>NEXT STEP</div>
            <div style={{ fontFamily: T.serif, fontSize: 18, lineHeight: 1.3, marginBottom: 10 }}>
              You flagged <strong>{triggered.length}</strong> {triggered.length === 1 ? 'item' : 'items'}. <em style={{ color: T.accent }}>Worth a doctor's visit.</em>
            </div>
            <div style={{ fontFamily: T.sans, fontSize: 12, color: 'rgba(250,244,237,0.7)', lineHeight: 1.5, marginBottom: 14 }}>
              Luna can export your symptom log + these answers as a PDF you can email to your provider.
            </div>
            <button style={{ background: T.accent, color: '#fff', border: 'none', padding: '10px 14px', cursor: 'pointer', fontFamily: T.sans, fontSize: 11, letterSpacing: 2, fontWeight: 700, borderRadius: T.r }}>
              EXPORT DOCTOR-READY PDF →
            </button>
          </div>
        )}

        <Rule />
        <Eyebrow>LEARN MORE</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {['pmdd','endo','iron','pcos'].map((id) => {
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
        <SourceLine>This screener is informational. It does not replace a clinical evaluation.</SourceLine>
        <div style={{ height: 16 }} />
      </div>
    </Screen>
  )
}
