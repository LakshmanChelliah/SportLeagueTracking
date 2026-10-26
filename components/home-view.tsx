"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CalendarButton } from "@/components/calendar-button"
import { KeepScoreLink } from "@/components/keep-score-link"
import { Countdown } from "@/components/countdown"
import { LocationLabel, NightPlaces } from "@/components/location-label"
import { MatchCard } from "@/components/match-card"
import { NightLine } from "@/components/night-line"
import { ScoreLine } from "@/components/score-line"
import { StandingsList } from "@/components/standings-table"
import { useTeam } from "@/components/team-provider"
import { useLiveResults } from "@/components/use-live-results"
import {
  defaultNight,
  diffLabel,
  formatNight,
  formatTime,
  gymsOf,
  lastPlayed,
  matchStart,
  nextUnplayed,
  nightHasGyms,
  nightsOf,
  opponent,
  seriesLabel,
  warmupLabel,
} from "@/lib/schedule"
import { standings, teamSets } from "@/lib/standings"
import { ordinal, teamName } from "@/lib/teams"
import type { LeagueData, Standing } from "@/lib/types"
import { findVenue } from "@/lib/venues"

function recordLine(row: Standing | undefined) {
  if (!row || row.wins + row.losses === 0) return "No games yet"
  return (
    <>
      Standing <b className="font-semibold text-foreground">{ordinal(row.rank)}</b> · {row.wins}–{row.losses} · {diffLabel(row.diff)}
    </>
  )
}

