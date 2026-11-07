import { useState } from 'react'
import { PRESETS } from '../../core/presets'
import type { CycleConfig, PresetId } from '../../core/types'
import { notifyPermission, requestNotifyPermission } from '../../lib/notify'
import { useAppStore } from '../../store/useAppStore'
import { Dialog } from '../ui/Dialog'
import { EvidenceBadge } from '../science/EvidenceBadge'

interface Props {
  open: boolean
  onClose: () => void
  onOpenScience: () => void
}

export function SettingsDialog({ open, onClose, onOpenScience }: Props) {
  return (
    <Dialog open={open} onClose={onClose} title="Settings">
      {open && <SettingsBody onClose={onClose} onOpenScience={onOpenScience} />}
    </Dialog>
  )
}

function SettingsBody({ onClose, onOpenScience }: Omit<Props, 'open'>) {
  const settings = useAppStore((s) => s.settings)
  const update = useAppStore((s) => s.updateSettings)
  const resetPet = useAppStore((s) => s.resetPet)
  const petName = useAppStore((s) => s.game?.pet.name ?? 'your pet')
  const phase = useAppStore((s) => s.game?.timer.phase ?? 'idle')
  const [perm, setPerm] = useState(notifyPermission())
  const [confirmReset, setConfirmReset] = useState(false)

  const choose = (id: PresetId) => update({ presetId: id })

  const toggleNotifications = async (on: boolean) => {
    update({ notifications: on })
    if (on) setPerm(await requestNotifyPermission())
  }

  return (
    <>
      <section className="settings-section">
        <div className="settings-head">
          <h3>Feeding &amp; rest schedule</h3>
          <button type="button" className="link-btn small" onClick={onOpenScience}>
            <span className="u">Read the research</span>
          </button>
        </div>
        {phase !== 'idle' && <p className="small muted">Changes apply from the next feeding or rest.</p>}

        <div className="presets" role="radiogroup" aria-label="Schedule">
          {Object.values(PRESETS).map((p) => (
            <label key={p.id} className={`preset${settings.presetId === p.id ? ' preset--on' : ''}`}>
              <input type="radio" name="preset" checked={settings.presetId === p.id} onChange={() => choose(p.id)} />
              <span className="preset-body">
                <span className="preset-top">
                  <strong>{p.label}</strong>
                  <EvidenceBadge evidence={p.evidence} />
                </span>
                <span className="small">
                  Feed {p.cycle.feedMin} min → rest {p.cycle.restMin} min
                  {p.cycle.longRestEvery > 0 && ` · ${p.cycle.longRestMin}-min long rest every ${p.cycle.longRestEvery}`}
                </span>
                <span className="small muted">{p.population}</span>
              </span>
            </label>
          ))}
          <label className={`preset${settings.presetId === 'custom' ? ' preset--on' : ''}`}>
            <input type="radio" name="preset" checked={settings.presetId === 'custom'} onChange={() => choose('custom')} />
            <span className="preset-body">
              <span className="preset-top">
                <strong>Custom</strong>
              </span>
              <span className="small muted">Set your own lengths</span>
            </span>
          </label>
        </div>

        {settings.presetId === 'custom' && <CustomCycle value={settings.custom} onChange={(custom) => update({ custom })} />}
      </section>

      <section className="settings-section">
        <h3>Alerts</h3>
        <label className="switch">
          <span>Play a chime when feeding or rest ends</span>
          <input type="checkbox" checked={settings.sound} onChange={(e) => update({ sound: e.target.checked })} />
        </label>
        <label className="switch">
          <span>
            Browser notifications when the tab is in the background
            {settings.notifications && perm === 'denied' && (
              <span className="block small muted">Blocked by your browser. Allow notifications for this site in its settings.</span>
            )}
            {perm === 'unsupported' && <span className="block small muted">Not supported in this browser.</span>}
          </span>
          <input
            type="checkbox"
            checked={settings.notifications}
            onChange={(e) => void toggleNotifications(e.target.checked)}
            disabled={perm === 'unsupported'}
          />
        </label>
        <label className="switch">
          <span>
            Start the rest automatically after feeding
            <span className="block small muted">If off, you start each break yourself.</span>
          </span>
          <input type="checkbox" checked={settings.autoStartRest} onChange={(e) => update({ autoStartRest: e.target.checked })} />
        </label>
      </section>

      <section className="settings-section danger">
        <h3>Start over</h3>
        {!confirmReset ? (
          <button type="button" className="btn btn--danger" onClick={() => setConfirmReset(true)}>
            Say goodbye to {petName}…
          </button>
        ) : (
          <div className="confirm">
            <span className="small">
              This erases {petName}, your tasks and your history on this device. It can’t be undone.
            </span>
            <div className="confirm-btns">
              <button
                type="button"
                className="btn btn--sm btn--danger"
                onClick={() => {
                  resetPet()
                  onClose()
                }}
              >
                Erase and start over
              </button>
              <button type="button" className="btn btn--sm" onClick={() => setConfirmReset(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
        <p className="small muted">Everything is saved only in this browser. Nothing is sent anywhere.</p>
      </section>
    </>
  )
}

const FIELDS: { key: keyof CycleConfig; label: string; min: number; max: number; hint?: string }[] = [
  { key: 'feedMin', label: 'Feeding (work) minutes', min: 1, max: 180 },
  { key: 'restMin', label: 'Rest (break) minutes', min: 1, max: 60 },
  { key: 'longRestMin', label: 'Long rest minutes', min: 1, max: 90 },
  { key: 'longRestEvery', label: 'Long rest every … feedings', min: 0, max: 12, hint: '0 = never' },
]

function CustomCycle({ value, onChange }: { value: CycleConfig; onChange: (c: CycleConfig) => void }) {
  const [draft, setDraft] = useState<Record<keyof CycleConfig, string>>({
    feedMin: String(value.feedMin),
    restMin: String(value.restMin),
    longRestMin: String(value.longRestMin),
    longRestEvery: String(value.longRestEvery),
  })
  const commit = () =>
    onChange({
      feedMin: Number(draft.feedMin),
      restMin: Number(draft.restMin),
      longRestMin: Number(draft.longRestMin),
      longRestEvery: Number(draft.longRestEvery),
    })

  return (
    <div className="custom-grid">
      {FIELDS.map((f) => (
        <label key={f.key} className="field">
          <span>
            {f.label} {f.hint && <span className="muted">({f.hint})</span>}
          </span>
          <input
            type="number"
            className="input"
            inputMode="numeric"
            min={f.min}
            max={f.max}
            value={draft[f.key]}
            onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
            onBlur={commit}
            onKeyDown={(e) => e.key === 'Enter' && commit()}
          />
        </label>
      ))}
    </div>
  )
}
