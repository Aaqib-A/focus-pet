type Level = 'ok' | 'warning' | 'critical'

interface Props {
  label: string
  icon?: string
  value: number
  /** Shown on the right; defaults to the rounded value. */
  valueText?: string
  /** Turn on severity colouring (fill shifts to warning / critical when low). */
  severity?: boolean
}

function levelFor(v: number): Level {
  if (v < 20) return 'critical'
  if (v < 40) return 'warning'
  return 'ok'
}

/**
 * A single-value meter. The fill carries severity, the track is a lighter step
 * of the same ramp, and low states always add an icon + word, never colour alone.
 */
export function Meter({ label, icon, value, valueText, severity = false }: Props) {
  const v = Math.round(Math.max(0, Math.min(100, value)))
  const level = severity ? levelFor(v) : 'ok'
  return (
    <div className={`meter meter--${level}`}>
      <div className="meter-head">
        <span className="meter-label">
          {icon && <span aria-hidden>{icon} </span>}
          {label}
        </span>
        <span className="meter-value">
          {level !== 'ok' && <span className={`meter-flag meter-flag--${level}`}>{level === 'critical' ? '‼ Very low' : '! Low'}</span>}
          {valueText ?? v}
        </span>
      </div>
      <div
        className="meter-track"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={v}
        aria-valuetext={valueText ?? `${v} out of 100${level !== 'ok' ? ', low' : ''}`}
      >
        <div className="meter-fill" style={{ width: `${v}%` }} />
      </div>
    </div>
  )
}
