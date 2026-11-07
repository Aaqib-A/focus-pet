import { useState } from 'react'
import { CareCard } from './components/care/CareCard'
import { AdoptPet } from './components/onboarding/AdoptPet'
import { PetCard } from './components/pet/PetCard'
import { ScienceDialog } from './components/science/ScienceDialog'
import { SettingsDialog } from './components/settings/SettingsDialog'
import { TodayStats } from './components/stats/TodayStats'
import { TimerPanel } from './components/timer/TimerPanel'
import { TodoList } from './components/todos/TodoList'
import { Toasts } from './components/ui/Toasts'
import { useDocumentTitle } from './hooks/useDocumentTitle'
import { useGameClock } from './hooks/useGameClock'
import { SPEED } from './lib/speed'
import { useAppStore } from './store/useAppStore'

type DialogName = 'settings' | 'science' | null

export default function App() {
  useGameClock()
  useDocumentTitle()
  const hasPet = useAppStore((s) => s.game != null)
  const phase = useAppStore((s) => s.game?.timer.phase)
  const [dialog, setDialog] = useState<DialogName>(null)

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img src="/favicon.svg" alt="" className="brand-mark" />
          <span>Focus Pet</span>
          {SPEED !== 1 && <span className="badge badge--warn">dev speed ×{SPEED}</span>}
        </div>
        {hasPet && (
          <nav className="topbar-actions" aria-label="App">
            <button type="button" className="btn btn--ghost" onClick={() => setDialog('science')}>
              📚 <span className="hide-sm">The science</span>
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setDialog('settings')}>
              ⚙️ <span className="hide-sm">Settings</span>
            </button>
          </nav>
        )}
      </header>

      {hasPet ? (
        <main className="layout">
          <div className="col">
            <PetCard />
            {/* Keyed by phase so in-progress confirmations reset when a phase ends. */}
            <TimerPanel key={phase} onOpenScience={() => setDialog('science')} />
            <CareCard />
          </div>
          <div className="col">
            <TodoList />
            <TodayStats />
          </div>
        </main>
      ) : (
        <AdoptPet />
      )}

      <SettingsDialog open={dialog === 'settings'} onClose={() => setDialog(null)} onOpenScience={() => setDialog('science')} />
      <ScienceDialog open={dialog === 'science'} onClose={() => setDialog(null)} />
      <Toasts />
    </div>
  )
}
