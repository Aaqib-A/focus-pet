import { describe, expect, it } from 'vitest'
import { dayKey, streak } from './dates'
import {
  advance,
  bathe,
  completeFeed,
  giveTreat,
  newGame,
  newPet,
  play,
  skipRest,
  startFeed,
  stopFeed,
  toggleTodo,
  type Ctx,
} from './game'
import { ADULT_MAX_SIZE, growthInfo } from './growth'
import { DECAY_FLOOR, MAX_CATCHUP_MS, MAX_PLAYS_PER_BREAK, driftStats, moodFor } from './needs'
import { PRESETS } from './presets'
import { pauseTimer, remainingMs, resumeTimer } from './timer'
import type { GameState, Todo } from './types'

const MIN = 60_000
const T0 = new Date(2026, 10, 5, 9, 0, 0).getTime()

const ctx = (now: number, over: Partial<Ctx> = {}): Ctx => ({
  now,
  cycle: PRESETS.biwer2023.cycle,
  minuteMs: MIN,
  autoStartRest: true,
  ...over,
})

const todo = (id: string, title = id): Todo => ({
  id,
  title,
  done: false,
  createdAt: T0,
  completedAt: null,
  estimateMeals: 2,
  mealsSpent: 0,
  minutesSpent: 0,
})

function game(): GameState {
  return { ...newGame(newPet('Mochi', 'cat', T0)), todos: [todo('a', 'Write report')] }
}

/** Run one full feed + rest cycle starting at `now`; returns state and end time. */
function cycle(s: GameState, now: number) {
  const fed = startFeed(s, ctx(now), 'a')
  const feedEnd = now + fed.timer.durationMs
  const afterFeed = advance(fed, ctx(feedEnd)).state
  const restEnd = feedEnd + afterFeed.timer.durationMs
  return { state: advance(afterFeed, ctx(restEnd)).state, end: restEnd, restKind: afterFeed.timer.restKind }
}

describe('feeding', () => {
  it('starts a feed of the preset length and targets the chosen todo', () => {
    const s = startFeed(game(), ctx(T0), 'a')
    expect(s.timer.phase).toBe('feeding')
    expect(s.timer.durationMs).toBe(24 * MIN)
    expect(s.timer.endsAt).toBe(T0 + 24 * MIN)
    expect(s.timer.activeTodoId).toBe('a')
  })

  it('a complete feed hatches the egg, grows the pet, credits the todo and day, and starts a short rest', () => {
    const s = startFeed(game(), ctx(T0), 'a')
    const { state, events } = completeFeed(s, ctx(T0 + 24 * MIN))
    expect(state.pet.hatched).toBe(true)
    expect(state.pet.growthMinutes).toBe(24)
    expect(state.todos[0]).toMatchObject({ mealsSpent: 1, minutesSpent: 24 })
    expect(state.dayLog[dayKey(T0)]).toEqual({ meals: 1, minutes: 24, tasksDone: 0 })
    expect(state.timer).toMatchObject({ phase: 'resting', restKind: 'short', durationMs: 6 * MIN })
    expect(events.map((e) => e.type)).toEqual(['feedDone', 'hatched'])
    expect(events[0]).toMatchObject({ todoTitle: 'Write report', minutes: 24 })
  })

  it('stopping early gives partial growth for whole minutes eaten, no meal, no hatch', () => {
    const s = startFeed(game(), ctx(T0), 'a')
    const { state } = stopFeed(s, ctx(T0 + 10.7 * MIN))
    expect(state.pet.growthMinutes).toBe(10)
    expect(state.pet.hatched).toBe(false)
    expect(state.todos[0]).toMatchObject({ mealsSpent: 0, minutesSpent: 10 })
    expect(state.dayLog[dayKey(T0)]).toEqual({ meals: 0, minutes: 10, tasksDone: 0 })
    expect(state.timer.phase).toBe('idle')
    expect(state.pet.stats.happiness).toBeLessThan(game().pet.stats.happiness)
  })

  it('pausing freezes the countdown; resuming continues where it left off', () => {
    const s = startFeed(game(), ctx(T0), 'a')
    const paused = pauseTimer(s.timer, T0 + 5 * MIN)
    expect(remainingMs(paused, T0 + 60 * MIN)).toBe(19 * MIN)
    const resumed = resumeTimer(paused, T0 + 60 * MIN)
    expect(resumed.endsAt).toBe(T0 + 79 * MIN)
  })

  it('cannot start a feed unless idle', () => {
    const s = startFeed(game(), ctx(T0), 'a')
    expect(startFeed(s, ctx(T0 + MIN), 'a')).toBe(s)
  })
})

