"use client"

import Link from "next/link"
import { CalendarButton } from "@/components/calendar-button"
import { useTeam } from "@/components/team-provider"
import { diffLabel, formatTime, involves, opponent, seriesLabel } from "@/lib/schedule"
import { standings, teamSets } from "@/lib/standings"
import { ordinal, teamName, type TeamId } from "@/lib/teams"
import type { LeagueData } from "@/lib/types"
import { cn } from "cn"

export function TeamView({ league, team }: { league: LeagueData; team: TeamId }) {
  const { team: mine } = useTeam()
  const matches = league.schedule.matches.filter((match) => involves(match, team))
  const table = standings(league.schedule.matches, league.results)
  const row = table.find((item) => item.team === team)
  const next = matches.find((match) => !league.results[match.id])

  return (
    <div className="mx-auto w-[min(1120px,calc(100%-48px))] py-7 max-md:w-[calc(100%-48px)]">
      <div className="mb-[18px] flex items-end justify-between gap-6 max-md:mb-2 max-md:flex-col max-md:items-start max-md:gap-4">
        <div>
          <div className="text-xs font-semibold tracking-[0.16em] text-brand uppercase max-md:hidden">
            {mine === team ? "My team" : "Team"}
          </div>
          <h1 className="font-display text-[72px] leading-[0.85] tracking-wide uppercase max-md:text-4xl">{teamName(team)}</h1>
          <div className="mt-3 flex gap-7 max-md:mt-3.5 max-md:gap-5">
            <Stat value={row && row.wins + row.losses > 0 ? ordinal(row.rank) : "—"} label="Rank" />
            <Stat value={row ? `${row.wins}–${row.losses}` : "0–0"} label="Games" />
            <Stat value={row ? diffLabel(row.diff) : "0"} label="Point diff" positive={!!row && row.diff > 0} negative={!!row && row.diff < 0} />
          </div>
        </div>
        <CalendarButton matches={matches} team={team} label="Add all nights to calendar" />
      </div>

      {next ? (
        <section className="mb-[18px] overflow-hidden rounded-xl border border-border bg-panel max-md:hidden">
          <div className="flex items-baseline justify-between border-b border-border px-4 py-3.5">
            <h2 className="text-sm font-semibold">Next match</h2>
            <span className="text-xs text-dim">Court {next.court}</span>
          </div>
          <div className="grid grid-cols-[118px_1fr_auto_1fr] items-center gap-2 bg-[#e8572a]/15 px-4 py-3 shadow-[inset_3px_0_0_#e8572a]">
            <span className="text-xs tracking-wider text-brand uppercase">Court {next.court}</span>
            <span className="font-display text-[26px] uppercase">{teamName(team)}</span>
            <span className="text-[11px] tracking-[0.14em] text-dim uppercase">vs</span>
            <span className="text-right font-display text-[26px] uppercase">{teamName(opponent(next, team))}</span>
          </div>
          <div className="flex items-baseline justify-between border-t border-border px-4 py-3.5">
            <h2 className="text-sm font-medium text-muted-foreground">{formatLine(next.date)} · {formatTime(next.time)} · {league.schedule.gym}</h2>
            <span className="text-xs text-dim">Warm up at {next.time === "18:00" ? "5:50 PM" : "6:50 PM"}</span>
          </div>
        </section>
      ) : null}

      <h2 className="mb-2 font-display text-sm tracking-[0.08em] text-muted-foreground uppercase max-md:hidden">Season</h2>
      <div>
        {matches.map((match) => {
          const result = league.results[match.id]
          const sets = result ? teamSets(match, result, team) : null
          const scoreText = result
            ? result.games.map((game) => {
                const mineScore = match.home === team ? game[0] : game[1]
                const oppScore = match.home === team ? game[1] : game[0]
                return `${mineScore}–${oppScore}`
              }).join(", ")
            : null
          const outcome = sets ? seriesLabel(sets.setsFor, sets.setsAgainst) : next?.id === match.id ? "Next" : "—"
          const upcoming = !result
          return (
            <div key={match.id}>
              <div
                className={cn(
                  "hidden grid-cols-[92px_88px_80px_1fr_auto] items-center gap-3 border-t border-border py-3 md:grid",
                  upcoming && next?.id === match.id && "bg-[#e8572a]/15 px-3 shadow-[inset_3px_0_0_#e8572a]",
                  upcoming && next?.id !== match.id && "text-muted-foreground",
                )}
              >
                <span className="font-display text-lg tracking-wide uppercase">{formatShort(match.date)}</span>
                <span className="font-display text-base tracking-wide text-muted-foreground uppercase">{formatTime(match.time)}</span>
                <span className="font-display text-sm tracking-wide text-dim uppercase">Court {match.court}</span>
                <span className="font-medium">vs {teamName(opponent(match, team))}</span>
                <span className="text-right font-display text-lg">
                  {outcome === "Next" ? <span className="font-sans text-xs font-semibold tracking-[0.12em] text-brand uppercase">Next</span> : outcome}
                  {scoreText ? <small className="mt-0.5 block font-sans text-xs font-normal tracking-normal text-dim">{scoreText}</small> : null}
                </span>
              </div>
              <div className={cn("border-t border-border py-3.5 md:hidden", upcoming && next?.id !== match.id && "text-muted-foreground")}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-display text-lg tracking-wide uppercase">{formatShort(match.date)}</span>
                  {outcome === "Next" ? (
                    <span className="text-xs font-semibold tracking-[0.12em] text-brand uppercase">Next</span>
                  ) : (
                    <span className="font-display text-base">{outcome}</span>
                  )}
                </div>
                <div className="text-sm text-dim">{formatTime(match.time)} · Court {match.court}</div>
                <div className="font-medium">vs {teamName(opponent(match, team))}</div>
                {scoreText ? <div className="text-xs text-dim">{scoreText}</div> : null}
              </div>
            </div>
          )
        })}
      </div>
      <p className="mt-8 text-sm text-dim md:hidden">
        <Link href="/rules" className="underline underline-offset-4">League rules</Link>
      </p>
    </div>
  )
}

function Stat({ value, label, positive, negative }: { value: string; label: string; positive?: boolean; negative?: boolean }) {
  return (
    <div>
      <b className={cn("block font-display text-[28px] leading-none tracking-wide", positive && "text-pos", negative && "text-neg")}>{value}</b>
      <span className="text-[11px] tracking-[0.12em] text-dim uppercase">{label}</span>
    </div>
  )
}

function formatShort(date: string) {
  const [, month, day] = date.split("-")
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return `${names[Number(month) - 1]} ${Number(day)}`
}

function formatLine(date: string) {
  return formatShort(date).replace(/(\w+) (\d+)/, "$1 $2")
}
