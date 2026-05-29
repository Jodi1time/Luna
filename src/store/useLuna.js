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
  analytics:     false,
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
        const merged = { ...(get().logs[iso] || {}), ...log, date: iso }
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

      // ── Navigation (in-app, never persisted) ─────────────────
      screen: 'welcome',
      stack:  ['welcome'],
      activePhaseId:  'ovulation',
      activeArticleId: 'pmdd',
      activeSymptomId: 'cramps',

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
      // Load the user's profile + logs from Supabase and replace
      // local state. Called on signin and on app boot if a session
      // already exists. Local state may be stale (last cached) until
      // this resolves; UI shows cached values in the meantime.
      hydrateFromCloud: async () => {
        const [profile, logs] = await Promise.all([loadProfile(), loadLogs()])
        if (!profile) return
        set({
          onboarded:       Boolean(profile.onboarded),
          displayName:     profile.display_name || '',
          lastPeriodStart: profile.last_period_start || null,
          cycleLength:     profile.cycle_length || 28,
          periodLength:    profile.period_length || 5,
          birthControl:    profile.birth_control || { method: 'none', startDate: null },
          pregnancy:       profile.pregnancy || { active: false, lmp: null, dueDate: null, startedAt: null },
          completedChecks: profile.completed_checks || [],
          settings:        { ...DEFAULT_SETTINGS, ...(profile.settings || {}) },
          isPro:           profile.is_pro !== false,
          trialDaysLeft:   profile.trial_days_left ?? 7,
          account:         profile.email ? { email: profile.email } : null,
          logs:            logs || {},
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
        logs:            s.logs,
        settings:        s.settings,
        isPro:           s.isPro,
        trialDaysLeft:   s.trialDaysLeft,
      }),
    }
  )
)

export default useLuna
