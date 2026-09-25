"use client"

import { MatchCard } from "@/components/match-card"
import { ScoreLine } from "@/components/score-line"
import { TeamChoices } from "@/components/team-picker"
import { useTeam } from "@/components/team-provider"
import { WeekStrip } from "@/components/week-strip"
import { defaultNight, formatNight, formatTime, involves, nightsOf, torontoDate, warmupLabel } from "@/lib/schedule"
import type { LeagueData } from "@/lib/types"

export function ScheduleView({
  league,
  nowIso,
  requested,
}: {
  league: LeagueData
  nowIso: string
  requested?: string
}) {
  const { team, setTeam } = useTeam()
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
    <div className="mx-auto w-[min(1120px,calc(100%-48px))] py-7 max-md:w-[calc(100%-48px)]">
      <h1 className="mb-1 font-display text-[42px] leading-none tracking-wide uppercase max-md:text-[28px]">Schedule</h1>
      <p className="mb-[18px] text-sm text-muted-foreground max-md:hidden">
        Double Gym · two courts · through December 2. Your matches are marked.
      </p>
      <p className="mb-5 hidden text-sm text-dim max-md:block">Your matches, through Dec 2.</p>
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
          <span className="text-[13px] text-dim max-md:hidden">{playedCount ? `${playedCount} final` : "4 matches"}</span>
        </div>
        <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
          {night.slots.map((slot) => {
            const hideSlotOnMobile = team != null && !slot.matches.some((match) => involves(match, team))
            return (
              <section key={slot.time} className={hideSlotOnMobile ? "hidden overflow-hidden rounded-xl border border-border bg-panel md:block" : "overflow-hidden rounded-xl border border-border bg-panel"}>
                <div className="flex items-baseline justify-between border-b border-border px-4 py-3.5">
                  <h3 className="text-sm font-semibold">{formatTime(slot.time)}</h3>
                  <span className="text-xs text-dim max-md:hidden">Warm-up {warmupLabel(slot.time)}</span>
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
                        <MatchCard match={match} you={team} />
                      )}
                    </div>
                  )
                })}
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
