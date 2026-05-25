import { useState, useEffect } from 'react'
import { AppShell, TabBar } from './components/shared'
import useLuna from './store/useLuna'
import { hasVault, hasLegacyData, getMemoryKey } from './lib/crypto'
import { getSession, onAuthStateChange } from './lib/supabase'
import Lock         from './screens/Lock'

import Welcome      from './screens/Welcome'
import Onboarding   from './screens/Onboarding'
import Home         from './screens/Home'
import PhaseDetail  from './screens/PhaseDetail'
import Log          from './screens/Log'
import SymptomDetail from './screens/SymptomDetail'
import Calendar     from './screens/Calendar'
import Insights     from './screens/Insights'
import Library      from './screens/Library'
import Article      from './screens/Article'
import HealthWatch  from './screens/HealthWatch'
import Paywall      from './screens/Paywall'
import Settings     from './screens/Settings'
import Nourish      from './screens/Nourish'
import Care         from './screens/Care'
import Auth         from './screens/Auth'
import PrivacyPolicy from './screens/PrivacyPolicy'
import Terms         from './screens/Terms'
import PeriodHistory from './screens/PeriodHistory'
import EditPeriodStart from './screens/EditPeriodStart'

const TAB_SCREENS = ['home', 'calendar', 'library', 'settings', 'insights']

export default function App() {
  const initiallyLocked = (hasVault() || hasLegacyData()) && !getMemoryKey()
  const [locked, setLocked] = useState(initiallyLocked)

  const { screen, go, onboarded } = useLuna()
  const setSession = useLuna((s) => s.setSession)

  useEffect(() => {
    if (locked) return
    getSession().then(setSession)
    const unsub = onAuthStateChange(setSession)
    return unsub
  }, [locked, setSession])

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
      <ScreenRenderer screen={resolvedScreen} />
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
    default:         return <Home />
  }
}
