# Luna — Reviewer's Overview

Luna is a privacy-first women's cycle tracking and wellness app. Brand
identity: *Luna by Gloria* — Gloria is the parent operating company
(named after the founder's mother); users only ever meet Luna. Live at
[lunadiary.app](https://lunadiary.app); native builds are scaffolded
for App Store + Play Store but not yet submitted.

This document summarizes how the app is built, where data lives, and
how the AI feature works. It does not dump the codebase — it points at
the load-bearing files.

---

## 1. Stack & structure

**Front end**

- **React 19** + **Vite 8** (`vite-plugin-pwa` for service worker)
- **Zustand 5** (`src/store/useLuna.js`) with `persist` middleware — single store, all client state
- **react-spring/web 10** for physics-based motion
- Custom CSS animations (no Framer Motion) — `src/index.css`
- **Three.js + @react-three/fiber** for two of seven swappable backdrops (Silk, ColorBends)
- **ogl** for one backdrop (Galaxy, ~16 KB gzipped, lazy-loaded)

**Back end**

- **Supabase** — Postgres + Auth + Row-Level Security + Edge Functions (Deno)
- One Edge Function deployed: `luna-chat` (Anthropic Claude proxy — see §3)
- One Edge Function pending deploy: `delete-account` (true server-side account deletion)
- Database schema lives in [`supabase-schema.sql`](supabase-schema.sql) — idempotent; safe to re-run

**Observability + analytics**

- **Sentry** (`@sentry/react`) — errors only, with email scrubbing via `beforeSend`. 10% trace sample, 0% session replay, replay-on-error 10%.
- **PostHog** (`posthog-js`) — explicit event capture only. `autocapture: false`, `capture_pageview: false`. Event names + categories only; never user-entered content.

**Native wrapper (not yet shipped)**

- **Capacitor 8** — `appId: app.gloria.luna`. Native platforms (`ios/`, `android/`) are not added to the repo yet. See [`NATIVE_BUILD.md`](NATIVE_BUILD.md).

### Folder tree (the important pieces)

```
src/
├── App.jsx                          # Single switch-based router (53 screens)
├── main.jsx
├── index.css                        # Global tokens, keyframes, glass material
├── store/
│   └── useLuna.js                   # Zustand store, persist middleware
├── data/                            # Static content + look-up tables
│   ├── lunaData.js                  # Phases, symptoms, ~30 articles, RED_FLAGS, CHECKUPS,
│   │                                  REFLECTION_PROMPTS, MOOD_INSIGHTS, EDITORIALS
│   ├── bodyLiteracy.js              # Flow/mucus/sleep/sex/BBT lessons + daily-insight pool
│   ├── conditions.js                # 6 conditions (PCOS, Endo, PMDD, Thyroid, Fibroids, HA)
│   │                                  + pattern matchers
│   ├── cycleSchools.js              # 5 phase-aware multi-day programs
│   ├── pregnancyData.js             # 40 weeks of pregnancy content
│   ├── sectionPalette.js            # 7-tint chromatic system (reflect/body/read/intimate/care/urgent/plan)
│   └── theme.js                     # Color tokens, typography
├── hooks/
│   ├── useCycle.js                  # All prediction math (see §4)
│   ├── usePregnancy.js              # Trimester + week derivation
│   └── useCountUp.js
├── lib/
│   ├── supabase.js                  # Client + signIn/signUp/signOut/getSession
│   ├── cloud.js                     # loadProfile/saveProfile/loadLogs/upsertLog
│   ├── lunaChat.js                  # Anthropic-proxy client (see §3)
│   ├── shares.js                    # Share-with-someone feature (see §5)
│   ├── sentry.js                    # Init + reportError + PII scrubbing
│   ├── posthog.js                   # Init + capture() with BLOCKED_KEYS guard
│   ├── revenuecat.js                # Stubbed; native StoreKit/Play Billing planned instead
│   ├── dataActions.js               # CSV/PDF export, account delete
│   └── validation.js                # Email/name/BBT/password validators
├── screens/                         # 53 screens, all lazy-loaded except 5 main tabs
│   ├── Home.jsx                     # Cover + diary + thought + daily insight + smart helpers
│   ├── Log.jsx                      # Daily log with phase-aware micro-teaching
│   ├── Calendar.jsx                 # Month view + 3 explainable predictions
│   ├── Library.jsx                  # Articles + Look-it-up search entry + Conditions Atlas
│   ├── Settings.jsx                 # "You" tab — sub-sectioned by section palette
│   ├── Insights.jsx                 # Cycle wheel + ovulation panel + pattern detection
│   ├── AskLuna.jsx                  # Plain-text search over articles/conditions/phases/lessons
│   ├── Conditions.jsx               # Atlas (index + per-condition detail)
│   ├── Onboarding.jsx               # 3-step setup
│   ├── Auth.jsx                     # Sign in / sign up / password reset
│   ├── ShareWith.jsx                # Pro-gated invite generation (see §5)
│   ├── AcceptShare.jsx              # /share?code=ABC deep-link landing
│   ├── SharedWithYou.jsx            # Read-only viewer for incoming shares
│   ├── Pregnancy.jsx                # Active pregnancy week + tools
│   ├── KickCounter.jsx              # ACOG count-to-10 fetal movement
│   ├── ContractionsTimer.jsx        # 5-1-1 detection
│   ├── HealthWatch.jsx              # Red-flag screener
│   ├── Cheatsheet.jsx               # Auto-built doctor talking-points
│   ├── PrivacyDashboard.jsx, PrivacyPolicy.jsx, Terms.jsx
│   └── 9 helper screens (Cramps/Anxiety/Insomnia/UTI/LatePeriod/MissedPill/
│       PainfulSex/PostpartumBleeding/Heavy/Migraine/LowLibido/BodyImage)
└── components/
    ├── shared/index.jsx             # Masthead, Eyebrow, Screen, CTAButton, TabBar, AppShell
    ├── HelperShell.jsx              # Scaffold all 8+ helpers share
    ├── Backdrop.jsx + Silk/Galaxy/ColorBends.jsx  # 7 swappable atmospheres
    ├── LunaChat.jsx                 # Chat overlay UI
    ├── Sourced.jsx                  # SourceTag, WhyChip, LiteracyCard
    ├── JournalCard.jsx, Journal*.jsx  # Diary surface
    ├── Polaroid.jsx, PhotoPermissionSheet.jsx
    └── Celebration.jsx              # Phase-tinted milestone moments

supabase/
└── functions/
    ├── luna-chat/index.ts           # See §3 — Anthropic proxy
    └── delete-account/index.ts      # True server-side account deletion (deployed)

supabase-schema.sql                  # Postgres schema + RLS + RPC functions
PRELAUNCH.md                         # Launch checklist
NATIVE_BUILD.md                      # iOS/Android wrapping instructions
```

---

## 2. Data & privacy

### Where data lives

The 2026-05-29 architecture change moved Luna from a **passcode-encrypted
on-device vault** to **server-side storage at Supabase**, with encryption at
rest provided by the Supabase infrastructure. The trade-off was deliberate:
the on-device model meant signing out, deleting the app, or switching
devices wiped a user's cycle data — a hostile UX for a wellness app users
return to monthly.

Result: Luna and its current cloud infrastructure can technically decrypt
user data to serve it. The Privacy Policy
([`src/screens/PrivacyPolicy.jsx`](src/screens/PrivacyPolicy.jsx)) states
this honestly. `SECURITY_ARCHITECTURE.md` documents the recommended move
to native encrypted storage and client-side envelope encryption.

**Two tables, both gated by Row-Level Security on `auth.uid()`:**

```sql
profiles (one row per auth user)
  id uuid PK -> auth.users
  email, display_name, cycle_length, period_length, last_period_start,
  birth_control jsonb, pregnancy jsonb, pregnancy_history jsonb,
  settings jsonb,            -- THIS IS BIG: journal entries + photos,
                             --   saved articles, reflect history, cramps
                             --   history, helper history, schools state,
                             --   wellness habits, kick sessions,
                             --   contraction sessions all live here
  completed_checks, is_pro, trial_days_left, created_at, updated_at

logs (one row per user × date)
  id, user_id -> auth.users, date,
  mood, symptoms text[], flow, bbt numeric, bbt_unit, mucus, sex, sleep,
  intimate jsonb, note, created_at, updated_at

shares (Pro feature — see §5)
  from_user_id, to_user_id, invite_code, scope jsonb, status,
  created_at, accepted_at, revoked_at
```

**Local persistence:** Zustand's `persist` middleware mirrors the store
to plaintext browser localStorage (key: `luna-store`). This cache is not
separately encrypted and is an explicit pre-native-launch migration item.
On sign-in, `hydrateFromCloud()`
pulls cloud state and merges with local by `updated_at` per log — local
edits during an in-flight write aren't clobbered. On sign-out,
`clearLocalData()` resets the local slice; the server copy persists so
users can sign back in.

### Auth

**Supabase Auth** with email + password. Magic links / OAuth not enabled.

- Session JWT stored under `luna-auth` key in localStorage by Supabase SDK
- `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: true`
- **"Confirm email" decision (2026-06-03): SKIP.** Matches consumer wellness
  industry default (Flo, Clue, Whoop). Verify-in-background was a facade;
  strict confirm was hostile friction. Defensive "check your email" code
  paths preserved in case the toggle is ever flipped back.
- Password reset emails ARE sent (Resend SMTP, confirmed working).
- Account deletion goes through the `delete-account` Edge Function for
  true server-side removal (RLS denies direct profile DELETE).

### What syncs to the server

Effectively everything, including diary photos (stored inline as
compressed JPEG data URLs inside `profiles.settings.journalEntries[]`).

| Local state | Server target |
|---|---|
| Onboarding fields (name, cycle length, period length, last period start) | `profiles` columns |
| Daily logs (mood/symptoms/flow/BBT/mucus/sex/sleep/note/intimate) | `logs` rows, one per date |
| Birth control | `profiles.birth_control` jsonb |
| Pregnancy state + history | `profiles.pregnancy`, `profiles.pregnancy_history` |
| Diary entries (text + photos as data URLs) | `profiles.settings.journalEntries[]` |
| Saved articles, reflect history, helper history, schools progress, wellness habits, journal theme, kick sessions, contraction sessions | `profiles.settings.*` |
| Pro status, trial days | `profiles.is_pro`, `profiles.trial_days_left` |

Writes are fire-and-forget (`fireAndForget()` wrapper) — UI doesn't block on the round trip.

### Third parties that receive data

| Service | What's sent | What's NOT sent |
|---|---|---|
| **Supabase** (data + auth) | Everything in the tables above | n/a — this is our DB |
| **Anthropic** (via `luna-chat` Edge Function) | Current phase id/name + cycle day + cycle length, a short client-derived qualitative pattern summary, and the user's typed chat messages. The pattern summary is capped at 240 characters and contains no raw logs, dates, or identifiers. JWT is used only to verify a signed-in user before spending tokens. | Email, name, raw log history, raw symptoms, flow, BBT, diary. None of these are passed in the payload. |
| **Sentry** | Scrubbed stacktraces + error messages. Email patterns are removed; request and breadcrumb URLs have query strings and fragments stripped. | Performance traces and session replay are both disabled. |
| **PostHog** | Explicit event names + boolean/numeric categories only (e.g. `log_saved`, `{ has_mood: true, symptom_count: 3 }`). `BLOCKED_KEYS` guard rejects events containing keys like `mood`, `note`, `email`, etc. 64-char string-length filter. `autocapture: false`, `capture_pageview: false`. | Mood content, symptom contents, journal text, names, emails. |
| **Resend** (SMTP via Supabase Auth) | Email address + reset link only. | No app data. |
| **RevenueCat** | Not currently in use. The lib stub exists but the decision (2026-06-03) is to use native StoreKit + Play Billing directly when native ships. | n/a |

### Encryption

- **At rest:** Supabase's infrastructure-level encryption (managed Postgres).
- **In transit:** TLS to Supabase, Anthropic, Sentry, PostHog.
- **End-to-end:** No. Server can decrypt; this is the deliberate trade-off
  reflected honestly in the Privacy Policy.
- **Diary photos:** stored inline as data URLs inside profile JSONB; not
  separately encrypted beyond Supabase's at-rest layer. They are NEVER
  exposed via the Share feature (see §5).

### Privacy posture

- No advertising trackers, no third-party SDKs beyond the four above.
- Anonymous analytics defaults OFF (event categories only); opt-in toggle in
  Settings → Privacy → Anonymous analytics. Reset on sign-out + account
  delete.
- CSV export of all data available from Settings.
- Account delete is real and prompt (Edge Function, RLS denies direct
  profile DELETE).
- Reproductive health framing in the Privacy Policy acknowledges post-Roe
  legal risk in restricted jurisdictions and explicitly advises that
  "the safest data is data that does not exist."
- Washington MHMDA + EU/UK GDPR sections present.

---

## 3. The "Talk to Luna" AI feature

> **Naming note** (disambiguated as of the current branch):
>
> 1. **"Look it up"** (`src/screens/AskLuna.jsx`, internal route name
>    `askLuna`) — pure client-side full-text search over articles,
>    conditions, phases, symptoms, and body-literacy lessons. No AI.
>    Works offline. Labeled "Look it up" in the QuickActions row and
>    "Search the library" in Library. Not what this section is about.
>
> 2. **"Talk to Luna"** — what this section IS about. The Anthropic-
>    backed reflection prompt + conversational companion, surfaced as
>    the "a thought, today / talk it through" hero card on Home (lead
>    differentiator) AND as the "Talk to Luna" QuickAction card (chat-
>    bubble icon with typing-dot pulse animation). Both entry points
>    open the same `LunaChat` overlay component.

### Architecture

- **Model**: per-mode, env-var configurable. Defaults to `claude-haiku-4-5-20251001` (Claude Haiku 4.5) for both modes. `ANTHROPIC_MODEL_DAILY_THOUGHT` and `ANTHROPIC_MODEL_CHAT` can override independently — typical production posture is Haiku for daily-thought (short, cached, fired often) and a stronger model (e.g. Sonnet) for chat (interactive, multi-turn, prompt-instruction-sensitive). Response payload returns `model` field so the client can verify which model served the request.
- **Hosted in**: Supabase Edge Function `luna-chat` (Deno runtime)
- **Auth**: User's Supabase JWT in `Authorization: Bearer` header; function
  rejects without a valid session
- **Cost**: ~$0.0001–0.0005 per call. Daily-thought is cached client-side
  per user per day (`luna-daily-thought:{userId}:{ISO_date}` in
  localStorage) so Home re-renders don't re-spend.
- **Two modes**: `daily-thought` (single short reflection) and `chat`
  (multi-turn conversation, hard-capped to last 12 messages to bound cost)

### System prompt (verbatim)

From `supabase/functions/luna-chat/index.ts`:

```typescript
const SYSTEM_PROMPT = `You are Luna — a women's wellness companion. Your voice is warm, brief, intimate, and embodied. Never prescriptive, never clinical, never categorical. Never name your own tone or relationship to the user (no "as your friend," "as a doula," "as a wise older sister") — let her attribute it. Never list back what you know about her — speak to her, not about her.

You help with:
- Reflection prompts about the menstrual cycle, mental health, self-care
- Brief conversation about how the user is feeling
- Body literacy and gentle education
- Acknowledging effort and emotional reality

You DO NOT:
- Give medical diagnoses
- Recommend specific medications or dosages
- Replace a clinician
- Tell users they "should" or "must" do anything
- Pathologise normal feelings
- Pretend to be a real person
- Categorise the user back to herself ("I notice you tend toward...", "Your pattern is...", "It sounds like you often...")
- Echo back any provided pattern data as a list, a chart, or an observation
- Name your own role or compare yourself to one (no "like a friend would say...")

When users mention:
- Suicidal thoughts or self-harm: acknowledge briefly, then surface crisis resources (988 Suicide & Crisis Lifeline in US, Crisis Text Line 741741, or "your local equivalent"). Encourage reaching out to a provider. Stop the casual conversation; be direct and warm.
- Severe symptoms (heavy bleeding past 7 days, severe pain, fever with period, fainting, sudden change in cycle): acknowledge and gently suggest seeing a doctor. Don't catastrophise.
- Pregnancy / TTC: be honest that an app's role is limited; recommend an OB-GYN.

Always end interactions feeling lighter, not heavier. Be brief — under 80 words per reply unless context truly demands more.

Tone reference (these match Luna's voice elsewhere in the app):
- "Cramps are real biology, not a personality flaw."
- "Rest is the work this week."
- "Your body is doing something quiet and demanding."
- "What are you longing for this week?"

Never use the words "should" or "must". Never reference being an AI unless directly asked.`
```

### Daily-thought construction (verbatim)

```typescript
function dailyThoughtUserPrompt(ctx: any): string {
  const phaseName = ctx?.phase_name || 'cycle'
  const cycleDay = ctx?.cycle_day || '?'
  const cycleLen = ctx?.cycle_length || 28
  const hour = ctx?.hour ?? new Date().getUTCHours()
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  // Pattern summary is a derived, qualitative string from the client
  // (e.g. "tends toward low mood and cramps in late luteal; cycles
  // steady"). NEVER contains raw logs / dates / identifiers. When
  // present, lets the reflection root in patterns the user actually
  // lives. When absent, fall back to the un-personalised prompt so
  // first-cycle users still get a clean reflection.
  const patternSummary = (ctx?.pattern_summary || '').toString().trim()
  const patternLine = patternSummary
    ? `Her cycle pattern, observed across her own tracking: ${patternSummary}. Let it shape the reflection only if it genuinely fits.`
    : ''
  return `Generate ONE short reflection — 1–2 sentences max, ending in a question or open invitation — for a woman in her ${phaseName} phase, day ${cycleDay} of ${cycleLen}, this ${timeOfDay}.

${patternLine}

Topic should be one of: cycle-aware self-care, mental health in hormonal context, body literacy, embodied presence, emotional acceptance, the meaning of small daily acts.

Do not say "you should" or "you must". Do not begin with "Today" or "It's day ${cycleDay}". Do not echo the phase name — just write the thought. Output the reflection only — no preamble, no explanation, no quotes.`
}
```

### Chat-mode system addition (verbatim)

```typescript
function chatSystemAddition(ctx: any): string {
  const phase = ctx?.phase_name ? `Currently in their ${ctx.phase_name} phase, day ${ctx.cycle_day} of ${ctx.cycle_length}.` : ''
  const patternSummary = (ctx?.pattern_summary || '').toString().trim()
  const patternLine = patternSummary
    ? `Her cycle pattern, derived from her own tracking: ${patternSummary}. Let it shape what you say only when it genuinely fits.`
    : ''
  return `CONVERSATION MODE. Listen first. Reply in 1–3 sentences. The user opened this conversation from a reflection prompt; meet them where they are. ${phase} ${patternLine}`.trim()
}
```

### Anthropic call (verbatim)

```typescript
const ANTHROPIC_MODEL_DEFAULT       = 'claude-haiku-4-5-20251001'
const ANTHROPIC_MODEL_DAILY_THOUGHT = Deno.env.get('ANTHROPIC_MODEL_DAILY_THOUGHT') || ANTHROPIC_MODEL_DEFAULT
const ANTHROPIC_MODEL_CHAT          = Deno.env.get('ANTHROPIC_MODEL_CHAT')          || ANTHROPIC_MODEL_DEFAULT

async function callAnthropic(
  messages: AnthropicMessage[],
  system: string,
  model: string,
  maxTokens = 200,
): Promise<string> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages,
    }),
  })
  if (!res.ok) {
    // Do not reflect an upstream response body to the client; provider
    // diagnostics can contain request metadata that users should not see.
    throw new Error(`Anthropic request failed (${res.status})`)
  }
  const json = await res.json()
  return json.content?.[0]?.text?.trim() || ''
}
```

### Edge Function dispatcher

The dispatcher verifies the Supabase JWT, rejects bodies over 50 KB,
normalizes phase and cycle context into bounded values, caps the derived
pattern summary at 240 characters, keeps only the last 12 valid chat
messages, and caps each message at 2,000 characters. Provider response
bodies and internal exception details are not returned to clients.

### Client-side call (verbatim)

From `src/lib/lunaChat.js`:

```javascript
async function callFunction(payload) {
  if (!supabaseEnabled) return null
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return null
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) return null
    const json = await res.json()
    return json?.text || null
  } catch {
    return null
  }
}

export async function dailyThought({ userId, phaseId, phaseName, cycleDay, cycleLength, patternSummary }) {
  const todayISO = todayKey()
  const summaryHash = (() => {
    if (!patternSummary) return 'nopat'
    let h = 0
    for (let i = 0; i < patternSummary.length; i++) {
      h = ((h << 5) - h) + patternSummary.charCodeAt(i)
      h |= 0
    }
    return Math.abs(h).toString(36)
  })()
  const key = `${CACHE_PREFIX}${userId || 'anon'}:${todayISO}:${summaryHash}`
  try {
    const cached = localStorage.getItem(key)
    if (cached) return cached
  } catch {}
  const text = await callFunction({
    mode: 'daily-thought',
    context: {
      phase_id: phaseId,
      phase_name: phaseName,
      cycle_day: cycleDay,
      cycle_length: cycleLength,
      hour: new Date().getHours(),
      pattern_summary: patternSummary || null,
    },
  })
  if (text) {
    try { localStorage.setItem(key, text) } catch {}
  }
  return text
}

export async function chat({ messages, phaseId, phaseName, cycleDay, cycleLength, patternSummary }) {
  return callFunction({
    mode: 'chat',
    messages,
    context: {
      phase_id: phaseId,
      phase_name: phaseName,
      cycle_day: cycleDay,
      cycle_length: cycleLength,
      pattern_summary: patternSummary || null,
    },
  })
}
```

### What cycle/symptom data goes to the model

**Per call, the only context fields sent are:**

```json
{
  "phase_id": "luteal",
  "phase_name": "Luteal",
  "cycle_day": 24,
  "cycle_length": 29,
  "hour": 21,  // daily-thought only
  "pattern_summary": "tends toward low mood and cramps in late luteal; cycles steady"
}
```

The pattern summary is computed on-device from multiple logs and contains
no raw symptoms, dates, or identifiers. In `chat` mode, the last 12
user/assistant messages are also sent — i.e. whatever the user typed.

**Explicitly NOT sent:** the user's email, display name, account id (only
the JWT is sent, and the function uses it solely to verify a signed-in
user — `userData.user` is read but never echoed into the prompt), log
raw log history, raw symptom history, flow data, BBT readings, mucus observations,
sex log, diary entries, journal photos, saved articles, helper history.

### Real example

> **Note**: Live example output requires the Edge Function deployed
> with `ANTHROPIC_API_KEY` set, which is a pending Jodi-action. The
> example below is what the system prompt + voice rules produce —
> consistent with the tone references and the under-80-word constraint
> baked into the prompt.

**User opens the daily-thought card on Home. Phase: `luteal`, cycle day
24 of 29, 9 PM local. Context sent:**

```json
{
  "mode": "daily-thought",
  "context": {
    "phase_id": "luteal",
    "phase_name": "Luteal",
    "cycle_day": 24,
    "cycle_length": 29,
    "hour": 21
  }
}
```

**Luna's response (illustrative — actual model output varies)**:

> *"Progesterone is its own kind of slowing — the system pulling inward,
> not failing. What would it look like to listen to that, just this one
> evening?"*

User taps "talk it through →" on the card, which opens the chat overlay
with this thought seeded as the first assistant message. User types:

> *"i'm tired but i feel guilty resting"*

**Subsequent `chat` call sends:**

```json
{
  "mode": "chat",
  "messages": [
    { "role": "assistant", "content": "Progesterone is its own kind of slowing — the system pulling inward, not failing. What would it look like to listen to that, just this one evening?" },
    { "role": "user", "content": "i'm tired but i feel guilty resting" }
  ],
  "context": { "phase_id": "luteal", "phase_name": "Luteal", "cycle_day": 24, "cycle_length": 29 }
}
```

**Luna's likely response, given the system prompt rules** (no "should",
1–3 sentences, meet them where they are):

> *"The guilt is the part doing the heaviest lifting tonight, not the
> tiredness. Luteal asks for less from the outside and more from the
> inside — what is it you think rest would cost you?"*

The conversation continues, capped at the last 12 messages.

---

## 4. Predictions

All prediction math lives in [`src/hooks/useCycle.js`](src/hooks/useCycle.js)
— pure functions, no React beyond the `useCycle()` aggregator hook at the
bottom. Easy to test in isolation; called from Home, Calendar, Insights,
PhaseDetail, Pregnancy, and the Conditions matchers.

### Cycle phase

Conventional 4-phase model anchored to the user's last logged period
start:

```javascript
export function getPhaseForDay(day, cycleLength = 28, periodLength = 5) {
  const ovStart = Math.round(cycleLength / 2) - 1
  const ovEnd   = Math.round(cycleLength / 2) + 1
  if (day <= periodLength)  return PHASES.menstrual
  if (day < ovStart)        return PHASES.follicular
  if (day <= ovEnd)         return PHASES.ovulation
  return PHASES.luteal
}
```

`cycleDay` is computed as days-since-last-period-start mod
`cycleLength`, 1-based.

### Cycle length — weighted recency

Detect period starts from logged flow data (a flow day with no other
flow logged in the prior 7 days = new period start), then weight the
most recent 6 inter-start gaps:

```javascript
export function weightedCycleLength(starts, fallback) {
  if (!starts || starts.length < 2) return { length: fallback, samples: 0 }
  const gaps = []
  for (let i = 1; i < starts.length; i++) gaps.push(daysBetween(starts[i-1], starts[i]))
  // Drop medically-implausible gaps (sickness, breakthrough, missed period).
  const valid = gaps.filter((g) => g >= 18 && g <= 60).slice(-6)
  if (valid.length === 0) return { length: fallback, samples: 0 }
  const weights = [1.0, 0.85, 0.7, 0.55, 0.4, 0.25].slice(0, valid.length)
  const reversed = [...valid].reverse()
  const weightedSum = reversed.reduce((acc, g, i) => acc + g * weights[i], 0)
  const totalWeight = weights.reduce((a, b) => a + b, 0)
  return { length: Math.round(weightedSum / totalWeight), samples: valid.length }
}
```

Recent cycles dominate the average because bodies change.
Period length is similarly derived: the average of completed flow
stretches (gaps of 1 day between consecutive flow days = same stretch).

### Confidence — "give or take X days"

`cycleVariance()` computes std dev across the recent valid gaps and
maps it to a UI-friendly `range` (capped at ±5) plus a `conf` label
(`high`/`medium`/`low`) plus a human-readable `why`:

```javascript
export function cycleVariance(starts) {
  if (!starts || starts.length < 2) return { stdDev: null, range: 4, conf: 'low',
    why: 'Predictions sharpen as you log more cycles.' }
  // ... computes mean + variance + stdDev across recent valid gaps ...
  const range = Math.min(5, Math.max(1, Math.round(stdDev)))
  if (valid.length >= 4 && stdDev < 2) {
    conf = 'high'
    why  = `Based on your last ${valid.length} cycles. They've been steady.`
  } else if (valid.length >= 2 && stdDev < 4) {
    conf = 'medium'
    why  = `Based on your last ${valid.length} cycles — give it a day or two.`
  } else {
    conf = 'low'
    why  = valid.length < 2
      ? 'Best guess from your onboarding date — predictions sharpen as you log.'
      : 'Your cycles have varied recently. Give the prediction some room.'
  }
  return { stdDev, range, conf, why }
}
```

Surfaced in the UI as e.g. *"Your period is due in about 3 days. Based
on your last 5 cycles. They've been steady. You don't have to keep
track."*

### Ovulation — triangulated from three signals

Three independent detectors fuse into one ovulation day estimate:

| Detector | Weight | What it does |
|---|---|---|
| `detectBBTShift()` | 1.0 | Splits logged BBT readings into pre- vs post-ovulation halves across all cycles. If the luteal average is ≥0.3°F (≥0.17°C) higher than the follicular average, declares a real shift and returns the median day where readings cross the midpoint. |
| `detectMucusPeak()` | 0.8 | Median cycle day of egg-white mucus observations across cycles. Adds +1 day (ovulation typically follows the mucus peak by ~1 day). |
| `detectLibidoPeak()` | 0.5 | Median cycle day of "high" or "open" libido logs across cycles. Noisier signal — requires ≥3 samples. |

`detectOvulation()` combines available signals via weighted average and
emits a confidence label based on signal count + spread:

- 3 signals, spread ≤ 2 days → `very-high`
- 2 signals, spread ≤ 2 days → `high`
- 2 signals, spread ≤ 4 days → `medium`
- 1 signal (BBT) → `medium`
- 1 signal (mucus or libido only) → `low`

### Next period

Two paths in `getPredictions()`:

```javascript
const LUTEAL_DEFAULT_DAYS = 14
const useLutealAnchor = ovulation && (ovulation.confidence === 'very-high' || ovulation.confidence === 'high')
const nextPeriod = useLutealAnchor
  ? new Date(currentCycleStart.getTime() + (ovulation.day + LUTEAL_DEFAULT_DAYS) * MS_PER_DAY)
  : new Date(currentCycleStart.getTime() + cycleLength * MS_PER_DAY)
