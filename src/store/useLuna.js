import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { getPhaseForDay } from '../hooks/useCycle'
import {
  loadProfile, saveProfile,
  loadLogs, upsertLog, deleteLog,
  loadJournalEntries, upsertJournalEntry, deleteJournalEntryCloud,
  fireAndForget,
} from '../lib/cloud'

// Date helpers
const toISO = (d) => d instanceof Date ? d.toISOString().slice(0, 10) : d
const today = () => new Date().toISOString().slice(0, 10)

// ── History-API sync ──────────────────────────────────────────
// Every forward navigation pushes one browser-history entry, so the
// Android hardware back button and iOS edge-swipe walk Luna's own
// stack instead of exiting the app. `histDepth` counts entries WE
// pushed this session — back() only delegates to history.back()
// when there's a Luna-owned entry to consume (otherwise it pops the
// store directly and never risks navigating out of the app).
const NAV_STACK_CAP = 60
let histDepth = 0
const pushNav = (s, screen, extra = {}) => {
  const stack = [...s.stack, screen].slice(-NAV_STACK_CAP)
  try {
    window.history.pushState({ luna: true }, '')
    histDepth++
  } catch { /* non-browser env */ }
  return { screen, stack, ...extra }
}
const lmpToDueDate = (lmp) => {
  if (!lmp) return null
  const d = new Date(lmp + 'T00:00:00')
  d.setDate(d.getDate() + 280) // Naegele's rule: LMP + 280 days
  return d.toISOString().slice(0, 10)
}

// Default settings shape — mirrored in the profiles.settings column
// default in supabase-schema.sql.
const DEFAULT_SETTINGS = {
  showEditorial: true,
  showLibrary:   true,
  showWatch:     true,
  // The hand-drawn sticky note in the top-right corner of Home.
  // On by default — it's Luna's editorial gimmick. Users who don't
  // want it can flip this off in Settings.
  stickyNoteEnabled: true,
  notifyPeriod:  true,
  notifyLog:     true,
  notifyWeekly:  true,
  analytics:     true,
  sounds:        false,             // soft chimes on save / milestones — opt-in
  // 4-card welcome tour. Set true once the user dismisses it; never
  // re-shows after that.
  tutorialSeen: false,
  // True after the user has seen the "Luna needs your camera roll"
  // explainer at least once. Browsers handle the actual permission
  // grant via the native file picker; this flag just prevents the
  // explainer from showing twice.
  askedPhotoAccess: false,
  // Wellness tracking — small habits Luna nudges about.
  // Stored as ISO date strings ('YYYY-MM-DD') of the last completion.
  wellness: {
    bse:           null,            // breast self-exam (monthly)
    pelvicFloor:   null,            // pelvic floor / Kegels (weekly)
    hydration:     null,            // { date, glasses } — daily reset
  },
  // Personal cramps playbook — each entry: { dateISO, where, intensity,
  // helped: [...], note?  }. Append-only via the Cramps Helper screen.
  // Lives in settings (already jsonb) so no new schema column needed.
  crampsHistory: [],
  // Interactive journaling history — each entry: { dateISO, kind, content,
  // recordedAt }. kind ∈ 'gratitude' | 'feeling' | 'compassion' | 'reframe' |
  // 'freewrite'. Used for recall on the Reflect screen and pattern.
  reflectHistory: [],
  // Cross-helper episode log — each entry: { helperKey, dateISO, triage,
  // helped, recordedAt }. Shared across CrampsHelper / Anxiety / Insomnia /
  // UTI / etc. via HelperShell so each helper recalls its own pattern.
  helperHistory: [],
  // Active life stage. Drives how Home + Insights frame the cycle:
  //   'cycle'    — default cycle tracking
  //   'ttc'      — trying to conceive; fertile-window emphasis
  // Pregnancy + Postpartum continue to use the `pregnancy` field above.
  lifecycle: 'cycle',
  // Cycle Schools — 5-day phase-aware educational programs. Each
  // entry: { startedAt, completedDays: [1,2,3], lastDay }. The key
  // is the school id (e.g. 'understanding-luteal'). Persisted in
  // settings so it survives across devices via the same cloud sync.
  schools: {},
  // First-week arc anchors — joinedAt is stamped once at onboarding
  // completion; firstWeekSeen maps moment id → the date it was shown
  // (each moment lives for one full day). See lib/firstWeek.js.
  joinedAt: null,
  firstWeekSeen: {},
  // NOTE: journalEntries used to live here. Migrated 2026-06-10 to a
  // top-level store slice + its own `journal_entries` Supabase table —
  // keeping the diary (with base64 photos) inside settings meant every
  // settings write re-uploaded the whole journal. Legacy values are
  // migrated out on rehydrate (local) and on hydrateFromCloud (cloud).
  // Diary customisation — themeId picks the palette, decorations is
  // a list of decoration keys ('hearts' | 'stars' | etc.), and
  // applyToApp = true skins the rest of the app to match.
  journalTheme: {
    themeId: 'cream',
    decorations: [],
    applyToApp: false,
  },
}

