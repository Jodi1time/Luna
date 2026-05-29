import { useState } from 'react'
import { T } from '../data/theme'
import { CTAButton, SourceLine, Icons } from '../components/shared'
import useLuna from '../store/useLuna'
import { createVault } from '../lib/crypto'
import { biometricSupported } from '../lib/biometric'
import BiometricPrompt from './BiometricPrompt'
import { StatusView } from '../components/StatusView'
import { validateName, validatePasscode, validateAccountPassword, validateEmail } from '../lib/validation'

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

function StepAccount({ name, passcode, confirmPasscode, email, accountPassword, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Field label="Your name" value={name} onChange={(v) => onChange('name', v)} placeholder="Mira" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 14, borderTop: `1px solid ${T.hair}` }}>
        <div style={{ fontSize: 10, letterSpacing: 1.5, fontWeight: 700, fontFamily: T.sans, color: T.muted, textTransform: 'uppercase' }}>Lock this device</div>
        <Field label="Passcode" type="password" value={passcode} onChange={(v) => onChange('passcode', v)} placeholder="Min. 6 characters" />
        <Field label="Confirm passcode" type="password" value={confirmPasscode} onChange={(v) => onChange('confirmPasscode', v)} placeholder="Re-enter passcode" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 14, borderTop: `1px solid ${T.hair}` }}>
        <div style={{ fontSize: 10, letterSpacing: 1.5, fontWeight: 700, fontFamily: T.sans, color: T.muted, textTransform: 'uppercase' }}>Your account · for recovery</div>
        <Field label="Email" type="email" value={email} onChange={(v) => onChange('email', v)} placeholder="you@example.com" />
        <Field label="Account password" type="password" value={accountPassword} onChange={(v) => onChange('accountPassword', v)} placeholder="Min. 8 characters" />
      </div>

      <div style={{ fontSize: 12, color: T.muted, fontFamily: T.sans, lineHeight: 1.55, padding: '12px 14px', background: T.subtle, borderRadius: T.r }}>
        Your passcode encrypts everything here. Your account lets you sign in elsewhere.
      </div>
    </div>
  )
}

