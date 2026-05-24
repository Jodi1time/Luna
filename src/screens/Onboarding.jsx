import { useState } from 'react'
import { T } from '../data/theme'
import { CTAButton, SourceLine, Icons } from '../components/shared'
import useLuna from '../store/useLuna'
import { createVault } from '../lib/crypto'

function ProgressBar({ step, total = 4 }) {
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

function StepStorage({ value, onChange }) {
  const opts = [
    { id: 'local', label: 'On-device only',                  sub: 'Encrypted on this phone. Nothing leaves.',       rec: true },
    { id: 'sync',  label: 'Sync with end-to-end encryption', sub: "Back up across your devices. We can't read it.", rec: false },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {opts.map((o) => (
        <button key={o.id} onClick={() => onChange(o.id)}
          style={{ padding: 16, border: `1px solid ${value === o.id ? T.accent : T.hair}`, background: value === o.id ? T.accent + '0E' : T.card, cursor: 'pointer', textAlign: 'left', position: 'relative', borderRadius: T.r, fontFamily: T.sans, color: T.text }}>
          {o.rec && (
            <div style={{ position: 'absolute', top: -1, right: -1, padding: '3px 8px', background: T.accent, color: '#fff', fontSize: 9, letterSpacing: 1.2, fontWeight: 700, fontFamily: T.sans }}>
              RECOMMENDED
            </div>
          )}
          <div style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 500, marginBottom: 3 }}>{o.label}</div>
          <div style={{ fontSize: 12, color: T.muted }}>{o.sub}</div>
        </button>
      ))}
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

function StepAccount({ name, email, password, confirm, onChange, storageMode }) {
  const isSync = storageMode === 'sync'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Field label="Passcode" type="password" value={password} onChange={(v) => onChange('password', v)} placeholder="Min. 6 characters" />
      <Field label="Confirm passcode" type="password" value={confirm} onChange={(v) => onChange('confirm', v)} placeholder="Re-enter passcode" />
      <div style={{ fontSize: 12, color: T.muted, fontFamily: T.sans, lineHeight: 1.5, padding: '10px 14px', background: T.subtle, borderRadius: T.r }}>
        Your data is encrypted on this device with this passcode using AES-256. We never see it. If you forget your passcode, your data cannot be recovered.
      </div>
      {isSync && (
        <>
          <Field label="Email" type="email" value={email} onChange={(v) => onChange('email', v)} placeholder="you@example.com" />
          <Field label="Your name (optional)" value={name} onChange={(v) => onChange('name', v)} placeholder="Mira" />
        </>
      )}
    </div>
  )
}

export default function Onboarding({ step }) {
  const { go, setOnboarding, cycleLength } = useLuna()
  const [dateDay,   setDateDay]  = useState(new Date().getDate())
  const [cycleDays, setCycleDays]= useState(cycleLength || 28)
  const [storage,   setStorage]  = useState('local')
  const [account,   setAccount]  = useState({ name: '', email: '', password: '', confirm: '' })

  const setAccountField = (key, val) => setAccount((a) => ({ ...a, [key]: val }))

  const now = new Date()

  const finish = async () => {
    const d = new Date(now.getFullYear(), now.getMonth(), dateDay)
    await createVault(account.password)
    await useLuna.persist.rehydrate()
    setOnboarding({
      lastPeriodStart: d.toISOString().slice(0, 10),
      cycleLength: cycleDays,
      storageMode: storage,
      account: account.email ? { name: account.name, email: account.email } : null,
    })
    go('home')
  }

  const canAdvance = () => {
    if (step === 4) {
      if (account.password.length < 6) return false
      if (account.password !== account.confirm) return false
      if (storage === 'sync' && account.email.trim() === '') return false
      return true
    }
    return true
  }

  const next = step < 4 ? () => go(`onb${step + 1}`) : finish

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '60px 28px 36px', background: T.bg, color: T.text, animation: 'fadeUp .3s ease-out both' }}>
      <ProgressBar step={step} />

      <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1, color: T.muted, marginBottom: 6 }}>STEP {step} / 4</div>

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
          Where does your<br /><em>data live?</em>
        </div>
        <div style={{ fontSize: 14, color: T.muted, marginBottom: 20, fontFamily: T.sans, lineHeight: 1.5 }}>
          Your default is on-device only. You can change it any time in Settings.
        </div>
        <StepStorage value={storage} onChange={setStorage} />
        <SourceLine>You can change this any time in Settings → Privacy</SourceLine>
      </>}

      {step === 4 && <>
        <div style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 8 }}>
          {storage === 'sync' ? <>Secure your data<br /><em>and create your account.</em></> : <>Secure your data<br /><em>with a passcode.</em></>}
        </div>
        <div style={{ fontSize: 14, color: T.muted, marginBottom: 24, fontFamily: T.sans, lineHeight: 1.5 }}>
          {storage === 'sync' ? 'Used to encrypt this device and authenticate sync.' : 'Used to encrypt everything on this device. Required.'}
        </div>
        <StepAccount name={account.name} email={account.email} password={account.password} confirm={account.confirm} onChange={setAccountField} storageMode={storage} />
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
            {step < 4 ? 'CONTINUE' : 'ENTER LUNA'} {Icons.arrow}
          </CTAButton>
        </div>

      </div>
    </div>
  )
}
