import type { Species } from '../../core/types'

export const EGG_COLORS: Record<Species, { shell: string; spot: string; edge: string }> = {
  cat: { shell: '#fff4e3', spot: '#f3b06a', edge: '#e2c49c' },
  dragon: { shell: '#efeaff', spot: '#9a86e8', edge: '#c8bdf0' },
  blob: { shell: '#e8fbf4', spot: '#74d3b8', edge: '#b5e6d6' },
}