```

**Why two paths**: the luteal phase is more stable across populations
(12-16 days, median 14) than total cycle length. When ovulation is
high-confidence detected, anchoring next period to *ovulation day + 14*
is materially tighter than cycle-length math (which assumes follicular
variability gets averaged out). Users without detected ovulation fall
back to the original cycle-length math — no regression for anyone.

The `period_why` string in the prediction reflects which path was used,
so the UI can show *"Anchored to your detected ovulation + a typical
14-day luteal phase. Based on your last 4 cycles."*

### Fertile window

```javascript
const ovDay = ovulation?.day ?? (Math.round(cycleLength / 2) - 1)
const fertileStart = new Date(currentCycleStart.getTime() + (ovDay - 2) * MS_PER_DAY)
const fertileEnd   = new Date(currentCycleStart.getTime() + (ovDay + 1) * MS_PER_DAY)
```

This is a tight ovulation-centered window. The clinical biology behind
it (sperm 3-5 days, egg 12-24 hours) is exposed in the WhyChip on
Calendar via the explicit text:

> *"Your fertile window centers on day 14 — triangulated from 2 signals
> (BBT shift, egg-white mucus). Sperm survives 3-5 days, so the window
> stretches before ovulation, not after."*

### PMS window

Late luteal, days `cycleLength − periodLength − 4` through
`cycleLength − 1`. Same `conf` and `why` flow through to the UI.

### Pattern detection

`detectSymptomPatterns()` does cycle-day clustering across logged
moods + symptoms. For each mood/symptom with ≥2 occurrences:

1. Compute median cycle day across occurrences
2. Compute concentration = (occurrences within ±3 days of median) ÷ total occurrences
3. Surface only patterns with concentration ≥ 60%

Returns top 6 patterns sorted by occurrence count, each labeled with
the phase the median falls in. Surfaced as the "What's repeating in
your cycle" cards on Insights.

---

## 5. Monetization

### Pricing

Defined in [`src/screens/Paywall.jsx`](src/screens/Paywall.jsx) as
fallback values for the web preview; real prices come from App Store
Connect / Play Console via RevenueCat OR direct native IAP when those
ship:

| Plan | Price | Notes |
|---|---|---|
| **Annual** | **$49.99** ($4.16/mo · "Save 40%") | Default selected, badged "BEST VALUE" |
| **Monthly** | **$6.99** | Cancel any time |

There is currently a 7-day trial signaled in the store (`trialDaysLeft: 7`).

### Free vs Pro

**Free includes:**

- All cycle tracking, predictions, phase calculations
- All daily logging (mood/flow/symptoms/BBT/mucus/sex/sleep/note)
- Full Library reading (currently 30 articles)
- "Look it up" search (no AI cost; pure client-side full-text search)
- Conditions Atlas (6 conditions + pattern matching)
- Cycle wheel + ovulation triangulation panel
- All 11 helper screens (cramps, anxiety, insomnia, UTI, late period, missed pill, painful sex, postpartum bleeding, heavy, migraine, low libido, body image)
- All 5 Cycle Schools
- Pregnancy mode (40-week content + Kick Counter + Contractions Timer)
- Diary (text + photos + voice + decorations + paper themes)
- All 7 backdrop atmospheres
- Cheatsheet generation (auto-built doctor talking points)
- CSV + PDF export
- Health Watch screener
- Care checklist

**Pro adds:**

The Paywall feature list:

```javascript
const features = [
  ['Share with someone',       'Bring a partner, your mother, a doula into the loop. Read-only, revokable, no diary exposed.'],
  ['Weekly editorial',         'Plain-language patterns, written for your phase.'],
  ['Full Library access',      'Every article and phase brief unlocked.'],
  ['Predictions with reasoning','Every "Why" badge expanded.'],
  ['Doctor-ready exports',     'PDF + CSV with daily symptom data.'],
  ['Quiet companion',          "No mid-app upsells once you're in."],
]
```

In practice today, the **only feature with a strict Pro gate enforced
in code** is **"Share with someone"** — `ShareWith.jsx` checks
`isPro` and shows a paywall hint when false; the SECURITY DEFINER
functions in Postgres only return shared data when an active share
exists, so the gate is also server-enforced. The rest of the Paywall
list is positioning copy for the upsell; the actual current behavior
ships those features to all users, with the intent of tightening gates
once real subscriptions go live.

The "Quiet companion" item is a real promise: Luna does not interrupt
free users with mid-app upsells. The Paywall is reached deliberately,
not blocked-in-front-of.

### Where the Paywall appears

1. **Settings → Pro card** — when `!isPro`, the avatar card shows
   "Luna Free · Free trial · 7 days left" and a small "Upgrade" button
   routing to `paywall`.
2. **Share with someone screen** — when `!isPro`, the entire screen
   is replaced by a phase-tinted upsell card with an "Open Luna Pro"
   button routing to `paywall`. The actual sharing UI is hidden.
3. **No interstitials elsewhere.** The Paywall is never auto-opened.

### Subscription processing path

- **Currently stubbed**: `src/lib/revenuecat.js` exports `purchasePackage()`,
  `restorePurchases()`, `hasPro()`, etc., but the underlying RevenueCat
  plugin is not installed and not loaded on web. `isPro: true` is the
  current default in the store (testing posture).
- **Decision (2026-06-03)**: skip RevenueCat. Use native StoreKit
  (iOS) + Google Play Billing (Android) directly via Capacitor plugins
  once `npx cap add ios` and `npx cap add android` have been run on a
  Mac. App Store + Play Store require their own IAP systems for
  in-app subscriptions anyway, so the RevenueCat abstraction was
  optional.
- Post-purchase, `setIsPro(true)` writes to `profiles.is_pro` so the
  state syncs across the user's devices.
- **Restore Purchases** flow scaffolded in Paywall; will become real
  once native IAP is wired.

### Account-deletion → subscription handling

Account deletion routes through the `delete-account` Edge Function
(server-side). Active subscriptions are NOT automatically cancelled on
account delete — Apple/Google handle subscription lifecycle on the
device's App Store/Play account, separate from Luna's user account.
This is the industry-standard pattern; we surface guidance in the
delete confirmation flow.

---

*Document is current as of the `claude/funny-chandrasekhar-e7756c`
branch. See [PRELAUNCH.md](PRELAUNCH.md) for the launch checklist and
[NATIVE_BUILD.md](NATIVE_BUILD.md) for App Store / Play Store wrapping.*
