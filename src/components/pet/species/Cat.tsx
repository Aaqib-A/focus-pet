import { Face, ShellCap, type PetArtProps } from '../parts'

const FUR = '#f6b26b'
const DARK = '#d9822b'
const LIGHT = '#fde6c8'
const PINK = '#f7a1b0'
const OUTLINE = '#c9782e'

const EAR_H = [0, 18, 24, 30, 36, 40]
const TAIL_UP = [0, 18, 30, 42, 54, 62]

/** A cozy kitten-cat. Ears and tail lengthen, whiskers and stripes appear, adults get a collar. */
export function Cat({ level, mood, action }: PetArtProps) {
  const ear = EAR_H[level]
  const up = TAIL_UP[level]
  return (
    <g>
      {/* tail (behind body) */}
      <path
        className="pet-tail"
        d={`M128 178 C 168 182, 172 ${170 - up * 0.5}, 158 ${172 - up}`}
        stroke={FUR}
        strokeWidth={13}
        fill="none"
        strokeLinecap="round"
      />
      {level >= 3 && (
        <path d={`M158 ${172 - up} l 0 0`} stroke={DARK} strokeWidth={13} strokeLinecap="round" />
      )}

      {/* body */}
      <ellipse cx={100} cy={162} rx={42} ry={29} fill={FUR} stroke={OUTLINE} strokeWidth={3} />
      <ellipse cx={100} cy={168} rx={24} ry={18} fill={LIGHT} />
      {level >= 4 && (
        <g stroke={DARK} strokeWidth={4} strokeLinecap="round" fill="none">
          <path d="M64 152 q 8 6 4 16" />
          <path d="M136 152 q -8 6 -4 16" />
        </g>
      )}

      {/* paws */}
      <g fill={LIGHT} stroke={OUTLINE} strokeWidth={2.5}>
        <ellipse cx={80} cy={187} rx={14} ry={8} />
        <ellipse cx={120} cy={187} rx={14} ry={8} />
      </g>

      {/* ears */}
      <g stroke={OUTLINE} strokeWidth={3} strokeLinejoin="round">
        <path d={`M46 92 L54 ${70 - ear} L88 58 Z`} fill={FUR} />
        <path d={`M154 92 L146 ${70 - ear} L112 58 Z`} fill={FUR} />
      </g>
      <g fill={PINK}>
        <path d={`M56 84 L60 ${74 - ear * 0.8} L80 64 Z`} />
        <path d={`M144 84 L140 ${74 - ear * 0.8} L120 64 Z`} />
      </g>

      {/* head */}
      <ellipse cx={100} cy={104} rx={60} ry={50} fill={FUR} stroke={OUTLINE} strokeWidth={3} />
      <ellipse cx={100} cy={126} rx={24} ry={15} fill={LIGHT} />

      {/* forehead stripes */}
      {level >= 3 && (
        <g stroke={DARK} strokeWidth={4} strokeLinecap="round">
          <path d="M100 58 L100 72" />
          <path d="M87 60 L89 71" />
          <path d="M113 60 L111 71" />
        </g>
      )}

      {/* whiskers */}
      {level >= 2 && (
        <g stroke="#8a5a2b" strokeWidth={1.8} strokeLinecap="round" opacity={0.7}>
          <path d="M64 122 L34 116" />
          <path d="M64 128 L34 130" />
          <path d="M136 122 L166 116" />
          <path d="M136 128 L166 130" />
        </g>
      )}

      {/* collar + bell */}
      {level >= 5 && (
        <g>
          <path d="M66 146 Q 100 162 134 146" stroke="#d64f5c" strokeWidth={7} fill="none" strokeLinecap="round" />
          <circle cx={100} cy={158} r={6.5} fill="#ffd34d" stroke="#c99a1c" strokeWidth={2} />
        </g>
      )}

      {level === 1 && <ShellCap species="cat" y={60} />}

      <Face cx={100} eyeY={102} eyeDx={24} eyeR={8.5} mouthY={128} mouthW={9} mood={mood} action={action} cheekY={120} />
      <path d="M95 117 L105 117 L100 122 Z" fill="#e57f91" />
    </g>
  )
}
