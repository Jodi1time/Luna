# Luna Security and Data Storage Architecture

## Current state

Luna uses Supabase Auth, Postgres, row-level security, and TLS. A signed-in
user's profile and daily logs are synchronized to Supabase. The app also keeps
a fast local cache in browser `localStorage` under `luna-store`; Supabase stores
the auth session under `luna-auth`.

The local cache currently contains cycle dates, logs, notes, pregnancy history,
helper histories, diary entries, and compressed diary photos. It is not
application-level encrypted. Supabase encrypts infrastructure and backups at
rest, but Luna and authorized Supabase operators can technically decrypt the
database. This is access-controlled cloud storage, not end-to-end encryption.

## Immediate hardening in this pass

- Anonymous analytics now defaults off and requires an explicit opt-in.
- Sentry performance tracing and session replay are disabled. URLs are stripped
  of query strings and fragments before error events are sent.
- AI request context and message lengths are bounded; upstream diagnostics are
  no longer reflected to clients.
- Partner invite acceptance and recipient revocation use narrow database
  functions. Recipients no longer have a broad update policy that could alter
  their own share scope.
- Pending share links expire after 30 days and cannot be accepted by their owner.
- BBT values and units are serialized into separate database columns instead of
  attempting to write a JavaScript object into a numeric column.
- RLS policies explicitly target authenticated users and validate ownership on
  both the existing and resulting row.

The SQL changes do not protect production until `supabase-schema.sql` has been
applied to the production Supabase project.

## Recommended target

### Native iOS and Android

1. Store structured health data in an encrypted SQLite database rather than
   WebView `localStorage`.
2. Generate a random 256-bit data-encryption key per account/device.
3. Protect that key with iOS Keychain/Secure Enclave and Android Keystore. Never
   use the account password directly as an encryption key.
4. Encrypt records with an authenticated cipher such as AES-256-GCM, using a
   unique nonce for every record version.
5. Keep Supabase refresh tokens in secure native storage, not WebView storage.
6. Offer an optional biometric app lock that gates retrieval of the local key.

Apple describes Keychain as an encrypted store for small secrets, and Android
Keystore protects key material from extraction. OWASP MASVS requires sensitive
local data to be protected regardless of where it is stored:

- https://developer.apple.com/documentation/security/keychain-services
- https://developer.android.com/privacy-and-security/keystore
- https://mas.owasp.org/MASVS/controls/MASVS-STORAGE-1/

### Cloud synchronization

Use client-side envelope encryption for the fields Luna does not need to query
on the server:

- Encrypt diary bodies, diary photos, log notes, sexual-health details,
  pregnancy history, helper histories, and reflection history before upload.
- Store ciphertext, nonce, algorithm version, and key version in Supabase.
- Keep only the minimum queryable cycle fields in ordinary typed columns.
- Split the large `profiles.settings` JSON into purpose-specific tables so each
  data class has its own retention, export, and deletion rules.
- Store photos as encrypted objects, not base64 strings inside a profile row.

Cross-device recovery is the hard part. A production design needs either a
user-held recovery key or a device-enrollment flow where an existing device
wraps the account key for a new device. Server-side password reset alone cannot
recover genuinely end-to-end encrypted data.

### Web and PWA fallback

Move the cache from `localStorage` to encrypted IndexedDB. Hold an unwrapped key
in memory only while the session is active. This reduces casual disk exposure,
but it does not defeat a successful same-origin XSS attack; a strict Content
Security Policy and dependency review remain required.

### Sharing and AI

- For end-to-end encrypted partner sharing, create a deliberately redacted
  snapshot and encrypt it to the recipient's public key. Do not grant the
  recipient access to the owner's raw encrypted store.
- Keep Ask Luna's default context derived and qualitative. Raw logs, dates,
  identifiers, diary text, and notes should not be added automatically.
- A user's typed chat message is sent to Anthropic to generate a response. It
  should be presented as an intentional transmission and covered by retention
  terms and a vendor data-processing agreement.

## Launch security checklist

- Apply and test every migration against a staging Supabase project.
- Add server-side per-user and per-IP rate limiting to AI and account endpoints.
- Enable Supabase leaked-password protection, signup/reset rate limits, and
  CAPTCHA where abuse warrants it.
- Test RLS with two owner accounts, one recipient, an expired invite, and direct
  malicious REST calls.
- Configure CSP, HSTS, `frame-ancestors`, referrer policy, and permissions policy
  at the production host.
- Pin and audit dependencies; run secret scanning and dependency scanning in CI.
- Verify account deletion across auth, database rows, storage objects, logs, and
  backup-retention documentation.
- Commission an independent mobile/API penetration test before launch.
- Have privacy counsel review CMIA, MHMDA, FTC Health Breach Notification Rule,
  GDPR/UK GDPR, and vendor agreements. This document is engineering guidance,
  not a legal conclusion.

