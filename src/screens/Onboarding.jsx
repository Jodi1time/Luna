import { useState, useEffect } from 'react'
import { T } from '../data/theme'
import { CTAButton, SourceLine, Icons } from '../components/shared'
import Backdrop from '../components/Backdrop'
import useLuna from '../store/useLuna'
import { getSession } from '../lib/supabase'
import { StatusView } from '../components/StatusView'
import { validateName, validateAccountPassword, validateEmail } from '../lib/validation'

// Editorial progress indicator — three small italic-serif step labels,
// current step lit in accent, completed steps dimmed but legible.
// Lowercase to match Luna's literary register; uppercase mono was
// the form-wizard tell that didn't belong here.
function ProgressBar({ step, total = 3 }) {
  const labels = ['your last period', 'your cycle', 'your name']
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 30 }}>
      {Array.from({ length: total }).map((_, i) => {
        const n = i + 1
        const active = n === step
        const done = n < step
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, fontWeight: 500,
              background: active ? T.accent : (done ? T.accent + '22' : 'rgba(253,250,245,0.55)'),
              color: active ? '#fff' : (done ? T.accent : T.muted),
              border: active ? 'none' : `1px solid ${done ? T.accent + '40' : 'rgba(26,19,16,0.08)'}`,
              boxShadow: active ? `0 6px 14px -6px ${T.accent}80` : 'none',
              transition: 'all 0.3s var(--ease-out)',
            }}>
              {n}
            </div>
            <div style={{
              fontFamily: T.serif, fontStyle: 'italic',
              fontSize: 11, fontWeight: 500,
              color: active ? T.accent : T.muted,
              opacity: active ? 1 : 0.6,
              letterSpacing: -0.1,
              transition: 'all 0.3s var(--ease-out)',
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
    <div className="frost-card" style={{
      background: 'rgba(253,250,245,0.55)',
      padding: 18,
      border: '1px solid rgba(26,19,16,0.06)',
      borderRadius: 22,
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      boxShadow: '0 14px 30px -22px rgba(26,19,16,0.18)',
    }}>
      {/* Month navigation header — frosted circular nav buttons,
          italic-serif month label. */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={() => stepMonth(-1)} disabled={!canGoBack}
          aria-label="Previous month"
          className="alive-card"
          style={{
            background: 'rgba(253,250,245,0.55)',
            border: '1px solid rgba(26,19,16,0.06)',
            color: canGoBack ? T.text : 'rgba(26,19,16,0.18)',
            width: 32, height: 32, borderRadius: 999,
            cursor: canGoBack ? 'pointer' : 'default',
            fontFamily: T.serif, fontSize: 17, padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>‹</button>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontWeight: 500, fontSize: 18, letterSpacing: -0.2, color: T.text }}>
          {monthLabel.toLowerCase()}
        </div>
        <button onClick={() => stepMonth(1)} disabled={!canGoForward}
          aria-label="Next month"
          className="alive-card"
          style={{
            background: 'rgba(253,250,245,0.55)',
            border: '1px solid rgba(26,19,16,0.06)',
            color: canGoForward ? T.text : 'rgba(26,19,16,0.18)',
            width: 32, height: 32, borderRadius: 999,
            cursor: canGoForward ? 'pointer' : 'default',
            fontFamily: T.serif, fontSize: 17, padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>›</button>
      </div>
      {/* Day-of-week headers — italic serif lowercase, not mono caps */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
        {days.map((d, i) => <div key={i} style={{ textAlign: 'center', fontSize: 11, color: T.muted, fontFamily: T.serif, fontStyle: 'italic', fontWeight: 500, opacity: 0.7 }}>{d.toLowerCase()}</div>)}
      </div>
      {/* Day cells — rounded, soft selection, today gets a dashed ring */}
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
                fontSize: 14, fontFamily: T.serif,
                cursor: isFuture ? 'default' : 'pointer',
                border: isToday && !isSelected ? `1.5px dashed ${T.accent}66` : 'none',
                background: isSelected ? T.accent : 'transparent',
                color: isSelected ? '#fff' : isFuture ? 'rgba(26,19,16,0.18)' : T.text,
                opacity: isFuture ? 0.4 : 1,
                borderRadius: 999,
                fontWeight: isSelected ? 600 : 400,
                fontStyle: isSelected ? 'italic' : 'normal',
                padding: 0,
                boxShadow: isSelected ? `0 6px 14px -6px ${T.accent}80` : 'none',
                transition: 'all 0.2s var(--ease-out)',
              }}>
              {d}
            </button>
          )
        })}
      </div>
      {/* Selected-date readback — italic serif sentence */}
      {value && (
        <div style={{
          marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(26,19,16,0.06)',
          fontFamily: T.serif, fontSize: 14, fontStyle: 'italic',
          color: T.text, textAlign: 'center', letterSpacing: -0.1,
        }}>
          {new Date(value + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toLowerCase()}.
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

// Field — italic-serif lowercase label, frost-card input, accent
// focus ring. Matches the Settings + Auth register. The previous
// uppercase-mono labels + square inputs were the last form-wizard
// tell on this screen.
function Field({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{
        fontFamily: T.serif, fontStyle: 'italic', fontSize: 13,
        fontWeight: 500, color: T.muted, letterSpacing: -0.1,
      }}>
        {String(label).toLowerCase()}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoCapitalize="off"
        autoCorrect="off"
        className="frost-card"
        style={{
          background: 'rgba(253,250,245,0.55)',
          border: '1px solid rgba(26,19,16,0.08)',
          borderRadius: 16,
          padding: '14px 16px',
          fontSize: 15,
          fontFamily: T.sans,
          color: T.text,
          outline: 'none',
          width: '100%',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
        onFocus={(e) => { e.target.style.borderColor = T.accent; e.target.style.boxShadow = `0 0 0 3px ${T.accent}18` }}
        onBlur={(e)  => { e.target.style.borderColor = 'rgba(26,19,16,0.08)'; e.target.style.boxShadow = 'none' }}
      />
    </div>
  )
}

function StepAccount({ name, email, accountPassword, onChange, signedInEmail }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Field label="your name" value={name} onChange={(v) => onChange('name', v)} placeholder="Mira" />

      {signedInEmail ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 14, borderTop: '1px solid rgba(26,19,16,0.06)' }}>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, fontWeight: 500, color: T.muted, letterSpacing: -0.1 }}>
            signed in as
          </div>
          <div style={{ fontFamily: T.sans, fontSize: 14, color: T.text }}>{signedInEmail}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 14, borderTop: '1px solid rgba(26,19,16,0.06)' }}>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, fontWeight: 500, color: T.muted, letterSpacing: -0.1 }}>
            your account
          </div>
          <Field label="email" type="email" value={email} onChange={(v) => onChange('email', v)} placeholder="you@example.com" />
          <Field label="password" type="password" value={accountPassword} onChange={(v) => onChange('accountPassword', v)} placeholder="At least 8 characters" />
        </div>
      )}

      <div className="frost-card" style={{
        fontSize: 12.5, color: T.muted, fontFamily: T.serif, fontStyle: 'italic',
        lineHeight: 1.6, padding: '14px 16px',
        background: 'rgba(253,250,245,0.55)',
        border: '1px solid rgba(26,19,16,0.06)',
        borderRadius: 16,
      }}>
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
          // Propagate the session to the store immediately so the rest
          // of the app (Settings auth row, etc.) knows the user is
          // authenticated. Supabase returns a session here when
          // "Confirm email" is OFF in the dashboard; otherwise the
          // session lands once they click the verify link.
          if (data?.session) {
            useLuna.getState().setSession(data.session)
          }
          if (data && !data.session) {
            setSignupError("Check your email — we sent you a link to confirm your account. Your Luna is set up either way.")
          }
        } catch (e) {
          // Signup failed — most commonly because the email is already
          // registered. Fall back to signin so the same form handles
          // both new and returning users.
          try {
            const data = await signIn(email, password)
            acct = { email }
            if (data?.session) {
              useLuna.getState().setSession(data.session)
            }
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

      <div className="insight-stagger" style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, letterSpacing: -0.1, color: T.muted, marginBottom: 6, fontWeight: 500, animationDelay: '0ms' }}>step {step} of 3</div>

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
          <div className="frost-card" style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: T.accent, lineHeight: 1.5, padding: '12px 16px', background: T.accent + '14', border: `1px solid ${T.accent}40`, borderRadius: 16 }}>
            {blockReason}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          {step > 1 && (
            <button onClick={() => go(`onb${step - 1}`)}
              className="alive-card"
              aria-label="Back"
              style={{
                border: '1px solid rgba(26,19,16,0.08)',
                background: 'rgba(253,250,245,0.55)',
                color: T.text,
                padding: '14px 18px',
                borderRadius: 999,
                cursor: 'pointer',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
              }}>
              {Icons.back}
            </button>
          )}
          <CTAButton full onClick={() => { if (canAdvance && !finishing) next() }} style={{ opacity: canAdvance && !finishing ? 1 : 0.5, letterSpacing: 0.3, textTransform: 'none', fontSize: 13 }}>
            {finishing ? 'Getting things ready…' : (step < 3 ? 'Continue' : 'Welcome to Luna')} {Icons.arrow}
          </CTAButton>
        </div>

      </div>
      </div>
    </div>
  )
}
