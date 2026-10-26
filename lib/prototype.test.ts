import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { playbackMatches, sampleResults, simulateSeason } from "@/lib/prototype"
import type { ScheduleFile } from "@/lib/types"

const schedule = JSON.parse(readFileSync("data/schedule.json", "utf8")) as ScheduleFile

describe("prototypes", () => {
  it("plays back the four Oct 28 matches with sample scores", () => {
    const night = playbackMatches(schedule.matches)
    expect(night.map((item) => item.match.id)).toEqual([
      "2026-10-28-1800-c1",
      "2026-10-28-1900-c1",
      "2026-10-28-2000-c1",
      "2026-10-28-2100-c1",
    ])
    expect(night.every((item) => item.result.games.length === 3)).toBe(true)
  })

  it("splits a thousand seasons across the eight teams", () => {
    const odds = simulateSeason(schedule.matches, 1000, 20261007)
    const total = Object.values(odds.titles).reduce((sum, count) => sum + count, 0)
    expect(total).toBe(1000)
    expect(odds.illustrated).toHaveLength(10)
    expect(Math.max(...Object.values(odds.titles))).toBeGreaterThan(0)
    const again = simulateSeason(schedule.matches, 1000, 20261007)
    expect(again.titles).toEqual(odds.titles)
  })

  it("keeps sample scores off the real results file", () => {
    expect(Object.keys(sampleResults).length).toBe(4)
    expect(readFileSync("data/results.json", "utf8")).toBe("{}\n")
  })
})
