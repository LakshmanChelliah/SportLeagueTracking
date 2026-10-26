import { describe, expect, it } from "vitest"
import schedule from "../data/schedule.json"
import {
  applyPoint,
  blankBoard,
  BOARDS_KEY,
  clearBoard,
  createLiveStore,
  finishGame,
  focusGame,
  gameWinner,
  isGamePoint,
  loadBoards,
  MATCH_KEY,
  parseBoards,
  pickMatchId,
  setsWon,
  undoBoard,
  watchScorePersistence,
  type LiveBoard,
  type ScoreStorage,
} from "./live-score"
import type { Match, ResultsFile } from "./types"

const matches = schedule.matches as Match[]

function memoryStorage(initial: Record<string, string> = {}): ScoreStorage & { dump: () => Record<string, string> } {
  const data = { ...initial }
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null
    },
    setItem(key, value) {
      data[key] = value
    },
    dump() {
      return data
    },
  }
}

function fakeEvents() {
  const listeners = new Map<string, Set<(event: Event) => void>>()
  return {
    visibilityState: "hidden",
    addEventListener(type: string, listener: (event: Event) => void) {
      const set = listeners.get(type) ?? new Set()
      set.add(listener)
      listeners.set(type, set)
    },
    removeEventListener(type: string, listener: (event: Event) => void) {
      listeners.get(type)?.delete(listener)
    },
    emit(type: string, event: Event = { key: null } as unknown as Event) {
      for (const listener of listeners.get(type) ?? []) listener(event)
    },
  }
}

describe("live score rules", () => {
  it("wins at 21 with a lead of 2, or at 25", () => {
    expect(gameWinner(21, 19)).toBe("home")
    expect(gameWinner(19, 21)).toBe("away")
    expect(gameWinner(21, 20)).toBeNull()
    expect(gameWinner(22, 20)).toBe("home")
    expect(gameWinner(24, 24)).toBeNull()
    expect(gameWinner(25, 24)).toBe("home")
    expect(gameWinner(23, 25)).toBe("away")
    expect(gameWinner(20, 19)).toBeNull()
  })

  it("marks game point only when the next rally would win", () => {
    expect(isGamePoint(20, 19, "home")).toBe(true)
    expect(isGamePoint(20, 19, "away")).toBe(false)
    expect(isGamePoint(20, 20, "home")).toBe(false)
    expect(isGamePoint(24, 24, "away")).toBe(true)
    expect(isGamePoint(21, 19, "home")).toBe(false)
  })

  it("adds and removes points on the open game without going past the cap", () => {
    let board = blankBoard(1)
    board = applyPoint(board, "home", 1, 2)
    board = applyPoint(board, "away", 1, 3)
    expect(board.games[0]).toEqual([1, 1])
    expect(board.games[1]).toEqual([0, 0])
    board = applyPoint(board, "home", -1, 4)
    expect(board.games[0]).toEqual([0, 1])
    board = applyPoint(board, "home", -1, 5)
    expect(board.games[0]).toEqual([0, 1])
    board.games[0] = [25, 24]
    const capped = applyPoint(board, "home", 1, 6)
    expect(capped.games[0][0]).toBe(25)
  })

  it("undoes a point, an early finish, and a reset", () => {
    let board = applyPoint(blankBoard(1), "home", 1, 2)
    board = applyPoint(board, "home", 1, 3)
    board = undoBoard(board, 4)
    expect(board.games[0]).toEqual([1, 0])
    board.games[0] = [15, 12]
    board = finishGame(board, 5)
    expect(setsWon(board)).toEqual([1, 0])
    expect(board.active).toBe(1)
    board = undoBoard(board, 6)
    expect(board.games[0]).toEqual([15, 12])
    expect(board.final[0]).toBe(false)
    expect(board.active).toBe(0)
    const reset = clearBoard(board, 7)
    expect(reset.games).toEqual([
      [0, 0],
      [0, 0],
      [0, 0],
    ])
    expect(undoBoard(reset, 8).games[0]).toEqual([15, 12])
  })

  it("counts a rules win, an early lead, and no point for a tie", () => {
    const board: LiveBoard = {
      ...blankBoard(1),
      games: [
        [21, 18],
        [15, 12],
        [10, 10],
      ],
      final: [false, true, true],
    }
    expect(setsWon(board)).toEqual([2, 0])
  })

  it("keeps a saved match, otherwise the one already being scored", () => {
    const started = applyPoint(blankBoard(5), "away", 1, 9)
    expect(pickMatchId(matches, 1, {}, null, {})).toBe("2026-10-21-1800-c1")
    expect(pickMatchId(matches, 2, {}, null, { "2026-10-21-1900-c1": started })).toBe("2026-10-21-1900-c1")
    expect(pickMatchId(matches, 2, {}, "2026-10-21-1800-c1", { "2026-10-21-1900-c1": started })).toBe("2026-10-21-1800-c1")
    const results: ResultsFile = {
      "2026-10-21-1900-c1": { games: [[21, 0], [21, 0], [21, 0]] },
    }
    expect(pickMatchId(matches, 2, results, null, {})).toBe("2026-10-21-1900-c1")
  })
})

