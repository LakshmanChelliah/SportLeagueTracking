import Link from "next/link"
import { formatNight } from "@/lib/schedule"

export function CancelledNotes({ dates }: { dates: string[] }) {
  if (dates.length === 0) return null
  return (
    <div className="mb-4 grid gap-2">
      {dates.map((date) => (
        <Link
          key={date}
          href={`/schedule?night=${date}`}
          className="block rounded-xl border border-border bg-panel px-4 py-3"
        >
          <span className="kicker text-neg">Cancelled</span>
          <span className="mt-1 block font-display text-[28px] leading-none tracking-wide uppercase">{formatNight(date)}</span>
          <span className="mt-1.5 block text-sm text-muted-foreground">No games that night.</span>
        </Link>
      ))}
    </div>
  )
}
