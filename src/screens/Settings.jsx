import { T } from '../data/theme'
import { Masthead, Eyebrow, Toggle, Screen } from '../components/shared'
import useLuna from '../store/useLuna'
import { BC_LABELS } from '../data/birthControl'
import { signOut } from '../lib/supabase'
import { setAnalyticsEnabled, capture, resetAnalytics } from '../lib/posthog'
import { exportLunaCSV, deleteLunaAccount } from '../lib/dataActions'

function SectionLabel({ children }) {
  return <div style={{ fontSize: 10, letterSpacing: 1.5, fontWeight: 700, color: T.muted, fontFamily: T.sans, padding: '20px 22px 8px', textTransform: 'uppercase' }}>{children}</div>
}

function Row({ label, value, right, onTap, danger }) {
  return (
    <div onClick={onTap}
      style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${T.hair}`, cursor: onTap ? 'pointer' : 'default' }}>
      <div style={{ fontSize: 14, color: danger ? T.accent : T.text, fontFamily: T.sans }}>{label}</div>
      <div style={{ fontSize: 13, color: T.muted, fontFamily: T.sans, display: 'flex', alignItems: 'center', gap: 6 }}>
        {value && <span>{value}</span>}
        {right ?? (onTap ? <span style={{ opacity: 0.4 }}>›</span> : null)}
      </div>
    </div>
  )
}

export default function Settings() {
  const { go, settings, updateSetting, cycleLength, periodLength, isPro, trialDaysLeft, displayName, birthControl, pregnancy } = useLuna()
  const clearLocalData = useLuna((s) => s.clearLocalData)
  const methodLabel = BC_LABELS[birthControl?.method] || 'None'
  const pregLabel = (() => {
    if (!pregnancy?.active || !pregnancy?.lmp) return 'Not active'
    const start = new Date(pregnancy.lmp + 'T00:00:00')
    const now = new Date(); now.setHours(0, 0, 0, 0)
    const days = Math.floor((now - start) / 86400000)
    const wk = Math.max(1, Math.floor(days / 7) + 1)
    return `Week ${wk}`
  })()
  const session = useLuna((s) => s.session)
  const initial = (displayName || session?.user?.email || 'L').trim().charAt(0).toUpperCase()

  const handleSignOut = async () => {
    await signOut()
    resetAnalytics()
    clearLocalData()
    window.location.reload()
  }

  const exportCSV = () => exportLunaCSV(useLuna.getState())
  const deleteAccount = () => deleteLunaAccount({ session, clearLocalData })
  return (
    <div className="home-stage">
      <div className="blob-stage subtle" aria-hidden="true">
        <div className="breathing-blob" style={{ '--phase-color': T.accent }} />
      </div>
      <Screen>
        <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ padding: '20px 22px 0', color: T.text }}>
        <div style={{ fontFamily: T.serif, fontSize: 40, fontWeight: 500, letterSpacing: -1, lineHeight: 1 }}>{displayName ? `Hi, ${displayName.split(' ')[0]}.` : 'Welcome.'}</div>
        <div style={{ fontFamily: T.serif, fontSize: 14, color: T.muted, marginTop: 6, fontStyle: 'italic' }}>
          Your account, your cycle, your preferences.
        </div>
      </div>

      {/* Pro card */}
      <div style={{ padding: '20px 16px 8px' }}>
        <div className="glass-card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14, borderRadius: T.r }}>
          <div style={{ width: 50, height: 50, background: T.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.serif, fontSize: 22, fontWeight: 500, borderRadius: T.r }}>{initial}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14, fontFamily: T.sans }}>{isPro ? 'Luna Pro' : 'Luna Free'}</div>
            <div style={{ fontSize: 11.5, color: T.muted, fontFamily: T.sans }}>
              {isPro ? 'Active' : `Free trial · ${trialDaysLeft} days left`}
            </div>
          </div>
          {!isPro && (
            <button onClick={() => go('paywall')} style={{ background: T.accent, color: '#fff', border: 'none', padding: '8px 12px', cursor: 'pointer', fontFamily: T.sans, fontSize: 10, fontWeight: 700, letterSpacing: 1, borderRadius: T.r }}>UPGRADE</button>
          )}
        </div>
      </div>

      {session && <>
        <SectionLabel>Your account</SectionLabel>
        <div className="glass-card" style={{ margin: '0 16px', borderRadius: T.r, overflow: 'hidden' }}>
          <Row label="Signed in as" value={session.user.email} />
          <Row label="Sign out" onTap={handleSignOut} />
          {!session.user.email_confirmed_at && (
            <Row label="Verify email" onTap={async () => {
              try {
                const { supabase } = await import('../lib/supabase')
                const { error } = await supabase.auth.resend({
                  type: 'signup',
                  email: session.user.email,
                  options: { emailRedirectTo: `${window.location.origin}${window.location.pathname}` },
                })
                window.alert(error ? `Could not resend: ${error.message}` : `Verification email sent to ${session.user.email}.`)
              } catch (e) {
                window.alert(`Could not resend: ${e.message}`)
              }
            }} />
          )}
        </div>
        <div style={{ padding: '8px 22px', fontSize: 10.5, color: T.muted, fontFamily: T.sans, lineHeight: 1.4 }}>
          Sign in on any device to come back to your cycle.
        </div>
      </>}

      <SectionLabel>Your cycle</SectionLabel>
      <div className="glass-card" style={{ margin: '0 16px', borderRadius: T.r, overflow: 'hidden' }}>
        <Row label="Cycle & period length" value={`${cycleLength} / ${periodLength} days`} onTap={() => go('editCycleNumbers')} />
        <Row label="Update period start" onTap={() => go('editPeriodStart')} />
        <Row label="Period history" onTap={() => go('periodHistory')} />
        <Row label="Birth control" value={methodLabel} onTap={() => go('birthControl')} />
        <Row label="Pregnancy" value={pregLabel} onTap={() => go('pregnancy')} />
      </div>

      <SectionLabel>Privacy</SectionLabel>
      <div className="glass-card" style={{ margin: '0 16px', borderRadius: T.r, overflow: 'hidden' }}>
        <Row label="Your data, in the open" onTap={() => go('privacyDashboard')} />
        <Row label="Anonymous analytics" right={<Toggle on={settings.analytics} onChange={(v) => { updateSetting('analytics', v); setAnalyticsEnabled(v); if (v) capture('analytics_opted_in') }} />} />
        <Row label="Soft sounds" right={<Toggle on={Boolean(settings.sounds)} onChange={(v) => updateSetting('sounds', v)} />} />
        <Row label="Export everything" onTap={exportCSV} />
        <Row label="Doctor-ready PDF" onTap={() => go('watch')} />
        <Row label="Privacy Policy" onTap={() => go('privacy')} />
        <Row label="Terms" onTap={() => go('terms')} />
      </div>

      <SectionLabel>Gentle reminders</SectionLabel>
      <div className="glass-card" style={{ margin: '0 16px', borderRadius: T.r, overflow: 'hidden' }}>
        <Row label="Period reminder"  right={<Toggle on={settings.notifyPeriod} onChange={(v) => updateSetting('notifyPeriod', v)} />} />
        <Row label="Daily check-in"   right={<Toggle on={settings.notifyLog}    onChange={(v) => updateSetting('notifyLog', v)} />} />
        <Row label="Weekly editorial" right={<Toggle on={settings.notifyWeekly} onChange={(v) => updateSetting('notifyWeekly', v)} />} />
      </div>

      <SectionLabel>Your life stage</SectionLabel>
      <div className="glass-card" style={{ margin: '0 16px', borderRadius: T.r, overflow: 'hidden' }}>
        <Row label="Cycle tracking"
             value={settings?.lifecycle === 'ttc' ? 'Underlying' : 'Active'} />
        <Row label="Pregnancy"
             value={pregnancy?.active ? pregLabel : 'Available'}
             onTap={() => go('pregnancy')} />
        <Row label="Trying to conceive"
             value={settings?.lifecycle === 'ttc' ? 'Active' : 'Available'}
             onTap={() => {
               if (settings?.lifecycle === 'ttc') {
                 go('ttc')
               } else {
                 updateSetting('lifecycle', 'ttc')
                 go('ttc')
               }
             }} />
        <Row label="Perimenopause / menopause" value="Coming soon" />
      </div>
      <div style={{ padding: '8px 22px 12px', fontSize: 11, color: T.muted, fontFamily: T.serif, lineHeight: 1.55, fontStyle: 'italic' }}>
        Luna grows with you. Each stage gets its own thoughtful mode — built for the body you're in, not optimised against it.
      </div>

      <SectionLabel>Coming as part of Luna Pro</SectionLabel>
      <div className="glass-card" style={{ margin: '0 16px', borderRadius: T.r, overflow: 'hidden' }}>
        <Row label="Talk to Luna" value="Soon" />
        <Row label="Pregnancy companion" value="v1.1" />
        <Row label="Postpartum mode" value="v1.1" />
        <Row label="Long-form journal" value="Soon" />
        <Row label="Personalised monthly reflection" value="Soon" />
      </div>
      <div style={{ padding: '8px 22px 12px', fontSize: 11, color: T.muted, fontFamily: T.serif, lineHeight: 1.55, fontStyle: 'italic' }}>
        Pro is for the depth — the AI companion, the deep life-stage modes, the long-form reflective tools. Everything you need to take care of yourself stays free.
      </div>

      <SectionLabel>When something is happening</SectionLabel>
      <div className="glass-card" style={{ margin: '0 16px', borderRadius: T.r, overflow: 'hidden' }}>
        <Row label="Cramps right now" onTap={() => go('cramps')} />
        <Row label="Anxiety tonight" onTap={() => go('anxiety')} />
        <Row label="Can't sleep" onTap={() => go('insomnia')} />
        <Row label="UTI symptoms" onTap={() => go('utiHelper')} />
        <Row label="Period feels late" onTap={() => go('latePeriod')} />
        <Row label="Missed a pill" onTap={() => go('missedPill')} />
        <Row label="Sex has been hurting" onTap={() => go('painfulSex')} />
        <Row label="Postpartum bleeding" onTap={() => go('postpartumBleeding')} />
      </div>

      <SectionLabel>More from Luna</SectionLabel>
      <div className="glass-card" style={{ margin: '0 16px', borderRadius: T.r, overflow: 'hidden' }}>
        <Row label="For your mind and heart" onTap={() => go('reflect')} />
        <Row label="When something feels off" onTap={() => go('watch')} />
        <Row label="Your sexual life, your way" onTap={() => go('intimate')} />
        <Row label="Pregnancy loss support" onTap={() => go('pregnancyLoss')} />
        <Row label="For your next visit" onTap={() => go('cheatsheet')} />
        <Row label="Your year with Luna" onTap={() => go('yourYear')} />
        <Row label="View Pro features"  onTap={() => go('paywall')} />
        <Row label="Eat for your phase" onTap={() => go('nourish')} />
        <Row label="Care checklist"     onTap={() => go('care')} />
        <Row label="Delete my account"  onTap={deleteAccount} danger />
      </div>

      <div style={{ padding: '24px 22px 12px', textAlign: 'center', fontFamily: T.serif, fontStyle: 'italic', fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
        Luna — a Gloria app.<br/>
        <span style={{ fontStyle: 'normal', fontSize: 11, opacity: 0.7 }}>Named after a mother.</span>
      </div>
      <div style={{ height: 16 }} />
      </div>
      </Screen>
    </div>
  )
}
