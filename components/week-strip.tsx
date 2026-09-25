import Link from "next/link"
import { formatChip } from "@/lib/schedule"
import type { ResultsFile } from "@/lib/types"
import { cn } from "cn"

export function WeekStrip({
  dates,
  selected,
  nextDate,
  results,
}: {
  dates: string[]
  selected: string
  nextDate: string | null
  results: ResultsFile
}) {
  return (
    <div className="relative mb-[18px] flex min-w-0 gap-1.5 overflow-x-auto overscroll-x-contain md:grid md:grid-cols-9 md:gap-0 md:overflow-hidden md:rounded-xl md:border md:border-border">
      {dates.map((date) => {
        const played = Object.keys(results).some((id) => id.startsWith(date))
        const state = date === nextDate ? "Next" : played ? "Final" : "—"
        const active = date === selected
        return (
          <Link
            key={date}
            href={`/schedule?night=${date}`}
            className={cn(
              "min-w-[76px] shrink-0 rounded-[10px] border border-border px-2 py-2.5 text-center",
              "md:min-w-0 md:rounded-none md:border-0 md:border-r md:border-border md:px-1.5 md:py-3 md:last:border-r-0",
              active && "border-brand bg-[#141416] md:shadow-[inset_0_-2px_0_#e8572a]",
            )}
          >
            <span className={cn("block font-display text-lg tracking-wide uppercase md:text-xl", !played && date !== nextDate && date !== selected && "text-muted-foreground")}>
              {formatChip(date)}
            </span>
            <span className={cn("mt-0.5 block text-[10px] tracking-[0.12em] uppercase", date === nextDate ? "text-brand" : "text-dim", state === "—" && "max-md:hidden")}>
              {state}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
