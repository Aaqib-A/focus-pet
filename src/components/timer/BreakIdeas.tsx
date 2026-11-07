import { dayKey, dayStats } from '../../core/dates'
import { useNow } from '../../hooks/useNow'
import { useAppStore } from '../../store/useAppStore'

const IDEAS = [
  { icon: '🧍', text: 'Stand up and roll your shoulders and neck slowly.' },
  { icon: '💧', text: 'Refill your water and drink a glass.' },
  { icon: '🪟', text: 'Look out of a window at something far away to rest your eyes.' },
  { icon: '🚶', text: 'Take a short walk, even just around the room or down the hall.' },
  { icon: '🌬️', text: 'Take five slow breaths: in for 4, out for 6.' },
  { icon: '🙆', text: 'Stretch your arms overhead, then your wrists and fingers.' },
  { icon: '🌿', text: 'Step outside or near a plant for a minute of fresh air.' },
  { icon: '☕', text: 'Make a tea or coffee without your phone.' },
]

export function BreakIdeas() {
  const game = useAppStore((s) => s.game!)
  const now = useNow(60_000)
  const long = game.timer.restKind === 'long'
  // Rotate through ideas as the day's meals add up, so each break suggests something new.
  const meals = dayStats(game.dayLog, dayKey(now)).meals
  const ideas = [IDEAS[meals % IDEAS.length], IDEAS[(meals + 3) % IDEAS.length]]

  return (
    <div className="break-ideas">
      <p className="break-title">{long ? 'Long rest: get properly away for a bit' : 'Break idea'}</p>
      <ul>
        {(long ? ideas : ideas.slice(0, 1)).map((i) => (
          <li key={i.text}>
            <span aria-hidden>{i.icon}</span> {i.text}
          </li>
        ))}
      </ul>
      <p className="muted small">Breaks away from the screen restore energy best. {game.pet.name} will call you when it’s time.</p>
    </div>
  )
}
