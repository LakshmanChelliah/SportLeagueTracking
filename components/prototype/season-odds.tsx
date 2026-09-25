"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { sampleResults, simulateSeason } from "@/lib/prototype"
import { standings } from "@/lib/standings"
import { TEAMS, teamName, type TeamId } from "@/lib/teams"
import type { Match } from "@/lib/types"

export function SeasonOdds({ matches }: { matches: Match[] }) {
  const odds = useMemo(() => simulateSeason(matches), [matches])
  const table = useMemo(() => standings(matches, sampleResults), [matches])
  const [team, setTeam] = useState<TeamId>(3)
  const [shown, setShown] = useState(0)
  const [running, setRunning] = useState(false)
  const [runId, setRunId] = useState(0)
  const done = shown >= odds.illustrated.length && runId > 0
  const spinning = running && !done

  useEffect(() => {
    if (!spinning) return
    const timer = window.setTimeout(() => setShown((value) => value + 1), 260)
    return () => window.clearTimeout(timer)
  }, [spinning, shown])

  const mine = odds.titles[team]
  const percent = Math.round((mine / odds.runs) * 100)
  const inTen = odds.illustrated.filter((winner) => winner === team).length
  const latest = shown > 0 ? odds.illustrated[shown - 1] : null
  const leader = table[0]

  function start() {
    setShown(0)
    setRunId((value) => value + 1)
    setRunning(true)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#09090b] text-[#f4f4f5]">
      <div className="flex items-center justify-between px-5 pt-5">
        <Link href="/prototype" className="text-[11px] font-semibold tracking-[0.18em] text-[#71717a] uppercase">
          Prototypes
        </Link>
        <span className="text-[11px] font-semibold tracking-[0.18em] text-[#e8572a] uppercase">Sample season</span>
      </div>

      <div className="flex flex-1 flex-col px-5 pt-8 pb-8">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-[#a1a1aa] uppercase">
          After Oct 21 · {teamName(leader.team)} leads
        </p>
        <h1 className="mt-3 font-display text-5xl leading-none tracking-wide uppercase">{teamName(team)}</h1>

        <div className="mt-6 flex gap-1.5">
          {TEAMS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTeam(id)}
              className={`flex h-10 flex-1 items-center justify-center rounded-lg border font-display text-lg ${id === team ? "border-[#e8572a] bg-[#e8572a] text-[#1c0c06]" : "border-white/10 text-[#a1a1aa]"}`}
            >
              {id}
            </button>
          ))}
        </div>

        {done ? (
          <div key={runId} className="mt-10">
            <div className="proto-pop font-display text-[108px] leading-none tracking-wide text-[#e8572a]">{percent}%</div>
            <p className="mt-2 text-lg text-[#f4f4f5]">finish first if the rest of the season breaks this way.</p>
            <p className="mt-3 text-sm text-[#a1a1aa]">
              {teamName(team)} took {inTen} of the 10 seasons you just watched, and {mine.toLocaleString()} of {odds.runs.toLocaleString()}.
            </p>
          </div>
        ) : spinning && latest ? (
          <div key={shown} className="mt-10">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-[#71717a] uppercase">Season {shown} of 10</p>
            <p className="proto-pop mt-3 font-display text-[72px] leading-none tracking-wide uppercase">{teamName(latest)}</p>
            <p className="mt-3 text-sm text-[#a1a1aa]">finishes first.</p>
          </div>
        ) : (
          <p className="mt-10 max-w-sm text-sm leading-relaxed text-[#a1a1aa]">
            Three sample nights are already in. Run the games that are left, ten times on screen, then a thousand more behind them.
          </p>
        )}

        <div className="mt-8 flex gap-1.5">
          {odds.illustrated.map((winner, index) => (
            <span
              key={index}
              className={`h-2 flex-1 rounded-full ${index < shown ? (winner === team ? "bg-[#e8572a]" : "bg-white/25") : "bg-white/10"}`}
            />
          ))}
        </div>

        {done ? (
          <ol className="mt-8 space-y-2">
            {TEAMS.map((id) => {
              const share = Math.round((odds.titles[id] / odds.runs) * 100)
              return (
                <li key={id} className="grid grid-cols-[72px_1fr_36px] items-center gap-3 text-sm">
                  <span className={id === team ? "font-semibold" : "text-[#a1a1aa]"}>{teamName(id)}</span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <span className="block h-full rounded-full bg-[#e8572a]" style={{ width: `${share}%`, opacity: id === team ? 1 : 0.45 }} />
                  </span>
                  <span className="text-right font-display text-lg tabular-nums">{share}</span>
                </li>
              )
            })}
          </ol>
        ) : null}

        <button
          type="button"
          onClick={start}
          disabled={spinning}
          className="mt-auto rounded-lg bg-[#e8572a] px-5 py-3 text-sm font-semibold text-[#1c0c06] disabled:opacity-60"
        >
          {spinning ? "Running" : done ? "Run it again" : "Run the rest of the season"}
        </button>
      </div>
    </div>
  )
}
