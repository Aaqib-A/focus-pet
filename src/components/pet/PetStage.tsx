import { useEffect, useState } from 'react'
import { canCare } from '../../core/game'
import { growthInfo } from '../../core/growth'
import { isDirty, moodFor } from '../../core/needs'
import { isPaused, progress } from '../../core/timer'
import type { PetAction } from '../../core/types'
import { useNow } from '../../hooks/useNow'
import { useAppStore, type CareKind } from '../../store/useAppStore'
import { PetArt } from './PetArt'
import './pet.css'

const FX_MS: Record<CareKind, number> = { bathing: 4200, playing: 2600, cuddling: 2000, treat: 2400 }
const GROUND = 222
const BASE_SCALE = 0.92

const MOOD_TEXT = { happy: 'happy', neutral: 'content', sad: 'a bit down', sleepy: 'sleepy' }

export function PetStage() {
  const game = useAppStore((s) => s.game)!
  const careFx = useAppStore((s) => s.careFx)
  const cuddle = useAppStore((s) => s.cuddle)
  const { pet, timer } = game

  // A care animation plays until its duration passes; the timeout marks it finished.
  const [finishedFx, setFinishedFx] = useState<number | null>(null)
  useEffect(() => {
    if (!careFx) return
    const t = setTimeout(() => setFinishedFx(careFx.id), Math.max(0, careFx.at + FX_MS[careFx.kind] - Date.now()))
    return () => clearTimeout(t)
  }, [careFx])
  const fx: CareKind | null = careFx && finishedFx !== careFx.id ? careFx.kind : null

  const feeding = timer.phase === 'feeding'
  const resting = timer.phase === 'resting'
  const paused = isPaused(timer)
  const now = useNow(500, feeding && !paused)
  const p = feeding ? progress(timer, now) : 0

  const info = growthInfo(pet.growthMinutes, pet.hatched)
  const mood = moodFor(pet.stats)
  const dirty = isDirty(pet.stats)

  let action: PetAction = 'idle'
  if (fx) action = fx
  else if (feeding) action = paused ? 'waiting' : 'eating'
  else if (resting && !paused) action = 'sleeping'

  const s = info.size * BASE_SCALE
  const tx = 200 - 100 * s
  const ty = GROUND - 190 * s
  const headX = 200 + 55 * s
  const headY = GROUND - 165 * s
  const night = resting
  const clickable = canCare(game)

  const label = `${pet.name} the ${info.label.toLowerCase()} is ${
    action === 'eating' ? 'eating' : action === 'sleeping' ? 'napping' : action === 'waiting' ? 'waiting for food' : MOOD_TEXT[mood]
  }${dirty ? ' and needs a bath' : ''}.`

  return (
    <div className={`scene${night ? ' scene--night' : ''}`}>
      <svg viewBox="0 0 400 250" role="img" aria-label={label} className="scene-svg">
        <defs>
          <linearGradient id="wall-day" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff3e0" />
            <stop offset="1" stopColor="#fde3c3" />
          </linearGradient>
          <linearGradient id="wall-night" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2b3061" />
            <stop offset="1" stopColor="#3a3570" />
          </linearGradient>
        </defs>

        {/* room */}
        <rect width="400" height="250" fill={night ? 'url(#wall-night)' : 'url(#wall-day)'} />
        <rect y="196" width="400" height="54" fill={night ? '#3f3a63' : '#e8c597'} />
        <g stroke={night ? '#35315a' : '#d7ae7d'} strokeWidth="2">
          <path d="M0 214 H400 M0 234 H400" />
          <path d="M70 196 V214 M180 214 V234 M300 196 V214 M120 234 V250 M260 234 V250" />
        </g>

        {/* window */}
        <g>
          <rect x="28" y="24" width="96" height="74" rx="8" fill={night ? '#1c2148' : '#bfe4ff'} stroke={night ? '#59528f' : '#e0b98a'} strokeWidth="5" />
          {night ? (
            <g>
              <path d="M96 40 a 14 14 0 1 0 10 24 a 11 11 0 1 1 -10 -24 Z" fill="#fff4c2" />
              <g fill="#fff" className="twinkle">
                <circle cx="46" cy="40" r="1.6" />
                <circle cx="62" cy="70" r="1.3" />
                <circle cx="80" cy="46" r="1.1" />
                <circle cx="110" cy="84" r="1.3" />
              </g>
            </g>
          ) : (
            <g>
              <circle cx="100" cy="46" r="11" fill="#ffd45e" />
              <g fill="#fff" className="cloud">
                <ellipse cx="54" cy="64" rx="16" ry="7" />
                <ellipse cx="66" cy="59" rx="10" ry="7" />
              </g>
            </g>
          )}
          <path d="M76 24 V98 M28 61 H124" stroke={night ? '#59528f' : '#e0b98a'} strokeWidth="4" />
        </g>

        {/* plant */}
        <g>
          <path d="M352 150 q -18 -30 -4 -52 q 10 24 4 52 Z" fill={night ? '#3f7a63' : '#6cc08f'} />
          <path d="M356 150 q 20 -26 8 -50 q -14 22 -8 50 Z" fill={night ? '#356b56' : '#58ad7c'} />
          <path d="M354 152 q -2 -34 10 -60" stroke={night ? '#356b56' : '#4f9c6f'} strokeWidth="3" fill="none" />
          <path d="M336 150 h40 l-6 46 h-28 Z" fill={night ? '#8a5a62' : '#e27d60'} />
        </g>

        {/* rug */}
        <ellipse cx="200" cy={GROUND + 4} rx="150" ry="18" fill={night ? '#5a4e8c' : '#f3a99f'} opacity="0.6" />

        {/* bed during rest */}
        {resting && (
          <g>
            <ellipse cx="200" cy={GROUND} rx={80 * s + 34} ry="17" fill="#7b6bd0" />
            <ellipse cx="200" cy={GROUND - 4} rx={80 * s + 24} ry="11" fill="#9a8ce6" />
          </g>
        )}

        {/* food bowl */}
        {feeding && (
          <g aria-hidden transform="translate(-34 0)">
            <FoodBowl remaining={1 - p} />
          </g>
        )}

        {/* the pet */}
        <g
          transform={`translate(${tx} ${ty}) scale(${s})`}
          onClick={clickable ? cuddle : undefined}
          onKeyDown={(e) => {
            if (clickable && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault()
              cuddle()
            }
          }}
          role={clickable ? 'button' : undefined}
          tabIndex={clickable ? 0 : undefined}
          aria-label={clickable ? `Cuddle ${pet.name}` : undefined}
          className={clickable ? 'pet-click' : undefined}
        >
          <PetArt species={pet.species} stage={info.stage} mood={mood} action={action} dirty={dirty} crack={!pet.hatched && feeding ? p : 0} />
        </g>

        {/* effects */}
        {action === 'eating' && pet.hatched && (
          <text x={headX} y={headY} className="fx-nom" aria-hidden>
            nom
          </text>
        )}
        {action === 'sleeping' && (
          <g className="fx-zzz" aria-hidden fill="#fff">
            <text x={headX} y={headY} fontSize="18">z</text>
            <text x={headX + 10} y={headY - 14} fontSize="22">z</text>
            <text x={headX + 22} y={headY - 32} fontSize="26">Z</text>
          </g>
        )}
        {action === 'bathing' && <Bath s={s} />}
        {action === 'playing' && <Ball />}
        {action === 'cuddling' && <Hearts x={200} y={GROUND - 170 * s} />}
        {action === 'treat' && <Treat x={headX - 30 * s} y={GROUND - 95 * s} />}
      </svg>
    </div>
  )
}

