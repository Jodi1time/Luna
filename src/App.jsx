import { useEffect, lazy, Suspense, useState } from 'react'
import { AppShell, TabBar } from './components/shared'
import GradualBlur from './components/GradualBlur'

// Pick a time-of-day class. Re-checked every 15 minutes.
function timeClass() {
  const h = new Date().getHours()
  if (h < 11) return 'time-morning'
  if (h < 17) return 'time-midday'
  if (h < 21) return 'time-evening'
  return 'time-night'
}
import useLuna from './store/useLuna'
import { getSession, onAuthStateChange } from './lib/supabase'
import { StatusView } from './components/StatusView'

import Welcome      from './screens/Welcome'
import Onboarding   from './screens/Onboarding'
import Home         from './screens/Home'
import Log          from './screens/Log'
import Calendar     from './screens/Calendar'
import Insights     from './screens/Insights'
import Library      from './screens/Library'
import Settings     from './screens/Settings'
import Auth         from './screens/Auth'

const PhaseDetail     = lazy(() => import('./screens/PhaseDetail'))
const SymptomDetail   = lazy(() => import('./screens/SymptomDetail'))
const Article         = lazy(() => import('./screens/Article'))
const HealthWatch     = lazy(() => import('./screens/HealthWatch'))
const Paywall         = lazy(() => import('./screens/Paywall'))
const Nourish         = lazy(() => import('./screens/Nourish'))
const Care            = lazy(() => import('./screens/Care'))
const PrivacyPolicy   = lazy(() => import('./screens/PrivacyPolicy'))
const Terms           = lazy(() => import('./screens/Terms'))
const PeriodHistory   = lazy(() => import('./screens/PeriodHistory'))
const EditPeriodStart = lazy(() => import('./screens/EditPeriodStart'))
const EditCycleNumbers = lazy(() => import('./screens/EditCycleNumbers'))
const BirthControl    = lazy(() => import('./screens/BirthControl'))
const Pregnancy       = lazy(() => import('./screens/Pregnancy'))
const Cheatsheet      = lazy(() => import('./screens/Cheatsheet'))
const PrivacyDashboard = lazy(() => import('./screens/PrivacyDashboard'))
const YourYear        = lazy(() => import('./screens/YourYear'))
const IntimateHealth  = lazy(() => import('./screens/IntimateHealth'))
const PregnancyLoss   = lazy(() => import('./screens/PregnancyLoss'))
const CrampsHelper    = lazy(() => import('./screens/CrampsHelper'))
const Reflect         = lazy(() => import('./screens/Reflect'))
const AnxietyHelper   = lazy(() => import('./screens/AnxietyHelper'))
const InsomniaHelper  = lazy(() => import('./screens/InsomniaHelper'))
const UTIHelper       = lazy(() => import('./screens/UTIHelper'))
const LatePeriodHelper = lazy(() => import('./screens/LatePeriodHelper'))
const MissedPillHelper = lazy(() => import('./screens/MissedPillHelper'))
const TTC             = lazy(() => import('./screens/TTC'))
const PainfulSexHelper = lazy(() => import('./screens/PainfulSexHelper'))
const PostpartumBleedingHelper = lazy(() => import('./screens/PostpartumBleedingHelper'))
const HeavyHelper     = lazy(() => import('./screens/HeavyHelper'))
const Journal         = lazy(() => import('./screens/Journal'))
const ResetPassword   = lazy(() => import('./screens/ResetPassword'))
const CycleSchools    = lazy(() => import('./screens/CycleSchools'))
const CycleSchool     = lazy(() => import('./screens/CycleSchool'))
const Conditions      = lazy(() => import('./screens/Conditions'))
const AskLuna         = lazy(() => import('./screens/AskLuna'))

const TAB_SCREENS = ['home', 'calendar', 'library', 'settings', 'insights']

