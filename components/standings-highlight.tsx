"use client"

import { StandingsTable } from "@/components/standings-table"
import { useTeam } from "@/components/team-provider"
import type { Standing } from "@/lib/types"

export function StandingsHighlight({ rows }: { rows: Standing[] }) {
  const { team } = useTeam()
  return <StandingsTable rows={rows} you={team} />
}
