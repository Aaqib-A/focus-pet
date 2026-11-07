import { useState, type FormEvent } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { ESTIMATES } from './estimates'

export function AddTodo() {
  const addTodo = useAppStore((s) => s.addTodo)
  const [title, setTitle] = useState('')
  const [estimate, setEstimate] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    addTodo(title, estimate ? Number(estimate) : null)
    setTitle('')
    setEstimate('')
  }

  return (
    <form className="add-todo" onSubmit={submit}>
      <label className="sr-only" htmlFor="new-todo">
        New task
      </label>
      <input
        id="new-todo"
        className="input"
        placeholder="Add a task, e.g. Draft the Q3 report"
        value={title}
        maxLength={140}
        onChange={(e) => setTitle(e.target.value)}
        autoComplete="off"
      />
      <label className="sr-only" htmlFor="new-todo-est">
        Estimated feedings
      </label>
      <select
        id="new-todo-est"
        className="select est-select"
        value={estimate}
        onChange={(e) => setEstimate(e.target.value)}
        title="How many feedings (focus sessions) will this take?"
      >
        <option value="">🍖 ?</option>
        {ESTIMATES.map((n) => (
          <option key={n} value={n}>
            🍖 {n}
          </option>
        ))}
      </select>
      <button type="submit" className="btn btn--feed" disabled={!title.trim()}>
        Add
      </button>
    </form>
  )
}
