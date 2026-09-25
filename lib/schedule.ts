import type { Match, Result, ResultsFile } from "@/lib/types"

const TZ = "America/Toronto"

export function torontoDate(now: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)
}

function zoneOffset(date: string) {
  return date < "2026-11-01" ? "-04:00" : "-05:00"
}

export function matchStart(match: Pick<Match, "date" | "time">) {
  return new Date(`${match.date}T${match.time}:00${zoneOffset(match.date)}`)
}

export function formatNight(date: string) {
  const [year, month, day] = date.split("-").map(Number)
  const stamp = new Date(Date.UTC(year, month - 1, day, 16))
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(stamp)
}

export function formatChip(date: string) {
  const [year, month, day] = date.split("-").map(Number)
  const stamp = new Date(Date.UTC(year, month - 1, day, 16))
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    month: "short",
    day: "numeric",
  }).format(stamp)
}

export function formatTime(time: string) {
  const [hour, minute] = time.split(":").map(Number)
  const suffix = hour >= 12 ? "PM" : "AM"
  const hour12 = hour % 12 || 12
  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`
}

export function warmupLabel(time: string) {
  return time === "18:00" ? "5:50 PM" : "6:50 PM"
}

export function involves(match: Match, team: number) {
  return match.home === team || match.away === team
}

export function opponent(match: Match, team: number) {
  return match.home === team ? match.away : match.home
}

export function byStart(a: Match, b: Match) {
  return a.date.localeCompare(b.date) || a.time.localeCompare(b.time) || a.court - b.court
}

export function nightsOf(matches: Match[]) {
  const dates = [...new Set(matches.map((match) => match.date))]
  return dates.map((date) => {
    const day = matches.filter((match) => match.date === date).sort(byStart)
    const times = [...new Set(day.map((match) => match.time))]
    return {
      date,
      slots: times.map((time) => ({
        time,
        matches: day.filter((match) => match.time === time),
      })),
    }
  })
}

export function defaultNight(matches: Match[], requested: string | undefined, now: Date) {
  const dates = [...new Set(matches.map((match) => match.date))]
  if (requested && dates.includes(requested)) return requested
  const today = torontoDate(now)
  return dates.find((date) => date >= today) ?? dates[dates.length - 1]
}

export function nextUnplayed(matches: Match[], team: number, results: ResultsFile) {
  return matches
    .filter((match) => involves(match, team) && !results[match.id])
    .sort(byStart)[0] ?? null
}

export function lastPlayed(matches: Match[], team: number, results: ResultsFile) {
  const played = matches
    .filter((match) => involves(match, team) && results[match.id])
    .sort(byStart)
  const match = played[played.length - 1]
  if (!match) return null
  return { match, result: results[match.id] }
}

export function countdownLabel(start: Date, now: Date) {
  const ms = start.getTime() - now.getTime()
  if (ms <= 0) return "Starting soon"
  const days = Math.round(ms / 86_400_000)
  if (days >= 2) return `In ${days} days`
  if (days === 1) return "In 1 day"
  const hours = Math.round(ms / 3_600_000)
  if (hours >= 2) return `In ${hours} hours`
  if (hours === 1) return "In 1 hour"
  const minutes = Math.max(1, Math.round(ms / 60_000))
  return `In ${minutes} min`
}

export function setCounts(result: Result): [number, number] {
  let home = 0
  let away = 0
  for (const [homeScore, awayScore] of result.games) {
    if (homeScore > awayScore) home += 1
    else if (awayScore > homeScore) away += 1
  }
  return [home, away]
}

export function seriesLabel(forSets: number, againstSets: number) {
  if (forSets > againstSets) return `Won ${forSets}–${againstSets}`
  if (forSets < againstSets) return `Lost ${forSets}–${againstSets}`
  return `Tied ${forSets}–${againstSets}`
}

export function diffLabel(diff: number) {
  if (diff > 0) return `+${diff}`
  if (diff < 0) return `−${Math.abs(diff)}`
  return "0"
}
