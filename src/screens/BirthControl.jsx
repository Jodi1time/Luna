import { T } from '../data/theme'
import { Masthead, Eyebrow, Screen, Icons } from '../components/shared'
import useLuna from '../store/useLuna'

export const BC_METHODS = [
  { id: 'none',          name: 'Not on birth control',       blurb: 'Tracking your natural cycle.' },
  { id: 'combined-pill', name: 'Combined pill',              blurb: '21 active + 7 placebo. The bleed during placebo days is a withdrawal bleed, not a true period.' },
  { id: 'mini-pill',     name: 'Mini-pill (progestin-only)', blurb: 'Taken daily at the same time. Bleeding patterns can be unpredictable.' },
  { id: 'hormonal-iud',  name: 'Hormonal IUD',               blurb: 'Mirena, Kyleena, Liletta, Skyla. Many users have lighter or absent periods over time.' },
  { id: 'copper-iud',    name: 'Copper IUD',                 blurb: 'Non-hormonal. Your natural cycle continues; periods may be heavier or longer.' },
  { id: 'implant',       name: 'Implant',                    blurb: 'Nexplanon. Bleeding patterns vary widely — some have none, some have spotting.' },
  { id: 'shot',          name: 'Injection',                  blurb: 'Depo-Provera, every 12–13 weeks. Bleeding usually becomes lighter or absent.' },
  { id: 'patch',         name: 'Patch',                      blurb: 'Worn weekly. Hormone pattern similar to the combined pill.' },
  { id: 'ring',          name: 'Vaginal ring',               blurb: 'NuvaRing, Annovera. Hormone pattern similar to the combined pill.' },
]

export const BC_LABELS = BC_METHODS.reduce((acc, m) => {
  acc[m.id] = m.id === 'none' ? 'None' : m.name
  return acc
}, {})

export default function BirthControl() {
  const { back, birthControl, setBirthControl } = useLuna()
  const selectedId = birthControl?.method || 'none'

  return (
    <Screen padBottom={30}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="Birth Control" onBack={back} />
        <Eyebrow>BIRTH CONTROL · YOUR METHOD</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 8 }}>
          What are you <em>using?</em>
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 15, color: T.muted, lineHeight: 1.55, marginBottom: 24 }}>
          Telling Luna about your method changes how we show predictions and educational content. We won't track fertility windows that don't apply to your contraception.
        </div>
      </div>

      <div style={{ margin: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {BC_METHODS.map((m) => {
          const selected = m.id === selectedId
          return (
            <button
              key={m.id}
              onClick={() => setBirthControl({ method: m.id })}
              style={{
                width: '100%',
                padding: '14px 16px',
                textAlign: 'left',
                background: selected ? T.accent + '0A' : T.card,
                border: `1px solid ${selected ? T.accent : T.hair}`,
                borderRadius: T.r,
                cursor: 'pointer',
                fontFamily: 'inherit',
                color: T.text,
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                transition: 'background .2s, border-color .2s',
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                border: `1.5px solid ${selected ? T.accent : T.muted}`,
                background: selected ? T.accent : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                transition: 'background .25s, border-color .25s',
              }}>
                {selected && <span style={{ display: 'flex', animation: 'checkPop 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}>{Icons.check}</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: T.serif, fontSize: 16, fontWeight: 500, marginBottom: 4, color: selected ? T.accent : T.text }}>
                  {m.name}
                </div>
                <div style={{ fontFamily: T.sans, fontSize: 12, color: T.muted, lineHeight: 1.45 }}>
                  {m.blurb}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div style={{ padding: '20px 22px 8px', fontSize: 11, color: T.muted, fontFamily: T.sans, lineHeight: 1.5 }}>
        You can change this any time. Cycle data already logged isn't affected.
      </div>
    </Screen>
  )
}
