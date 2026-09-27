export const SETUP_STAGES = ['Your starting point', 'Optional details', 'Your first steps', 'Your account']
export const STARTING_POINTS = [
  { id: 'managing-condition', title: 'Manage PCOS or another condition', detail: 'Symptoms, treatment records and appointment questions, together.' },
  { id: 'understanding', title: 'Remember how I feel', detail: 'Keep track of symptoms, moods and everyday notes.' },
  { id: 'just-tracking', title: 'Keep a simple cycle record', detail: 'A calendar of your records, with estimates clearly marked.' },
]
export function validateSetupDetails({ date, length, irregular }, today) {
  if (date) {
    const parsed = new Date(`${date}T12:00:00Z`)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date || date > today) return 'Choose a valid date that is today or earlier, or leave it blank.'
  }
  if (!irregular && length !== '' && (!Number.isInteger(Number(length)) || Number(length) < 15 || Number(length) > 120)) return 'Enter a whole number from 15 to 120, or leave it blank.'
  return null
}
export function setupProfile({ date, length, irregular, name, email }) {
  return { lastPeriodStart: date || null, cycleLength: !irregular && length !== '' ? Number(length) : 28, displayName: name.trim(), account: { email } }
}