function FoodBowl({ remaining }: { remaining: number }) {
  const h = 15 * Math.max(0, Math.min(1, remaining))
  return (
    <g>
      {h > 0.8 && (
        <g>
          <path d={`M306 206 A 24 ${h} 0 0 1 354 206 Z`} fill="#b8733a" />
          {h > 6 && (
            <g fill="#8e5428">
              <circle cx="320" cy={206 - h * 0.4} r="2.5" />
              <circle cx="334" cy={206 - h * 0.7} r="2.5" />
              <circle cx="344" cy={206 - h * 0.35} r="2.5" />
            </g>
          )}
        </g>
      )}
      <path d="M298 206 L362 206 Q 358 230 330 230 Q 302 230 298 206 Z" fill="#e46b5a" />
      <ellipse cx="330" cy="206" rx="32" ry="5" fill="#c4513f" />
      <path d="M314 216 h 32" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
    </g>
  )
}

function Bath({ s }: { s: number }) {
  const w = 72 * s + 36
  return (
    <g aria-hidden>
      <g className="fx-bubbles" fill="#fff" stroke="#9fd3f0" strokeWidth="1.5">
        {[-0.8, -0.4, 0, 0.35, 0.7, -0.6, 0.5].map((f, i) => (
          <circle key={i} cx={200 + f * w} cy={GROUND - 26} r={5 + (i % 3) * 2} style={{ animationDelay: `${i * 0.35}s` }} />
        ))}
      </g>
      <path d={`M${200 - w} 194 H${200 + w} V212 Q ${200 + w} 232 ${200 + w - 20} 232 H${200 - w + 20} Q ${200 - w} 232 ${200 - w} 212 Z`} fill="#9fd3f0" />
      <rect x={200 - w - 6} y="188" width={2 * w + 12} height="10" rx="5" fill="#d6eefb" />
      <g fill="#fff" opacity="0.9">
        <circle cx={200 - w * 0.6} cy="194" r="8" />
        <circle cx={200 - w * 0.2} cy="192" r="10" />
        <circle cx={200 + w * 0.25} cy="193" r="9" />
        <circle cx={200 + w * 0.65} cy="194" r="7" />
      </g>
    </g>
  )
}

