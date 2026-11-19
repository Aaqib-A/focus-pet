/**
 * Pure task-list rules: categories, subtasks (steps) and list housekeeping.
 * Completing a task (treats, day log) lives in game.ts with the other rules
 * that touch the pet.
 */
import type { GameState, Subtask, TaskCategory, Todo } from './types'

export interface CategoryInfo {
  id: TaskCategory
  label: string
  icon: string
}

export const CATEGORIES: readonly CategoryInfo[] = [
  { id: 'work', label: 'Work', icon: '💼' },
  { id: 'personal', label: 'Personal', icon: '🏡' },
]

export const categoryInfo = (c: TaskCategory): CategoryInfo => CATEGORIES.find((x) => x.id === c) ?? CATEGORIES[0]

/** Which slice of the task list is showing. */
export type TaskTab = 'all' | TaskCategory

export const TASK_TABS: readonly TaskTab[] = ['all', 'work', 'personal']

export const isTaskTab = (v: unknown): v is TaskTab => TASK_TABS.includes(v as TaskTab)

export const inTab = (t: Todo, tab: TaskTab) => tab === 'all' || t.category === tab

export function newTodo(
  id: string,
  title: string,
  category: TaskCategory,
  estimateMeals: number | null,
  now: number,
): Todo {
  return {
    id,
    title: title.trim(),
    category,
    done: false,
    createdAt: now,
    completedAt: null,
    estimateMeals,
    mealsSpent: 0,
    minutesSpent: 0,
    subtasks: [],
  }
}

type StoredTodo = Omit<Todo, 'category' | 'subtasks'> & Partial<Pick<Todo, 'category' | 'subtasks'>>

/**
 * Fill in fields that older saves don't have. Tasks saved before categories
 * existed came from the "Work to do" list, so they count as work.
 */
export function normalizeTodo(t: StoredTodo): Todo {
  return {
    ...t,
    category: t.category === 'personal' ? 'personal' : 'work',
    subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
  }
}

export function normalizeGame(g: GameState): GameState {
  return { ...g, todos: (g.todos ?? []).map(normalizeTodo) }
}

// ─── Steps ──────────────────────────────────────────────────────────────────

const mapTodo = (todos: Todo[], id: string, fn: (t: Todo) => Todo) =>
  todos.map((t) => (t.id === id ? fn(t) : t))

export function addSubtask(todos: Todo[], todoId: string, subId: string, title: string): Todo[] {
  const clean = title.trim()
  if (!clean) return todos
  return mapTodo(todos, todoId, (t) => ({ ...t, subtasks: [...t.subtasks, { id: subId, title: clean, done: false }] }))
}

export function toggleSubtask(todos: Todo[], todoId: string, subId: string): Todo[] {
  return mapTodo(todos, todoId, (t) => ({
    ...t,
    subtasks: t.subtasks.map((s) => (s.id === subId ? { ...s, done: !s.done } : s)),
  }))
}

export function renameSubtask(todos: Todo[], todoId: string, subId: string, title: string): Todo[] {
  const clean = title.trim()
  if (!clean) return todos
  return mapTodo(todos, todoId, (t) => ({
    ...t,
    subtasks: t.subtasks.map((s) => (s.id === subId ? { ...s, title: clean } : s)),
  }))
}

export function deleteSubtask(todos: Todo[], todoId: string, subId: string): Todo[] {
  return mapTodo(todos, todoId, (t) => ({ ...t, subtasks: t.subtasks.filter((s) => s.id !== subId) }))
}

export function stepProgress(t: Todo): { done: number; total: number } {
  return { done: t.subtasks.filter((s) => s.done).length, total: t.subtasks.length }
}

/** The first unticked step, in list order. */
export const nextStep = (t: Todo): Subtask | null => t.subtasks.find((s) => !s.done) ?? null

export const allStepsDone = (t: Todo) => t.subtasks.length > 0 && t.subtasks.every((s) => s.done)

// ─── List housekeeping ──────────────────────────────────────────────────────

function dropActiveIfGone(s: GameState, todos: Todo[]): GameState {
  const gone = s.timer.activeTodoId != null && !todos.some((t) => t.id === s.timer.activeTodoId)
  return { ...s, todos, timer: gone ? { ...s.timer, activeTodoId: null } : s.timer }
}

export function deleteTodo(s: GameState, id: string): GameState {
  return dropActiveIfGone(
    s,
    s.todos.filter((t) => t.id !== id),
  )
}

/** Remove finished tasks, but only from the tab being viewed. */
export function clearDone(s: GameState, tab: TaskTab): GameState {
  return dropActiveIfGone(
    s,
    s.todos.filter((t) => !t.done || !inTab(t, tab)),
  )
}
