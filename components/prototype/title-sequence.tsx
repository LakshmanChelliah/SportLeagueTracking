"use client"

import { useState } from "react"
import Link from "next/link"
import { formatNight, formatTime, nextUnplayed, opponent } from "@/lib/schedule"
import { TEAMS, teamName, type TeamId } from "@/lib/teams"
import type { Match } from "@/lib/types"

export function TitleSequence({ matches }: { matches: Match[] }) {
  const [team, setTeam] = useState<TeamId | null>(null)
  const [run, setRun] = useState(0)

  function choose(id: TeamId) {
    setTeam(id)
    setRun((value) => value + 1)
  }

  const focus = team ? nextUnplayed(matches, team, {}) : null
  const foe = focus && team ? opponent(focus, team) : null

  return (
    <div className="flex min-h-dvh flex-col bg-[#09090b] text-[#f4f4f5]">
      <div className="flex items-center justify-between px-5 pt-5">
        <Link href="/prototype" className="text-[11px] font-semibold tracking-[0.18em] text-[#71717a] uppercase">
          Prototypes
        </Link>
        {team ? (
          <button type="button" onClick={() => choose(team)} className="text-[11px] font-semibold tracking-[0.18em] text-[#e8572a] uppercase">
            Replay
          </button>
        ) : (
          <span className="text-[11px] font-semibold tracking-[0.18em] text-[#e8572a] uppercase">Open</span>
        )}
      </div>

      {team && focus && foe != null ? (
        <div key={run} className="flex flex-1 flex-col justify-center px-5 pb-16">
          <div className="proto-wipe h-[3px] w-28 bg-[#e8572a]" />
          <p className="proto-rise proto-d1 mt-8 text-[13px] font-semibold tracking-[0.28em] text-[#e8572a] uppercase">GD RA Volleyball</p>
          <div className="proto-rise proto-d4 mt-8 font-display text-[clamp(76px,18vw,168px)] leading-[0.78] tracking-wide uppercase">
            {teamName(team)}
          </div>
          <div className="proto-rise proto-d5 mt-4 text-[12px] font-semibold tracking-[0.32em] text-[#71717a] uppercase">versus</div>
          <div className="proto-rise proto-d6 mt-4 font-display text-[clamp(76px,18vw,168px)] leading-[0.78] tracking-wide uppercase">
            {teamName(foe)}
          </div>
          <p className="proto-rise proto-d7 mt-10 text-sm tracking-[0.12em] text-[#a1a1aa] uppercase">
            {formatNight(focus.date)} · {formatTime(focus.time)} · Court {focus.court}
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col justify-end px-5 pb-10">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-[#e8572a] uppercase">Title sequence</p>
          <h1 className="mt-3 max-w-xs font-display text-[68px] leading-[0.84] tracking-wide uppercase">Pick your team</h1>
          <p className="mt-3 max-w-xs text-sm text-[#a1a1aa]">The board opens on your next match.</p>
          <div className="mt-8 grid grid-cols-4 gap-2">
            {TEAMS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => choose(id)}
                className="flex h-[72px] items-center justify-center rounded-xl border border-white/10 bg-[#111113] font-display text-4xl tracking-wide"
              >
                {id}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
