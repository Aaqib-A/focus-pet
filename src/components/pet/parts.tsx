import type { Mood, PetAction, Species, StageId } from '../../core/types'
import { EGG_COLORS } from './colors'

export interface PetArtProps {
  stage: Exclude<StageId, 'egg'>
  /** 1 = hatchling … 5 = adult */
  level: number
  mood: Mood
  action: PetAction
}

const INK = '#2b2420'
const MOUTH = '#7a2e36'
const TONGUE = '#ff8f8f'
const BLUSH = '#ff8fa3'

type EyeStyle = 'open' | 'closed' | 'bliss' | 'droopy'
type MouthStyle = 'chew' | 'o' | 'grin' | 'smile' | 'frown' | 'flat'

function eyeStyle(mood: Mood, action: PetAction): EyeStyle {
  if (action === 'sleeping') return 'closed'
  if (action === 'cuddling' || action === 'treat' || action === 'bathing') return 'bliss'
  if (mood === 'sleepy') return 'droopy'
  return 'open'
}

function mouthStyle(mood: Mood, action: PetAction): MouthStyle {
  if (action === 'eating' || action === 'treat') return 'chew'
  if (action === 'sleeping' || action === 'waiting') return 'o'
  if (action === 'playing' || action === 'cuddling' || action === 'bathing') return 'grin'
  return { happy: 'grin', neutral: 'smile', sad: 'frown', sleepy: 'flat' }[mood] as MouthStyle
}

interface FaceProps {
  cx: number
  eyeY: number
  eyeDx: number
  eyeR: number
  mouthY: number
  mouthW: number
  mood: Mood
  action: PetAction
  cheekDx?: number
  cheekY?: number
}

export function Face({ cx, eyeY, eyeDx, eyeR: r, mouthY, mouthW: w, mood, action, cheekDx, cheekY }: FaceProps) {
  const eyes = eyeStyle(mood, action)
  const mouth = mouthStyle(mood, action)
  const xs = [cx - eyeDx, cx + eyeDx]
  const blushOpacity = mood === 'happy' || eyes === 'bliss' ? 0.7 : mood === 'sad' ? 0.15 : 0.4

  return (
    <g>
      {/* cheeks */}
      {[-1, 1].map((side) => (
        <ellipse
          key={side}
          cx={cx + side * (cheekDx ?? eyeDx + r)}
          cy={cheekY ?? eyeY + r * 1.9}
          rx={r * 1.1}
          ry={r * 0.65}
          fill={BLUSH}
          opacity={blushOpacity}
        />
      ))}

      {/* eyes */}
      {eyes === 'open' && (
        <g className="pet-eyes">
          {xs.map((x, i) => (
            <g key={i}>
              <ellipse cx={x} cy={eyeY} rx={r} ry={r * 1.18} fill={INK} />
              <circle cx={x - r * 0.35} cy={eyeY - r * 0.45} r={r * 0.38} fill="#fff" />
              <circle cx={x + r * 0.4} cy={eyeY + r * 0.35} r={r * 0.16} fill="#fff" />
            </g>
          ))}
        </g>
      )}
      {eyes === 'droopy' &&
        xs.map((x, i) => (
          <g key={i}>
            <path d={`M${x - r} ${eyeY} A ${r} ${r * 0.9} 0 0 0 ${x + r} ${eyeY} Z`} fill={INK} />
            <path d={`M${x - r * 1.2} ${eyeY - 1} L${x + r * 1.2} ${eyeY - 1}`} stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
          </g>
        ))}
      {eyes === 'closed' &&
        xs.map((x, i) => (
          <path
            key={i}
            d={`M${x - r} ${eyeY} Q ${x} ${eyeY + r * 0.9} ${x + r} ${eyeY}`}
            stroke={INK}
            strokeWidth={2.8}
            fill="none"
            strokeLinecap="round"
          />
        ))}
      {eyes === 'bliss' &&
        xs.map((x, i) => (
          <path
            key={i}
            d={`M${x - r} ${eyeY + r * 0.35} Q ${x} ${eyeY - r * 1.1} ${x + r} ${eyeY + r * 0.35}`}
            stroke={INK}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
          />
        ))}

      {/* sad brows */}
      {mood === 'sad' && eyes !== 'closed' && eyes !== 'bliss' && (
        <g stroke={INK} strokeWidth={2.5} strokeLinecap="round">
          <path d={`M${xs[0] - r} ${eyeY - r * 1.5} L${xs[0] + r * 0.7} ${eyeY - r * 2.1}`} />
          <path d={`M${xs[1] + r} ${eyeY - r * 1.5} L${xs[1] - r * 0.7} ${eyeY - r * 2.1}`} />
        </g>
      )}

      {/* mouth */}
      {mouth === 'chew' && (
        <g className="pet-mouth-chew">
          <ellipse cx={cx} cy={mouthY + w * 0.3} rx={w * 0.75} ry={w * 0.6} fill={MOUTH} />
          <ellipse cx={cx} cy={mouthY + w * 0.62} rx={w * 0.45} ry={w * 0.22} fill={TONGUE} />
        </g>
      )}
      {mouth === 'o' && <ellipse cx={cx} cy={mouthY + w * 0.2} rx={w * 0.32} ry={w * 0.38} fill={MOUTH} />}
      {mouth === 'grin' && (
        <g>
          <path d={`M${cx - w} ${mouthY} Q ${cx} ${mouthY + w * 1.5} ${cx + w} ${mouthY} Z`} fill={MOUTH} />
          <path d={`M${cx - w * 0.5} ${mouthY + w * 0.62} Q ${cx} ${mouthY + w * 1.05} ${cx + w * 0.5} ${mouthY + w * 0.62} Q ${cx} ${mouthY + w * 0.3} ${cx - w * 0.5} ${mouthY + w * 0.62} Z`} fill={TONGUE} />
        </g>
      )}
      {mouth === 'smile' && (
        <path d={`M${cx - w * 0.7} ${mouthY} Q ${cx} ${mouthY + w * 0.8} ${cx + w * 0.7} ${mouthY}`} stroke={INK} strokeWidth={2.6} fill="none" strokeLinecap="round" />
      )}
      {mouth === 'frown' && (
        <path d={`M${cx - w * 0.6} ${mouthY + w * 0.5} Q ${cx} ${mouthY - w * 0.15} ${cx + w * 0.6} ${mouthY + w * 0.5}`} stroke={INK} strokeWidth={2.6} fill="none" strokeLinecap="round" />
      )}
      {mouth === 'flat' && (
        <path d={`M${cx - w * 0.45} ${mouthY + w * 0.3} L${cx + w * 0.45} ${mouthY + w * 0.3}`} stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
      )}
    </g>
  )
}

