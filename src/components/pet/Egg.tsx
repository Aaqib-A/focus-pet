import type { Species } from '../../core/types'
import { EGG_COLORS } from './colors'

interface Props {
  species: Species
  /** 0..1 — cracks spread as the first feeding progresses. */
  crack: number
  active: boolean
}

const CRACK = 'M100 82 L94 98 L104 108 L92 122 L102 134 L90 150'
const CRACK_2 = 'M104 108 L118 116 L114 128'

export function Egg({ species, crack, active }: Props) {
  const { shell, spot, edge } = EGG_COLORS[species]
  return (
    <g className={`egg${active ? ' egg--active' : ''}`}>
      <path
        d="M100 70 C 138 70, 152 136, 150 158 C 148 182, 126 192, 100 192 C 74 192, 52 182, 50 158 C 48 136, 62 70, 100 70 Z"
        fill={shell}
        stroke={edge}
        strokeWidth={3}
      />
      <g fill={spot} opacity={0.75}>
        <circle cx={80} cy={118} r={8} />
        <circle cx={120} cy={100} r={6} />
        <circle cx={114} cy={150} r={11} />
        <circle cx={76} cy={162} r={6} />
        <circle cx={132} cy={170} r={5} />
        <circle cx={96} cy={86} r={4} />
      </g>
      <ellipse cx={78} cy={96} rx={7} ry={14} fill="#fff" opacity={0.6} transform="rotate(22 78 96)" />
      {crack > 0.05 && (
        <g stroke="#6b5a49" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={CRACK} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - Math.min(1, crack * 1.2)} />
          {crack > 0.6 && <path d={CRACK_2} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - Math.min(1, (crack - 0.6) * 2.5)} />}
        </g>
      )}
    </g>
  )
}
