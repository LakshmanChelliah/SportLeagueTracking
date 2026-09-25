import { redirect } from "next/navigation"
import { TeamGate } from "@/components/team-gate"
import { readTeamCookie } from "@/lib/read-team"

export default async function TeamIndexPage() {
  if (process.env.STATIC_EXPORT !== "1") {
    const team = await readTeamCookie()
    if (team) redirect(`/team/${team}`)
  }
  return <TeamGate />
}
