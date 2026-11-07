import type { Mood, Pet, StatKey, Stats } from './types'

export const STAT_MAX = 100
/** Passive decay never pushes a stat below this: the pet gets sad, never dies. */
export const DECAY_FLOOR = 10
/** Time away is only caught up to this much, so a holiday doesn't wreck the pet. */
export const MAX_CATCHUP_MS = 48 * 60 * 60 * 1000

/** Gentle per-hour drift while time passes. Energy slowly recovers on its own. */
export const DRIFT_PER_HOUR: Stats = {
  fullness: -4,
  energy: 2,
  cleanliness: -2,
  happiness: -3,
}

export const INITIAL_STATS: Stats = {
  fullness: 60,
  energy: 80,
  cleanliness: 100,
  happiness: 70,
}

export const MAX_PLAYS_PER_BREAK = 5

export const EFFECTS = {
  fullFeed: (minutes: number): Partial<Stats> => ({
    fullness: 3 * minutes,
    energy: -15,
    cleanliness: -10, // messy eater
    happiness: 5,
  }),
  partialFeed: (minutes: number): Partial<Stats> => ({
    fullness: 3 * minutes,
    happiness: -5,
  }),
  shortRest: { energy: 30, happiness: 2 } as Partial<Stats>,
  longRest: { energy: 60, happiness: 5 } as Partial<Stats>,
  skipRest: { energy: -10 } as Partial<Stats>,
  bath: { cleanliness: STAT_MAX, happiness: 5 } as Partial<Stats>, // cleanliness is set, see bathe()
  play: { happiness: 8, energy: -3 } as Partial<Stats>,
  cuddle: { happiness: 2 } as Partial<Stats>,
  treat: { happiness: 15, fullness: 5 } as Partial<Stats>,
}

export const clampStat = (n: number) => Math.min(STAT_MAX, Math.max(0, n))

export function applyDelta(stats: Stats, delta: Partial<Stats>): Stats {
  const out = { ...stats }
  for (const k of Object.keys(delta) as StatKey[]) {
    out[k] = clampStat(out[k] + (delta[k] ?? 0))
  }
  return out
}

export function driftStats(stats: Stats, elapsedMs: number): Stats {
  const hours = Math.min(Math.max(0, elapsedMs), MAX_CATCHUP_MS) / 3_600_000
  const out = { ...stats }
  for (const k of Object.keys(DRIFT_PER_HOUR) as StatKey[]) {
    const change = DRIFT_PER_HOUR[k] * hours
    if (change < 0) {
      // Decay stops at the floor, but never raises a stat that is already below it.
      out[k] = out[k] <= DECAY_FLOOR ? out[k] : Math.max(DECAY_FLOOR, out[k] + change)
    } else {
      out[k] = clampStat(out[k] + change)
    }
  }
  return out
}

export function applyDrift(pet: Pet, now: number): Pet {
  const elapsed = now - pet.lastDecayAt
  if (elapsed <= 0) return pet
  return { ...pet, stats: driftStats(pet.stats, elapsed), lastDecayAt: now }
}

export function moodFor(stats: Stats): Mood {
  if (stats.energy < 25) return 'sleepy'
  if (stats.happiness < 30 || stats.cleanliness < 30 || stats.fullness < 20) return 'sad'
  if (stats.happiness >= 70 && stats.cleanliness >= 50 && stats.fullness >= 40) return 'happy'
  return 'neutral'
}

export const DIRTY_BELOW = 40
export const isDirty = (stats: Stats) => stats.cleanliness < DIRTY_BELOW
