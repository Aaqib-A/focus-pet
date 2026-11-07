import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import * as G from '../core/game'
import { stageLabel } from '../core/growth'
import { DEFAULT_SETTINGS, clampCycle, cycleFor } from '../core/presets'
import { pauseTimer, resumeTimer } from '../core/timer'
import type { GameEvent, GameState, Settings, Species, Todo } from '../core/types'
import { MINUTE_MS } from '../lib/speed'
import { notify } from '../lib/notify'
import { chime } from '../lib/sound'

export type CareKind = 'bathing' | 'playing' | 'cuddling' | 'treat'

export interface Toast {
  id: number
  text: string
  tone: 'info' | 'success' | 'warn'
}

interface AppState {
  game: GameState | null
  settings: Settings

  // transient (not persisted)
  toasts: Toast[]
  careFx: { kind: CareKind; at: number; id: number } | null

  adopt: (name: string, species: Species) => void
  resetPet: () => void

  feed: (todoId?: string | null) => void
  pause: () => void
  resume: () => void
  stopFeed: () => void
  skipRest: () => void
  tick: () => void
  drift: () => void

  bath: () => void
  play: () => void
  cuddle: () => void
  treat: () => void

  addTodo: (title: string, estimateMeals: number | null) => void
  editTodo: (id: string, patch: Partial<Pick<Todo, 'title' | 'estimateMeals'>>) => void
  deleteTodo: (id: string) => void
  toggleTodo: (id: string) => void
  setActiveTodo: (id: string | null) => void
  clearDone: () => void

  updateSettings: (patch: Partial<Settings>) => void
  toast: (text: string, tone?: Toast['tone']) => void
  dismissToast: (id: number) => void
}

