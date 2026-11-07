export type Species = 'cat' | 'dragon' | 'blob'

export type StageId = 'egg' | 'hatchling' | 'baby' | 'child' | 'teen' | 'adult'

export type Mood = 'happy' | 'neutral' | 'sad' | 'sleepy'

/** What the pet is visibly doing right now (drives animations). */
export type PetAction =
  | 'idle'
  | 'eating'
  | 'waiting' // feeding paused: food is out, pet is waiting
  | 'sleeping'
  | 'bathing'
  | 'playing'
  | 'cuddling'
  | 'treat'

export interface Stats {
  fullness: number
  energy: number
  cleanliness: number
  happiness: number
}

export type StatKey = keyof Stats

export interface Pet {
  name: string
  species: Species
  bornAt: number
  /** Total minutes of focused work the pet has been fed. Never decreases. */
  growthMinutes: number
  /** The egg hatches after the first *complete* feeding. */
  hatched: boolean
  stats: Stats
  treats: number
  /** Last time passive decay was applied. */
  lastDecayAt: number
}

export type Phase = 'idle' | 'feeding' | 'resting'
export type RestKind = 'short' | 'long'

export interface TimerState {
  phase: Phase
  restKind: RestKind | null
  /** Full length of the current phase in ms. */
  durationMs: number
  /** Wall-clock end time while running; null while paused or idle. */
  endsAt: number | null
  /** Remaining ms while paused; null while running or idle. */
  pausedRemainingMs: number | null
  activeTodoId: string | null
  /** Complete feeds since the last long rest. */
  feedsSinceLongRest: number
  /** Ball throws used in the current break window. */
  playsThisBreak: number
}

export interface Todo {
  id: string
  title: string
  done: boolean
  createdAt: number
  completedAt: number | null
  /** How many feeds (focus sessions) the user expects this to take. */
  estimateMeals: number | null
  mealsSpent: number
  minutesSpent: number
}

export interface CycleConfig {
  feedMin: number
  restMin: number
  longRestMin: number
  /** Long rest after this many complete feeds; 0 = never. */
  longRestEvery: number
}

export type PresetId = 'biwer2023' | 'niosh' | 'desktime' | 'custom'

export interface Settings {
  presetId: PresetId
  custom: CycleConfig
  sound: boolean
  notifications: boolean
  autoStartRest: boolean
}

export interface DayStats {
  meals: number
  minutes: number
  tasksDone: number
}

/** Keyed by local date, `YYYY-MM-DD`. */
export type DayLog = Record<string, DayStats>

/** Everything the game rules operate on. */
export interface GameState {
  pet: Pet
  timer: TimerState
  todos: Todo[]
  dayLog: DayLog
}

export type GameEvent =
  | { type: 'feedDone'; minutes: number; todoTitle: string | null; restKind: RestKind }
  | { type: 'feedStopped'; minutes: number }
  | { type: 'restDone'; kind: RestKind }
  | { type: 'restSkipped' }
  | { type: 'hatched' }
  | { type: 'stageUp'; stage: StageId }
