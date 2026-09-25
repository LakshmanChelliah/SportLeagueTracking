import type { GameScore, Match, Result } from "@/lib/types"

const MAX_SCORE = 25

function isScore(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= MAX_SCORE
}

export function forfeitGames(side: "home" | "away"): Result["games"] {
  const game: GameScore = side === "away" ? [21, 0] : [0, 21]
  return [game, game, game]
}

export function parseResult(input: unknown): { result: Result } | { error: string } {
  if (!input || typeof input !== "object") return { error: "Enter a result." }
  const body = input as { games?: unknown; forfeit?: unknown }
  if (body.forfeit === "home" || body.forfeit === "away") {
    return { result: { games: forfeitGames(body.forfeit), forfeit: body.forfeit } }
  }
  if (body.forfeit != null) return { error: "Forfeit must name the home or away team." }
  if (!Array.isArray(body.games) || body.games.length !== 3) {
    return { error: "Enter all 3 games." }
  }
  const games = body.games.map((game) => {
    if (!Array.isArray(game) || game.length !== 2 || !isScore(game[0]) || !isScore(game[1])) {
      return null
    }
    return [game[0], game[1]] as GameScore
  })
  if (games.some((game) => game == null)) {
    return { error: "Scores are whole numbers from 0 to 25." }
  }
  return { result: { games: games as Result["games"] } }
}

export function assertMatch(matches: Match[], matchId: string) {
  return matches.some((match) => match.id === matchId)
}
