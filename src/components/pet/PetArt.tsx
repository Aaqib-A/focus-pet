import { stageIndex } from '../../core/growth'
import type { Mood, PetAction, Species, StageId } from '../../core/types'
import { Egg } from './Egg'
import { Dirt } from './parts'
import { Blob } from './species/Blob'
import { Cat } from './species/Cat'
import { Dragon } from './species/Dragon'

const SPECIES = { cat: Cat, dragon: Dragon, blob: Blob }

export interface PetArtAllProps {
  species: Species
  stage: StageId
  mood: Mood
  action: PetAction
  dirty: boolean
  /** Egg only: 0..1 cracking progress. */
  crack?: number
}

/**
 * The pet drawn in a 200×200 box with its feet at y≈190. Wrap it in a
 * transform to place and scale it.
 */
export function PetArt({ species, stage, mood, action, dirty, crack = 0 }: PetArtAllProps) {
  if (stage === 'egg') {
    return <Egg species={species} crack={crack} active={action === 'eating' || action === 'bathing' || action === 'cuddling'} />
  }
  const Species = SPECIES[species]
  return (
    <g className={`pet pet--${action} pet--${mood}`}>
      <g className="pet-body">
        <Species stage={stage} level={stageIndex(stage)} mood={mood} action={action} />
        {dirty && action !== 'bathing' && <Dirt />}
      </g>
    </g>
  )
}

/** Stand-alone SVG preview, used for onboarding cards. */
export function PetPreview(props: PetArtAllProps & { size?: number; title?: string }) {
  const { size = 120, title, ...art } = props
  return (
    <svg viewBox="-12 0 224 204" width={size} height={size} role="img" aria-label={title}>
      <PetArt {...art} />
    </svg>
  )
}
