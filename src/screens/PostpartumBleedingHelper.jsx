import { useState } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, Rule, Screen, SourceLine } from '../components/shared'
import useLuna from '../store/useLuna'

// Postpartum bleeding helper — bespoke screen because the "is this
// normal" question has a real medical threshold and the answer depends
// on days postpartum + flow + color + clot size. The wrong reassurance
// can hide postpartum hemorrhage; the wrong alarm can panic someone
// healing well. Calibrated.

const STAGES = [
  {
    id: 'rubra',
    label: 'Lochia rubra',
    window: 'Days 1–4 postpartum',
    color: 'Bright red, deep red',
    feel: 'Heavier than a period for the first few days. Small clots (under the size of a grape) are normal.',
  },
  {
    id: 'serosa',
    label: 'Lochia serosa',
    window: 'Days 4–10',
    color: 'Pink, brown, mixed',
    feel: 'Lightening, more watery. Less, but still present.',
  },
  {
    id: 'alba',
    label: 'Lochia alba',
    window: 'Days 10 onward (up to 6 weeks)',
    color: 'Yellow, cream, white, clear',
    feel: 'Light spotting or discharge. Slowly tapers to nothing.',
  },
]

const FLOW_OPTIONS = [
  { id: 'normal',  label: 'Heavy but tapering', sub: 'Matches the stage' },
  { id: 'heavy',   label: 'Heavier than yesterday', sub: 'Sudden change' },
  { id: 'soaking', label: 'Soaking a pad an hour', sub: 'For 2+ hours' },
  { id: 'almost', label: 'Almost nothing', sub: 'Far less than expected' },
]

const DAYS_OPTIONS = [
  { id: '0-3', label: '0–3 days' },
  { id: '4-10', label: '4–10 days' },
  { id: '11-28', label: '11–28 days' },
  { id: '29-42', label: '29–42 days' },
  { id: '42plus', label: '6+ weeks' },
]

function Card({ children, accent = false }) {
  return (
    <div className="glass-card" style={{ padding: 16, borderLeft: `3px solid ${accent ? T.accent : T.muted}`, borderRadius: T.r, marginBottom: 12, background: accent ? T.accent + '10' : undefined }}>
      {children}
    </div>
  )
}

