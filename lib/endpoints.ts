const DEFAULT_RESULTS_URL =
  "https://raw.githubusercontent.com/LakshmanChelliah/SportLeagueTracking/main/data/results.json"

export function resultsUrl() {
  const configured = process.env.NEXT_PUBLIC_RESULTS_URL
  if (configured) return configured
  if (process.env.NEXT_PUBLIC_STATIC === "1") return DEFAULT_RESULTS_URL
  return "/api/results"
}

export function coordinatorApiUrl() {
  const origin = process.env.NEXT_PUBLIC_COORDINATOR_URL?.replace(/\/$/, "")
  return origin ? `${origin}/api/results` : "/api/results"
}

export function withCacheBust(url: string, now = Date.now()) {
  const join = url.includes("?") ? "&" : "?"
  return `${url}${join}t=${now}`
}
