import { useState } from 'react'
import { T } from '../data/theme'
import { CTAButton, Icons, Screen, Masthead } from '../components/shared'
import { signIn, signUp, requestPasswordReset, supabaseEnabled } from '../lib/supabase'
import { validateEmail, validateAccountPassword } from '../lib/validation'
import useLuna from '../store/useLuna'

function Field({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 13, fontFamily: T.serif, fontStyle: 'italic', fontWeight: 500, color: T.muted, letterSpacing: -0.1, textTransform: 'lowercase' }}>{String(label).toLowerCase()}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoCapitalize="off"
        autoCorrect="off"
        style={{ background: 'rgba(253,250,245,0.55)', border: `1px solid rgba(26,19,16,0.08)`, borderRadius: 16, padding: '14px 16px', fontSize: 15, fontFamily: T.sans, color: T.text, outline: 'none', width: '100%', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
        onFocus={(e) => { e.target.style.borderColor = T.accent; e.target.style.boxShadow = `0 0 0 3px ${T.accent}18` }}
        onBlur={(e)  => { e.target.style.borderColor = 'rgba(26,19,16,0.08)'; e.target.style.boxShadow = 'none' }}
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
      // Translate raw Supabase / network errors into something a human
      // can act on without exposing the internals.
      const raw = (e?.message || '').toLowerCase()
      let friendly = e?.message || 'Something went wrong. Try again in a moment.'
      if (raw.includes('rate limit') || raw.includes('too many requests')) {
        friendly = 'Luna needs a quick breather. Give it a few minutes and try again.'
      } else if (raw.includes('invalid login') || raw.includes('invalid credentials')) {
        friendly = "That email and password don't match. Double-check, or use Forgot password? below."
      } else if (raw.includes('email not confirmed')) {
        friendly = "Your email isn't confirmed yet. Check your inbox (and spam) for the link from Luna."
      } else if (raw.includes('user already registered') || raw.includes('already registered')) {
        friendly = 'An account with this email already exists. Try signing in instead.'
      } else if (raw.includes('network') || raw.includes('failed to fetch')) {
        friendly = "Can't reach Luna right now. Check your connection and try again."
      } else if (raw.includes('password') && raw.includes('short')) {
        friendly = 'Pick a password with at least 8 characters.'
      }
      setError(friendly)
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
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {[['signin','Sign in'],['signup','Create account']].map(([k, l]) => (
              <button key={k} onClick={() => { setMode(k); setError(''); setInfo('') }}
                className="alive-card"
                style={{ background: mode === k ? T.text : 'rgba(253,250,245,0.55)', color: mode === k ? T.bg : T.text, border: `1px solid ${mode === k ? T.text : 'rgba(26,19,16,0.08)'}`, padding: '9px 16px', cursor: 'pointer', fontFamily: T.sans, fontSize: 11, fontWeight: 600, letterSpacing: 0.4, borderRadius: 999, backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', boxShadow: mode === k ? `0 10px 20px -10px ${T.ink}80` : 'none', transition: 'all .2s ease' }}>
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

        {error && <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: T.accent, marginTop: 14, lineHeight: 1.5 }}>{error}</div>}
        {info  && <div className="frost-card" style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13.5, color: T.text, background: `rgba(253,250,245,0.65)`, border: '1px solid rgba(26,19,16,0.06)', padding: '14px 16px', borderRadius: 18, marginTop: 14, lineHeight: 1.55 }}>{info}</div>}

        <div style={{ marginTop: 24 }}>
          <CTAButton full onClick={submit} style={{ opacity: busy ? 0.5 : 1, letterSpacing: 0.3, textTransform: 'none', fontSize: 13 }}>
            {busy ? 'working…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Email reset link'} {Icons.arrow}
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

        <div className="frost-card" style={{ marginTop: 28, padding: 18, background: 'rgba(253,250,245,0.55)', border: '1px solid rgba(26,19,16,0.06)', borderRadius: 20, fontFamily: T.serif, fontStyle: 'italic', fontSize: 12.5, color: T.muted, lineHeight: 1.65 }}>
          Your cycle data lives on Luna's servers, encrypted at rest, only readable from your signed-in account. We don't sell or share it.
        </div>
      </div>
      </Screen>
    </div>
  )
}
