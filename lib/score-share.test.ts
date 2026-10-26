import { describe, expect, it } from "vitest"
import { scoreShareText } from "./score-share"

describe("score share text", () => {
  it("names both teams and skips games that were not played", () => {
    const text = scoreShareText("Grand HEIST Auto", "Sets on the Beach", "Wed, Oct 28 · 8:00 PM", [
      { label: "Game 1", left: 21, right: 18, played: true },
      { label: "Game 2", left: 12, right: 21, played: true },
      { label: "Game 3", left: 0, right: 0, played: false },
    ])
    expect(text).toBe(
      [
        "Grand HEIST Auto vs Sets on the Beach",
        "Wed, Oct 28 · 8:00 PM",
        "Game 1: Grand HEIST Auto 21, Sets on the Beach 18",
        "Game 2: Grand HEIST Auto 12, Sets on the Beach 21",
        "Game 3: not played",
      ].join("\n"),
    )
  })
})
