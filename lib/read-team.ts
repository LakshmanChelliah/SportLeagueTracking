import { cookies } from "next/headers"
import { parseTeam, TEAM_COOKIE } from "@/lib/teams"

export async function readTeamCookie() {
  const jar = await cookies()
  return parseTeam(jar.get(TEAM_COOKIE)?.value)
}
