import { formatMinutes } from '../../core/format'
import { growthInfo } from '../../core/growth'
import { useAppStore } from '../../store/useAppStore'
import { Meter } from '../ui/Meter'
import { PetStage } from './PetStage'

const SPECIES_LABEL = { cat: 'Kitten', dragon: 'Dragon', blob: 'Blob' }

export function PetCard() {
  const pet = useAppStore((s) => s.game!.pet)
  const info = growthInfo(pet.growthMinutes, pet.hatched)

  let growthLabel: string
  let growthValue: string
  if (info.stage === 'egg') {
    growthLabel = 'Hatching'
    growthValue = 'after the first full feeding'
  } else if (info.next) {
    growthLabel = `Growing into a ${info.next.label.toLowerCase()}`
    growthValue = `${formatMinutes(info.minutesToNext ?? 0)} of focus to go`
  } else {
    growthLabel = 'Fully grown'
    growthValue = info.progress < 1 ? 'still filling out' : 'big and strong'
  }

  return (
    <section className="card pet-card" aria-labelledby="pet-name">
      <PetStage />
      <div className="pet-meta">
        <div className="pet-id">
          <h2 id="pet-name" className="pet-name">
            {pet.name}
          </h2>
          <span className="badge">
            {SPECIES_LABEL[pet.species]} · {info.label}
          </span>
        </div>
        <p className="muted small">
          <strong className="ink">{formatMinutes(pet.growthMinutes)}</strong> of focus eaten
        </p>
      </div>
      <Meter label={growthLabel} valueText={growthValue} value={info.stage === 'egg' ? 0 : info.progress * 100} />
    </section>
  )
}
