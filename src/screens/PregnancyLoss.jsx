import { useState } from 'react'
import { T } from '../data/theme'
import { Masthead, Eyebrow, Rule, Screen, SourceLine } from '../components/shared'
import useLuna from '../store/useLuna'

// One of the deepest gaps in mainstream period apps. The voice here
// matters more than the form fields — language is gentle, optional,
// never extractive. Nothing here is required to "complete" anything.
//
// Logging is intentionally minimal: type, date, optional gestation
// week, optional note. Resources are weighted heavily because
// what people actually need at this moment is to know they're not
// alone and to find the next human to talk to.

const LOSS_TYPES = [
  { id: 'miscarriage', label: 'Miscarriage', sub: 'Before 20 weeks' },
  { id: 'stillbirth',  label: 'Stillbirth',  sub: '20 weeks or later' },
  { id: 'chemical',    label: 'Chemical',    sub: 'Very early — sometimes only confirmed by an HCG drop' },
  { id: 'ectopic',     label: 'Ectopic',     sub: 'Implanted outside the uterus' },
  { id: 'abortion',    label: 'Abortion',    sub: 'Medical or surgical termination' },
  { id: 'unsure',      label: 'Unsure',      sub: 'I don\'t want to name it yet' },
]

// Bereavement prompts — used once on this screen as quiet reflection
// space. Doula-toned, never instructive. The user reads them; we don't
// ask them to answer anything.
const REFLECTIONS = [
  "Whatever you're feeling — relief, grief, numbness, fury, all of it at once — is the body and the heart speaking.",
  "You don't owe anyone a timeline. You don't owe anyone the story.",
  "It happened. It is happening. Both are allowed.",
  "Be selective about who you let into the room with this.",
  "There is no version of this that you did wrong.",
]

const RESOURCES = [
  {
    label: 'Postpartum Support International',
    sub: 'Pregnancy loss + postpartum mental health · US, free helpline',
    detail: '1-800-944-4773 (call or text) · postpartum.net',
  },
  {
    label: 'Star Legacy Foundation',
    sub: 'Stillbirth + pregnancy loss support, education, research',
    detail: 'starlegacyfoundation.org',
  },
  {
    label: 'Return to Zero: H.O.P.E.',
    sub: 'Peer support groups for pregnancy + infant loss',
    detail: 'rtzhope.org',
  },
  {
    label: 'M.E.N.D. (Mommies Enduring Neonatal Death)',
    sub: 'Christian-rooted support; also welcomes non-religious families',
    detail: 'mend.org',
  },
  {
    label: 'All-Options',
    sub: 'Judgement-free talkline covering loss, abortion, parenting, adoption decisions',
    detail: '1-888-493-0092 · all-options.org',
  },
  {
    label: 'NHS — Pregnancy loss support',
    sub: 'UK guidance, sands.org.uk (Stillbirth & Neonatal Death Charity)',
    detail: 'sands.org.uk · tommys.org',
  },
]

function LossEntry({ entry, onRemove }) {
  const date = new Date(entry.dateISO + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const typeLabel = LOSS_TYPES.find((t) => t.id === entry.type)?.label || entry.type
  return (
    <div className="glass-card" style={{ padding: 14, borderLeft: `3px solid ${T.accent}`, borderRadius: T.r, marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.serif, fontSize: 16, fontWeight: 500, lineHeight: 1.3 }}>
            {typeLabel}
            {entry.gestationWeeks ? <span style={{ color: T.muted, fontWeight: 400, fontStyle: 'italic' }}> · week {entry.gestationWeeks}</span> : null}
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 13, color: T.muted, marginTop: 4, fontStyle: 'italic' }}>
            {date}
          </div>
          {entry.note && (
            <div style={{ fontFamily: T.serif, fontSize: 13.5, color: T.text, marginTop: 8, lineHeight: 1.5, padding: '8px 10px', background: 'rgba(200,78,46,0.05)', borderRadius: T.r }}>
              {entry.note}
            </div>
          )}
        </div>
        <button onClick={() => onRemove(entry.id)}
          aria-label="Remove entry"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 14, padding: 4, fontFamily: T.sans }}>
          ✕
        </button>
      </div>
    </div>
  )
}

