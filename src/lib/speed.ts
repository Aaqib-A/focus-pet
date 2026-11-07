/**
 * Dev-only time warp for manual testing: `?speed=60` makes one minute pass in
 * one second. Growth and stats still use the nominal minutes, so a pet can be
 * raised to adulthood in a few minutes of clicking. Ignored in production.
 */
function readSpeed(): number {
  if (!import.meta.env.DEV || typeof location === 'undefined') return 1
  const n = Number(new URLSearchParams(location.search).get('speed'))
  return Number.isFinite(n) && n > 0 ? n : 1
}

export const SPEED = readSpeed()
export const MINUTE_MS = 60_000 / SPEED
