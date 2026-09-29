import { afterEach, describe, expect, it } from "vitest"
import { coordinatorApiUrl, resultsUrl, withCacheBust } from "@/lib/endpoints"

const keys = ["NEXT_PUBLIC_RESULTS_URL", "NEXT_PUBLIC_COORDINATOR_URL", "NEXT_PUBLIC_STATIC"] as const
const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]))

afterEach(() => {
  for (const key of keys) {
    const value = previous[key]
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})

describe("score endpoints", () => {
  it("reads the published results file from the static site", () => {
    delete process.env.NEXT_PUBLIC_RESULTS_URL
    process.env.NEXT_PUBLIC_STATIC = "1"
    expect(resultsUrl()).toBe(
      "https://raw.githubusercontent.com/LakshmanChelliah/SportLeagueTracking/main/data/results.json",
    )
  })

  it("reads the coordinator API when the app is serving the board", () => {
    delete process.env.NEXT_PUBLIC_RESULTS_URL
    delete process.env.NEXT_PUBLIC_STATIC
    expect(resultsUrl()).toBe("/api/results")
  })

  it("lets a results URL override the default", () => {
    process.env.NEXT_PUBLIC_RESULTS_URL = "https://example.com/results.json"
    expect(resultsUrl()).toBe("https://example.com/results.json")
  })

  it("posts scores to the coordinator host when one is configured", () => {
    process.env.NEXT_PUBLIC_COORDINATOR_URL = "https://scores.example.com/"
    expect(coordinatorApiUrl()).toBe("https://scores.example.com/api/results")
    delete process.env.NEXT_PUBLIC_COORDINATOR_URL
    expect(coordinatorApiUrl()).toBe("/api/results")
  })

  it("cache-busts a results fetch", () => {
    expect(withCacheBust("https://example.com/results.json", 5)).toBe("https://example.com/results.json?t=5")
    expect(withCacheBust("/api/results?x=1", 5)).toBe("/api/results?x=1&t=5")
  })
})
