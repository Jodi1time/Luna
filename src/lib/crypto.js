const ENC = new TextEncoder()
const DEC = new TextDecoder()
const META_KEY = 'luna-meta'
const STORE_KEY = 'luna-store-v2'
const LEGACY_KEY = 'luna-store'
const VERIFIER_PLAINTEXT = 'luna-ok-v1'

const b64encode = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)))
const b64decode = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0))

export const randomSalt = () => crypto.getRandomValues(new Uint8Array(16))

export async function deriveKey(passcode, salt) {
  const material = await crypto.subtle.importKey(
    'raw', ENC.encode(passcode), 'PBKDF2', false, ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptString(plaintext, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, ENC.encode(plaintext)
  )
  return { iv: b64encode(iv), ct: b64encode(ct) }
}

export async function decryptString(blob, key) {
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64decode(blob.iv) },
    key,
    b64decode(blob.ct)
  )
  return DEC.decode(pt)
}

// ── In-memory key holder ──────────────────────────────────────
let memoryKey = null
export const setMemoryKey = (k) => { memoryKey = k }
export const getMemoryKey = () => memoryKey
export const clearMemoryKey = () => { memoryKey = null }

// ── Vault meta (salt + verifier blob) ─────────────────────────
export function readMeta() {
  const raw = localStorage.getItem(META_KEY)
  return raw ? JSON.parse(raw) : null
}

export function hasVault() {
  return readMeta() !== null
}

export function hasLegacyData() {
  return localStorage.getItem(LEGACY_KEY) !== null
}

export async function createVault(passcode) {
  const salt = randomSalt()
  const key = await deriveKey(passcode, salt)
  const verifier = await encryptString(VERIFIER_PLAINTEXT, key)
  localStorage.setItem(META_KEY, JSON.stringify({
    v: 1,
    salt: b64encode(salt),
    verifier,
  }))
  setMemoryKey(key)
  return key
}

export async function unlock(passcode) {
  const meta = readMeta()
  if (!meta) throw new Error('No vault')
  const salt = b64decode(meta.salt)
  const key = await deriveKey(passcode, salt)
  try {
    const verified = await decryptString(meta.verifier, key)
    if (verified !== VERIFIER_PLAINTEXT) throw new Error('Wrong passcode')
  } catch {
    throw new Error('Wrong passcode')
  }
  setMemoryKey(key)
  return key
}

// Migrates plaintext `luna-store` → encrypted `luna-store-v2` using
// a newly created vault for the supplied passcode.
export async function migrateLegacy(passcode) {
  const legacy = localStorage.getItem(LEGACY_KEY)
  if (!legacy) throw new Error('No legacy data')
  const key = await createVault(passcode)
  const blob = await encryptString(legacy, key)
  localStorage.setItem(STORE_KEY, JSON.stringify(blob))
  localStorage.removeItem(LEGACY_KEY)
  return key
}

export function wipeVault() {
  localStorage.removeItem(META_KEY)
  localStorage.removeItem(STORE_KEY)
  localStorage.removeItem(LEGACY_KEY)
  localStorage.removeItem('luna-biometric')
  clearMemoryKey()
}

export function lock() {
  clearMemoryKey()
}

// ── Custom Zustand storage adapter ────────────────────────────
// Returns null when not unlocked (so rehydrate becomes a no-op).
export const secureStorage = {
  getItem: async (_name) => {
    const key = getMemoryKey()
    if (!key) return null
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return null
    try {
      const blob = JSON.parse(raw)
      return await decryptString(blob, key)
    } catch {
      return null
    }
  },
  setItem: async (_name, value) => {
    const key = getMemoryKey()
    if (!key) return
    const blob = await encryptString(value, key)
    localStorage.setItem(STORE_KEY, JSON.stringify(blob))
  },
  removeItem: () => localStorage.removeItem(STORE_KEY),
}
