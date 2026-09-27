import { useEffect, useRef, useState } from 'react'
import useLuna from '../store/useLuna'
import { getSession, signUp } from '../lib/supabase'
import { todayKey } from '../lib/dateOnly'
import { validateEmail, validateAccountPassword } from '../lib/validation'
import { SETUP_STAGES, STARTING_POINTS, setupProfile, validateSetupDetails } from '../lib/onboardingFlow'
import '../components/firstSteps.css'

const CONDITIONS = [['pcos', 'PCOS'], ['endo', 'Endometriosis'], ['pmdd', 'PMDD'], ['thyroid', 'Thyroid condition'], ['fibroids', 'Fibroids'], ['ha', 'Hypothalamic amenorrhea']]
export default function OnboardingFlow() {
  const { go, setOnboarding, session } = useLuna()
  const [stage, setStage] = useState(0)
  const [intent, setIntent] = useState('')
  const [conditions, setConditions] = useState([])
  const [date, setDate] = useState('')
  const [length, setLength] = useState('')
  const [irregular, setIrregular] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmEmail, setConfirmEmail] = useState(false)
  const title = useRef(null)
  useEffect(() => { title.current?.focus(); title.current?.scrollIntoView({ block: 'start' }) }, [stage])
  const details = { date, length, irregular }
  function changeStage(next) { setError(''); setStage(next) }
  function advance() {
    if (stage === 1) {
      const message = validateSetupDetails(details, todayKey())
      if (message) { setError(message); return }
    }
    changeStage(stage + 1)
  }
  async function finish(e) {
    e.preventDefault()
    if (busy) return
    const message = validateSetupDetails(details, todayKey()) || (name.trim().length > 60 ? 'Use a name of 60 characters or fewer.' : null)
    if (message) { setError(message); return }
    setBusy(true); setError('')
    try {
      let active = await getSession()
      if (!active?.user) {
        if (confirmEmail) { setError('Open the confirmation link, then return here or sign in. Your email is not confirmed here yet.'); return }
        const invalid = validateEmail(email) || validateAccountPassword(password)
        if (invalid) { setError(invalid); return }
        const data = await signUp(email.trim(), password)
        active = data?.session
        setPassword('')
        if (!active?.user) { setConfirmEmail(true); return }
      }
      useLuna.getState().setSession(active)
      await setOnboarding({ ...setupProfile({ ...details, name, email: active.user.email }), settings: {
        ...useLuna.getState().settings,
        intent: intent || 'just-tracking',
        conditions: intent === 'managing-condition' ? conditions : [],
        irregular: irregular || length === '',
        joinedAt: todayKey(), firstSteps: { active: true, step: 0 },
      } })
      go('home')
    } catch (err) { setError(err?.message || 'Could not create your account. Your setup is still here; please try again.') }
    finally { setBusy(false) }
  }
  const headings = ['Let’s start with you.', 'Only what you want to share.', 'Here’s how Luna can help.', 'A space to come back to.']
  return <main className="luna-setup">
    <div className="setup-brand">LUNA <span>at your pace</span></div>
    <nav aria-label="Setup progress"><p className="setup-eyebrow">{stage + 1} OF 4 · {SETUP_STAGES[stage]}</p><progress max="4" value={stage + 1} aria-label={`Step ${stage + 1} of 4: ${SETUP_STAGES[stage]}`} /></nav>
    <h1 tabIndex={-1} ref={title}>{headings[stage]}</h1>
    {stage === 0 && <><p>You don’t need to know exactly what you need. Pick a starting point; you can explore everything later.</p><fieldset><legend>What would feel useful today?</legend>{STARTING_POINTS.map(item => <label className={`setup-option ${intent === item.id ? 'selected' : ''}`} key={item.id}><input type="radio" name="intent" checked={intent === item.id} onChange={() => setIntent(item.id)} /><span><strong>{item.title}</strong><small>{item.detail}</small></span></label>)}</fieldset><p className="setup-note">Luna organizes your records. It doesn’t diagnose conditions or replace your care team.</p></>}
    {stage === 1 && <><p>Everything on this page is optional. A regular cycle or a diagnosis is not a requirement for being here.</p>
      <label className="setup-field">Another starting point? <span>optional</span><select value={['ttc', 'avoiding', 'pregnant', 'menopause'].includes(intent) ? intent : ''} onChange={e => setIntent(e.target.value || 'just-tracking')}><option value="">Keep my current choice</option><option value="ttc">Trying to conceive</option><option value="avoiding">Avoiding pregnancy</option><option value="pregnant">Pregnant or postpartum</option><option value="menopause">Approaching menopause</option></select></label>
      {intent === 'managing-condition' && <fieldset><legend>Anything you’d like support with?</legend><div className="setup-chips">{CONDITIONS.map(([id, label]) => <label key={id}><input type="checkbox" checked={conditions.includes(id)} onChange={e => setConditions(e.target.checked ? [...conditions, id] : conditions.filter(c => c !== id))} />{label}</label>)}</div><small>Leave this blank if you’re unsure or still seeking answers.</small></fieldset>}
      <details><summary>Add cycle details <span>optional</span></summary><label className="setup-field">Last period start<input type="date" value={date} max={todayKey()} onChange={e => setDate(e.target.value)} /></label><label className="setup-field">Usual cycle length, in days<input inputMode="numeric" type="number" min="15" max="120" value={length} disabled={irregular} onChange={e => setLength(e.target.value)} placeholder="Leave blank if unknown" /></label><label className="setup-check"><input type="checkbox" checked={irregular} onChange={e => setIrregular(e.target.checked)} />My cycle varies / I’m not sure</label><p className="setup-note">These details help with calendar estimates, not confirmation of ovulation. Luna is not a method of contraception.</p></details></>}
    {stage === 2 && <><p>Start with one thing. You don’t have to fill in your whole history.</p><ol className="setup-plan"><li><strong>Record a real moment</strong><p>How you feel today, a symptom, or a note you don’t want to forget.</p></li><li><strong>Keep your care together</strong><p>{conditions.includes('pcos') ? 'Your PCOS space brings treatment records and saved appointment questions together.' : 'Keep notes and review your records before an appointment.'}</p></li><li><strong>Return when it helps</strong><p>Review what you recorded. Missing days stay unknown—not “symptom-free.”</p></li></ol><p className="setup-note">Next: create your account. Then an optional guide will open the real tools with you. No sample health data will be added.</p></>}
    {stage === 3 && <form id="setup-account" onSubmit={finish}><p>Your account lets you sign in again. A nickname is fine, and your name is optional.</p><label className="setup-field">What should we call you? <span>optional</span><input autoComplete="given-name" maxLength={60} value={name} onChange={e => setName(e.target.value)} placeholder="Name or nickname" /></label>
      {session?.user ? <p>Signed in as {session.user.email}</p> : confirmEmail ? <div role="status" className="setup-message"><strong>Check your inbox</strong><p>Open the confirmation link sent to {email}. Keep this page open to retain your choices, then select “I’ve confirmed my email.”</p></div> : <><label className="setup-field">Email<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required /></label><label className="setup-field">Password<input type="password" autoComplete="new-password" minLength={8} maxLength={256} value={password} onChange={e => setPassword(e.target.value)} required /><small>At least 8 characters. Use a password unique to Luna.</small></label></>}
      <p className="setup-note">Review our <button type="button" className="setup-link" onClick={() => go('privacy')}>Privacy Policy</button>. Leaving this setup restarts it when you return.</p>{!session?.user && <button type="button" className="setup-link" onClick={() => go('auth')}>Already have an account? Sign in</button>}</form>}
    {error && <p role="alert" className="setup-error">{error}</p>}
    <footer className="setup-footer"><button disabled={busy} onClick={() => stage ? changeStage(stage - 1) : go('welcome')}>Back</button>{stage < 3 ? <button className="setup-primary" onClick={advance}>{stage === 0 && !intent ? 'I’m not sure yet' : stage === 2 ? 'Continue to my account' : 'Continue'}</button> : <button className="setup-primary" type="submit" form="setup-account" disabled={busy}>{busy ? 'Setting up…' : confirmEmail && !session?.user ? 'I’ve confirmed my email' : session?.user ? 'Open my Luna' : 'Create my account'}</button>}</footer>
  </main>
}
