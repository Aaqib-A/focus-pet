/**
 * Pure game rules. Every function takes the current GameState and returns a
 * new one (plus events for side effects like chimes and notifications).
 * Nothing here touches React, storage, or the clock directly.
 */
import { bumpDay } from './dates'
import { growthInfo } from './growth'
import { EFFECTS, INITIAL_STATS, MAX_PLAYS_PER_BREAK, STAT_MAX, applyDelta, applyDrift } from './needs'
import { INITIAL_TIMER, elapsedMs, isExpired, restKindAfter } from './timer'
import type { CycleConfig, GameEvent, GameState, Pet, RestKind, Species } from './types'

export interface Ctx {
  now: number
  cycle: CycleConfig
  /** Real ms per "minute". 60_000 normally; smaller in dev speed mode. */
  minuteMs: number
  autoStartRest: boolean
}

export interface Result {
  state: GameState
  events: GameEvent[]
}

export function newPet(name: string, species: Species, now: number): Pet {
  return {
    name: name.trim() || 'Pip',
    species,
    bornAt: now,
    growthMinutes: 0,
    hatched: false,
    stats: { ...INITIAL_STATS },
    treats: 0,
    lastDecayAt: now,
  }
}

export function newGame(pet: Pet): GameState {
  return { pet, timer: { ...INITIAL_TIMER }, todos: [], dayLog: {} }
}

export const canCare = (s: GameState) => s.timer.phase !== 'feeding'

// ─── Feeding ────────────────────────────────────────────────────────────────

export function startFeed(s: GameState, ctx: Ctx, todoId?: string | null): GameState {
  if (s.timer.phase !== 'idle') return s
  const durationMs = ctx.cycle.feedMin * ctx.minuteMs
  return {
    ...s,
    pet: applyDrift(s.pet, ctx.now),
    timer: {
      ...s.timer,
      phase: 'feeding',
      restKind: null,
      durationMs,
      endsAt: ctx.now + durationMs,
      pausedRemainingMs: null,
      activeTodoId: todoId === undefined ? s.timer.activeTodoId : todoId,
      playsThisBreak: 0,
    },
  }
}

function creditFeed(s: GameState, minutes: number, at: number, full: boolean): GameState {
  const todoId = s.timer.activeTodoId
  return {
    ...s,
    pet: {
      ...s.pet,
      growthMinutes: s.pet.growthMinutes + minutes,
      hatched: s.pet.hatched || full,
      stats: applyDelta(s.pet.stats, full ? EFFECTS.fullFeed(minutes) : EFFECTS.partialFeed(minutes)),
    },
    todos: s.todos.map((t) =>
      t.id === todoId
        ? { ...t, mealsSpent: t.mealsSpent + (full ? 1 : 0), minutesSpent: t.minutesSpent + minutes }
        : t,
    ),
    dayLog: bumpDay(s.dayLog, at, { meals: full ? 1 : 0, minutes }),
  }
}

function growthEvents(before: GameState, after: GameState): GameEvent[] {
  const a = growthInfo(before.pet.growthMinutes, before.pet.hatched)
  const b = growthInfo(after.pet.growthMinutes, after.pet.hatched)
  if (a.stage === b.stage) return []
  if (a.stage === 'egg') return [{ type: 'hatched' }]
  return [{ type: 'stageUp', stage: b.stage }]
}

/** The feed timer ran out: full credit, then start (or queue) the rest. */
export function completeFeed(s: GameState, ctx: Ctx, at: number = ctx.now): Result {
  if (s.timer.phase !== 'feeding') return { state: s, events: [] }
  const minutes = Math.max(1, Math.round(s.timer.durationMs / ctx.minuteMs))
  const fed = creditFeed({ ...s, pet: applyDrift(s.pet, at) }, minutes, at, true)

  const feeds = s.timer.feedsSinceLongRest + 1
  const restKind: RestKind = restKindAfter(feeds, ctx.cycle)
  const restMs = (restKind === 'long' ? ctx.cycle.longRestMin : ctx.cycle.restMin) * ctx.minuteMs

  const state: GameState = {
    ...fed,
    timer: {
      ...fed.timer,
      phase: 'resting',
      restKind,
      durationMs: restMs,
      endsAt: ctx.autoStartRest ? at + restMs : null,
      pausedRemainingMs: ctx.autoStartRest ? null : restMs,
      feedsSinceLongRest: restKind === 'long' ? 0 : feeds,
      playsThisBreak: 0,
    },
  }
  const todoTitle = s.todos.find((t) => t.id === s.timer.activeTodoId)?.title ?? null
  return {
    state,
    events: [{ type: 'feedDone', minutes, todoTitle, restKind }, ...growthEvents(s, state)],
  }
}

