"use client"

import Link from "next/link"
import { CalendarButton } from "@/components/calendar-button"
import { KeepScoreLink } from "@/components/keep-score-link"
import { LocationLabel } from "@/components/location-label"
import { useTeam } from "@/components/team-provider"
import { useLiveResults } from "@/components/use-live-results"
import { diffLabel, formatTime, involves, opponent, seriesLabel, slotTime, warmupLabel } from "@/lib/schedule"
import { standings, teamSets } from "@/lib/standings"
import { ordinal, teamName, type TeamId } from "@/lib/teams"
import type { LeagueData } from "@/lib/types"
import { findVenue } from "@/lib/venues"
import { cn } from "cn"

export function TeamView({ league, team }: { league: LeagueData; team: TeamId }) {
  const { team: mine } = useTeam()
  const { results } = useLiveResults(league.results)
  const matches = league.schedule.matches.filter((match) => involves(match, team))
  const table = standings(league.schedule.matches, results)
  const row = table.find((item) => item.team === team)
  const next = matches.find((match) => !results[match.id])

  return (
    <div className="mx-auto w-[min(1120px,calc(100%-48px))] py-7 max-md:w-[calc(100%-32px)] max-md:pt-5">
      <div className="mb-[18px] flex items-end justify-between gap-6 max-md:mb-2 max-md:flex-col max-md:items-start max-md:gap-4">
        <div>
          <div className="eyebrow text-brand max-md:hidden">
            {mine === team ? "My team" : "Team"}
          </div>
          <h1 className="font-display text-[clamp(40px,6vw,72px)] leading-[0.88] tracking-wide uppercase text-balance max-md:text-4xl">{teamName(team)}</h1>
          <div className="mt-3 flex gap-7 max-md:mt-3.5 max-md:gap-5">
            <Stat value={row && row.wins + row.losses > 0 ? ordinal(row.rank) : "-"} label="Rank" />
            <Stat value={row ? `${row.wins}–${row.losses}` : "0–0"} label="Games" />
            <Stat value={row ? diffLabel(row.diff) : "0"} label="Point diff" positive={!!row && row.diff > 0} negative={!!row && row.diff < 0} />
          </div>
        </div>
        <CalendarButton matches={league.schedule.matches} team={team} venues={league.schedule.venues} outlook label="Add to Outlook" />
      </div>

      {next ? (
        <section className="mb-3 overflow-hidden rounded-xl border border-border bg-panel md:hidden">
          <div className="flex items-baseline justify-between border-b border-border px-4 py-3">
            <h2 className="section-label">Next match</h2>
            <span className="kicker text-right text-brand">
              <LocationLabel venue={findVenue(league.schedule.venues, next)} fallback={`Court ${next.court}`} />
            </span>
          </div>
          <div className="bg-[var(--highlight)] px-4 py-4 shadow-[inset_3px_0_0_var(--brand)]">
            <div className="kicker text-brand">You</div>
            <div className="font-display text-[32px] leading-[0.9] tracking-wide uppercase text-balance">{teamName(team)}</div>
            <div className="kicker mt-3 text-dim">Opponent</div>
            <div className="font-display text-[32px] leading-[0.9] tracking-wide uppercase text-balance">{teamName(opponent(next, team))}</div>
          </div>
          <div className="flex items-baseline justify-between px-4 py-3.5">
            <span className="text-sm text-muted-foreground">{formatLine(next.date)} · {formatTime(next.time)}</span>
            <span className="text-xs text-dim">
              {findVenue(league.schedule.venues, next) ? "One court · " : ""}
              Warm-up {warmupLabel(next.time)}
            </span>
          </div>
          <div className="flex justify-end border-t border-border px-4 py-3">
            <KeepScoreLink matchId={next.id} />
          </div>
        </section>
      ) : null}

      {next ? (
        <section className="mb-[18px] overflow-hidden rounded-xl border border-border bg-panel max-md:hidden">
          <div className="flex items-baseline justify-between border-b border-border px-4 py-3.5">
            <h2 className="section-label">Next match</h2>
            <span className="text-xs text-dim">
              <LocationLabel venue={findVenue(league.schedule.venues, next)} fallback={`Court ${next.court}`} />
            </span>
          </div>
          <div className="grid grid-cols-[118px_1fr_auto_1fr] items-center gap-2 bg-[var(--highlight)] px-4 py-3 shadow-[inset_3px_0_0_var(--brand)]">
            <span className="text-xs tracking-wider text-brand uppercase">
              {findVenue(league.schedule.venues, next) ? "One court" : `Court ${next.court}`}
            </span>
            <span className="font-display text-[26px] uppercase">{teamName(team)}</span>
            <span className="kicker text-dim">vs</span>
            <span className="text-right font-display text-[26px] uppercase">{teamName(opponent(next, team))}</span>
          </div>
          <div className="flex items-baseline justify-between border-t border-border px-4 py-3.5">
            <h2 className="text-sm font-medium text-muted-foreground">
              {formatLine(next.date)} · {formatTime(next.time)} ·{" "}
              <LocationLabel venue={findVenue(league.schedule.venues, next)} fallback={league.schedule.gym} />
            </h2>
            <span className="flex items-center gap-3">
              <span className="text-xs text-dim">Warm up at {warmupLabel(next.time)}</span>
              <KeepScoreLink matchId={next.id} />
            </span>
          </div>
        </section>
      ) : null}

      <h2 className="eyebrow mb-2 text-muted-foreground max-md:mt-4">Season</h2>
      <div>
        {matches.map((match) => {
          const result = results[match.id]
          const sets = result ? teamSets(match, result, team) : null
          const scoreText = result
            ? result.games.map((game) => {
                const mineScore = match.home === team ? game[0] : game[1]
                const oppScore = match.home === team ? game[1] : game[0]
                return `${mineScore}–${oppScore}`
              }).join(", ")
            : null
          const outcome = sets ? seriesLabel(sets.setsFor, sets.setsAgainst) : next?.id === match.id ? "Next" : "-"
          const upcoming = !result
          return (
            <div key={match.id}>
              <div
                className={cn(
                  "hidden grid-cols-[92px_88px_80px_1fr_auto] items-center gap-3 border-t border-border py-3 md:grid",
                  upcoming && next?.id === match.id && "bg-[var(--highlight)] px-3 shadow-[inset_3px_0_0_var(--brand)]",
                  upcoming && next?.id !== match.id && "text-muted-foreground",
                )}
              >
                <span className="font-display text-lg tracking-wide uppercase">{formatShort(match.date)}</span>
                <span className="font-display text-base tracking-wide text-muted-foreground uppercase">{slotTime(match)}</span>
                <span className="font-display text-sm tracking-wide text-dim uppercase">
                  <LocationLabel venue={findVenue(league.schedule.venues, match)} fallback={`Court ${match.court}`} />
                </span>
                <span className="font-medium">vs {teamName(opponent(match, team))}</span>
                <span className="text-right font-display text-lg">
                  {outcome === "Next" ? <span className="kicker text-brand">Next</span> : outcome}
                  {scoreText ? <small className="mt-0.5 block font-sans text-xs font-normal tracking-normal text-dim">{scoreText}</small> : null}
                </span>
              </div>
              <div
                className={cn(
                  "mt-2 rounded-xl border border-border bg-panel px-4 py-3.5 md:hidden",
                  upcoming && next?.id === match.id && "bg-[var(--highlight)] shadow-[inset_3px_0_0_var(--brand)]",
                  upcoming && next?.id !== match.id && "text-muted-foreground",
                )}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-display text-xl tracking-wide uppercase">{formatShort(match.date)}</span>
                  {outcome === "Next" ? (
                    <span className="kicker text-brand">Next</span>
                  ) : (
                    <span className="font-display text-base">{outcome}</span>
                  )}
                </div>
                <div className="mt-1 font-display text-[26px] leading-none tracking-wide uppercase">vs {teamName(opponent(match, team))}</div>
                <div className="mt-1.5 text-sm text-dim">
                  {slotTime(match)} · <LocationLabel venue={findVenue(league.schedule.venues, match)} fallback={`Court ${match.court}`} />
                </div>
                {scoreText ? <div className="mt-1 text-xs text-dim">{scoreText}</div> : null}
              </div>
            </div>
          )
        })}
      </div>
      <p className="reading mt-6 max-w-3xl text-muted-foreground">
        Playoffs are May 5, May 12, and May 19. Those opponents come from the standings.
      </p>
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
      <span className="kicker text-dim">{label}</span>
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
