import { useState } from 'react'
import useLuna from '../store/useLuna'
import { SYMPTOMS } from '../data/lunaData'
import { todayKey } from '../lib/dateOnly'

const PCOS_FOCUS = ['hirsutism', 'scalpThinning', 'acanthosis', 'sugarCraving', 'energyCrash']
export default function PcosCarePlanner() {
  const { settings, updateSetting } = useLuna()
  const focus = settings.pcosFocus ?? PCOS_FOCUS
  const events = settings.pcosCareEvents || []
  const [date, setDate] = useState(todayKey)
  const [kind, setKind] = useState('Care note')
  const [note, setNote] = useState('')
  const [status, setStatus] = useState('')
  function save(e) {
    e.preventDefault()
    if (!date || date > todayKey() || !note.trim()) return
    updateSetting('pcosCareEvents', [...events, { id: crypto.randomUUID(), date, kind, note: note.trim() }])
    setNote(''); setStatus('Care note saved.')
  }
  return <>
    <details><summary>Make tracking feel like you</summary><p className="care-small">Choose which additional symptoms appear in your PCOS logging row. Your existing records stay intact.</p><fieldset style={{ border: 0, padding: 0 }}><legend>What do you want to keep track of?</legend>{PCOS_FOCUS.map(id => <label className="care-check" key={id}><input type="checkbox" checked={focus.includes(id)} onChange={e => updateSetting('pcosFocus', e.target.checked ? [...focus, id] : focus.filter(x => x !== id))} />{SYMPTOMS[id]?.label || id}</label>)}</fieldset></details>
    <details><summary>My care timeline</summary><p className="care-small">Record what happened and what you noticed. This is your account of events, not a conclusion about what caused a symptom. These notes do not change your medication tracker.</p>
      <form onSubmit={save}><label>Date<input type="date" required value={date} max={todayKey()} onChange={e => setDate(e.target.value)} /></label><label>Type<select value={kind} onChange={e => setKind(e.target.value)}>{['Care note', 'Treatment started', 'Treatment stopped', 'Possible side effect', 'Appointment'].map(x => <option key={x}>{x}</option>)}</select></label><label>What would you like to remember?<textarea required maxLength={1000} value={note} onChange={e => setNote(e.target.value)} placeholder="Treatment name, what changed, or something to ask about…" /></label><button disabled={!note.trim()} type="submit">Save care note</button></form>
      <p role="status" className="care-small">{status}</p>
      {!events.length && <p className="care-small">No timeline notes yet. Add only what feels useful.</p>}
      <ul className="care-questions">{[...events].sort((a, b) => b.date.localeCompare(a.date)).map(event => <li key={event.id}><span><strong>{event.date} · {event.kind}</strong><br />{event.note}</span><button aria-label={`Remove ${event.kind} from ${event.date}`} onClick={() => { if (window.confirm('Remove this care note?')) updateSetting('pcosCareEvents', events.filter(x => x.id !== event.id)) }}>Remove</button></li>)}</ul>
    </details>
    <details><summary>Resources for understanding your care</summary><p className="care-small">External information to read and discuss with your care team. Some sources now use PMOS, the updated name for PCOS.</p><ul><li><a href="https://www.nhs.uk/conditions/polyendocrine-metabolic-ovarian-syndrome-pmos/" target="_blank" rel="noopener noreferrer">NHS: symptoms, diagnosis and care overview</a></li><li><a href="https://www.monash.edu/medicine/mchri/pcos" target="_blank" rel="noopener noreferrer">Monash: international guideline and patient resources</a></li></ul><p className="care-small">Links checked September 27, 2026. This is not a clinical review of Luna’s content.</p></details>
  </>
}
