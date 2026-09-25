import { standings } from "@/lib/standings"
import type { Match, ResultsFile, TeamId } from "@/lib/types"

/** Sample scores for the prototypes only. The live board stays empty. */
export const sampleResults: ResultsFile = {
  "2026-10-07-1800-c1": { games: [[21, 15], [18, 21], [21, 16]] },
  "2026-10-07-1800-c2": { games: [[21, 19], [21, 17], [19, 21]] },
  "2026-10-07-1900-c1": { games: [[21, 18], [16, 21], [25, 23]] },
  "2026-10-07-1900-c2": { games: [[21, 12], [21, 14], [21, 11]] },
  "2026-10-14-1800-c1": { games: [[21, 18], [21, 19], [18, 21]] },
  "2026-10-14-1800-c2": { games: [[19, 21], [21, 17], [21, 19]] },
  "2026-10-14-1900-c1": { games: [[15, 21], [21, 18], [14, 21]] },
  "2026-10-14-1900-c2": { games: [[12, 21], [16, 21], [11, 21]] },
  "2026-10-21-1800-c1": { games: [[21, 19], [18, 21], [17, 21]] },
  "2026-10-21-1800-c2": { games: [[21, 16], [21, 18], [21, 20]] },
  "2026-10-21-1900-c1": { games: [[21, 18], [16, 21], [21, 19]] },
  "2026-10-21-1900-c2": { games: [[21, 23], [21, 18], [19, 21]] },
}

export const playbackDate = "2026-10-07"

export function playbackMatches(matches: Match[]) {
  return matches
    .filter((match) => match.date === playbackDate)
    .sort((a, b) => a.time.localeCompare(b.time) || a.court - b.court)
    .map((match) => ({ match, result: sampleResults[match.id] }))
}

function mulberry32(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type SeasonOdds = {
  runs: number
  illustrated: TeamId[]
  titles: Record<TeamId, number>
}

export function simulateSeason(matches: Match[], runs = 1000, seed = 20261007): SeasonOdds {
  const remaining = matches.filter((match) => !sampleResults[match.id])
  const base = standings(matches, sampleResults)
  const rate = new Map(
    base.map((row) => [row.team, row.wins + row.losses === 0 ? 0.5 : row.wins / (row.wins + row.losses)]),
  )
  const rng = mulberry32(seed)
  const titles: Record<TeamId, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 }
  const illustrated: TeamId[] = []

  for (let run = 0; run < runs; run += 1) {
    const results: ResultsFile = { ...sampleResults }
    for (const match of remaining) {
      const lean = (rate.get(match.home)! - rate.get(match.away)!) * 0.22
      const chance = Math.min(0.78, Math.max(0.22, 0.5 + lean))
      const games = [0, 1, 2].map(() => {
        const homeWins = rng() < chance
        const loser = 12 + Math.floor(rng() * 8)
        return (homeWins ? [21, loser] : [loser, 21]) as [number, number]
      }) as [[number, number], [number, number], [number, number]]
      results[match.id] = { games }
    }
    const champ = standings(matches, results)[0].team
    titles[champ] += 1
    if (run < 10) illustrated.push(champ)
  }

  return { runs, illustrated, titles }
}
