import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { getPhaseForDay } from '../hooks/useCycle'
import {
  loadProfile, saveProfile,
  loadLogs, upsertLog, deleteLog,
  fireAndForget,
} from '../lib/cloud'

// Date helpers
const toISO = (d) => d instanceof Date ? d.toISOString().slice(0, 10) : d
const today = () => new Date().toISOString().slice(0, 10)
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
  notifyPeriod:  true,
  notifyLog:     true,
  notifyWeekly:  true,
  analytics:     true,
  sounds:        false,             // soft chimes on save / milestones — opt-in
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

      // ── Navigation (in-app, never persisted) ─────────────────
      screen: 'welcome',
      stack:  ['welcome'],
      activePhaseId:  'ovulation',
      activeArticleId: 'pmdd',
      activeSymptomId: 'cramps',
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
        set((s) => ({
          screen,
          stack: [...s.stack, screen],
          ...params,
        })),

      back: () =>
        set((s) => {
          if (s.stack.length <= 1) return s
          const ns = s.stack.slice(0, -1)
          return { stack: ns, screen: ns[ns.length - 1] }
        }),

      goPhase:   (id) => set((s) => ({ activePhaseId: id,   screen: 'phase',   stack: [...s.stack, 'phase'] })),
      goArticle: (id) => set((s) => ({ activeArticleId: id, screen: 'article', stack: [...s.stack, 'article'] })),
      goSymptom: (id) => set((s) => ({ activeSymptomId: id, screen: 'symptom', stack: [...s.stack, 'symptom'] })),

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
        const [profile, logs] = await Promise.all([loadProfile(), loadLogs()])
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
        set({
          onboarded:       Boolean(profile.onboarded),
          displayName:     profile.display_name || '',
          lastPeriodStart: profile.last_period_start || null,
          cycleLength:     profile.cycle_length || 28,
          periodLength:    profile.period_length || 5,
          birthControl:    profile.birth_control || { method: 'none', startDate: null },
          pregnancy:       profile.pregnancy || { active: false, lmp: null, dueDate: null, startedAt: null },
          pregnancyHistory: profile.pregnancy_history || [],
          completedChecks: profile.completed_checks || [],
          settings:        { ...DEFAULT_SETTINGS, ...(profile.settings || {}) },
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
        isPro:           s.isPro,
        trialDaysLeft:   s.trialDaysLeft,
      }),
    }
  )
)

export default useLuna
