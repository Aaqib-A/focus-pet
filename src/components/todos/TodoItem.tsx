import { useState, type KeyboardEvent } from 'react'
import { formatMinutes } from '../../core/format'
import type { Todo } from '../../core/types'
import { useAppStore } from '../../store/useAppStore'
import { ESTIMATES } from './estimates'

export function TodoItem({ todo }: { todo: Todo }) {
  const activeId = useAppStore((s) => s.game!.timer.activeTodoId)
  const phase = useAppStore((s) => s.game!.timer.phase)
  const toggleTodo = useAppStore((s) => s.toggleTodo)
  const editTodo = useAppStore((s) => s.editTodo)
  const deleteTodo = useAppStore((s) => s.deleteTodo)
  const setActiveTodo = useAppStore((s) => s.setActiveTodo)

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(todo.title)
  const [draftEst, setDraftEst] = useState(todo.estimateMeals ? String(todo.estimateMeals) : '')

  const active = activeId === todo.id
  const feedingThis = active && phase === 'feeding'

  const save = () => {
    const title = draft.trim()
    if (title) editTodo(todo.id, { title, estimateMeals: draftEst ? Number(draftEst) : null })
    else setDraft(todo.title)
    setEditing(false)
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') {
      setDraft(todo.title)
      setEditing(false)
    }
  }

  const est = todo.estimateMeals
  const over = est != null && todo.mealsSpent > est

  return (
    <li className={`todo${todo.done ? ' todo--done' : ''}${active && !todo.done ? ' todo--active' : ''}`}>
      <input
        type="checkbox"
        className="todo-check"
        checked={todo.done}
        onChange={() => toggleTodo(todo.id)}
        aria-label={todo.done ? `Mark “${todo.title}” as not done` : `Mark “${todo.title}” as done (earns a treat)`}
      />

      <div className="todo-body">
        {editing ? (
          <div className="todo-edit">
            <input
              className="input"
              value={draft}
              maxLength={140}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKey}
              aria-label="Task title"
            />
            <select className="select est-select" value={draftEst} onChange={(e) => setDraftEst(e.target.value)} aria-label="Estimated feedings">
              <option value="">🍖 ?</option>
              {ESTIMATES.map((n) => (
                <option key={n} value={n}>
                  🍖 {n}
                </option>
              ))}
            </select>
            <button type="button" className="btn btn--sm" onClick={save}>
              Save
            </button>
          </div>
        ) : (
          <>
            <span className="todo-title" onDoubleClick={() => !todo.done && setEditing(true)}>
              {todo.title}
            </span>
            <span className="todo-meta">
              {feedingThis && <span className="badge badge--feed">🍖 Feeding now</span>}
              {(est != null || todo.mealsSpent > 0) && (
                <span className={`meals${over ? ' meals--over' : ''}`} title="Feedings spent / estimated">
                  <MealPips spent={todo.mealsSpent} est={est} />
                  <span>
                    {todo.mealsSpent}
                    {est != null && `/${est}`} feeding{(est ?? todo.mealsSpent) === 1 ? '' : 's'}
                  </span>
                </span>
              )}
              {todo.minutesSpent > 0 && <span className="muted">{formatMinutes(todo.minutesSpent)} focused</span>}
            </span>
          </>
        )}
      </div>

      {!editing && (
        <div className="todo-actions">
          {!todo.done && (
            <button
              type="button"
              className={`icon-btn target${active ? ' target--on' : ''}`}
              onClick={() => setActiveTodo(active ? null : todo.id)}
              aria-pressed={active}
              title={active ? 'This is your current task' : 'Work on this next'}
              aria-label={active ? `“${todo.title}” is the current task` : `Work on “${todo.title}” next`}
            >
              🎯
            </button>
          )}
          {!todo.done && (
            <button type="button" className="icon-btn" onClick={() => setEditing(true)} title="Edit" aria-label={`Edit “${todo.title}”`}>
              ✏️
            </button>
          )}
          <button
            type="button"
            className="icon-btn"
            onClick={() => deleteTodo(todo.id)}
            disabled={feedingThis}
            title={feedingThis ? 'Can’t delete the task you’re feeding on' : 'Delete'}
            aria-label={`Delete “${todo.title}”`}
          >
            🗑️
          </button>
        </div>
      )}
    </li>
  )
}

function MealPips({ spent, est }: { spent: number; est: number | null }) {
  const total = Math.min(8, Math.max(est ?? 0, spent))
  return (
    <span className="pips" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`pip${i < spent ? ' pip--on' : ''}${est != null && i >= est ? ' pip--over' : ''}`} />
      ))}
    </span>
  )
}
