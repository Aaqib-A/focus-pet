import { useState, type FormEvent } from 'react'
import { PRESETS } from '../../core/presets'
import type { Species } from '../../core/types'
import { useAppStore } from '../../store/useAppStore'
import { PetPreview } from '../pet/PetArt'
import '../pet/pet.css'

const OPTIONS: { id: Species; label: string; blurb: string; suggest: string }[] = [
  { id: 'cat', label: 'Kitten', blurb: 'Cozy and curious. Grows long ears, stripes and a bell collar.', suggest: 'Mochi' },
  { id: 'dragon', label: 'Dragon', blurb: 'Hatches tiny. Sprouts horns, then wings that keep on growing.', suggest: 'Ember' },
  { id: 'blob', label: 'Blob', blurb: 'A wobbly jelly friend. Grows feet, an antenna, then arms.', suggest: 'Gloop' },
]

export function AdoptPet() {
  const adopt = useAppStore((s) => s.adopt)
  const [species, setSpecies] = useState<Species>('cat')
  const [name, setName] = useState('')
  const chosen = OPTIONS.find((o) => o.id === species)!
  const finalName = name.trim() || chosen.suggest
  const p = PRESETS.biwer2023.cycle

  const submit = (e: FormEvent) => {
    e.preventDefault()
    adopt(finalName, species)
  }

  return (
    <main className="adopt">
      <form className="adopt-card card" onSubmit={submit}>
        <header className="adopt-head">
          <h1>Adopt a focus pet</h1>
          <p className="muted">Your pet eats while you work and naps while you rest. The more you focus, the bigger it grows.</p>
        </header>

        <fieldset className="species">
          <legend className="sr-only">Choose a pet</legend>
          {OPTIONS.map((o) => (
            <label key={o.id} className={`species-opt${species === o.id ? ' species-opt--on' : ''}`}>
              <input type="radio" name="species" value={o.id} checked={species === o.id} onChange={() => setSpecies(o.id)} />
              <span className="species-art">
                <PetPreview species={o.id} stage="egg" mood="happy" action="idle" dirty={false} size={64} title={`${o.label} egg`} />
                <span className="species-arrow" aria-hidden>
                  →
                </span>
                <PetPreview species={o.id} stage="adult" mood="happy" action="idle" dirty={false} size={96} title={`Grown-up ${o.label.toLowerCase()}`} />
              </span>
              <strong>{o.label}</strong>
              <span className="small muted">{o.blurb}</span>
            </label>
          ))}
        </fieldset>

        <label className="field adopt-name">
          Name your {chosen.label.toLowerCase()}
          <input className="input" value={name} placeholder={chosen.suggest} maxLength={24} onChange={(e) => setName(e.target.value)} />
        </label>

        <ul className="how small">
          <li>
            <span aria-hidden>🍖</span> <strong>Feeding = focus time.</strong> Start a {p.feedMin}-min feeding when you start a task.
          </li>
          <li>
            <span aria-hidden>💤</span> <strong>Rest = your break.</strong> {p.restMin} min while your pet naps, and a longer rest
            every {p.longRestEvery} feedings.
          </li>
          <li>
            <span aria-hidden>🌱</span> <strong>It grows with every minute fed</strong>, from egg to adult.
          </li>
          <li>
            <span aria-hidden>🛁</span> <strong>Bath, play and cuddle</strong> between sessions. Timings are research-based; see “The
            science” anytime.
          </li>
        </ul>

        <button type="submit" className="btn btn--feed btn--lg adopt-go">
          Adopt {finalName} 🥚
        </button>
      </form>
    </main>
  )
}
