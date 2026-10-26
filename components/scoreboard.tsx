"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { LocationLabel } from "@/components/location-label"
import { SaveScoreSheet } from "@/components/save-score-sheet"
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
  scoreAction,
  setsWon,
  type GameIndex,
  type LiveBoard,
  type LiveGame,
  type Side,
} from "@/lib/live-score"
import { assignedTeams, byStart, formatChip, formatNight, formatTime, involves, matchTitle } from "@/lib/schedule"
import { teamName } from "@/lib/teams"
import type { LeagueData, Match } from "@/lib/types"
import { findVenue } from "@/lib/venues"
import { cn } from "cn"

export function Scoreboard({ league }: { league: LeagueData }) {
  const { team } = useTeam()
  const snap = useLiveScore()
  const { results, reload } = useLiveResults(league.results)
  const requested = useSearchParams().get("match")
  const [resetFor, setResetFor] = useState<string | null>(null)
  const [picked, setPicked] = useState<string | null>(null)
  const [saveOpen, setSaveOpen] = useState(false)
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
  if (!assignedTeams(match)) {
    return (
      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-2 px-3 py-2 max-md:h-[calc(100dvh-3.5rem-3px-var(--tab-clearance))] md:w-[min(760px,calc(100%-48px))] md:py-7">
        <h1 className="eyebrow text-brand">Live score</h1>
        <MatchPicker matches={matches} match={match} team={team} onPick={(id) => { setPicked(id); getLiveStore().select(id) }} />
        <p className="text-sm text-muted-foreground">{matchTitle(match)}. Teams for this slot are not set yet, so there is nothing to score.</p>
      </div>
    )
  }
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
  const action = scoreAction(board)
  const waitingOnNext = action.kind === "save" && current[0] === 0 && current[1] === 0
  const status = waitingOnNext
    ? "Save this score, or add a point to keep going."
    : statusText(board, leftSide, teamName(leftTeam), teamName(rightTeam))
  const live = getLiveStore()

  const buttonClass = "min-h-14 touch-manipulation rounded-xl px-2 text-base font-semibold whitespace-nowrap disabled:opacity-40"

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-2 px-3 py-2 max-md:h-[calc(100dvh-3.5rem-3px-var(--tab-clearance))] max-md:min-h-0 md:w-[min(760px,calc(100%-48px))] md:gap-3 md:py-7">
      <div className="flex items-center justify-between gap-3">
        <h1 className="eyebrow text-brand">Live score</h1>
        <span className="text-[11px] text-dim">{snap.persistOk ? "On this phone" : "Not saved"}</span>
      </div>

      <MatchPicker matches={matches} match={match} team={team} onPick={(id) => { setPicked(id); live.select(id) }} />

      <div className="hidden items-baseline justify-between gap-3 text-sm text-muted-foreground md:flex">
        <span>{formatNight(match.date)} · {formatTime(match.time)}</span>
        <span className="shrink-0 text-right">
          <LocationLabel venue={findVenue(league.schedule.venues, match)} fallback={`Court ${match.court}`} />
        </span>
      </div>

      {results[match.id] ? (
        <p className="text-xs leading-4 text-muted-foreground">Official score is already posted. This board stays on your phone.</p>
      ) : null}

      <div className="flex items-stretch gap-2">
        <div className="flex w-[4.5rem] shrink-0 flex-col items-center justify-center rounded-xl border border-border bg-panel">
          <span className="kicker text-dim">Games</span>
          <span className="font-display text-2xl leading-none tabular-nums">{youSets}–{themSets}</span>
        </div>
        <div className="grid min-w-0 flex-1 grid-cols-3 gap-2">
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
                  "flex min-h-14 touch-manipulation flex-col items-center justify-center gap-0.5 overflow-hidden rounded-xl border px-1",
                  selected ? "border-brand bg-[var(--highlight)]" : "border-border bg-panel",
                )}
              >
                <span className="kicker max-w-full truncate text-dim">G{gameIndex + 1}{closed ? " · final" : ""}</span>
                <span className="font-display text-xl leading-none tabular-nums">
                  {sideScore(game, leftSide)}–{sideScore(game, rightSide)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 md:min-h-80 md:flex-none">
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
      <p className="truncate text-center text-xs text-muted-foreground" aria-hidden="true">{status}</p>

      {resetFor === match.id ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              live.reset(match.id)
              setResetFor(null)
            }}
            className={cn(buttonClass, "bg-destructive/15 text-destructive")}
          >
            Clear scores
          </button>
          <button type="button" onClick={() => setResetFor(null)} className={cn(buttonClass, "border border-border")}>
            Cancel
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => live.undo(match.id)}
            disabled={board.past.length === 0}
            className={cn(buttonClass, "border border-border")}
          >
            Undo
          </button>
          <button
            type="button"
            onClick={() => {
              if (action.kind === "save") {
                setSaveOpen(true)
                return
              }
              live.endGame(match.id)
            }}
            disabled={action.kind === "end" && !action.enabled}
            className={cn(buttonClass, action.kind === "save" || action.enabled ? "border border-transparent bg-brand text-[var(--brand-ink)]" : "border border-border")}
          >
            {action.label}
          </button>
          <button
            type="button"
            onClick={() => setResetFor(match.id)}
            disabled={!hasActivity(board)}
            className={cn(buttonClass, "border border-border")}
          >
            Reset
          </button>
        </div>
      )}

      <p className="sr-only">
        {snap.persistOk
          ? "Switching apps or locking the screen keeps this score on this phone. End a game at 10 to the hour. A tie gives no point. Saving uses the coordinator password."
          : "This phone blocked saving. Stay on this page to keep the score."}
      </p>
      <p className="hidden text-center text-xs leading-5 text-dim md:block">
        {snap.persistOk
          ? "Switching apps or locking the screen keeps this score on this phone. End a game at 10 to the hour. A tie gives no point. Saving uses the coordinator password."
          : "This phone blocked saving. Stay on this page to keep the score."}
      </p>
      <SaveScoreSheet
        open={saveOpen}
        onOpenChange={setSaveOpen}
        matchId={match.id}
        leftName={teamName(leftTeam)}
        rightName={teamName(rightTeam)}
        when={`${formatNight(match.date)} · ${formatTime(match.time)}`}
        games={board.games.map((game, index) => ({
          label: `Game ${index + 1}`,
          left: sideScore(game, leftSide),
          right: sideScore(game, rightSide),
          played: game[0] !== 0 || game[1] !== 0,
        }))}
        officialGames={board.games}
        alreadyPosted={Boolean(results[match.id])}
        onSaved={reload}
      />
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
    <div className={cn("flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border select-none md:min-h-80", yours ? "border-brand bg-[var(--highlight)]" : "border-border bg-panel")}>
      <button
        type="button"
        onClick={onAdd}
        aria-disabled={score >= RALLY_CAP}
        aria-label={`Add a point for ${name}`}
        className="flex min-h-0 flex-1 touch-manipulation flex-col items-center justify-center gap-1 px-2 py-2 active:bg-brand/25"
      >
        <span className={cn("kicker", yours ? "text-brand" : "text-dim")}>{role}</span>
        <span className="max-w-full text-center font-display text-base leading-tight tracking-wide text-balance uppercase md:text-xl">{name}</span>
        <span className={cn("font-display text-[clamp(4.25rem,24vw,7rem)] font-extrabold leading-none tracking-normal tabular-nums", score < other && "text-muted-foreground")}>
          {score}
        </span>
        <span className="font-display text-2xl font-extrabold leading-none tracking-[0.08em] text-brand uppercase">{score >= RALLY_CAP ? "Cap" : "+1"}</span>
        <span className={cn("kicker h-4", gamePoint ? "text-brand" : "invisible")}>
          Game point
        </span>
      </button>
      <button
        type="button"
        onClick={onRemove}
        disabled={score === 0}
        aria-label={`Remove a point for ${name}`}
        className="h-14 shrink-0 touch-manipulation border-t border-border bg-background font-display text-2xl font-extrabold disabled:opacity-40"
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

