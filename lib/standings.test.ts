import { describe, expect, it } from "vitest"
import schedule from "../data/schedule.json"
import { buildCalendar } from "./ics"
import { forfeitGames, parseResult } from "./results"
import { nextUnplayed, setCounts } from "./schedule"
import { standings } from "./standings"
import type { Match, ResultsFile } from "./types"

const matches = schedule.matches as Match[]

function result(games: [number, number][]) {
  return { games: games as ResultsFile[string]["games"] }
}

describe("standings", () => {
  it("ranks by wins, then point differential, then points scored", () => {
    const results: ResultsFile = {
      "2026-10-07-1800-c1": result([[21, 15], [19, 21], [21, 18]]),
      "2026-10-07-1800-c2": result([[21, 10], [21, 17], [21, 12]]),
      "2026-10-07-1900-c1": result([[21, 19], [21, 16], [15, 21]]),
      "2026-10-07-1900-c2": result([[18, 21], [21, 19], [16, 21]]),
      "2026-10-14-1800-c1": result([[21, 18], [21, 14], [21, 19]]),
      "2026-10-14-1800-c2": result([[21, 12], [21, 15], [21, 11]]),
      "2026-10-14-1900-c1": result([[21, 19], [15, 21], [21, 17]]),
      "2026-10-14-1900-c2": result([[21, 18], [14, 21], [21, 16]]),
    }
    const table = standings(matches, results)
    expect(table.map((row) => [row.team, row.wins, row.losses, row.diff])).toEqual([
      [2, 6, 0, 36],
      [3, 5, 1, 26],
      [1, 3, 3, 7],
      [8, 3, 3, -6],
      [6, 2, 4, -2],
      [5, 2, 4, -6],
      [7, 2, 4, -24],
      [4, 1, 5, -31],
    ])
    expect(table[0].rank).toBe(1)
    expect(table[1].form).toEqual(["W", "W", "L", "W", "W", "W"].slice(-3))
  })

  it("does not award a point for a tied game", () => {
    const results: ResultsFile = {
      "2026-10-07-1800-c1": result([[21, 21], [17, 14], [10, 12]]),
    }
    const table = standings(matches, results)
    const team1 = table.find((row) => row.team === 1)!
    const team8 = table.find((row) => row.team === 8)!
    expect(team1.wins).toBe(1)
    expect(team1.losses).toBe(1)
    expect(team8.wins).toBe(1)
    expect(team8.losses).toBe(1)
    expect(team1.pointsFor).toBe(48)
    expect(team1.diff).toBe(1)
    expect(setCounts(results["2026-10-07-1800-c1"])).toEqual([1, 1])
  })

  it("records a forfeit as three 21–0 games", () => {
    const games = forfeitGames("away")
    expect(games).toEqual([[21, 0], [21, 0], [21, 0]])
    const parsed = parseResult({ forfeit: "home" })
    expect("result" in parsed && parsed.result.games).toEqual([[0, 21], [0, 21], [0, 21]])
    const results: ResultsFile = {
      "2026-10-07-1900-c1": { games: forfeitGames("away"), forfeit: "away" },
    }
    const team3 = standings(matches, results).find((row) => row.team === 3)!
    const team6 = standings(matches, results).find((row) => row.team === 6)!
    expect(team3.wins).toBe(3)
    expect(team6.losses).toBe(3)
    expect(team3.diff).toBe(63)
  })

  it("leaves every team level when no scores are in", () => {
    const table = standings(matches, {})
    expect(table.map((row) => row.team)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(table.every((row) => row.wins === 0 && row.diff === 0)).toBe(true)
  })
})

describe("schedule", () => {
  it("picks the earliest unplayed match for a team", () => {
    const next = nextUnplayed(matches, 3, {
      "2026-10-07-1900-c1": result([[21, 19], [21, 16], [15, 21]]),
    })
    expect(next?.id).toBe("2026-10-14-1800-c2")
  })
})

describe("calendar", () => {
  it("includes each of team 3's nights through December 2", () => {
    const ics = buildCalendar(matches, 3)
    const starts = ics.match(/DTSTART;TZID/g) ?? []
    expect(starts).toHaveLength(9)
    expect(ics).toContain("20261007T190000")
    expect(ics).toContain("20261202T180000")
    expect(ics).toContain("Court 2")
  })
})
