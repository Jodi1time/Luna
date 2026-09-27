import useLuna from '../store/useLuna'
import { todayKey } from '../lib/dateOnly'
import './firstSteps.css'
export default function FirstSteps() {
  const { settings, updateSetting, go, setActiveLogDate } = useLuna()
  const guide = settings?.firstSteps
  if (!guide?.active) return null
  const pcos = settings?.conditions?.includes('pcos')
  const steps = [
    { title: 'Start with how you feel.', body: 'Open the log, choose only what fits, and save. You can edit it later. Return to Today to continue this guide.', action: 'Try a check-in', route: 'log' },
    { title: 'Your calendar is a record, not a verdict.', body: 'Tap a past day to add or edit an entry. Recorded periods and estimated dates are different; estimates can be uncertain.', action: 'Explore my calendar', route: 'calendar' },
    { title: pcos ? 'Bring your questions with you.' : 'Prepare for your next visit.', body: pcos ? 'Save a question, find treatment history, and prepare editable conversation notes. Include only what you want to share.' : 'Open visit notes to prepare for a conversation with your care team. Review the content before sharing.', action: pcos ? 'Open my PCOS space' : 'Open visit notes', route: pcos ? 'pcos' : 'cheatsheet' },
  ]
  const index = Math.min(Math.max(guide.step || 0, 0), steps.length - 1)
  const step = steps[index]
  const save = patch => updateSetting('firstSteps', { ...guide, ...patch })
  return <section className="first-steps" aria-label="Getting started guide"><p className="setup-eyebrow">A LITTLE GUIDANCE · {index + 1} OF 3</p><h2>{step.title}</h2><p>{step.body}</p><button className="setup-primary" onClick={() => { if (step.route === 'log') setActiveLogDate(todayKey()); go(step.route) }}>{step.action}</button><div className="guide-controls">{index > 0 && <button onClick={() => save({ step: index - 1 })}>Previous</button>}<button onClick={() => index === 2 ? save({ active: false }) : save({ step: index + 1 })}>{index === 2 ? 'Finish guide' : 'Next tip'}</button><button onClick={() => save({ active: false })}>Skip guide</button></div><small>Reopen this guide in Settings. Taking a tour does not add or complete any health records.</small></section>
}
