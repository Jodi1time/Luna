import { useState, useEffect } from 'react'
import { T } from '../data/theme'
import { CTAButton, SourceLine, Icons } from '../components/shared'
import Backdrop from '../components/Backdrop'
import useLuna from '../store/useLuna'
import { getSession } from '../lib/supabase'
import { StatusView } from '../components/StatusView'
import { validateName, validateAccountPassword, validateEmail } from '../lib/validation'

// Editorial progress bar — three numbered chips with the current step
// lit in accent. Reads as "you are here" rather than "fill these in."
function ProgressBar({ step, total = 3 }) {
  const labels = ['Your last period', 'Your cycle', 'Your name']
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 30 }}>
      {Array.from({ length: total }).map((_, i) => {
        const n = i + 1
        const active = n === step
        const done = n < step
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: T.serif, fontStyle: 'italic', fontSize: 12, fontWeight: 500,
              background: active ? T.accent : (done ? T.accent + '22' : 'transparent'),
              color: active ? '#fff' : (done ? T.accent : T.muted),
              border: active ? 'none' : `1px solid ${done ? T.accent + '55' : T.hair}`,
              transition: 'all 0.3s var(--ease-out)',
            }}>
              {n}
            </div>
            <div style={{
              fontFamily: T.mono, fontSize: 8.5, letterSpacing: 0.9, fontWeight: 600,
              color: active ? T.accent : T.muted,
              opacity: active ? 1 : 0.55,
              transition: 'all 0.3s var(--ease-out)',
              textTransform: 'uppercase',
            }}>
              {labels[i]}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Calendar widget — supports navigating back up to 12 months so the
// user can mark a period that started in a previous month. Forward
// navigation is allowed up to the current month only (no future).
// Selection is stored as an ISO date string (YYYY-MM-DD).
function StepDate({ value, onChange }) {
  const days = ['M','T','W','T','F','S','S']
  const now = new Date()
  const todayISO = now.toISOString().slice(0, 10)
  const initialDate = value ? new Date(value + 'T12:00:00') : now
  const [viewing, setViewing] = useState({
    year:  initialDate.getFullYear(),
    month: initialDate.getMonth(),
  })

  const monthLabel = new Date(viewing.year, viewing.month, 1)
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const daysInMonth = new Date(viewing.year, viewing.month + 1, 0).getDate()
  const firstDay   = new Date(viewing.year, viewing.month, 1).getDay()
  const offset     = firstDay === 0 ? 6 : firstDay - 1
  const dates      = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // Back 12 months max; forward only up to current month.
  const earliestAllowed = new Date(now.getFullYear(), now.getMonth() - 12, 1)
  const currentMonthFirst = new Date(now.getFullYear(), now.getMonth(), 1)
  const viewingFirst = new Date(viewing.year, viewing.month, 1)
  const canGoBack = viewingFirst > earliestAllowed
  const canGoForward = viewingFirst < currentMonthFirst

  const stepMonth = (delta) => {
    setViewing(({ year, month }) => {
      const d = new Date(year, month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  return (
    <div style={{ background: T.card, padding: 16, border: `1px solid ${T.hair}`, borderRadius: T.r }}>
      {/* Month navigation header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <button onClick={() => stepMonth(-1)} disabled={!canGoBack}
          aria-label="Previous month"
          style={{
            background: 'transparent', border: `1px solid ${T.hair}`,
            color: canGoBack ? T.text : T.hair,
            width: 30, height: 30, borderRadius: T.r,
            cursor: canGoBack ? 'pointer' : 'default',
            fontFamily: T.sans, fontSize: 16, padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>‹</button>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontWeight: 500, fontSize: 17, letterSpacing: -0.2, color: T.text }}>
          {monthLabel}
        </div>
        <button onClick={() => stepMonth(1)} disabled={!canGoForward}
          aria-label="Next month"
          style={{
            background: 'transparent', border: `1px solid ${T.hair}`,
            color: canGoForward ? T.text : T.hair,
            width: 30, height: 30, borderRadius: T.r,
            cursor: canGoForward ? 'pointer' : 'default',
            fontFamily: T.sans, fontSize: 16, padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>›</button>
      </div>
      {/* Day-of-week headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
        {days.map((d, i) => <div key={i} style={{ textAlign: 'center', fontSize: 9, color: T.muted, fontFamily: T.mono, fontWeight: 600, letterSpacing: 1 }}>{d}</div>)}
      </div>
      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
        {dates.map((d) => {
          const cellISO = `${viewing.year}-${String(viewing.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
          const isFuture = cellISO > todayISO
          const isSelected = value === cellISO
          const isToday = cellISO === todayISO
          return (
            <button key={d} onClick={() => !isFuture && onChange(cellISO)}
              disabled={isFuture}
              style={{
                aspectRatio: '1',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontFamily: T.serif,
                cursor: isFuture ? 'default' : 'pointer',
                border: isToday && !isSelected ? `1px dashed ${T.accent}66` : 'none',
                background: isSelected ? T.accent : 'transparent',
                color: isSelected ? '#fff' : isFuture ? T.hair : T.text,
                opacity: isFuture ? 0.4 : 1,
                borderRadius: T.r,
                fontWeight: isSelected ? 600 : 400,
                padding: 0,
                transition: 'background 0.2s var(--ease-out), color 0.2s var(--ease-out)',
              }}>
              {d}
            </button>
          )
        })}
      </div>
      {/* Selected-date readback — confirms the user's choice in a
          conversational line so they don't have to recompute the
          month they're looking at. */}
      {value && (
        <div style={{
          marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.hair}`,
          fontFamily: T.serif, fontSize: 13.5, fontStyle: 'italic',
          color: T.muted, textAlign: 'center', letterSpacing: -0.1,
        }}>
          {new Date(value + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.
        </div>
      )}
    </div>
  )
}

function StepCycle({ value, onChange }) {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <span key={value} style={{ fontFamily: T.serif, fontSize: 110, fontStyle: 'italic', fontWeight: 400, color: T.accent, lineHeight: 1, letterSpacing: -3, display: 'inline-block', animation: 'numberPop 0.35s ease-out both' }}>{value}</span>
        <span style={{ fontFamily: T.serif, fontSize: 15, fontStyle: 'italic', color: T.muted, marginLeft: 10 }}>days</span>
      </div>
      <input type="range" min={21} max={45} value={value} onChange={(e) => onChange(+e.target.value)}
        style={{ width: '100%', accentColor: T.accent }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.muted, marginTop: 8, fontFamily: T.mono, letterSpacing: 0.8, fontWeight: 600 }}>
        <span>21</span>
        <span style={{ fontStyle: 'italic', fontFamily: T.serif, fontSize: 11 }}>typical · 28</span>
        <span>45</span>
      </div>
    </div>
  )
}

function Field({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 10, letterSpacing: 1.5, fontWeight: 700, fontFamily: T.sans, color: T.muted, textTransform: 'uppercase' }}>{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoCapitalize="off"
        autoCorrect="off"
        style={{ background: T.card, border: `1px solid ${T.hair}`, borderRadius: T.r, padding: '13px 14px', fontSize: 15, fontFamily: T.sans, color: T.text, outline: 'none', width: '100%' }}
        onFocus={(e) => { e.target.style.borderColor = T.accent }}
        onBlur={(e)  => { e.target.style.borderColor = T.hair }}
      />
    </div>
  )
}

function StepAccount({ name, email, accountPassword, onChange, signedInEmail }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Field label="Your name" value={name} onChange={(v) => onChange('name', v)} placeholder="Mira" />

      {signedInEmail ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 14, borderTop: `1px solid ${T.hair}` }}>
          <div style={{ fontSize: 10, letterSpacing: 1.5, fontWeight: 700, fontFamily: T.sans, color: T.muted, textTransform: 'uppercase' }}>Signed in as</div>
          <div style={{ fontFamily: T.sans, fontSize: 14, color: T.text }}>{signedInEmail}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 14, borderTop: `1px solid ${T.hair}` }}>
          <div style={{ fontSize: 10, letterSpacing: 1.5, fontWeight: 700, fontFamily: T.sans, color: T.muted, textTransform: 'uppercase' }}>Your account</div>
          <Field label="Email" type="email" value={email} onChange={(v) => onChange('email', v)} placeholder="you@example.com" />
          <Field label="Password" type="password" value={accountPassword} onChange={(v) => onChange('accountPassword', v)} placeholder="Min. 8 characters" />
        </div>
      )}

      <div style={{ fontSize: 12, color: T.muted, fontFamily: T.sans, lineHeight: 1.55, padding: '12px 14px', background: T.subtle, borderRadius: T.r }}>
        Sign in on any device to come back to your cycle. Your data is encrypted at rest — only you can read it.
      </div>
    </div>
  )
}

export default function Onboarding({ step }) {
  const { go, setOnboarding, cycleLength } = useLuna()
  // Period start is stored as an ISO date string so the picker can
  // navigate back across months. Defaults to today; the user can
  // step back up to 12 months via the calendar header.
  const [lastPeriodISO, setLastPeriodISO] = useState(() => new Date().toISOString().slice(0, 10))
  const [cycleDays, setCycleDays]= useState(cycleLength || 28)
  const [account, setAccount] = useState({
    name: '', email: '', accountPassword: '',
  })
  const [signupError, setSignupError] = useState('')
  const [finishing, setFinishing] = useState(false)
  const [fatalError, setFatalError] = useState('')
  // If the user reached onboarding from the sign-in flow, a Supabase
  // session already exists. We use that email and hide the email +
  // password fields — they just need to confirm a name.
  const [signedInEmail, setSignedInEmail] = useState('')

  useEffect(() => {
    if (step !== 3) return
    let cancelled = false
    getSession()
      .then((s) => { if (!cancelled && s?.user?.email) setSignedInEmail(s.user.email) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [step])

  const setAccountField = (key, val) => setAccount((a) => ({ ...a, [key]: val }))

  const now = new Date()

  const finish = async () => {
    if (finishing) return
    setSignupError('')
    setFatalError('')
    setFinishing(true)
    try {
      // lastPeriodISO is already the user's exact pick (YYYY-MM-DD),
      // possibly in a previous month.
      const d = new Date(lastPeriodISO + 'T12:00:00')

      let acct = null
      if (signedInEmail) {
        // Returning sign-in — session already established.
        acct = { email: signedInEmail }
      } else {
        const email = account.email.trim()
        const password = account.accountPassword
        if (!email || !password) {
          setSignupError('Add your email and password to create your account.')
          setFinishing(false)
          return
        }
        const { signUp, signIn } = await import('../lib/supabase')
        try {
          const data = await signUp(email, password)
          acct = { email }
          if (data && !data.session) {
            setSignupError("Check your email — we sent you a link to confirm your account. Your Luna is set up either way.")
          }
        } catch (e) {
          // Signup failed — most commonly because the email is already
          // registered. Fall back to signin so the same form handles
          // both new and returning users.
          try {
            await signIn(email, password)
            acct = { email }
          } catch (signInErr) {
            setSignupError(e?.message || signInErr?.message || 'Could not create account — please try again.')
            setFinishing(false)
            return
          }
        }
      }

      // Save profile to cloud and flip onboarded=true. The store's
      // setOnboarding action handles the cloud write.
      setOnboarding({
        lastPeriodStart: d.toISOString().slice(0, 10),
        cycleLength: cycleDays,
        displayName: account.name.trim(),
        account: acct,
      })

      try {
        const { capture } = await import('../lib/posthog')
        capture('onboarding_completed', { account_created: Boolean(acct) })
      } catch {}

      go('home')
    } catch (e) {
      setFatalError(e?.message || "Couldn't finish setup. Please try again.")
      setFinishing(false)
    }
  }

  const validationMessage = () => {
    if (step !== 3) return null
    const nameErr = validateName(account.name)
    if (nameErr) return nameErr
    if (signedInEmail) return null
    const emailErr = validateEmail(account.email)
    if (emailErr) return emailErr
    const apErr = validateAccountPassword(account.accountPassword)
    if (apErr) return apErr
    return null
  }

  const blockReason = validationMessage()
  const canAdvance = blockReason === null

  const next = step < 3 ? () => go(`onb${step + 1}`) : finish

  if (finishing || fatalError) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: T.bg, color: T.text }}>
        <StatusView
          loading={finishing && !fatalError}
          loadingMessage="GETTING THINGS READY"
          error={fatalError}
          onRetry={() => { setFatalError(''); finish() }}
        />
      </div>
    )
  }

  return (
    <div className="home-stage">
      <Backdrop accent={T.accent} subtle />
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', padding: '60px 28px 36px', color: T.text, animation: 'fadeUp .3s ease-out both', overflowY: 'auto', minHeight: 0 }}>
      <ProgressBar step={step} />

      <div className="insight-stagger" style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1, color: T.muted, marginBottom: 6, animationDelay: '0ms' }}>STEP {step} / 3</div>

      {step === 1 && <>
        <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 10, animationDelay: '50ms' }}>
          When did your<br /><em>last period</em> start?
        </div>
        <div className="insight-stagger" style={{ fontSize: 14, color: T.muted, marginBottom: 24, fontFamily: T.serif, lineHeight: 1.55, fontStyle: 'italic', animationDelay: '100ms' }}>
          A rough estimate is enough. We'll learn the rest from you.
        </div>
        <div className="insight-stagger" style={{ animationDelay: '160ms' }}>
          <StepDate value={lastPeriodISO} onChange={setLastPeriodISO} />
        </div>
      </>}

      {step === 2 && <>
        <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 10, animationDelay: '50ms' }}>
          How long is your<br /><em>cycle, usually?</em>
        </div>
        <div className="insight-stagger" style={{ fontSize: 14, color: T.muted, marginBottom: 24, fontFamily: T.serif, lineHeight: 1.55, fontStyle: 'italic', animationDelay: '100ms' }}>
          Most cycles land between 21 and 35 days. If yours is different, that's okay — bodies aren't averages.
        </div>
        <div className="insight-stagger" style={{ animationDelay: '160ms' }}>
          <StepCycle value={cycleDays} onChange={setCycleDays} />
          <SourceLine>ACOG — Menstrual Cycle Norms</SourceLine>
        </div>
      </>}

      {step === 3 && <>
        <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 10, animationDelay: '50ms' }}>
          Last thing —<br /><em>what shall we call you?</em>
        </div>
        <div className="insight-stagger" style={{ fontSize: 14, color: T.muted, marginBottom: 24, fontFamily: T.serif, lineHeight: 1.55, fontStyle: 'italic', animationDelay: '100ms' }}>
          Your name greets you on your home screen.{signedInEmail ? '' : ' Your account is how you sign in on any device.'}
        </div>
        <div className="insight-stagger" style={{ animationDelay: '160ms' }}>
          <StepAccount
            name={account.name}
            email={account.email}
            accountPassword={account.accountPassword}
            onChange={setAccountField}
            signedInEmail={signedInEmail}
          />
        </div>
        {signupError && (
          <div style={{ marginTop: 12, fontFamily: T.sans, fontSize: 12, color: T.accent, lineHeight: 1.5 }}>{signupError}</div>
        )}
      </>}

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {step === 3 && blockReason && (
          <div style={{ fontFamily: T.sans, fontSize: 12, color: T.accent, lineHeight: 1.5, padding: '10px 14px', background: T.accent + '12', border: `1px solid ${T.accent}40`, borderRadius: T.r }}>
            {blockReason}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          {step > 1 && (
            <button onClick={() => go(`onb${step - 1}`)}
              style={{ border: `1px solid ${T.text}`, background: 'transparent', color: T.text, padding: '15px 18px', borderRadius: T.r, cursor: 'pointer' }}>
              {Icons.back}
            </button>
          )}
          <CTAButton full onClick={() => { if (canAdvance && !finishing) next() }} style={{ opacity: canAdvance && !finishing ? 1 : 0.5 }}>
            {finishing ? 'GETTING THINGS READY…' : (step < 3 ? 'CONTINUE' : 'WELCOME TO LUNA')} {Icons.arrow}
          </CTAButton>
        </div>

      </div>
      </div>
    </div>
  )
}
