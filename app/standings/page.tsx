import type { Metadata } from "next"
import { StandingsView } from "@/components/standings-view"
import { getLeague } from "@/lib/league"

export const metadata: Metadata = { title: "Standings" }

export default function StandingsPage() {
  return <StandingsView league={getLeague()} />
}
