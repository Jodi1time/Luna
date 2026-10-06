import { useRef, useState } from 'react'
import useLuna from '../store/useLuna'
import { T } from '../data/theme'
import { SYMPTOMS } from '../data/lunaData'
import { careRecap, careSummary } from '../lib/careRecap'
import { todayKey } from '../lib/dateOnly'
import './pcosCompanion.css'
import PcosCarePlanner from './PcosCarePlanner'
import CareSpace from './CareSpace'
import { readCareSpace, selectedCareEntries } from '../lib/careSpace'

export default function PcosCompanion({ compact = false }) {
  const { logs, settings, saveCareQuestions, saveCareSpace, careSaving, go, setActiveLogDate } = useLuna()
  const space = readCareSpace(settings.pcosCareSpace)
  const visitRef = useRef(null)
  const [question, setQuestion] = useState('')
  const [editedDraft, setDraft] = useState(undefined)
  // Use a later-loaded account draft until the person starts editing locally.
  const draft = editedDraft === undefined ? space.visitDraft : editedDraft
  const [message, setMessage] = useState('')
  const [includeConcern, setIncludeConcern] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [savingDraft, setSavingDraft] = useState(false)
  const questions = settings?.pcosQuestions || []
  const recap = careRecap(logs)
  const medications = settings?.pcos?.medications || []
  const [includeTreatments, setIncludeTreatments] = useState(false)
  const [includeEvents, setIncludeEvents] = useState(false)
  async function addQuestion(e) {
    e.preventDefault()
    if (!question.trim()) return
    try {
      const location = await saveCareQuestions([...questions, { id: crypto.randomUUID(), text: question.trim() }])
      setQuestion('')
      setMessage(location === 'account' ? 'Question saved to your account.' : 'Question saved on this device only.')
    } catch { setMessage('Question not saved. Your words are still here. Please try again.') }
  }
  async function removeQuestion(id) {
    if (!window.confirm('Remove this saved question?')) return
    try {
      await saveCareQuestions(questions.filter(item => item.id !== id))
      setMessage('Question removed. Existing drafts and downloads are unchanged.')
    } catch { setMessage('Question not removed. Please try again.') }
  }
  function review() {
    if (draft !== null && !window.confirm('Rebuild this summary? This will replace your edits with the current records.')) return
    setDraft(careSummary({ recap, labels: SYMPTOMS, questions, medications: includeTreatments ? medications : [], events: includeEvents ? settings.pcosCareEvents || [] : [], concern: includeConcern ? space.concern : null, careEntries: selectedCareEntries(space.entries, selectedIds) }))
    setMessage('Draft prepared. Review your words, then save or download. Nothing is sent to anyone.')
  }
  async function saveDraft() {
    setSavingDraft(true)
    try {
      const location = await saveCareSpace({ visitDraft: draft })
      setMessage(location === 'account' ? 'Edited draft saved to your account.' : 'Edited draft saved on this device only.')
    } catch { setMessage('Draft not saved. Your edits are still here. Try again or download a copy.') }
    finally { setSavingDraft(false) }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([draft], { type: 'text/plain;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url; link.download = `Luna-visit-notes-${todayKey()}.txt`; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setMessage('Your reviewed notes were downloaded.')
  }
  if (compact) return <section className="pcos-companion care-compact" aria-label="Your care space">
    <div className="care-kicker">YOUR CARE SPACE</div>
    <h2>{space.concern?.label || 'A little less to carry.'}</h2>
    <p>{space.concern ? 'A place for updates, what you’ve tried, and what you want to ask.' : 'Keep one concern close. Make room for how you feel. Bring your notes to care.'}</p>
    <div className="care-actions"><button className="care-primary" onClick={() => go('pcos')}>{space.concern ? 'Return to my care space' : 'Make space for my care'} →</button></div>
  </section>

  return <section className="pcos-companion" style={{ '--care-accent': T.accent }} aria-label="Your PCOS care space">
    <div className="care-kicker">YOUR CARE SPACE</div>
    <h2>A little less to carry.</h2>
    <p>For what you notice, what you’ve tried, and how it feels to live with it. At your pace.</p>
    <CareSpace onPrepare={() => { visitRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }); visitRef.current?.focus({ preventScroll: true }) }} />
    <div className="care-quiet-actions"><button onClick={() => { setActiveLogDate(todayKey()); go('log') }}>Daily symptom log</button><button onClick={() => go('pcosMedications')}>Treatment history →</button></div>
    <div className="care-recap">
      <span className="care-kicker">THE LAST SEVEN DAYS</span>
      <h3>{recap.recorded ? `${recap.recorded} ${recap.recorded === 1 ? 'day' : 'days'}, remembered.` : 'Start whenever you’re ready.'}</h3>
      {recap.symptoms.slice(0, 3).map(([id, count]) => <div className="care-count" key={id}><span>{SYMPTOMS[id]?.label || id}</span><span>{count} {count === 1 ? 'day' : 'days'} recorded</span></div>)}
      <p className="care-small">{recap.recorded ? `${recap.missing} days without entries. These are observations, not explanations of their cause.` : 'No entries in the last seven days. There is nothing to catch up on.'}</p>
    </div>
    <>
      <div ref={visitRef} tabIndex={-1} className="care-visit"><h3>For my next appointment</h3>
      <p className="care-small">Choose what to bring. Personal reflections are excluded unless you select them. Existing drafts change only when you rebuild them.</p>
      <form onSubmit={addQuestion}><label htmlFor="care-question">What do you want to ask?</label><textarea id="care-question" disabled={careSaving} value={question} onChange={e => setQuestion(e.target.value)} maxLength={500} rows={2} placeholder="The question I always forget when I get there…"/><button type="submit" disabled={careSaving || !question.trim()}>Save question</button></form>
      <ul className="care-questions">{questions.map(q => <li key={q.id}><span>{q.text}</span><button disabled={careSaving} aria-label={`Remove question: ${q.text}`} onClick={() => removeQuestion(q.id)}>Remove</button></li>)}</ul>
      <label className="care-check"><input type="checkbox" checked={includeTreatments} onChange={e => setIncludeTreatments(e.target.checked)}/> Include my recorded treatments in the next summary</label>
      <label className="care-check"><input type="checkbox" checked={includeEvents} onChange={e => setIncludeEvents(e.target.checked)} />Include my care timeline notes in the next summary</label>
      {space.concern && <label className="care-check"><input type="checkbox" checked={includeConcern} onChange={e => setIncludeConcern(e.target.checked)} />Include my pinned concern</label>}
      {space.entries.length > 0 && <details><summary>Choose care-space moments · {selectedCareEntries(space.entries, selectedIds).length} selected</summary>{[...space.entries].sort((a, b) => b.date.localeCompare(a.date)).map(e => <label key={e.id} className="care-check care-entry-choice"><input type="checkbox" checked={selectedIds.includes(e.id)} onChange={event => setSelectedIds(event.target.checked ? [...selectedIds, e.id] : selectedIds.filter(id => id !== e.id))} /><span>{e.date} · {e.kind === 'reflection' ? 'Personal reflection' : e.concernLabel}<small>{[e.feeling, e.impacts.join(', '), e.note].filter(Boolean).join(' · ')}</small></span></label>)}</details>}
      <button disabled={savingDraft} onClick={review}>Prepare my conversation notes →</button>
      {draft !== null && <div className="care-draft"><label htmlFor="care-draft">Your editable summary</label><textarea id="care-draft" disabled={savingDraft} rows={12} value={draft} onChange={e => setDraft(e.target.value)}/><div className="care-quiet-actions"><button disabled={careSaving} onClick={saveDraft}>{savingDraft ? 'Saving…' : 'Save edited draft'}</button><button className="care-primary" onClick={download}>Download reviewed notes</button></div><p className="care-small">Save edits to keep them for later. Changing or deleting records does not change this draft or earlier downloads. Prepare again to rebuild it; rebuilding replaces your edits.</p></div>}
      <p role="status" className="care-small">{message}</p>
      </div>
      <PcosCarePlanner />
      <p className="care-small">Luna helps you keep records and prepare questions. It doesn’t diagnose symptoms, choose treatments, or provide urgent care.</p>
    </>
  </section>
}
