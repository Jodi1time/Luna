import { useState } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, Rule, Screen, SourceLine } from '../components/shared'
import useLuna from '../store/useLuna'

// Missed pill rescue — decision tree based on hours-late + sex
// exposure. Designed for the panic moment, not for a clinical chart.
// Currently covers the combined pill (most common). Mini-pill /
// progestin-only has a much tighter 3-hour window; flagged in the
// "if your pill is the mini-pill" section.

const TIME_OPTIONS = [
  { id: 'under24', label: 'Less than 24h late', sub: 'Yesterday\'s, basically' },
  { id: 'under48', label: '24–48h late', sub: 'A full day missed' },
  { id: 'over48', label: 'More than 48h', sub: 'Multiple days' },
]

const SEX_OPTIONS = [
  { id: 'no', label: 'No unprotected sex' },
  { id: 'recent', label: 'Yes, in the last 5 days' },
  { id: 'unsure', label: 'Unsure / longer ago' },
]

function Card({ children, accent = false }) {
  return (
    <div className="glass-card" style={{ padding: 16, borderRadius: T.r, marginBottom: 14, background: accent ? T.accent + '10' : undefined }}>
      {children}
    </div>
  )
}

export default function MissedPillHelper() {
  const store = useLuna()
  const { back, birthControl } = store

  const [time, setTime] = useState(null)
  const [sex, setSex] = useState(null)

  const isMiniPill = birthControl?.method === 'mini-pill'

  let advice = null
  if (time && sex) {
    if (isMiniPill) {
      // Mini-pill has a 3-hour window; even "less than 24h late" is
      // already past it.
      advice = (
        <>
          <Card accent>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.2, fontWeight: 700, color: T.accent, marginBottom: 8 }}>About the mini-pill</div>
            <div style={{ fontFamily: T.serif, fontSize: 15.5, lineHeight: 1.6 }}>
              Progestin-only pills only stay reliable within about a 3-hour window. Take the missed pill as soon as possible and use backup contraception (condoms) for the next 48 hours, regardless of time elapsed.
              {sex !== 'no' && <> If unprotected sex happened in the past 5 days, emergency contraception is on the table — Plan B is most effective within 72 hours but works up to 5 days, and the copper IUD inserted within 5 days is the most effective EC option.</>}
            </div>
          </Card>
        </>
      )
    } else if (time === 'under24') {
      advice = (
        <>
          <Card accent>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.2, fontWeight: 700, color: T.accent, marginBottom: 8 }}>What to do</div>
            <div style={{ fontFamily: T.serif, fontSize: 15.5, lineHeight: 1.6 }}>
              Take the missed pill now, even if it means two pills today. No backup contraception needed; you're still protected.
            </div>
          </Card>
          {sex !== 'no' && (
            <Card muted>
              <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.2, fontWeight: 700, color: T.muted, marginBottom: 6 }}>On the sex question</div>
              <div style={{ fontFamily: T.serif, fontSize: 14.5, lineHeight: 1.55 }}>
                Under 24 hours late on a combined pill means you weren't unprotected — emergency contraception isn't needed.
              </div>
            </Card>
          )}
        </>
      )
    } else if (time === 'under48') {
      advice = (
        <>
          <Card accent>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.2, fontWeight: 700, color: T.accent, marginBottom: 8 }}>What to do</div>
            <div style={{ fontFamily: T.serif, fontSize: 15.5, lineHeight: 1.6 }}>
              Take the most recent missed pill now. Skip any earlier missed pill (don't double-double-up). Continue the pack as normal. Use backup contraception (condoms) for the next 7 days.
            </div>
          </Card>
          {sex === 'recent' && (
            <Card accent>
              <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.2, fontWeight: 700, color: T.accent, marginBottom: 8 }}>Emergency contraception is on the table</div>
              <div style={{ fontFamily: T.serif, fontSize: 14.5, lineHeight: 1.6 }}>
                Plan B (levonorgestrel) is over-the-counter, no prescription, most effective within 72 hours but works up to 120 hours. Ella (ulipristal) is more effective up to 5 days but needs a prescription. The copper IUD inserted within 5 days is the most effective EC of all and gives you ongoing contraception.
              </div>
            </Card>
          )}
        </>
      )
    } else if (time === 'over48') {
      advice = (
        <>
          <Card accent>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.2, fontWeight: 700, color: T.accent, marginBottom: 8 }}>What to do</div>
            <div style={{ fontFamily: T.serif, fontSize: 15.5, lineHeight: 1.6 }}>
              Take the most recent missed pill now. Skip earlier missed pills. Continue the pack as normal. Use backup contraception (condoms) for the next 7 days. If those 7 days run into the placebo (sugar) week, skip the placebo and start a new pack straight away.
            </div>
          </Card>
          {sex !== 'no' && (
            <Card accent>
              <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.2, fontWeight: 700, color: T.accent, marginBottom: 8 }}>Emergency contraception is on the table</div>
              <div style={{ fontFamily: T.serif, fontSize: 14.5, lineHeight: 1.6 }}>
                Plan B is over-the-counter (most effective within 72h, works up to 120h). Ella is more effective up to 5 days but needs a prescription. The copper IUD within 5 days is the most effective option and is ongoing contraception once placed.
                {sex === 'unsure' && <> If sex was longer ago than 5 days, EC won't reach it; the next step is a pregnancy test about 14 days after that exposure.</>}
              </div>
            </Card>
          )}
        </>
      )
    }
  }

  return (
    <Screen padBottom={40}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="missed pill" onBack={back} />
        <div style={{ fontFamily: T.serif, fontSize: 32, fontWeight: 500, letterSpacing: -0.7, lineHeight: 1.05, marginBottom: 8 }}>
          Missed a pill?
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 16, fontStyle: 'italic', color: T.muted, lineHeight: 1.5, marginBottom: 4 }}>
          A few questions and Luna will tell you what to do — without the spiral.
        </div>
        <Rule />

        <Eyebrow>How late is the pill?</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
          {TIME_OPTIONS.map((o) => {
            const on = time === o.id
            return (
              <button key={o.id} onClick={() => setTime(o.id)}
                style={{ textAlign: 'left', border: `1px solid ${on ? T.accent : T.hair}`, background: on ? T.accent + '12' : T.card, color: on ? T.accent : T.text, padding: '12px 14px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{o.label}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{o.sub}</div>
              </button>
            )
          })}
        </div>

        <Eyebrow>Unprotected sex recently?</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 22 }}>
          {SEX_OPTIONS.map((o) => {
            const on = sex === o.id
            return (
              <button key={o.id} onClick={() => setSex(o.id)}
                style={{ textAlign: 'left', border: `1px solid ${on ? T.accent : T.hair}`, background: on ? T.accent + '12' : T.card, color: on ? T.accent : T.text, padding: '12px 14px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans, fontSize: 13.5, fontWeight: 600 }}>
                {o.label}
              </button>
            )
          })}
        </div>

        {advice && (
          <div style={{ marginBottom: 8 }}>
            <Eyebrow>Here's what to do</Eyebrow>
            {advice}
          </div>
        )}

        {time && sex && (
          <Card>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.2, fontWeight: 700, color: T.muted, marginBottom: 6 }}>Generally true</div>
            <div style={{ fontFamily: T.serif, fontSize: 14, lineHeight: 1.6, color: T.text }}>
              Missing 1 pill is rarely serious on the combined pill. Missing 2+ in a row, or anytime around the placebo week, is what reduces protection. Set a daily reminder if this happens more than once a year — there's also the patch, ring, IUD, implant, and shot if remembering a daily pill is fighting you.
            </div>
          </Card>
        )}

        <SourceLine>Guidance based on NHS Sexual Health, ACOG, and the FSRH (UK).</SourceLine>
        <div style={{ height: 16 }} />
      </div>
    </Screen>
  )
}
