import { LocationLabel } from "@/components/location-label"
import { formatTime, involves } from "@/lib/schedule"
import { teamName } from "@/lib/teams"
import type { Match, Venue } from "@/lib/types"
import { findVenue } from "@/lib/venues"
import { cn } from "cn"

export function NightLine({ match, you, venues }: { match: Match; you?: number | null; venues?: Venue[] }) {
  const yours = you != null && involves(match, you)
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-t border-border px-4 py-3 first:border-t-0",
        yours && "bg-[var(--highlight)] shadow-[inset_3px_0_0_var(--brand)]",
      )}
    >
      <div className="min-w-0">
        <div className="text-sm font-medium">
          {teamName(match.home)}
          <span className="mx-1.5 font-normal text-dim">vs</span>
          {teamName(match.away)}
        </div>
        <div className="mt-0.5 text-xs text-dim">
          {formatTime(match.time)} · <LocationLabel venue={findVenue(venues, match)} fallback={`Court ${match.court}`} />
          {yours ? " · You" : ""}
        </div>
      </div>
    </div>
  )
}
