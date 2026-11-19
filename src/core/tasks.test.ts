import { describe, expect, it } from 'vitest'
import { newGame, newPet, startFeed, toggleTodo } from './game'
import { PRESETS } from './presets'
import {
  addSubtask,
  allStepsDone,
  clearDone,
  deleteSubtask,
  deleteTodo,
  inTab,
  isTaskTab,
  newTodo,
  nextStep,
  normalizeGame,
  normalizeTodo,
  renameSubtask,
  stepProgress,
  toggleSubtask,
} from './tasks'
import type { GameState, Todo } from './types'

const T0 = new Date(2026, 10, 5, 9, 0, 0).getTime()

function game(): GameState {
  return {
    ...newGame(newPet('Mochi', 'cat', T0)),
    todos: [newTodo('w', 'Write report', 'work', 2, T0), newTodo('p', 'Book dentist', 'personal', null, T0)],
  }
}

const find = (todos: Todo[], id: string) => todos.find((t) => t.id === id)!

describe('categories', () => {
  it('new tasks keep their category and start with no steps', () => {
    const t = newTodo('x', '  Plan trip  ', 'personal', 1, T0)
    expect(t).toMatchObject({ title: 'Plan trip', category: 'personal', subtasks: [], done: false })
  })

  it('tabs filter by category; "all" shows everything', () => {
    const { todos } = game()
    expect(todos.filter((t) => inTab(t, 'work')).map((t) => t.id)).toEqual(['w'])
    expect(todos.filter((t) => inTab(t, 'personal')).map((t) => t.id)).toEqual(['p'])
    expect(todos.filter((t) => inTab(t, 'all'))).toHaveLength(2)
    expect(isTaskTab('work')).toBe(true)
    expect(isTaskTab('home')).toBe(false)
  })

  it('older saves without categories or steps load as work tasks with no steps', () => {
    const old = {
      id: 'o',
      title: 'Old task',
      done: false,
      createdAt: T0,
      completedAt: null,
      estimateMeals: null,
      mealsSpent: 3,
      minutesSpent: 72,
    }
    expect(normalizeTodo(old)).toEqual({ ...old, category: 'work', subtasks: [] })
    const g = normalizeGame({ ...game(), todos: [old as Todo] })
    expect(g.todos[0].category).toBe('work')
    expect(g.todos[0].subtasks).toEqual([])
  })

  it('normalizing keeps existing categories and steps', () => {
    const t = { ...newTodo('x', 'X', 'personal', null, T0), subtasks: [{ id: 's', title: 'S', done: true }] }
    expect(normalizeTodo(t)).toEqual(t)
  })
})

describe('steps', () => {
  it('adds, ticks, renames and deletes steps on the right task', () => {
    let todos = game().todos
    todos = addSubtask(todos, 'w', 's1', ' Outline ')
    todos = addSubtask(todos, 'w', 's2', 'Draft')
    todos = addSubtask(todos, 'w', 's3', 'Edit')
    expect(find(todos, 'w').subtasks.map((s) => s.title)).toEqual(['Outline', 'Draft', 'Edit'])
    expect(find(todos, 'p').subtasks).toEqual([])

    todos = toggleSubtask(todos, 'w', 's1')
    expect(stepProgress(find(todos, 'w'))).toEqual({ done: 1, total: 3 })
    expect(nextStep(find(todos, 'w'))?.id).toBe('s2')

    todos = renameSubtask(todos, 'w', 's2', 'Write the draft')
    expect(find(todos, 'w').subtasks[1].title).toBe('Write the draft')

    todos = deleteSubtask(todos, 'w', 's3')
    expect(find(todos, 'w').subtasks.map((s) => s.id)).toEqual(['s1', 's2'])
  })

  it('ignores blank step titles', () => {
    const todos = game().todos
    expect(addSubtask(todos, 'w', 's', '   ')).toBe(todos)
    const withStep = addSubtask(todos, 'w', 's', 'Real')
    expect(renameSubtask(withStep, 'w', 's', '  ')).toBe(withStep)
  })

  it('next step is the first unticked one, even when ticked out of order', () => {
    let todos = game().todos
    for (const id of ['a', 'b', 'c']) todos = addSubtask(todos, 'w', id, id)
    todos = toggleSubtask(todos, 'w', 'a')
    todos = toggleSubtask(todos, 'w', 'c')
    expect(nextStep(find(todos, 'w'))?.id).toBe('b')
    expect(allStepsDone(find(todos, 'w'))).toBe(false)
    todos = toggleSubtask(todos, 'w', 'b')
    expect(nextStep(find(todos, 'w'))).toBeNull()
    expect(allStepsDone(find(todos, 'w'))).toBe(true)
  })

  it('a task with no steps is not "all steps done"', () => {
    expect(allStepsDone(game().todos[0])).toBe(false)
  })
})

describe('list housekeeping', () => {
  it('clear done only removes finished tasks in the current tab', () => {
    let s = toggleTodo(game(), 'w', T0)
    s = toggleTodo(s, 'p', T0)
    expect(clearDone(s, 'personal').todos.map((t) => t.id)).toEqual(['w'])
    expect(clearDone(s, 'work').todos.map((t) => t.id)).toEqual(['p'])
    expect(clearDone(s, 'all').todos).toEqual([])
  })

  it('removing the active task clears it from the timer', () => {
    const ctx = { now: T0, cycle: PRESETS.biwer2023.cycle, minuteMs: 60_000, autoStartRest: true }
    const s = startFeed(game(), ctx, 'p')
    expect(deleteTodo(s, 'p').timer.activeTodoId).toBeNull()
    expect(deleteTodo(s, 'w').timer.activeTodoId).toBe('p')
    const done = toggleTodo(s, 'p', T0)
    expect(clearDone(done, 'work').timer.activeTodoId).toBe('p')
    expect(clearDone(done, 'personal').timer.activeTodoId).toBeNull()
  })
})
