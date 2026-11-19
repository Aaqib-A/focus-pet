import { useState, type FormEvent } from 'react'
import { CATEGORIES, type TaskTab } from '../../core/tasks'
import type { TaskCategory } from '../../core/types'
import { useAppStore } from '../../store/useAppStore'
import { ESTIMATES } from './estimates'

const PLACEHOLDER: Record<TaskTab, string> = {
  all: 'Add a task',
  work: 'Add a work task, e.g. Draft the Q3 report',
  personal: 'Add a personal task, e.g. Book a dentist visit',
}

/** On a category tab, new tasks go into that category; on "All" you pick one. */
export function AddTodo({ tab }: { tab: TaskTab }) {
  const addTodo = useAppStore((s) => s.addTodo)
  const [title, setTitle] = useState('')
  const [estimate, setEstimate] = useState('')
  const [pickedCategory, setPickedCategory] = useState<TaskCategory>('work')
  const category = tab === 'all' ? pickedCategory : tab

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    addTodo(title, category, estimate ? Number(estimate) : null)
    setTitle('')
    setEstimate('')
  }

  return (
    <form className={`add-todo${tab === 'all' ? ' add-todo--cat' : ''}`} onSubmit={submit}>
      <label className="sr-only" htmlFor="new-todo">
        New task
      </label>
      <input
        id="new-todo"
        className="input"
        placeholder={PLACEHOLDER[tab]}
        value={title}
        maxLength={140}
        onChange={(e) => setTitle(e.target.value)}
        autoComplete="off"
      />
      {tab === 'all' && <CategorySelect id="new-todo-cat" value={pickedCategory} onChange={setPickedCategory} />}
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

export function CategorySelect({
  id,
  value,
  onChange,
}: {
  id?: string
  value: TaskCategory
  onChange: (c: TaskCategory) => void
}) {
  return (
    <select
      id={id}
      className="select cat-select"
      value={value}
      onChange={(e) => onChange(e.target.value as TaskCategory)}
      aria-label="Category"
    >
      {CATEGORIES.map((c) => (
        <option key={c.id} value={c.id}>
          {c.icon} {c.label}
        </option>
      ))}
    </select>
  )
}
