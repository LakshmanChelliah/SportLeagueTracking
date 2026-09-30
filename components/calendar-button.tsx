"use client"

import { buildCalendar, calendarTitle, outlookSubscribeUrl } from "@/lib/ics"
import { involves } from "@/lib/schedule"
import type { Match } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const triggerClass =
  "rounded-lg bg-brand px-3.5 py-2.5 text-[13px] font-semibold text-[var(--brand-ink)] transition-transform active:scale-95 max-md:border max-md:border-border max-md:bg-transparent max-md:text-foreground"

export function CalendarButton({
  matches,
  team,
  label,
  outlook = false,
}: {
  matches: Match[]
  team: number
  label: string
  outlook?: boolean
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

  if (!outlook) {
    return (
      <button type="button" onClick={download} className={triggerClass}>
        {label}
      </button>
    )
  }

  const nights = matches.filter((match) => involves(match, team)).length

  return (
    <Dialog>
      <DialogTrigger className={triggerClass}>{label}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{calendarTitle(team)}</DialogTitle>
          <DialogDescription>
            Adds all {nights} games to Outlook. Each night is one hour at Double Gym, with the court in the details.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <a
            href={outlookSubscribeUrl("work", team)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-brand px-3.5 py-2.5 text-center text-[13px] font-semibold text-[var(--brand-ink)]"
          >
            Outlook (work or school)
          </a>
          <a
            href={outlookSubscribeUrl("personal", team)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-border px-3.5 py-2.5 text-center text-[13px] font-semibold"
          >
            Outlook.com
          </a>
          <button
            type="button"
            onClick={download}
            className="rounded-lg border border-border px-3.5 py-2.5 text-[13px] font-semibold"
          >
            Download calendar file
          </button>
        </div>
        <p className="text-xs text-dim">
          Work and school accounts use Outlook on the web. The file opens in Outlook desktop, Apple Calendar, or Google Calendar.
        </p>
      </DialogContent>
    </Dialog>
  )
}