describe("live score storage", () => {
  it("drops corrupt boards and keeps the rest", () => {
    const raw = JSON.stringify({
      good: { ...applyPoint(blankBoard(1), "home", 1, 2), past: [{ active: 9 }] },
      bad: { games: [[1]], final: [false, false, false], active: 0 },
    })
    const boards = parseBoards(raw)
    expect(boards.good.games[0]).toEqual([1, 0])
    expect(boards.good.past).toEqual([])
    expect(boards.bad).toBeUndefined()
    expect(parseBoards("{")).toEqual({})
  })

  it("reads the score back after the page is opened again", () => {
    const storage = memoryStorage()
    const first = createLiveStore(storage)
    first.addPoint("2026-10-21-1800-c1", "home", 10)
    first.addPoint("2026-10-21-1800-c1", "away", 11)
    first.showGame("2026-10-21-1800-c1", 1, 12)
    const second = createLiveStore(storage)
    const board = second.getSnapshot().boards["2026-10-21-1800-c1"]
    expect(board.games[0]).toEqual([1, 1])
    expect(board.active).toBe(1)
    expect(second.getSnapshot().matchId).toBe("2026-10-21-1800-c1")
    expect(loadBoards(storage)["2026-10-21-1800-c1"].games[0]).toEqual([1, 1])
  })

  it("reloads a newer saved score when the tab becomes visible again", () => {
    const storage = memoryStorage()
    const background = createLiveStore(storage)
    const doc = fakeEvents()
    const win = fakeEvents()
    const stop = watchScorePersistence(() => background.reload(), doc, win)
    createLiveStore(storage).addPoint("2026-10-21-1800-c1", "home", 20)
    expect(background.getSnapshot().boards["2026-10-21-1800-c1"]).toBeUndefined()
    doc.emit("visibilitychange")
    expect(background.getSnapshot().boards["2026-10-21-1800-c1"]).toBeUndefined()
    doc.visibilityState = "visible"
    doc.emit("visibilitychange")
    expect(background.getSnapshot().boards["2026-10-21-1800-c1"].games[0][0]).toBe(1)
    const saved = storage.dump()[BOARDS_KEY].replace("[1,0]", "[4,2]").replace('"updatedAt":20', '"updatedAt":30')
    storage.setItem(BOARDS_KEY, saved)
    win.emit("storage", { key: "other" } as unknown as Event)
    expect(background.getSnapshot().boards["2026-10-21-1800-c1"].games[0][0]).toBe(1)
    win.emit("storage", { key: BOARDS_KEY } as unknown as Event)
    expect(background.getSnapshot().boards["2026-10-21-1800-c1"].games[0]).toEqual([4, 2])
    win.emit("pageshow")
    expect(background.getSnapshot().matchId).toBe("2026-10-21-1800-c1")
    stop()
    doc.visibilityState = "visible"
    doc.emit("visibilitychange")
    expect(background.getSnapshot().boards["2026-10-21-1800-c1"].games[0][0]).toBe(4)
  })

  it("keeps an unsaved in-memory score if the phone blocks storage", () => {
    const storage = memoryStorage()
    storage.setItem = () => {
      throw new Error("quota")
    }
    const live = createLiveStore(storage)
    live.addPoint("2026-10-21-1800-c1", "away", 8)
    expect(live.getSnapshot().persistOk).toBe(false)
    expect(live.getSnapshot().boards["2026-10-21-1800-c1"].games[0][1]).toBe(1)
    live.reload()
    expect(live.getSnapshot().boards["2026-10-21-1800-c1"].games[0][1]).toBe(1)
    expect(storage.dump()[MATCH_KEY]).toBeUndefined()
  })

  it("undo returns to the game where the last point was scored", () => {
    let board = applyPoint(blankBoard(1), "home", 1, 2)
    board = focusGame(board, 2, 3)
    expect(board.active).toBe(2)
    expect(undoBoard(board, 4).active).toBe(0)
    expect(undoBoard(board, 4).games[0]).toEqual([0, 0])
  })
})
