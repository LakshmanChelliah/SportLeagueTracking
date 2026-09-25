"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { formatNight, formatTime } from "@/lib/schedule"
import { teamName } from "@/lib/teams"
import { playbackDate, playbackMatches } from "@/lib/prototype"
import type { Match } from "@/lib/types"

type Frame =
  | { kind: "slate" }
  | { kind: "game"; matchIndex: number; game: number }
  | { kind: "final"; matchIndex: number }

export function NightPlayback({ matches }: { matches: Match[] }) {
  const night = useMemo(() => playbackMatches(matches), [matches])
  const frames = useMemo(() => {
    const list: Frame[] = [{ kind: "slate" }]
    night.forEach((_, matchIndex) => {
      list.push({ kind: "game", matchIndex, game: 0 })
      list.push({ kind: "game", matchIndex, game: 1 })
      list.push({ kind: "game", matchIndex, game: 2 })
      list.push({ kind: "final", matchIndex })
    })
    return list
  }, [night])
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const frame = frames[step]
  const atEnd = step >= frames.length - 1
  const spinning = playing && !atEnd

  useEffect(() => {
    if (!spinning) return
    const timer = window.setTimeout(() => setStep((value) => value + 1), 1050)
    return () => window.clearTimeout(timer)
  }, [spinning, step])

  function toggle() {
    if (atEnd) {
      setStep(0)
      setPlaying(true)
      return
    }
    setPlaying((value) => !value)
  }

  const shown = frame.kind === "slate" ? null : night[frame.matchIndex]
  const revealed = frame.kind === "slate" ? -1 : frame.kind === "final" ? 2 : frame.game
  let homeSets = 0
  let awaySets = 0
  if (shown) {
    shown.result.games.forEach((game, index) => {
      if (index > revealed) return
      if (game[0] > game[1]) homeSets += 1
      else if (game[1] > game[0]) awaySets += 1
    })
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#09090b] text-[#f4f4f5]">
      <div className="flex items-center justify-between px-5 pt-5">
        <Link href="/prototype" className="text-[11px] font-semibold tracking-[0.18em] text-[#71717a] uppercase">
          Prototypes
        </Link>
        <span className="text-[11px] font-semibold tracking-[0.18em] text-[#e8572a] uppercase">Sample night</span>
      </div>

      <div className="flex flex-1 flex-col justify-center px-5">
        {frame.kind === "slate" || !shown ? (
          <div>
            <p className="text-[11px] font-semibold tracking-[0.22em] text-[#e8572a] uppercase">Double Gym</p>
            <h1 className="mt-3 font-display text-[64px] leading-[0.84] tracking-wide uppercase">{formatNight(playbackDate)}</h1>
            <p className="mt-4 text-sm text-[#a1a1aa]">Four matches. Play them back, one game at a time.</p>
          </div>
        ) : (
          <div key={`${frame.kind}-${frame.matchIndex}-${"game" in frame ? frame.game : "final"}`}>
            <div className="flex items-baseline justify-between">
              <p className="font-display text-3xl tracking-wide">{formatTime(shown.match.time)}</p>
              <p className="text-[12px] font-semibold tracking-[0.16em] text-[#e8572a] uppercase">Court {shown.match.court}</p>
            </div>
            <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
              <div className="font-display text-[42px] leading-none tracking-wide uppercase">{teamName(shown.match.home)}</div>
              <div className="pb-1 text-[11px] tracking-[0.2em] text-[#71717a] uppercase">vs</div>
              <div className="text-right font-display text-[42px] leading-none tracking-wide uppercase">{teamName(shown.match.away)}</div>
            </div>
            <div className="mt-6 space-y-1">
              {shown.result.games.map((game, index) => {
                const on = index <= revealed
                const live = index === revealed && frame.kind === "game"
                return (
                  <div key={index} className={`grid grid-cols-[36px_1fr_1fr] items-baseline ${live ? "proto-pop" : ""} ${on ? "" : "opacity-25"}`}>
                    <span className="text-[11px] tracking-[0.14em] text-[#71717a]">G{index + 1}</span>
                    <span className="text-right font-display text-5xl tabular-nums">{on ? game[0] : "–"}</span>
                    <span className="text-right font-display text-5xl tabular-nums">{on ? game[1] : "–"}</span>
                  </div>
                )
              })}
            </div>
            <div className="mt-6 flex items-end justify-between border-t border-white/10 pt-4">
              <span className="text-[11px] font-semibold tracking-[0.18em] text-[#71717a] uppercase">
                {frame.kind === "final" ? "Final" : "In progress"}
              </span>
              <span key={revealed} className={`font-display text-5xl tracking-wide ${frame.kind === "final" ? "proto-pop text-[#e8572a]" : "proto-pop"}`}>
                {homeSets}–{awaySets}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="px-5 pb-8">
        <input
          aria-label="Scrub the night"
          type="range"
          min={0}
          max={frames.length - 1}
          value={step}
          onChange={(event) => {
            setPlaying(false)
            setStep(Number(event.target.value))
          }}
          className="w-full accent-[#e8572a]"
        />
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={toggle}
            className="rounded-lg bg-[#e8572a] px-5 py-3 text-sm font-semibold text-[#1c0c06]"
          >
            {spinning ? "Pause" : atEnd ? "Play again" : step === 0 ? "Play the night" : "Play"}
          </button>
          <span className="text-xs tracking-[0.12em] text-[#71717a] uppercase">
            {step + 1} / {frames.length}
          </span>
        </div>
      </div>
    </div>
  )
}
