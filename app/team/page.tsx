import { redirect } from "next/navigation"
import { TeamGate } from "@/components/team-gate"
import { readTeamCookie } from "@/lib/read-team"

export const dynamic = "force-dynamic"

export default async function TeamIndexPage() {
  const team = await readTeamCookie()
  if (team) redirect(`/team/${team}`)
  return <TeamGate />
}
