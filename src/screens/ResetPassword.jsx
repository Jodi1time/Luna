import { useState } from 'react'
import { T } from '../data/theme'
import { CTAButton, Icons, Screen, Masthead } from '../components/shared'
import Backdrop from '../components/Backdrop'
import { updateUserPassword, signOut } from '../lib/supabase'
import { validateAccountPassword } from '../lib/validation'
import useLuna from '../store/useLuna'

function Field({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: 700, fontFamily: T.sans, color: T.muted, textTransform: 'uppercase' }}>{label}</div>
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

export default function ResetPassword() {
  const { go } = useLuna()
  const clearLocalData = useLuna((s) => s.clearLocalData)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [busy, setBusy]         = useState(false)
  const [error, setError]       = useState('')
  const [done, setDone]         = useState(false)

  const submit = async () => {
    setError('')
    const pwErr = validateAccountPassword(password)
    if (pwErr) { setError(pwErr); return }
    if (password !== confirm) { setError("Both passwords need to match."); return }
    setBusy(true)
    try {
      await updateUserPassword(password)
      setDone(true)
      // Clean the recovery hash out of the URL so a refresh doesn't
      // re-land here. Keep history intact otherwise.
      try {
        const cleanUrl = window.location.origin + window.location.pathname + window.location.search
        window.history.replaceState(null, '', cleanUrl)
      } catch { /* noop — older browsers */ }
    } catch (e) {
      setError(e.message || "Couldn't update password. Try again or request a new link.")
    } finally {
      setBusy(false)
    }
  }

  const continueOn = async () => {
    // After a reset, sign the user out so they re-authenticate with
    // their NEW password. Avoids the half-state where the recovery
    // session is still active.
    try { await signOut() } catch { /* noop */ }
    clearLocalData()
    go('auth')
  }

  return (
    <div className="home-stage">
      <Backdrop accent={T.accent} subtle />
      <Screen>
        <div style={{ position: 'relative', zIndex: 1, padding: '12px 22px 0', color: T.text }}>
          <Masthead issue="Reset password" onBack={() => go('auth')} />

          {!done ? (
            <>
              <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 32, fontWeight: 500, letterSpacing: -0.7, lineHeight: 1.05, marginBottom: 10, animationDelay: '0ms' }}>
                Set a new<br /><em>password.</em>
              </div>
              <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 14, color: T.muted, lineHeight: 1.55, marginBottom: 24, fontStyle: 'italic', animationDelay: '60ms' }}>
                You're signed in from the reset link. Pick something you'll remember — at least 8 characters.
              </div>

              <div className="insight-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 14, animationDelay: '120ms' }}>
                <Field label="New password"    type="password" value={password} onChange={setPassword} placeholder="Min. 8 characters" />
                <Field label="Confirm password" type="password" value={confirm}  onChange={setConfirm}  placeholder="Match the above" />
              </div>

              {error && (
                <div style={{ fontFamily: T.sans, fontSize: 12, color: T.accent, marginTop: 12, padding: '10px 14px', background: T.accent + '12', border: `1px solid ${T.accent}40`, borderRadius: T.r }}>
                  {error}
                </div>
              )}

              <div className="insight-stagger" style={{ marginTop: 22, animationDelay: '180ms' }}>
                <CTAButton full onClick={submit} style={{ opacity: busy ? 0.5 : 1 }}>
                  {busy ? 'UPDATING…' : 'SAVE NEW PASSWORD'} {Icons.arrow}
                </CTAButton>
              </div>
            </>
          ) : (
            <>
              <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 32, fontWeight: 500, letterSpacing: -0.7, lineHeight: 1.05, marginBottom: 10, animationDelay: '0ms' }}>
                Done.<br /><em>It's set.</em>
              </div>
              <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 15, color: T.muted, lineHeight: 1.6, marginBottom: 24, fontStyle: 'italic', animationDelay: '60ms' }}>
                Your password has been updated. Sign in with your new one and Luna will pick up where you left off.
              </div>
              <div className="insight-stagger" style={{ animationDelay: '120ms' }}>
                <CTAButton full onClick={continueOn}>
                  SIGN IN AGAIN {Icons.arrow}
                </CTAButton>
              </div>
            </>
          )}

          <div style={{ marginTop: 28, padding: 14, background: T.subtle, borderRadius: T.r, fontFamily: T.sans, fontSize: 11.5, color: T.muted, lineHeight: 1.55 }}>
            Reset links expire after a short window. If yours stops working, head back to sign in and request a fresh one.
          </div>
        </div>
      </Screen>
    </div>
  )
}
