import { T } from '../data/theme'
import { Masthead, Eyebrow, Screen, Icons } from '../components/shared'
import { CHECKUPS } from '../data/lunaData'
import { PhaseFlourish } from '../components/phaseFlourishes'
import { useCycle } from '../hooks/useCycle'
import useLuna from '../store/useLuna'

const CATEGORIES = [...new Set(CHECKUPS.map((c) => c.category))]

export default function Care() {
  const store = useLuna()
  const { back, completedChecks, toggleCheck } = store
  const cycle = useCycle(store)
  const phase = cycle?.phase
  const acc = phase?.color || T.accent

  const findProvider = () => {
    window.open('https://maps.google.com/?q=OB+GYN+near+me', '_blank')
  }

  return (
    <Screen padBottom={30}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="care" onBack={back} />
        <div className="insight-stagger" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8, animationDelay: '0ms' }}>
          <div style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, flex: 1, minWidth: 0 }}>
            Take care of the<br /><em>parts that ask for it.</em>
          </div>
          {phase && (
            <div aria-hidden="true" style={{ color: acc, opacity: 0.55, paddingTop: 4 }}>
              <PhaseFlourish phaseId={phase.id} size={24} />
            </div>
          )}
        </div>
        <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 15, color: T.muted, lineHeight: 1.6, marginBottom: 24, fontStyle: 'italic', animationDelay: '60ms' }}>
          The checkups that quietly matter — tap to mark done.
        </div>

        <button onClick={findProvider}
          className="insight-stagger"
          style={{ width: '100%', padding: 18, background: T.text, color: '#FAF4ED', border: 'none', borderRadius: T.r, cursor: 'pointer', textAlign: 'left', marginBottom: 28, fontFamily: 'inherit', animationDelay: '120ms' }}>
          <div style={{ fontSize: 10, letterSpacing: 1.2, fontWeight: 600, fontFamily: T.sans, color: acc, marginBottom: 6 }}>Find someone nearby</div>
          <div style={{ fontFamily: T.serif, fontSize: 19, fontWeight: 500, marginBottom: 4 }}>An OB/GYN near you →</div>
          <div style={{ fontFamily: T.sans, fontSize: 12, color: 'rgba(250,244,237,0.7)', lineHeight: 1.5 }}>Opens a map with providers near your current location.</div>
        </button>

        {CATEGORIES.map((cat, cIdx) => {
          const items = CHECKUPS.filter((c) => c.category === cat)
          const doneCount = items.filter((c) => completedChecks?.includes(c.id)).length
          return (
            <div key={cat} className="insight-stagger" style={{ marginBottom: 26, animationDelay: `${180 + cIdx * 70}ms` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Eyebrow color={acc}>{cat}</Eyebrow>
                {doneCount > 0 && (
                  <span style={{ fontSize: 10, fontFamily: T.mono, color: acc, fontWeight: 600 }}>{doneCount}/{items.length} done</span>
                )}
              </div>
              <div className="glass-card" style={{ borderRadius: T.r, overflow: 'hidden' }}>
                {items.map((item, idx) => {
                  const done = completedChecks?.includes(item.id)
                  return (
                    <button key={item.id} onClick={() => toggleCheck(item.id)}
                      style={{
                        width: '100%', padding: '14px 16px',
                        background: done ? acc + '0A' : 'transparent',
                        border: 'none',
                        borderBottom: idx < items.length - 1 ? `1px solid ${T.hair}` : 'none',
                        cursor: 'pointer', textAlign: 'left', display: 'flex', gap: 12,
                        alignItems: 'flex-start', fontFamily: 'inherit', color: T.text,
                      }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 2,
                        border: `1.5px solid ${done ? acc : T.muted}`,
                        background: done ? acc : 'transparent',
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
                        <div style={{ fontFamily: T.sans, fontSize: 11, color: acc, fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>{item.frequency}</div>
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
