import { encryptString, decryptString } from './crypto'
import {
  isNativeRuntime,
  nativeBiometricSupported,
  enrollBiometricNative,
  unlockWithBiometricNative,
} from './biometricNative'

const BIO_KEY = 'luna-biometric'
const PRF_INPUT_STR = 'luna-prf-v1'
const ENC = new TextEncoder()

const b64encode = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)))
const b64decode = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0))

function prfInput() {
  // 32 bytes derived deterministically from the constant
  // (PRF input length is up to the RP; 32 bytes is plenty)
  const bytes = new Uint8Array(32)
  const src = ENC.encode(PRF_INPUT_STR)
  for (let i = 0; i < bytes.length; i++) bytes[i] = src[i % src.length]
  return bytes
}

// On native (Capacitor) runtime, biometric availability is determined
// by the OS plugin and we treat it as async. The sync WebAuthn check
// stays for the web path.
//
// Note: this function returns true synchronously on native too — we
// optimistically assume biometric is set up and defer the actual
// capability check to enroll/unlock time. The plugin throws a useful
// error if biometric isn't enrolled at the OS level.
export function biometricSupported() {
  if (isNativeRuntime()) return true
  return typeof window !== 'undefined'
    && window.PublicKeyCredential
    && typeof navigator.credentials?.create === 'function'
    && typeof navigator.credentials?.get === 'function'
}

// Async version that actually probes the native plugin. Use when you
// need a definitive answer before showing biometric UI.
export async function biometricSupportedAsync() {
  if (isNativeRuntime()) return nativeBiometricSupported()
  return biometricSupported()
}

export function biometricEnrolled() {
  return localStorage.getItem(BIO_KEY) !== null
}

export function clearBiometric() {
  localStorage.removeItem(BIO_KEY)
}

async function importPrfKey(prfBytes) {
  // Import PRF output as raw HKDF key material, then derive an AES-GCM key.
  const ikm = await crypto.subtle.importKey(
    'raw', prfBytes, 'HKDF', false, ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: ENC.encode('luna-biometric-wrap'),
      info: ENC.encode('passcode-wrap'),
    },
    ikm,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

// Register a new biometric credential and wrap the passcode under it.
// Returns true on success, false if the user cancels or PRF unsupported.
export async function enrollBiometric(passcode, { userId, userName }) {
  // Native (Capacitor) → use the OS biometric prompt directly. No
  // WebAuthn permission sheet, no PRF concerns.
  if (isNativeRuntime()) return enrollBiometricNative(passcode)

  if (!biometricSupported()) return false

  const challenge = crypto.getRandomValues(new Uint8Array(32))
  const userIdBytes = ENC.encode(userId || 'luna-user')

  let credential
  try {
    credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'Luna', id: window.location.hostname },
        user: {
          id: userIdBytes,
          name: userName || 'Luna user',
          displayName: userName || 'Luna user',
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },   // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          userVerification: 'required',
          residentKey: 'preferred',
          // Allow platform (Face ID / Touch ID / Windows Hello) and cross-platform
        },
        timeout: 60000,
        extensions: {
          prf: { eval: { first: prfInput() } },
        },
      },
    })
  } catch (e) {
    // user cancelled or browser refused
    return false
  }

  if (!credential) return false

  const ext = credential.getClientExtensionResults?.()
  const prfResult = ext?.prf?.results?.first
  if (!prfResult) {
    // PRF extension not supported by this authenticator
    return false
  }

  const wrapKey = await importPrfKey(new Uint8Array(prfResult))
  const wrapped = await encryptString(passcode, wrapKey)

  localStorage.setItem(BIO_KEY, JSON.stringify({
    v: 1,
    credentialId: b64encode(credential.rawId),
    wrapped,
  }))
  return true
}

// Returns the unwrapped passcode if biometric assertion succeeds, otherwise null.
export async function unlockWithBiometric() {
  if (isNativeRuntime()) return unlockWithBiometricNative()
  if (!biometricSupported() || !biometricEnrolled()) return null
  const stored = JSON.parse(localStorage.getItem(BIO_KEY))
  // Native blobs stored with v: 'native-1' have no credentialId — bail
  // safely (would only happen if user switches runtimes mid-session).
  if (!stored.credentialId) return null
  const credentialId = b64decode(stored.credentialId)

  let assertion
  try {
    assertion = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [{ type: 'public-key', id: credentialId }],
        userVerification: 'required',
        timeout: 60000,
        extensions: {
          prf: { eval: { first: prfInput() } },
        },
      },
    })
  } catch (e) {
    return null
  }
  if (!assertion) return null

  const ext = assertion.getClientExtensionResults?.()
  const prfResult = ext?.prf?.results?.first
  if (!prfResult) return null

  try {
    const wrapKey = await importPrfKey(new Uint8Array(prfResult))
    return await decryptString(stored.wrapped, wrapKey)
  } catch {
    return null
  }
}
