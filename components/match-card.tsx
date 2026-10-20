import { involves } from "@/lib/schedule"
import { teamName } from "@/lib/teams"
import type { Match } from "@/lib/types"
import { cn } from "cn"

export function MatchCard({ match, you, court = true }: { match: Match; you?: number | null; court?: boolean }) {
  const yours = you != null && involves(match, you)
  const label = court ? `Court ${match.court}${yours ? " · You" : ""}` : yours ? "You" : null
  return (
    <div
      className={cn(
        "grid items-center gap-2 border-t border-border px-4 py-2.5",
        label ? "grid-cols-[118px_1fr_auto_1fr]" : "grid-cols-[1fr_auto_1fr]",
        "max-md:flex max-md:flex-col max-md:items-start max-md:gap-1.5 max-md:px-[18px] max-md:py-4",
        yours && "bg-[var(--highlight)] shadow-[inset_3px_0_0_var(--brand)]",
      )}
    >
      {label ? (
        <span className={cn("text-xs tracking-wider text-dim uppercase", yours && "text-brand")}>{label}</span>
      ) : null}
      <span className="font-display text-[26px] leading-none tracking-wide uppercase max-md:text-[32px]">{teamName(match.home)}</span>
      <span className="text-[11px] tracking-[0.14em] text-dim uppercase max-md:text-xs max-md:font-sans max-md:font-semibold">vs</span>
      <span className="text-right font-display text-[26px] leading-none tracking-wide uppercase max-md:text-left max-md:text-[32px]">
        {teamName(match.away)}
      </span>
    </div>
  )
}
