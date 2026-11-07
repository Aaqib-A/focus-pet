import { useEffect } from 'react'
import { formatClock, isPaused, remainingMs } from '../core/timer'
import { useAppStore } from '../store/useAppStore'
import { useNow } from './useNow'

const BASE = 'Focus Pet'

/** Shows the countdown in the tab title, e.g. "🍖 18:42 · Feeding Mochi". */
export function useDocumentTitle() {
  const game = useAppStore((s) => s.game)
  const running = !!game && game.timer.phase !== 'idle' && !isPaused(game.timer)
  const now = useNow(1000, running)

  useEffect(() => {
    if (!game) {
      document.title = BASE
      return
    }
    const { timer, pet } = game
    const clock = formatClock(remainingMs(timer, now))
    const paused = isPaused(timer) ? ' (paused)' : ''
    document.title =
      timer.phase === 'feeding'
        ? `🍖 ${clock}${paused} · Feeding ${pet.name}`
        : timer.phase === 'resting'
          ? `💤 ${clock}${paused} · ${pet.name} is resting`
          : `${pet.name} is hungry · ${BASE}`
  }, [game, now])
}
