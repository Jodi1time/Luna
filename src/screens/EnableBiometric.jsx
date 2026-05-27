import { useState, useRef } from 'react'
import { T } from '../data/theme'
import { CTAButton, Masthead, Eyebrow, Icons, Screen } from '../components/shared'
import { unlock } from '../lib/crypto'
import { enrollBiometric, biometricSupported } from '../lib/biometric'
import useLuna from '../store/useLuna'

// Enable Face ID / Touch ID after the fact — used when a user
// either skipped the post-onboarding prompt or had it fail silently.
// Asks for the current passcode (because biometric enrollment wraps
// the raw passcode under a PRF-derived key), verifies via unlock(),
// then calls enrollBiometric().

export default function EnableBiometric() {
  const { back, displayName, account } = useLuna()
  const [showInput, setShowInput] = useState(false)
  const [passcode, setPasscode]   = useState('')
  const [busy, setBusy]           = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)
  const inputRef = useRef(null)

  const reveal = () => {
    setShowInput(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const submit = async () => {
    setError('')
    if (passcode.length < 6) { setError('Passcode must be at least 6 characters.'); return }
    setBusy(true)
    try {
      // Verify the passcode by attempting to derive the vault key.
      await unlock(passcode)
      // Now enroll biometric with that verified passcode.
      const ok = await enrollBiometric(passcode, {
        userId: account?.email || 'luna-user',
        userName: displayName || 'Luna user',
      })
      if (!ok) {
        setError("Couldn't enable Face ID. You cancelled the prompt, or your browser doesn't fully support biometric unlock.")
      } else {
        setSuccess(true)
        setTimeout(back, 1200)
      }
    } catch (e) {
      setError('Incorrect passcode.')
    } finally {
      setBusy(false)
    }
  }

  if (!biometricSupported()) {
    return (
      <Screen>
        <div style={{ padding: '12px 22px 0', color: T.text }}>
          <Masthead issue="Face ID" onBack={back} />
          <Eyebrow>UNAVAILABLE</Eyebrow>
          <div style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 500, letterSpacing: -0.6, lineHeight: 1.1, marginBottom: 12 }}>
            Not supported here.
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 15, color: T.muted, lineHeight: 1.55 }}>
            Your browser doesn't support biometric unlock. On iPhone, add Luna to your home screen for this to work.
          </div>
        </div>
      </Screen>
    )
  }

  if (success) {
    return (
      <Screen>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 28px', color: T.text, textAlign: 'center' }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 2, color: T.accent, fontWeight: 700, marginBottom: 14 }}>
            ENABLED
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 500, letterSpacing: -0.6, lineHeight: 1.1 }}>
            Face ID is on.
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 15, color: T.muted, marginTop: 12, lineHeight: 1.55 }}>
            Next time you open Luna, just look at your phone.
          </div>
        </div>
      </Screen>
    )
  }

  return (
    <Screen>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="Enable Face ID" onBack={back} />
        <Eyebrow>DEVICE · UNLOCK</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 500, letterSpacing: -0.6, lineHeight: 1.1, marginBottom: 12 }}>
          Use Face ID to unlock<br/><em>next time?</em>
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 15, color: T.muted, lineHeight: 1.55, marginBottom: 28 }}>
          Enter your passcode to enable biometric unlock. Your passcode still encrypts everything — Face ID just unlocks it faster.
        </div>

        {!showInput && (
          <CTAButton full onClick={reveal}>
            ENTER PASSCODE {Icons.arrow}
          </CTAButton>
        )}

        {showInput && (
          <>
            <input
              ref={inputRef}
              type="password"
              value={passcode}
              onChange={(e) => { setPasscode(e.target.value); setError('') }}
              onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
              placeholder="Passcode"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              style={{
                width: '100%',
                background: T.card,
                border: `1px solid ${error ? T.accent : T.hair}`,
                borderRadius: T.r,
                padding: '15px 16px',
                fontSize: 16,
                fontFamily: T.sans,
                color: T.text,
                outline: 'none',
                marginBottom: 12,
              }}
            />

            {error && (
              <div style={{ fontFamily: T.sans, fontSize: 12, color: T.accent, marginBottom: 12, lineHeight: 1.5 }}>{error}</div>
            )}

            <CTAButton full onClick={submit} style={{ opacity: passcode.length >= 6 && !busy ? 1 : 0.5 }}>
              {busy ? 'ENABLING…' : 'ENABLE FACE ID'} {Icons.arrow}
            </CTAButton>
          </>
        )}
      </div>
    </Screen>
  )
}