const useLuna = create(
  persist(
    (set, get) => ({
      // ── Onboarding ───────────────────────────────────────────
      onboarded: false,
      lastPeriodStart: null,
      cycleLength: 28,
      periodLength: 5,
      displayName: '',
      account: null,             // { email } | null — populated from profile after signin
      completedChecks: [],
      birthControl: { method: 'none', startDate: null },
      pregnancy: { active: false, lmp: null, dueDate: null, startedAt: null },
      // Past pregnancy outcomes — gentle record, additive only.
      // Each entry: { id, type, dateISO, gestationWeeks?, note? }
      // type ∈ 'miscarriage' | 'stillbirth' | 'abortion' | 'ectopic' | 'chemical' | 'live-birth'
      pregnancyHistory: [],

      setOnboarding: (data) => {
        set({ ...data, onboarded: true })
        fireAndForget(saveProfile({
          display_name:      data.displayName ?? get().displayName,
          last_period_start: data.lastPeriodStart ?? get().lastPeriodStart,
          cycle_length:      data.cycleLength ?? get().cycleLength,
          period_length:     data.periodLength ?? get().periodLength,
          onboarded:         true,
        }), 'setOnboarding')
      },
      setCycleLength: (n) => {
        set({ cycleLength: n })
        fireAndForget(saveProfile({ cycle_length: n }), 'setCycleLength')
      },
      setPeriodLength: (n) => {
        set({ periodLength: n })
        fireAndForget(saveProfile({ period_length: n }), 'setPeriodLength')
      },
      setLastPeriodStart: (d) => {
        const iso = toISO(d)
        set({ lastPeriodStart: iso })
        fireAndForget(saveProfile({ last_period_start: iso }), 'setLastPeriodStart')
      },
      setBirthControl: (data) => {
        const next = { ...(get().birthControl || {}), ...data }
        set({ birthControl: next })
        fireAndForget(saveProfile({ birth_control: next }), 'setBirthControl')
      },
      startPregnancy: ({ lmp }) => {
        const dueDate = lmpToDueDate(lmp)
        const next = { active: true, lmp, dueDate, startedAt: new Date().toISOString().slice(0, 10) }
        set({ pregnancy: next, birthControl: { method: 'none', startDate: null } })
        fireAndForget(saveProfile({
          pregnancy: next,
          birth_control: { method: 'none', startDate: null },
        }), 'startPregnancy')
      },
      endPregnancy: () => {
        const next = { active: false, lmp: null, dueDate: null, startedAt: null }
        set({ pregnancy: next })
        fireAndForget(saveProfile({ pregnancy: next }), 'endPregnancy')
      },
      // Record a pregnancy outcome — typically called when ending
      // pregnancy mode with a loss, or to backfill a past loss.
      // Always appends, never overwrites — gentle history only grows.
      addPregnancyLoss: (loss) => {
        const id = loss?.id || `pl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
        const entry = {
          id,
          type: loss?.type || 'miscarriage',
          dateISO: loss?.dateISO || new Date().toISOString().slice(0, 10),
          gestationWeeks: loss?.gestationWeeks ?? null,
          note: (loss?.note || '').trim() || null,
          recordedAt: new Date().toISOString(),
        }
        const next = [...(get().pregnancyHistory || []), entry]
        set({ pregnancyHistory: next })
        fireAndForget(saveProfile({ pregnancy_history: next }), 'addPregnancyLoss')
        return entry
      },
      removePregnancyLossEntry: (id) => {
        const next = (get().pregnancyHistory || []).filter((e) => e.id !== id)
        set({ pregnancyHistory: next })
        fireAndForget(saveProfile({ pregnancy_history: next }), 'removePregnancyLossEntry')
      },
      toggleCheck: (id) => {
        const cur = get().completedChecks
        const next = cur.includes(id) ? cur.filter((c) => c !== id) : [...cur, id]
        set({ completedChecks: next })
        fireAndForget(saveProfile({ completed_checks: next }), 'toggleCheck')
      },

      // ── Daily logs ───────────────────────────────────────────
      logs: {},

      saveLog: (date, log) => {
        const iso = toISO(date)
        const now = new Date().toISOString()
        // Stamp every save with updated_at so hydrate can merge cloud
        // vs local correctly — if a refresh happens before the cloud
        // round-trip completes, we keep whichever record is newer.
        const merged = { ...(get().logs[iso] || {}), ...log, date: iso, updated_at: now }
        set((s) => ({ logs: { ...s.logs, [iso]: merged } }))
        fireAndForget(upsertLog(iso, merged), 'saveLog')
      },

      removeLog: (date) => {
        const iso = toISO(date)
        set((s) => {
          const next = { ...s.logs }
          delete next[iso]
          return { logs: next }
        })
        fireAndForget(deleteLog(iso), 'removeLog')
      },

      getLog: (date) => get().logs[toISO(date)] || null,

      // ── Settings ─────────────────────────────────────────────
      settings: DEFAULT_SETTINGS,

      updateSetting: (key, val) => {
        const next = { ...get().settings, [key]: val }
        set({ settings: next })
        fireAndForget(saveProfile({ settings: next }), 'updateSetting')
      },

      // Mark a wellness habit as done today (or replace with a partial
      // value for habits like hydration that track an in-day counter).
      markWellness: (key, value) => {
        const cur = get().settings || {}
        const wellness = { ...(cur.wellness || {}), [key]: value }
        const next = { ...cur, wellness }
        set({ settings: next })
        fireAndForget(saveProfile({ settings: next }), 'markWellness')
      },

      // ── Journal — diary entries with their own data + theme ──
      //
      // Each entry: { id, body, photos, createdAt, updatedAt }. Top-
      // level slice with per-entry cloud sync (journal_entries table)
      // — NOT part of settings, so saving a page uploads one page,
      // and flipping a toggle uploads zero pages.
      // Theme + decorations live under settings.journalTheme.
      journalEntries: [],
      saveJournalEntry: (body, photos = []) => {
        const trimmed = String(body || '').trim()
        // Allow photo-only entries (no body text) — sometimes a picture
        // is the whole thing. Reject only when BOTH are empty.
        if (!trimmed && (!photos || photos.length === 0)) return null
        const now = new Date().toISOString()
        const entry = {
          id: `j_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          body: trimmed,
          photos: photos || [],
          createdAt: now,
          updatedAt: now,
        }
        set((s) => ({ journalEntries: [entry, ...(s.journalEntries || [])] }))
        fireAndForget(upsertJournalEntry(entry), 'saveJournalEntry')
        return entry
      },
      updateJournalEntry: (id, partial) => {
        const list = (get().journalEntries || []).map((e) =>
          e.id === id ? { ...e, ...partial, updatedAt: new Date().toISOString() } : e
        )
        set({ journalEntries: list })
        const updated = list.find((e) => e.id === id)
        if (updated) fireAndForget(upsertJournalEntry(updated), 'updateJournalEntry')
      },
      deleteJournalEntry: (id) => {
        set((s) => ({ journalEntries: (s.journalEntries || []).filter((e) => e.id !== id) }))
        fireAndForget(deleteJournalEntryCloud(id), 'deleteJournalEntry')
      },
      updateJournalTheme: (partial) => {
        const cur = get().settings || {}
        const journalTheme = { ...(cur.journalTheme || {}), ...partial }
        const next = { ...cur, journalTheme }
        set({ settings: next })
        fireAndForget(saveProfile({ settings: next }), 'updateJournalTheme')
      },

      // ── Navigation (in-app, never persisted) ─────────────────
      screen: 'welcome',
      stack:  ['welcome'],
      activePhaseId:  'ovulation',
      activeArticleId: 'pmdd',
      activeSymptomId: 'cramps',
      activeSchoolId:  'understanding-luteal',
      activeConditionId: null,
      // Active share invite code — populated when the user opens a
      // /share?code=… deep-link. AcceptShare reads it; clears it on
      // accept or decline.
      activeShareCode: null,
      // When set, the Reflect screen auto-opens this practice on mount
      // and then clears the value. Lets any helper / surface deep-link
      // straight into the right exercise instead of dumping the user
      // on the practice list.
      activeReflectPractice: null,
      setActiveReflectPractice: (id) => set({ activeReflectPractice: id }),
      // Date the Log screen is editing. Null means "today" — set
      // explicitly when the user navigates to Log from a past day
      // (Calendar tap, week strip tap).
      activeLogDate: null,
      setActiveLogDate: (iso) => set({ activeLogDate: iso }),

      // Transient celebration trigger — Log writes this when a
      // milestone happens (e.g. period day one); Home renders it
      // and clears it after ~3s.
      celebration: null,
      setCelebration: (kind) => set({ celebration: kind }),

      go: (screen, params = {}) =>
        set((s) => pushNav(s, screen, params)),

      // Pops the store stack WITHOUT touching browser history — the
      // popstate listener calls this after the browser already moved.
      _applyBack: () =>
        set((s) => {
          if (s.stack.length <= 1) return s
          const ns = s.stack.slice(0, -1)
          return { stack: ns, screen: ns[ns.length - 1] }
        }),

      back: () => {
        const s = useLuna.getState()
        if (s.stack.length <= 1) return
        // Prefer consuming a history entry we pushed, so the browser
        // and store stay in step; fall back to a direct pop when the
        // store stack outlives history (e.g. restored session state).
        if (histDepth > 0) {
          try { window.history.back(); return } catch { /* fall through */ }
        }
        s._applyBack()
      },

      goPhase:   (id) => set((s) => pushNav(s, 'phase',       { activePhaseId: id })),
      goArticle: (id) => set((s) => pushNav(s, 'article',     { activeArticleId: id })),
      goSymptom: (id) => set((s) => pushNav(s, 'symptom',     { activeSymptomId: id })),
      goSchool:  (id) => set((s) => pushNav(s, 'cycleSchool', { activeSchoolId: id })),

      // ── Pro ──────────────────────────────────────────────────
      isPro: true,
      trialDaysLeft: 7,
      setIsPro: (v) => {
        set({ isPro: Boolean(v) })
        fireAndForget(saveProfile({ is_pro: Boolean(v) }), 'setIsPro')
      },

      // ── Auth ─────────────────────────────────────────────────
      session: null,
      user:    null,
      setSession: (session) => set({ session, user: session?.user || null }),

      // ── Cloud hydration ──────────────────────────────────────
      // Load the user's profile + logs from Supabase and merge them
      // into local state. Logs are merged per-date by updated_at —
      // whichever side has the newer record wins. This protects
      // against a refresh during an in-flight cloud write: local
      // edits aren't clobbered just because they haven't reached the
      // server yet, and stale cloud rows don't overwrite fresher
      // local ones.
      hydrateFromCloud: async () => {
        const [profile, logs, cloudEntriesRaw] = await Promise.all([
          loadProfile(),
          loadLogs(),
          // Defensive: if the journal_entries migration hasn't run on
          // this Supabase instance yet, fall back to an empty list so
          // hydrate still completes for profile + logs.
          loadJournalEntries().catch(() => []),
        ])
        if (!profile) return
        const localLogs = get().logs || {}
        const cloudLogs = logs || {}
        const merged = { ...cloudLogs }
        for (const [iso, localLog] of Object.entries(localLogs)) {
          const cloudLog = cloudLogs[iso]
          // Take local if cloud doesn't have this date OR local is
          // newer (by updated_at) OR local has updated_at and cloud
          // doesn't.
          if (!cloudLog) {
            merged[iso] = localLog
          } else if (localLog.updated_at && (!cloudLog.updated_at || localLog.updated_at > cloudLog.updated_at)) {
            merged[iso] = localLog
          }
        }
        // Never downgrade onboarded true→false on hydrate. Race
        // condition: signUp triggers handle_new_user which creates a
        // profile with the column default onboarded=false. If the
        // user's setOnboarding cloud write hasn't landed yet when
        // hydrate fetches, the stale row would un-onboard them and
        // App.jsx would route them back to Welcome. Cloud can only
        // ever upgrade onboarded; once local is true, it stays true.
        const localOnboarded = get().onboarded

        // ── Journal merge + one-time legacy migration ───────────
        // Entries may exist in three places during the transition:
        // the new journal_entries table (cloud), the local slice, and
        // — for pre-migration users — inside settings.journalEntries
        // (cloud profile or local cache). Merge all three by id,
        // newest updatedAt wins, then push anything the table doesn't
        // have yet and strip the legacy key from settings for good.
        const mergedSettings = { ...DEFAULT_SETTINGS, ...(profile.settings || {}) }
        const legacyEntries = [
          ...(Array.isArray(mergedSettings.journalEntries) ? mergedSettings.journalEntries : []),
          ...(Array.isArray(get().settings?.journalEntries) ? get().settings.journalEntries : []),
        ]
        const hadLegacy = legacyEntries.length > 0
        delete mergedSettings.journalEntries
        const byId = new Map()
        for (const e of [...legacyEntries, ...(get().journalEntries || []), ...cloudEntriesRaw]) {
          if (!e?.id) continue
          const prev = byId.get(e.id)
          if (!prev || (e.updatedAt || '') > (prev.updatedAt || '')) byId.set(e.id, e)
        }
        const mergedEntries = [...byId.values()].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
        // Push entries the cloud table is missing (or has stale): the
        // legacy blob's pages + anything written while signed out.
        const cloudById = new Map(cloudEntriesRaw.map((e) => [e.id, e]))
        for (const e of mergedEntries) {
          const inCloud = cloudById.get(e.id)
          if (!inCloud || (e.updatedAt || '') > (inCloud.updatedAt || '')) {
            fireAndForget(upsertJournalEntry(e), 'hydrate.migrateJournalEntry')
          }
        }
        // Slim the profile's settings blob permanently once legacy
        // pages have been queued for the new table.
        if (hadLegacy) {
          fireAndForget(saveProfile({ settings: mergedSettings }), 'hydrate.stripLegacyJournal')
        }

        set({
          onboarded:       localOnboarded || Boolean(profile.onboarded),
          displayName:     profile.display_name || '',
          lastPeriodStart: profile.last_period_start || null,
          cycleLength:     profile.cycle_length || 28,
          periodLength:    profile.period_length || 5,
          birthControl:    profile.birth_control || { method: 'none', startDate: null },
          pregnancy:       profile.pregnancy || { active: false, lmp: null, dueDate: null, startedAt: null },
          pregnancyHistory: profile.pregnancy_history || [],
          completedChecks: profile.completed_checks || [],
          settings:        mergedSettings,
          journalEntries:  mergedEntries,
          isPro:           profile.is_pro !== false,
          trialDaysLeft:   profile.trial_days_left ?? 7,
          account:         profile.email ? { email: profile.email } : null,
          logs:            merged,
        })
      },

      // ── Sign-out / clear ─────────────────────────────────────
      // Reset persisted slice to defaults so the next account starts
      // clean. Navigation/auth fields are reset separately.
      clearLocalData: () => set({
        onboarded:       false,
        lastPeriodStart: null,
        cycleLength:     28,
        periodLength:    5,
        displayName:     '',
        account:         null,
        completedChecks: [],
        birthControl:    { method: 'none', startDate: null },
        pregnancy:       { active: false, lmp: null, dueDate: null, startedAt: null },
        pregnancyHistory: [],
        logs:            {},
        settings:        DEFAULT_SETTINGS,
        journalEntries:  [],
        isPro:           true,
        trialDaysLeft:   7,
        session:         null,
        user:            null,
        screen:          'welcome',
        stack:           ['welcome'],
      }),
    }),
    {
      name: 'luna-store',
      // Plain localStorage cache for fast cold paint. Source of truth
      // is Supabase (loaded via hydrateFromCloud after signin). The
      // cache lets the app render the user's last-known state before
      // the network round-trip lands.
      storage: createJSONStorage(() => localStorage),
      // One-time local migration: pre-2026-06-10 caches carry the
      // diary inside settings.journalEntries. Move those pages into
      // the top-level slice the moment the cache rehydrates, so
      // signed-out users keep their journal too. (Signed-in users get
      // the same migration server-side via hydrateFromCloud.)
      onRehydrateStorage: () => (state) => {
        const legacy = state?.settings?.journalEntries
        if (!Array.isArray(legacy) || legacy.length === 0) return
        const cur = state.journalEntries || []
        const ids = new Set(cur.map((e) => e.id))
        const merged = [...cur, ...legacy.filter((e) => e?.id && !ids.has(e.id))]
          .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
        const settings = { ...state.settings }
        delete settings.journalEntries
        useLuna.setState({ journalEntries: merged, settings })
      },
      partialize: (s) => ({
        onboarded:       s.onboarded,
        lastPeriodStart: s.lastPeriodStart,
        cycleLength:     s.cycleLength,
        periodLength:    s.periodLength,
        displayName:     s.displayName,
        account:         s.account,
        completedChecks: s.completedChecks,
        birthControl:    s.birthControl,
        pregnancy:       s.pregnancy,
        pregnancyHistory: s.pregnancyHistory,
        logs:            s.logs,
        settings:        s.settings,
        journalEntries:  s.journalEntries,
        isPro:           s.isPro,
        trialDaysLeft:   s.trialDaysLeft,
      }),
    }
  )
)

// Hardware back / edge-swipe → pop one screen. Registered once at
// module scope. Forward-navigation popstates are rare in a standalone
// PWA; treating every popstate as "back" keeps the model simple.
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    histDepth = Math.max(0, histDepth - 1)
    useLuna.getState()._applyBack()
  })
}

export default useLuna