export default function App() {
  const { screen, go, onboarded } = useLuna()
  const setSession = useLuna((s) => s.setSession)
  const hydrateFromCloud = useLuna((s) => s.hydrateFromCloud)
  const analyticsEnabled = useLuna((s) => s.settings?.analytics)
  const [tod, setTod] = useState(timeClass())
  useEffect(() => {
    const id = setInterval(() => setTod(timeClass()), 15 * 60 * 1000)
    return () => clearInterval(id)
  }, [])
  // Apply the time-of-day class to <body> so the page background
  // shifts warmth subtly across the day.
  useEffect(() => {
    if (typeof document === 'undefined') return
    document.body.classList.remove('time-morning', 'time-midday', 'time-evening', 'time-night')
    document.body.classList.add(tod)
  }, [tod])

  useEffect(() => {
    // Detect a password-reset deep-link on cold start. Supabase
    // appends type=recovery (plus access/refresh tokens) to the URL
    // hash when the user clicks the email link. We route them to
    // the reset screen before doing anything else.
    const hash = window.location.hash || ''
    const isRecovery = hash.includes('type=recovery')
    if (isRecovery) {
      useLuna.getState().go('resetPassword')
    }
    // Restore the existing Supabase session on cold start. If present,
    // pull fresh profile + logs from the cloud so we paint correct
    // state even if the localStorage cache is stale.
    getSession().then((s) => {
      setSession(s)
      // Skip auto-hydrate during a recovery flow — the temporary
      // recovery session shouldn't pull the user's data into the
      // local store. We just want them to set a new password.
      if (s?.user && !isRecovery) {
        hydrateFromCloud().catch(() => {})
      }
    })
    // On signin/signout/recovery events, sync the auth state and
    // either hydrate or route to the reset screen.
    const unsub = onAuthStateChange((session, event) => {
      setSession(session)
      if (event === 'PASSWORD_RECOVERY') {
        useLuna.getState().go('resetPassword')
        return
      }
      if (session?.user) {
        hydrateFromCloud().catch(() => {})
      }
    })
    return unsub
  }, [setSession, hydrateFromCloud])

  useEffect(() => {
    import('./lib/posthog').then(({ syncAnalyticsState, capture }) => {
      syncAnalyticsState(Boolean(analyticsEnabled))
      if (analyticsEnabled) capture('app_opened')
    })
  }, [analyticsEnabled])

  // Route to the right starting screen on each session.
  // - If not onboarded: allow Welcome, the onboarding steps, Auth (reached
  //   via "Already have an account?" on Welcome), and the legal screens
  //   linked from Welcome. Anything else falls back to Welcome.
  // - If onboarded but the session restored to 'welcome' (since screen
  //   isn't persisted) or any onboarding step → Home.
  const resolvedScreen = !onboarded
    ? (['welcome','onb1','onb2','onb3','auth','terms','privacy','resetPassword'].includes(screen) ? screen : 'welcome')
    : (['welcome','onb1','onb2','onb3'].includes(screen) ? 'home' : screen)

  return (
    <AppShell>
      <Suspense fallback={<StatusView loading loadingMessage="LOADING" />}>
        <ScreenRenderer screen={resolvedScreen} />
      </Suspense>
      {TAB_SCREENS.includes(resolvedScreen) && (
        <>
          {/* Soft fade — the scroll content dissolves into atmosphere
              before meeting the tab bar instead of cutting hard.
              Renders above content (z 40), below the tab bar (z 50).
              Positioned just above the tab bar's height + safe area
              so the fade sits in the right band. */}
          <div style={{ position: 'fixed', left: 0, right: 0, bottom: 'calc(54px + env(safe-area-inset-bottom, 8px))', height: 70, pointerEvents: 'none', zIndex: 40 }}>
            <GradualBlur position="bottom" height="100%" strength={1.6} divCount={6} curve="bezier" exponential />
          </div>
          <TabBar active={resolvedScreen} onChange={go} />
        </>
      )}
    </AppShell>
  )
}

function ScreenRenderer({ screen }) {
  switch (screen) {
    case 'welcome':  return <Welcome />
    case 'onb1':     return <Onboarding step={1} />
    case 'onb2':     return <Onboarding step={2} />
    case 'onb3':     return <Onboarding step={3} />
    case 'nourish':  return <Nourish />
    case 'care':     return <Care />
    case 'home':     return <Home />
    case 'phase':    return <PhaseDetail />
    case 'log':      return <Log />
    case 'symptom':  return <SymptomDetail />
    case 'calendar': return <Calendar />
    case 'insights': return <Insights />
    case 'library':  return <Library />
    case 'article':  return <Article />
    case 'watch':    return <HealthWatch />
    case 'paywall':  return <Paywall />
    case 'settings': return <Settings />
    case 'auth':     return <Auth />
    case 'privacy':  return <PrivacyPolicy />
    case 'terms':    return <Terms />
    case 'periodHistory': return <PeriodHistory />
    case 'editPeriodStart': return <EditPeriodStart />
    case 'editCycleNumbers': return <EditCycleNumbers />
    case 'birthControl': return <BirthControl />
    case 'pregnancy': return <Pregnancy />
    case 'cheatsheet': return <Cheatsheet />
    case 'privacyDashboard': return <PrivacyDashboard />
    case 'yourYear': return <YourYear />
    case 'intimate': return <IntimateHealth />
    case 'pregnancyLoss': return <PregnancyLoss />
    case 'cramps': return <CrampsHelper />
    case 'reflect': return <Reflect />
    case 'anxiety': return <AnxietyHelper />
    case 'insomnia': return <InsomniaHelper />
    case 'utiHelper': return <UTIHelper />
    case 'latePeriod': return <LatePeriodHelper />
    case 'missedPill': return <MissedPillHelper />
    case 'ttc': return <TTC />
    case 'painfulSex': return <PainfulSexHelper />
    case 'postpartumBleeding': return <PostpartumBleedingHelper />
    case 'heavy': return <HeavyHelper />
    case 'journal': return <Journal />
    case 'resetPassword': return <ResetPassword />
    case 'cycleSchools': return <CycleSchools />
    case 'cycleSchool': return <CycleSchool />
    case 'conditions': return <Conditions />
    case 'askLuna':    return <AskLuna />
    default:         return <Home />
  }
}