/** Half an eggshell worn as a hat by fresh hatchlings. */
export function ShellCap({ species, y, cx = 100 }: { species: Species; y: number; cx?: number }) {
  const { shell, edge, spot } = EGG_COLORS[species]
  const zig = Array.from({ length: 9 }, (_, i) => `L${cx - 32 + i * 8} ${y + (i % 2 ? -4 : 6)}`).join(' ')
  return (
    <g>
      <path d={`M${cx - 34} ${y + 6} ${zig} L${cx + 34} ${y + 6} C ${cx + 32} ${y - 30}, ${cx - 32} ${y - 30}, ${cx - 34} ${y + 6} Z`} fill={shell} stroke={edge} strokeWidth={2.5} strokeLinejoin="round" />
      <circle cx={cx - 12} cy={y - 12} r={4} fill={spot} opacity={0.8} />
      <circle cx={cx + 14} cy={y - 8} r={3} fill={spot} opacity={0.8} />
    </g>
  )
}

/** Mud spots and smell lines shown when cleanliness is low. */
export function Dirt() {
  return (
    <g className="pet-dirt" aria-hidden>
      <g fill="#8b6845" opacity={0.5}>
        <ellipse cx={80} cy={170} rx={8} ry={5} />
        <ellipse cx={122} cy={158} rx={6} ry={4} />
        <ellipse cx={130} cy={112} rx={5} ry={4} />
        <ellipse cx={68} cy={128} rx={6} ry={4} />
        <circle cx={112} cy={178} r={3} />
      </g>
      <g stroke="#8aa04a" strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.75}>
        <path className="stink stink-1" d="M44 96 q -8 -8 0 -16 q 8 -8 0 -16" />
        <path className="stink stink-2" d="M158 92 q 8 -8 0 -16 q -8 -8 0 -16" />
      </g>
    </g>
  )
}