describe('rest cycle', () => {
  it('every 4th rest is a 20-min long rest (Biwer preset), then the count resets', () => {
    let s = game()
    let now = T0
    const kinds: (string | null)[] = []
    for (let i = 0; i < 5; i++) {
      const r = cycle(s, now)
      kinds.push(r.restKind)
      s = r.state
      now = r.end
    }
    expect(kinds).toEqual(['short', 'short', 'short', 'long', 'short'])
    expect(s.timer.phase).toBe('idle')
    expect(s.pet.growthMinutes).toBe(5 * 24)
  })

  it('NIOSH preset gives a long rest every 2 feeds; DeskTime never does', () => {
    const niosh = { cycle: PRESETS.niosh.cycle }
    let s = startFeed(game(), ctx(T0, niosh))
    s = completeFeed(s, ctx(T0 + 55 * MIN, niosh)).state
    expect(s.timer.restKind).toBe('short')
    s = { ...s, timer: { ...s.timer, phase: 'idle' } }
    s = startFeed(s, ctx(T0, niosh))
    s = completeFeed(s, ctx(T0 + 55 * MIN, niosh)).state
    expect(s.timer).toMatchObject({ restKind: 'long', durationMs: 15 * MIN })

    const dt = { cycle: PRESETS.desktime.cycle }
    let d = game()
    for (let i = 0; i < 6; i++) {
      d = startFeed({ ...d, timer: { ...d.timer, phase: 'idle' } }, ctx(T0, dt))
      d = completeFeed(d, ctx(T0, dt)).state
      expect(d.timer).toMatchObject({ restKind: 'short', durationMs: 17 * MIN })
    }
  })

  it('with auto-start off, the rest waits (paused) for the user', () => {
    const s = startFeed(game(), ctx(T0), 'a')
    const { state } = completeFeed(s, ctx(T0 + 24 * MIN, { autoStartRest: false }))
    expect(state.timer).toMatchObject({ phase: 'resting', endsAt: null, pausedRemainingMs: 6 * MIN })
  })

  it('skipping rest costs energy compared with resting', () => {
    const s = completeFeed(startFeed(game(), ctx(T0), 'a'), ctx(T0 + 24 * MIN)).state
    const skipped = skipRest(s, ctx(T0 + 24 * MIN)).state
    const rested = advance(s, ctx(T0 + 30 * MIN)).state
    expect(skipped.timer.phase).toBe('idle')
    expect(skipped.pet.stats.energy).toBeLessThan(rested.pet.stats.energy)
  })

  it('catches up after the tab was closed: feed and rest both finish', () => {
    const s = startFeed(game(), ctx(T0), 'a')
    const { state, events } = advance(s, ctx(T0 + 3 * 60 * MIN))
    expect(state.timer.phase).toBe('idle')
    expect(state.pet.growthMinutes).toBe(24)
    expect(events.map((e) => e.type)).toEqual(['feedDone', 'hatched', 'restDone'])
  })

  it('does nothing before the end time', () => {
    const s = startFeed(game(), ctx(T0), 'a')
    expect(advance(s, ctx(T0 + 23 * MIN)).state).toBe(s)
  })
})

describe('growth', () => {
  it('egg until hatched, then stages by total minutes fed', () => {
    expect(growthInfo(500, false).stage).toBe('egg')
    expect(growthInfo(0, true).stage).toBe('hatchling')
    expect(growthInfo(119, true).stage).toBe('hatchling')
    expect(growthInfo(120, true).stage).toBe('baby')
    expect(growthInfo(360, true).stage).toBe('child')
    expect(growthInfo(900, true).stage).toBe('teen')
    expect(growthInfo(1800, true).stage).toBe('adult')
  })

  it('size grows continuously with every minute and caps for adults', () => {
    let prev = 0
    for (let m = 0; m <= 4000; m += 50) {
      const { size } = growthInfo(m, true)
      expect(size).toBeGreaterThanOrEqual(prev)
      prev = size
    }
    expect(growthInfo(10_000, true).size).toBeCloseTo(ADULT_MAX_SIZE)
  })

  it('emits stageUp when a feed crosses a threshold', () => {
    const s = game()
    const nearBaby = { ...s, pet: { ...s.pet, hatched: true, growthMinutes: 110 } }
    const { events } = completeFeed(startFeed(nearBaby, ctx(T0)), ctx(T0 + 24 * MIN))
    expect(events).toContainEqual({ type: 'stageUp', stage: 'baby' })
  })
})

