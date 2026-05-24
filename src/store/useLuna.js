import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getPhaseForDay } from '../hooks/useCycle'

// Date helpers
const toISO = (d) => d instanceof Date ? d.toISOString().slice(0, 10) : d
const today = () => new Date().toISOString().slice(0, 10)

const useLuna = create(
  persist(
    (set, get) => ({
      // ── Onboarding ───────────────────────────────────────────
      onboarded: false,
      lastPeriodStart: null,   // ISO date string
      cycleLength: 28,
      periodLength: 5,
      storageMode: 'local',    // 'local' | 'sync'
      account: null,           // { name, email, password } | null

      setOnboarding: (data) => set({ ...data, onboarded: true }),
      setCycleLength: (n) => set({ cycleLength: n }),
      setPeriodLength: (n) => set({ periodLength: n }),
      setLastPeriodStart: (d) => set({ lastPeriodStart: toISO(d) }),
      setStorageMode: (m) => set({ storageMode: m }),

      // ── Daily logs ───────────────────────────────────────────
      // keyed by ISO date string
      logs: {},

      saveLog: (date, log) =>
        set((s) => ({ logs: { ...s.logs, [toISO(date)]: { ...s.logs[toISO(date)], ...log, date: toISO(date) } } })),

      getLog: (date) => get().logs[toISO(date)] || null,

      // ── Settings ─────────────────────────────────────────────
      settings: {
        showEditorial: true,
        showLibrary:   true,
        showWatch:     true,
        notifyPeriod:  true,
        notifyLog:     true,
        notifyWeekly:  true,
        faceId:        false,
        analytics:     false,
      },

      updateSetting: (key, val) =>
        set((s) => ({ settings: { ...s.settings, [key]: val } })),

      // ── Navigation (in-app) ──────────────────────────────────
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
      isPro: false,
      trialDaysLeft: 7,
    }),
    {
      name: 'luna-store',
      partialize: (s) => ({
        onboarded:       s.onboarded,
        lastPeriodStart: s.lastPeriodStart,
        cycleLength:     s.cycleLength,
        periodLength:    s.periodLength,
        storageMode:     s.storageMode,
        account:         s.account,
        logs:            s.logs,
        settings:        s.settings,
        isPro:           s.isPro,
        trialDaysLeft:   s.trialDaysLeft,
      }),
    }
  )
)

export default useLuna
