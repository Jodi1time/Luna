import { T } from '../data/theme'
import { Masthead, Eyebrow, Screen, Icons } from '../components/shared'
import { CHECKUPS } from '../data/lunaData'
import useLuna from '../store/useLuna'

const CATEGORIES = [...new Set(CHECKUPS.map((c) => c.category))]

export default function Care() {
  const { back, completedChecks, toggleCheck } = useLuna()

  const findProvider = () => {
    window.open('https://maps.google.com/?q=OB+GYN+near+me', '_blank')
  }

  return (
    <Screen padBottom={30}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="Care" onBack={back} />
        <Eyebrow>PREVENTION · YOUR CHECKLIST</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 8 }}>
          Your health,<br /><em>maintained.</em>
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 15, color: T.muted, lineHeight: 1.55, marginBottom: 24 }}>
          Checkups that matter. Tap to mark done.
        </div>

        <button onClick={findProvider}
          style={{ width: '100%', padding: 18, background: T.text, color: '#FAF4ED', border: 'none', borderRadius: T.r, cursor: 'pointer', textAlign: 'left', marginBottom: 28, fontFamily: 'inherit' }}>
          <div style={{ fontSize: 10, letterSpacing: 2, fontWeight: 700, fontFamily: T.sans, color: T.accent, marginBottom: 6 }}>FIND CARE NEAR YOU</div>
          <div style={{ fontFamily: T.serif, fontSize: 19, fontWeight: 500, marginBottom: 4 }}>Find an OB/GYN near you →</div>
          <div style={{ fontFamily: T.sans, fontSize: 12, color: 'rgba(250,244,237,0.7)', lineHeight: 1.4 }}>Opens Google Maps with providers near your current location.</div>
        </button>

        {CATEGORIES.map((cat) => {
          const items = CHECKUPS.filter((c) => c.category === cat)
          const doneCount = items.filter((c) => completedChecks?.includes(c.id)).length
          return (
            <div key={cat} style={{ marginBottom: 26 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Eyebrow>{cat.toUpperCase()}</Eyebrow>
                {doneCount > 0 && (
                  <span style={{ fontSize: 10, fontFamily: T.mono, color: T.accent }}>{doneCount}/{items.length}</span>
                )}
              </div>
              <div style={{ border: `1px solid ${T.hair}`, borderRadius: T.r, overflow: 'hidden' }}>
                {items.map((item, idx) => {
                  const done = completedChecks?.includes(item.id)
                  return (
                    <button key={item.id} onClick={() => toggleCheck(item.id)}
                      style={{
                        width: '100%', padding: '14px 16px',
                        background: done ? T.accent + '0A' : T.card,
                        border: 'none',
                        borderBottom: idx < items.length - 1 ? `1px solid ${T.hair}` : 'none',
                        cursor: 'pointer', textAlign: 'left', display: 'flex', gap: 12,
                        alignItems: 'flex-start', fontFamily: 'inherit', color: T.text,
                      }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 2,
                        border: `1.5px solid ${done ? T.accent : T.muted}`,
                        background: done ? T.accent : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                        transition: 'background .25s, border-color .25s',
                      }}>
                        {done && <span style={{ display: 'flex', animation: 'checkPop 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}>{Icons.check}</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontFamily: T.serif, fontSize: 15, fontWeight: 500, marginBottom: 2,
                          textDecoration: done ? 'line-through' : 'none',
                          color: done ? T.muted : T.text,
                        }}>{item.label}</div>
                        <div style={{ fontFamily: T.sans, fontSize: 11, color: T.accent, fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>{item.frequency}</div>
                        <div style={{ fontFamily: T.sans, fontSize: 12, color: T.muted, lineHeight: 1.45 }}>{item.why}</div>
                        <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.muted, marginTop: 5, letterSpacing: 0.5 }}>SOURCE — {item.source}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}

        <div style={{ fontSize: 11, color: T.muted, fontFamily: T.sans, lineHeight: 1.5, paddingBottom: 8 }}>
          Completion is saved on your device only. This is a reminder tool, not a medical record.
        </div>
      </div>
    </Screen>
  )
}
