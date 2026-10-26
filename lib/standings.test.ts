import { describe, expect, it } from "vitest"
import schedule from "../data/schedule.json"
import { readFileSync } from "node:fs"
import { buildCalendar, outlookSubscribeUrl } from "./ics"
import { TEAMS } from "./teams"
import { forfeitGames, parseResult } from "./results"
import { gymsOf, latestPlayedNight, matchStart, nextUnplayed, setCounts } from "./schedule"
import { standings } from "./standings"
import { teamName } from "./teams"
import type { Match, ResultsFile } from "./types"

const matches = schedule.matches as Match[]

const rankingMatches: Match[] = [
  { id: "2026-10-28-1800-c1", date: "2026-10-28", time: "18:00", court: 1, home: 1, away: 8 },
  { id: "2026-10-28-1900-c1", date: "2026-10-28", time: "19:00", court: 1, home: 2, away: 7 },
  { id: "2026-10-28-2000-c1", date: "2026-10-28", time: "20:00", court: 1, home: 3, away: 6 },
  { id: "2026-10-28-2100-c1", date: "2026-10-28", time: "21:00", court: 1, home: 4, away: 5 },
]

function result(games: [number, number][]) {
  return { games: games as ResultsFile[string]["games"] }
}

describe("standings", () => {
  it("ranks by wins, then point differential, then points scored", () => {
    const results: ResultsFile = {
      "2026-10-28-1800-c1": result([[21, 15], [19, 21], [21, 18]]),
      "2026-10-28-1900-c1": result([[21, 10], [21, 17], [21, 12]]),
      "2026-10-28-2000-c1": result([[21, 19], [21, 16], [15, 21]]),
      "2026-10-28-2100-c1": result([[18, 21], [21, 19], [16, 21]]),
    }
    const table = standings(rankingMatches, results)
    expect(table.map((row) => [row.team, row.wins, row.losses, row.diff])).toEqual([
      [2, 3, 0, 24],
      [1, 2, 1, 7],
      [5, 2, 1, 6],
      [3, 2, 1, 1],
      [6, 1, 2, -1],
      [4, 1, 2, -6],
      [8, 1, 2, -7],
      [7, 0, 3, -24],
    ])
    expect(table[0].rank).toBe(1)
    expect(table[0].form).toEqual(["W", "W", "W"])
  })

  it("does not award a point for a tied game", () => {
    const results: ResultsFile = {
      "2026-10-28-1800-c1": result([[21, 21], [17, 14], [10, 12]]),
    }
    const table = standings(rankingMatches, results)
    const team1 = table.find((row) => row.team === 1)!
    const team8 = table.find((row) => row.team === 8)!
    expect(team1.wins).toBe(1)
    expect(team1.losses).toBe(1)
    expect(team8.wins).toBe(1)
    expect(team8.losses).toBe(1)
    expect(team1.pointsFor).toBe(48)
    expect(team1.diff).toBe(1)
    expect(setCounts(results["2026-10-28-1800-c1"])).toEqual([1, 1])
  })

  it("records a forfeit as three 21–0 games", () => {
    const games = forfeitGames("away")
    expect(games).toEqual([[21, 0], [21, 0], [21, 0]])
    const parsed = parseResult({ forfeit: "home" })
    expect("result" in parsed && parsed.result.games).toEqual([[0, 21], [0, 21], [0, 21]])
    const results: ResultsFile = {
      "2026-10-28-2000-c1": { games: forfeitGames("away"), forfeit: "away" },
    }
    const team3 = standings(rankingMatches, results).find((row) => row.team === 3)!
    const team6 = standings(rankingMatches, results).find((row) => row.team === 6)!
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
  it("opens score entry on the latest night already played", () => {
    const dates = ["2026-10-07", "2026-10-14", "2026-10-21"]
    expect(latestPlayedNight(dates, new Date("2026-10-15T03:30:00Z"))).toBe("2026-10-14")
    expect(latestPlayedNight(dates, new Date("2026-10-07T16:00:00Z"))).toBe("2026-10-07")
    expect(latestPlayedNight(dates, new Date("2026-10-01T16:00:00Z"))).toBe("2026-10-07")
  })

  it("picks the earliest unplayed match for a team", () => {
    expect(nextUnplayed(matches, 3, {})?.id).toBe("2026-10-28-1900-c1")
    expect(nextUnplayed(matches, 3, {
      "2026-10-28-1900-c1": result([[21, 19], [21, 16], [15, 21]]),
    })?.id).toBe("2026-11-04-2100-c1")
  })

  it("starts October 28 and leaves the October 21 practice off the board", () => {
    expect(matches.some((match) => match.date === "2026-10-21")).toBe(false)
    expect(matches[0].date).toBe("2026-10-28")
    const gyms = gymsOf(matches.filter((match) => match.date === "2026-10-28"))
    expect(gyms.map((gym) => gym.key)).toEqual(["regina"])
    expect(gyms[0].matches.map((match) => [match.time, match.home, match.away])).toEqual([
      ["18:00", 2, 5],
      ["19:00", 3, 4],
      ["20:00", 7, 1],
      ["21:00", 8, 6],
    ])
    expect(matches.every((match) => match.venue === "regina")).toBe(true)
    expect(teamName(1)).toBe("Grand HEIST Auto")
    expect(teamName(2)).toBe("Advanced Net-ronics")
    expect(teamName(3)).toBe("The Bumpy Bunch")
    expect(teamName(4)).toBe("Block Party")
    expect(teamName(5)).toBe("Tank U, Next")
    expect(teamName(6)).toBe("The Upsetters")
    expect(teamName(7)).toBe("Sets on the Beach")
    expect(teamName(8)).toBe("How I Set My Mother")
  })

  it("lists playoffs after the regular season without assigned teams", () => {
    expect(matches.filter((match) => match.date === "2027-05-05").map((match) => match.label)).toEqual([
      "Quarter-A (1st vs. 8th)",
      "Quarter-B (2nd vs. 7th)",
      "Quarter-C (3rd vs. 6th)",
      "Quarter-D (4th vs. 5th)",
    ])
    const final = matches.find((match) => match.date === "2027-05-19")
    expect(final?.label).toBe("Championship final (best of 5)")
    expect(final?.until).toBe("22:00")
    expect(final?.home).toBeUndefined()
  })

  it("uses Toronto offsets across the season", () => {
    expect(matchStart({ date: "2026-10-28", time: "18:00" }).toISOString()).toBe("2026-10-28T22:00:00.000Z")
    expect(matchStart({ date: "2026-11-04", time: "18:00" }).toISOString()).toBe("2026-11-04T23:00:00.000Z")
    expect(matchStart({ date: "2027-03-10", time: "18:00" }).toISOString()).toBe("2027-03-10T23:00:00.000Z")
    expect(matchStart({ date: "2027-03-24", time: "18:00" }).toISOString()).toBe("2027-03-24T22:00:00.000Z")
  })
})

describe("calendar", () => {
  it("includes the Bumpy Bunch October 28 game at Regina Street", () => {
    const ics = buildCalendar(matches, 3, schedule.venues)
    const starts = ics.match(/DTSTART;TZID/g) ?? []
    const bumpy = matches.filter((match) => match.home === 3 || match.away === 3)
    expect(starts).toHaveLength(bumpy.length)
    expect(ics).toContain("20261028T190000")
    expect(ics).toContain("DTEND;TZID=America/Toronto:20261028T200000")
    expect(ics).toContain("SUMMARY:GD RA Volleyball · vs Block Party")
    expect(ics).toContain("2599 Regina St\\, Ottawa\\, ON K2B 8A5")
    expect(ics).toContain("METHOD:PUBLISH")
    expect(ics).not.toContain("20261021")
  })

  it("publishes a feed Outlook can subscribe to for every team", () => {
    const team1 = matches.filter((match) => match.home === 1 || match.away === 1)
    const feed = buildCalendar(matches, 1, schedule.venues)
    expect(feed.match(/BEGIN:VEVENT/g)).toHaveLength(team1.length)
    expect(feed).toContain("X-WR-CALNAME:GD RA Volleyball · Grand HEIST Auto")
    expect(feed).toContain("20261028T200000")

    for (const team of TEAMS) {
      const file = readFileSync(`public/calendars/team-${team}.ics`, "utf8")
      expect(file).toBe(buildCalendar(matches, team, schedule.venues))
    }

    const work = new URL(outlookSubscribeUrl("work", 1))
    expect(`${work.origin}${work.pathname}`).toBe("https://outlook.office.com/calendar/0/addfromweb")
    expect(work.searchParams.get("url")).toBe("https://lakshmanchelliah.github.io/SportLeagueTracking/calendars/team-1.ics")
    expect(work.searchParams.get("name")).toBe("GD RA Volleyball · Grand HEIST Auto")

    const personal = new URL(outlookSubscribeUrl("personal", 1))
    expect(personal.origin).toBe("https://outlook.live.com")
    expect(personal.searchParams.get("url")).toBe("https://lakshmanchelliah.github.io/SportLeagueTracking/calendars/team-1.ics")
  })
})
