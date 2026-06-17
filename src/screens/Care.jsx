import { T } from '../data/theme'
import { Masthead, Eyebrow, Screen, Icons } from '../components/shared'
import { CHECKUPS } from '../data/lunaData'
import { PhaseFlourish } from '../components/phaseFlourishes'
import { useCycle } from '../hooks/useCycle'
import useLuna from '../store/useLuna'
import { sectionColors, sectionPaper } from '../data/sectionPalette'

const CATEGORIES = [...new Set(CHECKUPS.map((c) => c.category))]

export default function Care() {
  const store = useLuna()
  const { back, completedChecks, toggleCheck, session } = store
  const cycle = useCycle(store)
  const phase = cycle?.phase
  const acc = phase?.color || T.accent
  const totalChecks = CHECKUPS.length
  const doneTotal = CHECKUPS.filter((item) => completedChecks?.includes(item.id)).length
  const nextOpen = CHECKUPS.find((item) => !completedChecks?.includes(item.id)) || null
  const storageLine = session?.user
    ? 'These check marks sync with your Luna account and stay cached on this device for speed.'
    : 'Without an account, these check marks stay only on this device.'

  const findProvider = () => {
    window.open('https://maps.google.com/?q=OB+GYN+near+me', '_blank')
  }

  return (
    <Screen padBottom={30}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="care" onBack={back} />
        <div className="insight-stagger" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8, animationDelay: '0ms' }}>
          <div style={{ fontFamily: T.serif, fontSize: 32, fontWeight: 500, letterSpacing: -0.7, lineHeight: 1.08, flex: 1, minWidth: 0, textWrap: 'balance' }}>
            Care that is easy to put off.
          </div>
          {phase && (
            <div aria-hidden="true" style={{ color: acc, opacity: 0.55, paddingTop: 4 }}>
              <PhaseFlourish phaseId={phase.id} size={24} />
            </div>
          )}
        </div>
        <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 15, color: T.muted, lineHeight: 1.6, marginBottom: 24, fontStyle: 'italic', animationDelay: '60ms' }}>
          The checkups that quietly matter. Mark what is done, leave the rest for when you're ready.
        </div>

        <div className="insight-stagger" style={{ marginBottom: 28, animationDelay: '120ms' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 14, marginBottom: 10 }}>
            <div style={{ fontFamily: T.serif, fontSize: 13.5, fontStyle: 'italic', color: acc }}>
              Your care plan
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 11.5, color: T.muted, letterSpacing: 0.5, fontVariantNumeric: 'tabular-nums' }}>
              {doneTotal} / {totalChecks}
            </div>
          </div>
          <div style={{ height: 4, background: T.hair, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{
              width: `${totalChecks ? (doneTotal / totalChecks) * 100 : 0}%`,
              height: '100%',
              background: acc,
              transition: 'width 0.3s var(--ease-out)',
            }} />
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 14, lineHeight: 1.58, color: T.muted, fontStyle: 'italic', marginBottom: 14 }}>
            {nextOpen
              ? `A practical next step: ${nextOpen.label.toLowerCase()}.`
              : 'Everything here is marked done right now.'}
          </div>
          <button onClick={findProvider}
            className="alive-card"
            style={{
              width: '100%',
              padding: '13px 0',
              background: 'transparent',
              color: T.text,
              border: 'none',
              borderTop: `1px solid ${sectionColors('care').accent}22`,
              borderBottom: `1px solid ${sectionColors('care').accent}22`,
              borderRadius: 0,
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}>
            <span>
              <span style={{ display: 'block', fontFamily: T.serif, fontSize: 15.5, fontWeight: 500, lineHeight: 1.3, letterSpacing: -0.15 }}>
                Find an OB/GYN near you
              </span>
              <span style={{ display: 'block', fontFamily: T.serif, fontSize: 12.5, color: T.muted, lineHeight: 1.5, fontStyle: 'italic', marginTop: 2 }}>
                Opens nearby providers in Maps.
              </span>
            </span>
            <span aria-hidden="true" style={{ color: acc, fontFamily: T.sans, fontSize: 16, flexShrink: 0 }}>→</span>
          </button>
        </div>

        {CATEGORIES.map((cat, cIdx) => {
          const items = CHECKUPS.filter((c) => c.category === cat)
          const doneCount = items.filter((c) => completedChecks?.includes(c.id)).length
          return (
            <div key={cat} className="insight-stagger" style={{ marginBottom: 26, animationDelay: `${180 + cIdx * 70}ms` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Eyebrow color={acc}>{cat}</Eyebrow>
                {doneCount > 0 && (
                  <span style={{ fontSize: 12.5, fontFamily: T.serif, fontStyle: 'italic', color: acc }}>{doneCount} of {items.length}</span>
                )}
              </div>
              <div style={{ background: sectionPaper('care'), border: `1px solid ${sectionColors('care').accent}22`, boxShadow: `0 1px 0 ${sectionColors('care').accent}10, 0 10px 22px -18px ${sectionColors('care').accent}30`, borderRadius: T.r, overflow: 'hidden' }}>
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
                        <div style={{ fontFamily: T.serif, fontSize: 12.5, color: acc, fontStyle: 'italic', marginBottom: 4 }}>{item.frequency}</div>
                        <div style={{ fontFamily: T.serif, fontSize: 13, color: T.muted, lineHeight: 1.55, fontStyle: 'italic' }}>{item.why}</div>
                        <div style={{ fontFamily: T.serif, fontSize: 11.5, color: T.muted, marginTop: 6, fontStyle: 'italic', opacity: 0.82 }}>
                          Source: {item.source}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}

        <div style={{ fontSize: 11.5, color: T.muted, fontFamily: T.serif, fontStyle: 'italic', lineHeight: 1.55, paddingBottom: 8 }}>
          {storageLine} Care is a planning checklist, not a medical record.
        </div>
      </div>
    </Screen>
  )
}