export default function PostpartumBleedingHelper() {
  const store = useLuna()
  const { back, go } = store
  const [days, setDays] = useState(null)
  const [flow, setFlow] = useState(null)
  const [clots, setClots] = useState(null)
  const [color, setColor] = useState(null)

  // Calibrate the read. The bigger-than-golf-ball clot or
  // soaking-pad-an-hour flow is the postpartum hemorrhage signal — that
  // gets the strongest escalation regardless of days postpartum.
  const urgent = flow === 'soaking' || clots === 'large' || color === 'foul'
  const concerning =
    !urgent && (
      (days === '11-28' && flow === 'heavy') ||
      (days === '29-42' && (flow === 'heavy' || flow === 'soaking')) ||
      (days === '42plus' && flow !== 'almost')
    )
  const expected =
    !urgent && !concerning && days && flow === 'normal' && color !== 'foul'

  return (
    <Screen padBottom={40}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="postpartum bleeding" onBack={back} />
        <div style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 500, letterSpacing: -0.7, lineHeight: 1.05 }}>
          About the bleeding.
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 15, fontStyle: 'italic', color: T.muted, lineHeight: 1.55, marginTop: 10 }}>
          Some of what's normal will surprise you. Some of what isn't will save your life. Luna will tell you which is which.
        </div>
        <Rule />

        <Eyebrow>Days since birth?</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 18 }}>
          {DAYS_OPTIONS.map((o) => {
            const on = days === o.id
            return (
              <button key={o.id} onClick={() => setDays(o.id)}
                style={{ border: `1px solid ${on ? T.accent : T.hair}`, background: on ? T.accent + '12' : T.card, color: on ? T.accent : T.text, padding: '10px 4px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans, fontSize: 11, fontWeight: 600 }}>
                {o.label}
              </button>
            )
          })}
        </div>

        <Eyebrow>How's the flow today?</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
          {FLOW_OPTIONS.map((o) => {
            const on = flow === o.id
            return (
              <button key={o.id} onClick={() => setFlow(o.id)}
                style={{ textAlign: 'left', border: `1px solid ${on ? T.accent : T.hair}`, background: on ? T.accent + '12' : T.card, color: on ? T.accent : T.text, padding: '12px 14px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{o.label}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{o.sub}</div>
              </button>
            )
          })}
        </div>

        <Eyebrow>Clots?</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 18 }}>
          {[
            { id: 'none', label: 'None' },
            { id: 'small', label: 'Small', sub: 'Under a grape' },
            { id: 'large', label: 'Large', sub: 'Golf ball or larger' },
          ].map((o) => {
            const on = clots === o.id
            return (
              <button key={o.id} onClick={() => setClots(o.id)}
                style={{ border: `1px solid ${on ? T.accent : T.hair}`, background: on ? T.accent + '12' : T.card, color: on ? T.accent : T.text, padding: '10px 6px 8px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{o.label}</span>
                {o.sub && <span style={{ fontSize: 9.5, color: T.muted, lineHeight: 1.3, textAlign: 'center', fontWeight: 500 }}>{o.sub}</span>}
              </button>
            )
          })}
        </div>

        <Eyebrow>Smell?</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 22 }}>
          {[
            { id: 'mild', label: 'Like a period' },
            { id: 'mineral', label: 'Mineral or metallic' },
            { id: 'foul', label: 'Foul or fishy' },
          ].map((o) => {
            const on = color === o.id
            return (
              <button key={o.id} onClick={() => setColor(o.id)}
                style={{ border: `1px solid ${on ? T.accent : T.hair}`, background: on ? T.accent + '12' : T.card, color: on ? T.accent : T.text, padding: '12px 6px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans, fontSize: 11.5, fontWeight: 600, lineHeight: 1.25 }}>
                {o.label}
              </button>
            )
          })}
        </div>

        {urgent && (
          <Card accent>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4, fontWeight: 700, color: T.accent, marginBottom: 8 }}>This is urgent — call now</div>
            <div style={{ fontFamily: T.serif, fontSize: 15.5, lineHeight: 1.6, color: T.text, marginBottom: 8 }}>
              Soaking a maxi pad every hour for two hours in a row, passing a clot larger than a golf ball, or a sudden foul-smelling discharge are signs of postpartum hemorrhage or infection. <strong style={{ fontWeight: 600 }}>Call your provider now, or go to the emergency room.</strong>
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 13.5, lineHeight: 1.55, color: T.muted, fontStyle: 'italic' }}>
              You don't need to be sure. If you're wondering whether to call — call.
            </div>
          </Card>
        )}

        {concerning && (
          <Card accent>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4, fontWeight: 700, color: T.accent, marginBottom: 8 }}>Talk to your provider soon</div>
            <div style={{ fontFamily: T.serif, fontSize: 15, lineHeight: 1.6, color: T.text }}>
              By this point postpartum, bleeding should be tapering. A sudden return of heavier flow can signal retained placental tissue, delayed uterine involution, or — if the bleeding is regular and rhythmic — a return of your period (especially if you're not exclusively breastfeeding). Worth a same-week appointment.
            </div>
          </Card>
        )}

        {expected && (
          <Card>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4, fontWeight: 700, color: T.muted, marginBottom: 8 }}>This looks like the normal arc</div>
            <div style={{ fontFamily: T.serif, fontSize: 15, lineHeight: 1.6, color: T.text }}>
              What you're describing fits the typical lochia pattern. Keep hydrating, sleep when you can, and watch for any sudden change — the body usually drops these signals on a curve, not a cliff.
            </div>
          </Card>
        )}

        <Rule />

        <Eyebrow>The normal stages — what to expect, when</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
          {STAGES.map((s) => (
            <Card key={s.id}>
              <div style={{ fontFamily: T.serif, fontSize: 16, fontWeight: 500, color: T.text, marginBottom: 4, letterSpacing: -0.2 }}>
                {s.label}
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 0.8, color: T.accent, fontWeight: 600, marginBottom: 8 }}>
                {s.window}
              </div>
              <div style={{ fontFamily: T.serif, fontSize: 13.5, color: T.muted, fontStyle: 'italic', lineHeight: 1.55, marginBottom: 4 }}>
                Colour: {s.color}
              </div>
              <div style={{ fontFamily: T.serif, fontSize: 14, color: T.text, lineHeight: 1.6 }}>
                {s.feel}
              </div>
            </Card>
          ))}
        </div>

        <Eyebrow>Always urgent — regardless of day</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 14.5, lineHeight: 1.7, color: T.text, marginBottom: 18 }}>
          <div>· Soaking a maxi pad an hour for 2+ hours.</div>
          <div>· Clots larger than a golf ball.</div>
          <div>· Foul-smelling discharge or fever 100.4°F+.</div>
          <div>· Severe pelvic, abdominal, or perineal pain.</div>
          <div>· Dizziness, weakness, racing heart, fainting.</div>
          <div>· Bleeding that had stopped, then restarted heavily.</div>
        </div>

        <button onClick={() => go('cheatsheet')}
          style={{ width: '100%', background: 'transparent', color: T.text, border: `1px solid ${T.text}`, padding: '12px 14px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans, fontSize: 12, fontWeight: 600, letterSpacing: 0.4, marginBottom: 14 }}>
          Open my talking points →
        </button>

        <SourceLine>Calibrated against ACOG postpartum guidance, WHO postpartum care recommendations, and AAFP postpartum hemorrhage thresholds.</SourceLine>
        <div style={{ height: 16 }} />
      </div>
    </Screen>
  )
}
