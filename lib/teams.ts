import type { TeamId } from "@/lib/types"

export type { TeamId }

export const TEAMS: TeamId[] = [1, 2, 3, 4, 5, 6, 7, 8]
export const TEAM_COOKIE = "gdra-team"

export function parseTeam(value: string | undefined | null): TeamId | null {
  const n = Number(value)
  if (!Number.isInteger(n) || n < 1 || n > 8) return null
  return n as TeamId
}

export function teamName(team: number) {
  return `Team ${team}`
}

export function ordinal(n: number) {
  const mod100 = n % 100
  const mod10 = n % 10
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`
  if (mod10 === 1) return `${n}st`
  if (mod10 === 2) return `${n}nd`
  if (mod10 === 3) return `${n}rd`
  return `${n}th`
}
