import { setCounts } from "@/lib/schedule"
import { TEAMS } from "@/lib/teams"
import type { Match, ResultsFile, Standing, TeamId } from "@/lib/types"

export function standings(matches: Match[], results: ResultsFile): Standing[] {
  const rows = new Map<TeamId, Omit<Standing, "rank">>()
  for (const team of TEAMS) {
    rows.set(team, {
      team,
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      diff: 0,
      form: [],
    })
  }

  const played = matches
    .filter((match) => results[match.id])
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time) || a.court - b.court)

  for (const match of played) {
    const result = results[match.id]
    for (const [homeScore, awayScore] of result.games) {
      const home = rows.get(match.home)!
      const away = rows.get(match.away)!
      home.pointsFor += homeScore
      home.pointsAgainst += awayScore
      away.pointsFor += awayScore
      away.pointsAgainst += homeScore
      if (homeScore > awayScore) {
        home.wins += 1
        away.losses += 1
        home.form.push("W")
        away.form.push("L")
      } else if (awayScore > homeScore) {
        away.wins += 1
        home.losses += 1
        away.form.push("W")
        home.form.push("L")
      } else {
        home.form.push("T")
        away.form.push("T")
      }
    }
  }

  const ranked = [...rows.values()]
    .map((row) => ({
      ...row,
      diff: row.pointsFor - row.pointsAgainst,
      form: row.form.slice(-3),
    }))
    .sort((a, b) => b.wins - a.wins || b.diff - a.diff || b.pointsFor - a.pointsFor || a.team - b.team)

  return ranked.map((row, index) => ({ ...row, rank: index + 1 }))
}

export function teamSets(match: Match, result: ResultsFile[string], team: number) {
  const [homeSets, awaySets] = setCounts(result)
  if (match.home === team) return { setsFor: homeSets, setsAgainst: awaySets }
  return { setsFor: awaySets, setsAgainst: homeSets }
}
