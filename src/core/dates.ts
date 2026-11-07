import type { DayLog, DayStats } from './types'

const pad = (n: number) => String(n).padStart(2, '0')

/** Local calendar day, `YYYY-MM-DD`. */
export function dayKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** The last `n` local day keys, oldest first, ending with today. */
export function lastDays(now: number, n: number): string[] {
  const out: string[] = []
  const d = new Date(now)
  d.setHours(12, 0, 0, 0) // midday avoids DST edge cases
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d)
    x.setDate(d.getDate() - i)
    out.push(dayKey(x.getTime()))
  }
  return out
}

export const EMPTY_DAY: DayStats = { meals: 0, minutes: 0, tasksDone: 0 }

export function dayStats(log: DayLog, key: string): DayStats {
  return log[key] ?? EMPTY_DAY
}

export function bumpDay(log: DayLog, ts: number, delta: Partial<DayStats>): DayLog {
  const key = dayKey(ts)
  const cur = log[key] ?? EMPTY_DAY
  return {
    ...log,
    [key]: {
      meals: Math.max(0, cur.meals + (delta.meals ?? 0)),
      minutes: Math.max(0, cur.minutes + (delta.minutes ?? 0)),
      tasksDone: Math.max(0, cur.tasksDone + (delta.tasksDone ?? 0)),
    },
  }
}

/**
 * Consecutive days with at least one complete feed. Today counts if it has a
 * feed; if it doesn't yet, the streak is still alive from yesterday.
 */
export function streak(log: DayLog, now: number): number {
  const days = lastDays(now, 366).reverse() // today first
  let count = 0
  for (let i = 0; i < days.length; i++) {
    const fed = (log[days[i]]?.meals ?? 0) > 0
    if (fed) count++
    else if (i === 0) continue
    else break
  }
  return count
}
