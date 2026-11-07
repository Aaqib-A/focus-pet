import { useState } from 'react'
import { PRESETS, cycleFor } from '../../core/presets'
import { elapsedMs, formatClock, isPaused, progress, remainingMs } from '../../core/timer'
import { useNow } from '../../hooks/useNow'
import { notifyPermission, requestNotifyPermission } from '../../lib/notify'
import { unlockAudio } from '../../lib/sound'
import { MINUTE_MS } from '../../lib/speed'
import { useAppStore } from '../../store/useAppStore'
import { BreakIdeas } from './BreakIdeas'

const R = 54
const CIRC = 2 * Math.PI * R

export function TimerPanel({ onOpenScience }: { onOpenScience: () => void }) {
  const game = useAppStore((s) => s.game!)
  const settings = useAppStore((s) => s.settings)
  const feed = useAppStore((s) => s.feed)
  const pause = useAppStore((s) => s.pause)
  const resume = useAppStore((s) => s.resume)
  const stopFeed = useAppStore((s) => s.stopFeed)
  const skipRest = useAppStore((s) => s.skipRest)
  const setActiveTodo = useAppStore((s) => s.setActiveTodo)
  const [confirmStop, setConfirmStop] = useState(false)

  const { timer, pet, todos } = game
  const cycle = cycleFor(settings)
  const paused = isPaused(timer)
  const running = timer.phase !== 'idle' && !paused
  const now = useNow(250, running)

  const idle = timer.phase === 'idle'
  const feeding = timer.phase === 'feeding'
  const resting = timer.phase === 'resting'
  const remaining = idle ? cycle.feedMin * MINUTE_MS : remainingMs(timer, now)
  const p = progress(timer, now)
  const eatenMin = feeding ? Math.floor(elapsedMs(timer, now) / MINUTE_MS) : 0

  const openTodos = todos.filter((t) => !t.done)
  const activeTodo = todos.find((t) => t.id === timer.activeTodoId) ?? null
  const presetName = settings.presetId === 'custom' ? 'Custom' : PRESETS[settings.presetId].label

  const phaseLabel = idle
    ? `${pet.name} is hungry`
    : feeding
      ? paused
        ? 'Feeding paused'
        : 'Feeding time'
      : paused
        ? 'Rest is ready'
        : timer.restKind === 'long'
          ? 'Long rest'
          : 'Rest time'

  const tone = resting ? 'rest' : 'feed'

  const onFeed = () => {
    unlockAudio()
    if (settings.notifications && notifyPermission() === 'default') void requestNotifyPermission()
    feed(timer.activeTodoId)
  }

  const every = cycle.longRestEvery
  const done = timer.feedsSinceLongRest
  const toLong = every > 0 ? every - done : 0

  return (
    <section className={`card timer timer--${tone}`} aria-labelledby="timer-title">
      <div className="timer-main">
        <div className="ring" aria-hidden>
          <svg viewBox="0 0 128 128">
            <circle cx="64" cy="64" r={R} className="ring-track" />
            <circle
              cx="64"
              cy="64"
              r={R}
              className="ring-fill"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - p)}
              transform="rotate(-90 64 64)"
            />
          </svg>
          <div className="ring-text">
            <span className="ring-clock">{formatClock(remaining)}</span>
            <span className="ring-sub">{idle ? 'per feeding' : paused ? 'paused' : 'left'}</span>
          </div>
        </div>

        <div className="timer-side">
          <h2 id="timer-title" className="timer-phase">
            <span aria-hidden>{feeding ? '🍖' : resting ? '💤' : '🍽️'}</span> {phaseLabel}
          </h2>
          <p className="muted small timer-desc">
            {idle && `Feeding = ${cycle.feedMin} min of focused work. Then ${pet.name} rests for ${cycle.restMin} min, and so do you.`}
            {feeding && !paused && `Focus on your task. ${pet.name} is eating while you work.`}
            {feeding && paused && `${pet.name} is waiting by the bowl. Resume when you’re back.`}
            {resting && !paused && `${pet.name} is napping. Step away from the screen too.`}
            {resting && paused && 'Start the break when you’re ready to step away.'}
          </p>

          {(idle || feeding) && (
            <label className="field task-pick">
              {feeding ? 'Working on' : 'What will you work on?'}
              <select
                className="select"
                value={timer.activeTodoId ?? ''}
                onChange={(e) => setActiveTodo(e.target.value || null)}
              >
                <option value="">No specific task</option>
                {openTodos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
                {activeTodo?.done && <option value={activeTodo.id}>✓ {activeTodo.title}</option>}
              </select>
            </label>
          )}

          <div className="timer-controls">
            {idle && (
              <button type="button" className="btn btn--feed btn--lg" onClick={onFeed}>
                🍖 Feed {pet.name}
              </button>
            )}

            {feeding && !confirmStop && (
              <>
                {paused ? (
                  <button type="button" className="btn btn--feed" onClick={resume}>
                    Resume
                  </button>
                ) : (
                  <button type="button" className="btn" onClick={pause}>
                    Pause
                  </button>
                )}
                <button type="button" className="btn btn--ghost" onClick={() => setConfirmStop(true)}>
                  Stop early
                </button>
              </>
            )}
            {feeding && confirmStop && (
              <div className="confirm" role="group" aria-label="Confirm stopping">
                <span className="small">
                  Stop now? {pet.name} keeps the {eatenMin} min eaten so far, but this won’t count as a full meal.
                </span>
                <div className="confirm-btns">
                  <button
                    type="button"
                    className="btn btn--sm btn--danger"
                    onClick={() => {
                      setConfirmStop(false)
                      stopFeed()
                    }}
                  >
                    Yes, stop
                  </button>
                  <button type="button" className="btn btn--sm" onClick={() => setConfirmStop(false)}>
                    Keep going
                  </button>
                </div>
              </div>
            )}

            {resting && paused && (
              <button type="button" className="btn btn--rest" onClick={resume}>
                💤 Start rest
              </button>
            )}
            {resting && (
              <button type="button" className="btn btn--ghost" onClick={skipRest}>
                Skip rest
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="timer-foot">
        {every > 0 ? (
          <div className="cycle" aria-label={`${done} of ${every} feedings before a long rest`}>
            <span className="cycle-dots" aria-hidden>
              {Array.from({ length: every }, (_, i) => (
                <span key={i} className={`dot${i < done ? ' dot--on' : ''}${feeding && i === done ? ' dot--now' : ''}`} />
              ))}
            </span>
            <span className="small muted">
              {resting && timer.restKind === 'long'
                ? `Long ${cycle.longRestMin}-min rest earned`
                : `Long rest (${cycle.longRestMin} min) after ${toLong} more feeding${toLong === 1 ? '' : 's'}`}
            </span>
          </div>
        ) : (
          <span className="small muted">No long rests in this schedule</span>
        )}
        <button type="button" className="link-btn small" onClick={onOpenScience}>
          {presetName} · {cycle.feedMin}/{cycle.restMin} min · <span className="u">why these times?</span>
        </button>
      </div>

      {resting && <BreakIdeas />}
    </section>
  )
}
