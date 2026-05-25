import { useState } from 'react'
import { T } from '../data/theme'
import { CTAButton, Icons } from '../components/shared'
import { enrollBiometric } from '../lib/biometric'

export default function BiometricPrompt({ passcode, userId, userName, onDone }) {
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  const enable = async () => {
    setBusy(true)
    setFailed(false)
    const ok = await enrollBiometric(passcode, { userId, userName })
    setBusy(false)
    if (ok) {
      onDone()
    } else {
      // Either user dismissed the system prompt or the device/browser
      // doesn't support the WebAuthn PRF extension. Either way, let the
      // user know it didn't take and continue with passcode unlock.
      setFailed(true)
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 28px', background: T.bg, color: T.text }}>
      <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 2, color: T.accent, fontWeight: 700, marginBottom: 14 }}>
        LUNA · FASTER UNLOCK
      </div>
      <div style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 12 }}>
        Use Face ID<br/><em>to unlock?</em>
      </div>
      <div style={{ fontFamily: T.serif, fontSize: 16, color: T.muted, marginBottom: 28, lineHeight: 1.55 }}>
        Your passcode still encrypts everything. Face ID just saves you from typing it every time. You can always fall back to your passcode.
      </div>

      <CTAButton full onClick={enable} style={{ opacity: busy ? 0.5 : 1 }}>
        {busy ? 'WORKING…' : (failed ? 'TRY AGAIN' : 'ENABLE FACE ID')} {Icons.arrow}
      </CTAButton>

      {failed && (
        <div style={{ marginTop: 14, padding: '10px 14px', background: T.accent + '12', border: `1px solid ${T.accent}40`, borderRadius: T.r, fontFamily: T.sans, fontSize: 12, color: T.text, lineHeight: 1.5 }}>
          Couldn't enable Face ID. Either you cancelled, or your browser doesn't fully support biometric unlock yet. Your passcode still works.
        </div>
      )}

      <button onClick={onDone}
        style={{ marginTop: 14, background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontFamily: T.sans, fontSize: 12, padding: 8, width: '100%' }}>
        {failed ? 'Continue with passcode' : "Not now — I'll just use my passcode"}
      </button>
    </div>
  )
}
