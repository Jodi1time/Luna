import { useState } from 'react'
import { AppShell, TabBar } from './components/shared'
import useLuna from './store/useLuna'
import { hasVault, hasLegacyData, getMemoryKey } from './lib/crypto'
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

const TAB_SCREENS = ['home', 'calendar', 'library', 'settings', 'insights']

export default function App() {
  const initiallyLocked = (hasVault() || hasLegacyData()) && !getMemoryKey()
  const [locked, setLocked] = useState(initiallyLocked)

  const { screen, go, onboarded } = useLuna()

  if (locked) {
    return <AppShell><Lock onUnlocked={() => setLocked(false)} /></AppShell>
  }

  // Auto-redirect if not onboarded
  const resolvedScreen = (!onboarded && !['welcome','onb1','onb2','onb3','onb4'].includes(screen))
    ? 'welcome'
    : screen

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
    case 'onb4':     return <Onboarding step={4} />
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
    default:         return <Home />
  }
}
