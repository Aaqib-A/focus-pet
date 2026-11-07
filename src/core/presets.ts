import type { CycleConfig, PresetId, Settings } from './types'

export interface Citation {
  authors: string
  year: string
  title: string
  venue: string
  url?: string
}

export interface Preset {
  id: PresetId
  label: string
  short: string
  cycle: CycleConfig
  evidence: 'peer-reviewed' | 'observational' | 'none'
  population?: string
  finding: string
  caveat?: string
  citations: Citation[]
}

const BIWER_2023: Citation = {
  authors: 'Biwer, F., Wiradhany, W., oude Egbrink, M. G. A., & de Bruin, A. B. H.',
  year: '2023',
  title: "Understanding effort regulation: Comparing 'Pomodoro' breaks and self-regulated breaks",
  venue: 'British Journal of Educational Psychology, 93(S2), 353–367',
  url: 'https://pubmed.ncbi.nlm.nih.gov/36859717/',
}

const GALINSKY_2000: Citation = {
  authors: 'Galinsky, T. L., Swanson, N. G., Sauter, S. L., Hurrell, J. J., & Schleifer, L. M.',
  year: '2000',
  title: 'A field study of supplementary rest breaks for data-entry operators',
  venue: 'Ergonomics, 43(5), 622–638 (NIOSH)',
  url: 'https://stacks.cdc.gov/view/cdc/198356',
}

const GALINSKY_2007: Citation = {
  authors: 'Galinsky, T., Swanson, N., Sauter, S., Dunkin, R., Hurrell, J., & Schleifer, L.',
  year: '2007',
  title: 'Supplementary breaks and stretching exercises for data entry operators: A follow-up field study',
  venue: 'American Journal of Industrial Medicine, 50(7), 519–527 (NIOSH)',
  url: 'https://stacks.cdc.gov/view/cdc/186286',
}

const DESKTIME_2014: Citation = {
  authors: 'DeskTime / Gifford, J.',
  year: '2014',
  title: 'The rule of 52 and 17: It’s random, but it ups your productivity',
  venue: 'The Muse (analysis of DeskTime productivity-app data)',
  url: 'https://www.themuse.com/advice/the-rule-of-52-and-17-its-random-but-it-ups-your-productivity',
}

export const ALBULESCU_2022: Citation = {
  authors: 'Albulescu, P., Macsinga, I., Rusu, A., Sulea, C., Bodnaru, A., & Tulbure, B. T.',
  year: '2022',
  title:
    '“Give me a break!” A systematic review and meta-analysis on the efficacy of micro-breaks for increasing well-being and performance',
  venue: 'PLOS ONE, 17(8), e0272460',
  url: 'https://doi.org/10.1371/journal.pone.0272460',
}

export const CIRILLO: Citation = {
  authors: 'Cirillo, F.',
  year: '2006/2018',
  title: 'The Pomodoro Technique',
  venue: 'Book (method, not a study)',
}

export const PRESETS: Record<Exclude<PresetId, 'custom'>, Preset> = {
  biwer2023: {
    id: 'biwer2023',
    label: 'Pomodoro study (Biwer 2023)',
    short: '24 / 6',
    cycle: { feedMin: 24, restMin: 6, longRestMin: 20, longRestEvery: 4 },
    evidence: 'peer-reviewed',
    population: '87 university students',
    finding:
      'Fixed 24-min work / 6-min break cycles led to less fatigue, better concentration and more motivation than self-timed breaks, with the same amount of work done in less time.',
    caveat:
      'Participants were students on a single study day. The 20-min long rest every 4 feeds comes from Cirillo’s Pomodoro Technique, supported by Albulescu 2022 (longer breaks help after demanding work).',
    citations: [BIWER_2023, CIRILLO, ALBULESCU_2022],
  },
  niosh: {
    id: 'niosh',
    label: 'Office field study (NIOSH)',
    short: '55 / 5',
    cycle: { feedMin: 55, restMin: 5, longRestMin: 15, longRestEvery: 2 },
    evidence: 'peer-reviewed',
    population: 'Real office data-entry workers',
    finding:
      'Adding a 5-min break every hour (on top of two 15-min breaks a day) reduced discomfort and eyestrain without lowering productivity.',
    caveat:
      'The study measured comfort and output for repetitive computer work; it did not test other work/break lengths.',
    citations: [GALINSKY_2000, GALINSKY_2007],
  },
  desktime: {
    id: 'desktime',
    label: 'DeskTime 52/17',
    short: '52 / 17',
    cycle: { feedMin: 52, restMin: 17, longRestMin: 17, longRestEvery: 0 },
    evidence: 'observational',
    population: 'Users of a productivity-tracking app',
    finding:
      'The most productive 10% of tracked users tended to work ~52 minutes, then take a ~17-minute break, often away from the computer.',
    caveat:
      'Observational app data, not peer-reviewed, and can’t show cause and effect. A 2021 rerun of the same analysis found 112 / 26 instead.',
    citations: [DESKTIME_2014],
  },
}

export const DEFAULT_PRESET_ID: PresetId = 'biwer2023'

export const DEFAULT_SETTINGS: Settings = {
  presetId: DEFAULT_PRESET_ID,
  custom: { ...PRESETS.biwer2023.cycle },
  sound: true,
  notifications: true,
  autoStartRest: true,
}

export function cycleFor(settings: Settings): CycleConfig {
  if (settings.presetId === 'custom') return settings.custom
  return PRESETS[settings.presetId].cycle
}

export function clampCycle(c: CycleConfig): CycleConfig {
  const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(n) || lo))
  return {
    feedMin: clamp(c.feedMin, 1, 180),
    restMin: clamp(c.restMin, 1, 60),
    longRestMin: clamp(c.longRestMin, 1, 90),
    longRestEvery: Math.min(12, Math.max(0, Math.round(c.longRestEvery) || 0)),
  }
}
