import type { Metadata } from "next"
import { ScheduleView } from "@/components/schedule-view"
import { getLeague } from "@/lib/league"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Schedule" }

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ night?: string }>
}) {
  const { night } = await searchParams
  return <ScheduleView league={getLeague()} nowIso={new Date().toISOString()} requested={night} />
}
