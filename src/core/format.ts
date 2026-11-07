/** 95 → "1h 35m", 24 → "24m", 0 → "0m" */
export function formatMinutes(total: number): string {
  const m = Math.max(0, Math.round(total))
  const h = Math.floor(m / 60)
  const r = m % 60
  if (!h) return `${r}m`
  return r ? `${h}h ${r}m` : `${h}h`
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`
