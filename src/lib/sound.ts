/** Tiny WebAudio chimes, so the app ships no audio files. */
let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  try {
    ctx ??= new AudioContext()
    return ctx
  } catch {
    return null
  }
}

/** Call from a user gesture (e.g. pressing Feed) so later chimes are allowed to play. */
export function unlockAudio() {
  const a = audio()
  if (a?.state === 'suspended') void a.resume()
}

export type Chime = 'feedDone' | 'restDone' | 'levelUp' | 'pop'

const TUNES: Record<Chime, number[]> = {
  feedDone: [523.25, 659.25, 783.99], // C E G: meal finished, time to rest
  restDone: [783.99, 659.25, 880], // G E A: wake up, hungry!
  levelUp: [523.25, 659.25, 783.99, 1046.5],
  pop: [880],
}

export function chime(kind: Chime) {
  const a = audio()
  if (!a || a.state !== 'running') return
  const start = a.currentTime + 0.02
  TUNES[kind].forEach((freq, i) => {
    const t = start + i * 0.16
    const osc = a.createOscillator()
    const gain = a.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45)
    osc.connect(gain).connect(a.destination)
    osc.start(t)
    osc.stop(t + 0.5)
  })
}
