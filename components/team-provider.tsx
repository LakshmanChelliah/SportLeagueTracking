"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { parseTeam, TEAM_COOKIE, type TeamId } from "@/lib/teams"

type TeamContextValue = {
  team: TeamId | null
  ready: boolean
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
  const [ready, setReady] = useState(initialTeam != null)

  useEffect(() => {
    if (initialTeam != null) {
      setReady(true)
      return
    }
    const raw = document.cookie.split("; ").find((part) => part.startsWith(`${TEAM_COOKIE}=`))
    const saved = parseTeam(raw?.split("=")[1])
    if (saved) setTeamState(saved)
    setReady(true)
  }, [initialTeam])

  function setTeam(next: TeamId | null) {
    setTeamState(next)
    document.cookie = next
      ? `${TEAM_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax`
      : `${TEAM_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
  }

  return <TeamContext.Provider value={{ team, ready, setTeam }}>{children}</TeamContext.Provider>
}

export function useTeam() {
  const value = useContext(TeamContext)
  if (!value) throw new Error("useTeam must be used inside TeamProvider")
  return value
}
