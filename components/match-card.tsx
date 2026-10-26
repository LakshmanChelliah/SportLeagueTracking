import { LocationLabel } from "@/components/location-label"
import { assignedTeams, involves, slotTime } from "@/lib/schedule"
import { teamName } from "@/lib/teams"
import type { Match, Venue } from "@/lib/types"
import { findVenue } from "@/lib/venues"
import { cn } from "cn"

export function MatchCard({
  match,
  you,
  venues,
  lead = "place",
}: {
  match: Match
  you?: number | null
  venues?: Venue[]
  lead?: "place" | "time"
}) {
  const yours = you != null && involves(match, you)
  return (
    <div
      className={cn(
        "grid grid-cols-[118px_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 border-t border-border px-4 py-2.5",
        "max-md:flex max-md:flex-col max-md:items-start max-md:gap-1.5 max-md:px-[18px] max-md:py-4",
        yours && "bg-[var(--highlight)] shadow-[inset_3px_0_0_var(--brand)]",
      )}
    >
      <span className={cn("kicker text-dim", yours && "text-brand")}>
        {lead === "time" ? slotTime(match) : <LocationLabel venue={findVenue(venues, match)} fallback={`Court ${match.court}`} />}
        {yours ? " · You" : ""}
      </span>
      {assignedTeams(match) ? (
        <>
          <span className="min-w-0 font-display text-[22px] leading-[0.9] tracking-wide uppercase text-balance max-md:text-[28px]">{teamName(match.home)}</span>
          <span className="kicker text-dim max-md:text-xs">vs</span>
          <span className="min-w-0 text-right font-display text-[22px] leading-[0.9] tracking-wide uppercase text-balance max-md:text-left max-md:text-[28px]">
            {teamName(match.away)}
          </span>
        </>
      ) : (
        <span className="col-span-3 min-w-0">
          <span className="block font-display text-[22px] leading-[0.9] tracking-wide uppercase max-md:text-[28px]">{match.label}</span>
          {match.note ? <span className="mt-1 block text-xs tracking-normal text-dim normal-case">{match.note}</span> : null}
        </span>
      )}
    </div>
  )
}
