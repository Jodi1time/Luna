import { useState, useEffect } from 'react'
import { T } from '../data/theme'
import { CTAButton, SourceLine, Icons } from '../components/shared'
import useLuna from '../store/useLuna'
import { getSession } from '../lib/supabase'
import { StatusView } from '../components/StatusView'
import { validateName, validateAccountPassword, validateEmail } from '../lib/validation'

function ProgressBar({ step, total = 3 }) {
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 36 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ height: 2, flex: 1, background: i < step ? T.accent : T.hair, transition: 'background .2s' }} />
      ))}
    </div>
  )
}

function StepDate({ value, onChange }) {
  const days  = ['M','T','W','T','F','S','S']
  const dates = Array.from({ length: 31 }, (_, i) => i + 1)
  const now   = new Date()
  const month = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const first = new Date(now.getFullYear(), now.getMonth(), 1).getDay()
  const adj   = first === 0 ? 6 : first - 1
  return (
    <div style={{ background: T.card, padding: 16, border: `1px solid ${T.hair}`, borderRadius: T.r }}>
      <div style={{ fontWeight: 600, fontSize: 14, fontFamily: T.sans, marginBottom: 14 }}>{month}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
        {days.map((d, i) => <div key={i} style={{ textAlign: 'center', fontSize: 10, color: T.muted, fontFamily: T.sans }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {Array.from({ length: adj }).map((_, i) => <div key={`e${i}`} />)}
        {dates.map((d) => (
          <button key={d} onClick={() => onChange(d)}
            style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontFamily: T.sans, cursor: 'pointer', border: 'none', background: value === d ? T.accent : 'transparent', color: value === d ? '#fff' : T.text, borderRadius: T.r, fontWeight: value === d ? 600 : 400 }}>
            {d}
          </button>
        ))}
      </div>
    </div>
  )
}

function StepCycle({ value, onChange }) {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <span key={value} style={{ fontFamily: T.serif, fontSize: 96, fontWeight: 300, color: T.accent, lineHeight: 1, display: 'inline-block', animation: 'numberPop 0.35s ease-out both' }}>{value}</span>
        <span style={{ fontFamily: T.sans, fontSize: 14, color: T.muted, marginLeft: 8 }}>days</span>
      </div>
      <input type="range" min={21} max={45} value={value} onChange={(e) => onChange(+e.target.value)} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.muted, marginTop: 6, fontFamily: T.sans }}>
        <span>21</span><span>33</span><span>45</span>
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
  const [dateDay,   setDateDay]  = useState(new Date().getDate())
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
      const d = new Date(now.getFullYear(), now.getMonth(), dateDay)

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
      <div className="blob-stage subtle" aria-hidden="true">
        <div className="breathing-blob" style={{ '--phase-color': T.accent }} />
      </div>
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', padding: '60px 28px 36px', color: T.text, animation: 'fadeUp .3s ease-out both', overflowY: 'auto', minHeight: 0 }}>
      <ProgressBar step={step} />

      <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1, color: T.muted, marginBottom: 6 }}>STEP {step} / 3</div>

      {step === 1 && <>
        <div style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 10 }}>
          When did your<br /><em>last period</em> start?
        </div>
        <div style={{ fontSize: 14, color: T.muted, marginBottom: 24, fontFamily: T.sans, lineHeight: 1.55 }}>
          A rough estimate is enough. We'll learn the rest from you.
        </div>
        <StepDate value={dateDay} onChange={setDateDay} />
      </>}

      {step === 2 && <>
        <div style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 10 }}>
          How long is your<br /><em>cycle, usually?</em>
        </div>
        <div style={{ fontSize: 14, color: T.muted, marginBottom: 24, fontFamily: T.sans, lineHeight: 1.55 }}>
          Most cycles land between 21 and 35 days. If yours is different, that's okay — bodies aren't averages.
        </div>
        <StepCycle value={cycleDays} onChange={setCycleDays} />
        <SourceLine>ACOG — Menstrual Cycle Norms</SourceLine>
      </>}

      {step === 3 && <>
        <div style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 10 }}>
          Last thing —<br /><em>what shall we call you?</em>
        </div>
        <div style={{ fontSize: 14, color: T.muted, marginBottom: 24, fontFamily: T.sans, lineHeight: 1.55 }}>
          Your name greets you on your home screen.{signedInEmail ? '' : ' Your account is how you sign in on any device.'}
        </div>
        <StepAccount
          name={account.name}
          email={account.email}
          accountPassword={account.accountPassword}
          onChange={setAccountField}
          signedInEmail={signedInEmail}
        />
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
