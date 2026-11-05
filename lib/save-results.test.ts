import { readFileSync } from "node:fs"
import { get, put } from "@vercel/blob"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { ResultsFile } from "@/lib/types"
import {
  parseGitHubResults,
  readStoredResults,
  serializeResults,
  updateStoredResults,
  type FetchLike,
} from "@/lib/save-results"

vi.mock("@vercel/blob", () => ({
  get: vi.fn(async () => null),
  put: vi.fn(async () => ({ url: "https://blob.example/results.json" })),
}))

const envKeys = ["GITHUB_TOKEN", "GITHUB_REPO", "GITHUB_BRANCH", "BLOB_READ_WRITE_TOKEN", "BLOB_STORE_ID"] as const
const previous = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]))

afterEach(() => {
  for (const key of envKeys) {
    const value = previous[key]
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})

beforeEach(() => {
  vi.mocked(get).mockReset()
  vi.mocked(put).mockReset()
  vi.mocked(get).mockResolvedValue(null)
  vi.mocked(put).mockResolvedValue({ url: "https://blob.example/results.json" } as Awaited<ReturnType<typeof put>>)
})

function jsonStream(json: string) {
  const body = new Response(json).body
  if (!body) throw new Error("missing body")
  return body
}

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
    expect(vi.mocked(put)).not.toHaveBeenCalled()
  })

  it("reads the committed file when GitHub rejects the token", async () => {
    process.env.GITHUB_TOKEN = "expired"
    process.env.GITHUB_REPO = "owner/name"
    const fetchImpl: FetchLike = async () => new Response("nope", { status: 401 })
    const results = await readStoredResults(fetchImpl)
    expect(results).toEqual(JSON.parse(readFileSync("data/results.json", "utf8")))
  })

  it("still reports a GitHub read failure when blob storage is not configured", async () => {
    process.env.GITHUB_TOKEN = "expired"
    process.env.GITHUB_REPO = "owner/name"
    const fetchImpl: FetchLike = async () => new Response("nope", { status: 401 })
    await expect(updateStoredResults((current) => current, fetchImpl)).rejects.toThrow(
      "Could not read the current results file from GitHub (401).",
    )
  })

  it("saves to blob when GitHub cannot be read", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "blob-token"
    process.env.GITHUB_TOKEN = "expired"
    process.env.GITHUB_REPO = "owner/name"
    const before = readFileSync("data/results.json", "utf8")
    const fetchImpl: FetchLike = async () => new Response("nope", { status: 401 })
    const tonight = { games: [[21, 19], [19, 21], [19, 21]] as ResultsFile[string]["games"] }

    const mode = await updateStoredResults(
      (current) => ({ ...current, "2026-11-04-2000-c1": tonight }),
      fetchImpl,
    )

    expect(mode).toBe("blob")
    expect(readFileSync("data/results.json", "utf8")).toBe(before)
    const body = String(vi.mocked(put).mock.calls[0]?.[1])
    const saved = JSON.parse(body) as ResultsFile
    expect(saved["2026-11-04-2000-c1"]).toEqual(tonight)
    expect(saved["2026-10-28-1800-c1"]).toEqual(JSON.parse(before)["2026-10-28-1800-c1"])
    expect(vi.mocked(put).mock.calls[0]?.[2]).toMatchObject({
      access: "private",
      allowOverwrite: true,
      addRandomSuffix: false,
    })
  })

  it("merges onto the scores already stored in blob", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "blob-token"
    vi.mocked(get).mockResolvedValue({
      statusCode: 200,
      stream: jsonStream(serializeResults({ "2026-10-07-1800-c1": first })),
      headers: new Headers(),
      blob: {
        url: "https://blob.example/results.json",
        downloadUrl: "https://blob.example/results.json?download=1",
        pathname: "results.json",
        contentType: "application/json",
        contentDisposition: "inline",
        cacheControl: "public, max-age=0",
        size: 10,
        uploadedAt: new Date(),
        etag: "etag",
      },
    })

    const mode = await updateStoredResults((current) => ({ ...current, "2026-10-07-1800-c2": second }))

    expect(mode).toBe("blob")
    const saved = JSON.parse(String(vi.mocked(put).mock.calls[0]?.[1])) as ResultsFile
    expect(saved["2026-10-07-1800-c1"]).toEqual(first)
    expect(saved["2026-10-07-1800-c2"]).toEqual(second)
  })

  it("reads wrapped GitHub file contents", () => {
    const json = serializeResults({ "2026-10-07-1800-c1": first })
    const content = Buffer.from(json).toString("base64").replace(/(.{60})/g, "$1\n")
    expect(parseGitHubResults({ content })["2026-10-07-1800-c1"]).toEqual(first)
  })
})
