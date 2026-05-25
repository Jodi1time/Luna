import { PREGNANCY_WEEKS } from '../data/pregnancyData'

const MS_PER_DAY = 86400000

export function isPregnant(pregnancy) {
  return Boolean(pregnancy?.active && pregnancy?.lmp)
}

export function getPregnancyWeek(lmp) {
  if (!lmp) return null
  const start = new Date(lmp + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const days = Math.floor((now - start) / MS_PER_DAY)
  return {
    week: Math.floor(days / 7) + 1, // 1-indexed, traditional pregnancy week
    dayInWeek: (days % 7) + 1,
    totalDays: days,
  }
}

export function getTrimester(week) {
  if (week == null) return null
  if (week <= 13) return { number: 1, name: 'First trimester' }
  if (week <= 27) return { number: 2, name: 'Second trimester' }
  return { number: 3, name: 'Third trimester' }
}

export function getDaysToDueDate(dueDate) {
  if (!dueDate) return null
  const due = new Date(dueDate + 'T00:00:00')
  const now = new Date(); now.setHours(0, 0, 0, 0)
  return Math.round((due - now) / MS_PER_DAY)
}

export function getWeekContent(week) {
  if (week == null) return null
  // Pre-week-4 → before missed period, very few people know they're pregnant
  const idx = Math.max(0, Math.min(PREGNANCY_WEEKS.length - 1, week - 1))
  return PREGNANCY_WEEKS[idx]
}

export function usePregnancy(store) {
  const { pregnancy } = store
  if (!isPregnant(pregnancy)) return { active: false }
  const wk = getPregnancyWeek(pregnancy.lmp)
  const trimester = getTrimester(wk?.week)
  const daysToDue = getDaysToDueDate(pregnancy.dueDate)
  const content = getWeekContent(wk?.week)
  return {
    active: true,
    lmp: pregnancy.lmp,
    dueDate: pregnancy.dueDate,
    week: wk?.week,
    dayInWeek: wk?.dayInWeek,
    trimester,
    daysToDue,
    content,
  }
}
