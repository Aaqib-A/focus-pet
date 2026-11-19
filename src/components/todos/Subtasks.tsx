import { useState, type FormEvent, type KeyboardEvent } from 'react'
import type { Subtask, Todo } from '../../core/types'
import { useAppStore } from '../../store/useAppStore'

/** Small progress bar for "3 of 5 steps done". */
export function StepBar({ done, total }: { done: number; total: number }) {
  const pct = total ? (done / total) * 100 : 0
  return (
    <span className={`stepbar${total > 0 && done === total ? ' stepbar--full' : ''}`} aria-hidden>
      <span style={{ width: `${pct}%` }} />
    </span>
  )
}

/** The expandable checklist under a task. */
export function SubtaskList({ todo, id, autoFocus }: { todo: Todo; id: string; autoFocus: boolean }) {
  const addSubtask = useAppStore((s) => s.addSubtask)
  const [title, setTitle] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    addSubtask(todo.id, title)
    setTitle('') // keep focus here so steps can be typed one after another
  }

  return (
    <div className="subtasks" id={id}>
      {todo.subtasks.length > 0 && (
        <ul className="subtask-list" aria-label={`Steps for “${todo.title}”`}>
          {todo.subtasks.map((s) => (
            <SubtaskItem key={s.id} todoId={todo.id} sub={s} />
          ))}
        </ul>
      )}
      {!todo.done && (
        <form className="subtask-add" onSubmit={submit}>
          <input
            className="input input--sm"
            placeholder={todo.subtasks.length ? 'Add another step' : 'Break it down: add the first step'}
            aria-label={`Add a step to “${todo.title}”`}
            value={title}
            maxLength={140}
            autoFocus={autoFocus}
            autoComplete="off"
            onChange={(e) => setTitle(e.target.value)}
          />
          <button type="submit" className="btn btn--sm" disabled={!title.trim()}>
            Add
          </button>
        </form>
      )}
    </div>
  )
}

function SubtaskItem({ todoId, sub }: { todoId: string; sub: Subtask }) {
  const toggleSubtask = useAppStore((s) => s.toggleSubtask)
  const editSubtask = useAppStore((s) => s.editSubtask)
  const deleteSubtask = useAppStore((s) => s.deleteSubtask)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(sub.title)

  const startEdit = () => {
    setDraft(sub.title)
    setEditing(true)
  }
  const save = () => {
    if (draft.trim()) editSubtask(todoId, sub.id, draft)
    setEditing(false)
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') setEditing(false)
  }

  return (
    <li className={`subtask${sub.done ? ' subtask--done' : ''}`}>
      <input
        type="checkbox"
        className="subtask-check"
        checked={sub.done}
        onChange={() => toggleSubtask(todoId, sub.id)}
        aria-label={sub.done ? `Mark step “${sub.title}” as not done` : `Mark step “${sub.title}” as done`}
      />
      {editing ? (
        <input
          className="input input--sm"
          value={draft}
          maxLength={140}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          onBlur={save}
          aria-label="Step title"
        />
      ) : (
        <span className="subtask-title" onDoubleClick={startEdit}>
          {sub.title}
        </span>
      )}
      {!editing && (
        <span className="subtask-actions">
          <button type="button" className="icon-btn icon-btn--sm" onClick={startEdit} title="Rename step" aria-label={`Rename step “${sub.title}”`}>
            ✏️
          </button>
          <button
            type="button"
            className="icon-btn icon-btn--sm"
            onClick={() => deleteSubtask(todoId, sub.id)}
            title="Delete step"
            aria-label={`Delete step “${sub.title}”`}
          >
            ✕
          </button>
        </span>
      )}
    </li>
  )
}
