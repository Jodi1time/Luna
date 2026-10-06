import { useState } from 'react'
import useLuna from '../store/useLuna'
import { todayKey } from '../lib/dateOnly'
import { CARE_CONCERNS, CARE_IMPACTS, CARE_FEELINGS, readCareSpace, makeCareEntry, followUpAvailable } from '../lib/careSpace'
import './careSpace.css'

export default function CareSpace({ onPrepare }) {
  const { settings, saveCareSpace } = useLuna()
  const space = readCareSpace(settings.pcosCareSpace)
  const { concern, entries } = space
  const [panel, setPanel] = useState(null)
  const [topic, setTopic] = useState(CARE_CONCERNS[0])
  const [label, setLabel] = useState('')
  const [followUps, setFollowUps] = useState(false)
  const [date, setDate] = useState(todayKey)
  const [feeling, setFeeling] = useState('')
  const [impacts, setImpacts] = useState([])
  const [note, setNote] = useState('')
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const latest = entries.filter(e => e.kind === 'update' && e.concernId === concern?.id).sort((a, b) => b.date.localeCompare(a.date))[0]

  async function save(patch, message) {
    setBusy(true); setError(''); setStatus('')
    try {
      const location = await saveCareSpace(patch)
      setStatus(`${message} ${location === 'account' ? 'Saved to your account.' : 'Saved on this device only.'}`)
      return true
    } catch (err) {
      setError(err.message === 'Sign in to save your care space.' ? 'Sign in again to save to your account. Your words are still here.' : 'Your changes weren’t saved. Your words are still here—please try again when connected.')
      return false
    } finally { setBusy(false) }
  }

  function open(next, entry = null) {
    if (panel && (note.trim() || feeling || impacts.length) && !window.confirm('Leave this unsaved moment?')) return
    setError(''); setStatus(''); setPanel(next); setEditing(entry)
    setDate(entry?.date || todayKey()); setFeeling(entry?.feeling || '')
    setImpacts(entry?.impacts || []); setNote(entry?.note || '')
    if (next === 'concern') {
      setTopic(concern?.topic || CARE_CONCERNS[0]); setLabel(concern?.label || '')
      setFollowUps(concern?.followUps || false)
    }
  }

  async function pin(e) {
    e.preventDefault()
    const title = label.trim() || (topic === 'Something else' ? '' : topic)
    if (!title) { setError('Give this concern a short name.'); return }
    if (await save({ concern: { id: crypto.randomUUID(), topic, label: title, followUps, pinnedOn: todayKey(), dismissedOn: null } }, 'Your focus is set. Earlier updates stay in your history.')) setPanel(null)
  }

  async function record(e) {
    e.preventDefault()
    let entry
    try {
      entry = makeCareEntry({ kind: panel, concern: editing ? { id: editing.concernId, label: editing.concernLabel } : concern, date, feeling, impacts, note, id: editing?.id || crypto.randomUUID(), now: editing?.createdAt })
    } catch (err) { setError(err.message); return }
    const next = editing ? entries.map(x => x.id === editing.id ? entry : x) : [...entries, entry]
    if (await save({ entries: next }, panel === 'reflection' ? 'Your reflection is kept out of visit notes unless you choose it.' : 'Update saved. You can choose it for your visit notes below.')) {
      setPanel(null); setNote(''); setEditing(null)
    }
  }

  return <div className="care-space">
    <div className="care-focus">
      <span className="care-kicker">WHAT MATTERS TO YOU</span>
      <h3>{concern ? concern.label : 'One thing on your mind.'}</h3>
      <p>{concern ? 'Keep a little context here, so you don’t have to hold it all.' : 'Skin, energy, hair changes, treatment questions—or something entirely your own. No weight or fertility goal required.'}</p>
      {concern && latest && <p className="care-small">Last update: {latest.date}{latest.feeling ? ` · ${latest.feeling}` : ''}</p>}
      {panel === null && <div className="care-actions">
        <button disabled={busy} className="care-primary" onClick={() => open(concern ? 'update' : 'concern')}>{concern ? 'Update my concern' : 'Choose my focus'}</button>
        <div className="care-quiet-actions"><button onClick={() => open('reflection')}>A moment for me</button><button onClick={onPrepare}>Prepare for care →</button></div>
      </div>}
      {concern && panel === null && <details className="care-focus-options"><summary>My focus & follow-ups</summary>
        <p className="care-small">Follow-ups appear only when you open Luna. They are off unless you choose them. Nothing is sent as a notification.</p>
        <button disabled={busy} onClick={() => save({ concern: { ...concern, followUps: !concern.followUps } }, concern.followUps ? 'Follow-ups paused.' : 'In-app follow-ups enabled.')}>{concern.followUps ? 'Pause follow-ups' : 'Allow gentle follow-ups'}</button>
        <button disabled={busy} onClick={() => open('concern')}>Change my focus</button>
        <button disabled={busy} onClick={() => save({ concern: null }, 'Focus unpinned. Your earlier updates are still here.')}>Unpin focus</button>
      </details>}
      {panel === null && followUpAvailable(concern, entries) && <div className="care-followup"><p>Would an update about {concern.label.toLowerCase()} feel useful today?</p><button disabled={busy} onClick={() => save({ concern: { ...concern, dismissedOn: todayKey() } }, 'Set aside for today. No entry was created.')}>Not today</button></div>}
    </div>

    {panel === 'concern' && <form onSubmit={pin} className="care-entry-form"><fieldset disabled={busy}><legend>What would you like to keep close?</legend>
      <label htmlFor="care-topic">A starting point<select id="care-topic" value={topic} onChange={e => setTopic(e.target.value)}>{CARE_CONCERNS.map(x => <option key={x}>{x}</option>)}</select></label>
      <label htmlFor="care-focus-label">{topic === 'Something else' ? 'Give it a short name' : 'In your words · optional'}<textarea id="care-focus-label" required={topic === 'Something else'} rows={2} maxLength={100} value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. My skin is affecting my confidence" /></label>
      <label className="care-check"><input type="checkbox" checked={followUps} onChange={e => setFollowUps(e.target.checked)} />Offer a gentle follow-up when I open Luna</label>
      <div className="care-quiet-actions"><button type="submit" className="care-primary">{busy ? 'Saving…' : 'Keep this in focus'}</button><button type="button" onClick={() => setPanel(null)}>Cancel</button></div>
    </fieldset></form>}

    {(panel === 'update' || panel === 'reflection') && <form className="care-entry-form" onSubmit={record}><fieldset disabled={busy}><legend>{panel === 'reflection' ? 'Space for what this feels like.' : 'A little update.'}</legend>
      <p className="care-small">{panel === 'reflection' ? 'You don’t have to solve anything here. Write as much or as little as you want. Reflections are not added to visit notes automatically.' : 'A feeling, an impact, or a few words—any one is enough. This is your account, not a medical assessment.'}</p>
      <label htmlFor="care-entry-date">Date<input id="care-entry-date" type="date" value={date} required max={todayKey()} onChange={e => setDate(e.target.value)} /></label>
      {panel === 'update' && <><fieldset><legend>How does it feel?</legend><div className="care-chips">{CARE_FEELINGS.map(x => <button type="button" key={x} aria-pressed={feeling === x} onClick={() => setFeeling(feeling === x ? '' : x)}>{x}</button>)}</div></fieldset>
        <fieldset><legend>Did it get in the way of anything? · optional</legend><div className="care-chips">{CARE_IMPACTS.map(x => <button type="button" key={x} aria-pressed={impacts.includes(x)} onClick={() => setImpacts(impacts.includes(x) ? impacts.filter(y => y !== x) : [...impacts, x])}>{x}</button>)}</div></fieldset></>}
      <label htmlFor="care-entry-note">{panel === 'reflection' ? 'What’s on your mind?' : 'Anything you want to remember? · optional'}<textarea id="care-entry-note" maxLength={1000} rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder={panel === 'reflection' ? 'Today has felt…' : 'What happened, what you tried, or a question for later…'} /></label>
      <div className="care-quiet-actions"><button className="care-primary" type="submit">{busy ? 'Saving…' : editing ? 'Save changes' : 'Save this moment'}</button><button type="button" onClick={() => { if (!(note.trim() || feeling || impacts.length) || window.confirm('Leave without saving this moment?')) setPanel(null) }}>Cancel</button></div>
    </fieldset></form>}
    <p className="care-small" role="status" aria-live="polite">{status}</p>
    {error && <p className="care-error" role="alert">{error}</p>}

    <details className="care-history"><summary>Your moments · {entries.length}</summary>
      <p className="care-small">Concern updates and reflections live here, separately from daily symptom logs. Missing days are simply unknown.</p>
      {entries.length === 0 ? <p>No catching up needed. Start whenever it feels useful.</p> : <ul>{[...entries].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)).map(entry => <li key={entry.id}>
        <div className="care-kicker">{entry.date} · {entry.kind === 'reflection' ? 'PERSONAL REFLECTION' : 'CONCERN UPDATE'}</div>
        {entry.concernLabel && <h4>{entry.concernLabel}</h4>}
        {entry.feeling && <p>{entry.feeling}</p>}
        {entry.impacts.length > 0 && <p className="care-small">Affected: {entry.impacts.join(', ')}</p>}
        {entry.note && <p className="care-note-text">{entry.note}</p>}
        <div className="care-quiet-actions"><button disabled={busy} onClick={() => open(entry.kind, entry)}>Edit</button><button disabled={busy} aria-label={`Delete ${entry.kind} from ${entry.date}`} onClick={() => { if (window.confirm('Delete this moment? This cannot be undone. Already downloaded visit notes will not change.')) save({ entries: entries.filter(x => x.id !== entry.id) }, 'Moment deleted. Existing visit drafts and downloads are unchanged.') }}>Delete</button></div>
      </li>)}</ul>}
    </details>
  </div>
}