describe('needs', () => {
  it('decays gently, never below the floor, and caps catch-up time', () => {
    const stats = { fullness: 50, energy: 50, cleanliness: 50, happiness: 50 }
    const after2h = driftStats(stats, 2 * 60 * MIN)
    expect(after2h).toEqual({ fullness: 42, energy: 54, cleanliness: 46, happiness: 44 })
    const afterYear = driftStats(stats, 365 * 24 * 60 * MIN)
    expect(afterYear.fullness).toBe(DECAY_FLOOR)
    expect(afterYear).toEqual(driftStats(stats, MAX_CATCHUP_MS))
  })

  it('decay never raises a stat already below the floor', () => {
    const stats = { fullness: 3, energy: 50, cleanliness: 50, happiness: 50 }
    expect(driftStats(stats, 60 * MIN).fullness).toBe(3)
  })

  it('mood follows stats', () => {
    expect(moodFor({ fullness: 80, energy: 80, cleanliness: 80, happiness: 80 })).toBe('happy')
    expect(moodFor({ fullness: 80, energy: 10, cleanliness: 80, happiness: 80 })).toBe('sleepy')
    expect(moodFor({ fullness: 80, energy: 80, cleanliness: 20, happiness: 80 })).toBe('sad')
    expect(moodFor({ fullness: 50, energy: 80, cleanliness: 80, happiness: 50 })).toBe('neutral')
  })
})

describe('care', () => {
  it('care is locked while feeding', () => {
    const s = startFeed(game(), ctx(T0), 'a')
    expect(bathe(s, T0)).toBe(s)
    expect(play(s, T0)).toBe(s)
  })

  it('bath restores cleanliness', () => {
    const s = game()
    const dirty = { ...s, pet: { ...s.pet, stats: { ...s.pet.stats, cleanliness: 20 } } }
    expect(bathe(dirty, T0).pet.stats.cleanliness).toBe(100)
  })

  it('play is limited per break window', () => {
    let s = game()
    for (let i = 0; i < MAX_PLAYS_PER_BREAK + 2; i++) s = play(s, T0)
    expect(s.timer.playsThisBreak).toBe(MAX_PLAYS_PER_BREAK)
  })

  it('completing a task earns a treat; un-completing takes it back', () => {
    let s = toggleTodo(game(), 'a', T0)
    expect(s.pet.treats).toBe(1)
    expect(s.dayLog[dayKey(T0)].tasksDone).toBe(1)
    const fed = giveTreat(s, T0)
    expect(fed.pet.treats).toBe(0)
    expect(fed.pet.stats.happiness).toBeGreaterThan(s.pet.stats.happiness)
    s = toggleTodo(s, 'a', T0)
    expect(s.pet.treats).toBe(0)
    expect(s.dayLog[dayKey(T0)].tasksDone).toBe(0)
  })
})

describe('streak', () => {
  it('counts consecutive fed days, and today being empty does not break it', () => {
    const day = 24 * 60 * MIN
    const log = {
      [dayKey(T0 - 3 * day)]: { meals: 1, minutes: 24, tasksDone: 0 },
      [dayKey(T0 - 2 * day)]: { meals: 2, minutes: 48, tasksDone: 0 },
      [dayKey(T0 - 1 * day)]: { meals: 1, minutes: 24, tasksDone: 0 },
    }
    expect(streak(log, T0)).toBe(3)
    expect(streak({ ...log, [dayKey(T0)]: { meals: 1, minutes: 24, tasksDone: 0 } }, T0)).toBe(4)
    expect(streak({ [dayKey(T0 - 2 * day)]: { meals: 1, minutes: 24, tasksDone: 0 } }, T0)).toBe(0)
  })
})
