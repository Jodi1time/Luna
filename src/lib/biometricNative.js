// Native biometric adapter — wraps a Capacitor biometric plugin so the
// app gets the iOS LocalAuthentication / Android BiometricPrompt
// experience (instant Face ID, no system passkey sheet) instead of
// WebAuthn's required permission sheet.
//
// USAGE:
//   import { Capacitor } from '@capacitor/core'
//   if (Capacitor.isNativePlatform()) { /* native path */ }
//   else                              { /* WebAuthn path */ }
//
// PLUGIN NOT INSTALLED YET. Install once Capacitor's iOS/Android
// platforms are added:
//
//   npm install @aparajita/capacitor-biometric-auth
//   npx cap sync
//
// Then uncomment the plugin import below and the implementation will
// "just work" — same enrollBiometric / unlockWithBiometric API surface
// as the WebAuthn-based version in src/lib/biometric.js.

import { Capacitor } from '@capacitor/core'
import { encryptString, decryptString } from './crypto'

const BIO_KEY = 'luna-biometric'
const ENC = new TextEncoder()

const b64encode = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)))
const b64decode = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0))

export function isNativeRuntime() {
  return Capacitor.isNativePlatform()
}

// Stub-ready: when the @aparajita plugin is installed, this dynamic
// import will succeed and we'll route through it. Until then the
// function returns false and the app falls back to the WebAuthn path.
async function loadBiometricPlugin() {
  try {
    // Will fail until the plugin is installed — caught and returns null
    const mod = await import(/* @vite-ignore */ '@aparajita/capacitor-biometric-auth')
    return mod.BiometricAuth
  } catch {
    return null
  }
}

export async function nativeBiometricSupported() {
  if (!isNativeRuntime()) return false
  const plugin = await loadBiometricPlugin()
  if (!plugin) return false
  try {
    const info = await plugin.checkBiometry()
    return Boolean(info?.isAvailable)
  } catch {
    return false
  }
}

// Derive a stable AES-GCM key from a fixed-but-non-secret app constant.
// The native biometric prompt itself is the gate — if it succeeds, we
// trust the call site to use this key to unwrap the passcode. The key
// material is NOT secret on its own; the security boundary is the OS
// biometric check.
async function getWrapKey() {
  const material = await crypto.subtle.importKey(
    'raw', ENC.encode('luna-native-biometric-v1'),
    { name: 'PBKDF2' }, false, ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: ENC.encode('luna-native-salt-v1'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function enrollBiometricNative(passcode) {
  const plugin = await loadBiometricPlugin()
  if (!plugin) return false
  try {
    // Prompt user for biometric to confirm the enrollment intent
    await plugin.authenticate({
      reason: 'Enable Face ID for Luna',
      cancelTitle: 'Cancel',
      allowDeviceCredential: false,
    })
    const key = await getWrapKey()
    const wrapped = await encryptString(passcode, key)
    localStorage.setItem(BIO_KEY, JSON.stringify({ v: 'native-1', wrapped }))
    return true
  } catch {
    return false
  }
}

export async function unlockWithBiometricNative() {
  const plugin = await loadBiometricPlugin()
  if (!plugin) return null
  const stored = JSON.parse(localStorage.getItem(BIO_KEY) || 'null')
  if (!stored || stored.v !== 'native-1') return null
  try {
    await plugin.authenticate({
      reason: 'Unlock Luna',
      cancelTitle: 'Use passcode',
      allowDeviceCredential: false,
    })
    const key = await getWrapKey()
    return await decryptString(stored.wrapped, key)
  } catch {
    return null
  }
}