function MatchPicker({
  matches,
  match,
  team,
  onPick,
}: {
  matches: Match[]
  match: Match
  team: number
  onPick: (id: string) => void
}) {
  if (matches.length <= 1) {
    return (
      <div className="flex h-14 items-center rounded-xl border border-border bg-panel px-3 font-display text-base tracking-wide uppercase md:text-2xl">
        {matchTitle(match)}
      </div>
    )
  }
  return (
    <select
      id="live-match"
      aria-label="Match"
      className="h-14 w-full truncate rounded-xl border border-border bg-panel px-3 font-display text-base tracking-wide outline-none md:text-2xl"
      value={match.id}
      onChange={(event) => onPick(event.target.value)}
    >
      {matches.map((item) => (
        <option key={item.id} value={item.id}>{matchLabel(item, team, matches)}</option>
      ))}
    </select>
  )
}

function matchLabel(match: Match, team: number, matches: Match[]) {
  const nights = new Set(matches.map((item) => item.date)).size
  const when = nights > 1 ? `${formatChip(match.date)} · ${formatTime(match.time)}` : formatTime(match.time)
  const you = involves(match, team) ? " · You" : ""
  return `${when} · ${matchTitle(match)}${you}`
}

function sideScore(game: LiveGame, side: Side) {
  return side === "home" ? game[0] : game[1]
}

function ScoreSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[760px] px-3 py-2 max-md:h-[calc(100dvh-3.5rem-3px-var(--tab-clearance))] md:py-7" aria-busy="true">
      <h1 className="eyebrow text-brand">Live score</h1>
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
