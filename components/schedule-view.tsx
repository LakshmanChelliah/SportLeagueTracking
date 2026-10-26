"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CalendarButton } from "@/components/calendar-button"
import { LocationLabel, NightPlaces } from "@/components/location-label"
import { MatchCard } from "@/components/match-card"
import { NightLine } from "@/components/night-line"
import { ScoreLine } from "@/components/score-line"
import { TeamChoices } from "@/components/team-picker"
import { useTeam } from "@/components/team-provider"
import { useLiveResults } from "@/components/use-live-results"
import { WeekStrip } from "@/components/week-strip"
import { byStart, defaultNight, formatNight, formatTime, gymsOf, nightHasGyms, nightsOf, torontoDate, warmupLabel } from "@/lib/schedule"
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
  const ordered = [...nightMatches].sort(byStart)

  return (
    <div className="mx-auto w-[min(1120px,calc(100%-48px))] py-7 max-md:w-[calc(100%-32px)] max-md:pt-5">
      <div className="mb-[18px] hidden items-end justify-between gap-4 md:flex">
        <div>
          <h1 className="mb-1 font-display text-[42px] leading-none tracking-wide uppercase">Schedule</h1>
          <p className="reading text-muted-foreground">
            Regina Street PS · one gym · games one after another. Your match is marked.
          </p>
        </div>
        {team ? <CalendarButton matches={matches} team={team} venues={league.schedule.venues} outlook label="Add to Outlook" /> : null}
      </div>
      <div className="mb-4 flex items-center justify-between gap-3 md:hidden">
        <h1 className="font-display text-[28px] leading-none tracking-wide uppercase">Schedule</h1>
        {team ? (
          <CalendarButton
            className="flex h-12 shrink-0 items-center justify-center px-3"
            matches={matches}
            team={team}
            venues={league.schedule.venues}
            outlook
            label="Add to Outlook"
          />
        ) : null}
      </div>
      {!team ? (
        <div className="mb-6 max-w-md md:hidden">
          <p className="mb-3 text-sm text-muted-foreground">Pick your team to see when you play.</p>
          <TeamChoices onPick={setTeam} />
        </div>
      ) : null}
      <div className={!team ? "max-md:hidden" : undefined}>
        <div className={dates.length < 2 ? "max-md:hidden" : undefined}>
          <WeekStrip dates={dates} selected={selected} nextDate={nextDate} results={results} />
        </div>
        <section className="overflow-hidden rounded-xl border border-border bg-panel md:hidden">
          <div className="flex items-baseline justify-between gap-3 border-b border-border px-4 py-3">
            <h2 className="font-display text-2xl leading-none tracking-wide uppercase">{formatNight(night.date)}</h2>
            <span className="shrink-0 text-xs text-dim">
              {playedCount ? `${playedCount} of ${ordered.length} final` : `${ordered.length} ${ordered.length === 1 ? "match" : "matches"}`}
            </span>
          </div>
          <div className="border-b border-border px-4 py-2.5 text-xs text-dim">
            <NightPlaces matches={ordered} venues={league.schedule.venues} gym={league.schedule.gym} />
            {multiGym ? " · two gyms" : " · one court"}
          </div>
          <div className="divide-y divide-border">
            {ordered.map((match) => (
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
        <div className="mb-3.5 hidden items-baseline justify-between md:flex">
          <h2 className="font-display text-[28px] tracking-wide uppercase">{formatNight(night.date)}</h2>
          <span className="text-[13px] text-dim">{playedCount ? `${playedCount} final` : `${ordered.length} matches`}</span>
        </div>
        <div className={multiGym ? "hidden gap-4 md:grid md:grid-cols-2" : "hidden gap-4 md:grid md:grid-cols-1"}>
          {groupedByGym
            ? gyms.map((gym) => {
                const sample = gym.matches[0]
                const venue = findVenue(league.schedule.venues, sample)
                return (
                  <section key={gym.key} className="overflow-hidden rounded-xl border border-border bg-panel">
                    <div className="flex items-baseline justify-between gap-3 border-b border-border px-4 py-3.5">
                      <h3 className="section-label">
                        <LocationLabel venue={venue} fallback={venue?.name ?? `Gym ${sample.court}`} />
                      </h3>
                      <span className="shrink-0 text-xs text-dim">One court</span>
                    </div>
                    {gym.matches.map((match) => {
                      const result = results[match.id]
                      return result ? (
                        <ScoreLine key={match.id} match={match} result={result} you={team} meta={formatTime(match.time)} />
                      ) : (
                        <MatchCard key={match.id} match={match} you={team} venues={league.schedule.venues} lead="time" />
                      )
                    })}
                  </section>
                )
              })
            : night.slots.map((slot) => (
                <section key={slot.time} className="overflow-hidden rounded-xl border border-border bg-panel">
                  <div className="flex items-baseline justify-between border-b border-border px-4 py-3.5">
                    <h3 className="section-label">{formatTime(slot.time)}</h3>
                    <span className="text-xs text-dim">Warm-up {warmupLabel(slot.time)}</span>
                  </div>
                  {slot.matches.map((match) => {
                    const result = results[match.id]
                    return result ? (
                      <ScoreLine
                        key={match.id}
                        match={match}
                        result={result}
                        you={team}
                        meta={<LocationLabel venue={findVenue(league.schedule.venues, match)} fallback={`Court ${match.court}`} />}
                      />
                    ) : (
                      <MatchCard key={match.id} match={match} you={team} venues={league.schedule.venues} />
                    )
                  })}
                </section>
              ))}
        </div>
      </div>
    </div>
  )
}
