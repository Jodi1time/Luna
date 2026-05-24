import { useState } from 'react'
import { T } from '../data/theme'
import { CTAButton, SourceLine, Icons } from '../components/shared'
import useLuna from '../store/useLuna'
import { createVault } from '../lib/crypto'

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
        <span style={{ fontFamily: T.serif, fontSize: 96, fontWeight: 300, color: T.accent, lineHeight: 1 }}>{value}</span>
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

function StepAccount({ name, passcode, confirmPasscode, email, accountPassword, createAccount, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Field label="Your name" value={name} onChange={(v) => onChange('name', v)} placeholder="Mira" />

      <Field label="Passcode" type="password" value={passcode} onChange={(v) => onChange('passcode', v)} placeholder="Min. 6 characters" />
      <Field label="Confirm passcode" type="password" value={confirmPasscode} onChange={(v) => onChange('confirmPasscode', v)} placeholder="Re-enter passcode" />
      <div style={{ fontSize: 11.5, color: T.muted, fontFamily: T.sans, lineHeight: 1.5, padding: '10px 14px', background: T.subtle, borderRadius: T.r }}>
        Your passcode encrypts your cycle data on this device using AES-256. We never see it. If you forget it, your data cannot be recovered.
      </div>

      {/* Account section */}
      <div style={{ borderTop: `1px solid ${T.hair}`, paddingTop: 16, marginTop: 4 }}>
        <button type="button" onClick={() => onChange('createAccount', !createAccount)}
          style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'inherit', color: T.text, marginBottom: createAccount ? 12 : 0 }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 10, letterSpacing: 1.5, fontWeight: 700, fontFamily: T.sans, color: T.muted, textTransform: 'uppercase', marginBottom: 3 }}>OPTIONAL</div>
            <div style={{ fontFamily: T.serif, fontSize: 16, fontWeight: 500 }}>Create an account</div>
            <div style={{ fontSize: 12, color: T.muted, fontFamily: T.sans, marginTop: 3, lineHeight: 1.4 }}>For password recovery and future multi-device sync. You can also do this later in Settings.</div>
          </div>
          <span style={{ color: T.accent, fontFamily: T.sans, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginLeft: 12, flexShrink: 0 }}>
            {createAccount ? 'HIDE' : 'ADD'}
          </span>
        </button>

        {createAccount && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeUp .2s ease-out both' }}>
            <Field label="Email" type="email" value={email} onChange={(v) => onChange('email', v)} placeholder="you@example.com" />
            <Field label="Account password" type="password" value={accountPassword} onChange={(v) => onChange('accountPassword', v)} placeholder="Min. 8 characters" />
            <div style={{ fontSize: 11, color: T.muted, fontFamily: T.sans, lineHeight: 1.5 }}>
              Separate from your device passcode. Used only to sign you in.
            </div>
          </div>
        )}
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
    createAccount: false, email: '', accountPassword: '',
  })
  const [signupError, setSignupError] = useState('')

  const setAccountField = (key, val) => setAccount((a) => ({ ...a, [key]: val }))

  const now = new Date()

  const finish = async () => {
    setSignupError('')
    const d = new Date(now.getFullYear(), now.getMonth(), dateDay)
    await createVault(account.passcode)
    await useLuna.persist.rehydrate()

    let acct = null
    if (account.createAccount && account.email && account.accountPassword) {
      try {
        const { signUp } = await import('../lib/supabase')
        await signUp(account.email, account.accountPassword)
        acct = { email: account.email }
      } catch (e) {
        setSignupError(e.message || 'Could not create account — you can try again from Settings.')
      }
    }

    setOnboarding({
      lastPeriodStart: d.toISOString().slice(0, 10),
      cycleLength: cycleDays,
      displayName: account.name.trim(),
      account: acct,
    })
    go('home')
  }

  const canAdvance = () => {
    if (step === 3) {
      if (!account.name.trim()) return false
      if (account.passcode.length < 6) return false
      if (account.passcode !== account.confirmPasscode) return false
      if (account.createAccount) {
        if (!account.email.trim()) return false
        if (account.accountPassword.length < 8) return false
      }
      return true
    }
    return true
  }

  const next = step < 3 ? () => go(`onb${step + 1}`) : finish

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
          createAccount={account.createAccount}
          onChange={setAccountField}
        />
        {signupError && (
          <div style={{ marginTop: 12, fontFamily: T.sans, fontSize: 12, color: T.accent, lineHeight: 1.5 }}>{signupError}</div>
        )}
      </>}

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {step > 1 && (
            <button onClick={() => go(`onb${step - 1}`)}
              style={{ border: `1px solid ${T.text}`, background: 'transparent', color: T.text, padding: '15px 18px', borderRadius: T.r, cursor: 'pointer' }}>
              {Icons.back}
            </button>
          )}
          <CTAButton full onClick={next} style={{ opacity: canAdvance() ? 1 : 0.5 }}>
            {step < 3 ? 'CONTINUE' : 'ENTER LUNA'} {Icons.arrow}
          </CTAButton>
        </div>

      </div>
    </div>
  )
}
