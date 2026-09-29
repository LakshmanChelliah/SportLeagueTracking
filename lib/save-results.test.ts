import { readFileSync } from "node:fs"
import { afterEach, describe, expect, it } from "vitest"
import type { ResultsFile } from "@/lib/types"
import { parseGitHubResults, serializeResults, updateStoredResults, type FetchLike } from "@/lib/save-results"

const envKeys = ["GITHUB_TOKEN", "GITHUB_REPO", "GITHUB_BRANCH"] as const
const previous = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]))

afterEach(() => {
  for (const key of envKeys) {
    const value = previous[key]
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})

function githubFetch(stored: { current: { sha: string; json: string } | null }): FetchLike {
  return async (_input, init) => {
    const method = init?.method ?? "GET"
    if (method === "GET") {
      if (!stored.current) return new Response("missing", { status: 404 })
      const wrapped = Buffer.from(stored.current.json).toString("base64").replace(/(.{60})/g, "$1\n")
      return Response.json({ sha: stored.current.sha, content: wrapped, encoding: "base64" })
    }
    const body = JSON.parse(String(init?.body)) as { content?: string; sha?: string }
    if (stored.current && body.sha !== stored.current.sha) {
      return new Response("conflict", { status: 409 })
    }
    const json = Buffer.from(body.content ?? "", "base64").toString("utf8")
    stored.current = { sha: `sha-${json.length}`, json }
    return new Response("{}", { status: 200 })
  }
}

const first: ResultsFile[string] = { games: [[21, 15], [19, 21], [21, 18]] }
const second: ResultsFile[string] = { games: [[21, 10], [21, 17], [21, 12]] }
const third: ResultsFile[string] = { games: [[21, 19], [21, 16], [15, 21]] }

describe("github results", () => {
  it("merges a new match onto the file already on GitHub", async () => {
    process.env.GITHUB_TOKEN = "token"
    process.env.GITHUB_REPO = "owner/name"
    const stored = {
      current: {
        sha: "sha-1",
        json: serializeResults({ "2026-10-07-1800-c1": first }),
      },
    }
    const fetchImpl = githubFetch(stored)

    const mode = await updateStoredResults(
      (current) => ({ ...current, "2026-10-07-1800-c2": second }),
      fetchImpl,
    )
    expect(mode).toBe("github")

    await updateStoredResults(
      (current) => ({ ...current, "2026-10-07-1900-c1": third }),
      fetchImpl,
    )

    const saved = JSON.parse(stored.current?.json ?? "{}") as ResultsFile
    expect(saved["2026-10-07-1800-c1"]).toEqual(first)
    expect(saved["2026-10-07-1800-c2"]).toEqual(second)
    expect(saved["2026-10-07-1900-c1"]).toEqual(third)
    expect(readFileSync("data/results.json", "utf8")).toBe("{}\n")
  })

  it("reads wrapped GitHub file contents", () => {
    const json = serializeResults({ "2026-10-07-1800-c1": first })
    const content = Buffer.from(json).toString("base64").replace(/(.{60})/g, "$1\n")
    expect(parseGitHubResults({ content })["2026-10-07-1800-c1"]).toEqual(first)
  })
})
