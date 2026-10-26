import { LocationLabel } from "@/components/location-label"
import { assignedTeams, involves, setCounts, slotTime } from "@/lib/schedule"
import { teamName } from "@/lib/teams"
import type { Match, Result, Venue } from "@/lib/types"
import { findVenue } from "@/lib/venues"
import { cn } from "cn"

export function NightLine({
  match,
  you,
  venues,
  result,
  showPlace = true,
}: {
  match: Match
  you?: number | null
  venues?: Venue[]
  result?: Result
  showPlace?: boolean
}) {
  const yours = you != null && involves(match, you)
  const sets = result && assignedTeams(match) ? setCounts(result) : null
  const title = assignedTeams(match)
    ? `${yours && match.home === you ? "You" : teamName(match.home)} vs ${yours && match.away === you ? "You" : teamName(match.away)}`
    : match.label ?? "To be set"
  return (
    <div
      className={cn(
        "flex min-h-14 items-center gap-3 px-4 py-3",
        yours && "bg-[var(--highlight)] shadow-[inset_3px_0_0_var(--brand)]",
      )}
    >
      <div className="w-[5.75rem] shrink-0 font-display text-base leading-none tracking-wide">{slotTime(match)}</div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-medium">{title}</div>
        {match.note ? <div className="mt-0.5 truncate text-xs text-dim">{match.note}</div> : null}
        {showPlace ? (
          <div className="mt-0.5 truncate text-xs text-dim">
            <LocationLabel venue={findVenue(venues, match)} fallback={`Court ${match.court}`} />
          </div>
        ) : null}
      </div>
      {sets ? (
        <div className="shrink-0 text-right">
          <div className="font-display text-xl leading-none tabular-nums">{sets[0]}–{sets[1]}</div>
          <div className="mt-1 text-[10px] tracking-[0.12em] text-dim uppercase">Final</div>
        </div>
      ) : null}
    </div>
  )
}
