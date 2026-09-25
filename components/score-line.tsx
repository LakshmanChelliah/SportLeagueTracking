import { formatTime, involves, setCounts } from "@/lib/schedule"
import { teamName } from "@/lib/teams"
import type { Match, Result } from "@/lib/types"
import { cn } from "cn"

export function ScoreLine({
  match,
  result,
  you,
  meta,
}: {
  match: Match
  result: Result
  you?: number | null
  meta?: string
}) {
  const yours = you != null && involves(match, you)
  const [homeSets, awaySets] = setCounts(result)
  const rows = [
    { team: match.home, scores: result.games.map((game) => game[0]), sets: homeSets },
    { team: match.away, scores: result.games.map((game) => game[1]), sets: awaySets },
  ]

  return (
    <article className={cn("border-t border-border py-3 first:border-t-0", yours && "bg-[#025299]/15 shadow-[inset_3px_0_0_#025299] max-md:bg-transparent max-md:shadow-none")}>
      {meta ? (
        <div className="flex items-center gap-2.5 px-4 pb-1.5 text-[11px] tracking-[0.1em] text-dim uppercase">
          <span>{meta}{yours ? " · You" : ""}{result.forfeit ? " · Forfeit" : ""}</span>
          <span className="ml-auto text-muted-foreground">Final</span>
        </div>
      ) : null}
      <div className="grid grid-cols-[1fr_36px_36px_36px_32px] px-4 pb-1 text-center text-[11px] tracking-[0.08em] text-dim uppercase max-md:hidden">
        <span />
        <span>G1</span>
        <span>G2</span>
        <span>G3</span>
        <span />
      </div>
      {rows.map((row) => {
        const winner = row.sets > (row.team === match.home ? awaySets : homeSets)
        return (
          <div key={row.team} className="grid grid-cols-[1fr_36px_36px_36px_32px] items-center px-4 py-0.5 md:grid-cols-[1fr_36px_36px_36px_32px]">
            <span className={cn("font-display text-[22px] tracking-wide uppercase", winner ? "text-foreground" : "text-muted-foreground")}>
              {teamName(row.team)}
            </span>
            {row.scores.map((score, index) => {
              const other = row.team === match.home ? result.games[index][1] : result.games[index][0]
              return (
                <span key={index} className={cn("text-center font-display text-xl", score > other ? "text-foreground" : "text-zinc-600")}>
                  {score}
                </span>
              )
            })}
            <span className={cn("text-center font-display text-[22px]", winner ? "text-foreground" : "text-zinc-600")}>{row.sets}</span>
          </div>
        )
      })}
      <p className="sr-only">{formatTime(match.time)}</p>
    </article>
  )
}
