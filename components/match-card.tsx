import { involves } from "@/lib/schedule"
import { teamName } from "@/lib/teams"
import type { Match } from "@/lib/types"
import { cn } from "cn"

export function MatchCard({ match, you }: { match: Match; you?: number | null }) {
  const yours = you != null && involves(match, you)
  return (
    <div
      className={cn(
        "grid grid-cols-[118px_1fr_auto_1fr] items-center gap-2 border-t border-border px-4 py-2.5",
        "max-md:flex max-md:flex-col max-md:items-start max-md:gap-1.5 max-md:px-[18px] max-md:py-4",
        yours && "bg-[#025299]/15 shadow-[inset_3px_0_0_#025299]",
      )}
    >
      <span className={cn("text-xs tracking-wider text-dim uppercase", yours && "text-brand")}>
        Court {match.court}
        {yours ? " · You" : ""}
      </span>
      <span className="font-display text-[26px] leading-none tracking-wide uppercase max-md:text-[32px]">{teamName(match.home)}</span>
      <span className="text-[11px] tracking-[0.14em] text-dim uppercase max-md:text-xs max-md:font-sans max-md:font-semibold">vs</span>
      <span className="text-right font-display text-[26px] leading-none tracking-wide uppercase max-md:text-left max-md:text-[32px]">
        {teamName(match.away)}
      </span>
    </div>
  )
}