/** The user stopped feeding early: partial credit for whole minutes eaten, no rest. */
export function stopFeed(s: GameState, ctx: Ctx): Result {
  if (s.timer.phase !== 'feeding') return { state: s, events: [] }
  const minutes = Math.floor(elapsedMs(s.timer, ctx.now) / ctx.minuteMs)
  let state: GameState = { ...s, pet: applyDrift(s.pet, ctx.now) }
  if (minutes > 0) state = creditFeed(state, minutes, ctx.now, false)
  state = { ...state, timer: { ...state.timer, phase: 'idle', restKind: null, durationMs: 0, endsAt: null, pausedRemainingMs: null } }
  return { state, events: [{ type: 'feedStopped', minutes }, ...growthEvents(s, state)] }
}

// ─── Resting ────────────────────────────────────────────────────────────────

function toIdle(s: GameState): GameState {
  return {
    ...s,
    timer: { ...s.timer, phase: 'idle', restKind: null, durationMs: 0, endsAt: null, pausedRemainingMs: null },
  }
}

export function completeRest(s: GameState, ctx: Ctx, at: number = ctx.now): Result {
  if (s.timer.phase !== 'resting') return { state: s, events: [] }
  const kind = s.timer.restKind ?? 'short'
  const pet = applyDrift(s.pet, at)
  const state = toIdle({
    ...s,
    pet: { ...pet, stats: applyDelta(pet.stats, kind === 'long' ? EFFECTS.longRest : EFFECTS.shortRest) },
  })
  return { state, events: [{ type: 'restDone', kind }] }
}

export function skipRest(s: GameState, ctx: Ctx): Result {
  if (s.timer.phase !== 'resting') return { state: s, events: [] }
  const pet = applyDrift(s.pet, ctx.now)
  const state = toIdle({ ...s, pet: { ...pet, stats: applyDelta(pet.stats, EFFECTS.skipRest) } })
  return { state, events: [{ type: 'restSkipped' }] }
}

// ─── Clock ──────────────────────────────────────────────────────────────────

/**
 * Finish every phase whose end time has passed, in order. Handles the tab
 * being closed or asleep: a feed that ran its full length counts as complete,
 * and a rest that also finished meanwhile completes too.
 */
export function advance(s: GameState, ctx: Ctx): Result {
  let state = s
  const events: GameEvent[] = []
  for (let i = 0; i < 4 && isExpired(state.timer, ctx.now); i++) {
    const at = state.timer.endsAt ?? ctx.now
    const r = state.timer.phase === 'feeding' ? completeFeed(state, ctx, at) : completeRest(state, ctx, at)
    state = r.state
    events.push(...r.events)
  }
  return { state, events }
}

export function drift(s: GameState, now: number): GameState {
  const pet = applyDrift(s.pet, now)
  return pet === s.pet ? s : { ...s, pet }
}

// ─── Care ───────────────────────────────────────────────────────────────────

export function bathe(s: GameState, now: number): GameState {
  if (!canCare(s)) return s
  const pet = applyDrift(s.pet, now)
  const stats = applyDelta({ ...pet.stats, cleanliness: STAT_MAX }, { happiness: EFFECTS.bath.happiness })
  return { ...s, pet: { ...pet, stats } }
}

export const playsLeft = (s: GameState) => Math.max(0, MAX_PLAYS_PER_BREAK - s.timer.playsThisBreak)

export function play(s: GameState, now: number): GameState {
  if (!canCare(s) || playsLeft(s) === 0) return s
  const pet = applyDrift(s.pet, now)
  return {
    ...s,
    pet: { ...pet, stats: applyDelta(pet.stats, EFFECTS.play) },
    timer: { ...s.timer, playsThisBreak: s.timer.playsThisBreak + 1 },
  }
}

export function cuddle(s: GameState, now: number): GameState {
  if (!canCare(s)) return s
  const pet = applyDrift(s.pet, now)
  return { ...s, pet: { ...pet, stats: applyDelta(pet.stats, EFFECTS.cuddle) } }
}

export function giveTreat(s: GameState, now: number): GameState {
  if (!canCare(s) || s.pet.treats <= 0) return s
  const pet = applyDrift(s.pet, now)
  return { ...s, pet: { ...pet, treats: pet.treats - 1, stats: applyDelta(pet.stats, EFFECTS.treat) } }
}

// ─── Todos ──────────────────────────────────────────────────────────────────

/** Completing a task earns a treat; un-completing takes it back (if unspent). */
export function toggleTodo(s: GameState, id: string, now: number): GameState {
  const todo = s.todos.find((t) => t.id === id)
  if (!todo) return s
  const done = !todo.done
  const dayLog = done
    ? bumpDay(s.dayLog, now, { tasksDone: 1 })
    : bumpDay(s.dayLog, todo.completedAt ?? now, { tasksDone: -1 })
  return {
    ...s,
    pet: { ...s.pet, treats: Math.max(0, s.pet.treats + (done ? 1 : -1)) },
    todos: s.todos.map((t) => (t.id === id ? { ...t, done, completedAt: done ? now : null } : t)),
    dayLog,
  }
}

