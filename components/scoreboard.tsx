"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { LocationLabel } from "@/components/location-label"
import { getLiveStore, useLiveScore } from "@/components/use-live-score"
import { useTeam } from "@/components/team-provider"
import { useLiveResults } from "@/components/use-live-results"
import {
  blankBoard,
  gameWinner,
  hasActivity,
  isGamePoint,
  pickMatchId,
  RALLY_CAP,
  setsWon,
  type GameIndex,
  type LiveBoard,
  type LiveGame,
  type Side,
} from "@/lib/live-score"
import { byStart, formatChip, formatNight, formatTime, involves } from "@/lib/schedule"
import { teamName } from "@/lib/teams"
import type { LeagueData, Match } from "@/lib/types"
import { findVenue } from "@/lib/venues"
import { cn } from "cn"

export function Scoreboard({ league }: { league: LeagueData }) {
  const { team } = useTeam()
  const snap = useLiveScore()
  const { results } = useLiveResults(league.results)
  const requested = useSearchParams().get("match")
  const [resetFor, setResetFor] = useState<string | null>(null)
  const [picked, setPicked] = useState<string | null>(null)
  useWakeLock()
  const queryMatch = requested && league.schedule.matches.some((item) => item.id === requested) ? requested : null

  useEffect(() => {
    if (!snap.ready || !queryMatch || picked || snap.matchId === queryMatch) return
    getLiveStore().select(queryMatch)
  }, [picked, queryMatch, snap.matchId, snap.ready])

  if (!snap.ready) return <ScoreSkeleton />

  const matches = [...league.schedule.matches].sort(byStart)
  if (!team || matches.length === 0) {
    return (
      <div className="mx-auto w-[min(720px,calc(100%-32px))] py-7">
        <h1 className="font-display text-5xl tracking-wide uppercase">No matches</h1>
        <p className="mt-2 text-sm text-muted-foreground">Scores open once a match is on the board.</p>
      </div>
    )
  }

  const savedId = picked ?? queryMatch ?? snap.matchId
  const matchId = pickMatchId(matches, team, results, savedId, snap.boards)
  const match = matches.find((item) => item.id === matchId) ?? matches[0]
  const board = snap.boards[match.id] ?? blankBoard(0)
  const yours = involves(match, team)
  const leftSide: Side = yours && match.away === team ? "away" : "home"
  const rightSide: Side = leftSide === "home" ? "away" : "home"
  const leftTeam = match[leftSide]
  const rightTeam = match[rightSide]
  const [homeSets, awaySets] = setsWon(board)
  const youSets = leftSide === "home" ? homeSets : awaySets
  const themSets = leftSide === "home" ? awaySets : homeSets
  const current = board.games[board.active]
  const status = statusText(board, leftSide, teamName(leftTeam), teamName(rightTeam))
  const ending = endControl(board)
  const live = getLiveStore()

  return (
    <div className="mx-auto flex w-[min(720px,calc(100%-32px))] flex-col gap-3 py-5 md:w-[min(760px,calc(100%-48px))] md:py-7">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-xs font-semibold tracking-[0.16em] text-brand uppercase">Live score</h1>
        <span className="text-xs text-dim">{snap.persistOk ? "On this phone" : "Not saved"}</span>
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-panel">
        <div className="px-4 py-3">
          {matches.length > 1 ? (
            <>
              <label htmlFor="live-match" className="text-xs tracking-wider text-dim uppercase">Match</label>
              <select
                id="live-match"
                className="mt-1 w-full truncate bg-transparent font-display text-xl tracking-wide outline-none md:text-2xl"
                value={match.id}
                onChange={(event) => {
                  setPicked(event.target.value)
                  live.select(event.target.value)
                }}
              >
                {matches.map((item) => (
                  <option key={item.id} value={item.id}>{matchLabel(item, team, matches)}</option>
                ))}
              </select>
            </>
          ) : (
            <>
              <div className="text-xs tracking-wider text-dim uppercase">Match</div>
              <div className="mt-1 font-display text-2xl tracking-wide uppercase">
                {teamName(match.home)} vs {teamName(match.away)}
              </div>
            </>
          )}
        </div>
        <div className="flex items-baseline justify-between gap-3 border-t border-border px-4 py-2.5 text-sm text-muted-foreground">
          <span>{formatNight(match.date)} · {formatTime(match.time)}</span>
          <span className="shrink-0 text-right">
            <LocationLabel venue={findVenue(league.schedule.venues, match)} fallback={`Court ${match.court}`} />
          </span>
        </div>
      </section>

      {results[match.id] ? (
        <p className="text-sm text-muted-foreground">Official score is already posted. This board stays on your phone.</p>
      ) : null}

      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-3xl tracking-wide uppercase">Games {youSets}–{themSets}</h2>
        <span className="text-xs tracking-[0.14em] text-dim uppercase">Game {board.active + 1} of 3</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {board.games.map((game, index) => {
          const gameIndex = index as GameIndex
          const closed = board.final[gameIndex] || gameWinner(game[0], game[1]) != null
          const selected = board.active === gameIndex
          return (
            <button
              key={gameIndex}
              type="button"
              aria-pressed={selected}
              onClick={() => live.showGame(match.id, gameIndex)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border px-2 py-2",
                selected ? "border-brand bg-[var(--highlight)]" : "border-border bg-panel",
              )}
            >
              <span className="text-[11px] tracking-[0.14em] text-dim uppercase">G{gameIndex + 1}</span>
              <span className="font-display text-2xl leading-none tabular-nums">
                {sideScore(game, leftSide)}–{sideScore(game, rightSide)}
              </span>
              <span className={cn("text-[10px] tracking-[0.14em] uppercase", closed ? "text-dim" : "invisible")}>Final</span>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ScorePad
          role={yours ? "You" : "Home"}
          name={teamName(leftTeam)}
          score={sideScore(current, leftSide)}
          other={sideScore(current, rightSide)}
          gamePoint={isGamePoint(current[0], current[1], leftSide)}
          yours={yours}
          onAdd={() => live.addPoint(match.id, leftSide)}
          onRemove={() => live.removePoint(match.id, leftSide)}
        />
        <ScorePad
          role={yours ? "Opponent" : "Away"}
          name={teamName(rightTeam)}
          score={sideScore(current, rightSide)}
          other={sideScore(current, leftSide)}
          gamePoint={isGamePoint(current[0], current[1], rightSide)}
          yours={false}
          onAdd={() => live.addPoint(match.id, rightSide)}
          onRemove={() => live.removePoint(match.id, rightSide)}
        />
      </div>

      <p className="sr-only" aria-live="polite">
        {teamName(leftTeam)} {sideScore(current, leftSide)}, {teamName(rightTeam)} {sideScore(current, rightSide)}. Game {board.active + 1}. {status}
      </p>
      <p className="text-center text-[13px] text-muted-foreground" aria-hidden="true">{status}</p>

      {resetFor === match.id ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              live.reset(match.id)
              setResetFor(null)
            }}
            className="h-11 rounded-lg bg-destructive/15 text-sm font-semibold text-destructive"
          >
            Clear scores
          </button>
          <button type="button" onClick={() => setResetFor(null)} className="h-11 rounded-lg border border-border text-sm font-semibold">
            Cancel
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => live.undo(match.id)}
            disabled={board.past.length === 0}
            className="h-11 rounded-lg border border-border text-sm font-semibold disabled:pointer-events-none disabled:opacity-40"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={() => live.endGame(match.id)}
            disabled={!ending.canEnd}
            className={cn(
              "h-11 rounded-lg border text-sm font-semibold disabled:pointer-events-none disabled:opacity-40",
              ending.canEnd ? "border-transparent bg-brand text-[var(--brand-ink)]" : "border-border",
            )}
          >
            {ending.label}
          </button>
          <button
            type="button"
            onClick={() => setResetFor(match.id)}
            disabled={!hasActivity(board)}
            className="h-11 rounded-lg border border-border text-sm font-semibold disabled:pointer-events-none disabled:opacity-40"
          >
            Reset
          </button>
        </div>
      )}

      <p className="text-center text-xs leading-5 text-dim">
        {snap.persistOk
          ? "Switching apps or locking the screen keeps this score on this phone. End a game at 10 to the hour. A tie gives no point. The coordinator posts the official result."
          : "This phone blocked saving. Stay on this page to keep the score."}
      </p>
    </div>
  )
}

