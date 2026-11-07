import { Face, ShellCap, type PetArtProps } from '../parts'

const BODY = '#7fd8be'
const SHADE = '#4fb497'
const LIGHT = '#c4f3e3'
const GLOW = '#ffd75e'

/** A round, wobbly jelly creature. Grows feet, an antenna, then arms and glowing spots. */
export function Blob({ level, mood, action }: PetArtProps) {
  return (
    <g>
      {/* feet */}
      {level >= 2 && (
        <g fill={SHADE}>
          <ellipse cx={68} cy={192} rx={17} ry={7} />
          <ellipse cx={132} cy={192} rx={17} ry={7} />
        </g>
      )}

      {/* arms */}
      {level >= 4 && (
        <g fill={BODY} stroke={SHADE} strokeWidth={3}>
          <g className="pet-arm-l">
            <ellipse cx={32} cy={146} rx={10} ry={17} transform="rotate(28 32 146)" />
          </g>
          <g className="pet-arm-r">
            <ellipse cx={168} cy={146} rx={10} ry={17} transform="rotate(-28 168 146)" />
          </g>
        </g>
      )}

      {/* antenna */}
      {level >= 3 && (
        <g className="pet-sway">
          <path d="M100 70 Q 103 46 116 32" stroke={SHADE} strokeWidth={4} fill="none" strokeLinecap="round" />
          <circle cx={118} cy={29} r={level >= 5 ? 9 : 7} fill={level >= 5 ? GLOW : LIGHT} stroke={SHADE} strokeWidth={3} />
          {level >= 5 && <circle className="pet-glow" cx={118} cy={29} r={15} fill={GLOW} opacity={0.25} />}
        </g>
      )}

      {/* body */}
      <path d="M30 186 C 26 120, 56 66, 100 66 C 144 66, 174 120, 170 186 Q 100 198 30 186 Z" fill={BODY} stroke={SHADE} strokeWidth={3} />
      <ellipse cx={100} cy={164} rx={44} ry={22} fill={LIGHT} opacity={0.65} />
      <ellipse cx={66} cy={98} rx={10} ry={18} fill="#fff" opacity={0.5} transform="rotate(32 66 98)" />

      {/* adult spots */}
      {level >= 5 && (
        <g fill={SHADE} opacity={0.35}>
          <circle cx={140} cy={110} r={6} />
          <circle cx={150} cy={130} r={4} />
          <circle cx={56} cy={150} r={5} />
        </g>
      )}

      {level === 1 && <ShellCap species="blob" y={72} />}

      <Face cx={100} eyeY={120} eyeDx={26} eyeR={9} mouthY={143} mouthW={12} mood={mood} action={action} />
    </g>
  )
}