export default function PregnancyLoss() {
  const back = useLuna((s) => s.back)
  const goArticle = useLuna((s) => s.goArticle)
  const pregnancyHistory = useLuna((s) => s.pregnancyHistory || [])
  const addPregnancyLoss = useLuna((s) => s.addPregnancyLoss)
  const removePregnancyLossEntry = useLuna((s) => s.removePregnancyLossEntry)

  const [showForm, setShowForm] = useState(false)
  const [type, setType] = useState('miscarriage')
  const [dateISO, setDateISO] = useState(new Date().toISOString().slice(0, 10))
  const [gestation, setGestation] = useState('')
  const [note, setNote] = useState('')
  const [justSaved, setJustSaved] = useState(false)

  const save = () => {
    const weeks = gestation.trim() ? Math.max(1, Math.min(45, parseInt(gestation, 10))) : null
    addPregnancyLoss({
      type,
      dateISO,
      gestationWeeks: Number.isFinite(weeks) ? weeks : null,
      note,
    })
    setJustSaved(true)
    setTimeout(() => {
      setShowForm(false)
      setType('miscarriage')
      setDateISO(new Date().toISOString().slice(0, 10))
      setGestation('')
      setNote('')
      setJustSaved(false)
    }, 900)
  }

  return (
    <Screen padBottom={40}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="pregnancy loss" onBack={back} />
        <div className="insight-stagger" style={{ animationDelay: '0ms' }}>
          <Eyebrow>You are not alone in this</Eyebrow>
        </div>
        <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 32, fontWeight: 500, letterSpacing: -0.7, lineHeight: 1.05, animationDelay: '50ms' }}>
          A room for what happened.
        </div>
        <div className="insight-stagger" style={{ fontFamily: T.serif, fontSize: 15, lineHeight: 1.65, color: T.muted, marginTop: 12, fontStyle: 'italic', animationDelay: '110ms' }}>
          Roughly one in four pregnancies ends in loss. The science is clear; the grief deserves its own room. Use this space to mark it, write to your future self, and find the next human to talk to. Nothing here is required.
        </div>
        <Rule />

        {/* Reflective prompts — read-only doula-toned lines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
          {REFLECTIONS.map((r, i) => (
            <div key={i} style={{ fontFamily: T.serif, fontSize: 16, lineHeight: 1.6, color: T.text, fontStyle: 'italic', paddingLeft: 14, borderLeft: `2px solid ${T.accent}40` }}>
              {r}
            </div>
          ))}
        </div>

        <Rule />

        <Eyebrow>If you'd like to mark it</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 13.5, lineHeight: 1.55, color: T.muted, marginBottom: 14, fontStyle: 'italic' }}>
          Only for you — never shared. You can remove an entry any time. There is no shape this has to take.
        </div>

        {pregnancyHistory.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            {pregnancyHistory
              .slice()
              .sort((a, b) => (b.dateISO || '').localeCompare(a.dateISO || ''))
              .map((entry) => (
                <LossEntry key={entry.id} entry={entry} onRemove={removePregnancyLossEntry} />
              ))}
          </div>
        )}

        {!showForm && (
          <button onClick={() => setShowForm(true)}
            style={{ width: '100%', background: 'transparent', color: T.accent, border: `1px solid ${T.accent}`, padding: '13px 14px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, letterSpacing: 0.4 }}>
            {pregnancyHistory.length === 0 ? 'Add an entry' : 'Add another entry'}
          </button>
        )}

        {showForm && (
          <div className="glass-card" style={{ padding: 16, borderRadius: T.r, marginTop: 4 }}>
            <div style={{ fontFamily: T.serif, fontSize: 14, fontStyle: 'italic', marginBottom: 10, color: T.text }}>
              What happened
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
              {LOSS_TYPES.map((t) => {
                const on = type === t.id
                return (
                  <button key={t.id} onClick={() => setType(t.id)}
                    style={{ textAlign: 'left', border: `1px solid ${on ? T.accent : T.hair}`, background: on ? T.accent + '12' : T.card, color: on ? T.accent : T.text, padding: '10px 12px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t.label}</div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 2, fontWeight: 400 }}>{t.sub}</div>
                  </button>
                )
              })}
            </div>

            <div style={{ fontFamily: T.serif, fontSize: 14, fontStyle: 'italic', marginBottom: 8, color: T.text }}>Date</div>
            <input type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              style={{ width: '100%', background: T.card, border: `1px solid ${T.hair}`, borderRadius: T.r, padding: '11px 14px', fontSize: 14, fontFamily: T.sans, color: T.text, outline: 'none', marginBottom: 16 }}
            />

            <div style={{ fontFamily: T.serif, fontSize: 14, fontStyle: 'italic', marginBottom: 8, color: T.text }}>Gestational week (optional)</div>
            <input type="number" inputMode="numeric" min={1} max={45} value={gestation}
              onChange={(e) => setGestation(e.target.value)}
              placeholder="e.g. 8"
              style={{ width: '100%', background: T.card, border: `1px solid ${T.hair}`, borderRadius: T.r, padding: '11px 14px', fontSize: 14, fontFamily: T.sans, color: T.text, outline: 'none', marginBottom: 16 }}
            />

            <div style={{ fontFamily: T.serif, fontSize: 14, fontStyle: 'italic', marginBottom: 8, color: T.text }}>A note, if you want one</div>
            <textarea value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="A few words for your future self. Skip this if you'd rather."
              maxLength={1500} rows={4}
              style={{ width: '100%', background: T.card, border: `1px solid ${T.hair}`, borderRadius: T.r, padding: '14px 16px', fontFamily: T.serif, fontStyle: 'italic', fontSize: 14.5, color: T.text, lineHeight: 1.55, outline: 'none', marginBottom: 14 }}
            />

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowForm(false)}
                style={{ flex: 1, background: 'transparent', color: T.muted, border: `1px solid ${T.hair}`, padding: '11px 12px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans, fontSize: 12, fontWeight: 500 }}>
                Not now
              </button>
              <button onClick={save}
                className={justSaved ? 'success-pulse' : ''}
                style={{ flex: 1, background: T.accent, color: '#fff', border: 'none', padding: '11px 12px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans, fontSize: 12, fontWeight: 600, letterSpacing: 0.3 }}>
                {justSaved ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
        )}

        <Rule />

        <Eyebrow>People who answer the phone</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {RESOURCES.map((r) => (
            <div key={r.label} className="glass-card" style={{ padding: 14, borderRadius: T.r, borderLeft: `3px solid ${T.accent}` }}>
              <div style={{ fontFamily: T.serif, fontSize: 15, fontWeight: 500, color: T.text, lineHeight: 1.3 }}>
                {r.label}
              </div>
              <div style={{ fontFamily: T.sans, fontSize: 11.5, color: T.muted, marginTop: 4, lineHeight: 1.5 }}>
                {r.sub}
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.accent, marginTop: 6, letterSpacing: 0.2, fontWeight: 600 }}>
                {r.detail}
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => goArticle('pregnancy-loss')}
          style={{ width: '100%', background: 'transparent', color: T.text, border: `1px solid ${T.text}`, padding: '12px 14px', borderRadius: T.r, cursor: 'pointer', fontFamily: T.sans, fontSize: 12, fontWeight: 600, letterSpacing: 0.4, marginBottom: 14 }}>
          Read: After a pregnancy loss →
        </button>

        <SourceLine>Resources listed are independent — Luna does not partner with or take money from any of them.</SourceLine>
        <div style={{ height: 16 }} />
      </div>
    </Screen>
  )
}
