import { useRef, useState, type KeyboardEvent } from 'react'
import { TASK_TABS, categoryInfo, inTab, type TaskTab } from '../../core/tasks'
import { useAppStore } from '../../store/useAppStore'
import { AddTodo } from './AddTodo'
import { TodoItem } from './TodoItem'

const EMPTY: Record<TaskTab, { title: string; body: string }> = {
  all: {
    title: 'No tasks yet.',
    body: 'Add what you’re working on and break big tasks into steps. Pick a task before you feed, and every focus session gets logged against it. Finishing a task earns a 🍪 treat.',
  },
  work: {
    title: 'No open work tasks.',
    body: 'Add what’s on your plate at work. Pick one before you feed, and the focus time gets logged against it.',
  },
  personal: {
    title: 'No open personal tasks.',
    body: 'Errands, side projects, things to read or learn. Focus time on these feeds your pet too.',
  },
}

export function TodoList() {
  const todos = useAppStore((s) => s.game!.todos)
  const tab = useAppStore((s) => s.taskTab)
  const setTab = useAppStore((s) => s.setTaskTab)
  const clearDone = useAppStore((s) => s.clearDone)
  const [showDone, setShowDone] = useState(false)

  const shown = todos.filter((t) => inTab(t, tab))
  const open = shown.filter((t) => !t.done)
  const done = shown.filter((t) => t.done).sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
  const openCount = (t: TaskTab) => todos.filter((x) => !x.done && inTab(x, t)).length

  return (
    <section className="card" aria-labelledby="todo-title">
      <h2 id="todo-title" className="card-title">
        Tasks
        <span className="card-sub">{open.length} open</span>
      </h2>

      <TaskTabs tab={tab} onChange={setTab} count={openCount} />

      <div role="tabpanel" id="task-panel" aria-labelledby={`task-tab-${tab}`}>
        {/* Keyed so the half-typed task doesn't jump category with the tab. */}
        <AddTodo key={tab} tab={tab} />

        {open.length === 0 ? (
          <div className="empty">
            <p>
              <strong>{EMPTY[tab].title}</strong>
            </p>
            <p className="muted small">{EMPTY[tab].body}</p>
          </div>
        ) : (
          <ul className="todo-list">
            {open.map((t) => (
              <TodoItem key={t.id} todo={t} showCategory={tab === 'all'} />
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
                <button type="button" className="btn btn--sm btn--ghost" onClick={() => clearDone(tab)}>
                  Clear done
                </button>
              )}
            </div>
            {showDone && (
              <ul className="todo-list todo-list--done">
                {done.map((t) => (
                  <TodoItem key={t.id} todo={t} showCategory={tab === 'all'} />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function TaskTabs({ tab, onChange, count }: { tab: TaskTab; onChange: (t: TaskTab) => void; count: (t: TaskTab) => number }) {
  const refs = useRef<Partial<Record<TaskTab, HTMLButtonElement | null>>>({})

  // Arrow keys move between tabs (WAI-ARIA tabs pattern).
  const onKey = (e: KeyboardEvent) => {
    const i = TASK_TABS.indexOf(tab)
    const next =
      e.key === 'ArrowRight'
        ? TASK_TABS[(i + 1) % TASK_TABS.length]
        : e.key === 'ArrowLeft'
          ? TASK_TABS[(i - 1 + TASK_TABS.length) % TASK_TABS.length]
          : e.key === 'Home'
            ? TASK_TABS[0]
            : e.key === 'End'
              ? TASK_TABS[TASK_TABS.length - 1]
              : null
    if (!next) return
    e.preventDefault()
    onChange(next)
    refs.current[next]?.focus()
  }

  return (
    <div className="task-tabs" role="tablist" aria-label="Task categories" onKeyDown={onKey}>
      {TASK_TABS.map((t) => {
        const info = t === 'all' ? null : categoryInfo(t)
        const n = count(t)
        return (
          <button
            key={t}
            ref={(el) => {
              refs.current[t] = el
            }}
            type="button"
            role="tab"
            id={`task-tab-${t}`}
            aria-selected={tab === t}
            aria-controls="task-panel"
            tabIndex={tab === t ? 0 : -1}
            className={`task-tab${info ? ` task-tab--${t}` : ''}`}
            onClick={() => onChange(t)}
          >
            {info && (
              <span className="task-tab-icon" aria-hidden>
                {info.icon}
              </span>
            )}
            <span>{info ? info.label : 'All'}</span>
            <span className="task-tab-count" aria-label={`${n} open`}>
              {n}
            </span>
          </button>
        )
      })}
    </div>
  )
}