function ScorePad({
  role,
  name,
  score,
  other,
  gamePoint,
  yours,
  onAdd,
  onRemove,
}: {
  role: string
  name: string
  score: number
  other: number
  gamePoint: boolean
  yours: boolean
  onAdd: () => void
  onRemove: () => void
}) {
  return (
    <div className={cn("flex min-h-64 flex-col rounded-xl border select-none", yours ? "border-brand bg-[var(--highlight)]" : "border-border bg-panel")}>
      <button
        type="button"
        onClick={onAdd}
        aria-disabled={score >= RALLY_CAP}
        aria-label={`Add a point for ${name}`}
        className="flex flex-1 touch-manipulation flex-col items-center px-3 pt-4 pb-2"
      >
        <span className={cn("text-[11px] font-semibold tracking-[0.16em] uppercase", yours ? "text-brand" : "text-dim")}>{role}</span>
        <span className="mt-2 font-display text-[22px] leading-none tracking-wide uppercase">{name}</span>
        <span className={cn("mt-2 font-display text-[92px] leading-none tracking-wide tabular-nums md:text-[112px]", score < other && "text-muted-foreground")}>
          {score}
        </span>
        <span className="mt-2 text-xs font-semibold tracking-[0.16em] text-brand uppercase">{score >= RALLY_CAP ? "Cap" : "+1"}</span>
        <span className={cn("mt-1 h-4 text-[11px] font-semibold tracking-[0.14em] uppercase", gamePoint ? "text-brand" : "invisible")}>
          Game point
        </span>
      </button>
      <button
        type="button"
        onClick={onRemove}
        disabled={score === 0}
        aria-label={`Remove a point for ${name}`}
        className="mx-3 mb-3 h-11 touch-manipulation rounded-lg border border-border bg-background text-sm font-semibold disabled:opacity-40"
      >
        −1
      </button>
    </div>
  )
}

