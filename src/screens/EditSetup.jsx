import { T } from '../data/theme'
import { Masthead, Eyebrow, Screen } from '../components/shared'
import useLuna from '../store/useLuna'
import { sectionColors } from '../data/sectionPalette'
import {
  StepIntent,
  StepConditions,
  StepPriorities,
  defaultPrioritiesForIntent,
} from './Onboarding'

// Your setup — edit-in-place editor for every onboarding answer.
//
// The whole point: Luna users can change what they told us anytime,
// without contacting support. Flo's most documented friction is
// exactly this — users can't change their original answers after
// the wizard finishes. We refuse that pattern.
//
// All four onboarding answers (intent, conditions, irregular, priorities)
// stack here as inline blocks. Every selection auto-saves through
// updateSetting, which writes to local state + cloud profile. No
// explicit Save button — Luna already trusts her.

export default function EditSetup() {
  const { back, settings, updateSetting } = useLuna()
  const accent = sectionColors('plan').accent

  const intent = settings?.intent || null
  const conditions = settings?.conditions || []
  const irregular = Boolean(settings?.irregular)
  const priorities = (settings?.priorities && settings.priorities.length > 0)
    ? settings.priorities
    : defaultPrioritiesForIntent(intent)

  // When intent changes, if it leaves managing-condition, clear conditions
  // so we don't leave a stale list. If it enters managing-condition, the
  // conditions block becomes visible (she can pick fresh).
  const handleIntentChange = (newIntent) => {
    updateSetting('intent', newIntent)
    if (newIntent !== 'managing-condition' && conditions.length > 0) {
      updateSetting('conditions', [])
    }
  }

  return (
    <Screen padBottom={40}>
      <div style={{ padding: '12px 22px 0', color: T.text }}>
        <Masthead issue="Your setup" onBack={back} />
        <Eyebrow color={accent}>What you told Luna</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 500, letterSpacing: -0.6, lineHeight: 1.1, marginBottom: 10 }}>
          Anything here can <em>change.</em>
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 14, color: T.muted, lineHeight: 1.55, marginBottom: 28, fontStyle: 'italic' }}>
          Your answers shape what Luna leads with. Update them whenever life shifts — it lands the next time you open Home.
        </div>

        {/* Intent block */}
        <div style={{ marginBottom: 32 }}>
          <Eyebrow color={accent}>Why you’re here</Eyebrow>
          <div style={{ marginTop: 12 }}>
            <StepIntent value={intent} onChange={handleIntentChange} />
          </div>
        </div>

        {/* Conditions block — only when intent is managing-condition */}
        {intent === 'managing-condition' && (
          <div style={{ marginBottom: 32 }}>
            <Eyebrow color={accent}>Conditions you’re navigating</Eyebrow>
            <div style={{ marginTop: 12 }}>
              <StepConditions values={conditions} onChange={(arr) => updateSetting('conditions', arr)} />
            </div>
          </div>
        )}

        {/* Irregular toggle — small inline boolean, not a full step.
            Mirrors the onboarding cycle screen's check-style toggle. */}
        <div style={{ marginBottom: 32 }}>
          <Eyebrow color={accent}>Your cycle’s rhythm</Eyebrow>
          <button onClick={() => updateSetting('irregular', !irregular)}
            className={`alive-card frost-card${irregular ? ' tap-bloom' : ''}`}
            style={{
              width: '100%', textAlign: 'left', cursor: 'pointer',
              padding: '14px 16px',
              background: irregular ? `${accent}14` : 'rgba(253,250,245,0.55)',
              border: `1px solid ${irregular ? accent + '55' : 'rgba(26,19,16,0.06)'}`,
              borderRadius: 18,
              color: T.text, fontFamily: 'inherit',
              boxShadow: irregular ? `0 12px 22px -16px ${accent}60` : '0 10px 22px -22px rgba(26,19,16,0.18)',
              transition: 'all 0.2s var(--ease-out)',
              display: 'flex', alignItems: 'center', gap: 12,
              marginTop: 12,
            }}>
            <div style={{
              width: 22, height: 22, borderRadius: 6,
              background: irregular ? accent : 'transparent',
              border: `1.5px solid ${irregular ? accent : 'rgba(26,19,16,0.18)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.2s var(--ease-out)',
            }}>
              {irregular && (
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 10l3 3 7-7" />
                </svg>
              )}
            </div>
            <div style={{ fontFamily: T.serif, fontStyle: irregular ? 'italic' : 'normal', fontSize: 15, fontWeight: 500, letterSpacing: -0.2, color: irregular ? accent : T.text }}>
              Mine is irregular, or I’m not sure.
            </div>
          </button>
          {irregular && (
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: T.muted, lineHeight: 1.55, marginTop: 10, paddingLeft: 4 }}>
              Luna shows ranges instead of single dates and never calls your body wrong.
            </div>
          )}
        </div>

        {/* Priorities block */}
        <div style={{ marginBottom: 8 }}>
          <Eyebrow color={accent}>What matters most right now</Eyebrow>
          <div style={{ marginTop: 12 }}>
            <StepPriorities values={priorities} onChange={(arr) => updateSetting('priorities', arr)} />
          </div>
        </div>

        {/* Quiet reassurance — explicit "no contact support needed" */}
        <div style={{
          marginTop: 24, padding: '14px 16px',
          background: 'rgba(253,250,245,0.55)',
          border: '1px solid rgba(26,19,16,0.06)',
          borderRadius: 16,
          fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: T.muted, lineHeight: 1.6,
        }}>
          Changes save as you make them. Nothing here ever requires emailing us — it’s your setup, you own it.
        </div>
      </div>
    </Screen>
  )
}
