import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { AddTodo } from './AddTodo'
import { TodoItem } from './TodoItem'

export function TodoList() {
  const todos = useAppStore((s) => s.game!.todos)
  const clearDone = useAppStore((s) => s.clearDone)
  const [showDone, setShowDone] = useState(false)

  const open = todos.filter((t) => !t.done)
  const done = todos.filter((t) => t.done).sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))

  return (
    <section className="card" aria-labelledby="todo-title">
      <h2 id="todo-title" className="card-title">
        Work to do
        <span className="card-sub">{open.length} open</span>
      </h2>

      <AddTodo />

      {open.length === 0 ? (
        <div className="empty">
          <p>
            <strong>No tasks yet.</strong>
          </p>
          <p className="muted small">
            Add what you’re working on, pick it before you feed, and every focus session gets logged against it.
            Finishing a task earns a 🍪 treat.
          </p>
        </div>
      ) : (
        <ul className="todo-list">
          {open.map((t) => (
            <TodoItem key={t.id} todo={t} />
          ))}
        </ul>
      )}

      {done.length > 0 && (
        <div className="done-block">
          <div className="done-head">
            <button type="button" className="link-btn small" aria-expanded={showDone} onClick={() => setShowDone((v) => !v)}>
              {showDone ? '▾' : '▸'} Done ({done.length})
            </button>
            {showDone && (
              <button type="button" className="btn btn--sm btn--ghost" onClick={clearDone}>
                Clear done
              </button>
            )}
          </div>
          {showDone && (
            <ul className="todo-list todo-list--done">
              {done.map((t) => (
                <TodoItem key={t.id} todo={t} />
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
