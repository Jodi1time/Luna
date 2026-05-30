import { useState } from 'react'
import { T } from '../data/theme'
import { CTAButton, Icons, Screen, Masthead } from '../components/shared'
import { signIn, signUp, requestPasswordReset, supabaseEnabled } from '../lib/supabase'
import { validateEmail, validateAccountPassword } from '../lib/validation'
import useLuna from '../store/useLuna'

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

export default function Auth() {
  const { back, go } = useLuna()
  const hydrateFromCloud = useLuna((s) => s.hydrateFromCloud)
  const [mode, setMode] = useState('signin') // 'signin' | 'signup' | 'reset'
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy]         = useState(false)
  const [error, setError]       = useState('')
  const [info, setInfo]         = useState('')

  if (!supabaseEnabled) {
    return (
      <Screen>
        <div style={{ padding: '12px 22px 0', color: T.text }}>
          <Masthead issue="Account" onBack={back} />
          <div style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 500, letterSpacing: -0.6, lineHeight: 1.1, marginBottom: 12 }}>
            Account sign-in isn't configured yet.
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 15, color: T.muted, lineHeight: 1.55 }}>
            Luna needs Supabase to be configured before sign-in can work. Ask the developer to set up <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.
          </div>
        </div>
      </Screen>
    )
  }

  const submit = async () => {
    setError(''); setInfo('')
    const emailErr = validateEmail(email)
    if (emailErr) { setError(emailErr); return }
    if (mode !== 'reset') {
      const pwErr = validateAccountPassword(password)
      if (pwErr) { setError(pwErr); return }
    }
    setBusy(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
        // Pull the user's profile + logs from the cloud. If they had
        // previously completed onboarding, their data is back in the
        // store — route straight to Home. If they signed up but never
        // finished onboarding (or this is a brand-new account), drop
        // them at step 3 to set a display name.
        await hydrateFromCloud().catch(() => {})
        const profileOnboarded = useLuna.getState().onboarded
        go(profileOnboarded ? 'home' : 'onb3')
      } else if (mode === 'signup') {
        await signUp(email, password)
        setInfo('Check your email to confirm your account.')
      } else if (mode === 'reset') {
        await requestPasswordReset(email)
        setInfo('Check your email for a reset link.')
      }
    } catch (e) {
      setError(e.message || 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const headline = mode === 'signin' ? 'Welcome back.' : mode === 'signup' ? 'Make a little space for you.' : 'Forgot it? It happens.'
  const sub = mode === 'reset'
    ? "We'll email you a link to set a new password."
    : "Sign in to come back to your cycle on any device. Your data is encrypted at rest — only you can read it."

  return (
    <div className="home-stage">
      <div className="blob-stage subtle" aria-hidden="true">
        <div className="breathing-blob" style={{ '--phase-color': T.accent }} />
      </div>
      <Screen>
        <div style={{ position: 'relative', zIndex: 1, padding: '12px 22px 0', color: T.text }}>
          <Masthead issue="Account" onBack={back} />
        <div style={{ fontFamily: T.serif, fontSize: 32, fontWeight: 500, letterSpacing: -0.7, lineHeight: 1.05, marginBottom: 10 }}>
          {headline}
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 14, color: T.muted, lineHeight: 1.55, marginBottom: 24 }}>{sub}</div>

        {mode !== 'reset' && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
            {[['signin','Sign in'],['signup','Create account']].map(([k, l]) => (
              <button key={k} onClick={() => { setMode(k); setError(''); setInfo('') }}
                style={{ background: mode === k ? T.text : 'transparent', color: mode === k ? T.bg : T.text, border: `1px solid ${mode === k ? T.text : T.hair}`, padding: '7px 12px', cursor: 'pointer', fontFamily: T.sans, fontSize: 11, fontWeight: 600, letterSpacing: 0.6, borderRadius: T.r }}>
                {l}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
          {mode !== 'reset' && (
            <Field label="Account password" type="password" value={password} onChange={setPassword} placeholder={mode === 'signup' ? 'Min. 8 characters' : '••••••••'} />
          )}
        </div>

        {error && <div style={{ fontFamily: T.sans, fontSize: 12, color: T.accent, marginTop: 12 }}>{error}</div>}
        {info  && <div style={{ fontFamily: T.sans, fontSize: 12, color: T.text, background: T.subtle, padding: '10px 14px', borderRadius: T.r, marginTop: 12, lineHeight: 1.5 }}>{info}</div>}

        <div style={{ marginTop: 22 }}>
          <CTAButton full onClick={submit} style={{ opacity: busy ? 0.5 : 1 }}>
            {busy ? 'WORKING…' : mode === 'signin' ? 'SIGN IN' : mode === 'signup' ? 'CREATE ACCOUNT' : 'EMAIL RESET LINK'} {Icons.arrow}
          </CTAButton>
        </div>

        {mode === 'signin' && (
          <button onClick={() => { setMode('reset'); setError(''); setInfo('') }}
            style={{ marginTop: 14, background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontFamily: T.sans, fontSize: 12, padding: 8, textAlign: 'left', width: '100%' }}>
            Forgot password?
          </button>
        )}
        {mode === 'reset' && (
          <button onClick={() => { setMode('signin'); setError(''); setInfo('') }}
            style={{ marginTop: 14, background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontFamily: T.sans, fontSize: 12, padding: 8, textAlign: 'left', width: '100%' }}>
            ← Back to sign in
          </button>
        )}

        <div style={{ marginTop: 28, padding: 14, background: T.subtle, borderRadius: T.r, fontFamily: T.sans, fontSize: 11.5, color: T.muted, lineHeight: 1.55 }}>
          Your cycle data is stored on Luna's servers, encrypted at rest, and only accessible from your signed-in account. We do not sell or share it.
        </div>
      </div>
      </Screen>
    </div>
  )
}
