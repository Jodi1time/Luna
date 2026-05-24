import { useState } from 'react'
import { T } from '../data/theme'
import { CTAButton, Icons } from '../components/shared'
import { enrollBiometric } from '../lib/biometric'

export default function BiometricPrompt({ passcode, userId, userName, onDone }) {
  const [busy, setBusy] = useState(false)

  const enable = async () => {
    setBusy(true)
    await enrollBiometric(passcode, { userId, userName })
    setBusy(false)
    onDone()
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
        {busy ? 'WORKING…' : 'ENABLE FACE ID'} {Icons.arrow}
      </CTAButton>

      <button onClick={onDone}
        style={{ marginTop: 14, background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontFamily: T.sans, fontSize: 12, padding: 8, width: '100%' }}>
        Not now — I'll just use my passcode
      </button>
    </div>
  )
}