export function HomeView({ league, nowIso: serverNowIso }: { league: LeagueData; nowIso: string }) {
  const { team } = useTeam()
  const { results } = useLiveResults(league.results)
  const [nowIso, setNowIso] = useState(serverNowIso)
  useEffect(() => {
    setNowIso(new Date().toISOString())
  }, [])
  const now = new Date(nowIso)
  const matches = league.schedule.matches
  const table = standings(matches, results)
  const nights = nightsOf(matches)
  const focus = team ? nextUnplayed(matches, team, results) : null
  const nightDate = focus?.date ?? defaultNight(matches, undefined, now)
  const night = nights.find((item) => item.date === nightDate) ?? nights[0]
  const nightMatches = night.slots.flatMap((slot) => slot.matches)
  const multiGym = nightHasGyms(nightMatches) && gymsOf(nightMatches).length > 1
  const mine = team ? table.find((row) => row.team === team) : undefined
  const previousDates = nights.filter((item) => item.date < night.date).map((item) => item.date)
  const lastNightDate = [...previousDates].reverse().find((date) =>
    matches.some((match) => match.date === date && results[match.id]),
  )
  const lastNight = lastNightDate ? matches.filter((match) => match.date === lastNightDate) : []
  const last = team ? lastPlayed(matches, team, results) : null

  const others = focus ? night.slots.flatMap((slot) => slot.matches).filter((match) => match.id !== focus.id) : []

  return (
    <div className="mx-auto w-[min(1120px,calc(100%-48px))] py-7 max-md:w-[calc(100%-32px)] max-md:pt-5 max-md:pb-6">
      {team && focus ? (
        <section className="hidden flex-col md:flex">
          <div className="mb-[18px] flex items-baseline justify-between gap-3">
            <span className="text-xs font-semibold tracking-[0.16em] text-brand uppercase">Your next match</span>
            <span className="text-[13px] text-muted-foreground">{recordLine(mine)}</span>
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-7">
            <div>
              <div className="mb-1.5 text-[11px] font-semibold tracking-[0.16em] text-dim uppercase">You</div>
              <div className="font-display text-[88px] leading-[0.82] tracking-wide uppercase">{teamName(team)}</div>
            </div>
            <div className="min-w-28 text-center">
              <div className="font-display text-5xl leading-none tracking-wide">
                {formatTime(focus.time).replace(" PM", "")}
                <span className="ml-0.5 text-xl tracking-[0.08em] text-muted-foreground">PM</span>
              </div>
              <div className="mt-1.5 text-[13px] tracking-[0.08em] text-muted-foreground uppercase">
                {findVenue(league.schedule.venues, focus) ? "One court" : `Court ${focus.court}`}
              </div>
            </div>
            <div className="text-right">
              <div className="mb-1.5 text-[11px] font-semibold tracking-[0.16em] text-dim uppercase">Opponent</div>
              <div className="font-display text-[88px] leading-[0.82] tracking-wide uppercase">{teamName(opponent(focus, team))}</div>
            </div>
          </div>
          <div className="mt-[22px] flex items-end justify-between border-t border-border pt-4">
            <div>
              <div className="font-display text-[28px] leading-none tracking-wide uppercase">{formatNight(focus.date)}</div>
              <div className="mt-1.5 text-[13px] text-muted-foreground">
                <LocationLabel venue={findVenue(league.schedule.venues, focus)} fallback={league.schedule.gym} />
                {" · be there for warm-up at "}
                {warmupLabel(focus.time)}
              </div>
            </div>
            <div className="flex items-center gap-3.5">
              <span className="font-display text-[22px] tracking-[0.06em] uppercase">
                <Countdown startIso={matchStart(focus).toISOString()} nowIso={nowIso} />
              </span>
              <KeepScoreLink matchId={focus.id} />
              <CalendarButton matches={[focus]} team={team} venues={league.schedule.venues} label="Add to calendar" />
            </div>
          </div>
        </section>
      ) : null}

      {team && focus ? (
        <div className="md:hidden">
          <section className="overflow-hidden rounded-xl border border-border bg-panel">
            <div className="px-4 pt-4">
              <div className="flex items-baseline justify-between gap-3">
                <div className="text-xs font-semibold tracking-[0.16em] text-brand uppercase">Your next match</div>
                {mine && mine.wins + mine.losses > 0 ? (
                  <div className="text-right text-xs text-muted-foreground">{recordLine(mine)}</div>
                ) : null}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[11px] font-semibold tracking-[0.16em] text-brand uppercase">You</div>
                  <div className="mt-1 font-display text-4xl leading-none tracking-wide uppercase">{teamName(team)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-semibold tracking-[0.16em] text-dim uppercase">Opponent</div>
                  <div className="mt-1 font-display text-4xl leading-none tracking-wide uppercase">{teamName(opponent(focus, team))}</div>
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-border pt-3">
                <span className="font-display text-3xl leading-none tracking-wide">{formatTime(focus.time)}</span>
                <span className="text-right text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                  <Countdown startIso={matchStart(focus).toISOString()} nowIso={nowIso} />
                </span>
              </div>
              <div className="mt-2 text-[13px] leading-5 text-dim">
                {formatNight(focus.date)}
                {" · warm-up "}
                {warmupLabel(focus.time)}
                <span className="mt-0.5 block">
                  <LocationLabel venue={findVenue(league.schedule.venues, focus)} fallback={league.schedule.gym} />
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 p-3">
              <KeepScoreLink className="h-12 w-full justify-center" matchId={focus.id} />
              <CalendarButton
                className="flex h-12 w-full items-center justify-center whitespace-nowrap"
                matches={[focus]}
                team={team}
                venues={league.schedule.venues}
                label="Add to calendar"
              />
            </div>
          </section>

          {others.length ? (
            <section className="mt-3 overflow-hidden rounded-xl border border-border bg-panel">
              <div className="flex items-baseline justify-between gap-3 border-b border-border px-4 py-3">
                <h2 className="text-sm font-semibold">Rest of the night</h2>
                <span className="min-w-0 truncate text-right text-xs text-dim">
                  {multiGym ? (
                    formatNight(night.date).replace(/^[^,]+, /, "")
                  ) : (
                    <NightPlaces matches={others} venues={league.schedule.venues} gym={league.schedule.gym} />
                  )}
                </span>
              </div>
              <div className="divide-y divide-border">
                {others.map((match) => (
                  <NightLine
                    key={match.id}
                    match={match}
                    you={team}
                    venues={league.schedule.venues}
                    result={results[match.id]}
                    showPlace={multiGym}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {last ? (
            <section className="mt-3 overflow-hidden rounded-xl border border-border bg-panel px-4 py-3.5">
              <div className="text-xs font-semibold tracking-[0.14em] text-dim uppercase">Last match</div>
              <div className="mt-2 font-display text-[32px] leading-none tracking-wide uppercase">
                {seriesLabel(teamSets(last.match, last.result, team).setsFor, teamSets(last.match, last.result, team).setsAgainst)}{" "}
                <span className="text-muted-foreground">vs {teamName(opponent(last.match, team))}</span>
              </div>
              <div className="mt-2 text-[13px] text-dim">
                {formatNight(last.match.date).replace(/^[^,]+, /, "")} · {formatTime(last.match.time)} ·{" "}
                <LocationLabel venue={findVenue(league.schedule.venues, last.match)} fallback={`Court ${last.match.court}`} />
              </div>
            </section>
          ) : null}

          <section className="mt-3 overflow-hidden rounded-xl border border-border bg-panel">
            <div className="flex items-center justify-between border-b border-border px-4 py-1.5">
              <h2 className="text-sm font-semibold">Standings</h2>
              <Link href="/standings" className="inline-flex min-h-11 items-center text-xs font-medium text-brand">Full table</Link>
            </div>
            <StandingsList rows={table} you={team} />
          </section>
        </div>
      ) : null}

      {team && !focus ? (
        <section>
          <p className="text-xs font-semibold tracking-[0.16em] text-brand uppercase">Season on this board</p>
          <h1 className="mt-2 font-display text-5xl uppercase">All caught up</h1>
          <p className="mt-2 text-sm text-muted-foreground">Every listed night for {teamName(team)} has a score.</p>
          <section className="mt-4 overflow-hidden rounded-xl border border-border bg-panel md:hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-1.5">
              <h2 className="text-sm font-semibold">Standings</h2>
              <Link href="/standings" className="inline-flex min-h-11 items-center text-xs font-medium text-brand">Full table</Link>
            </div>
            <StandingsList rows={table} you={team} />
          </section>
        </section>
      ) : null}

      <section className="mt-[22px] hidden overflow-hidden rounded-xl border border-border bg-panel md:block">
        <div className="flex items-baseline justify-between border-b border-border px-4 py-3.5">
          <h2 className="text-sm font-semibold">The full night</h2>
          <span className="text-xs text-dim">
            {formatNight(night.date)}
            {multiGym ? (
              " · two gyms, one court each"
            ) : (
              <>
                {" · "}
                <NightPlaces
                  matches={nightMatches}
                  venues={league.schedule.venues}
                  gym={league.schedule.gym}
                />
                {" · one gym"}
              </>
            )}
          </span>
        </div>
        <div className={multiGym ? "grid grid-cols-2" : "grid grid-cols-1"}>
          {nightHasGyms(nightMatches)
            ? gymsOf(nightMatches).map((gym, index) => {
                const sample = gym.matches[0]
                const venue = findVenue(league.schedule.venues, sample)
                return (
                  <div key={gym.key} className={index === 1 ? "border-l border-border" : undefined}>
                    <div className="flex items-baseline justify-between gap-3 px-4 pt-3 pb-2 text-xs tracking-[0.08em] text-muted-foreground uppercase">
                      <b className="font-display text-xl font-semibold tracking-wide text-foreground normal-case">
                        <LocationLabel venue={venue} fallback={venue?.name ?? `Gym ${sample.court}`} />
                      </b>
                      <span className="shrink-0">One court</span>
                    </div>
                    {gym.matches.map((match) => (
                      <MatchCard key={match.id} match={match} you={team} venues={league.schedule.venues} lead="time" />
                    ))}
                  </div>
                )
              })
            : night.slots.map((slot, index) => (
                <div key={slot.time} className={index === 1 ? "border-l border-border" : undefined}>
                  <div className="flex justify-between px-4 pt-3 pb-2 text-xs tracking-[0.08em] text-muted-foreground uppercase">
                    <b className="font-display text-xl font-semibold tracking-wide text-foreground">{formatTime(slot.time)}</b>
                    <span>Warm-up {warmupLabel(slot.time)}</span>
                  </div>
                  {slot.matches.map((match) => (
                    <MatchCard key={match.id} match={match} you={team} venues={league.schedule.venues} />
                  ))}
                </div>
              ))}
        </div>
      </section>

      <div className={lastNight.length ? "mt-4 hidden gap-4 md:grid md:grid-cols-[1.35fr_0.85fr]" : "mt-4 hidden md:block"}>
        {lastNight.length ? (
          <section className="overflow-hidden rounded-xl border border-border bg-panel">
            <div className="flex items-baseline justify-between border-b border-border px-4 py-3.5">
              <h2 className="text-sm font-semibold">Last night</h2>
              <span className="text-xs text-dim">{formatNight(lastNightDate!)} · Final</span>
            </div>
            {lastNight.map((match) => {
              const result = results[match.id]
              return result ? (
                <ScoreLine
                  key={match.id}
                  match={match}
                  result={result}
                  you={team}
                  meta={
                    <>
                      {formatTime(match.time)} ·{" "}
                      <LocationLabel venue={findVenue(league.schedule.venues, match)} fallback={`Court ${match.court}`} />
                    </>
                  }
                />
              ) : (
                <MatchCard key={match.id} match={match} you={team} venues={league.schedule.venues} />
              )
            })}
          </section>
        ) : null}
        <section className="overflow-hidden rounded-xl border border-border bg-panel">
          <div className="flex items-baseline justify-between border-b border-border px-4 py-3.5">
            <h2 className="text-sm font-semibold">Standings</h2>
            <span className="text-xs text-dim">{Object.keys(results).length ? "Live" : "No games yet"}</span>
          </div>
          <StandingsList rows={table} you={team} />
        </section>
      </div>
    </div>
  )
}
