"use client"

import { buildCalendar } from "@/lib/ics"
import type { Match } from "@/lib/types"

export function CalendarButton({
  matches,
  team,
  label,
}: {
  matches: Match[]
  team: number
  label: string
}) {
  function download() {
    const ics = buildCalendar(matches, team)
    const blob = new Blob([ics], { type: "text/calendar" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `gd-ra-team-${team}.ics`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      type="button"
      onClick={download}
      className="rounded-lg bg-brand px-3.5 py-2.5 text-[13px] font-semibold text-[var(--brand-ink)] transition-transform active:scale-95 max-md:border max-md:border-border max-md:bg-transparent max-md:text-foreground"
    >
      {label}
    </button>
  )
}
