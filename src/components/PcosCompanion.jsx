import { useState } from 'react'
import useLuna from '../store/useLuna'
import { T } from '../data/theme'
import { SYMPTOMS } from '../data/lunaData'
import { careRecap, careSummary } from '../lib/careRecap'
import { todayKey } from '../lib/dateOnly'
import './pcosCompanion.css'
import PcosCarePlanner from './PcosCarePlanner'

export default function PcosCompanion({ compact = false }) {
  const { logs, settings, updateSetting, go, setActiveLogDate } = useLuna()
  const [question, setQuestion] = useState('')
  const [draft, setDraft] = useState(null)
  const [message, setMessage] = useState('')
  const questions = settings?.pcosQuestions || []
  const recap = careRecap(logs)
  const medications = settings?.pcos?.medications || []
  const [includeTreatments, setIncludeTreatments] = useState(false)
  const [includeEvents, setIncludeEvents] = useState(false)
  function addQuestion(e) {
    e.preventDefault()
    if (!question.trim()) return
    updateSetting('pcosQuestions', [...questions, { id: crypto.randomUUID(), text: question.trim() }])
    setQuestion('')
    setMessage('Question saved. It will be here for your next appointment.')
  }
  function review() {
    if (draft !== null && !window.confirm('Rebuild this summary? This will replace your edits with the current records.')) return
    setDraft(careSummary({ recap, labels: SYMPTOMS, questions, medications: includeTreatments ? medications : [], events: includeEvents ? settings.pcosCareEvents || [] : [] }))
    setMessage('Review and edit your notes before downloading. Edits below are not saved until you download.')
  }
  function download() {
    const url = URL.createObjectURL(new Blob([draft], { type: 'text/plain;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url; link.download = `Luna-visit-notes-${todayKey()}.txt`; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setMessage('Your reviewed notes were downloaded.')
  }
  return <section className="pcos-companion" style={{ '--care-accent': T.accent }} aria-label="Your PCOS companion">
    <div className="care-kicker">YOUR PCOS COMPANION</div>
    <h2>{compact ? 'Your care, together.' : 'A little less to remember.'}</h2>
    <p>Symptoms, treatments and the questions you want to bring with you.</p>
    <div className="care-actions">
      <button className="care-primary" onClick={() => { setActiveLogDate(todayKey()); go('log') }}>Record how I feel</button>
      <button onClick={() => go(compact ? 'pcos' : 'pcosMedications')}>{compact ? 'Open my care space' : 'Treatment history'} →</button>
    </div>
    <div className="care-recap">
      <span className="care-kicker">THE LAST SEVEN DAYS</span>
      <h3>{recap.recorded ? `${recap.recorded} days, remembered.` : 'Start with today.'}</h3>
      {recap.symptoms.slice(0, 3).map(([id, count]) => <div className="care-count" key={id}><span>{SYMPTOMS[id]?.label || id}</span><span>{count} {count === 1 ? 'day' : 'days'} recorded</span></div>)}
      <p className="care-small">{recap.recorded ? `${recap.missing} days without entries. These are observations, not explanations of their cause.` : 'No entries in the last seven days. There is nothing to catch up on.'}</p>
    </div>
    {!compact && <>
      <PcosCarePlanner />
      <h3>For my next appointment</h3>
      <form onSubmit={addQuestion}><label htmlFor="care-question">What do you want to ask?</label><textarea id="care-question" value={question} onChange={e => setQuestion(e.target.value)} maxLength={500} rows={2} placeholder="The question I always forget when I get there…"/><button type="submit" disabled={!question.trim()}>Save question</button></form>
      <ul className="care-questions">{questions.map(q => <li key={q.id}><span>{q.text}</span><button aria-label={`Remove question: ${q.text}`} onClick={() => { if (window.confirm('Remove this saved question?')) updateSetting('pcosQuestions', questions.filter(item => item.id !== q.id)) }}>Remove</button></li>)}</ul>
      <label className="care-check"><input type="checkbox" checked={includeTreatments} onChange={e => setIncludeTreatments(e.target.checked)}/> Include my recorded treatments in the next summary</label>
      <button onClick={review}>Prepare my conversation notes →</button>
      <label className="care-check"><input type="checkbox" checked={includeEvents} onChange={e => setIncludeEvents(e.target.checked)} />Include my care timeline notes in the next summary</label>
      {draft !== null && <div className="care-draft"><label htmlFor="care-draft">Your editable summary</label><textarea id="care-draft" rows={12} value={draft} onChange={e => setDraft(e.target.value)}/><button className="care-primary" onClick={download}>Download reviewed notes</button><p className="care-small">Changing your questions or selection does not alter this draft. Prepare again to rebuild it; rebuilding replaces your edits.</p></div>}
      <p role="status" className="care-small">{message}</p>
    </>}
  </section>
}
