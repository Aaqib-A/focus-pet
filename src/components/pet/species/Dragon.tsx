import { Face, ShellCap, type PetArtProps } from '../parts'

const SCALE = '#9a86e8'
const SHADE = '#7461c9'
const SNOUT = '#b8aaf2'
const BELLY = '#ffe2ad'
const HORN = '#f6ead0'
const GOLD = '#ffcf5a'

const HORN_H = [0, 0, 8, 14, 20, 28]
const WING = [0, 0, 0, 26, 40, 54]
const TAIL = [0, 14, 20, 26, 32, 38]

/** A small dragon. Horns sprout, wings unfold and grow, adults get golden horns and back spikes. */
export function Dragon({ level, mood, action }: PetArtProps) {
  const h = HORN_H[level]
  const w = WING[level]
  const t = TAIL[level]
  return (
    <g>
      {/* wings (behind) */}
      {w > 0 && (
        <g fill={SNOUT} stroke={SHADE} strokeWidth={3} strokeLinejoin="round">
          <path
            className="pet-wing-l"
            d={`M72 146 L${72 - w} ${126 - w * 0.6} Q ${72 - w * 0.55} ${136} ${72 - w * 0.8} ${152} Q ${72 - w * 0.35} ${148} 76 160 Z`}
          />
          <path
            className="pet-wing-r"
            d={`M128 146 L${128 + w} ${126 - w * 0.6} Q ${128 + w * 0.55} ${136} ${128 + w * 0.8} ${152} Q ${128 + w * 0.35} ${148} 124 160 Z`}
          />
        </g>
      )}

      {/* tail */}
      <g className="pet-tail-l">
        <path d={`M76 178 Q ${54} ${194} ${48 - t} ${176 - t * 0.4}`} stroke={SCALE} strokeWidth={14} fill="none" strokeLinecap="round" />
        <path
          d={`M${48 - t} ${176 - t * 0.4} l -10 -10 l 4 14 l -12 4 l 16 4 Z`}
          fill={level >= 5 ? GOLD : SHADE}
          stroke={SHADE}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </g>

      {/* body */}
      <ellipse cx={100} cy={160} rx={42} ry={32} fill={SCALE} stroke={SHADE} strokeWidth={3} />
      <ellipse cx={100} cy={166} rx={26} ry={22} fill={BELLY} />
      <g stroke="#e8c27c" strokeWidth={2} strokeLinecap="round">
        <path d="M84 158 L116 158" />
        <path d="M82 168 L118 168" />
        <path d="M86 178 L114 178" />
      </g>

      {/* feet */}
      <g fill={SHADE}>
        <ellipse cx={78} cy={188} rx={14} ry={8} />
        <ellipse cx={122} cy={188} rx={14} ry={8} />
      </g>

      {/* horns */}
      {h > 0 && (
        <g fill={level >= 5 ? GOLD : HORN} stroke={SHADE} strokeWidth={2.5} strokeLinejoin="round">
          <path d={`M62 70 Q ${52 - h * 0.2} ${60 - h * 0.4} ${54 - h * 0.35} ${58 - h} Q ${70} ${62} 80 60 Z`} />
          <path d={`M138 70 Q ${148 + h * 0.2} ${60 - h * 0.4} ${146 + h * 0.35} ${58 - h} Q ${130} ${62} 120 60 Z`} />
        </g>
      )}

      {/* back-of-head spikes */}
      {level >= 4 && (
        <g fill={SHADE}>
          <path d="M86 56 L92 42 L98 55 Z" />
          <path d="M98 54 L104 38 L110 54 Z" />
          {level >= 5 && <path d="M110 56 L117 44 L121 58 Z" />}
        </g>
      )}

      {/* head */}
      <ellipse cx={100} cy={100} rx={58} ry={50} fill={SCALE} stroke={SHADE} strokeWidth={3} />
      <ellipse cx={100} cy={128} rx={28} ry={16} fill={SNOUT} />
      <g fill={SHADE}>
        <ellipse cx={92} cy={122} rx={2.5} ry={2} />
        <ellipse cx={108} cy={122} rx={2.5} ry={2} />
      </g>

      {level === 1 && <ShellCap species="dragon" y={56} />}

      <Face cx={100} eyeY={96} eyeDx={24} eyeR={9} mouthY={131} mouthW={10} mood={mood} action={action} cheekY={114} cheekDx={40} />
    </g>
  )
}