function Ball() {
  return (
    <g className="fx-ball" aria-hidden>
      <circle r="11" fill="#ff6f61" />
      <path d="M-11 0 a 11 11 0 0 0 22 0" fill="#ffd45e" />
      <circle r="11" fill="none" stroke="#c94c40" strokeWidth="2" />
    </g>
  )
}

function Hearts({ x, y }: { x: number; y: number }) {
  const heart = 'M0 4 C -6 -4, -14 2, 0 12 C 14 2, 6 -4, 0 4 Z'
  return (
    <g aria-hidden fill="#ff6b8b">
      {[-28, 0, 26].map((dx, i) => (
        <g key={i} transform={`translate(${x + dx} ${y + (i === 1 ? -8 : 6)})`}>
          <path d={heart} className="fx-heart" style={{ animationDelay: `${i * 0.25}s` }} />
        </g>
      ))}
    </g>
  )
}

function Treat({ x, y }: { x: number; y: number }) {
  return (
    <g aria-hidden>
      <g transform={`translate(${x} ${y})`}>
        <g className="fx-treat">
          <circle r="11" fill="#d99a52" stroke="#a96a2c" strokeWidth="2" />
          <g fill="#6b3d1a">
            <circle cx="-4" cy="-3" r="2" />
            <circle cx="4" cy="2" r="2" />
            <circle cx="-1" cy="5" r="1.6" />
          </g>
        </g>
      </g>
      <g className="fx-sparkle" fill="#ffd45e">
        <g transform={`translate(${x - 22} ${y - 18})`}>
          <path d="M0 -7 L2 -2 L7 0 L2 2 L0 7 L-2 2 L-7 0 L-2 -2 Z" />
        </g>
        <g transform={`translate(${x + 20} ${y - 26})`}>
          <path d="M0 -5 L1.5 -1.5 L5 0 L1.5 1.5 L0 5 L-1.5 1.5 L-5 0 L-1.5 -1.5 Z" />
        </g>
      </g>
    </g>
  )
}