export default function Onboarding({ step }) {
  const { go, setOnboarding, cycleLength } = useLuna()
  const [dateDay,   setDateDay]  = useState(new Date().getDate())
  const [cycleDays, setCycleDays]= useState(cycleLength || 28)
  const [account, setAccount] = useState({
    name: '', passcode: '', confirmPasscode: '',
    email: '', accountPassword: '',
  })
  const [signupError, setSignupError] = useState('')
  const [setupComplete, setSetupComplete] = useState(false)
  const [finishedPasscode, setFinishedPasscode] = useState('')
  const [finishing, setFinishing] = useState(false)
  const [fatalError, setFatalError] = useState('')

  const setAccountField = (key, val) => setAccount((a) => ({ ...a, [key]: val }))

  const now = new Date()

  const finish = async () => {
    if (finishing) return
    setSignupError('')
    setFatalError('')
    setFinishing(true)
    try {
      const d = new Date(now.getFullYear(), now.getMonth(), dateDay)
      await createVault(account.passcode)
      await useLuna.persist.rehydrate()

      let acct = null
      if (account.email.trim() && account.accountPassword) {
        try {
          const { signUp } = await import('../lib/supabase')
          const data = await signUp(account.email.trim(), account.accountPassword)
          acct = { email: account.email.trim() }
          if (data && !data.session) {
            // Email confirmation is required. The session will arrive
            // via the auth state listener once the user clicks the link.
            setSignupError("Check your email — we sent you a link to confirm your account. Your Luna is set up either way.")
          }
        } catch (e) {
          // Non-fatal: vault is created, user lands on Home, can retry account from Settings.
          setSignupError(e.message || 'Could not create account — you can try again from Settings.')
        }
      }

      setOnboarding({
        lastPeriodStart: d.toISOString().slice(0, 10),
        cycleLength: cycleDays,
        displayName: account.name.trim(),
        account: acct,
      })

      // Analytics: completion + whether the user chose to create an
      // account. NO content (name, email, dates) — only category data.
      try {
        const { capture } = await import('../lib/posthog')
        capture('onboarding_completed', { account_created: Boolean(acct) })
      } catch {}

      if (biometricSupported()) {
        setFinishedPasscode(account.passcode)
        setSetupComplete(true)
      } else {
        go('home')
      }
    } catch (e) {
      setFatalError(e?.message || "Couldn't finish setup. Please try again.")
      setFinishing(false)
    }
  }

  // Returns a human-readable string describing what's missing, or null if good to go.
  const validationMessage = () => {
    if (step !== 3) return null
    const nameErr = validateName(account.name)
    if (nameErr) return nameErr
    const pcErr = validatePasscode(account.passcode)
    if (pcErr) return pcErr
    if (account.confirmPasscode.length === 0) return 'Confirm your passcode by re-entering it.'
    if (account.passcode !== account.confirmPasscode) return "Your passcodes don't match yet."
    const hasEmail = account.email.trim().length > 0
    const hasPw    = account.accountPassword.length > 0
    if (hasEmail && !hasPw) return 'Add an account password — or leave the email blank to skip the account.'
    if (!hasEmail && hasPw) return 'Add your email — or leave the account password blank to skip the account.'
    if (hasEmail) {
      const emailErr = validateEmail(account.email)
      if (emailErr) return emailErr
      const apErr = validateAccountPassword(account.accountPassword)
      if (apErr) return apErr
    }
    return null
  }

  const blockReason = validationMessage()
  const canAdvance = blockReason === null

  const next = step < 3 ? () => go(`onb${step + 1}`) : finish

  if (setupComplete) {
    return (
      <BiometricPrompt
        passcode={finishedPasscode}
        userId={account.email || 'luna-user'}
        userName={account.name}
        onDone={() => go('home')}
      />
    )
  }

  if (finishing || fatalError) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: T.bg, color: T.text }}>
        <StatusView
          loading={finishing && !fatalError}
          loadingMessage="SETTING UP YOUR LUNA"
          error={fatalError}
          onRetry={() => { setFatalError(''); finish() }}
        />
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '60px 28px 36px', background: T.bg, color: T.text, animation: 'fadeUp .3s ease-out both' }}>
      <ProgressBar step={step} />

      <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1, color: T.muted, marginBottom: 6 }}>STEP {step} / 3</div>

      {step === 1 && <>
        <div style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 8 }}>
          When did your<br /><em>last period</em> start?
        </div>
        <div style={{ fontSize: 14, color: T.muted, marginBottom: 24, fontFamily: T.sans }}>Estimate is fine — Luna refines predictions as you log.</div>
        <StepDate value={dateDay} onChange={setDateDay} />
      </>}

      {step === 2 && <>
        <div style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 8 }}>
          How long is your<br /><em>cycle, typically?</em>
        </div>
        <div style={{ fontSize: 14, color: T.muted, marginBottom: 24, fontFamily: T.sans }}>Average is 28 days. Anywhere 21–35 is medically normal.</div>
        <StepCycle value={cycleDays} onChange={setCycleDays} />
        <SourceLine>ACOG — Menstrual Cycle Norms</SourceLine>
      </>}

      {step === 3 && <>
        <div style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 8 }}>
          One last thing —<br /><em>who are you?</em>
        </div>
        <div style={{ fontSize: 14, color: T.muted, marginBottom: 24, fontFamily: T.sans, lineHeight: 1.5 }}>
          Your name appears on your home screen. Your passcode locks Luna on this device.
        </div>
        <StepAccount
          name={account.name}
          passcode={account.passcode}
          confirmPasscode={account.confirmPasscode}
          email={account.email}
          accountPassword={account.accountPassword}
          onChange={setAccountField}
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
            {finishing ? 'SETTING UP…' : (step < 3 ? 'CONTINUE' : 'ENTER LUNA')} {Icons.arrow}
          </CTAButton>
        </div>

      </div>
    </div>
  )
}