let seq = 0
const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => {
      const ctx = (): G.Ctx => {
        const { settings } = get()
        return { now: Date.now(), cycle: cycleFor(settings), minuteMs: MINUTE_MS, autoStartRest: settings.autoStartRest }
      }

      /** Apply a pure game update if a pet exists. */
      const update = (fn: (g: GameState) => GameState) => {
        const g = get().game
        if (!g) return
        const next = fn(g)
        if (next !== g) set({ game: next })
      }

      const run = (fn: (g: GameState) => G.Result) => {
        const g = get().game
        if (!g) return
        const { state, events } = fn(g)
        if (state !== g) set({ game: state })
        if (events.length) handleEvents(events)
      }

      const care = (kind: CareKind, fn: (g: GameState, now: number) => GameState) => {
        const g = get().game
        if (!g) return
        const next = fn(g, Date.now())
        if (next === g) return
        set({ game: next, careFx: { kind, at: Date.now(), id: ++seq } })
        if (get().settings.sound) chime('pop')
      }

      const handleEvents = (events: GameEvent[]) => {
        const { game, settings, toast } = get()
        if (!game) return
        const name = game.pet.name
        const cycle = cycleFor(settings)
        for (const e of events) {
          switch (e.type) {
            case 'feedDone': {
              const restMin = e.restKind === 'long' ? cycle.longRestMin : cycle.restMin
              const body = `${e.minutes} focused minutes${e.todoTitle ? ` on “${e.todoTitle}”` : ''}. Time for a ${restMin}-minute ${e.restKind === 'long' ? 'long ' : ''}rest. Step away from the screen!`
              toast(`🍖 ${name} finished eating! ${body}`, 'success')
              if (settings.sound) chime('feedDone')
              if (settings.notifications) notify(`${name} finished eating! 🍖`, body)
              break
            }
            case 'restDone': {
              toast(`☀️ ${name} is awake and hungry. Ready for the next feeding?`, 'info')
              if (settings.sound) chime('restDone')
              if (settings.notifications) notify(`${name} is hungry! 🍽️`, 'Break is over. Ready for the next focus session?')
              break
            }
            case 'feedStopped':
              toast(
                e.minutes > 0
                  ? `${name} ate ${e.minutes} min worth before you stopped. Partial meal saved.`
                  : 'Feeding stopped.',
                'info',
              )
              break
            case 'restSkipped':
              toast(`Rest skipped. ${name} is a little tired. Breaks keep you both going!`, 'warn')
              break
            case 'hatched':
              toast(`🎉 The egg hatched! Say hello to ${name}.`, 'success')
              if (settings.sound) setTimeout(() => chime('levelUp'), 700)
              break
            case 'stageUp': {
              const label = stageLabel(e.stage).toLowerCase()
              toast(`🌱 ${name} grew into a ${label}!`, 'success')
              if (settings.sound) setTimeout(() => chime('levelUp'), 700)
              if (settings.notifications) notify(`${name} grew! 🌱`, `${name} is now a ${label}.`)
              break
            }
          }
        }
      }

      return {
        game: null,
        settings: DEFAULT_SETTINGS,
        toasts: [],
        careFx: null,

        adopt: (name, species) => set({ game: G.newGame(G.newPet(name, species, Date.now())) }),
        resetPet: () => set({ game: null, careFx: null }),

        feed: (todoId) => update((g) => G.startFeed(g, ctx(), todoId)),
        pause: () => update((g) => (g.timer.phase === 'feeding' ? { ...g, timer: pauseTimer(g.timer, Date.now()) } : g)),
        resume: () => update((g) => ({ ...g, timer: resumeTimer(g.timer, Date.now()) })),
        stopFeed: () => run((g) => G.stopFeed(g, ctx())),
        skipRest: () => run((g) => G.skipRest(g, ctx())),
        tick: () => run((g) => G.advance(g, ctx())),
        drift: () => update((g) => G.drift(g, Date.now())),

        bath: () => care('bathing', G.bathe),
        play: () => care('playing', G.play),
        cuddle: () => care('cuddling', G.cuddle),
        treat: () => care('treat', G.giveTreat),

        addTodo: (title, estimateMeals) =>
          update((g) => ({
            ...g,
            todos: [
              ...g.todos,
              {
                id: uid(),
                title: title.trim(),
                done: false,
                createdAt: Date.now(),
                completedAt: null,
                estimateMeals,
                mealsSpent: 0,
                minutesSpent: 0,
              },
            ],
          })),
        editTodo: (id, patch) =>
          update((g) => ({ ...g, todos: g.todos.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
        deleteTodo: (id) =>
          update((g) => ({
            ...g,
            todos: g.todos.filter((t) => t.id !== id),
            timer: g.timer.activeTodoId === id ? { ...g.timer, activeTodoId: null } : g.timer,
          })),
        toggleTodo: (id) => update((g) => G.toggleTodo(g, id, Date.now())),
        setActiveTodo: (id) => update((g) => ({ ...g, timer: { ...g.timer, activeTodoId: id } })),
        clearDone: () =>
          update((g) => {
            const keep = g.todos.filter((t) => !t.done)
            const activeGone = !keep.some((t) => t.id === g.timer.activeTodoId)
            return { ...g, todos: keep, timer: activeGone ? { ...g.timer, activeTodoId: null } : g.timer }
          }),

        updateSettings: (patch) =>
          set((s) => ({
            settings: {
              ...s.settings,
              ...patch,
              custom: clampCycle(patch.custom ?? s.settings.custom),
            },
          })),
        toast: (text, tone = 'info') =>
          set((s) => ({ toasts: [...s.toasts.slice(-3), { id: ++seq, text, tone }] })),
        dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      }
    },
    {
      name: 'focus-pet',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ game: s.game, settings: s.settings }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<Pick<AppState, 'game' | 'settings'>>
        return {
          ...current,
          game: p.game ?? null,
          settings: { ...DEFAULT_SETTINGS, ...p.settings },
        }
      },
      onRehydrateStorage: () => (state) => {
        // Catch up on anything that finished while the tab was closed.
        state?.drift()
        state?.tick()
      },
    },
  ),
)
