"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CalendarButton } from "@/components/calendar-button"
import { LocationLabel } from "@/components/location-label"
import { MatchCard } from "@/components/match-card"
import { NightLine } from "@/components/night-line"
import { ScoreLine } from "@/components/score-line"
import { TeamChoices } from "@/components/team-picker"
import { useTeam } from "@/components/team-provider"
import { useLiveResults } from "@/components/use-live-results"
import { WeekStrip } from "@/components/week-strip"
import { defaultNight, formatNight, formatTime, gymsOf, involves, nightHasGyms, nightsOf, opponent, torontoDate, warmupLabel } from "@/lib/schedule"
import { teamName } from "@/lib/teams"
import type { LeagueData } from "@/lib/types"
import { findVenue } from "@/lib/venues"

export function ScheduleView({ league, nowIso: serverNowIso }: { league: LeagueData; nowIso: string }) {
  const { team, setTeam } = useTeam()
  const { results } = useLiveResults(league.results)
  const requested = useSearchParams().get("night") ?? undefined
  const [nowIso, setNowIso] = useState(serverNowIso)
  useEffect(() => {
    setNowIso(new Date().toISOString())
  }, [])
  const now = new Date(nowIso)
  const matches = league.schedule.matches
  const nights = nightsOf(matches)
  const dates = nights.map((night) => night.date)
  const selected = defaultNight(matches, requested, now)
  const night = nights.find((item) => item.date === selected) ?? nights[0]
  const today = torontoDate(now)
  const nextDate = dates.find((date) => date >= today) ?? null
  const nightMatches = night.slots.flatMap((slot) => slot.matches)
  const playedCount = nightMatches.filter((match) => results[match.id]).length
  const gyms = gymsOf(nightMatches)
  const groupedByGym = nightHasGyms(nightMatches)
  const multiGym = groupedByGym && gyms.length > 1
  const yourGym = team == null ? undefined : nightMatches.find((match) => involves(match, team))?.venue
  const restMatches = nightMatches.filter((match) => {
    if (team == null || involves(match, team)) return false
    if (groupedByGym && yourGym && match.venue === yourGym) return false
    return true
  })

  return (
    <div className="mx-auto w-[min(1120px,calc(100%-48px))] py-7 max-md:w-[calc(100%-32px)] max-md:pt-5">
      <div className="mb-[18px] flex items-end justify-between gap-4 max-md:mb-4 max-md:flex-col max-md:items-start">
        <div>
          <h1 className="mb-1 font-display text-[42px] leading-none tracking-wide uppercase max-md:text-[28px]">Schedule</h1>
          <p className="text-sm text-muted-foreground max-md:hidden">
            One gym · games one after another. Your match is marked.
          </p>
          <p className="text-sm text-dim md:hidden">One gym. Your match is marked.</p>
        </div>
        {team ? <CalendarButton matches={matches} team={team} venues={league.schedule.venues} outlook label="Add to Outlook" /> : null}
      </div>
      {!team ? (
        <div className="mb-6 max-w-md md:hidden">
          <p className="mb-3 text-sm text-muted-foreground">Pick your team to see when you play.</p>
          <TeamChoices onPick={setTeam} />
        </div>
      ) : null}
      <div className={!team ? "max-md:hidden" : undefined}>
        <WeekStrip dates={dates} selected={selected} nextDate={nextDate} results={results} />
        <div className="mb-3.5 flex items-baseline justify-between">
          <h2 className="font-display text-[28px] tracking-wide uppercase max-md:text-2xl">{formatNight(night.date)}</h2>
          <span className="text-[13px] text-dim">{playedCount ? `${playedCount} final` : `${nightMatches.length} ${nightMatches.length === 1 ? "match" : "matches"}`}</span>
        </div>
        <div className={multiGym ? "grid grid-cols-2 gap-4 max-md:grid-cols-1" : "grid grid-cols-1 gap-4"}>
          {groupedByGym
            ? gyms.map((gym) => {
                const sample = gym.matches[0]
                const venue = findVenue(league.schedule.venues, sample)
                const hideGymOnMobile = team != null && !gym.matches.some((match) => involves(match, team))
                return (
                  <section key={gym.key} className={hideGymOnMobile ? "hidden overflow-hidden rounded-xl border border-border bg-panel md:block" : "overflow-hidden rounded-xl border border-border bg-panel"}>
                    <div className="flex items-baseline justify-between gap-3 border-b border-border px-4 py-3.5">
                      <h3 className="text-sm font-semibold">
                        {multiGym ? (
                          <LocationLabel venue={venue} fallback={venue?.name ?? `Gym ${sample.court}`} />
                        ) : (
                          "One court"
                        )}
                      </h3>
                      <span className="shrink-0 text-xs text-dim">{multiGym ? "One court" : "Games one after another"}</span>
                    </div>
                    {gym.matches.map((match) => {
                      const result = results[match.id]
                      const yours = team != null && involves(match, team)
                      return (
                        <div key={match.id}>
                          {result ? (
                            <ScoreLine match={match} result={result} you={team} meta={formatTime(match.time)} />
                          ) : (
                            <>
                              <div className={yours ? "max-md:hidden" : undefined}>
                                <MatchCard match={match} you={team} venues={league.schedule.venues} lead="time" />
                              </div>
                              {yours && team ? (
                                <div className="bg-[var(--highlight)] px-4 py-4 shadow-[inset_3px_0_0_var(--brand)] md:hidden">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <div className="text-[11px] font-semibold tracking-[0.16em] text-brand uppercase">You</div>
                                      <div className="font-display text-[30px] leading-[0.9] tracking-wide uppercase text-balance">{teamName(team)}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-[11px] font-semibold tracking-[0.16em] text-dim uppercase">Opponent</div>
                                      <div className="font-display text-[30px] leading-[0.9] tracking-wide uppercase text-balance">{teamName(opponent(match, team))}</div>
                                    </div>
                                  </div>
                                  <div className="mt-2 text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                                    {formatTime(match.time)} · warm-up {warmupLabel(match.time)}
                                  </div>
                                </div>
                              ) : null}
                            </>
                          )}
                        </div>
                      )
                    })}
                  </section>
                )
              })
            : night.slots.map((slot) => {
                const hideSlotOnMobile = team != null && !slot.matches.some((match) => involves(match, team))
                return (
                  <section key={slot.time} className={hideSlotOnMobile ? "hidden overflow-hidden rounded-xl border border-border bg-panel md:block" : "overflow-hidden rounded-xl border border-border bg-panel"}>
                    <div className="flex items-baseline justify-between border-b border-border px-4 py-3.5">
                      <h3 className="text-sm font-semibold">{formatTime(slot.time)}</h3>
                      <span className="text-xs text-dim">Warm-up {warmupLabel(slot.time)}</span>
                    </div>
                    {slot.matches.map((match) => {
                      const result = results[match.id]
                      const yours = team != null && involves(match, team)
                      const hide = team != null && !yours
                      return (
                        <div key={match.id} className={hide ? "hidden md:block" : undefined}>
                          {result ? (
                            <ScoreLine
                              match={match}
                              result={result}
                              you={team}
                              meta={formatTime(match.time)}
                            />
                          ) : (
                            <>
                              <div className="max-md:hidden">
                                <MatchCard match={match} you={team} venues={league.schedule.venues} />
                              </div>
                              {yours && team ? (
                                <div className="bg-[var(--highlight)] px-4 py-4 shadow-[inset_3px_0_0_var(--brand)] md:hidden">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <div className="text-[11px] font-semibold tracking-[0.16em] text-brand uppercase">You</div>
                                      <div className="font-display text-[30px] leading-[0.9] tracking-wide uppercase text-balance">{teamName(team)}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-[11px] font-semibold tracking-[0.16em] text-dim uppercase">Opponent</div>
                                      <div className="font-display text-[30px] leading-[0.9] tracking-wide uppercase text-balance">{teamName(opponent(match, team))}</div>
                                    </div>
                                  </div>
                                  <div className="mt-2 text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                                    Warm-up {warmupLabel(match.time)}
                                  </div>
                                </div>
                              ) : null}
                            </>
                          )}
                        </div>
                      )
                    })}
                  </section>
                )
              })}
        </div>
        {team && restMatches.length ? (
          <section className="mt-3 overflow-hidden rounded-xl border border-border bg-panel md:hidden">
            <div className="flex items-baseline justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold">Rest of the night</h3>
              <span className="text-xs text-dim">{formatNight(night.date).replace(/^[^,]+, /, "")}</span>
            </div>
            {restMatches.map((match) => (
              <NightLine key={match.id} match={match} />
            ))}
          </section>
        ) : null}
      </div>
    </div>
  )
}
