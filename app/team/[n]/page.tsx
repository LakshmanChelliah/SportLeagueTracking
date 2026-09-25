import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { TeamView } from "@/components/team-view"
import { getLeague } from "@/lib/league"
import { parseTeam, teamName } from "@/lib/teams"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }): Promise<Metadata> {
  const { n } = await params
  const team = parseTeam(n)
  return { title: team ? teamName(team) : "Team" }
}

export default async function TeamPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params
  const team = parseTeam(n)
  if (!team) notFound()
  return <TeamView league={getLeague()} team={team} />
}
