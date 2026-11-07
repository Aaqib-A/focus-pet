import type { CycleConfig, RestKind, TimerState } from './types'

export const INITIAL_TIMER: TimerState = {
  phase: 'idle',
  restKind: null,
  durationMs: 0,
  endsAt: null,
  pausedRemainingMs: null,
  activeTodoId: null,
  feedsSinceLongRest: 0,
  playsThisBreak: 0,
}

export function remainingMs(t: TimerState, now: number): number {
  if (t.phase === 'idle') return 0
  if (t.pausedRemainingMs != null) return t.pausedRemainingMs
  return Math.max(0, (t.endsAt ?? now) - now)
}

export function elapsedMs(t: TimerState, now: number): number {
  return Math.max(0, t.durationMs - remainingMs(t, now))
}

/** 0..1 through the current phase. */
export function progress(t: TimerState, now: number): number {
  if (t.phase === 'idle' || t.durationMs <= 0) return 0
  return Math.min(1, elapsedMs(t, now) / t.durationMs)
}

export const isPaused = (t: TimerState) => t.phase !== 'idle' && t.pausedRemainingMs != null

export function isExpired(t: TimerState, now: number): boolean {
  return t.phase !== 'idle' && t.pausedRemainingMs == null && t.endsAt != null && now >= t.endsAt
}

export function pauseTimer(t: TimerState, now: number): TimerState {
  if (t.phase === 'idle' || isPaused(t)) return t
  return { ...t, pausedRemainingMs: remainingMs(t, now), endsAt: null }
}

export function resumeTimer(t: TimerState, now: number): TimerState {
  if (!isPaused(t)) return t
  return { ...t, endsAt: now + (t.pausedRemainingMs ?? 0), pausedRemainingMs: null }
}

/** Which rest follows a complete feed, given how many feeds have now been completed since the last long rest. */
export function restKindAfter(feedsSinceLongRest: number, cycle: CycleConfig): RestKind {
  return cycle.longRestEvery > 0 && feedsSinceLongRest >= cycle.longRestEvery ? 'long' : 'short'
}

export function formatClock(ms: number): string {
  const total = Math.ceil(Math.max(0, ms) / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = String(m).padStart(h ? 2 : 1, '0')
  const ss = String(s).padStart(2, '0')
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}