function statusText(board: LiveBoard, left: Side, leftName: string, rightName: string) {
  const [home, away] = board.games[board.active]
  const winner = gameWinner(home, away)
  const name = (side: Side) => (side === left ? leftName : rightName)
  if (winner) return `${name(winner)} takes the game`
  if (board.final[board.active]) {
    if (home === away) return "Tied game · no point"
    return `${name(home > away ? "home" : "away")} leads at the stop`
  }
  if (isGamePoint(home, away, "home") || isGamePoint(home, away, "away")) return "Game point"
  return "Rally to 21 · win by 2 · cap 25"
}

function endControl(board: LiveBoard) {
  const [home, away] = board.games[board.active]
  const closed = board.final[board.active] || gameWinner(home, away) != null
  const canEnd = !(home === 0 && away === 0) && !(closed && board.active === 2)
  const label = closed && board.active < 2 ? "Next game" : closed ? "Game done" : "End game"
  return { canEnd, label }
}

function matchLabel(match: Match, team: number, matches: Match[]) {
  const nights = new Set(matches.map((item) => item.date)).size
  const when = nights > 1 ? `${formatChip(match.date)} · ${formatTime(match.time)}` : formatTime(match.time)
  const you = involves(match, team) ? " · You" : ""
  return `${when} · ${teamName(match.home)} vs ${teamName(match.away)}${you}`
}

function sideScore(game: LiveGame, side: Side) {
  return side === "home" ? game[0] : game[1]
}

function ScoreSkeleton() {
  return (
    <div className="mx-auto w-[min(720px,calc(100%-32px))] py-5 md:py-7" aria-busy="true">
      <h1 className="text-xs font-semibold tracking-[0.16em] text-brand uppercase">Live score</h1>
      <p className="mt-3 text-sm text-dim">Loading the score on this phone.</p>
    </div>
  )
}

function useWakeLock() {
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null
    let stopped = false
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: "screen") => Promise<{ release: () => Promise<void> }> }
    }

    async function acquire() {
      if (stopped || document.visibilityState !== "visible" || !nav.wakeLock) return
      try {
        const next = await nav.wakeLock.request("screen")
        if (stopped) {
          await next.release()
          return
        }
        lock = next
      } catch {
        lock = null
      }
    }

    function onVisible() {
      if (document.visibilityState === "visible") void acquire()
      else {
        void lock?.release()
        lock = null
      }
    }

    void acquire()
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      stopped = true
      document.removeEventListener("visibilitychange", onVisible)
      void lock?.release()
    }
  }, [])
}
