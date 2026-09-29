import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import type { ResultsFile } from "@/lib/types"

const FILE = "data/results.json"

export type FetchLike = typeof fetch

function sorted(results: ResultsFile) {
  return Object.fromEntries(Object.entries(results).sort(([a], [b]) => a.localeCompare(b)))
}

export function serializeResults(results: ResultsFile) {
  return `${JSON.stringify(sorted(results), null, 2)}\n`
}

function cloneResults(results: ResultsFile): ResultsFile {
  return JSON.parse(JSON.stringify(results)) as ResultsFile
}

export function githubConfig() {
  const token = process.env.GITHUB_TOKEN
  const repo = process.env.GITHUB_REPO
  if (!token || !repo) return null
  return {
    token,
    repo,
    branch: process.env.GITHUB_BRANCH ?? "main",
  }
}

function githubHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "gd-ra-volleyball",
    "X-GitHub-Api-Version": "2022-11-28",
  }
}

function contentsUrl(repo: string, branch?: string) {
  const base = `https://api.github.com/repos/${repo}/contents/${FILE}`
  return branch ? `${base}?ref=${encodeURIComponent(branch)}` : base
}

export function parseGitHubResults(body: { content?: string }): ResultsFile {
  if (!body.content) return {}
  const json = Buffer.from(body.content, "base64").toString("utf8")
  return JSON.parse(json) as ResultsFile
}

async function readGitHubResults(fetchImpl: FetchLike) {
  const config = githubConfig()
  if (!config) throw new Error("GitHub is not configured.")
  const current = await fetchImpl(contentsUrl(config.repo, config.branch), {
    headers: githubHeaders(config.token),
  })
  if (current.status === 404) return { results: {} as ResultsFile, sha: undefined }
  if (!current.ok) throw new Error("Could not read the current results file from GitHub.")
  const body = (await current.json()) as { sha?: string; content?: string }
  return { results: parseGitHubResults(body), sha: body.sha }
}

async function commitToGitHub(json: string, sha: string | undefined, fetchImpl: FetchLike) {
  const config = githubConfig()
  if (!config) return false
  const save = await fetchImpl(contentsUrl(config.repo), {
    method: "PUT",
    headers: { ...githubHeaders(config.token), "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Update volleyball scores",
      content: Buffer.from(json).toString("base64"),
      branch: config.branch,
      ...(sha ? { sha } : {}),
    }),
  })
  if (!save.ok) throw new Error("GitHub rejected the score update.")
  return true
}

export async function readResultsFile() {
  const raw = await readFile(path.join(process.cwd(), FILE), "utf8")
  return JSON.parse(raw) as ResultsFile
}

export async function readStoredResults(fetchImpl: FetchLike = fetch) {
  if (githubConfig()) {
    const remote = await readGitHubResults(fetchImpl)
    return remote.results
  }
  return readResultsFile()
}

export async function updateStoredResults(
  change: (current: ResultsFile) => ResultsFile,
  fetchImpl: FetchLike = fetch,
) {
  if (githubConfig()) {
    const remote = await readGitHubResults(fetchImpl)
    const next = change(cloneResults(remote.results))
    await commitToGitHub(serializeResults(next), remote.sha, fetchImpl)
    return "github" as const
  }
  const next = change(cloneResults(await readResultsFile()))
  if (process.env.VERCEL) {
    throw new Error("Set GITHUB_TOKEN and GITHUB_REPO so scores can be published.")
  }
  await writeFile(path.join(process.cwd(), FILE), serializeResults(next))
  return "local" as const
}
