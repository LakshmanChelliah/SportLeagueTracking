"use client"

import { useRouter } from "next/navigation"
import { TeamChoices } from "@/components/team-picker"
import { useTeam } from "@/components/team-provider"
import type { TeamId } from "@/lib/teams"

export function TeamGate() {
  const { setTeam } = useTeam()
  const router = useRouter()

  function pick(team: TeamId) {
    setTeam(team)
    router.push(`/team/${team}`)
  }

  return (
    <div className="mx-auto w-[min(1120px,calc(100%-48px))] max-w-md py-7">
      <p className="text-xs font-semibold tracking-[0.16em] text-brand uppercase">Your team</p>
      <h1 className="mt-3 mb-5 font-display text-4xl tracking-wide uppercase">Which team are you on?</h1>
      <TeamChoices onPick={pick} />
    </div>
  )
}
