import type { Preset } from '../../core/presets'

export function EvidenceBadge({ evidence }: { evidence: Preset['evidence'] }) {
  if (evidence === 'peer-reviewed') return <span className="badge badge--good">✓ Peer-reviewed</span>
  if (evidence === 'observational') return <span className="badge badge--warn">◐ Observational</span>
  return null
}
