import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { getPhaseForDay } from '../hooks/useCycle'
import { secureStorage } from '../lib/crypto'

// Date helpers
const toISO = (d) => d instanceof Date ? d.toISOString().slice(0, 10) : d
const today = () => new Date().toISOString().slice(0, 10)
const lmpToDueDate = (lmp) => {
  if (!lmp) return null
  const d = new Date(lmp + 'T00:00:00')
  d.setDate(d.getDate() + 280) // Naegele's rule: LMP + 280 days
  return d.toISOString().slice(0, 10)
}

const useLuna = create(
  persist(
    (set, get) => ({
      // ── Onboarding ───────────────────────────────────────────
      onboarded: false,
      lastPeriodStart: null,   // ISO date string
      cycleLength: 28,
      periodLength: 5,
      storageMode: 'local',    // 'local' | 'sync'
      displayName: '',         // shown in the You tab; collected during onboarding
      account: null,           // { email } | null — only set if a Supabase account was created (passcode is the encryption key, never stored)
      completedChecks: [],     // array of CHECKUPS ids marked done
      birthControl: { method: 'none', startDate: null },  // none | combined-pill | mini-pill | hormonal-iud | copper-iud | implant | shot | patch | ring
      pregnancy: { active: false, lmp: null, dueDate: null, startedAt: null },

      setOnboarding: (data) => set({ ...data, onboarded: true }),
      setCycleLength: (n) => set({ cycleLength: n }),
      setPeriodLength: (n) => set({ periodLength: n }),
      setLastPeriodStart: (d) => set({ lastPeriodStart: toISO(d) }),
      setStorageMode: (m) => set({ storageMode: m }),
      setBirthControl: (data) => set({ birthControl: { ...(get().birthControl || {}), ...data } }),
      startPregnancy: ({ lmp }) => {
        const dueDate = lmpToDueDate(lmp)
        set({
          pregnancy: { active: true, lmp, dueDate, startedAt: new Date().toISOString().slice(0, 10) },
          // Pregnancy supersedes any active BC tracking — silently clear it.
          birthControl: { method: 'none', startDate: null },
        })
      },
      endPregnancy: () => set({ pregnancy: { active: false, lmp: null, dueDate: null, startedAt: null } }),
      toggleCheck: (id) =>
        set((s) => ({
          completedChecks: s.completedChecks.includes(id)
            ? s.completedChecks.filter((c) => c !== id)
            : [...s.completedChecks, id],
        })),

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
      // Beta: all friends/family users get Pro for free. Real Pro
      // gating will land when Stripe is wired up — at that point this
      // default goes back to false and isPro flips on a paid signup.
      isPro: true,
      trialDaysLeft: 7,

      // ── Auth (Tier 3 — Supabase) ─────────────────────────────
      session: null,
      user:    null,
      setSession: (session) => set({ session, user: session?.user || null }),
    }),
    {
      name: 'luna-store',
      storage: createJSONStorage(() => secureStorage),
      skipHydration: true,
      partialize: (s) => ({
        onboarded:       s.onboarded,
        lastPeriodStart: s.lastPeriodStart,
        cycleLength:     s.cycleLength,
        periodLength:    s.periodLength,
        storageMode:     s.storageMode,
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
