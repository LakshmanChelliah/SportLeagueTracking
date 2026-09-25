"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { MatchCard } from "@/components/match-card"
import { NightLine } from "@/components/night-line"
import { ScoreLine } from "@/components/score-line"
import { TeamChoices } from "@/components/team-picker"
import { useTeam } from "@/components/team-provider"
import { WeekStrip } from "@/components/week-strip"
import { defaultNight, formatNight, formatTime, involves, nightsOf, opponent, torontoDate, warmupLabel } from "@/lib/schedule"
import { teamName } from "@/lib/teams"
import type { LeagueData } from "@/lib/types"

export function ScheduleView({ league, nowIso: serverNowIso }: { league: LeagueData; nowIso: string }) {
  const { team, setTeam } = useTeam()
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
  const playedCount = night.slots.flatMap((slot) => slot.matches).filter((match) => league.results[match.id]).length

  return (
    <div className="mx-auto w-[min(1120px,calc(100%-48px))] py-7 max-md:w-[calc(100%-32px)] max-md:pt-5">
      <h1 className="mb-1 font-display text-[42px] leading-none tracking-wide uppercase max-md:text-[28px]">Schedule</h1>
      <p className="mb-[18px] text-sm text-muted-foreground max-md:hidden">
        Double Gym · two courts · through December 2. Your matches are marked.
      </p>
      <p className="mb-4 text-sm text-dim md:hidden">Double Gym · two courts · your match is marked.</p>
      {!team ? (
        <div className="mb-6 max-w-md md:hidden">
          <p className="mb-3 text-sm text-muted-foreground">Pick your team to see when you play.</p>
          <TeamChoices onPick={setTeam} />
        </div>
      ) : null}
      <div className={!team ? "max-md:hidden" : undefined}>
        <WeekStrip dates={dates} selected={selected} nextDate={nextDate} results={league.results} />
        <div className="mb-3.5 flex items-baseline justify-between">
          <h2 className="font-display text-[28px] tracking-wide uppercase max-md:text-2xl">{formatNight(night.date)}</h2>
          <span className="text-[13px] text-dim">{playedCount ? `${playedCount} final` : "4 matches"}</span>
        </div>
        <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
          {night.slots.map((slot) => {
            const hideSlotOnMobile = team != null && !slot.matches.some((match) => involves(match, team))
            return (
              <section key={slot.time} className={hideSlotOnMobile ? "hidden overflow-hidden rounded-xl border border-border bg-panel md:block" : "overflow-hidden rounded-xl border border-border bg-panel"}>
                <div className="flex items-baseline justify-between border-b border-border px-4 py-3.5">
                  <h3 className="text-sm font-semibold">{formatTime(slot.time)}</h3>
                  <span className="text-xs text-dim">Warm-up {warmupLabel(slot.time)}</span>
                </div>
                {slot.matches.map((match) => {
                  const result = league.results[match.id]
                  const yours = team != null && involves(match, team)
                  const hide = team != null && !yours
                  return (
                    <div key={match.id} className={hide ? "hidden md:block" : undefined}>
                      {result ? (
                        <ScoreLine match={match} result={result} you={team} meta={`Court ${match.court}`} />
                      ) : (
                        <>
                          <div className="max-md:hidden">
                            <MatchCard match={match} you={team} />
                          </div>
                          {yours && team ? (
                            <div className="bg-[var(--highlight)] px-4 py-4 shadow-[inset_3px_0_0_var(--brand)] md:hidden">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <div className="text-[11px] font-semibold tracking-[0.16em] text-brand uppercase">You</div>
                                  <div className="font-display text-[40px] leading-none tracking-wide uppercase">{teamName(team)}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-[11px] font-semibold tracking-[0.16em] text-dim uppercase">Opponent</div>
                                  <div className="font-display text-[40px] leading-none tracking-wide uppercase">{teamName(opponent(match, team))}</div>
                                </div>
                              </div>
                              <div className="mt-2 text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">Court {match.court}</div>
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
        {team ? (
          <section className="mt-3 overflow-hidden rounded-xl border border-border bg-panel md:hidden">
            <div className="flex items-baseline justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold">Rest of the night</h3>
              <span className="text-xs text-dim">{league.schedule.gym}</span>
            </div>
            {night.slots.flatMap((slot) => slot.matches).filter((match) => !involves(match, team)).map((match) => (
              <NightLine key={match.id} match={match} />
            ))}
          </section>
        ) : null}
      </div>
    </div>
  )
}
