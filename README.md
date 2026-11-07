# Focus Pet

A focus timer and work todo list where **every minute you focus feeds a virtual pet**.

- **Feeding = focus time.** Start a feeding when you start working. The pet eats while you work.
- **Rest = your break.** When the feeding ends, the pet naps and you step away from the screen.
- **It grows with every minute fed.** It hatches from an egg on its first full feeding and grows through hatchling, baby, child, teen and adult. Its size increases a little with every minute, so progress is always visible.
- **Care between sessions.** You can bathe, play with, cuddle and give treats to the pet. Treats come from finishing tasks. Care is locked while the pet eats so focus time stays focused. Play is limited per break so breaks stay mostly off-screen.
- **Gentle needs.** Fullness, energy, cleanliness and happiness drift slowly over time. A neglected pet looks sad or grubby, but it **never dies and never loses growth**.
- **Todos tied to the timer.** Pick a task before each feeding. Each task shows its feedings (spent vs. estimated) and minutes focused.

Everything is stored in the browser (`localStorage`). There is no account and no backend, and nothing is sent anywhere.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm test` | Unit tests for the game rules (Vitest) |
| `npm run lint` | Lint (oxlint) |
| `npm run build` | Type-check and build static files into `dist/` |
| `npm run preview` | Serve the production build locally |

The build is a static site, so `dist/` can be hosted anywhere (GitHub Pages, Netlify, Cloudflare Pages, S3 and so on).

**Testing tip:** in dev mode, add `?speed=60` to the URL so that one minute passes in one second (for example `http://localhost:5173/?speed=60`). A full feed-and-rest cycle then takes about 30 seconds. Growth still counts nominal minutes, so you can raise a pet quickly. Production builds ignore the flag.

## The research behind the timings

You can pick a schedule in **Settings**. The in-app **The science** dialog shows each schedule's sources and caveats.

| Schedule | Feed / rest | Long rest | Evidence |
|---|---|---|---|
| **Pomodoro study (default)** | 24 / 6 min | 20 min every 4 feedings | Peer-reviewed. Biwer et al. (2023), *British Journal of Educational Psychology* 93(S2):353–367. Fixed 24/6 cycles led to less fatigue and more motivation than self-timed breaks, with the same output in less time. Participants were students. The long rest comes from Cirillo's Pomodoro Technique and is supported by Albulescu et al. (2022). |
| **Office field study (NIOSH)** | 55 / 5 min | 15 min every 2 feedings | Peer-reviewed field studies of office data-entry workers. Galinsky et al. (2000), *Ergonomics* 43(5):622–638, and Galinsky et al. (2007), *American Journal of Industrial Medicine* 50(7):519–527. Adding a 5-minute break every hour reduced discomfort and eyestrain without lowering productivity. |
| **DeskTime 52/17** | 52 / 17 min | none | Observational app data and not peer-reviewed (DeskTime, 2014). A 2021 rerun of the same analysis found 112/26. |
| **Custom** | your choice | your choice | — |

Supporting evidence: Albulescu et al. (2022), *PLOS ONE* 17(8):e0272460. This meta-analysis of 22 samples (N = 2,335) found that breaks of 10 minutes or less increase vigor and reduce fatigue. Longer breaks help more after demanding tasks.

Links:
- [Biwer et al. 2023](https://pubmed.ncbi.nlm.nih.gov/36859717/)
- [Galinsky et al. 2000](https://stacks.cdc.gov/view/cdc/198356)
- [Galinsky et al. 2007](https://stacks.cdc.gov/view/cdc/186286)
- [Albulescu et al. 2022](https://doi.org/10.1371/journal.pone.0272460)
- [DeskTime 52/17](https://www.themuse.com/advice/the-rule-of-52-and-17-its-random-but-it-ups-your-productivity)

## Game rules at a glance

All the rules live in `src/core/`. The numbers are constants there and are easy to tune.

- **Growth stages** (total minutes fed, once hatched): hatchling at 0, baby at 120, child at 360, teen at 900, adult at 1800. Adults keep filling out until 3600.
- **A full feeding:** growth goes up by the feeding minutes. Fullness rises by 3 per minute, energy drops 15, cleanliness drops 10 (messy eater) and happiness rises 5. The selected task gets +1 feeding.
- **Stopping early:** the pet keeps the whole minutes it ate, but it doesn't count as a feeding and happiness drops slightly.
- **Rests:** energy +30, or +60 for a long rest. Skipping a rest costs 10 energy.
- **Drift per hour:** fullness −4, cleanliness −2, happiness −3, energy +2. No stat drifts below 10, and catch-up for time away is capped at 48 hours.
- **Closing the tab is fine.** The timer is based on timestamps, so phases that ended while you were away are completed when you return.

## Project layout

```
src/
  core/        pure game rules: timer, growth, needs, presets and citations, dates (unit-tested)
  store/       Zustand store with localStorage persistence; side effects (chimes, notifications, toasts)
  hooks/       game clock, document-title countdown, useNow
  lib/         WebAudio chimes, Notification API, dev speed flag
  components/  pet (SVG art + scene), timer, care, todos, stats, settings, science, onboarding
  styles/      design tokens (light/dark) and component styles
```
