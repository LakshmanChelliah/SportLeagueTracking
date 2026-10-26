import { Suspense } from "react"
import type { Metadata } from "next"
import { Scoreboard } from "@/components/scoreboard"
import { getLeague } from "@/lib/league"

export const metadata: Metadata = { title: "Score" }

export default function ScorePage() {
  return (
    <Suspense fallback={null}>
      <Scoreboard league={getLeague()} />
    </Suspense>
  )
}
