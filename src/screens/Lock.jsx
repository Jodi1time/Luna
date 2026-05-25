import { useState, useEffect } from 'react'
import { T } from '../data/theme'
import { CTAButton, Icons } from '../components/shared'
import { unlock, migrateLegacy, wipeVault, hasLegacyData, hasVault } from '../lib/crypto'
import { biometricSupported, biometricEnrolled, unlockWithBiometric } from '../lib/biometric'
import useLuna from '../store/useLuna'

export default function Lock({ onUnlocked }) {
  const needsMigration = !hasVault() && hasLegacyData()
  const [passcode, setPasscode] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const canBio = biometricSupported() && biometricEnrolled() && !needsMigration
  const [biometricFailed, setBiometricFailed] = useState(false)
  // Gate the passcode input behind a short delay so iOS can never try
  // to auto-focus / surface its password autofill suggestion bar while
  // the splash is still on screen. Until this flips true, the input
  // is not in the DOM at all — iOS has nothing to focus.
  const [inputReady, setInputReady] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setInputReady(true), 1300)
    return () => clearTimeout(t)
  }, [])

  const tryBiometric = async () => {
    setError('')
    setLoading(true)
    const pc = await unlockWithBiometric()
    if (pc) {
      try {
        await unlock(pc)
        await useLuna.persist.rehydrate()
        onUnlocked()
        return
      } catch {
        // wrapped passcode is stale (user changed it elsewhere) — fall back to manual
      }
    }
    setBiometricFailed(true)
    setLoading(false)
  }

  useEffect(() => {
    if (canBio && !biometricFailed) {
      tryBiometric()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submit = async () => {
    setError('')
    if (passcode.length < 6) { setError('Passcode must be at least 6 characters'); return }
    if (needsMigration && passcode !== confirm) { setError('Passcodes do not match'); return }
    setLoading(true)
    try {
      if (needsMigration) {
        await migrateLegacy(passcode)
      } else {
        await unlock(passcode)
      }
      await useLuna.persist.rehydrate()
      onUnlocked()
    } catch (e) {
      setError(needsMigration ? 'Could not set passcode' : 'Incorrect passcode')
      setLoading(false)
    }
  }

  const handleReset = () => {
    if (window.confirm('This will permanently delete all your Luna data on this device. Continue?')) {
      wipeVault()
      window.location.reload()
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 28px', background: T.bg, color: T.text }}>
      <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 2, color: T.accent, fontWeight: 700, marginBottom: 14 }}>
        LUNA · {needsMigration ? 'PROTECT YOUR DATA' : 'LOCKED'}
      </div>
      <div style={{ fontFamily: T.serif, fontSize: 36, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05 }}>
        {needsMigration ? <>Set a passcode.</> : <>Welcome back.</>}
      </div>
      <div style={{ fontFamily: T.serif, fontSize: 16, color: T.muted, marginTop: 12, marginBottom: 28, lineHeight: 1.55 }}>
        {needsMigration
          ? "We've added encryption. Choose a passcode and we'll encrypt your existing data on this device. We never see it."
          : 'Your data is encrypted on this device. Enter your passcode to unlock.'}
      </div>

      {canBio && !biometricFailed && (
        <div style={{ marginBottom: 22 }}>
          <CTAButton full onClick={tryBiometric} style={{ opacity: loading ? 0.5 : 1 }}>
            {loading ? 'AUTHENTICATING…' : 'UNLOCK WITH FACE ID'} {Icons.arrow}
          </CTAButton>
          <button onClick={() => setBiometricFailed(true)}
            style={{ marginTop: 12, background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontFamily: T.sans, fontSize: 12, padding: 8, width: '100%' }}>
            Use passcode instead
          </button>
        </div>
      )}

      {(!canBio || biometricFailed) && inputReady && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 8 }}>
            <input
              type="password"
              value={passcode}
              onChange={(e) => { setPasscode(e.target.value); setError('') }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !needsMigration) submit() }}
              placeholder={needsMigration ? 'Choose a passcode (min 6)' : 'Passcode'}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              style={{
                background: T.card,
                border: `1px solid ${error ? T.accent : T.hair}`,
                borderRadius: T.r,
                padding: '15px 16px',
                fontSize: 16,
                fontFamily: T.sans,
                color: T.text,
                outline: 'none',
              }}
            />
            {needsMigration && (
              <input
                type="password"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setError('') }}
                onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
                placeholder="Confirm passcode"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                style={{
                  background: T.card,
                  border: `1px solid ${error ? T.accent : T.hair}`,
                  borderRadius: T.r,
                  padding: '15px 16px',
                  fontSize: 16,
                  fontFamily: T.sans,
                  color: T.text,
                  outline: 'none',
                }}
              />
            )}
          </div>

          {error && (
            <div style={{ fontFamily: T.sans, fontSize: 12, color: T.accent, marginBottom: 12, marginTop: 4 }}>{error}</div>
          )}

          <div style={{ marginTop: 16 }}>
            <CTAButton full onClick={submit} style={{ opacity: passcode.length >= 6 && !loading ? 1 : 0.5 }}>
              {loading ? 'WORKING…' : (needsMigration ? 'ENCRYPT MY DATA' : 'UNLOCK')} {Icons.arrow}
            </CTAButton>
          </div>

          <button onClick={handleReset}
            style={{ marginTop: 28, background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontFamily: T.sans, fontSize: 12, padding: 8, textAlign: 'center' }}>
            Forgot passcode? Reset all data.
          </button>
        </>
      )}

      <div style={{ marginTop: 'auto', paddingTop: 32, fontFamily: T.sans, fontSize: 11, color: T.muted, textAlign: 'center', lineHeight: 1.55 }}>
        Encrypted with AES-256-GCM. Key derived from your passcode via PBKDF2 (250k iterations).
      </div>
    </div>
  )
}
