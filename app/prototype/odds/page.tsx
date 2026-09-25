import type { Metadata } from "next"
import { SeasonOdds } from "@/components/prototype/season-odds"
import { getLeague } from "@/lib/league"

export const metadata: Metadata = { title: "Season odds" }

export default function OddsPage() {
  const { schedule } = getLeague()
  return <SeasonOdds matches={schedule.matches} />
}
