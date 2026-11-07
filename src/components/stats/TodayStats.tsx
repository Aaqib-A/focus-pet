import { useState } from 'react'
import { dayKey, dayStats, lastDays, streak } from '../../core/dates'
import { formatMinutes } from '../../core/format'
import { useNow } from '../../hooks/useNow'
import { useAppStore } from '../../store/useAppStore'

const fmtDay = (key: string, opts: Intl.DateTimeFormatOptions) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, opts)
}

export function TodayStats() {
  const dayLog = useAppStore((s) => s.game!.dayLog)
  const now = useNow(60_000)
  const today = dayStats(dayLog, dayKey(now))
  const days = lastDays(now, 7).map((k) => ({ key: k, ...dayStats(dayLog, k) }))
  const best = streak(dayLog, now)
  const weekMinutes = days.reduce((sum, d) => sum + d.minutes, 0)

  return (
    <section className="card" aria-labelledby="stats-title">
      <h2 id="stats-title" className="card-title">
        Today
        <span className="card-sub">{fmtDay(dayKey(now), { weekday: 'long', day: 'numeric', month: 'short' })}</span>
      </h2>

      <div className="tiles">
        <Tile label="Feedings" value={String(today.meals)} />
        <Tile label="Focus time" value={formatMinutes(today.minutes)} />
        <Tile label="Tasks done" value={String(today.tasksDone)} />
        <Tile label="Day streak" value={String(best)} />
      </div>

      <WeekChart days={days} todayKey={dayKey(now)} total={weekMinutes} />
    </section>
  )
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="tile">
      <span className="tile-label">{label}</span>
      <span className="tile-value">{value}</span>
    </div>
  )
}

interface Day {
  key: string
  meals: number
  minutes: number
  tasksDone: number
}

function WeekChart({ days, todayKey, total }: { days: Day[]; todayKey: string; total: number }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(60, ...days.map((d) => d.minutes))
  // Round the scale up to a friendly hour mark.
  const top = Math.ceil(max / 60) * 60
  const h = hover != null ? days[hover] : null

  return (
    <figure className="week">
      <figcaption className="week-head">
        <span className="week-title">Focus time, last 7 days</span>
        <span className="muted small">{formatMinutes(total)} total</span>
      </figcaption>

      <div className="week-plot" onMouseLeave={() => setHover(null)}>
        <span className="week-gridlabel">{formatMinutes(top)}</span>
        <div className="week-grid" aria-hidden />
        <div className="week-bars">
          {days.map((d, i) => {
            const pct = (d.minutes / top) * 100
            const label = `${fmtDay(d.key, { weekday: 'long', day: 'numeric', month: 'short' })}: ${formatMinutes(d.minutes)} focused, ${d.meals} feeding${d.meals === 1 ? '' : 's'}, ${d.tasksDone} task${d.tasksDone === 1 ? '' : 's'} done`
            return (
              <div
                key={d.key}
                className={`week-col${hover === i ? ' is-hover' : ''}`}
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                tabIndex={0}
                aria-label={label}
              >
                <div className={`week-bar${d.key === todayKey ? ' week-bar--today' : ''}`} style={{ height: d.minutes > 0 ? `max(${pct}%, 3px)` : 0 }} />
              </div>
            )
          })}
        </div>
        {h && hover != null && (
          <div className="week-tip" style={{ left: `${((hover + 0.5) / days.length) * 100}%` }} role="status">
            <strong>{fmtDay(h.key, { weekday: 'short', day: 'numeric', month: 'short' })}</strong>
            <span>{formatMinutes(h.minutes)} focused</span>
            <span>
              {h.meals} feeding{h.meals === 1 ? '' : 's'} · {h.tasksDone} done
            </span>
          </div>
        )}
      </div>
      <div className="week-axis" aria-hidden>
        {days.map((d) => (
          <span key={d.key} className={d.key === todayKey ? 'is-today' : undefined}>
            {d.key === todayKey ? 'Today' : fmtDay(d.key, { weekday: 'short' })}
          </span>
        ))}
      </div>

      <table className="sr-only">
        <caption>Focus time per day, last 7 days</caption>
        <thead>
          <tr>
            <th>Day</th>
            <th>Focus</th>
            <th>Feedings</th>
            <th>Tasks done</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.key}>
              <td>{fmtDay(d.key, { weekday: 'long', day: 'numeric', month: 'short' })}</td>
              <td>{formatMinutes(d.minutes)}</td>
              <td>{d.meals}</td>
              <td>{d.tasksDone}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
