import { involves, nextUnplayed } from "@/lib/schedule"
import type { Match, ResultsFile } from "@/lib/types"

export const BOARDS_KEY = "gdra-live-scores"
export const MATCH_KEY = "gdra-live-match"
export const SIDES_KEY = "gdra-live-sides"
export const RALLY_TARGET = 21
export const RALLY_CAP = 25

const HISTORY_LIMIT = 200

export type Side = "home" | "away"
export type GameIndex = 0 | 1 | 2
export type LiveGame = [number, number]

export type ScoreState = {
  games: [LiveGame, LiveGame, LiveGame]
  final: [boolean, boolean, boolean]
  active: GameIndex
}

export type LiveBoard = ScoreState & {
  past: ScoreState[]
  updatedAt: number
}

export interface ScoreStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export function blankBoard(now = 0): LiveBoard {
  return {
    games: [
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    final: [false, false, false],
    active: 0,
    past: [],
    updatedAt: now,
  }
}

export function oppositeSide(side: Side): Side {
  return side === "home" ? "away" : "home"
}

/** Which pad is on the left after the teams change ends. Scores stay stored as home and away. */
export function courtSides(naturalLeft: Side, swapped: boolean): { left: Side; right: Side } {
  const left = swapped ? oppositeSide(naturalLeft) : naturalLeft
  return { left, right: oppositeSide(left) }
}

export function parseSides(raw: string | null): Record<string, boolean> {
  if (!raw) return {}
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return {}
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  const sides: Record<string, boolean> = {}
  for (const [id, swapped] of Object.entries(value)) {
    if (!id || id.length > 80 || swapped !== true) continue
    sides[id] = true
  }
  return sides
}

export function gameWinner(home: number, away: number): Side | null {
  const lead = Math.abs(home - away)
  const high = Math.max(home, away)
  if (high >= RALLY_CAP && lead >= 1) return home > away ? "home" : "away"
  if (high >= RALLY_TARGET && lead >= 2) return home > away ? "home" : "away"
  return null
}

export function isGamePoint(home: number, away: number, side: Side) {
  if (gameWinner(home, away)) return false
  const nextHome = side === "home" ? home + 1 : home
  const nextAway = side === "away" ? away + 1 : away
  return gameWinner(nextHome, nextAway) === side
}

export function setsWon(board: Pick<LiveBoard, "games" | "final">): [number, number] {
  let home = 0
  let away = 0
  board.games.forEach(([homeScore, awayScore], index) => {
    const winner = gameWinner(homeScore, awayScore)
    const closed = board.final[index] || winner != null
    if (!closed) return
    if (winner === "home" || (!winner && homeScore > awayScore)) home += 1
    else if (winner === "away" || (!winner && awayScore > homeScore)) away += 1
  })
  return [home, away]
}

export function hasActivity(board: LiveBoard) {
  if (board.past.length > 0 || board.final.some(Boolean)) return true
  return board.games.some(([home, away]) => home > 0 || away > 0)
}

export function applyPoint(board: LiveBoard, side: Side, delta: 1 | -1, now: number): LiveBoard {
  const game = board.games[board.active]
  const current = side === "home" ? game[0] : game[1]
  const nextScore = current + delta
  if (nextScore < 0 || nextScore > RALLY_CAP) return board
  const games = cloneGames(board.games)
  games[board.active] = side === "home" ? [nextScore, game[1]] : [game[0], nextScore]
  const final = cloneFinal(board.final)
  final[board.active] = false
  return commit(board, { games, final, active: board.active }, now)
}

export function undoBoard(board: LiveBoard, now: number): LiveBoard {
  const previous = board.past[board.past.length - 1]
  if (!previous) return board
  return {
    games: cloneGames(previous.games),
    final: cloneFinal(previous.final),
    active: previous.active,
    past: board.past.slice(0, -1),
    updatedAt: now,
  }
}

export function focusGame(board: LiveBoard, active: GameIndex, now: number): LiveBoard {
  if (board.active === active) return board
  return { ...board, active, updatedAt: now }
}

/** After End game, the same button offers to post or share the score. */
export function scoreAction(board: LiveBoard): { kind: "end" | "save"; enabled: boolean; label: string } {
  const active = board.games[board.active]
  const marked = board.final[board.active]
  const won = gameWinner(active[0], active[1]) != null
  const started = active[0] > 0 || active[1] > 0
  const earlierMarked = board.final.slice(0, board.active).some(Boolean)
  const readyToSave = (board.active === 2 && (marked || won)) || (earlierMarked && !started) || marked
  if (readyToSave) {
    const played = board.games.some(([home, away]) => home > 0 || away > 0)
    return { kind: "save", enabled: played, label: "Save score" }
  }
  return { kind: "end", enabled: started, label: "End game" }
}

/** Closes the current game and moves on. A tied close awards no point. */
export function finishGame(board: LiveBoard, now: number): LiveBoard {
  const [home, away] = board.games[board.active]
  if (home === 0 && away === 0) return board
  const nextActive: GameIndex = board.active < 2 ? ((board.active + 1) as GameIndex) : board.active
  if (board.final[board.active] && nextActive === board.active) return board
  const final = cloneFinal(board.final)
  final[board.active] = true
  return commit(board, { games: cloneGames(board.games), final, active: nextActive }, now)
}

export function clearBoard(board: LiveBoard, now: number): LiveBoard {
  if (!hasActivity(board)) return board
  const cleared = blankBoard(now)
  return {
    ...cleared,
    past: [...board.past, copyState(board)].slice(-HISTORY_LIMIT),
    updatedAt: now,
  }
}

export function pickMatchId(
  matches: Match[],
  team: number | null,
  results: ResultsFile,
  savedMatchId: string | null,
  boards: Record<string, LiveBoard>,
) {
  if (matches.length === 0) return null
  if (savedMatchId && matches.some((match) => match.id === savedMatchId)) return savedMatchId
  const pool = team == null ? matches : matches.filter((match) => involves(match, team))
  let bestId: string | null = null
  let bestAt = -1
  for (const match of pool) {
    const board = boards[match.id]
    if (!board || !hasActivity(board)) continue
    if (board.updatedAt >= bestAt) {
      bestAt = board.updatedAt
      bestId = match.id
    }
  }
  if (bestId) return bestId
  if (team != null) {
    const next = nextUnplayed(matches, team, results)
    if (next) return next.id
  }
  return (pool[0] ?? matches[0]).id
}

export function parseBoards(raw: string | null): Record<string, LiveBoard> {
  if (!raw) return {}
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return {}
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  const boards: Record<string, LiveBoard> = {}
  for (const [id, board] of Object.entries(value)) {
    if (!id || id.length > 80) continue
    const parsed = parseBoard(board)
    if (parsed) boards[id] = parsed
  }
  return boards
}

export function loadBoards(storage: ScoreStorage) {
  try {
    return parseBoards(storage.getItem(BOARDS_KEY))
  } catch {
    return {}
  }
}

export function loadSides(storage: ScoreStorage) {
  try {
    return parseSides(storage.getItem(SIDES_KEY))
  } catch {
    return {}
  }
}

export function loadSelectedMatch(storage: ScoreStorage) {
  try {
    const value = storage.getItem(MATCH_KEY)
    if (!value || value.length > 80) return null
    return value
  } catch {
    return null
  }
}

export type LiveSnapshot = {
  ready: true
  boards: Record<string, LiveBoard>
  matchId: string | null
  sides: Record<string, boolean>
  persistOk: boolean
}

export function createLiveStore(storage: ScoreStorage, initialPersistOk = true) {
  let boards = loadBoards(storage)
  let matchId = loadSelectedMatch(storage)
  let sides = loadSides(storage)
  let persistOk = initialPersistOk
  let snapshot: LiveSnapshot = { ready: true, boards, matchId, sides, persistOk }
  const listeners = new Set<() => void>()

  function publish() {
    snapshot = { ready: true, boards, matchId, sides, persistOk }
    for (const listener of listeners) listener()
  }

  function write() {
    try {
      storage.setItem(BOARDS_KEY, JSON.stringify(boards))
      storage.setItem(MATCH_KEY, matchId ?? "")
      storage.setItem(SIDES_KEY, JSON.stringify(sides))
      persistOk = true
    } catch {
      persistOk = false
    }
  }

  function commitMatch(id: string, previous: LiveBoard, next: LiveBoard) {
    if (next === previous) return
    boards = { ...boards, [id]: next }
    matchId = id
    write()
    publish()
  }

  return {
    getSnapshot() {
      return snapshot
    },
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    reload() {
      let storedBoards: Record<string, LiveBoard>
      let storedMatch: string | null
      let storedSides: Record<string, boolean>
      try {
        storedBoards = loadBoards(storage)
        storedMatch = loadSelectedMatch(storage)
        storedSides = loadSides(storage)
      } catch {
        return
      }
      // Keep the newer side. A backgrounded tab may miss a write, or hold a score storage rejected.
      const merged: Record<string, LiveBoard> = { ...storedBoards }
      for (const [id, board] of Object.entries(boards)) {
        const stored = merged[id]
        if (!stored || board.updatedAt >= stored.updatedAt) merged[id] = board
      }
      const nextMatch = persistOk ? (storedMatch ?? matchId) : matchId
      const nextSides = persistOk ? storedSides : sides
      const keys = Object.keys(merged)
      const sideKeys = Object.keys(nextSides)
      const same =
        nextMatch === matchId &&
        keys.length === Object.keys(boards).length &&
        keys.every((id) => merged[id] === boards[id]) &&
        sideKeys.length === Object.keys(sides).length &&
        sideKeys.every((id) => nextSides[id] === sides[id])
      if (same) return
      boards = merged
      matchId = nextMatch
      sides = nextSides
      publish()
    },
    select(id: string) {
      if (matchId === id) return
      matchId = id
      write()
      publish()
    },
    addPoint(id: string, side: Side, now = Date.now()) {
      const current = boards[id] ?? blankBoard(0)
      commitMatch(id, current, applyPoint(current, side, 1, now))
    },
    removePoint(id: string, side: Side, now = Date.now()) {
      const current = boards[id] ?? blankBoard(0)
      commitMatch(id, current, applyPoint(current, side, -1, now))
    },
    undo(id: string, now = Date.now()) {
      const current = boards[id] ?? blankBoard(0)
      commitMatch(id, current, undoBoard(current, now))
    },
    showGame(id: string, active: GameIndex, now = Date.now()) {
      const current = boards[id] ?? blankBoard(0)
      commitMatch(id, current, focusGame(current, active, now))
    },
    endGame(id: string, now = Date.now()) {
      const current = boards[id] ?? blankBoard(0)
      commitMatch(id, current, finishGame(current, now))
    },
    reset(id: string, now = Date.now()) {
      const current = boards[id] ?? blankBoard(0)
      commitMatch(id, current, clearBoard(current, now))
    },
    switchSides(id: string) {
      const next = { ...sides }
      if (next[id]) delete next[id]
      else next[id] = true
      sides = next
      matchId = id
      write()
      publish()
    },
  }
}

export type LiveStore = ReturnType<typeof createLiveStore>

type ScoreDocument = {
  visibilityState: string
  addEventListener(type: string, listener: () => void): void
  removeEventListener(type: string, listener: () => void): void
}

type ScoreWindow = {
  addEventListener(type: string, listener: (event: Event) => void): void
  removeEventListener(type: string, listener: (event: Event) => void): void
}

export function watchScorePersistence(reload: () => void, doc: ScoreDocument, win: ScoreWindow) {
  const onStorage = (event: Event) => {
    const key = "key" in event ? (event as StorageEvent).key : null
    if (key == null || key === BOARDS_KEY || key === MATCH_KEY || key === SIDES_KEY) reload()
  }
  const onVisible = () => {
    if (doc.visibilityState === "visible") reload()
  }
  doc.addEventListener("visibilitychange", onVisible)
  win.addEventListener("pageshow", reload)
  win.addEventListener("focus", onVisible)
  win.addEventListener("storage", onStorage)
  return () => {
    doc.removeEventListener("visibilitychange", onVisible)
    win.removeEventListener("pageshow", reload)
    win.removeEventListener("focus", onVisible)
    win.removeEventListener("storage", onStorage)
  }
}

function commit(board: LiveBoard, next: ScoreState, now: number): LiveBoard {
  return {
    games: next.games,
    final: next.final,
    active: next.active,
    past: [...board.past, copyState(board)].slice(-HISTORY_LIMIT),
    updatedAt: now,
  }
}

function copyState(board: LiveBoard): ScoreState {
  return {
    games: cloneGames(board.games),
    final: cloneFinal(board.final),
    active: board.active,
  }
}

function cloneGames(games: LiveBoard["games"]): LiveBoard["games"] {
  return [
    [games[0][0], games[0][1]],
    [games[1][0], games[1][1]],
    [games[2][0], games[2][1]],
  ]
}

function cloneFinal(final: LiveBoard["final"]): LiveBoard["final"] {
  return [final[0], final[1], final[2]]
}

function parseBoard(value: unknown): LiveBoard | null {
  if (!value || typeof value !== "object") return null
  const body = value as Record<string, unknown>
  const state = parseState(body)
  if (!state) return null
  const past = Array.isArray(body.past)
    ? body.past.flatMap((item) => {
        const parsed = parseState(item)
        return parsed ? [parsed] : []
      }).slice(-HISTORY_LIMIT)
    : []
  const updatedAt = typeof body.updatedAt === "number" && Number.isFinite(body.updatedAt) ? body.updatedAt : 0
  return { ...state, past, updatedAt }
}

function parseState(value: unknown): ScoreState | null {
  if (!value || typeof value !== "object") return null
  const body = value as Record<string, unknown>
  if (!Array.isArray(body.games) || body.games.length !== 3) return null
  const games = body.games.map(parseGame)
  if (games.some((game) => game == null)) return null
  if (!Array.isArray(body.final) || body.final.length !== 3 || body.final.some((flag) => typeof flag !== "boolean")) {
    return null
  }
  if (!isGameIndex(body.active)) return null
  return {
    games: games as LiveBoard["games"],
    final: [body.final[0], body.final[1], body.final[2]],
    active: body.active,
  }
}

function parseGame(value: unknown): LiveGame | null {
  if (!Array.isArray(value) || value.length !== 2) return null
  if (!isPoint(value[0]) || !isPoint(value[1])) return null
  return [value[0], value[1]]
}

function isPoint(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 99
}

function isGameIndex(value: unknown): value is GameIndex {
  return value === 0 || value === 1 || value === 2
}
