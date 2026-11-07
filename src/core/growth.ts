import type { StageId } from './types'

export interface StageInfo {
  id: StageId
  label: string
  /** Total fed minutes needed to reach this stage (once hatched). */
  minMinutes: number
  /** Visual size multiplier at the start of the stage. */
  size: number
}

export const EGG_SIZE = 0.7

/** Hatchling starts as soon as the egg hatches (after the first complete feed). */
export const STAGES: readonly StageInfo[] = [
  { id: 'hatchling', label: 'Hatchling', minMinutes: 0, size: 0.5 },
  { id: 'baby', label: 'Baby', minMinutes: 120, size: 0.62 },
  { id: 'child', label: 'Child', minMinutes: 360, size: 0.75 },
  { id: 'teen', label: 'Teen', minMinutes: 900, size: 0.88 },
  { id: 'adult', label: 'Adult', minMinutes: 1800, size: 1.0 },
]

/** Adults keep growing a little until this many minutes, up to ADULT_MAX_SIZE. */
export const ADULT_FULL_MINUTES = 3600
export const ADULT_MAX_SIZE = 1.1

export const STAGE_ORDER: readonly StageId[] = ['egg', ...STAGES.map((s) => s.id)]

export function stageIndex(stage: StageId): number {
  return STAGE_ORDER.indexOf(stage)
}

export interface GrowthInfo {
  stage: StageId
  label: string
  /** Continuous size multiplier: the pet visibly grows with every minute fed. */
  size: number
  /** 0..1 progress through the current stage. */
  progress: number
  next: StageInfo | null
  minutesToNext: number | null
}

export function growthInfo(growthMinutes: number, hatched: boolean): GrowthInfo {
  if (!hatched) {
    return {
      stage: 'egg',
      label: 'Egg',
      size: EGG_SIZE,
      progress: 0,
      next: STAGES[0],
      minutesToNext: null, // hatches on the first complete feed, not by minutes
    }
  }
  const m = Math.max(0, growthMinutes)
  let i = STAGES.length - 1
  while (i > 0 && m < STAGES[i].minMinutes) i--
  const cur = STAGES[i]
  const next = STAGES[i + 1] ?? null

  if (!next) {
    const span = ADULT_FULL_MINUTES - cur.minMinutes
    const progress = Math.min(1, (m - cur.minMinutes) / span)
    return {
      stage: cur.id,
      label: cur.label,
      size: cur.size + (ADULT_MAX_SIZE - cur.size) * progress,
      progress,
      next: null,
      minutesToNext: null,
    }
  }

  const progress = (m - cur.minMinutes) / (next.minMinutes - cur.minMinutes)
  return {
    stage: cur.id,
    label: cur.label,
    size: cur.size + (next.size - cur.size) * progress,
    progress,
    next,
    minutesToNext: Math.ceil(next.minMinutes - m),
  }
}

export function stageLabel(stage: StageId): string {
  return stage === 'egg' ? 'Egg' : (STAGES.find((s) => s.id === stage)?.label ?? stage)
}

export function stageFor(growthMinutes: number, hatched: boolean): StageId {
  return growthInfo(growthMinutes, hatched).stage
}
