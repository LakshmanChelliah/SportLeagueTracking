import Link from "next/link"
import { formatChip } from "@/lib/schedule"
import type { ResultsFile } from "@/lib/types"
import { cn } from "cn"

export function WeekStrip({
  dates,
  selected,
  nextDate,
  results,
  cancelledDates,
}: {
  dates: string[]
  selected: string
  nextDate: string | null
  results: ResultsFile
  cancelledDates: string[]
}) {
  return (
    <div className="relative mb-[18px] flex min-w-0 gap-1.5 overflow-x-auto overscroll-x-contain md:grid md:grid-cols-7 md:gap-0 md:overflow-hidden md:rounded-xl md:border md:border-border">
      {dates.map((date) => {
        const cancelled = cancelledDates.includes(date)
        const played = !cancelled && Object.keys(results).some((id) => id.startsWith(date))
        const state = cancelled ? "Cancelled" : date === nextDate ? "Next" : played ? "Final" : "-"
        const active = date === selected
        return (
          <Link
            key={date}
            href={`/schedule?night=${date}`}
            className={cn(
              "flex min-h-12 min-w-[76px] shrink-0 flex-col items-center justify-center rounded-[10px] border border-border px-2 py-2.5 text-center",
              "md:min-w-0 md:rounded-none md:border-0 md:border-r md:border-border md:px-1.5 md:py-3 md:last:border-r-0",
              cancelled && "min-w-[104px]",
              active && "border-brand bg-[var(--chip)] md:shadow-[inset_0_-2px_0_var(--brand)]",
            )}
          >
            <span className={cn("block font-display text-lg tracking-wide uppercase md:text-xl", cancelled && "text-muted-foreground line-through decoration-1", !played && !cancelled && date !== nextDate && date !== selected && "text-muted-foreground")}>
              {formatChip(date)}
            </span>
            <span className={cn("kicker mt-0.5 block whitespace-nowrap", cancelled ? "text-neg" : date === nextDate ? "text-brand" : "text-dim", state === "-" && "max-md:hidden")}>
              {state}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
