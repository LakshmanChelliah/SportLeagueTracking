"use client"

import { createContext, useContext, useState } from "react"
import { TEAM_COOKIE, type TeamId } from "@/lib/teams"

type TeamContextValue = {
  team: TeamId | null
  setTeam: (team: TeamId | null) => void
}

const TeamContext = createContext<TeamContextValue | null>(null)

export function TeamProvider({
  initialTeam,
  children,
}: {
  initialTeam: TeamId | null
  children: React.ReactNode
}) {
  const [team, setTeamState] = useState<TeamId | null>(initialTeam)

  function setTeam(next: TeamId | null) {
    setTeamState(next)
    document.cookie = next
      ? `${TEAM_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax`
      : `${TEAM_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
  }

  return <TeamContext.Provider value={{ team, setTeam }}>{children}</TeamContext.Provider>
}

export function useTeam() {
  const value = useContext(TeamContext)
  if (!value) throw new Error("useTeam must be used inside TeamProvider")
  return value
}
