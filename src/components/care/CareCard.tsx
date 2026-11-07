import { canCare, playsLeft } from '../../core/game'
import { MAX_PLAYS_PER_BREAK } from '../../core/needs'
import type { StatKey } from '../../core/types'
import { useAppStore } from '../../store/useAppStore'
import { Meter } from '../ui/Meter'

const STATS: { key: StatKey; label: string; icon: string }[] = [
  { key: 'fullness', label: 'Fullness', icon: '🍖' },
  { key: 'energy', label: 'Energy', icon: '⚡' },
  { key: 'cleanliness', label: 'Cleanliness', icon: '🫧' },
  { key: 'happiness', label: 'Happiness', icon: '💛' },
]

export function CareCard() {
  const game = useAppStore((s) => s.game!)
  const bath = useAppStore((s) => s.bath)
  const play = useAppStore((s) => s.play)
  const cuddle = useAppStore((s) => s.cuddle)
  const treat = useAppStore((s) => s.treat)
  const { pet } = game
  const allowed = canCare(game)
  const plays = playsLeft(game)
  const egg = !pet.hatched

  return (
    <section className="card" aria-labelledby="care-title">
      <h2 id="care-title" className="card-title">
        Care for {pet.name}
        {pet.treats > 0 && <span className="badge badge--feed">🍪 {pet.treats} treat{pet.treats === 1 ? '' : 's'}</span>}
      </h2>

      <div className="stat-grid">
        {STATS.map((s) => (
          <Meter key={s.key} label={s.label} icon={s.icon} value={pet.stats[s.key]} severity />
        ))}
      </div>

      <div className="care-actions">
        <button type="button" className="care-btn" onClick={bath} disabled={!allowed}>
          <span aria-hidden className="care-ico">🛁</span>
          <span>Bath</span>
        </button>
        <button type="button" className="care-btn" onClick={play} disabled={!allowed || plays === 0 || egg}>
          <span aria-hidden className="care-ico">⚽</span>
          <span>Play</span>
          <span className="care-sub">
            {plays}/{MAX_PLAYS_PER_BREAK} left
          </span>
        </button>
        <button type="button" className="care-btn" onClick={cuddle} disabled={!allowed}>
          <span aria-hidden className="care-ico">🤗</span>
          <span>Cuddle</span>
        </button>
        <button type="button" className="care-btn" onClick={treat} disabled={!allowed || pet.treats === 0 || egg}>
          <span aria-hidden className="care-ico">🍪</span>
          <span>Treat</span>
          <span className="care-sub">{pet.treats} owned</span>
        </button>
      </div>

      <p className="muted small care-note" aria-live="polite">
        {!allowed
          ? `Care is paused while ${pet.name} eats. Stay focused on your task!`
          : egg
            ? 'Your egg hatches after its first full feeding. Keep it warm with cuddles.'
            : plays === 0
              ? `${pet.name} is tired of playing. Finish a feeding to play again.`
              : 'Finish tasks to earn treats. Play is limited per break so you still step away from the screen.'}
      </p>
    </section>
  )
}
