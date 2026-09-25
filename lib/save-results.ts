import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import type { ResultsFile } from "@/lib/types"

const FILE = "data/results.json"

function sorted(results: ResultsFile) {
  return Object.fromEntries(Object.entries(results).sort(([a], [b]) => a.localeCompare(b)))
}

async function commitToGitHub(json: string) {
  const token = process.env.GITHUB_TOKEN
  const repo = process.env.GITHUB_REPO
  if (!token || !repo) return false
  const branch = process.env.GITHUB_BRANCH ?? "main"
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "gd-ra-volleyball",
    "X-GitHub-Api-Version": "2022-11-28",
  }
  const current = await fetch(
    `https://api.github.com/repos/${repo}/contents/${FILE}?ref=${encodeURIComponent(branch)}`,
    { headers },
  )
  let sha: string | undefined
  if (current.ok) {
    const body = (await current.json()) as { sha?: string }
    sha = body.sha
  } else if (current.status !== 404) {
    throw new Error("Could not read the current results file from GitHub.")
  }

  const save = await fetch(`https://api.github.com/repos/${repo}/contents/${FILE}`, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Update volleyball scores",
      content: Buffer.from(json).toString("base64"),
      branch,
      sha,
    }),
  })
  if (!save.ok) {
    throw new Error("GitHub rejected the score update.")
  }
  return true
}

export async function saveResults(results: ResultsFile) {
  const json = `${JSON.stringify(sorted(results), null, 2)}\n`
  const committed = await commitToGitHub(json)
  if (committed) return "github" as const
  if (process.env.VERCEL) {
    throw new Error("Set GITHUB_TOKEN and GITHUB_REPO so scores can be published.")
  }
  await writeFile(path.join(process.cwd(), FILE), json)
  return "local" as const
}

export async function readResultsFile() {
  const raw = await readFile(path.join(process.cwd(), FILE), "utf8")
  return JSON.parse(raw) as ResultsFile
}
