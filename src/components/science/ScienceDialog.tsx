import { ALBULESCU_2022, PRESETS, type Citation } from '../../core/presets'
import { useAppStore } from '../../store/useAppStore'
import { Dialog } from '../ui/Dialog'
import { EvidenceBadge } from './EvidenceBadge'

export function ScienceDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const presetId = useAppStore((s) => s.settings.presetId)
  const updateSettings = useAppStore((s) => s.updateSettings)

  return (
    <Dialog open={open} onClose={onClose} title="The science behind the timer">
      <p>
        Each <strong>feeding</strong> is a block of focused work, and each <strong>rest</strong> is a break. Their lengths come
        from published research. Here’s what each schedule is based on and how strong the evidence is.
      </p>

      {Object.values(PRESETS).map((p) => (
        <article key={p.id} className={`study${presetId === p.id ? ' study--on' : ''}`}>
          <header className="study-head">
            <h3>{p.label}</h3>
            <EvidenceBadge evidence={p.evidence} />
          </header>
          <p className="study-cycle">
            Feed <strong>{p.cycle.feedMin} min</strong> → rest <strong>{p.cycle.restMin} min</strong>
            {p.cycle.longRestEvery > 0 && (
              <>
                {' '}
                · long rest <strong>{p.cycle.longRestMin} min</strong> after every {p.cycle.longRestEvery}
              </>
            )}
          </p>
          <dl className="study-facts">
            <dt>Who was studied</dt>
            <dd>{p.population}</dd>
            <dt>What it found</dt>
            <dd>{p.finding}</dd>
            {p.caveat && (
              <>
                <dt>Keep in mind</dt>
                <dd>{p.caveat}</dd>
              </>
            )}
          </dl>
          <Sources items={p.citations} />
          {presetId === p.id ? (
            <span className="badge badge--feed">Your current schedule</span>
          ) : (
            <button type="button" className="btn btn--sm" onClick={() => updateSettings({ presetId: p.id })}>
              Use this schedule
            </button>
          )}
        </article>
      ))}

      <article className="study">
        <header className="study-head">
          <h3>Why take breaks at all?</h3>
          <EvidenceBadge evidence="peer-reviewed" />
        </header>
        <p className="small">
          A 2022 meta-analysis of 22 studies (2,335 people) found that short breaks of 10 minutes or less reliably{' '}
          <strong>raise energy and reduce fatigue</strong>. Effects on performance were smaller and clearest for routine
          tasks; after very demanding work, breaks <strong>longer than 10 minutes</strong> helped more. That’s why the
          schedules include an occasional long rest.
        </p>
        <Sources items={[ALBULESCU_2022]} />
      </article>

      <article className="study">
        <h3>How your pet uses this</h3>
        <ul className="small how-list">
          <li>🍖 Your pet grows by every minute of focus it’s fed. Stopping early still counts the minutes eaten.</li>
          <li>💤 Rests restore its energy. Skipping them leaves it (and probably you) tired.</li>
          <li>🫧 Needs drift slowly over time, but your pet never dies and never loses growth.</li>
          <li>🎯 Fixed breaks beat “I’ll stop when I feel like it”: in the Biwer study, self-timed breakers felt more tired and less motivated.</li>
        </ul>
      </article>
    </Dialog>
  )
}

function Sources({ items }: { items: Citation[] }) {
  return (
    <div className="sources">
      <p className="sources-title">Sources</p>
      <ol>
        {items.map((c) => (
          <li key={c.title}>
            {c.authors} ({c.year}). {c.url ? <a href={c.url} target="_blank" rel="noreferrer">{c.title}</a> : <em>{c.title}</em>}.{' '}
            <span className="muted">{c.venue}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
