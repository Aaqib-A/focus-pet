import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'

/**
 * Drives the game clock: finishes phases when their end time passes (checked
 * twice a second and whenever the tab becomes visible again) and applies the
 * gentle needs drift once a minute. The countdown itself is computed from
 * timestamps, so throttled background tabs stay accurate.
 */
export function useGameClock() {
  const tick = useAppStore((s) => s.tick)
  const drift = useAppStore((s) => s.drift)

  useEffect(() => {
    const t = setInterval(tick, 500)
    const d = setInterval(drift, 60_000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        drift()
        tick()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      clearInterval(t)
      clearInterval(d)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [tick, drift])
}
