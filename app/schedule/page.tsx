import { Suspense } from "react"
import type { Metadata } from "next"
import { ScheduleView } from "@/components/schedule-view"
import { getLeague } from "@/lib/league"

export const metadata: Metadata = { title: "Schedule" }

export default function SchedulePage() {
  return (
    <Suspense fallback={null}>
      <ScheduleView league={getLeague()} nowIso={new Date().toISOString()} />
    </Suspense>
  )
}
