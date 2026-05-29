import { useState, useEffect, lazy, Suspense } from 'react'
import { AppShell, TabBar } from './components/shared'
import useLuna from './store/useLuna'
import { hasVault, hasLegacyData, getMemoryKey } from './lib/crypto'
import { getSession, onAuthStateChange } from './lib/supabase'
import { StatusView } from './components/StatusView'
import Lock         from './screens/Lock'

import Welcome      from './screens/Welcome'
import Onboarding   from './screens/Onboarding'
import Home         from './screens/Home'
import Log          from './screens/Log'
import Calendar     from './screens/Calendar'
import Insights     from './screens/Insights'
import Library      from './screens/Library'
import Settings     from './screens/Settings'
import Auth         from './screens/Auth'
import BiometricPrompt from './screens/BiometricPrompt'

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
const BirthControl    = lazy(() => import('./screens/BirthControl'))
const Pregnancy       = lazy(() => import('./screens/Pregnancy'))
const EnableBiometric = lazy(() => import('./screens/EnableBiometric'))

const TAB_SCREENS = ['home', 'calendar', 'library', 'settings', 'insights']

export default function App() {
  const initiallyLocked = (hasVault() || hasLegacyData()) && !getMemoryKey()
  const [locked, setLocked] = useState(initiallyLocked)

  const { screen, go, onboarded } = useLuna()
  const setSession = useLuna((s) => s.setSession)
  const analyticsEnabled = useLuna((s) => s.settings?.analytics)

  useEffect(() => {
    if (locked) return
    getSession().then(setSession)
    const unsub = onAuthStateChange(setSession)
    return unsub
  }, [locked, setSession])

  // Sync the persisted analytics-opt-in toggle into PostHog so users
  // who opted in previously stay opted in across sessions.
  useEffect(() => {
    if (locked) return
    import('./lib/posthog').then(({ syncAnalyticsState, capture }) => {
      syncAnalyticsState(Boolean(analyticsEnabled))
      if (analyticsEnabled) capture('app_opened')
    })
  }, [locked, analyticsEnabled])

  if (locked) {
    return <AppShell><Lock onUnlocked={() => setLocked(false)} /></AppShell>
  }

  // Route to the right starting screen on each session.
  // - If not onboarded and they're not already in the onboarding flow → Welcome
  // - If onboarded but the session restored to 'welcome' (since screen isn't persisted)
  //   or any onboarding step → Home
  const resolvedScreen = !onboarded
    ? (['welcome','onb1','onb2','onb3'].includes(screen) ? screen : 'welcome')
    : (['welcome','onb1','onb2','onb3'].includes(screen) ? 'home' : screen)

  return (
    <AppShell>
      <Suspense fallback={<StatusView loading loadingMessage="LOADING" />}>
        <ScreenRenderer screen={resolvedScreen} />
      </Suspense>
      {TAB_SCREENS.includes(resolvedScreen) && (
        <TabBar active={resolvedScreen} onChange={go} />
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
    case 'birthControl': return <BirthControl />
    case 'enableBiometric': return <EnableBiometric />
    case 'pregnancy': return <Pregnancy />
    default:         return <Home />
  }
}
